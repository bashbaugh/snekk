export enum MESSAGETYPE {
  SPAWN,
  TURN,
  TIMESYNC
}

export interface Message {
  [MESSAGETYPE.SPAWN]: {
    point: XY
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
}
