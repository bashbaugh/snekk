interface XY {
  x: number
  y: number
}

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

/** Up | Right | Down | Left  */
type Direction = 1 | 2 | 3 | 4
