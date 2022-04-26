import GameState, { Point } from "./GameState";
import GameRoom from "./GameRoom";
import * as snakeBehaviour from "shared/snake";
import CONFIG from "shared/config";

export default class GameController {
  room: GameRoom
  state: GameState

  constructor(room: GameRoom) {
    this.room = room
    this.state = room.state
  }

  loop (delta: number) {
    this.state.players.forEach(p => {
      if (p.snake) {
        const newHead = snakeBehaviour.moveHead(
          p.snake.head,
          p.snake.direction,
          CONFIG.snake.baseSpeed,
          delta
        )
        p.snake.points.setAt(0, new Point(newHead.x, newHead.y))
      }
    })
  }
}
