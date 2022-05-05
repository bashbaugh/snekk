const CCW = (p1: XY, p2: XY, p3: XY) =>
  (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x)

/** Check if two line segments are intersecting (fails on colinearity which is intended) */
export function linesIntersect(a1: XY, a2: XY, b1: XY, b2: XY) {
  return (
    CCW(a1, b1, b2) != CCW(a2, b1, b2) && CCW(a1, a2, b1) != CCW(a1, a2, b2)
  )
}

/** Check if a point is within a polygon */
export function pointInsidePolygon(p: XY, gon: XY[]) {
  // https://github.com/substack/point-in-polygon/blob/master/flat.js

  let inside = false
  for (let i = 0, j = gon.length - 1; i < gon.length; j = i++) {
    const xi = gon[i].x,
      yi = gon[i].y
    const xj = gon[j].x,
      yj = gon[j].y

    const intersect =
      yi > p.y != yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}
