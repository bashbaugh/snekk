export enum MESSAGETYPE {
  SPAWN,
  TURN,
}

export interface Message {
  [MESSAGETYPE.SPAWN]: {
    point: XY
  }
  [MESSAGETYPE.TURN]: {
    d: Direction
  }
}
