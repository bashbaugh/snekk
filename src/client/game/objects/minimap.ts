import BaseObject from './baseObject'
import * as PIXI from 'pixi'
import { hslToHex, mapNumRange, mapPointRange } from 'shared/util'
import CONFIG from 'config'

const mapSize = 100
const mapPadding = 10
const mapMargin = 5

const sizeFromCorner = mapSize + mapMargin + mapPadding
const outerSizeFromCorner = sizeFromCorner + mapPadding
const mapContainerSize = mapSize + mapPadding * 2

export default class Minimap extends BaseObject {
  update() {}

  draw() {
    const g = this.graphics
    g.clear()

    const arenaSize = this.game.network.state!.arenaSize
    const screenW = this.game.pixi.screen.width
    const screenH = this.game.pixi.screen.height

    // Draw map container
    g.beginFill(0xffffff, 0.8)
    g.drawRoundedRect(
      screenW - outerSizeFromCorner,
      screenH - outerSizeFromCorner,
      mapContainerSize,
      mapContainerSize,
      5
    )
    g.endFill()

    // Draw territories
    const territories = Object.values(this.game.players)
      .filter(p => !!p.snake)
      .flatMap(player => ({
        hue: player.snake!.state.hue,
        // Self player should be drawn more opaque
        alpha: player.state.clientId === this.game.network.clientId ? 0.8 : 0.4,
        points: player
          .snake!.state.territory.map(p => [
            // Map each coordinate from world space to the bottom right of screen space
            mapNumRange(
              p.x,
              -arenaSize,
              arenaSize,
              screenW - sizeFromCorner,
              screenW - mapPadding
            ),
            mapNumRange(
              p.y,
              -arenaSize,
              arenaSize,
              screenH - sizeFromCorner,
              screenH - mapPadding
            ),
          ])
          .flat(),
      }))

    for (const t of territories) {
      g.beginFill(
        hslToHex(
          t.hue,
          CONFIG.g.territorySaturation,
          CONFIG.g.territoryLightness
        ),
        t.alpha
      )
      g.drawPolygon(t.points)
      g.endFill()
    }

    // Draw player snake
    const sPoints = this.game.playerSnake?.state.points.map(p =>
      mapPointRange(
        p,
        -arenaSize,
        arenaSize,
        { x: screenW - sizeFromCorner, y: screenH - sizeFromCorner },
        { x: screenW - mapPadding, y: screenH - mapPadding }
      )
    )
    if (!sPoints) return
    g.lineStyle({
      width: 2,
      color: 0,
      alpha: 0.6,
      join: PIXI.LINE_JOIN.MITER,
    })
    g.moveTo(sPoints[0].x, sPoints[0].y)
    for (let i = 1; i < sPoints.length; i++) {
      g.lineTo(sPoints[i].x, sPoints[i].y)
    }
  }
}
