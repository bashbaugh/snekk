import Network from 'client/networking'
import UI, { UIEventListener } from 'client/ui'
import CONFIG from 'config'
import * as PIXI from 'pixi'
import { asyncDelay } from 'shared/util'
import { loadAssets } from './assets'
import Game from './game'
import HomeBackground from './objects/homeBackground'

const CONNECTION_RETRY_INTERVAL = 5000

export default class App {
  readonly pixi: PIXI.Application
  readonly network: Network
  readonly ui: UI

  game?: Game

  homeBG?: HomeBackground

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

    await loadAssets()

    this.homeBG = new HomeBackground(this)

    this.findGame()
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

    const homeUpdate = this.homeBG!.updateAndDraw.bind(this.homeBG)
    this.homeBG!.enabled = true
    this.pixi.ticker.add(homeUpdate)

    const startListener: UIEventListener = e => {
      this.pixi.ticker.remove(homeUpdate)
      this.homeBG!.enabled = false
      this.ui.setState({ ui: 'loading', loadingText: 'Loading...' })
      this.ui.removeEventListener('startPlaying', startListener)
      this.network.joinGame(e.data)
      this.game = new Game(this)
    }

    this.ui.addEventListener('startPlaying', startListener)
  }
}
