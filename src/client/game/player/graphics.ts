import Snake from './snake'
import * as PIXI from 'pixi'
import { hslToHex } from 'shared/util'
import CONFIG from 'config'
import Game from '../game'
import { defaultTerritorySkin, TSkinName } from 'shared/skins'
import {
  getBoostEmitterConf,
  getRegionEmitterConf,
  getTerritoryCutEmitterConf,
} from './particles'

export default class PlayerGraphics {
  private snake: Snake
  private game: Game
  private tLayer: PIXI.Container
  private sLayer: PIXI.Container
  private tContainer = new PIXI.Container()
  private sContainer = new PIXI.Container()
  private snakeGraphics = new PIXI.Graphics()
  private tGraphics = new PIXI.Graphics()
  private tSpriteMask = new PIXI.Graphics()

  private _tSkin?: TSkinName
  private tSprite!: PIXI.TilingSprite

  private headParticlesContainer = new PIXI.Container()
  private boostEmitter: PIXI.particles.Emitter
  private tCuttingEmitter?: PIXI.particles.Emitter

  private territoryParticlesContainer: PIXI.Container

  private label = new PIXI.Text('', {
    fontSize: 16,
    fontWeight: 'bold',
    fill: '#ffffffaa',
    align: 'center',
  })

  constructor(snake: Snake, game: Game) {
    this.snake = snake
    this.game = game
    this.tLayer = game.territoryLayer
    this.sLayer = game.snakeLayer
    this.tLayer.addChild(this.tContainer)
    this.sLayer.addChild(this.sContainer)

    // Territory
    this.tContainer.addChild(this.tSpriteMask)
    this.tContainer.addChild(this.tGraphics)
    this.tSkin = defaultTerritorySkin
    this.territoryParticlesContainer = new PIXI.Container()
    this.tLayer.addChild(this.territoryParticlesContainer)

    // Snake
    this.sContainer.addChild(this.snakeGraphics)
    this.sContainer.addChild(this.label)

    // Boost particles
    this.sContainer.addChild(this.headParticlesContainer)
    this.boostEmitter = new PIXI.particles.Emitter(
      this.headParticlesContainer,
      getBoostEmitterConf(this.snake.state.hue, this.game.app.graphicsMode)
    )

    if (this.game.app.graphicsMode === 'HIGH')
      this.tCuttingEmitter = new PIXI.particles.Emitter(
        this.territoryParticlesContainer,
        getTerritoryCutEmitterConf()
      )
  }

  cleanup() {
    this.clear()
    this.tLayer.removeChild(this.tContainer)
    this.sLayer.removeChild(this.sContainer)
    this.tCuttingEmitter?.cleanup()
    this.tContainer.destroy({ children: true })
  }

  clear() {
    this.snakeGraphics.clear()
    this.tGraphics.clear()
    this.tSpriteMask.clear()
  }

  set labelText(text: string) {
    if (this.label.text !== text) this.label.text = text
  }

  set emitBoostParticles(emit: boolean) {
    this.boostEmitter!.emit = emit
  }

  set emitTerritoryCutParticles(emit: boolean) {
    if (this.tCuttingEmitter) this.tCuttingEmitter.emit = emit
  }

  drawSnake() {
    const g = this.snakeGraphics

    // Draw lines
    const snakeWidth =
      CONFIG.g.snakeMinWidth +
      (this.snake.state.length / 5000) *
        (CONFIG.g.snakeMaxWidth - CONFIG.g.snakeMinWidth)

    let pointsVisible = false
    const points = this.snake.state.points.map(p => {
      const vp = this.game.getViewRelativePoint(p)
      if (this.game.pointInView(vp)) pointsVisible = true
      return vp
    })

    // Cull snake
    if (!pointsVisible) {
      this.label.visible = false
      return
    }

    g.lineStyle({
      width: snakeWidth,
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

    // Draw head + label
    const headPos = this.game.getViewRelativePoint(this.snake.head)
    this.label.visible = true
    this.label.position.set(headPos.x - this.label.width / 2, headPos.y + 20)
    g.beginFill(0xffffff)
    g.lineStyle()
    g.drawCircle(headPos.x, headPos.y, snakeWidth / 2 + 2)
    g.endFill()

    // Offset the container so that particles are rendered at the correct point
    const o = this.game.getViewOffset()
    this.headParticlesContainer.position.set(-o.x, -o.y)
    this.boostEmitter.updateOwnerPos(this.snake.head.x, this.snake.head.y)
    this.boostEmitter.update(this.game.pixi.ticker.deltaMS / 1000)
    this.tCuttingEmitter?.updateOwnerPos(this.snake.head.x, this.snake.head.y)
    this.tCuttingEmitter?.update(this.game.pixi.ticker.deltaMS / 1000)
  }

  set tSkin(skin: TSkinName) {
    if (skin === this._tSkin) return
    if (this.tSprite) this.tContainer.removeChild(this.tSprite)
    this._tSkin = skin
    this.tSprite = new PIXI.TilingSprite(PIXI.Texture.from(skin), 100, 100)
    this.tSprite.alpha = 0.2
    this.tSprite.mask = this.tSpriteMask
    this.tContainer.addChild(this.tSprite)
  }

  drawTerritory() {
    let territoryVisible = false
    const polygonPoints = this.snake.state.territory
      .map(p => {
        const rp = this.game.getViewRelativePoint(p)
        if (this.game.pointInView(rp)) territoryVisible = true
        return [rp.x, rp.y]
      })
      .flat()
    
    // Territory not visible, cull it
    if (!territoryVisible) return

    let tColor = hslToHex(
      this.snake.state.hue,
      CONFIG.g.territorySaturation,
      CONFIG.g.territoryLightness
    )
    this.tGraphics.beginFill(tColor)
    this.tGraphics.drawPolygon(polygonPoints)
    this.tGraphics.endFill()

    const o = this.game.getViewOffset()
    this.tSprite.width = this.game.app.scaledWidth
    this.tSprite.height = this.game.app.scaledHeight
    this.tSprite.tilePosition.x = -o.x
    this.tSprite.tilePosition.y = -o.y
    this.tSpriteMask.beginFill()
    this.tSpriteMask.drawPolygon(polygonPoints)
    this.tSpriteMask.endFill()

    // Region particles container
    this.territoryParticlesContainer.position.set(-o.x, -o.y)
  }

  emitRegionParticles(spawnPolygon: XY[]) {
    if (this.game.app.graphicsMode !== 'LOW')
      new PIXI.particles.Emitter(
        this.territoryParticlesContainer,
        getRegionEmitterConf(spawnPolygon, this.snake.state.hue)
      ).playOnceAndDestroy()
  }
}
