import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelUser from '#models/channel_user'
import User from '#models/user'
import Ws from '#services/ws'

export default class ChannelsController {
  
  // Ziskanie zoznamu kanalov, kde je dany uzivatel clenom
  async index({ auth, response }: HttpContext) {
    const user = auth.use('api').user!
    
    // Nacitanie kanalov, kde nema uzivatel status banned alebo left
    await user.load('channels', (query) => {
      query.wherePivot('status', 'active')
    })

    return response.ok(user.channels)
  }

  // Spracovanie prikazu join
  async join({ request, auth, response }: HttpContext) {
    const user = auth.use('api').user!
    const { channelName, isPrivate = false } = request.only(['channelName', 'isPrivate'])

    // Najdenie kanala, ci existuje
    let channel = await Channel.findBy('channelName', channelName)

    if (!channel) {
      // Ak kanal neexistuje, tak sa automaticky vytvori
      channel = await Channel.create({
        channelName,
        isPrivate,
        adminId: user.id,
      })

      // Pridanie zakladatela kanala ako clena
      await channel.related('members').attach({
        [user.id]: { status: 'active' }
      })

      return response.created({ message: `Kanál ${channelName} bol vytvorený a pripojili ste sa.`, channel })
    }

    // Ak kanal existuje, overime ci je sukromny
    if (channel.isPrivate) {
      return response.forbidden({ message: 'Toto je súkromný kanál. Musíte byť pozvaný správcom.' })
    }

    // Overnie ci uzivatel, nema na dany kanal status bannned
    const existingMembership = await ChannelUser.query()
      .where('userId', user.id)
      .where('channelId', channel.id)
      .first()

    if (existingMembership) {
      if (existingMembership.status === 'banned') {
        return response.forbidden({ message: 'Máte trvalý ban pre tento kanál.' })
      }
      if (existingMembership.status === 'active') {
        return response.badRequest({ message: 'Už ste členom tohto kanála.' })
      }
      
      // Ak v kanali bol a opustil ho zmenime status z left na active
      existingMembership.status = 'active'
      await existingMembership.save()
      this.notifyMembersChanged(channel.id)
      return response.ok({ message: `Znovu ste sa pripojili do kanála ${channelName}.`, channel })
    }

    // Ak v nom este nebol, pridame ho
    await channel.related('members').attach({
      [user.id]: { status: 'active' }
    })
    this.notifyMembersChanged(channel.id)

    return response.ok({ message: `Úspešne ste sa pripojili do kanála ${channelName}.`, channel })
  }

