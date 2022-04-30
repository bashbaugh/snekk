import GameState, { PlayerState, Point, SnakeState } from 'shared/serverState'
import GameRoom from './GameRoom'
import { Message, MESSAGETYPE } from 'types/networking'
import { Client } from 'colyseus'
import Snake from './Snake'

export default class GameController {
  room: GameRoom
  state: GameState

  players: Record<
    string,
    {
      snake: Snake
      client: Client
    }
  > = {}

  constructor(room: GameRoom) {
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

  loop(delta: number) {
    for (const [id, player] of Object.entries(this.players)) {
      player.snake.update(delta)
    }
    this.state.ts = this.room.clock.currentTime
  }

  onPlayerTurn(client: Client, data: Message[MESSAGETYPE.TURN]) {
    this.players[client.id].snake.turn(data)
  }
}
