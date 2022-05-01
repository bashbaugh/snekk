import { Schema, type, ArraySchema, MapSchema } from '@colyseus/schema'
import CONFIG from 'config'
import { SharedSnakeState } from './snake'
import { randomInt } from './util'

export class Point extends Schema implements XY {
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
  @type('int16') s: number
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
  /** Sequence number to order regions */
  @type('int16') s: number
  /** Timestamp of region creation */
  @type('number') t: number
  /** Points defining region. First point is also point at which shape is closed. */
  @type([Point]) p: Point[]

  constructor(s: number, p: Point[], t?: number) {
    super()
    this.s = s
    this.t = t || Date.now()
    this.p = p
  }
}

export class SnakeState extends Schema implements SharedSnakeState {
  // Sequence number is increased with each new point in snake (lower = closer to tail)
  @type([SnakePoint]) points = new ArraySchema<SnakePoint>()
  @type([SnakePoint]) trail = new ArraySchema<SnakePoint>()
  @type([Region]) territory = new ArraySchema<Region>()
  @type('int8') direction: Direction = 1
  @type('int16') length: number = CONFIG.snake.startLength
  @type('int16') speed: number = CONFIG.snake.baseSpeed
  @type('int16') hue: number

  constructor(spawnP: XY) {
    super()

    // Generate spawn points
    this.points.push(
      new SnakePoint(spawnP.x, spawnP.y, 1, 1),
      new SnakePoint(spawnP.x, spawnP.y, 0, 1)
    )

    // Generate initial territory surrounding spawn point
    const m = CONFIG.snake.startTerritoryMargin
    this.territory.push(
      new Region(0, [
        new Point(spawnP.x - m, spawnP.y - m),
        new Point(spawnP.x + m, spawnP.y - m),
        new Point(spawnP.x + m, spawnP.y + m),
        new Point(spawnP.x - m, spawnP.y + m),
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

  makeRegion({ s, t, p }: SRegion) {
    return new Region(
      s,
      p.map(p => new Point(p.x, p.y)),
      t
    )
  }
}

export class PlayerState extends Schema {
  @type('string') clientId: string
  @type(SnakeState) snake?: SnakeState
  @type('string') name?: string

  constructor(clientId: string) {
    super()
    this.clientId = clientId
  }
}

export default class GameState extends Schema {
  /** Timestamp to track server time in updates */
  @type('number') ts: number = 0
  @type('int16') arenaSize: number = 2000
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>()
}
