import { TSkinName } from 'shared/skins'
import { SharedSnakeState } from 'types/state'
import { DeathReason } from './game'

export enum MESSAGETYPE {
  SPAWN,
  TURN,
  TIMESYNC,
  DEATH,
  JOIN,
  STARTBOOST,
  STOPBOOST,
  FREEZE,
  UNFREEZE,

  GODDISCON = 'disconnect',
  /** Special message be sent to players by game admins */
  GODMSG = 'godmsg',
}

export interface Message {
  [MESSAGETYPE.SPAWN]: {
    s: SharedSnakeState
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
    /** Game stats */
    s: {
      kills: number
      score: number
      time: number
    }
  }
  [MESSAGETYPE.JOIN]: {
    /** Name */
    n: string
    tskin: TSkinName
  }
  [MESSAGETYPE.STARTBOOST]: {
    x: number
    y: number
  }
  [MESSAGETYPE.STOPBOOST]: {
    x: number
    y: number
  }
  [MESSAGETYPE.FREEZE]: null
  [MESSAGETYPE.UNFREEZE]: null

  [MESSAGETYPE.GODMSG]: {
    m: string
  }
  [MESSAGETYPE.GODDISCON]: null
}
