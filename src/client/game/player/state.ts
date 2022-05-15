import { SharedSnakeState } from 'types/state'

export const cloneSnakePoint = ({ x, y, s, d, t }: SPoint): SPoint => ({
  x,
  y,
  s,
  d,
  t,
})
export const cloneXY = ({ x, y }: XY): XY => ({ x, y })
export const cloneSnakeRegion = ({ p, t }: SRegion): SRegion => ({
  t,
  p: p.map(p => ({ ...p })),
})

export default class ClientSnakeState implements SharedSnakeState {
  spawnTs: number = Date.now()
  points: SPoint[]
  // trail: SPoint[]
  tRegions: SRegion[]
  territory: XY[] = []
  direction: Direction
  length: number
  // energy: number
  speed: number
  extraSpeed: number = 0
  boosting: boolean = false
  hue: number
  score: number = 0
  kills: number = 0
  headTerritory?: string
  frozen = false

  constructor(state: SharedSnakeState) {
    const t = Date.now()
    this.points = state.points
    this.tRegions = state.tRegions
    this.direction = state.direction
    this.length = state.length
    this.speed = state.speed
    this.hue = state.hue
  }

  makeSnakePoint(p: SPoint): SPoint {
    return cloneSnakePoint(p)
  }

  makeRegion(r: SRegion): SRegion {
    return cloneSnakeRegion(r)
  }

  makePoint(p: XY): XY {
    return cloneXY(p)
  }
}
