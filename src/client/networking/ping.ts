import { Room } from 'colyseus.js'
import { Message, MESSAGETYPE } from 'types/networking'

const SAMPLE_COUNT = 5
const SAMPLE_DELAY = 200

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
      console.log(
        this.lastPing.serverTimeOffsetWithLatency,
        this.lastPing.serverTimeOffset
      )
    }, interval)
  }

  stopPinging() {
    clearInterval(this.pingInterval!)
  }

  // getServerTimeEstimate() {
  //   return Date.now() + (this.lastPing?.serverTimeOffset ?? 0)
  // }

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

  // async estimateOffset() {
  //   // https://gamedev.stackexchange.com/a/93662/162031
  //   const deltas: Array<number> = []
  //   for (let i = 0; i < SAMPLE_COUNT; i++) {
  //     this.pingIndex++
  //     const sendTs = Date.now()
  //     this.room.send(MESSAGETYPE.TIMESYNC, {
  //       i: this.pingIndex,
  //       t: sendTs,
  //     })
  //     this.resCbQueue[this.pingIndex] = serverTs => {
  //       const recTs = Date.now()
  //       const latency = recTs - sendTs
  //       this.roundtripPing = latency
  //       // Server/client time difference offset by half-latency
  //       deltas.push(serverTs - recTs + latency / 2)
  //     }

  //     await new Promise(r => setTimeout(r, SAMPLE_DELAY))
  //   }

  //   deltas.sort((a, b) => a - b)
  //   const midpoint = Math.floor(SAMPLE_COUNT / 2)
  //   const median = (deltas[midpoint - 1] + deltas[midpoint]) / 2
  //   const std = calcStdDeviation(deltas)
  //   const filteredDiffs = deltas.filter(
  //     d => d < median + std && d > median - std
  //   )
  //   const avg = filteredDiffs.reduce((a, b) => a + b, 0) / filteredDiffs.length
  //   this.lastOffset = avg
  //   return avg
  // }
}
