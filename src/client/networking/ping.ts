import { Room } from 'colyseus.js'
import { Message, MESSAGETYPE } from 'types/networking'

interface PingData {
  serverTs: number
  latency: number
  serverTimeOffsetWithLatency: number
  serverTimeOffset: number
}

export default class ServerPinger {
  private room: Room
  private pingIndex: number = 0
  private resCbQueue: Record<number, (serverTs: number) => void> = {}
  private pingInterval: NodeJS.Timeout | null = null

  public lastPing?: PingData

  constructor(room: Room) {
    this.room = room

    this.room.onMessage(
      MESSAGETYPE.TIMESYNC,
      (data: Message[MESSAGETYPE.TIMESYNC]) => {
        this.resCbQueue[data.i]?.(data.t)
        delete this.resCbQueue[data.i]
      }
    )
  }

  startPinging(interval: number) {
    this.pingInterval = setInterval(async () => {
      this.lastPing = await this.ping()
    }, interval)
  }

  stopPinging() {
    clearInterval(this.pingInterval!)
  }

  /** Get latency and server time */
  private ping() {
    return new Promise<PingData>((resolve, reject) => {
      this.pingIndex++
      const sendTs = Date.now()

      this.room.send(MESSAGETYPE.TIMESYNC, {
        i: this.pingIndex,
        t: sendTs,
      })

      this.resCbQueue[this.pingIndex] = serverTs => {
        const recTs = Date.now()
        const latency = recTs - sendTs
        resolve({
          serverTs,
          latency,
          serverTimeOffsetWithLatency: serverTs - recTs,
          serverTimeOffset: serverTs - recTs + latency / 2,
        })
      }
    })
  }
}
