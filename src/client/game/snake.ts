import * as PIXI from 'pixi'
import CONFIG from 'shared/config'
import SnakeBehaviour, { SharedSnakeState } from 'shared/game/snake'
import { lerpPoint } from 'shared/util'
import Game from './game'

class ClientSnakeState implements SharedSnakeState {
  points: SPoint[]
  direction: Direction
  length: number
  speed: number

  constructor(spawn: XY) {
    const t = Date.now()
    this.points = [
      { ...spawn, s: 1, d: 1, t },
      { ...spawn, s: 0, d: 1, t },
    ]
    this.direction = 1
    this.length = CONFIG.snake.startLength
    this.speed = CONFIG.snake.baseSpeed
  }

  makePoint({ x, y, s, d, t }: SPoint): SPoint {
    return { x, y, s, d, t }
  }
}

interface ServerFrame {
  serverTs: number
  clientTs: number
  snake: Omit<SharedSnakeState, 'makePoint'>
  head: SPoint
  tail: SPoint
}

export default class Snake extends SnakeBehaviour {
  private container: PIXI.Container
  private graphics: PIXI.Graphics
  private game: Game
  public playerId: string

  constructor(game: Game, playerId: string, spawnPoint: XY) {
    super(new ClientSnakeState(spawnPoint))
    this.game = game
    this.playerId = playerId
    this.container = new PIXI.Container()
    game.app.stage.addChild(this.container)
    this.graphics = new PIXI.Graphics()
    this.game.gameContainer.addChild(this.graphics)
  }

  cleanup() {
    this.graphics.clear()
    this.game.gameContainer.removeChild(this.container)
  }

  private serverQueue: Array<ServerFrame> = []

  onServerState(serverState: SharedSnakeState, isPlayer: boolean) {
    const { points, direction, length, speed } = serverState

    const _snakePoints = points.map(p => this.state.makePoint(p))

    this.serverQueue.unshift({
      serverTs: this.game.network.lastServerTs,
      clientTs: Date.now(),
      // Clone state
      snake: {
        points: _snakePoints,
        length,
        direction,
        speed,
      },
      head: _snakePoints[0],
      tail: _snakePoints[points.length - 1],
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
  interpolatePosition() {
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

      // we need to find the timestamps of the frame we will interpolate the head from and the start/end points
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

      const headInterpDelta = nextF.serverTs - headInterpStart
      const headInterpProgress = interpTarget - headInterpStart
      const headPercent =  headInterpProgress / headInterpDelta

      // Interpolate head using computer points and timestamps
      Object.assign(this.head, lerpPoint(headFromPoint, headToPoint, headPercent, true))

      // Recalculate tail
      this.updateTail()
    }
    // Can't interpolate; extrapolate instead
    else this.extrapolatePosition()
  }

  update(delta: number) {
    this.interpolatePosition()
  }

  draw() {
    const g = this.graphics
    const points = this.state.points.map(p => this.game.getViewRelativePoint(p))
    g.clear()
    g.lineStyle(4, 0xffffff)
    g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y)
    }
  }

  die () {
    
  }
}
