import CONFIG from 'config'
import BaseObject from './baseObject'
import * as PIXI from 'pixi'

export default class Walls extends BaseObject {
  update() {}

  draw() {
    const g = this.graphics
    g.clear()

    const s = this.game.network.state?.arenaSize
    if (!s) return

    const o = this.game.getViewOffset()
    const xLeft = -s - o.x
    const xRight = s - o.x
    const yTop = -s - o.y
    const yBottom = s - o.y

    g.lineStyle({
      width: 8,
      color: 0x6b0a17,
      join: PIXI.LINE_JOIN.MITER,
    })
    g.moveTo(xLeft, yTop)
    g.lineTo(xRight, yTop)
    g.lineTo(xRight, yBottom)
    g.lineTo(xLeft, yBottom)
    g.lineTo(xLeft, yTop)
    g.lineTo(xRight, yTop)
  }
}
