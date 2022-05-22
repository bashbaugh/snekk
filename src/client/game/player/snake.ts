import SnakeBehaviour from 'shared/snake'
import { SharedSnakeState } from 'types/state'
import { lerp, lerpPoint } from 'shared/util'
import Game from '../game'
import PlayerGraphics from './graphics'
import ClientSnakeState, { cloneSnakePoint, cloneSnakeRegion } from './state'
import { resources } from '../assets'
import { defaultTerritorySkin } from 'shared/skins'
import { ServerSnakeFrame } from '../interpolation'

export default class Snake extends SnakeBehaviour {
  private graphics: PlayerGraphics
  private game: Game
  public playerId: string

  /** Regions we have emitted particles for */
  private lastRegionConfirmed: number = -1

  constructor(game: Game, playerId: string, initialState: SharedSnakeState) {
    super(new ClientSnakeState(Snake.cloneSnakeState(initialState)))
    this.game = game
    this.playerId = playerId

    this.graphics = new PlayerGraphics(this, this.game)
  }

  die() {
    this.graphics.cleanup()

    if (this.playerId === this.game.network.clientId) {
      resources.sound_death.sound?.play()
    }
  }

  static cloneSnakeState(serverState: SharedSnakeState): SharedSnakeState {
    const { points, tRegions: territory, ...snakeProperties } = serverState

    const _snakePoints = points.map(cloneSnakePoint)
    const _territory = territory.map(cloneSnakeRegion)

    return {
      ...snakeProperties,
      points: _snakePoints,
      tRegions: _territory,
    }
  }

  /** extrapolate the position of the snake from the last available frame */
  public extrapolatePosition(frame: ServerSnakeFrame, deltaSince: number) {
    // TODO fix extrapolation diagonal bug that can occur with low intrapolation delta/patch rate

    const newHead = this.getNextHead(
      deltaSince,
      frame.points[0],
      frame.direction,
      frame.speed
    )
    Object.assign(this.head, newHead)

    // Recalculate tail
    this.updateTail()
  }

  /** Interpolate snake points and other values between server frames */
  public interpolateState(
    lastF: ServerSnakeFrame,
    nextF: ServerSnakeFrame,
    lastTs: number,
    nextTs: number,
    interpTarget: number,
    interpPercent: number
  ) {
    // We need to find the timestamps of the frame we will interpolate the head from and the start/end points
    let headInterpStart = lastTs
    let headFromPoint = lastF.points[0]
    let headToPoint = nextF.points[0]

    // Snake should include all points from last frame
    const targetPoints = lastF.points.slice()

    // Now, iterate from tail to head in next frame's points
    for (let i = nextF.points.length - 1; i >= 0; i--) {
      const p = nextF.points[i]

      // Check if the next frame has points which aren't present in the last frame
      // And filter points that were created after the target time
      if (p.s > targetPoints[0].s && p.t < interpTarget) {
        // Include the point in our interpolation
        targetPoints.unshift(p)

        // This point is the new head; we need to interpolate to it from from the point before it
        const previousPoint = nextF.points[i + 1]
        headInterpStart = previousPoint.t
        headFromPoint = previousPoint
        headToPoint = p
      }
      // If we don't find any new turns in the next frame
      // We still need to find the head's point in the next frame
      else if (p.s === headFromPoint.s) {
        targetPoints.unshift(p) // TODO should this work?
        headToPoint = p
      }
    }

    // Set non-head points on snake without interpolation
    for (let i = 1; i < targetPoints.length; i++) {
      const p = targetPoints[i]
      this.state.points[i] = p
    }
    this.state.points.splice(targetPoints.length)

    // Separate interpolation percent for head
    const headInterpDelta = nextTs - headInterpStart
    const headInterpProgress = interpTarget - headInterpStart
    const headPercent = headInterpProgress / headInterpDelta

    const { points, length, score, ...otherState } = lastF

    // Interpolate head using computed points and timestamps
    Object.assign(
      this.head,
      lerpPoint(headFromPoint, headToPoint, headPercent, true)
    )

    // Interpolate length and score
    this.state.length = lerp(length, nextF.length, interpPercent)
    this.state.score = lerp(score, nextF.score, interpPercent)

    // Recalculate tail
    this.updateTail()

    // Update other properties
    Object.assign(this.state, otherState)

    this.graphics.emitBoostParticles = this.state.boosting
    this.graphics.emitTerritoryCutParticles = !!this.state.headTerritory

    // Trigger particles for new regions
    for (
      let i = nextF.tRegions.length - 1;
      i > Math.max(lastF.tRegions.length - 1, this.lastRegionConfirmed);
      i--
    ) {
      const r = nextF.tRegions[i]
      this.lastRegionConfirmed = i
      this.graphics.emitRegionParticles(r.p)
    }
  }

  update(delta: number) {
    const player = this.game.network.state?.players.get(this.playerId)
    if (!player) return

    this.graphics.tSkin = player.territorySkin || defaultTerritorySkin

    // Only set name for other players
    if (this.game.network.clientId !== this.playerId)
      this.graphics.labelText = player.name!
  }

  draw() {
    this.graphics.clear()
    this.graphics.drawSnake()
    this.graphics.drawTerritory()
  }
}
