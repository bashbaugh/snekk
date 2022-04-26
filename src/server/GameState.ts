import { Schema, type, ArraySchema, MapSchema } from '@colyseus/schema'
import { randomInt } from 'shared/util'
// import { Direction } from 'types/game'

export class Point extends Schema {
  @type('int16') x: number
  @type('int16') y: number

  constructor(x: number, y: number) {
    super()
    this.x = x
    this.y = y
  }
}

export class Snake extends Schema {
  @type([Point]) points = new ArraySchema<Point>()
  @type('int8') direction: Direction = 1

  constructor(arenaSize: number) {
    super()

    const spawnX = randomInt(arenaSize),
      spawnY = randomInt(arenaSize)
    this.points.push(new Point(spawnX, spawnY), new Point(spawnX, spawnY))
  }

  get head() {
    return this.points[0]
  }
}

export class Player extends Schema {
  @type(Snake) snake?: Snake

  constructor(arenaSize: number) {
    super()
    this.snake = new Snake(arenaSize)
  }
}

export default class GameState extends Schema {
  @type('int16') arenaSize: number = 2000
  @type({ map: Player }) players = new MapSchema<Player>()
}
