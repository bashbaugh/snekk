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
    this.points = [
      { ...spawn, s: 1, d: 1 },
      { ...spawn, s: 0, d: 1 },
    ]
    this.direction = 1
    this.length = CONFIG.snake.startLength
    this.speed = CONFIG.snake.baseSpeed
  }

  makePoint({ x, y, s, d }: SPoint): SPoint {
    return { x, y, s, d }
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
    // this.lastServerTurnPoint = {...this.state.points[1], ts: Date.now()}
  }

  get tail() {
    return this.state.points[this.state.points.length - 1]
  }
  set tail(t: SPoint) {
    this.state.points[this.state.points.length - 1] = t
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

    // TODO remove old frames
    // this.serverQueue.splice(CONFIG.interpDeltaFrames + 2)
  }

  /** If we can't interpolate we can extrapolate the position of the snakes from the last frame */
  extrapolatePosition() {
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
      for (const f of this.serverQueue) {
        if (f.serverTs < interpTarget) {
          lastF = f
          break
        }
      }
      if (!lastF) return // Cancel interpolation if we don't have enough frames

      const frameDelta = nextF.serverTs - lastF.serverTs
      const targetDelta = interpTarget - lastF.serverTs
      const percent = targetDelta / frameDelta

      // TODO filter points at target time
      this.state.points = lastF.snake.points
      // for (let i = 0; i < this.state.points.length; i++) {
      //   const p = lastF.snake.points[i]
      //   this.state.points[i] = p
      // }
      // this.state.points.splice(lastF.snake.points.length)

      // Interpolate points
      Object.assign(this.head, lerpPoint(lastF.head, nextF.head, percent, true))
      Object.assign(this.tail, lerpPoint(lastF.tail, nextF.tail, percent, true))
    }
    // Can't interpolate; extrapolate instead
    else this.extrapolatePosition()

    // // Lerp head and tail latest server frames
    // else {
    //   /*if (nextF.head.s === previousF.head.s)*/ Object.assign(this.head, lerpPoint(previousF.head, nextF.head, percent, true))
    //   // if (nextF.tail.s === previousF.tail.s) Object.assign(this.tail, lerpPoint(previousF.tail, nextF.tail, percent, true))
    // }

    // Recalculate tail
    // console.log(previousF.tail.s, this.tail?.s)
    // this.tail = previousF.tail.s === this.tail?.s ? previousF.tail : nextF.tail
    // this.updateTail()
  }

  update(delta: number) {
    this.interpolatePosition()
    // console.log(this.state.points.map(p => `${p.x},${p.y}`))
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
}
