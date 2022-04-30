import SnakeBehaviour from 'shared/game/snake'
import { PlayerState, SnakeState } from 'shared/serverState'
import { Message, MESSAGETYPE } from 'types/networking'
import GameController from './GameController'

export default class Snake extends SnakeBehaviour {
  player: PlayerState
  game: GameController

  constructor(gameController: GameController, player: PlayerState) {
    const snake = new SnakeState({ x: 50, y: 50 })
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
    // Discard this turn if the point index doesn't match up and patch the client to cancel the turn
    if (this.head.s !== data.s)
      return this.game.patchClientImmediate(this.player.clientId)
    // Make sure that we're turning only on the correct axis
    if (
      ((data.d === 1 || data.d === 3) && data.y !== this.head.y) ||
      ((data.d === 2 || data.d === 4) && data.x !== this.head.x)
    )
      return this.game.patchClientImmediate(this.player.clientId)

    
  }
}
