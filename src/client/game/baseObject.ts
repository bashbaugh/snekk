import * as PIXI from 'pixi'
import Game from './game'

export default abstract class BaseObject {
  game: Game
  container: PIXI.Container
  graphics: PIXI.Graphics

  constructor(game: Game) {
    this.game = game
    this.container = new PIXI.Container()
    game.app.stage.addChild(this.container)
    this.graphics = new PIXI.Graphics()
    this.game.gameContainer.addChild(this.graphics)
  }

  cleanup() {
    this.graphics.clear()
    this.game.gameContainer.removeChild(this.container)
  }

  abstract update(delta: number): void

  abstract draw(): void
}
