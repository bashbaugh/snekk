import * as PIXI from 'pixi'
import CONFIG from 'shared/config'
import { randomInt } from 'shared/util'
import Game from './game'
import * as snakeBehaviour from 'shared/snake'

export default class Snake {
  speed: number = CONFIG.snake.baseSpeed
  direction: Direction = 1
  length: number = CONFIG.snake.startLength

  private points: XY[]

  private container: PIXI.Container
  private graphics: PIXI.Graphics
  game: Game

  constructor(game: Game) {
    this.game = game
    const spawn = {
      x: randomInt(game.arenaSize),
      y: randomInt(game.arenaSize),
    }
    this.points = [spawn, { ...spawn }]
    this.direction = 1
    this.container = new PIXI.Container()
    game.app.stage.addChild(this.container)
    this.graphics = new PIXI.Graphics()
    this.container.addChild(this.graphics)
  }

  public get head() {
    return this.points[0]
  }
  public set head(h: XY) {
    this.points[0] = h
  }

  update(delta: number) {
    this.head = snakeBehaviour.moveHead(
      this.head,
      this.direction,
      this.speed,
      delta
    )
    this.updateTail()
  }

  draw() {
    const g = this.graphics
    const points = this.points.map(p => this.game.getViewRelativePoint(p))
    g.clear()
    g.lineStyle(4, 0xffffff)
    g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y)
    }
  }

  private updateTail() {
    let l = 0
    // Add length of segments to find new tail point
    for (let i = 1; i < this.points.length; i++) {
      const segLength = Math.hypot(
        this.points[i].x - this.points[i - 1].x,
        this.points[i].y - this.points[i - 1].y
      )
      if (l + segLength > this.length) {
        const remaining = this.length - l
        const newTailPoint = { ...this.points[i] }
        if (
          this.points[i].x == this.points[i - 1].x &&
          this.points[i].y > this.points[i - 1].y
        ) {
          newTailPoint.y = this.points[i - 1].y + remaining
        } else if (
          this.points[i].x == this.points[i - 1].x &&
          this.points[i].y < this.points[i - 1].y
        ) {
          newTailPoint.y = this.points[i - 1].y - remaining
        } else if (
          this.points[i].y == this.points[i - 1].y &&
          this.points[i].x > this.points[i - 1].x
        ) {
          newTailPoint.x = this.points[i - 1].x + remaining
        } else if (
          this.points[i].y == this.points[i - 1].y &&
          this.points[i].x < this.points[i - 1].x
        ) {
          newTailPoint.x = this.points[i - 1].x - remaining
        }
        // Remove unused tail coordinates and add new
        this.points.splice(i, this.points.length - i, newTailPoint)
      }

      l += segLength
    }
  }

  turn(d: Direction) {
    // Prevent reversing
    if (this.direction * d === 3 || this.direction * d === 8) return
    this.direction = d
    this.points.unshift({ ...this.head }) // New turn point
  }
}
