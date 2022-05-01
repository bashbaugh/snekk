import SnakeBehaviour from 'shared/snake'
import { PlayerState, SnakeState } from 'shared/serverState'
import { randomInt } from 'shared/util'
import { Message, MESSAGETYPE } from 'types/networking'
import GameController from './GameController'

export default class Snake extends SnakeBehaviour {
  player: PlayerState
  game: GameController

  constructor(gameController: GameController, player: PlayerState) {
    const spawn = { x: randomInt(800), y: randomInt(500) }
    const snake = new SnakeState(spawn)
    super(snake)
    this.player = player
    this.game = gameController
    player.snake = snake
  }

  update(delta: number) {
    this.updateHead(delta)
    this.updateTail()
  }

  turn(data: Message[MESSAGETYPE.TURN]) {
    this.turnHead(data.d)

    // TODO handle out of order turns
    // Discard this turn if the point index doesn't match up and patch the client to cancel the turn
    // if (this.head.s !== data.s) return

    // // Make sure that we're turning only on the correct axis
    // if (
    //   ((data.d === 1 || data.d === 3) && data.y !== this.head.y) ||
    //   ((data.d === 2 || data.d === 4) && data.x !== this.head.x)
    // ) {
    //   console.log('MISMATCH', data.d, data.x, data.y, this.head.x, this.head.y)
    //   return
    // }

    // if (this.state.direction * data.d === 3 || this.state.direction * data.d === 8) return
  }

  die() {}
}
