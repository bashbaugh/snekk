export const moveHead = (h: XY, d: Direction, speed: number, delta: number) => {
  const head = { x: h.x, y: h.y }
  if (d === 1) head.y -= speed * delta
  if (d === 2) head.x += speed * delta
  if (d === 3) head.y += speed * delta
  if (d === 4) head.x -= speed * delta
  return head
}
