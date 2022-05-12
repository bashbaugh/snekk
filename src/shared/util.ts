/** Generate a random integer */
export const randomInt = (minmax: number, max?: number): number =>
  Math.floor(Math.random() * ((max || minmax) - (max ? minmax : 0) + 1)) +
  (max ? minmax : 0)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpPoint = (a: XY, b: XY, t: number, round?: boolean) => ({
  x: round ? Math.round(lerp(a.x, b.x, t)) : lerp(a.x, b.x, t),
  y: round ? Math.round(lerp(a.y, b.y, t)) : lerp(a.y, b.y, t),
})

// https://stackoverflow.com/a/53577159/8748307
/** Get standard deviation of array */
export function calcStandardDev(array: number[]) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(
    array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n
  )
}

/** Convert HSL (0-360, 0-1, 0-1) to RGB */
export const hslToHex: {
  (h: number, s: number, l: number): number
  (h: number, s: number, l: number, str: true): string
} = (h, s, l, str = false) => {
  let a = s * Math.min(l, 1 - l)
  let f = (n: number, k = (n + h / 30) % 12) =>
    l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  const rgb = [f(0), f(8), f(4)]
  const hexString = rgb.reduce(
    (a, b) => a + Math.floor(b * 255).toString(16),
    ''
  )
  return str ? hexString : (parseInt(hexString, 16) as any)
}

export const asyncDelay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

export const mean = (arr: number[]) =>
  arr.reduce((a, b) => a + b, 0) / arr.length

/** Format milliseconds as minutes:seconds */
export const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

/** Map a number from one range to another */
export const mapNumRange = (
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
) => ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin

export const mapPointRange = (
  point: XY,
  fromMin: number,
  fromMax: number,
  toMin: XY,
  toMax: XY
) => ({
  x: mapNumRange(point.x, fromMin, fromMax, toMin.x, toMax.x),
  y: mapNumRange(point.y, fromMin, fromMax, toMin.y, toMax.y),
})
