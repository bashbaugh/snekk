import {
  Schema,
  type,
  filter,
  filterChildren,
  ArraySchema,
  MapSchema,
} from '@colyseus/schema'
import CONFIG from 'config'
import { foodFilter, snakePointsFilter } from 'server/stateFilters'
import { SharedPlayerState, SharedSnakeState } from '../types/state'
import { territorySkins } from './skins'
import { randomInt } from './util'

export class XYPoint extends Schema implements XY {
  @type('int16') x: number
  @type('int16') y: number

  constructor(x: number, y: number) {
    super()
    this.x = x
    this.y = y
  }
}

export class SnakePoint extends Schema implements SPoint {
  @type('int16') x: number
  @type('int16') y: number
  /** Sequence number */
  @type('uint16') s: number
  /** Direction (for turn points9) */
  @type('int8') d: Direction
  /** Server timestamp */
  @type('number') t: number

  constructor(x: number, y: number, s: number, d: Direction, t?: number) {
    super()
    // Object.assign(this, arguments)
    this.x = x
    this.y = y
    this.s = s
    this.d = d
    this.t = t || Date.now()
  }
}

export class Region extends Schema implements SRegion {
  /** Timestamp of region creation */
  @type('number') t: number
  /** Points defining region. First point is also point at which shape is closed. */
  @type([XYPoint]) p: XYPoint[]

  constructor(p: XYPoint[], t?: number) {
    super()
    this.t = t || Date.now()
    this.p = p
  }
}

export class SnakeState extends Schema implements SharedSnakeState {
  @type('string') clientId: string
  @type('number') spawnTs: number = Date.now()
  // Sequence number is increased with each new point in snake (lower = closer to tail)
  // @filter(snakePointsFilter)
  @type([SnakePoint]) points = new ArraySchema<SnakePoint>()
  @type([Region]) tRegions = new ArraySchema<Region>()
  @type([XYPoint]) territory = new ArraySchema<XYPoint>()
  @type('int8') direction: Direction = 1
  @type('uint16') length: number = CONFIG.snake.baseLength
  // @type('int16') energy: number = 0
  @type('int16') speed: number = CONFIG.snake.baseSpeed
  @type('int16') extraSpeed: number = 0
  @type('boolean') boosting: boolean = false
  @type('int16') hue: number
  @type('uint32') score: number = 0
  @type('uint8') kills: number = 0
  @type('string') headTerritory?: string
  @type('boolean') frozen = false

  constructor(spawnP: XY, cid: string) {
    super()

    this.clientId = cid

    // Generate spawn points
    this.points.push(
      new SnakePoint(spawnP.x, spawnP.y, 1, 1),
      new SnakePoint(spawnP.x, spawnP.y, 0, 1)
    )

    // Generate initial territory surrounding spawn point
    const m = CONFIG.snake.territoryStartMargin
    this.tRegions.push(
      new Region([
        new XYPoint(spawnP.x - m, spawnP.y - m),
        new XYPoint(spawnP.x + m, spawnP.y - m),
        new XYPoint(spawnP.x + m, spawnP.y + m),
        new XYPoint(spawnP.x - m, spawnP.y + m),
      ])
    )

    // Generate a random hue for the snake
    this.hue = randomInt(360)
  }

  get head() {
    return this.points[0]
  }

  makeSnakePoint({ x, y, s, d }: SPoint) {
    return new SnakePoint(x, y, s, d)
  }

  makePoint({ x, y }: XY) {
    return new XYPoint(x, y)
  }

  makeRegion({ t, p }: SRegion) {
    return new Region(
      p.map(p => new XYPoint(p.x, p.y)),
      t
    )
  }
}

export class PlayerState extends Schema implements SharedPlayerState {
  @type('string') clientId: string
  @type(SnakeState) snake?: SnakeState

  @type('string') name?: string
  @type('string') territorySkin?: keyof typeof territorySkins

  constructor(clientId: string) {
    super()
    this.clientId = clientId
  }
}

export class Food extends Schema {
  @type('int16') x: number
  @type('int16') y: number
  @type('int16') hue: number
  @type('number') t: number

  constructor(p: XY, hue: number) {
    super()
    this.x = p.x
    this.y = p.y
    this.hue = hue
    this.t = Date.now()
  }
}

export default class GameState extends Schema {
  /** Timestamp to track server time in updates */
  @type('number') ts: number = 0
  @type('int16') arenaSize: number = Math.sqrt(CONFIG.arena.minArea) / 2
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()

  // @filterChildren(foodFilter)
  @type([Food])
  food = new ArraySchema<Food>()
}
