import { DeathReason } from "./game"

export enum MESSAGETYPE {
  SPAWN,
  TURN,
  TIMESYNC,
  DEATH,
}

export interface Message {
  [MESSAGETYPE.SPAWN]: {
    p: XY
  }
  [MESSAGETYPE.TURN]: {
    /** Direction */
    d: Direction
    x: number
    y: number
    /** Index of the head at which turn will occur */
    s: number
  }
  [MESSAGETYPE.TIMESYNC]: {
    /** ID */
    i: number
    /** Timestamp */
    t: number
  }
  [MESSAGETYPE.DEATH]: {
    /** Player (victim) */
    p: string
    /** Cause */
    c: DeathReason
    /** Killer */
    k?: string
  }
}
