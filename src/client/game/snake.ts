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
  set tail (t: SPoint) {
    this.state.points[this.state.points.length - 1] = t
  }

  cleanup() {
    this.graphics.clear()
    this.game.gameContainer.removeChild(this.container)
  }

  private serverQueue: Array<{
    serverTs: number
    clientTs: number
    snake: SharedSnakeState
  }> = []

  onServerState(serverState: SharedSnakeState, isPlayer: boolean) {
    const { points, direction, length, speed } = serverState

    if (true) {
      this.state.direction = direction
      this.state.length = length
      this.state.speed = speed
      // Copy points into local state
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        this.state.points[i] = {...p}
      }
      this.state.points.splice(points.length)

      // Insert a copy of this frame into the queue
      this.serverQueue.unshift({
        serverTs: this.game.network.lastServerTs,
        clientTs: Date.now(),
        points: this.state.points.map(p => (this.state.makePoint(p))),
        head: this.state.makePoint(points[0]),
        tail: this.state.makePoint(points[points.length - 1]),
      })

      // Only need to keep 2 frames at a time
      this.serverQueue.splice(CONFIG.interpDeltaFrames + 2)
    }
  }

  /** Interpolate snake points between server frames */
  interpolatePoints() {
    const [nextF, previousF] = this.serverQueue.slice(CONFIG.interpDeltaFrames)
    if (!previousF) return

    const timeSinceLast = Date.now() - nextF.clientTs
    // TODO smooth frametime
    const frameTime = nextF.clientTs - previousF.clientTs
    const percent = timeSinceLast / frameTime
    if (percent > 1) {
      // Can't interpolate; extrapolate and recalculate tail instead
      const newHead = this.getNextHead(
        timeSinceLast,
        nextF.head,
        this.state.direction,
        this.state.speed
      )
      Object.assign(this.head, newHead)

      this.updateTail()
    }
    // Lerp head and tail latest server frames
    else {
      /*if (nextF.head.s === previousF.head.s)*/ Object.assign(this.head, lerpPoint(previousF.head, nextF.head, percent, true))
      // if (nextF.tail.s === previousF.tail.s) Object.assign(this.tail, lerpPoint(previousF.tail, nextF.tail, percent, true))
    }
      
    // Recalculate tail
    // console.log(previousF.tail.s, this.tail?.s)
    // this.tail = previousF.tail.s === this.tail?.s ? previousF.tail : nextF.tail
    // this.updateTail()
  }

  update(delta: number) {
    this.interpolatePoints()
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
