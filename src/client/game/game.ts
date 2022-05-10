import Network from 'client/networking'
import UI, { UIState } from 'client/ui'
import { debugLog } from 'client/util'
import * as PIXI from 'pixi'
import { PlayerState } from 'shared/serverState'
import { DeathReason } from 'types/game'
import { SharedPlayerState } from 'types/state'
import BaseObject from './objects/baseObject'
import Background from './objects/background'
import Food from './objects/food'
import Snake from './player/snake'
import App from './app'
import KeyboardManager from './keyboard'

export default class Game {
  readonly app: App
  readonly pixi: PIXI.Application
  readonly input: KeyboardManager
  readonly network: Network
  readonly ui: UI

  gameLayer: PIXI.Container
  bgLayer: PIXI.Container
  bloomLayer: PIXI.Container

  private gameObjects: BaseObject[] = []

  // ID:player map
  private players: Record<
    string,
    {
      snake?: Snake
      state: SharedPlayerState
    }
  >
  private playerSnake?: Snake

  constructor(app: App) {
    this.app = app
    this.pixi = app.pixi
    this.network = app.network
    this.ui = app.ui
    this.pixi.ticker.add(t => this.onTick(t))

    this.gameLayer = new PIXI.Container()
    this.bgLayer = new PIXI.Container()
    this.bloomLayer = new PIXI.Container()
    this.pixi.stage.addChild(this.bgLayer)
    this.pixi.stage.addChild(this.bloomLayer)
    this.pixi.stage.addChild(this.gameLayer)

    this.bloomLayer.filters = [
      new PIXI.filters.AdvancedBloomFilter({
        brightness: 0.8,
        quality: 3,
      }),
    ]

    this.players = {}

    this.input = new KeyboardManager()

    this.addNetworkHandlers()

    this.gameObjects.push(new Background(this), new Food(this, this.bloomLayer))

    // Initialize players and snakes
    this.initializePlayers()
  }

  private getPlayerChangeListener(playerId: string) {
    return (
      changes: Parameters<Exclude<PlayerState['onChange'], undefined>>[0]
    ) => {
      changes.forEach(c => {
        // If the player's snake changed...
        if (c.field === 'snake') {
          if (c.value) {
            // the player now has a snake, add the new snake to the game
            this.addSnake(playerId)
          } else {
            // Otherwise remove their snake
            this.removeSnake(playerId)
          }
        }
      })
    }
  }

  private addNetworkHandlers() {
    this.network.onPlayerJoin((id, pState) => {
      if (this.players[id] || id === this.network.clientId) return
      this.players[id] = {
        state: pState,
      }

      pState.onChange = this.getPlayerChangeListener(id)
    })

    this.network.onPlayerLeave(id => {
      this.removeSnake(id)
      delete this.players[id]
    })

    // This is fired when the player's snake is created
    this.network.onSelfSpawn((state, pState) => {
      this.playerSnake = new Snake(this, this.network.clientId!, state)
      this.input.setTurnListener(d => {
        this.network.sendTurn({
          d,
          x: this.playerSnake!.head.x,
          y: this.playerSnake!.head.y,
          s: this.playerSnake!.head.s,
        })
        // this.playerSnake?.turnHead(d)
      })
      this.input.setBoostListener(b => {
        this.network.sendBoost(b)
      })
      this.players[this.network.clientId!] = {
        snake: this.playerSnake,
        state: pState,
      }
      this.ui.setState({
        ui: 'inGame',
      })
    })

    this.network.onStateChange(state => {
      // Update snakes when we receive a new state patch
      for (const [id, { snake }] of Object.entries(this.players)) {
        if (snake) {
          snake.onServerState(
            state.players.get(id)!.snake!,
            id === this.network.clientId!
          )
        }
      }
    })

    this.network.onSelfDie((reason, killerId) => {
      this.playerSnake?.die()
      this.ui.setState({
        ui: 'readyToPlay',
        deathReason: DeathReason.self_collision,
      })
    })
  }

  private initializePlayers() {
    for (const [id, p] of this.network.state!.players) {
      if (id === this.network.clientId) continue // Skip self
      this.players[id] = {
        state: p,
      }
      this.addSnake(id)
      p.onChange = this.getPlayerChangeListener(id)
    }
  }

  addSnake(playerId: string) {
    const p = this.players[playerId]
    if (!p.state.snake) return
    debugLog('[GAME] Creating snake', playerId)
    p.snake = new Snake(this, playerId, p.state.snake)
  }

  removeSnake(playerId: string) {
    if (!this.players[playerId].snake) return
    debugLog('[GAME] Removing snake', playerId)
    this.players[playerId].snake?.die()
    delete this.players[playerId].snake
  }

  onTick(deltaFPS: number) {
    const deltaMS = this.pixi.ticker.deltaMS

    for (const obj of this.gameObjects) obj.update(deltaMS)
    for (const obj of this.gameObjects) obj.draw()

    const playersArray: UIState['players'] = []

    for (const [
      id,
      {
        snake,
        state: { name },
      },
    ] of Object.entries(this.players)) {
      if (!snake) continue // If this player doesn't have an active snake skip them
      snake.update(deltaMS)
      snake.draw()
      playersArray.push({
        id,
        name: name!,
        score: snake.state.score!,
        isSelf: id === this.network.clientId,
      })
    }

    this.ui.setState({
      stats: {
        fps: this.pixi.ticker.FPS,
        ping: this.network.pinger?.lastPing?.latency,
      },
      player: this.playerSnake && {
        length: this.playerSnake.state.length,
        score: this.playerSnake.state.score,
      },
      players: playersArray,
    })
  }

  public getViewOffset(): XY {
    if (!this.playerSnake) return { x: 0, y: 0 }
    // Player snake should be centered in view, so the view should be offset according to its head
    const center = this.playerSnake.head
    return {
      x: center.x - this.pixi.view.width / 2,
      y: center.y - this.pixi.view.height / 2,
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