  // Spracovanie prikazu invite
  async invite({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const { channelName, nickname } = request.only(['channelName', 'nickname'])

    // Ziskanie kanala a uzivatela
    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

    const targetUser = await User.findBy('nickname', nickname)
    if (!targetUser) return response.notFound({ message: 'Používateľ s týmto nickom neexistuje.' })

    // Zistime, ci je dany uzivatel adminom
    const isCurrentUserAdmin = channel.adminId === currentUser.id

    // Skontrolovanie, ci je kanal sukromny
    if (channel.isPrivate && !isCurrentUserAdmin) {
      return response.forbidden({ message: 'Do súkromného kanála môže pozývať iba správca.' })
    }

    // Ak ide o verejny kanal, overime ci je dany uzivatel clenom kanala
    if (!isCurrentUserAdmin) {
      const isMember = await ChannelUser.query()
        .where('channelId', channel.id)
        .where('userId', currentUser.id)
        .where('status', 'active')
        .first()

      if (!isMember) return response.forbidden({ message: 'Nemáte oprávnenie pozývať do tohto kanála.' })
    }

    // Skontrolujeme, ci uzivatel sa uz v kanali nenachadza
    let targetMembership = await ChannelUser.query()
      .where('channelId', channel.id)
      .where('userId', targetUser.id)
      .first()

    if (targetMembership) {
      if (targetMembership.status === 'active') {
        return response.badRequest({ message: 'Používateľ už je členom kanála.' })
      }
      if (targetMembership.status === 'banned') {
        // Spravca moze zrusit ban
        if (isCurrentUserAdmin) {
          targetMembership.status = 'active'
          targetMembership.kickCount = 0
          await targetMembership.save()
          this.notifyInvited(channel, targetUser.id, currentUser.nickname)
          return response.ok({ message: `Používateľovi ${nickname} bol zrušený ban a obnovený prístup.` })
        }
        return response.forbidden({ message: 'Tento používateľ má trvalý ban. Iba správca mu môže obnoviť prístup.' })
      }
      
      // Ak predtym opustil kanal, tak ho znovu aktivujeme
      targetMembership.status = 'active'
      await targetMembership.save()
      this.notifyInvited(channel, targetUser.id, currentUser.nickname)
      return response.ok({ message: `Používateľ ${nickname} bol úspešne pozvaný späť do kanála.` })
    }

    // Ak v kanali este nebol, vytvorime nove clenstvo
    await ChannelUser.create({
      channelId: channel.id,
      userId: targetUser.id,
      status: 'active'
    })

    this.notifyInvited(channel, targetUser.id, currentUser.nickname)
    return response.ok({ message: `Používateľ ${nickname} bol pozvaný do kanála ${channelName}.` })
  }

  // Oznamenie vsetkym v kanali, ze sa zmenil zoznam clenov (join, invite, kick, cancel)
  private notifyMembersChanged(channelId: number) {
    Ws.io?.to(`channel_${channelId}`).emit('channel:membersChanged', { channelId })
  }

  // Oznamenie pozvanemu pouzivatelovi, aby sa mu kanal hned zobrazil v zozname
  private notifyInvited(channel: Channel, targetUserId: number, invitedBy: string) {
    this.notifyMembersChanged(channel.id)
    Ws.io?.to(`user_${targetUserId}`).emit('channel:invited', {
      channel: {
        id: channel.id,
        channelName: channel.channelName,
        isPrivate: channel.isPrivate,
        adminId: channel.adminId,
      },
      invitedBy,
    })
  }

  // Spracovanie prikazu revoke - spravca odoberie clena zo sukromneho kanala (bez banu)
  async revoke({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const { channelName, nickname } = request.only(['channelName', 'nickname'])

    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

    if (!channel.isPrivate) {
      return response.badRequest({ message: 'Príkaz /revoke je určený pre súkromné kanály. Vo verejnom kanáli použite /kick.' })
    }
    if (channel.adminId !== currentUser.id) {
      return response.forbidden({ message: 'Odoberať používateľov zo súkromného kanála môže iba správca.' })
    }

    const targetUser = await User.findBy('nickname', nickname)
    if (!targetUser) return response.notFound({ message: 'Používateľ s týmto nickom neexistuje.' })
    if (targetUser.id === currentUser.id) {
      return response.badRequest({ message: 'Nemôžete odobrať seba samého. Na zrušenie kanála použite /quit.' })
    }

    const targetMembership = await ChannelUser.query()
      .where('channelId', channel.id)
      .where('userId', targetUser.id)
      .first()

    if (!targetMembership || targetMembership.status !== 'active') {
      return response.badRequest({ message: 'Tento používateľ nie je aktívnym členom kanála.' })
    }

    // Nie je to ban - spravca ho moze kedykolvek znovu pozvat cez /invite
    targetMembership.status = 'left'
    await targetMembership.save()

    const userRoom = `user_${targetUser.id}`
    Ws.io?.to(userRoom).emit('channel:revoked', {
      channelId: channel.id,
      channelName: channel.channelName,
      revokedBy: currentUser.nickname,
    })
    Ws.io?.in(userRoom).socketsLeave(`channel_${channel.id}`)
    this.notifyMembersChanged(channel.id)

    return response.ok({ message: `Používateľ ${nickname} bol odobratý z kanála ${channelName}.` })
  }

  // Spracovanie prikazu kick
  async kick({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const { channelName, nickname } = request.only(['channelName', 'nickname'])

    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

    const targetUser = await User.findBy('nickname', nickname)
    if (!targetUser) return response.notFound({ message: 'Používateľ s týmto nickom neexistuje.' })

    // Nemozeme vyhodit same seba ani spravcu kanala
    if (targetUser.id === currentUser.id) return response.badRequest({ message: 'Nemôžete vyhodiť seba samého.' })
    if (targetUser.id === channel.adminId) return response.forbidden({ message: 'Nemôžete vyhodiť správcu kanála.' })

    const isCurrentUserAdmin = channel.adminId === currentUser.id
    
    // Kontrola opravneni na vyhodnie
    if (!isCurrentUserAdmin) {
      const currentMember = await ChannelUser.query()
        .where('channelId', channel.id)
        .where('userId', currentUser.id)
        .where('status', 'active')
        .first()

      if (!currentMember) return response.forbidden({ message: 'Nie ste členom tohto kanála.' })
      if (channel.isPrivate) return response.forbidden({ message: 'Iba správca môže vyhadzovať zo súkromného kanála.' })
    }

    // Zistenie stavu uzivatela, ktoreho chceme vyhodit
    const targetMembership = await ChannelUser.query()
      .where('channelId', channel.id)
      .where('userId', targetUser.id)
      .first()

    if (!targetMembership || targetMembership.status !== 'active') {
      return response.badRequest({ message: 'Tento používateľ nie je aktívnym členom kanála.' })
    }

    // Ak vyhadzuje spravca, tak ma okamzity ban
    if (isCurrentUserAdmin) {
      targetMembership.status = 'banned'
      await targetMembership.save()
      this.notifyBanned(channel, targetUser.id, currentUser.nickname)
      return response.ok({ message: `Správca natrvalo vyhodil používateľa ${nickname} z kanála.` })
    }

    // Ak vyhadzuje bezny clen, spustime hlasovanie
    targetMembership.kickCount += 1
    
    if (targetMembership.kickCount >= 3) {
      targetMembership.status = 'banned'
      await targetMembership.save()
      this.notifyBanned(channel, targetUser.id, null)
      return response.ok({ message: `Používateľ ${nickname} dostal 3 hlasy a má trvalý ban.` })
    }

    await targetMembership.save()
    return response.ok({ message: `Hlasovali ste za vyhodenie. Používateľ ${nickname} má momentálne ${targetMembership.kickCount}/3 hlasov.` })
  }

  // Oznamenie vyhodenemu pouzivatelovi, aby mu kanal hned zmizol zo zoznamu
  // bannedBy = nick spravcu, alebo null ak ban vznikol hlasovanim clenov
  private notifyBanned(channel: Channel, targetUserId: number, bannedBy: string | null) {
    const userRoom = `user_${targetUserId}`

    Ws.io?.to(userRoom).emit('channel:banned', {
      channelId: channel.id,
      channelName: channel.channelName,
      bannedBy,
    })
    // Sockety vyhodeneho pouzivatela uz nesmu dostavat spravy z kanala
    Ws.io?.in(userRoom).socketsLeave(`channel_${channel.id}`)
    this.notifyMembersChanged(channel.id)
  }

  // Spracovanie prikazu quit
  async quit({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const { channelName } = request.only(['channelName'])

    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

    // Zrusit kanal moze iba spravca
    if (channel.adminId !== currentUser.id) {
      return response.forbidden({ message: 'Kanál môže zrušiť iba jeho správca.' })
    }

    await this.deleteChannel(channel, currentUser.id)

    return response.ok({ message: `Kanál ${channelName} bol úspešne zrušený a vymazaný.` })
  }

  // Vymazanie kanala, vsetky spravy a clenstva sa vymazu automaticky vdaka ON DELETE CASCADE
  private async deleteChannel(channel: Channel, deletedBy: number) {
    await channel.delete()

    // Oznamenie ostatnym clenom, aby si kanal odstranili zo zoznamu
    Ws.io?.to(`channel_${channel.id}`).emit('channel:deleted', {
      channelId: channel.id,
      channelName: channel.channelName,
      deletedBy,
    })
  }

  // Spracovanie prikazu cancel
  async cancel({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const { channelName } = request.only(['channelName'])

    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

    // Ak kanal opusti spravca, kanal zanika
    if (channel.adminId === currentUser.id) {
      await this.deleteChannel(channel, currentUser.id)
      return response.ok({
        message: `Opustili ste kanál ${channelName}. Keďže ste boli správca, kanál zanikol.`,
        channelDeleted: true,
      })
    }

    // Najdenie clenstva uzivatela v kanali
    const membership = await ChannelUser.query()
      .where('channelId', channel.id)
      .where('userId', currentUser.id)
      .first()

    if (!membership || membership.status !== 'active') {
      return response.badRequest({ message: 'Nie ste aktívnym členom tohto kanála.' })
    }

    // Zmenenie stavu uzivatela na lef
    membership.status = 'left'
    await membership.save()
    this.notifyMembersChanged(channel.id)

    return response.ok({ message: `Úspešne ste opustili kanál ${channelName}.` })
  }

  // Ziskanie zoznamu vsetkych clenov v danom kanali
  async channelUsers({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const channelName = request.param('name')

    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje' })

    // Zoznam clenov si moze pozriet iba aktivny clen kanala
    const isMember = await ChannelUser.query()
      .where('channelId', channel.id)
      .where('userId', currentUser.id)
      .where('status', 'active')
      .first()

    if (!isMember) {
      return response.forbidden({ message: 'Zoznam členov môže vidieť iba člen kanála.' })
    }

    // Nacitanie vsetkych clenov kanala, ktory maju status active
    await channel.load('members', (query) => {
      query.wherePivot('status', 'active')
    })

    const users = channel.members.map(user => ({
      id: user.id,
      nickname: user.nickname,
      status: user.$extras.pivot_status // takto Adonis pristupuje k pivot dátam
    }))

    return response.ok(users)
  }
}