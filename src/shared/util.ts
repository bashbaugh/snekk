/** Generate a random integer */
export const randomInt = (minmax: number, max?: number): number =>
  Math.floor(Math.random() * ((max || minmax) - (max ? minmax : 0) + 1)) +
  (max ? minmax : 0)
