import { Client } from 'colyseus.js'
import CONFIG from 'shared/config'

export default class Network {
  client: Client

  constructor() {
    this.client = new Client('ws://localhost:3001')
  }

  async joinGame(nickname: string) {
    const r = await this.client.joinOrCreate('classic', { nickname })
    if (CONFIG.debug) console.log('[NETWORK] Joined session', r.sessionId)

    r.onLeave((code: number) => {
      if (CONFIG.debug) console.log('[NETWORK] Left session. WS code:', code)
    })
  }
}
