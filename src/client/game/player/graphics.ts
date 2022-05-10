import Snake from './snake'
import * as PIXI from 'pixi'
import { hslToHex, roundToNearest } from 'shared/util'
import CONFIG from 'config'
import Game from '../game'
import { polygonBoundingRect } from 'shared/geometry'

export default class PlayerGraphics {
  private snake: Snake
  private game: Game
  private container: PIXI.Container
  private snakeGraphics: PIXI.Graphics
  private tGraphics: PIXI.Graphics
  private tSpriteMask: PIXI.Graphics

  private tTexture: PIXI.Texture
  private tSprite: PIXI.TilingSprite

  constructor(snake: Snake, game: Game, container: PIXI.Container) {
    this.snake = snake
    this.game = game
    this.container = container

    this.tGraphics = new PIXI.Graphics()
    this.tSpriteMask = new PIXI.Graphics()
    this.container.addChild(this.tGraphics)
    this.tTexture = PIXI.Texture.from('pattern_squares')
    this.tSprite = new PIXI.TilingSprite(this.tTexture, 100, 100)
    this.container.addChild(this.tSprite as any)
    this.tSprite.mask = this.tSpriteMask

    this.snakeGraphics = new PIXI.Graphics()
    this.container.addChild(this.snakeGraphics)
  }

  cleanup() {
    this.clear()
  }

  clear() {
    this.snakeGraphics.clear()
    this.tGraphics.clear()
    this.tSpriteMask.clear()
  }

  drawSnake() {
    const g = this.snakeGraphics
    const points = this.snake.state.points.map(p =>
      this.game.getViewRelativePoint(p)
    )
    g.lineStyle({
      width: 7,
      color: hslToHex(
        this.snake.state.hue,
        CONFIG.g.snakeSaturation,
        CONFIG.g.snakeLightness
      ),
      cap: PIXI.LINE_CAP.ROUND,
      join: PIXI.LINE_JOIN.ROUND,
    })
    g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y)
    }
  }

  drawTerritory() {
    const g = this.tGraphics
    let tColor = hslToHex(
      this.snake.state.hue,
      CONFIG.g.territorySaturation,
      CONFIG.g.territoryLightness
    )
    g.beginFill(tColor)
    const polygonPoints = this.snake.state.territory
      .map(p => {
        const rp = this.game.getViewRelativePoint(p)
        return [rp.x, rp.y]
      })
      .flat()
    g.drawPolygon(polygonPoints)
    g.endFill()

    // TODO FIX 
    const rect = polygonBoundingRect(this.snake.state.territory)
    const s = this.game.getViewRelativePoint(rect)

    this.tSprite.x = s.x
    this.tSprite.y = s.y
    this.tSprite.width = rect.width + this.tTexture.width
    this.tSprite.height = rect.height + this.tTexture.height
    this.tSpriteMask.beginFill()
    this.tSpriteMask.drawPolygon(polygonPoints)
    this.tSpriteMask.endFill()
  }
}
