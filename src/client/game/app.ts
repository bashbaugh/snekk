import Network from 'client/networking'
import UI from 'client/ui'
import * as PIXI from 'pixi'
import Game from './game'

export default class App {
  readonly app: PIXI.Application
  readonly network: Network
  readonly ui: UI

  game?: Game

  constructor() {
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      antialias: true,
    })
    document.body.appendChild(this.app.view)

    window.addEventListener('resize', () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight)
    })

    this.ui = new UI()
    this.ui.renderUI()

    this.app.ticker.start()
    this.app.ticker.minFPS = 40
    this.app.ticker.maxFPS = 80

    this.network = new Network()

    this.findGame()
  }

  private async findGame() {
    await this.network.findGame()

    this.game = new Game(this.app, this.network, this.ui)
  }
}
