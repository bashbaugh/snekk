import SnakeBehaviour from 'shared/game/snake'
import { PlayerState, SnakeState } from 'shared/serverState'

export default class Snake extends SnakeBehaviour {
  player: PlayerState

  constructor(player: PlayerState) {
    const snake = new SnakeState({x: 50, y: 50})
    super(snake)
    this.player = player
    player.snake = snake
  }

  update (delta: number) {
    this.updateHead(delta)
    this.updateTail()
  }
}
