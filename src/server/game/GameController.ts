import GameState, { Food, PlayerState } from 'shared/serverState'
import ArenaRoom from './ArenaRoom'
import { Message, MESSAGETYPE } from 'types/networking'
import { Client } from 'colyseus'
import Snake from './Snake'
import { DeathReason } from 'types/game'
import { randomInt } from 'shared/util'
import CONFIG from 'config'
import { getLineIntersection } from 'shared/geometry'

export default class GameController {
  room: ArenaRoom
  state: GameState

  players: Record<
    string,
    {
      snake?: Snake
      client: Client
    }
  > = {}

  constructor(room: ArenaRoom) {
    this.room = room
    this.state = room.state
  }

  getRandomPoint() {
    return {
      x: randomInt(this.state.arenaSize),
      y: randomInt(this.state.arenaSize),
    }
  }

  addPlayer(client: Client) {
    const playerState = new PlayerState(client.id)
    this.players[client.id] = {
      client,
    }
    this.state.players.set(client.id, playerState)
  }

  spawnSnake(playerId: string) {
    // Create a new snake instance and spawn it
    const p = this.players[playerId]
    p.snake = new Snake(this, this.state.players.get(playerId)!)
    const { x, y } = p.snake.state.points[0]
    p.client.send(MESSAGETYPE.SPAWN, {
      s: p.snake.state,
    })
  }

  removePlayer(client: Client) {
    delete this.players[client.id]
    this.state.players.delete(client.id)
  }

  killSnake(id: string, cause: DeathReason, killer?: string) {
    const player = this.players[id]
    if (!player) return
    player.snake?.die()
    const pState = this.state.players.get(id)
    if (!pState?.snake) return
    pState.snake = undefined

    const deathMsg: Message[MESSAGETYPE.DEATH] = {
      c: cause,
      p: id,
      k: killer,
    }
    player.client.send(MESSAGETYPE.DEATH, deathMsg)
  }

  // checkCollisions() {
  //   // Check for collisions against other snakes
  //   for (const [id, player] of Object.entries(this.players)) {
  //     if (!player.snake) continue

  //     // Check collisions against other players:
  //     // First segment to check is player's head
  //     const [a1, a2] = player.snake.state.points
  //     for (const [id2, player2] of Object.entries(this.players)) {
  //       if (id === id2 || !player2.snake) continue // Skip self
  //       const points = player2.snake.state.points
  //       // Check player's head against all segments of other player
  //       for (let i = 0; i < points.length - 1; i++) {
  //         const [b1, b2] = [points[i], points[i + 1]]
  //         if (getLineIntersection(a1, a2, b1, b2)) {
  //           // Player collided
  //           this.killSnake(id, DeathReason.player_collision, id2)
  //         }
  //       }
  //     }
  //   }
  // }

  loop(delta: number) {
    for (const [id, player] of Object.entries(this.players)) {
      player.snake?.update(delta)
    }

    this.state.ts = this.room.clock.currentTime
  }

  addFood() {
    this.state.food.push(new Food(this.getRandomPoint(), randomInt(360)))
  }

  onPlayerTurn(client: Client, data: Message[MESSAGETYPE.TURN]) {
    this.players[client.id].snake?.turn(data)
  }

  onPlayerBoost(client: Client, boosting: boolean) {
    this.players[client.id].snake?.boost(boosting)
  }
}
