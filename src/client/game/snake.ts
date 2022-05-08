import * as PIXI from 'pixi'
import CONFIG from 'config'
import SnakeBehaviour from 'shared/snake'
import { SharedSnakeState } from 'types/state'
import { hslToHex, lerp, lerpPoint, randomInt } from 'shared/util'
import Game from './game'
import { polygonUnion } from 'shared/geometry'

const SNAKE_SATURATION = 1
const SNAKE_LIGHTNESS = 0.6
const TERRITORY_SATURATION = 0.8
const TERRITORY_LIGHTNESS = 0.35

const TERRITORY_SHAPE_DEBUGGING = false

const _territoryShapeDebugColors: any = {}

const cloneSnakePoint = ({ x, y, s, d, t }: SPoint): SPoint => ({
  x,
  y,
  s,
  d,
  t,
})
const cloneSnakeRegion = ({ p, t }: SRegion): SRegion => ({
  t,
  p: p.map(p => ({ ...p })),
})

class ClientSnakeState implements SharedSnakeState {
  points: SPoint[]
  // trail: SPoint[]
  territory: SRegion[]
  direction: Direction
  length: number
  // energy: number
  speed: number
  hue: number
  score: number = 0

  constructor(state: SharedSnakeState) {
    const t = Date.now()
    this.points = state.points
    this.territory = state.territory
    this.direction = state.direction
    this.length = state.length
    this.speed = state.speed
    this.hue = state.hue
  }

  makeSnakePoint(p: SPoint): SPoint {
    return cloneSnakePoint(p)
  }

  makeRegion(r: SRegion): SRegion {
    return cloneSnakeRegion(r)
  }
}

interface ServerFrame {
  serverTs: number
  clientTs: number
  snake: Omit<SharedSnakeState, `make${string}` | 'hue'>
  head: SPoint
  tail: SPoint
}

export default class Snake extends SnakeBehaviour {
  private container: PIXI.Container
  private snakeGraphics: PIXI.Graphics
  private territoryGraphics: PIXI.Graphics
  private game: Game
  public playerId: string

  constructor(game: Game, playerId: string, initialState: SharedSnakeState) {
    super(new ClientSnakeState(Snake.cloneServerFrameSnake(initialState)))
    this.game = game
    this.playerId = playerId

    this.container = new PIXI.Container()
    game.gameContainer.addChild(this.container)
    this.snakeGraphics = new PIXI.Graphics()
    this.territoryGraphics = new PIXI.Graphics()
    this.container.addChild(this.territoryGraphics)
    this.container.addChild(this.snakeGraphics)

    // this.territoryGraphics.filters = [new PIXI.filters.OutlineFilter(4, 0xffffff)]
  }

  die() {
    this.snakeGraphics.clear()
    this.territoryGraphics.clear()
    this.game.gameContainer.removeChild(this.container)
  }

  private serverQueue: Array<ServerFrame> = []

  static cloneServerFrameSnake(
    serverState: SharedSnakeState
  ): SharedSnakeState {
    const { points, territory, ...snakeProperties } = serverState

    const _snakePoints = points.map(p => cloneSnakePoint(p))
    const _territory = territory.map(r => cloneSnakeRegion(r))

    return {
      ...snakeProperties,
      points: _snakePoints,
      territory: _territory,
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

      // Interpolate length
      this.state.length = lerp(
        lastF.snake.length,
        nextF.snake.length,
        framePercent
      )

      // Recalculate tail
      this.updateTail()

      // Update territory and score
      this.state.territory = lastF.snake.territory
      this.state.score = lastF.snake.score
    }
    // Can't interpolate; extrapolate instead
    else this.extrapolatePosition()
  }

  update(delta: number) {
    this.interpolateSnake()
  }

  drawSnake(g: PIXI.Graphics) {
    const points = this.state.points.map(p => this.game.getViewRelativePoint(p))
    g.lineStyle(6, hslToHex(this.state.hue, SNAKE_SATURATION, SNAKE_LIGHTNESS))
    g.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y)
    }
  }

  drawTerritory(g: PIXI.Graphics) {
    const doDebugRender = CONFIG.debug && TERRITORY_SHAPE_DEBUGGING
    for (const r of this.state.territory) {
      let rColor = hslToHex(
        this.state.hue,
        TERRITORY_SATURATION,
        TERRITORY_LIGHTNESS
      )

      if (doDebugRender) {
        const c = _territoryShapeDebugColors
        if (!c[r.t]) c[r.t] = randomInt(255 ** 3)
        rColor = c[r.t]
      }

      g.beginFill(rColor)
      const polygonPoints = r.p
        .map(p => {
          const rp = this.game.getViewRelativePoint(p)
          return [rp.x, rp.y]
        })
        .flat()
      g.drawPolygon(polygonPoints)
      g.endFill()
    }

    if (doDebugRender) {
      const tUnion = polygonUnion(this.state.territory.map(r => r.p))
      g.lineStyle(2, 0xff0000)
      const polygonPoints = tUnion
        .map(p => {
          const rp = this.game.getViewRelativePoint(p)
          return [rp.x, rp.y]
        })
        .flat()
      g.drawPolygon(polygonPoints)
    }
  }

  draw() {
    this.snakeGraphics.clear()
    this.territoryGraphics.clear()
    this.drawSnake(this.snakeGraphics)
    this.drawTerritory(this.territoryGraphics)
  }
}
