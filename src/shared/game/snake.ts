import type { Schema } from '@colyseus/schema'

export interface SharedSnakeState {
  points: SPoint[] | Array<SPoint & Schema>
  direction: Direction
  length: number
  speed: number

  /** Make a point and increment the sequence number */
  makePoint: ({ x, y, s, d, t }: SPoint) => any
}

export default abstract class SnakeBehaviour {
  state: SharedSnakeState

  constructor(state: SharedSnakeState) {
    this.state = state
  }

  public get head() {
    return this.state.points[0]
  }
  public get tail() {
    return this.state.points[this.state.points.length - 1]
  }

  abstract update(delta: number): void
  abstract die(): void

  protected updateHead(delta: number) {
    const newHead = this.getNextHead(
      delta,
      this.head,
      this.state.direction,
      this.state.speed
    )
    Object.assign(this.head, newHead)
  }

  protected getNextHead(
    delta: number,
    head: SPoint,
    direction: Direction,
    speed: number
  ): XY {
    const h = { x: head.x, y: head.y /*t: Date.now()*/ },
      d = direction,
      deltaSec = delta / 1000
    const m = Math.round(speed * deltaSec)
    if (d === 1) h.y -= m
    if (d === 2) h.x += m
    if (d === 3) h.y += m
    if (d === 4) h.x -= m
    // console.log(h)
    return h
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
        // console.log(points[i])
        const remaining = Math.round(this.state.length - l)
        const isHorizontal = points[i].d === 2 || points[i].d === 4
        const isVertical = points[i].d === 1 || points[i].d === 3
        if (isVertical && points[i].y > points[i - 1].y) {
          points[i].y = points[i - 1].y + remaining
        } else if (isVertical && points[i].y < points[i - 1].y) {
          points[i].y = points[i - 1].y - remaining
        } else if (isHorizontal && points[i].x > points[i - 1].x) {
          points[i].x = points[i - 1].x + remaining
        } else if (isHorizontal && points[i].x < points[i - 1].x) {
          points[i].x = points[i - 1].x - remaining
        }
        points.splice(i + 1) // Splice doesn't work correctly with Colyseus so we have to push
        // points.push(newTailPoint)
      }

      l += segLength
    }
  }

  public turnHead(d: Direction) {
    // Prevent reversing
    if (
      this.state.direction * d === 3 ||
      this.state.direction * d === 8 ||
      this.state.direction === d
    )
      return
    // Add new turn point and increment sequence number so that we can track it on server/client
    this.state.direction = d
    this.head.d = d
    this.head.t = Date.now()
    this.state.points.unshift(
      this.state.makePoint({ ...this.head, s: this.head.s + 1 })
    )
  }
}
