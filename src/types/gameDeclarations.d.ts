interface XY {
  x: number
  y: number
}

/** Up | Right | Down | Left  */
type Direction = 1 | 2 | 3 | 4

/** Snake Point
 *  s: sequence number to identify turns.
 *  d: direction the point turns the snake
 *  t: server timestamp when the turn was received or point was moved
 */
type SPoint = XY & {
  d: Direction
  s: number
  t: number
}

declare enum SRegionType {
  ADD,
  SUBTRACT,
}

/** Represents a 2d region in snake's territory */
interface SRegion {
  /** Timestamp of region creation */
  t: number
  // /** Type of region: true is subtract from, false is add to territory */
  // s?: boolean
  /** Points defining region. First point is also point at which shape is closed. */
  p: XY[]
}
