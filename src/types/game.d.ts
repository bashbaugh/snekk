interface XY {
  x: number
  y: number
}

/** XY with a Sequence number in order to reliably keep the right points in the right spots in snakes */
type XYS = XY & {
  s: number
}

/** Up | Right | Down | Left  */
type Direction = 1 | 2 | 3 | 4
