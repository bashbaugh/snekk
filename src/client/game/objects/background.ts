import Game from '../game'
import BaseObject from './baseObject'
import * as PIXI from 'pixi'

export default class Background extends BaseObject {
  sprite: PIXI.TilingSprite

  constructor(game: Game) {
    super(game, game.bgLayer)

    const t = PIXI.Texture.from('pattern_bg')
    this.sprite = new PIXI.TilingSprite(t)
    this.sprite.mask = this.graphics

    this.container.addChild(this.sprite)
  }

  public disableClipping() {
    this.sprite.mask = null
  }

  update() {}

  draw() {
    const o = this.game.getViewOffset()
    this.sprite.width = this.game.pixi.screen.width
    this.sprite.height = this.game.pixi.screen.height
    this.sprite.tilePosition.x = -o.x
    this.sprite.tilePosition.y = -o.y

    const clipGraphics = this.graphics
    clipGraphics.clear()
    const c = this.game.getArenaBounds()
    if (!c) return
    clipGraphics.drawRect(c.xl, c.yt, c.w, c.h)
  }
}
