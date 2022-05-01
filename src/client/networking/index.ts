import { Client, Room } from 'colyseus.js'
import { Message, MESSAGETYPE } from 'types/networking'
import GameState, { PlayerState } from 'shared/serverState'
import { debugLog } from '../util'
import { DeathReason } from 'types/game'
// import ServerTimeManager from './time'

export default class Network {
  private client: Client
  private room: Room<GameState> | null = null
  // private sTime?: ServerTimeManager

  public lastServerTs: number = 0
  public lastServerTimeOffset: number = 0

  constructor() {
    this.client = new Client('ws://localhost:3001')
  }

  get clientId() {
    return this.room?.sessionId
  }

  get state() {
    return this.room?.state
  }

  // get serverTime() {
  //   return this.sTime?.getServerTimeEstimate()
  // }

  get serverTime() {
    return Date.now() + this.lastServerTimeOffset
  }

  async findGame() {
    const r = await this.client.joinOrCreate<GameState>('arena', {})
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
    this.room?.onStateChange(s => {
      this.lastServerTs = s.ts
      this.lastServerTimeOffset = s.ts - Date.now()
      cb(s)
    })
  }

  public sendTurn(payload: Message[MESSAGETYPE.TURN]) {
    this.room?.send(MESSAGETYPE.TURN, payload)
  }

  public onSelfSpawn(cb: (point: XY, selfPlayerState: PlayerState) => void) {
    this.room?.onMessage(
      MESSAGETYPE.SPAWN,
      (data: Message[MESSAGETYPE.SPAWN]) => {
        cb(data.p, this.room!.state.players.get(this.clientId!)!)
      }
    )
  }

  public onSelfDie(cb: (reason: DeathReason, killer?: string) => void) {
    this.room?.onMessage<Message[MESSAGETYPE.DEATH]>(
      MESSAGETYPE.DEATH,
      (data) => {
        if (data.p === this.clientId) cb(data.c, data.k)
      }
    )
  }

  public onPlayerJoin(cb: (id: string, p: PlayerState) => void) {
    this.room!.state.players.onAdd = (p, id) => {
      if (id !== this.clientId) cb(id, p)
    }
  }

  public onPlayerLeave(cb: (id: string) => void) {
    this.room!.state.players.onRemove = (p, id) => {
      cb(id)
    }
  }
}
