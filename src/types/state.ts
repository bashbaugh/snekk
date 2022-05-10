import { Region, SnakePoint, XYPoint } from '../shared/serverState'

export interface SharedSnakeState {
  points: SPoint[] | Array<SnakePoint>
  // trail: SPoint[] | Array<SnakePoint>
  tRegions: SRegion[] | Array<Region>
  territory: XY[] | XYPoint[]
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

  /** Get a generic point */
  makePoint: ({ x, y }: XY) => any
}

export interface SharedPlayerState {
  clientId: string
  snake?: SharedSnakeState
  name?: string
}
