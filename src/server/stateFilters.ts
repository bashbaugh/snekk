import GameState, { Food, SnakeState } from 'shared/serverState'
import { Client } from 'colyseus'
import CONFIG from 'config'

const isInClientRange = (client: Client, state: GameState, point: XY) => {
  const playerHead = state.players.get(client.sessionId)?.snake?.points[0]
  if (!playerHead) return false
  const m = CONFIG.server.networkCullMargin
  const xl = playerHead.x - CONFIG.targetScale.width / 2 - m
  const xr = playerHead.x + CONFIG.targetScale.width / 2 + m
  const yt = playerHead.y - CONFIG.targetScale.height / 2 - m
  const yb = playerHead.y + CONFIG.targetScale.height / 2 + m

  return xl <= point.x && point.x <= xr && yt <= point.y && point.y <= yb
}

/** Filter off-screen snakes from being sent to client */
export function snakePointsFilter(
  this: SnakeState,
  client: Client,
  points: SnakeState['points'],
  state: GameState
) {
  if (client.sessionId === this.clientId) return true // Always update self
  // return points.some(p => isInClientRange(client, state, p))
  return true
}

export function tRegionsFilter(
  this: SnakeState,
  client: Client,
  tRegions: SnakeState['tRegions'],
  state: GameState
) {
  return true
}

export function territoryFilter(
  this: SnakeState,
  client: Client,
  territory: SnakeState['territory'],
  state: GameState
) {
  return true
}

export function foodFilter(
  client: Client,
  index: number,
  food: Food,
  state: GameState
) {
  return isInClientRange(client, state, food)
}
