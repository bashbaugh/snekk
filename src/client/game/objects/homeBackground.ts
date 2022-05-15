import * as PIXI from 'pixi'
import { hslToHex } from 'shared/util'
import App from '../app'

const SPAWN_RATE = 0.5

export default class HomeBackground {
  private app: App
  private lastHexagonSpawned = 0
  private hexagons: PIXI.Container[] = []
  private hexTexture: PIXI.Texture
  private container = new PIXI.Container()

  constructor(app: App) {
    this.app = app
    app.pixi.stage.addChild(this.container)
    this.hexTexture = PIXI.Texture.from('hexagon')
  }

  set enabled(enabled: boolean) {
    this.container.visible = enabled
  }

  public updateAndDraw() {
    const delta = this.app.pixi.ticker.deltaMS

    for (const [i, hexagon] of this.hexagons.entries()) {
      hexagon.y += delta * Math.max(100, hexagon.y ** 1) * 0.001
      hexagon.rotation += delta * 0.0005

      if (hexagon.position.y > this.app.scaledHeight) {
        this.container.removeChild(hexagon)
        this.hexagons.splice(i, 1)
      }
    }

    if (Date.now() - this.lastHexagonSpawned > SPAWN_RATE * 1000) {
      this.lastHexagonSpawned = Date.now()
      const h = new PIXI.Sprite(this.hexTexture)
      h.x = Math.random() * this.app.scaledWidth
      h.y = -50
      h.rotation = Math.random() * Math.PI * 2
      h.pivot.x = h.width / 2
      h.pivot.y = h.height / 2
      h.tint = hslToHex(Math.random() * 360, 0.5, 0.5)
      this.container.addChild(h)
      this.hexagons.push(h)
    }
  }
}
