import { Region, SnakePoint } from '../shared/serverState'

export interface SharedSnakeState {
  points: SPoint[] | Array<SnakePoint>
  // trail: SPoint[] | Array<SnakePoint>
  territory: SRegion[] | Array<Region>
  direction: Direction

  length: number
  speed: number
  extraSpeed: number

  hue: number

  score: number

  /** Get a point */
  makeSnakePoint: ({ x, y, s, d, t }: SPoint) => any

  /** Get a region */
  makeRegion: ({ t, p }: SRegion) => any
}

export interface SharedPlayerState {
  clientId: string
  snake?: SharedSnakeState
  name?: string
}
