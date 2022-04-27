import GameState, { PlayerState, Point, SnakeState } from 'shared/serverState'
import GameRoom from './GameRoom'
import { MESSAGETYPE } from 'types/networking'
import { Client } from 'colyseus'
import Snake from './Snake'

export default class GameController {
  room: GameRoom
  state: GameState

  players: Record<
    string,
    {
      snake: Snake
    }
  > = {}

  constructor(room: GameRoom) {
    this.room = room
    this.state = room.state
  }

  addPlayer(client: Client) {
    const playerState = new PlayerState()
    this.players[client.id] = {
      snake: new Snake(playerState),
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

  loop(delta: number) {
    for (const [id, player] of Object.entries(this.players)) {
      player.snake.update(delta)
    }
  }

  onPlayerTurn(client: Client, direction: Direction) {
    this.players[client.id].snake.turn(direction)
  }
}
