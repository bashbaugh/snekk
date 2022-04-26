import * as PIXI from 'pixi'
import CONFIG from 'shared/config'
import { randomInt } from 'shared/util'
import Game from './game'

export default class Snake {
  speed: number = CONFIG.snake.baseSpeed
  /** Up | Right | Down | Left  */
  direction: Direction = 1
  length: number = CONFIG.snake.startLength

  private points: XY[]

  private container: PIXI.Container
  private graphics: PIXI.Graphics

  constructor(game: Game) {
    const spawn = {
      x: randomInt(game.arenaWidth),
      y: randomInt(game.arenaHeight),
    }
    this.points = [spawn, { ...spawn }]
    this.direction = 1
    this.container = new PIXI.Container()
    game.app.stage.addChild(this.container)
    this.graphics = new PIXI.Graphics()
  }

  get head() {
    return this.points[0]
  }

  update(delta: number) {
    if (this.direction === 1) this.head.y -= this.speed * delta
    if (this.direction === 2) this.head.x += this.speed * delta
    if (this.direction === 3) this.head.y += this.speed * delta
    if (this.direction === 4) this.head.x -= this.speed * delta

    this.updateTail()
  }

  draw() {
    const g = this.graphics
    g.clear()
    g.lineStyle(4, 0xffffff)
    g.moveTo(this.points[0].x, this.points[0].y)
    for (let i = 1; i < this.points.length; i++) {
      g.lineTo(this.points[i].x, this.points[i].y)
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

  turn (d: Direction) {
    this.direction = d
    this.points.unshift({ ...this.head }) // New turn point
  }
}
