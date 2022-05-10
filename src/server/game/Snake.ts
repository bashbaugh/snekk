import SnakeBehaviour from 'shared/snake'
import { PlayerState, SnakeState } from 'shared/serverState'
import { Message, MESSAGETYPE } from 'types/networking'
import GameController from './GameController'
import { getLineIntersection, polygonArea } from 'shared/geometry'
import CONFIG from 'config'
import { DeathReason } from 'types/game'

export default class Snake extends SnakeBehaviour {
  player: PlayerState
  game: GameController

  constructor(gameController: GameController, player: PlayerState) {
    const snake = new SnakeState(gameController.getRandomPoint())
    super(snake)
    this.player = player
    this.game = gameController
    player.snake = snake
    this.mergeTerritory()
  }

  update(delta: number) {
    this.updateHead(delta)
    this.checkFoodCollisions()
    this.updateTail()
    this.checkPlayerCollisions()
    this.updateTerritory()
    this.updateScore()
  }

  checkPlayerCollisions() {
    // Check for collisions of snake's head with other segments
    const [a1, a2] = [this.state.points[0], this.state.points[1]]
    for (let i = 2; i < this.state.points.length - 1; i++) {
      const [b1, b2] = [this.state.points[i], this.state.points[i + 1]]
      const intersection = getLineIntersection(a1, a2, b1, b2)
      // If the snake is intersecting in its own territory, we ignore it
      if (intersection && !this.pointIsInTerritory(intersection)) {
        this.game.killSnake(this.player.clientId, DeathReason.self_collision)
      }
    }
  }

  checkFoodCollisions() {
    this.game.state.food.forEach((f, i) => {
      const headDist = Math.hypot(this.head.x - f.x, this.head.y - f.y)
      if (headDist < CONFIG.food.collisionRadius) {
        this.state.length += CONFIG.food.growAmount
        this.game.state.food.deleteAt(i)
      }
    })
  }

  updateScore() {
    this.state.score =
      (this.state.tRegions as any[]).reduce<number>(
        (score: number, region: SRegion) => score + polygonArea(region.p),
        0
      ) * CONFIG.snake.scoreMultiplier
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
