import { Pair, union as pUnion, difference as pDiff } from 'polygon-clipping'

// const CCW = (p1: XY, p2: XY, p3: XY) =>
//   (p3.y - p1.y) * (p2.x - p1.x) > (p2.y - p1.y) * (p3.x - p1.x)

/** Check if two line segments are intersecting (fails on colinearity which is intended) */
// export function linesIntersect(a1: XY, a2: XY, b1: XY, b2: XY) {
//   return (
//     CCW(a1, b1, b2) != CCW(a2, b1, b2) && CCW(a1, a2, b1) != CCW(a1, a2, b2)
//   )
// }

/** Get the intersection point of two line segments */
export function getLineIntersection(
  a1: XY,
  a2: XY,
  b1: XY,
  b2: XY
): XY | false {
  // http://paulbourke.net/geometry/pointlineplane/
  // Check if none of the lines are of length 0
  if ((a1.x === a2.x && a1.y === a2.y) || (b1.x === b2.x && b1.y === b2.y))
    return false
  const denom = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y)
  // Lines are parallel
  if (denom === 0) return false
  const ua =
    ((b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x)) / denom
  const ub =
    ((a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x)) / denom
  // is the intersection along the segments
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return false
  // Return a object with the x and y coordinates of the intersection
  const x = a1.x + ua * (a2.x - a1.x)
  const y = a1.y + ua * (a2.y - a1.y)
  return { x, y }
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

    if (yi > p.y != yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi)
      inside = !inside
  }

  // return carefulEdgeCheck ? inside || pointOnPolygonEdge(p, gon) : inside
  return inside
}

export function polygonUnion(polygons: XY[][]): XY[] {
  const inputs = polygons.map(p => [p.map(q => [q.x, q.y] as Pair)])
  // TODO fix this to include other polygons from union:
  const result = pUnion(inputs[0], ...inputs.slice(1))
  // First polygon, excluding holes"
  return result[0][0].map(q => ({ x: q[0], y: q[1] }))
}

// TODO FIX - this is not working?
export function polygonDiff(minuend: XY[][], subtrahend: XY[][]): XY[][] {
  const minuendIn = minuend.map(p => [p.map(q => [q.x, q.y] as Pair)])
  const subtrahendIn = subtrahend.map(p => [p.map(q => [q.x, q.y] as Pair)])
  // TODO fix this to include other polygons from union:
  const result = pDiff(minuendIn, subtrahendIn)
  return result[0]?.map(p => p.map(q => ({ x: q[0], y: q[1] })))
}

/** Get the total area of a polygon */
export function polygonArea(polygon: XY[]): number {
  // https://stackoverflow.com/a/33670691/8748307
  let total = 0
  for (let i = 0, l = polygon.length; i < l; i++) {
    var addX = polygon[i].x
    var addY = polygon[i == polygon.length - 1 ? 0 : i + 1].y
    var subX = polygon[i == polygon.length - 1 ? 0 : i + 1].x
    var subY = polygon[i].y
    total += addX * addY * 0.5
    total -= subX * subY * 0.5
  }
  return Math.abs(total)
}

/** Get the bounding rect of a polygon */
export function polygonBoundingRect(polygon: XY[]): XY & {
  width: number
  height: number
} {
  let minX = 0
  let minY = 0
  let maxX = 0
  let maxY = 0
  for (let i = 0, l = polygon.length; i < l; i++) {
    minX = Math.min(minX, polygon[i].x)
    minY = Math.min(minY, polygon[i].y)
    maxX = Math.max(maxX, polygon[i].x)
    maxY = Math.max(maxY, polygon[i].y)
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
}
