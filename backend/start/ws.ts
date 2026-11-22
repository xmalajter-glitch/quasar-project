import { Secret } from '@adonisjs/core/helpers'
import Ws from '#services/ws'
import User from '#models/user'
import ChannelUser from '#models/channel_user'

// Naštartujeme Socket.io server
Ws.boot()

const STATUSES = ['online', 'dnd', 'offline']

// userId -> aktuálny stav ('online' | 'dnd' | 'offline')
const presence = new Map<number, string>()
// userId -> počet otvorených spojení (viac tabov/okien)
const connections = new Map<number, number>()

// Overenie pouzivatela pri pripojeni: klient posiela rovnaky access token ako pre API
// (io(url, { auth: { token } })). Bez platneho tokenu sa spojenie odmietne.
Ws.io?.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (typeof token !== 'string' || !token) return next(new Error('unauthorized'))

    const accessToken = await User.accessTokens.verify(new Secret(token))
    if (!accessToken) return next(new Error('unauthorized'))

    socket.data.userId = Number(accessToken.tokenableId)
    next()
  } catch {
    next(new Error('unauthorized'))
  }
})

// Počúvame na nové pripojenia od klientov
Ws.io?.on('connection', (socket) => {
  const userId: number = socket.data.userId
  console.log(`New WebSocket connection ${socket.id} (user ${userId})`)

  // Osobna miestnost pouzivatela - pre udalosti urcene iba jemu (napr. pozvanka)
  socket.join(`user_${userId}`)
  connections.set(userId, (connections.get(userId) ?? 0) + 1)

  // Klient po pripojení povie, v akom je stave (identitu uz pozname z tokenu)
  socket.on('identify', (payload) => {
    const status = STATUSES.includes(payload?.status) ? payload.status : 'online'
    presence.set(userId, status)

    // ostatným oznám zmenu
    Ws.io?.emit('presence:update', { userId, status })
    // novému klientovi pošli stav všetkých
    socket.emit('presence:all', Object.fromEntries(presence))
  })

  // Zmena stavu (online / dnd / offline)
  socket.on('setStatus', (status) => {
    if (!STATUSES.includes(status)) return
    presence.set(userId, status)
    Ws.io?.emit('presence:update', { userId, status })
  })

  // Do miestnosti kanala sa moze pripojit iba jeho aktivny clen
  socket.on('joinChannel', async (channelId) => {
    const id = Number(channelId)
    if (!Number.isInteger(id)) return

    const membership = await ChannelUser.query()
      .where('channelId', id)
      .where('userId', userId)
      .where('status', 'active')
      .first()

    if (!membership) return
    socket.join(`channel_${id}`)
  })

  // Keď z kanála odíde
  socket.on('leaveChannel', (channelId) => {
    socket.leave(`channel_${channelId}`)
  })

  socket.on('disconnect', () => {
    const left = (connections.get(userId) ?? 1) - 1
    if (left <= 0) {
      // posledné spojenie zatvorené -> offline
      connections.delete(userId)
      presence.set(userId, 'offline')
      Ws.io?.emit('presence:update', { userId, status: 'offline' })
    } else {
      connections.set(userId, left)
    }
  })
})
