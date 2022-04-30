/** Generate a random integer */
export const randomInt = (minmax: number, max?: number): number =>
  Math.floor(Math.random() * ((max || minmax) - (max ? minmax : 0) + 1)) +
  (max ? minmax : 0)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpPoint = (a: XY, b: XY, t: number) => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
})

// https://stackoverflow.com/a/53577159/8748307
/** Get standard deviation of array */
export function calcStandardDev (array: number[]) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}
