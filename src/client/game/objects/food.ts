import { hslToHex } from 'shared/util'
import BaseObject from '../baseObject'

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
      g.drawCircle(p.x, p.y, 10)
      g.endFill()
    }
  }
}
