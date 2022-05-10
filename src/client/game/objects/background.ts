import CONFIG from 'config'
import BaseObject from './baseObject'

const GRID_LINE_SPACING = 70

export default class Background extends BaseObject {
  update() {}

  draw() {
    const g = this.graphics
    g.clear()
    const offset = this.game.getViewOffset()
    const [w, h] = [this.game.pixi.view.width, this.game.pixi.view.height]

    g.lineStyle(2, CONFIG.g.backgroundPatternColor, 0.3)
    for (let i = 0; i < w / GRID_LINE_SPACING + 1; i++) {
      const viewX = i * GRID_LINE_SPACING - (offset.x % GRID_LINE_SPACING)
      g.moveTo(viewX, 0)
      g.lineTo(viewX, h)
    }
    for (let i = 0; i < h / GRID_LINE_SPACING + 1; i++) {
      const viewY = i * GRID_LINE_SPACING - (offset.y % GRID_LINE_SPACING)
      g.moveTo(0, viewY)
      g.lineTo(w, viewY)
    }
  }
}
