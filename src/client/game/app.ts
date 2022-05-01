import Network from 'client/networking'
import UI, { UIEventListener } from 'client/ui'
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
    this.ui.setState({ loadingText: 'Connecting...' })
    await this.network.findGame()
    this.ui.setState({ readyToPlay: true })

    const startListener: UIEventListener = e => {
      this.ui.setState({ readyToPlay: false, loadingText: 'Loading...' })
      this.ui.removeEventListener('startPlaying', startListener)
      this.network.joinGame(e.data.name)
      this.game = new Game(this.app, this.network, this.ui)
    }

    this.ui.addEventListener('startPlaying', startListener)
  }
}
