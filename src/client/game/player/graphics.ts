import Snake from './snake'
import * as PIXI from 'pixi'
import { hslToHex } from 'shared/util'
import CONFIG from 'config'
import Game from '../game'
import { polygonBoundingRect } from 'shared/geometry'

export default class PlayerGraphics {
  private snake: Snake
  private game: Game
  private tLayer: PIXI.Container
  private sLayer: PIXI.Container
  private tContainer: PIXI.Container
  private sContainer: PIXI.Container
  private snakeGraphics: PIXI.Graphics
  private tGraphics: PIXI.Graphics
  private tSpriteMask: PIXI.Graphics

  private tTexture: PIXI.Texture
  private tSprite: PIXI.TilingSprite

  private boostParticlesContainer: PIXI.Container
  private boostEmitter: PIXI.particles.Emitter

  private label: PIXI.Text

  constructor(snake: Snake, game: Game) {
    this.snake = snake
    this.game = game
    this.tLayer = game.territoryLayer
    this.sLayer = game.snakeLayer

    // Containers
    this.tContainer = new PIXI.Container()
    this.sContainer = new PIXI.Container()
    this.tLayer.addChild(this.tContainer)
    this.sLayer.addChild(this.sContainer)

    // Territory
    this.tGraphics = new PIXI.Graphics()
    this.tSpriteMask = new PIXI.Graphics()
    this.tContainer.addChild(this.tGraphics)
    this.tTexture = PIXI.Texture.from('pattern_squares')
    this.tSprite = new PIXI.TilingSprite(this.tTexture, 100, 100)
    this.tContainer.addChild(this.tSprite as any)
    this.tSprite.mask = this.tSpriteMask

    // Snake
    this.snakeGraphics = new PIXI.Graphics()
    this.sContainer.addChild(this.snakeGraphics)
    this.label = new PIXI.Text('', {
      fontSize: 16,
      fontWeight: 'bold',
      fill: '#ffffffaa',
      align: 'center',
    })
    this.sContainer.addChild(this.label)

    // Boost particles
    this.boostParticlesContainer = new PIXI.Container()
    this.sContainer.addChild(this.boostParticlesContainer)
    const boostpEmitterConf: PIXI.particles.EmitterConfigV3 = {
      emit: false,
      lifetime: {
        min: 0.5,
        max: 1.5,
      },
      frequency: 0.05,
      pos: {
        x: 0,
        y: 0,
      },
      maxParticles: 200,
      behaviors: [
        {
          type: 'textureSingle',
          config: {
            texture: PIXI.Texture.from('particle_100px'),
          },
        },
        {
          type: 'color',
          config: {
            color: {
              list: [
                {
                  value: hslToHex(this.snake.state.hue, 0.9, 0.6, true),
                  time: 0,
                },
                {
                  value: hslToHex(this.snake.state.hue, 0.9, 0.4, true),
                  time: 1,
                },
              ],
            },
          },
        },
        {
          type: 'alpha',
          config: {
            alpha: {
              list: [
                {
                  value: 0.8,
                  time: 0,
                },
                {
                  value: 0.1,
                  time: 1,
                },
              ],
            },
          },
        },
        {
          type: 'rotationStatic',
          config: {
            min: 0,
            max: 360,
          },
        },
        {
          type: 'scale',
          config: {
            scale: {
              list: [
                {
                  value: 0.1,
                  time: 0,
                },
                {
                  value: 0.01,
                  time: 1,
                },
              ],
            },
          },
        },
        {
          type: 'moveSpeed',
          config: {
            speed: {
              list: [
                {
                  value: 100,
                  time: 0,
                },
                {
                  value: 50,
                  time: 1,
                },
              ],
              isStepped: false,
            },
          },
        },
        // {
        //   type: 'em'
        // }
      ],
    }
    this.boostEmitter = new PIXI.particles.Emitter(
      this.boostParticlesContainer,
      boostpEmitterConf
    )
  }

  cleanup() {
    this.clear()
    this.tLayer.removeChild(this.tContainer)
    this.sLayer.removeChild(this.sContainer)
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
    this.boostEmitter.emit = emit
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

    const headPos = this.game.getViewRelativePoint(this.snake.head)
    this.label.position.set(headPos.x - this.label.width / 2, headPos.y + 20)

    // Offset the container so that particles are rendered at the correct point
    const o = this.game.getViewOffset()
    this.boostParticlesContainer.position.set(-o.x, -o.y)
    this.boostEmitter.updateOwnerPos(this.snake.head.x, this.snake.head.y)
    this.boostEmitter.update(this.game.pixi.ticker.deltaMS / 1000)
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
