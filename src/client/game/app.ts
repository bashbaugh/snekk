import Network from 'client/networking'
import UI, { UIEventListener } from 'client/ui'
import CONFIG from 'config'
import * as PIXI from 'pixi'
import { asyncDelay } from 'shared/util'
import Game from './game'

const CONNECTION_RETRY_INTERVAL = 5000

export default class App {
  readonly pixi: PIXI.Application
  readonly network: Network
  readonly ui: UI

  game?: Game

  constructor() {
    this.pixi = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: CONFIG.g.backgroundColor,
      antialias: true,
    })
    document.body.appendChild(this.pixi.view)

    this.ui = new UI()
    this.network = new Network()

    this.initialize()
  }

  private async initialize() {
    window.addEventListener('resize', () => {
      this.pixi.renderer.resize(window.innerWidth, window.innerHeight)
    })

    this.ui.renderUI()

    this.pixi.ticker.start()
    this.pixi.ticker.minFPS = CONFIG.fps.min
    this.pixi.ticker.maxFPS = CONFIG.fps.max

    await this.loadAssets()

    this.findGame()
  }

  private loadAssets() {
    return new Promise<void>(resolve => {
      const loader = PIXI.Loader.shared
      loader.add('pattern_dots', 'assets/pattern/dots.png')
      loader.add('pattern_squares', 'assets/pattern/squares.png')
      loader.load()
      loader.onComplete.add(() => resolve())
    })
  }

  private async findGame() {
    this.ui.setState({ loadingText: 'Connecting...' })

    let success = false
    while (!success) {
      await this.network
        .findGame(wsdisconnectCode => {
          this.ui.setState({
            ui: 'disconnected',
            wsDisconnectCode:
              wsdisconnectCode !== 1000 ? wsdisconnectCode : undefined,
          })
        })
        .then(() => {
          success = true
        })
        .catch(console.error)

      if (!success) await asyncDelay(CONNECTION_RETRY_INTERVAL)
    }

    this.waitForStart()
  }

  private waitForStart() {
    this.ui.setState({ ui: 'readyToPlay' })

    const startListener: UIEventListener = e => {
      this.ui.setState({ ui: 'loading', loadingText: 'Loading...' })
      this.ui.removeEventListener('startPlaying', startListener)
      this.network.joinGame(e.data.name)
      this.game = new Game(this)
    }

    this.ui.addEventListener('startPlaying', startListener)
  }
}
