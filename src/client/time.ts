import { Room } from "colyseus.js";
import GameState from "shared/serverState";
import { calcStandardDev as calcStdDeviation } from "shared/util";
import { Message, MESSAGETYPE } from "types/networking";

const SAMPLE_COUNT = 5
const SAMPLE_DELAY = 1000

export default class ServerTimeManager {
  room: Room
  pingIndex: number = 0

  resCbQueue: Record<number, (serverTs: number) => void> = {}

  constructor (room: Room) {
    this.room = room

    this.room.onMessage(
      MESSAGETYPE.TIMESYNC,
      (data: Message[MESSAGETYPE.TIMESYNC]) => {
        this.resCbQueue[data.i]?.(data.t)
      }
    )
  }
  
  async estimateOffset() {
    // https://gamedev.stackexchange.com/a/93662/162031
    const deltas: Array<number> = []
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      this.pingIndex ++ 
      const sendTs = Date.now()
      this.room.send(MESSAGETYPE.TIMESYNC, {
        i: this.pingIndex,
        t: Date.now()
      })
      this.resCbQueue[this.pingIndex] = (serverTs) => {
        const recTs = Date.now()
        const latency = (recTs - sendTs) / 2 // half-latency
        deltas.push(serverTs - recTs + latency)
      }

      await new Promise(r => setTimeout(r, SAMPLE_DELAY))
    }
    
    deltas.sort((a, b) => a - b)
    const midpoint = Math.floor(SAMPLE_COUNT / 2)
    const median = (deltas[midpoint - 1] + deltas[midpoint]) / 2
    const std = calcStdDeviation(deltas)
    const filteredDiffs = deltas.filter(d => d < median + std && d > median - std)
    return filteredDiffs.reduce((a, b) => a + b, 0) / filteredDiffs.length
  }
}
