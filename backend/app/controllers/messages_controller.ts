import type { HttpContext } from '@adonisjs/core/http'
import Message from '#models/message'
import ChannelUser from '#models/channel_user'
import Ws from '#services/ws'

export default class MessagesController {
  
  // Ziskanie vsetkych sprav pre dany kanal
  async index({ params, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const channelId = params.channel_id

    // Overnie ci je pouzivatel clenom kanala a ci ma aktivny status
    const isMember = await ChannelUser.query()
      .where('channelId', channelId)
      .where('userId', currentUser.id)
      .where('status', 'active')
      .first()

    if (!isMember) {
      return response.forbidden({ message: 'Nemáte prístup k správam tohto kanála.' })
    }

    // Nacitanie sprav od najstarsich po najnovsie
    const messages = await Message.query()
      .where('channelId', channelId)
      .preload('user', (userQuery) => {
        userQuery.select('id', 'nickname')
      })
      .orderBy('createdAt', 'asc')

    return response.ok(messages)
  }

  // Ulozenie novej spravy do databazy
  async store({ request, params, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const channelId = params.channel_id
    const { content } = request.only(['content'])

    // Overenie, ci je pouzivatel clenom kanala a ci ma aktivny status
    const isMember = await ChannelUser.query()
      .where('channelId', channelId)
      .where('userId', currentUser.id)
      .where('status', 'active')
      .first()

    if (!isMember) {
      return response.forbidden({ message: 'Nemôžete posielať správy do tohto kanála.' })
    }

    // Kontrola, ci sprava obsahuje mention
    const isMention = content.includes('@')

    // Ulozenie do databazy
    const message = await Message.create({
      userId: currentUser.id,
      channelId: channelId,
      content: content,
      isMention: isMention
    })

    await message.load('user', (userQuery) => {
      userQuery.select('id', 'nickname')
    })

    // Rozposlanie spravy vsetkym uzivatelom, ktory su akualne v kanali
    Ws.io?.to(`channel_${channelId}`).emit('new:message', message)

    return response.created(message)
  }
}