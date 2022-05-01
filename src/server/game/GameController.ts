import GameState, { PlayerState, Point, SnakeState } from 'shared/serverState'
import ArenaRoom from './ArenaRoom'
import { Message, MESSAGETYPE } from 'types/networking'
import { Client } from 'colyseus'
import Snake from './Snake'
import { linesAreIntersecting } from 'shared/geometry'
import { DeathReason } from 'types/game'

export default class GameController {
  room: ArenaRoom
  state: GameState

  players: Record<
    string,
    {
      snake: Snake
      client: Client
    }
  > = {}

  constructor(room: ArenaRoom) {
    this.room = room
    this.state = room.state
  }

  addPlayer(client: Client) {
    const playerState = new PlayerState(client.id)
    this.players[client.id] = {
      snake: new Snake(this, playerState),
      client,
    }
    this.state.players.set(client.id, playerState)
    const { x, y } = playerState.snake!.points[0]
    client.send(MESSAGETYPE.SPAWN, {
      point: { x, y },
    })
  }

  removePlayer(client: Client) {
    delete this.players[client.id]
    this.state.players.delete(client.id)
  }

  killSnake(id: string, cause: DeathReason, killer?: string) {
    const player = this.players[id]
    if (!player) return
    player.snake.die()
    delete this.state.players.get(id)?.snake
    
    const deathMsg: Message[MESSAGETYPE.DEATH] = {
      c: cause,
      p: id,
      k: killer
    }
    player.client.send(MESSAGETYPE.DEATH, deathMsg)
  }

  checkCollisions() {
    // Check for collisions against other snakes
    for (const [id, player] of Object.entries(this.players)) {
      // First segment to check is player's head
      const [a1, a2] = player.snake.state.points
      
      for (const [id2, player2] of Object.entries(this.players)) {
        if (id === id2) continue // Skip self
        const points = player2.snake.state.points
        // Check player's head against all segments of other player
        for (let i = 0; i < points.length - 1; i++) {
          const [b1, b2] = [points[i], points[i + 1]]
          if (linesAreIntersecting(a1, a2, b1, b2)) {
            // Player collided
            this.killSnake(id, DeathReason.player_collision, id2)
          }
        }
      }
    }
  }

  loop(delta: number) {
    for (const [id, player] of Object.entries(this.players)) {
      player.snake.update(delta)
    }

    this.checkCollisions()

    this.state.ts = this.room.clock.currentTime
  }

  onPlayerTurn(client: Client, data: Message[MESSAGETYPE.TURN]) {
    this.players[client.id].snake.turn(data)
  }
}
