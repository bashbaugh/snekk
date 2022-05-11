import * as PIXI from 'pixi'
import CONFIG from 'config'
import SnakeBehaviour from 'shared/snake'
import { SharedSnakeState } from 'types/state'
import { lerp, lerpPoint } from 'shared/util'
import Game from '../game'
import PlayerGraphics from './graphics'
import ClientSnakeState, { cloneSnakePoint, cloneSnakeRegion } from './state'
import { resources } from '../assets'

interface ServerFrame {
  serverTs: number
  clientTs: number
  snake: Omit<SharedSnakeState, `make${string}` | 'hue'>
  head: SPoint
  tail: SPoint
}

export default class Snake extends SnakeBehaviour {
  private graphics: PlayerGraphics
  private game: Game
  public playerId: string

  constructor(game: Game, playerId: string, initialState: SharedSnakeState) {
    super(new ClientSnakeState(Snake.cloneServerFrameSnake(initialState)))
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

  private serverQueue: Array<ServerFrame> = []

  static cloneServerFrameSnake(
    serverState: SharedSnakeState
  ): SharedSnakeState {
    const { points, tRegions: territory, ...snakeProperties } = serverState

    const _snakePoints = points.map(p => cloneSnakePoint(p))
    const _territory = territory.map(r => cloneSnakeRegion(r))

    return {
      ...snakeProperties,
      points: _snakePoints,
      tRegions: _territory,
    }
  }

  onServerState(serverState: SharedSnakeState, isPlayer: boolean) {
    const snake = Snake.cloneServerFrameSnake(serverState)

    this.serverQueue.unshift({
      serverTs: this.game.network.lastServerTs,
      clientTs: Date.now(),
      // Clone state
      snake,
      head: snake.points[0],
      tail: snake.points[snake.points.length - 1],
    })
  }

  /** extrapolate the position of the snake from the last available frame */
  extrapolatePosition() {
    // TODO fix extrapolation diagonal bug that can occur with low intrapolation delta/patch rate
    if (!this.serverQueue[0]) return
    const lastFrameTs = this.serverQueue[0].serverTs
    const serverTime = this.game.network.serverTime
    // Time between extrapolation target and last available frame
    const delta = serverTime - CONFIG.interpDeltaMs - lastFrameTs
    const lastF = this.serverQueue[0]

    const newHead = this.getNextHead(
      delta,
      lastF.head,
      lastF.snake.direction,
      lastF.snake.speed
    )
    Object.assign(this.head, newHead)

    // Recalculate tail
    this.updateTail()
  }

  /** Interpolate snake points between server frames */
  interpolateSnake() {
    // This is the timestamp (on the server) that we're hoping to interpolate to
    const interpTarget = this.game.network.serverTime - CONFIG.interpDeltaMs

    // Make sure that we have a frame between now and target time
    if (this.serverQueue[0]?.serverTs >= interpTarget) {
      const nextF = this.serverQueue[0]

      // Find a frame on the other side of the target ts
      let lastF: ServerFrame | undefined
      for (const [i, f] of this.serverQueue.entries()) {
        if (f.serverTs < interpTarget) {
          lastF = f

          // Remove old frames
          this.serverQueue.splice(i + 1)
          break
        }
      }
      if (!lastF) return // Cancel interpolation if we don't have enough frames

      // We need to find the timestamps of the frame we will interpolate the head from and the start/end points
      let headInterpStart = lastF.serverTs
      let headFromPoint = lastF.head
      let headToPoint = nextF.head

      // Snake should include all points from last frame
      const targetPoints = lastF.snake.points.slice()

      // Now, iterate from tail to head in next frame's points
      for (let i = nextF.snake.points.length - 1; i >= 0; i--) {
        const p = nextF.snake.points[i]

        // Check if the next frame has points which aren't present in the last frame
        // And filter points that were created after the target time
        if (p.s > targetPoints[0].s && p.t < interpTarget) {
          // Include the point in our interpolation
          targetPoints.unshift(p)

          // This point is the new head; we need to interpolate to it from from the point before it
          const previousPoint = nextF.snake.points[i + 1]
          headInterpStart = previousPoint.t
          headFromPoint = previousPoint
          headToPoint = p
        }
        // If we don't find any new turns in the next frame
        // We still need to find the head's point in the next frame
        else if (p.s === headFromPoint.s) {
          headToPoint = p
        }
      }

      // Set non-head points on snake without interpolation
      for (let i = 1; i < targetPoints.length; i++) {
        const p = targetPoints[i]
        this.state.points[i] = p
      }
      this.state.points.splice(targetPoints.length)

      // Find interpolation percent since last frame
      const frameDelta = nextF.serverTs - lastF.serverTs
      const totalFrameProgress = interpTarget - lastF.serverTs
      const framePercent = totalFrameProgress / frameDelta

      // Separate interpolation percent for head
      const headInterpDelta = nextF.serverTs - headInterpStart
      const headInterpProgress = interpTarget - headInterpStart
      const headPercent = headInterpProgress / headInterpDelta

      // Interpolate head using computed points and timestamps
      Object.assign(
        this.head,
        lerpPoint(headFromPoint, headToPoint, headPercent, true)
      )

      // Interpolate length and score
      this.state.length = lerp(
        lastF.snake.length,
        nextF.snake.length,
        framePercent
      )
      this.state.score = lerp(
        lastF.snake.score,
        nextF.snake.score,
        framePercent
      )

      // Recalculate tail
      this.updateTail()

      // Update other things
      this.state.territory = lastF.snake.territory
      this.state.boosting = lastF.snake.boosting
    }
    // Can't interpolate; extrapolate instead
    else this.extrapolatePosition()
  }

  update(delta: number) {
    this.interpolateSnake()
  }

  draw() {
    this.graphics.clear()
    this.graphics.drawSnake()
    this.graphics.drawTerritory()
  }
}
