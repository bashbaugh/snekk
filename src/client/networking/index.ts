import { Client, Room } from 'colyseus.js'
import { Message, MESSAGETYPE } from 'types/networking'
import GameState, { PlayerState } from 'shared/serverState'
import { debugLog } from '../util'
import { DeathReason } from 'types/game'
import ServerPinger from './ping'
import { SharedSnakeState } from 'types/state'
import { mean } from 'shared/util'
import CONFIG from 'config'

const SERVERTIME_MOVING_AVG_SAMPLES = 15

export default class Network {
  private client: Client
  private room: Room<GameState> | null = null
  // private sTime?: ServerTimeManager

  public pinger?: ServerPinger
  public lastServerTs: number = 0

  private serverTimeOffsets: number[] = []

  constructor() {
    this.client = new Client('ws://' + CONFIG.serverURL)
  }

  public get lastServerTimeOffset() {
    return this.serverTimeOffsets[0]
  }

  get clientId() {
    return this.room?.sessionId
  }

  get state() {
    return this.room?.state
  }

  get smoothedServerTimeOffset() {
    // Return the mean of the last n server time offsets to smooth interpolation
    this.serverTimeOffsets.splice(SERVERTIME_MOVING_AVG_SAMPLES)
    return mean(this.serverTimeOffsets)
  }

  /** Get the estimated server time (not lag-adjusted) */
  get serverTime() {
    return Date.now() + this.smoothedServerTimeOffset
  }

  async findGame(onDisconnect: (code: number) => void) {
    const r = await this.client.joinOrCreate<GameState>('arena', {})
    this.room = r
    this.pinger = new ServerPinger(r)
    this.pinger.startPinging(2000)

    debugLog('[NETWORK] Joined room', r.id, 'as', r.sessionId)

    r.onLeave((code: number) => {
      this.pinger?.stopPinging()
      onDisconnect(code)
      debugLog('[NETWORK] Left session. WS code:', code)
    })

    // Secret admin broadcasts
    r.onMessage(MESSAGETYPE.GODMSG, (m: Message[MESSAGETYPE.GODMSG]) => {
      alert(m.m)
    })
  }

  public removeListeners() {
    this.room?.removeAllListeners()
  }

  public onStateChange(cb: (state: GameState) => void) {
    this.room?.onStateChange(s => {
      this.lastServerTs = s.ts
      this.serverTimeOffsets.unshift(s.ts - Date.now())
      cb(s)
    })
  }

  public joinGame(name: string) {
    this.room?.send(MESSAGETYPE.JOIN, {
      n: name,
    })
  }

  public sendTurn(payload: Message[MESSAGETYPE.TURN]) {
    this.room?.send(MESSAGETYPE.TURN, payload)
  }

  public onSelfSpawn(
    cb: (state: SharedSnakeState, selfPlayerState: PlayerState) => void
  ) {
    this.room?.onMessage(
      MESSAGETYPE.SPAWN,
      (data: Message[MESSAGETYPE.SPAWN]) => {
        cb(data.s, this.room!.state.players.get(this.clientId!)!)
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
