import Ws from '#services/ws'

// Naštartujeme Socket.io server
Ws.boot()

// userId -> aktuálny stav ('online' | 'dnd' | 'offline')
const presence = new Map<number, string>()
// userId -> počet otvorených spojení (viac tabov/okien)
const connections = new Map<number, number>()

// Počúvame na nové pripojenia od klientov
Ws.io?.on('connection', (socket) => {
  console.log('Nové WebSocket pripojenie:', socket.id)

  // Klient po pripojení povie, kto je a v akom je stave
  socket.on('identify', ({ userId, status }) => {
    if (!userId) return
    // Osobna miestnost pouzivatela - pre udalosti urcene iba jemu (napr. pozvanka).
    // Ak sa na tom istom sockete prihlasi iny pouzivatel, staru miestnost opustime.
    if (socket.data.userId && socket.data.userId !== userId) {
      socket.leave(`user_${socket.data.userId}`)
    }
    socket.data.userId = userId
    socket.join(`user_${userId}`)
    connections.set(userId, (connections.get(userId) ?? 0) + 1)
    presence.set(userId, status || 'online')

    // ostatným oznám zmenu
    Ws.io?.emit('presence:update', { userId, status: status || 'online' })
    // novému klientovi pošli stav všetkých
    socket.emit('presence:all', Object.fromEntries(presence))
    console.log(`Používateľ ${userId} je ${status}`)
  })

  // Zmena stavu (online / dnd / offline)
  socket.on('setStatus', (status) => {
    const userId = socket.data.userId
    if (!userId) return
    presence.set(userId, status)
    Ws.io?.emit('presence:update', { userId, status })
  })

  // Keď používateľ otvorí kanál v Quasare, pridáme ho do vyhradenej "miestnosti"
  socket.on('joinChannel', (channelId) => {
    socket.join(`channel_${channelId}`)
    console.log(`Socket ${socket.id} sa pripojil do kanála ${channelId}`)
  })

  // Keď z kanála odíde
  socket.on('leaveChannel', (channelId) => {
    socket.leave(`channel_${channelId}`)
    console.log(`Socket ${socket.id} opustil kanál ${channelId}`)
  })

  socket.on('disconnect', () => {
    console.log('WebSocket odpojený:', socket.id)

    const userId = socket.data.userId
    if (!userId) return

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