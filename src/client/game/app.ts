import Network from 'client/networking'
import UI, { UIEvent, UIEventListener } from 'client/ui'
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

  private _graphicsMode!: GraphicsMode

  constructor() {
    // Instantiate core components
    this.ui = new UI()
    this.network = new Network()

    this.ui.renderUI()

    // TODO check for WebGL support
    // if (!PIXI.utils.isWebGLSupported()) {
    // }

    // Set up PIXI
    this.pixi = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: CONFIG.g.backgroundColor,
      antialias: true,
      powerPreference: 'high-performance',
      resizeTo: window
    })
    document.body.appendChild(this.pixi.view)

    this.pixi.ticker.start()
    this.pixi.ticker.minFPS = CONFIG.fps.min
    this.pixi.ticker.maxFPS = CONFIG.fps.max

    this.updateScale()
    window.addEventListener('resize', () => {
      this.updateScale()
    })

    // Set graphics mode
    let g = window.localStorage.getItem('graphicsMode')
    if (g !== 'HIGH' && g !== 'LOW') g = 'HIGH'
    this.graphicsMode = g as GraphicsMode
    this.ui.addEventListener('setGraphicsMode', (e) => {
      this.graphicsMode = e.data.mode
      window.localStorage.setItem('graphicsMode', this.graphicsMode)
    })

    // Start async initialization
    this.initialize()
  }

  set graphicsMode (m: GraphicsMode) {
    this._graphicsMode = m
    this.pixi.renderer.resolution = m === 'HIGH' ? 1 : 0.5
    this.pixi.view.style.width = m === 'HIGH' ? '100%' : '200%'
    this.pixi.view.style.height = m === 'HIGH' ? '100%' : '200%'

    this.ui.setState({ graphicsMode: m })
  }

  get graphicsMode () {
    return this._graphicsMode
  }

  updateScale () {
    const xScale = this.pixi.view.width / CONFIG.targetScale.width
    const yScale = this.pixi.view.height / CONFIG.targetScale.height
    const uniformScale = Math.max(xScale, yScale)
    this.pixi.stage.scale.set(uniformScale)
  }

  get scaledWidth() {
    return this.pixi.view.width / this.pixi.stage.scale.x
  }

  get scaledHeight() {
    return this.pixi.view.height / this.pixi.stage.scale.y
  }

  private async initialize() {
    const serverVersion = await this.network.getServerVersion()
    if (serverVersion !== CONFIG.version) { // Server version mismatch
      // Server and cli
      this.ui.setState({
        ui: 'versionMismatch'
      })
      return // Cancel initialization
    }

    await loadAssets()

    this.homeBG = new HomeBackground(this)

    this.findGame()

    this.ui.addEventListener('destroyGame', () => {
      this.game?.cleanup()
      delete this.game
      this.waitForStart()
      console.log(this.pixi.stage.children)
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

    const homeUpdate = this.homeBG!.updateAndDraw.bind(this.homeBG)
    this.homeBG!.enabled = true
    this.pixi.ticker.add(homeUpdate)

    const startListener = (e: UIEvent<'startPlaying'>) => {
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
