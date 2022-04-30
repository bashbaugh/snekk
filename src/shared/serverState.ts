import { Schema, type, ArraySchema, MapSchema } from '@colyseus/schema'
import CONFIG from 'shared/config'
import { SharedSnakeState } from './game/snake'

export class Point extends Schema {
  @type('int16') x: number
  @type('int16') y: number
  /** Sequence number */
  @type('int16') s: number

  constructor(x: number, y: number, s: number) {
    super()
    this.x = x
    this.y = y
    this.s = s
  }
}

export class SnakeState extends Schema implements SharedSnakeState {
  // Sequence number is increased with each new point in snake (lower = closer to tail)
  @type([Point]) points = new ArraySchema<Point>()
  @type('int8') direction: Direction = 1
  @type('int16') length: number = CONFIG.snake.startLength
  @type('int16') speed: number = CONFIG.snake.baseSpeed

  constructor(spawnP: XY) {
    super()

    this.points.push(
      new Point(spawnP.x, spawnP.x, 0),
      new Point(spawnP.x, spawnP.y, 1)
    )
  }

  get head() {
    return this.points[0]
  }

  makePoint({ x, y, s }: XYS) {
    return new Point(x, y, s)
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
