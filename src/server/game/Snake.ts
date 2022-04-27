import SnakeBehaviour from 'shared/game/snake'
import { PlayerState, SnakeState } from '../../shared/serverState'

export default class Snake extends SnakeBehaviour {
  player: PlayerState

  constructor(player: PlayerState) {
    const snake = new SnakeState(2000)
    super(snake)
    this.player = player
    player.snake = snake
  }
}
