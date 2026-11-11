/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

// Import nášho nového kontroléra pre kanály
const ChannelsController = () => import('#controllers/channels_controller')

const MessagesController = () => import('#controllers/messages_controller')

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    // 1. Verejné cesty (registrácia, prihlásenie)
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    // 2. Chránené cesty účtu (profil, odhlásenie)
    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    // 3. NOVÉ: Chránené cesty pre kanály
    router
      .group(() => {
        // GET /api/v1/channels -> vráti zoznam kanálov používateľa
        router.get('/', [ChannelsController, 'index'])
        
        // POST /api/v1/channels/join -> pripojí do kanála alebo ho vytvorí
        router.post('/join', [ChannelsController, 'join']) 
        router.post('/invite', [ChannelsController, 'invite'])
        router.post('/revoke', [ChannelsController, 'revoke'])
        router.post('/kick', [ChannelsController, 'kick'])
        router.post('/quit', [ChannelsController, 'quit'])
        router.post('/cancel', [ChannelsController, 'cancel'])

        // Cesty pre správy (využívajú dynamický parameter :channel_id)
        router.get('/:channel_id/messages', [MessagesController, 'index'])
        router.post('/:channel_id/messages', [MessagesController, 'store'])
        router.get('/:name/users', [ChannelsController, 'channelUsers'])
      })
      .prefix('channels')
      .as('channels')
      .use(middleware.auth())

  })
  .prefix('/api/v1')