import type { HttpContext } from '@adonisjs/core/http'
import Channel from '#models/channel'
import ChannelUser from '#models/channel_user'
import User from '#models/user'

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
      return response.ok({ message: `Znovu ste sa pripojili do kanála ${channelName}.`, channel })
    }

    // Ak v nom este nebol, pridame ho
    await channel.related('members').attach({
      [user.id]: { status: 'active' }
    })

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
          return response.ok({ message: `Používateľovi ${nickname} bol zrušený ban a obnovený prístup.` })
        }
        return response.forbidden({ message: 'Tento používateľ má trvalý ban. Iba správca mu môže obnoviť prístup.' })
      }
      
      // Ak predtym opustil kanal, tak ho znovu aktivujeme
      targetMembership.status = 'active'
      await targetMembership.save()
      return response.ok({ message: `Používateľ ${nickname} bol úspešne pozvaný späť do kanála.` })
    }

    // Ak v kanali este nebol, vytvorime nove clenstvo
    await ChannelUser.create({
      channelId: channel.id,
      userId: targetUser.id,
      status: 'active'
    })

    return response.ok({ message: `Používateľ ${nickname} bol pozvaný do kanála ${channelName}.` })
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
      return response.ok({ message: `Správca natrvalo vyhodil používateľa ${nickname} z kanála.` })
    }

    // Ak vyhadzuje bezny clen, spustime hlasovanie
    targetMembership.kickCount += 1
    
    if (targetMembership.kickCount >= 3) {
      targetMembership.status = 'banned'
      await targetMembership.save()
      return response.ok({ message: `Používateľ ${nickname} dostal 3 hlasy a má trvalý ban.` })
    }

    await targetMembership.save()
    return response.ok({ message: `Hlasovali ste za vyhodenie. Používateľ ${nickname} má momentálne ${targetMembership.kickCount}/3 hlasov.` })
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

    // Vymazanie kanala, vsetkych sprav a clenstiev sa vymaze automaticky vdaka ON DELETE CASCADE
    await channel.delete()

    return response.ok({ message: `Kanál ${channelName} bol úspešne zrušený a vymazaný.` })
  }

  // Spracovanie prikazu cancel
  async cancel({ request, auth, response }: HttpContext) {
    const currentUser = auth.use('api').user!
    const { channelName } = request.only(['channelName'])

    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje.' })

    // Spravca musi kanal zrusit, ak chce odist
    if (channel.adminId === currentUser.id) {
      return response.badRequest({ message: 'Ste správca kanála. Ak ho chcete opustiť, použite príkaz /quit na jeho zrušenie.' })
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

    return response.ok({ message: `Úspešne ste opustili kanál ${channelName}.` })
  }

  // Ziskanie zoznamu vsetkych clenov v danom kanali
  async channelUsers({ request, response }: HttpContext) {
    const channelName = request.param('name')
    
    const channel = await Channel.findBy('channelName', channelName)
    if (!channel) return response.notFound({ message: 'Kanál neexistuje' })

    // Nacitanie vsetkych clenov kanala, ktory maju status active
    await channel.load('members')

    const users = channel.members.map(user => ({
      id: user.id,
      nickname: user.nickname,
      status: user.$extras.pivot_status // takto Adonis pristupuje k pivot dátam
    }))

    return response.ok(users)
  }
}