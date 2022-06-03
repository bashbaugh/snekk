import SnakeBehaviour from 'shared/snake'
import { PlayerState, SnakeState } from 'shared/serverState'
import { Message, MESSAGETYPE } from 'types/networking'
import GameController from './GameController'
import { getLineIntersection, polygonArea, polygonUnion } from 'shared/geometry'
import CONFIG from 'config'
import { DeathReason } from 'types/game'

export default class Snake extends SnakeBehaviour {
  player: PlayerState
  game: GameController

  constructor(gameController: GameController, player: PlayerState) {
    const snake = new SnakeState(
      gameController.getRandomPoint(
        CONFIG.snake.territoryStartMargin + CONFIG.arena.spawnPadding,
        true
      ),
      player.clientId
    )
    super(snake)
    this.player = player
    this.game = gameController
    player.snake = snake
    this.state.territory = polygonUnion(this.state.tRegions.map(r => r.p)).map(
      r => this.state.makePoint(r)
    )
  }

  update(delta: number) {
    this.updateHead(delta)
    this.checkFoodCollisions()
    this.updateLength(delta)
    this.updateTail()
    this.checkPlayerCollisions()
    this.updateTerritory() && this.game.clipTerritories(this.player.clientId)
    this.checkTerritoryCollisions()
    this.updateScore()
  }

  checkPlayerCollisions() {
    // Ensure that player is within bounds
    if (!this.game.pointIsInArena(this.head)) {
      this.game.killSnake(this.player.clientId, DeathReason.wall_collision)
      return
    }

    // Check for collisions of snake's head with other segments and players
    const [a1, a2] = [this.state.points[0], this.state.points[1]]

    for (const [id, player] of this.game.state.players) {
      if (!player.snake) continue
      const isSelf = id === this.player.clientId

      // Don't check against first two segments if checking self
      const startIndex = isSelf ? 2 : 0

      for (let i = startIndex; i < player.snake.points.length - 1; i++) {
        const [b1, b2] = [player.snake.points[i], player.snake.points[i + 1]]
        if (!b1 || !b2) continue
        const intersection = getLineIntersection(a1, a2, b1, b2)
        if (intersection) {
          // If the snake is intersecting in its own territory, we ignore it
          if (isSelf && this.pointIsInTerritory(intersection)) continue

          this.game.killSnake(
            this.player.clientId,
            isSelf ? DeathReason.self_collision : DeathReason.player_collision,
            // Include killer ID if it wasn't a self collision
            !isSelf ? player.clientId : undefined
          )

          if (!isSelf) player.snake.kills++

          return
        }
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

  checkTerritoryCollisions() {
    // CHeck if this snake is within any other snake's territory
    this.state.headTerritory = undefined
    for (const [id, player] of Object.entries(this.game.players)) {
      if (!player.snake || id === this.player.clientId) continue

      if (player.snake.pointIsInTerritory(this.head)) {
        this.state.headTerritory = id
        break
      }
    }
  }

  updateScore() {
    // Composite of territory, length, and kills
    const tScore =
      (this.state.tRegions as any[]).reduce<number>(
        (score: number, region: SRegion) => score + polygonArea(region.p),
        0
      ) * CONFIG.snake.tScoreMultiplier

    const lScore = this.state.length * CONFIG.snake.lScoreMultiplier
    const kScore = this.state.kills * CONFIG.snake.kScoreMultiplier

    // TODO calc this automatically
    const minScore = 490

    this.state.score = Math.max(0, tScore + lScore + kScore - minScore)
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
