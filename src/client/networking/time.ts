import { Room } from 'colyseus.js'
import { calcStandardDev as calcStdDeviation } from 'shared/util'
import { Message, MESSAGETYPE } from 'types/networking'

const SAMPLE_COUNT = 5
const SAMPLE_DELAY = 200

export default class ServerTimeManager {
  private room: Room
  private pingIndex: number = 0
  private resCbQueue: Record<number, (serverTs: number) => void> = {}

  public lastOffset?: number
  public roundtripPing?: number

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

  getServerTimeEstimate() {
    // return this.lastOffset ? Date.now() + this.lastOffset : undefined
    return Date.now() + (this.lastOffset ?? 0)
  }

  async estimateOffset() {
    // https://gamedev.stackexchange.com/a/93662/162031
    const deltas: Array<number> = []
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      this.pingIndex++
      const sendTs = Date.now()
      this.room.send(MESSAGETYPE.TIMESYNC, {
        i: this.pingIndex,
        t: sendTs,
      })
      this.resCbQueue[this.pingIndex] = serverTs => {
        const recTs = Date.now()
        const latency = recTs - sendTs
        this.roundtripPing = latency
        // Server/client time difference offset by half-latency
        deltas.push(serverTs - recTs + latency / 2)
      }

      await new Promise(r => setTimeout(r, SAMPLE_DELAY))
    }

    deltas.sort((a, b) => a - b)
    const midpoint = Math.floor(SAMPLE_COUNT / 2)
    const median = (deltas[midpoint - 1] + deltas[midpoint]) / 2
    const std = calcStdDeviation(deltas)
    const filteredDiffs = deltas.filter(
      d => d < median + std && d > median - std
    )
    const avg = filteredDiffs.reduce((a, b) => a + b, 0) / filteredDiffs.length
    this.lastOffset = avg
    return avg
  }
}