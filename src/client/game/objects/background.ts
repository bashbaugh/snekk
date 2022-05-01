import BaseObject from '../baseObject'

const GRID_LINE_SPACING = 50

export default class Background extends BaseObject {
  update () {}

  draw () {
    const g = this.graphics
    g.clear()
    const offset = this.game.getViewOffset()
    const [w, h] = [this.game.app.view.width, this.game.app.view.height]

    for (let i = 0; i < w / GRID_LINE_SPACING + 1; i++) {
      g.lineStyle(2, 0xab0311, 0.3)
      g.moveTo(i * GRID_LINE_SPACING - offset.x % GRID_LINE_SPACING, 0)
      g.lineTo(i * GRID_LINE_SPACING - offset.x % GRID_LINE_SPACING, h)
    }
    for (let i = 0; i < h / GRID_LINE_SPACING + 1; i++) {
      g.lineStyle(2, 0xab0311, 0.3)
      g.moveTo(0, i * GRID_LINE_SPACING - offset.y % GRID_LINE_SPACING)
      g.lineTo(w, i * GRID_LINE_SPACING - offset.y % GRID_LINE_SPACING)
    }
  }
}
