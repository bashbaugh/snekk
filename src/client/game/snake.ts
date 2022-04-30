import { debugLog } from 'client/util'
import * as PIXI from 'pixi'
import CONFIG from 'shared/config'
import SnakeBehaviour, { SharedSnakeState } from 'shared/game/snake'
import { debug } from 'webpack'
import Game from './game'

class ClientSnakeState implements SharedSnakeState {
  points: XYS[]
  direction: Direction
  length: number
  speed: number

  constructor(spawn: XY) {
    this.points = [
      { ...spawn, s: 1 },
      { ...spawn, s: 0 },
    ]
    this.direction = 1
    this.length = CONFIG.snake.startLength
    this.speed = CONFIG.snake.baseSpeed
  }

  makePoint({ x, y, s }: XYS) {
    return { x, y, s }
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

  cleanup() {
    this.graphics.clear()
    this.game.gameContainer.removeChild(this.container)
  }

  // get serverState() {
  //   return this.game.network.state?.players.get(this.playerId)?.snake!
  // }

  onServerState(serverState: SharedSnakeState, isPlayer: boolean) {
    // Check if there's a new turn point
    // if (this.lastServerTurnPoint!.s < serverState.points[1].s) {
    //   this.lastServerTurnPoint = {...serverState.points[1], ts: Date.now()}
    // }
    const lastTs = this.game.network.lastServerTs

    const { points, direction, length, speed } = serverState

    if (true) {
      // Only update these values for other snakes from server
      this.state.direction = direction
      this.state.length = length
      this.state.speed = speed
      this.state.points = points
      for (let i = 0; i < points.length; i++) {
        const p = points[i]
        const s = p.s
        Object.assign(this.state.points[i], p)
      }
      this.state.points.splice(points.length)
    }

    // Merge server points with client points
    // for (let i = 0; i < points.length; i++) {
    //   const p = points[i]
    //   const s = p.s
    //   Object.assign(this.state.points[i], p)
    // }
    // this.state.points.splice(points.length)
    // this.state.points = points
  }

  // extrapolateHead (delta: number) {
  //   const newHead = this.getNextHead(
  //     delta,
  //     this.head,
  //     this.state.direction,
  //     this.state.speed
  //   )
  //   Object.assign(this.head, newHead)
  // }

  update(delta: number) {
    // this.updateHead(delta)
    // this.updateHead(delta)
    // this.updateTail()
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
