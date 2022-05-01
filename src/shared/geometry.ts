const CCW = (p1: XY, p2: XY, p3: XY) =>
  (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x)

/** Check if two line segments are intersecting (fails on colinearity which is intended) */
export function linesAreIntersecting(a1: XY, a2: XY, b1: XY, b2: XY) {
  return (
    CCW(a1, b1, b2) != CCW(a2, b1, b2) && CCW(a1, a2, b1) != CCW(a1, a2, b2)
  )
}
