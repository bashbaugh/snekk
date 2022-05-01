import { Client, Room } from 'colyseus.js'
import { Message, MESSAGETYPE } from 'types/networking'
import GameState, { PlayerState } from 'shared/serverState'
import { debugLog } from '../util'
import { DeathReason } from 'types/game'
import ServerPinger from './ping'
import { Server } from 'colyseus'
// import ServerTimeManager from './time'

const SERVER_URL = 'ws://localhost:3001'

export default class Network {
  private client: Client
  private room: Room<GameState> | null = null
  // private sTime?: ServerTimeManager

  public pinger?: ServerPinger
  public lastServerTs: number = 0
  public lastServerTimeOffset: number = 0

  constructor() {
    this.client = new Client(SERVER_URL)
  }

  get clientId() {
    return this.room?.sessionId
  }

  get state() {
    return this.room?.state
  }

  get serverTime() {
    return Date.now() + this.lastServerTimeOffset
  }

  async findGame() {
    const r = await this.client.joinOrCreate<GameState>('arena', {})
    this.room = r
    this.pinger = new ServerPinger(r)
    this.pinger.startPinging(2000)

    debugLog('[NETWORK] Joined room', r.id, 'as', r.sessionId)

    r.onLeave((code: number) => {
      this.pinger?.stopPinging()
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

  public joinGame(name: string) {
    this.room?.send(MESSAGETYPE.JOIN, {
      n: name
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
      data => {
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
