import KeyboardManager from 'client/input/keyboard'
import Network from 'client/networking'
import * as PIXI from 'pixi'
import Snake from './snake'

export default class Game {
  readonly app: PIXI.Application
  readonly input: KeyboardManager
  readonly network: Network

  arenaSize = 2000

  private snakes: Snake[] = []
  private playerSnake: Snake

  constructor() {
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
    })
    document.body.appendChild(this.app.view)

    this.app.ticker.start()
    this.app.ticker.minFPS = 50
    this.app.ticker.maxFPS = 120

    this.app.ticker.add(t => this.onTick(t))

    this.input = new KeyboardManager()

    this.network = new Network()

    this.playerSnake = new Snake(this)
    this.input.addTurnListener(this.playerSnake.turn.bind(this.playerSnake))

    this.snakes.push(this.playerSnake)

    this.network.joinGame('Freddy')
  }

  onTick(delta: number) {
    const deltaMs = this.app.ticker.deltaMS
    this.snakes[0].update(deltaMs)
    this.snakes[0].draw()
  }

  public getViewOffset(): XY {
    // Player snake should be centered in view, so the view should be offset according to its head
    const center = this.playerSnake.head
    return {
      x: center.x - this.app.view.width / 2,
      y: center.y - this.app.view.height / 2,
    }
  }

  public getViewRelativePoint(p: XY): XY {
    const o = this.getViewOffset()
    return {
      x: p.x - o.x,
      y: p.y - o.y,
    }
  }
}
