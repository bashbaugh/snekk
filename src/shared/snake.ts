import CONFIG from 'config'
import {
  getLineIntersection,
  pointInsidePolygon,
  polygonDiff,
  polygonUnion,
} from './geometry'
import type { Region, SnakePoint } from './serverState'

export interface SharedSnakeState {
  points: SPoint[] | Array<SnakePoint>
  // trail: SPoint[] | Array<SnakePoint>
  territory: SRegion[] | Array<Region>
  direction: Direction

  length: number
  // energy: number
  speed: number

  hue: number

  /** Get a point */
  makeSnakePoint: ({ x, y, s, d, t }: SPoint) => any

  /** Get a region */
  makeRegion: ({ t, p }: SRegion) => any
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
        points.splice(i + 1)
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
      this.state.makeSnakePoint({ ...this.head, s: this.head.s + 1 })
    )
  }

  /** Check if a point is within this snake's territory */
  protected pointIsInTerritory(point: SPoint) {
    for (const region of this.state.territory) {
      if (pointInsidePolygon(point, region.p)) return true
    }
    return false
  }

  protected computeNewTerritoryRegion() {
    // First we need to get the segments of our territory as a single polygon
    const t = polygonUnion(this.state.territory.map(r => r.p))[0]

    let tSegments: XY[][] = []
    for (let i = 0; i < t.length - 1; i++) tSegments.push([t[i], t[i + 1]])

    let startPoint: XY | false = false
    const snakeStartSeg = 0
    let territoryStartSeg: number = 0
    for (const [i, seg] of tSegments.entries()) {
      // Find point and territory segment where head segment intersects territory
      startPoint = getLineIntersection(
        this.state.points[0],
        this.state.points[1],
        seg[0],
        seg[1]
      )
      if (startPoint) {
        territoryStartSeg = i
        break
      }
    }

    if (!startPoint) return // TODO handle

    let stopPoint: XY | false = false
    let territoryStopSeg: number = 0
    let snakeStopSeg: number = 0

    const segmentsFromSnake: XY[][] = []

    // Starting after the first intersection,
    // we iterate through snake segments to find the segment that intersects back into the territory
    snakeSegLoop:
    for (let i = snakeStartSeg; i < this.state.points.length - 1; i++) {
      const snakeSeg = [this.state.points[i], this.state.points[i + 1]].map(p => ({
        x: p.x,
        y: p.y,
      }))
      // Add this segment to the start of segments array
      // Since we will be assembling the polygon from head to tail along the snake
      segmentsFromSnake.unshift(snakeSeg)

      for (const [k, tSeg] of tSegments.entries()) {
        stopPoint = getLineIntersection(
          snakeSeg[0],
          snakeSeg[1],
          tSeg[0],
          tSeg[1]
        )
        // Need to make sure it isn't the same point as start
        if (stopPoint && !(stopPoint.x === startPoint.x && stopPoint.y === startPoint.y)) {
          territoryStopSeg = k
          snakeStopSeg = i
          break snakeSegLoop
        }
      }
    }

    if (!stopPoint) return

    // Now we have both points where the snake intersects the territory
    // so we need to slice the territory segments to find the segments between both intersections
    const lowerTerritorySeg = Math.min(territoryStartSeg, territoryStopSeg),
      upperTerritorySeg = Math.max(territoryStartSeg, territoryStopSeg)
    const segmentsFromTerritory = tSegments.slice(
      lowerTerritorySeg,
      upperTerritorySeg
    )

    // Now, we combine the segments and start/end points in order to assemble the new region polygon
    // Basically, we trace from the intersection at the head along the territory
    // to the second snake intersection and then up the snake back to the first point
    const totalNewRegionPolygon = [
      // The start point in the polygon is the first inersection point
      startPoint, 
      // Then, we trace along the territory taking the second point from each segment
      // Starting with the first intersected segment and ending with the next to last
      ...segmentsFromTerritory.map(seg => seg[1]),
      // Then, we reach the second intersection point
      stopPoint,
      // Finally, add points from along the snake
      ...segmentsFromSnake.map(seg => seg[1]),
    ]

    console.log(startPoint, stopPoint, segmentsFromTerritory, segmentsFromSnake)

    if (totalNewRegionPolygon.length < 3) return

    // We may have traversed along the territory AWAY from the snake intersection,
    // Meaning the new polygon could also include old regions so we need to subtract existing regions
    const newRegion = polygonDiff([totalNewRegionPolygon], [t])
    // const newRegion = totalNewRegionPolygon
    return newRegion?.[0]
  }

  public updateTerritory() {
    if (this.pointIsInTerritory(this.head)) {
      // Reset the snake's length when we return to the territory
      // this.state.length = CONFIG.snake.baseLength

      // Check if any points are outside territory
      let pointsOutside = false
      for (const point of this.state.points) {
        if (!this.pointIsInTerritory(point)) pointsOutside = true
      }

      // If any points are outside we should compute new territory
      if (pointsOutside) {
        const newRegion = this.computeNewTerritoryRegion()
        if (newRegion) {
          this.state.territory.push(
            this.state.makeRegion({ p: newRegion, t: Date.now() })
          )
          console.log(this.state.territory.length)
        }
      }

      // // If both head and tail are in territory, we might be able to create new territory
      // if (this.pointIsInTerritory(this.tail)) {

      // }
    }
  }
}
