import type { ApplicationService } from '@adonisjs/core/types'

export default class WsProvider {
  constructor(protected app: ApplicationService) {}

  async ready() {
    // Spustiť iba pri HTTP serveri (nie pri ace príkazoch, migráciách a pod.)
    if (this.app.getEnvironment() !== 'web') return

    const Ws = (await import('#services/ws')).default
    Ws.boot()

    // Handlery pripojení (obsah tvojho doterajšieho start/ws.ts)
    await import('#start/ws')
  }
}