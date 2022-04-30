import { Client, Room } from 'colyseus.js'
import CONFIG from 'shared/config'
import { Message, MESSAGETYPE } from 'types/networking'
import GameState, { PlayerState } from 'shared/serverState'
import { debugLog } from './util'
import { debug } from 'webpack'

export default class Network {
  client: Client
  room: Room<GameState> | null = null

  constructor() {
    this.client = new Client('ws://localhost:3001')
  }

  get clientId() {
    return this.room?.sessionId
  }

  get state() {
    return this.room?.state
  }

  async findGame() {
    const r = await this.client.joinOrCreate<GameState>('classic', {})
    this.room = r
    debugLog('[NETWORK] Joined room', r.id, 'as', r.sessionId)

    r.onLeave((code: number) => {
      debugLog('[NETWORK] Left session. WS code:', code)
    })
  }

  public removeListeners() {
    this.room?.removeAllListeners()
  }

  public onStateChange(cb: (state: GameState) => void) {
    this.room?.onStateChange(s => cb(s))
  }

  sendTurn(payload: Message[MESSAGETYPE.TURN]) {
    this.room?.send(MESSAGETYPE.TURN, payload)
  }

  onSelfSpawn(cb: (point: XY, selfPlayerState: PlayerState) => void) {
    this.room?.onMessage(
      MESSAGETYPE.SPAWN,
      (data: Message[MESSAGETYPE.SPAWN]) => {
        cb(data.point, this.room!.state.players.get(this.clientId!)!)
      }
    )
  }

  onPlayerJoin(cb: (id: string, p: PlayerState) => void) {
    this.room!.state.players.onAdd = (p, id) => {
      if (id !== this.clientId) cb(id, p)
    }
  }

  onPlayerLeave(cb: (id: string) => void) {
    this.room!.state.players.onRemove = (p, id) => {
      cb(id)
    }
  }
}
