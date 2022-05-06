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

    const segmentsFromSnake: XY[][] = []
    let stopPoint: XY | false = false
    let territoryStopSeg: number = 0
    for (let i = snakeStartSeg; i < this.state.points.length - 1; i++) {
      const snakeSeg = [this.state.points[i], this.state.points[i + 1]]
      // This segment should be in the new region
      segmentsFromSnake.push(snakeSeg)

      for (const [k, tSeg] of tSegments.entries()) {
        // Find next point and territory segment where part of snake segment intersects territory
        stopPoint = getLineIntersection(
          snakeSeg[0],
          snakeSeg[1],
          tSeg[0],
          tSeg[1]
        )
        if (stopPoint) {
          territoryStopSeg = k
          break
        }
      }
    }

    if (!stopPoint) return

    // Now we have both points where the snake intersects the territory
    // so we need to trace the territory to find existing segments of new area
    const lowerTerritorySeg = Math.min(territoryStartSeg, territoryStopSeg),
      upperTerritorySeg = Math.max(territoryStartSeg, territoryStopSeg)

    console.log(lowerTerritorySeg, upperTerritorySeg)

    const segmentsFromTerritory = tSegments.slice(
      lowerTerritorySeg,
      upperTerritorySeg + 1
    )

    // Adjust segments from territory and snake to start/end at the intersection points
    segmentsFromTerritory[0][0] = startPoint
    segmentsFromTerritory[segmentsFromTerritory.length - 1][1] = stopPoint
    segmentsFromSnake[0][0] = startPoint
    segmentsFromSnake[segmentsFromSnake.length - 1][1] = stopPoint

    // Now, we combine the segments and start/end points in order to get the new region polygon
    const totalNewRegionPolygon = [
      startPoint, // First the first intersection point
      ...segmentsFromTerritory.map(seg => seg[0]), // Then trace along the territory
      stopPoint, // Then the second intersection point
      ...segmentsFromSnake.map(seg => seg[0]), // Finally add points between both points on the snake
    ]

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
        }
      }

      // // If both head and tail are in territory, we might be able to create new territory
      // if (this.pointIsInTerritory(this.tail)) {

      // }
    }
  }
}
