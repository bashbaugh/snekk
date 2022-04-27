import Network from 'client/networking'
import * as PIXI from 'pixi'
import Game from './game'

export default class App {
  readonly app: PIXI.Application
  readonly network: Network

  game?: Game

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

    this.network = new Network()

    this.findGame()
  }

  private async findGame() {
    await this.network.findGame()

    this.game = new Game(this.app, this.network)
  }
}
