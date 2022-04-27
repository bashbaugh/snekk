import { Point } from 'shared/serverState'
import CONFIG from 'shared/config'
import type { Schema } from '@colyseus/schema'

export interface SharedSnakeState {
  points: XYS[] | Array<XYS & Schema>
  direction: Direction
  length: number
  speed: number

  /** Make a point and increment the sequence number */
  makePoint: ({ x, y, s }: XYS) => any
}

export default abstract class SnakeBehaviour {
  state: SharedSnakeState

  constructor(state: SharedSnakeState) {
    this.state = state
  }

  public get head() {
    return this.state.points[0]
  }
  public set head(h: XYS) {
    this.state.points[0] = h
  }

  public update(delta: number): void {
    this.updateHead(delta)
    this.updateTail()
  }

  protected updateHead(delta: number) {
    const d = this.state.direction,
      h = this.head,
      speed = this.state.speed,
      deltaSec = delta / 1000
    if (d === 1) h.y -= speed * deltaSec
    if (d === 2) h.x += speed * deltaSec
    if (d === 3) h.y += speed * deltaSec
    if (d === 4) h.x -= speed * deltaSec
  }

  protected updateTail() {
    let l = 0
    const points = this.state.points
    // Add length of segments to find new tail point
    for (let i = 1; i < points.length; i++) {
      const segLength = Math.hypot(
        points[i].x - points[i - 1].x,
        points[i].y - points[i - 1].y
      )
      if (l + segLength > this.state.length) {
        const remaining = this.state.length - l
        const newTailPoint = { ...points[i] }
        if (points[i].x == points[i - 1].x && points[i].y > points[i - 1].y) {
          newTailPoint.y = points[i - 1].y + remaining
        } else if (
          points[i].x == points[i - 1].x &&
          points[i].y < points[i - 1].y
        ) {
          newTailPoint.y = points[i - 1].y - remaining
        } else if (
          points[i].y == points[i - 1].y &&
          points[i].x > points[i - 1].x
        ) {
          newTailPoint.x = points[i - 1].x + remaining
        } else if (
          points[i].y == points[i - 1].y &&
          points[i].x < points[i - 1].x
        ) {
          newTailPoint.x = points[i - 1].x - remaining
        }
        // Remove unused tail coordinates and add new
        points.splice(i, points.length - i, newTailPoint)
      }

      l += segLength
    }
  }

  public turn(d: Direction) {
    // Prevent reversing
    if (this.state.direction * d === 3 || this.state.direction * d === 8) return
    this.state.direction = d
    // Add new turn point and increment sequence number so that we can track it on server/client
    this.state.points.unshift(
      this.state.makePoint({ ...this.head, s: this.head.s + 1 })
    )
  }
}
