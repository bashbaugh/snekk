import * as PIXI from 'pixi'
import Game from '../game'

export default abstract class BaseObject {
  layer: PIXI.Container
  container: PIXI.Container
  graphics: PIXI.Graphics

  constructor(public game: Game, layer: PIXI.Container) {
    this.container = new PIXI.Container()
    this.layer = layer || game.territoryLayer
    this.layer.addChild(this.container)
    this.graphics = new PIXI.Graphics()
    this.container.addChild(this.graphics)
  }

  cleanup() {
    this.graphics.clear()
    this.layer.removeChild(this.container)
  }

  abstract update(delta: number): void

  abstract draw(): void
}
