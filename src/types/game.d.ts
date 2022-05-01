interface XY {
  x: number
  y: number
}

/** Snake Point with a Sequence number in order to reliably keep the right points in the right spots in snakes. d is for direction in non-head points */
type SPoint = XY & {
  d: Direction
  s: number
}

/** Up | Right | Down | Left  */
type Direction = 1 | 2 | 3 | 4
