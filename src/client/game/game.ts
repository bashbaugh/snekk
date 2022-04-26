import KeyboardManager from 'client/input/keyboard'
import * as PIXI from 'pixi'
import Snake from './snake'

export default class Game {
  readonly app: PIXI.Application
  readonly input: KeyboardManager

  arenaWidth = 1000
  arenaHeight = 1000

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

    this.app.ticker.add((t) => this.onTick(t))

    this.input = new KeyboardManager()

    this.playerSnake = new Snake(this)
    this.input.addTurnListener(this.playerSnake.turn.bind(this.playerSnake))

    this.snakes.push(this.playerSnake)
  }

  onTick(delta: number) {
    this.snakes[0].update(delta)
    this.snakes[0].draw()
  }
}
