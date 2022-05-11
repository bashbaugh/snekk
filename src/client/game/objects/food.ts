import CONFIG from 'config'
import { hslToHex } from 'shared/util'
import Game from '../game'
import BaseObject from './baseObject'

const FOOD_SATURATION = 0.9
const FOOD_LIGHTNESS = 0.8

export default class Food extends BaseObject {
  update() {}

  draw() {
    const g = this.graphics
    g.clear()

    const food = this.game.network.state?.food
    if (!food) return

    // Draw all food
    for (const f of food) {
      g.beginFill(hslToHex(f.hue, FOOD_SATURATION, FOOD_LIGHTNESS))
      const p = this.game.getViewRelativePoint(f)

      // Sine-animate the food radius
      const seconds = (this.game.network.serverTime - f.t) / 1000
      const pulseSize = Math.sin(seconds * CONFIG.food.pulseRate * 2 * Math.PI)
      g.drawCircle(
        p.x,
        p.y,
        CONFIG.food.radius +
          (isNaN(pulseSize) ? 0 : pulseSize * CONFIG.food.pulseRadius)
      )
      g.endFill()
    }
  }
}
