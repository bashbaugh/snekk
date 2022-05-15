import Game from '../game'
import BaseObject from './baseObject'
import * as PIXI from 'pixi'

export default class Background extends BaseObject {
  sprite: PIXI.TilingSprite

  constructor(game: Game) {
    super(game, game.bgLayer)

    const t = PIXI.Texture.from('pattern_bg')
    this.sprite = new PIXI.TilingSprite(t)

    this.container.addChild(this.sprite)
  }

  update() {}

  draw() {
    const o = this.game.getViewOffset()
    this.sprite.width = this.game.app.scaledWidth
    this.sprite.height = this.game.app.scaledHeight
    this.sprite.tilePosition.x = -o.x
    this.sprite.tilePosition.y = -o.y
  }
}
