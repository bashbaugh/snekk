import Network from 'client/networking'
import UI, { UIState } from 'client/ui'
import { debugLog } from 'client/util'
import * as PIXI from 'pixi'
import { PlayerState, SnakeState } from 'shared/serverState'
import { DeathReason } from 'types/game'
import { SharedPlayerState } from 'types/state'
import BaseObject from './objects/baseObject'
import Background from './objects/background'
import Food from './objects/food'
import Snake from './player/snake'
import App from './app'
import KeyboardManager from './keyboard'
import Walls from './objects/walls'
import { resources } from './assets'
import Minimap from './objects/minimap'
import { TwistFilter } from '@pixi/filter-twist'
import { distBetween } from 'shared/geometry'
import { Message, MESSAGETYPE } from 'types/networking'

export default class Game {
  readonly app: App
  readonly pixi: PIXI.Application
  readonly input: KeyboardManager = new KeyboardManager()
  readonly network: Network
  readonly ui: UI

  private gameObjects: BaseObject[] = []

  private rootContainer = new PIXI.Container()
  private gameLayer = new PIXI.Container()
  private arenaLayer = new PIXI.Container()
  private arenaExternalLayer = new PIXI.Container()
  bgLayer = new PIXI.Container()
  bloomLayer = new PIXI.Container()
  territoryLayer = new PIXI.Container()
  snakeLayer = new PIXI.Container()
  hudLayer = new PIXI.Container()

  private twistEffect: TwistFilter
  private deathTime?: number

  private arenaMask = new PIXI.Graphics()

  // ID:player map
  players: Record<
    string,
    {
      snake?: Snake
      state: SharedPlayerState
    }
  > = {}
  playerSnake?: Snake

  constructor(app: App) {
    this.app = app
    this.pixi = app.pixi
    this.network = app.network
    this.ui = app.ui
    this.pixi.ticker.add(t => this.onTick(t))

    // Layers and containers
    this.arenaLayer.addChild(this.bgLayer)
    this.arenaLayer.addChild(this.bloomLayer)
    this.arenaLayer.addChild(this.territoryLayer)
    this.arenaLayer.addChild(this.snakeLayer)
    
    this.gameLayer.addChild(this.arenaLayer)
    this.gameLayer.addChild(this.arenaExternalLayer)
    this.rootContainer.addChild(this.gameLayer)
    this.rootContainer.addChild(this.hudLayer)

    this.pixi.stage.addChild(this.rootContainer)

    // Arena graphics should be clipped within the arena
    this.arenaLayer.mask = this.arenaMask

    // Filters
    this.bloomLayer.filters = [
      new PIXI.filters.AdvancedBloomFilter({
        brightness: 0.8,
        quality: 3,
      }),
    ]
    this.twistEffect = new PIXI.filters.TwistFilter({
      angle: 0,
      offset: new PIXI.Point(
        this.pixi.screen.width / 2,
        this.pixi.screen.height / 2
      ),
      radius: distBetween(
        { x: 0, y: 0 },
        { x: this.pixi.screen.width, y: this.pixi.screen.height }
      ),
    })
    this.twistEffect.enabled = false
    this.gameLayer.filters = [this.twistEffect]

    // Network
    this.addNetworkHandlers()

    // Game components
    this.gameObjects.push(
      new Background(this),
      new Walls(this, this.arenaExternalLayer),
      new Food(this, this.bloomLayer),
      new Minimap(this, this.hudLayer)
    )

    // Initialize players and snakes
    this.initializePlayers()
  }

  public cleanup() {
    this.pixi.stage.removeChild(this.rootContainer)
    this.rootContainer.removeChildren()
    this.rootContainer.destroy({
      children: true,
      texture: true, // Should this be false?
    })
  }

  private addPlayerStateListeners(playerId: string, state: PlayerState) {
    state.onChange = (
      changes: Parameters<Exclude<PlayerState['onChange'], undefined>>[0]
    ) => {
      changes.forEach(c => {
        // If the player's snake changed...
        if (c.field === 'snake') {
          console.log('SNEKKK CHANGEEE', c.value)
          if (c.value) {
            // the player now has a snake, add the new snake to the game
            this.addSnake(playerId)
          } else {
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

      this.addPlayerStateListeners(id, pState)
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
        resources.sound_turn.sound?.play()
        // this.playerSnake?.turnHead(d)
      })
      this.input.setBoostListener(b => {
        this.network.sendBoost(b)
      })
      this.input.setFreezeListener(f => {
        this.network.sendFrozen(f)
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

    this.network.onSelfDie(this.endGame.bind(this))
  }

  private initializePlayers() {
    for (const [id, p] of this.network.state!.players) {
      if (id === this.network.clientId) continue // Skip self as we are initialized elsewhere
      this.players[id] = {
        state: p,
      }
      this.addSnake(id)
      this.addPlayerStateListeners(id, p)
    }
  }

  private addSnake(playerId: string) {
    const p = this.players[playerId]
    if (!p.state.snake) return
    debugLog('[GAME] Creating snake', playerId)
    p.snake = new Snake(this, playerId, p.state.snake)
  }

  private removeSnake(playerId: string) {
    if (!this.players[playerId].snake) return
    debugLog('[GAME] Removing snake', playerId)
    this.players[playerId].snake?.die()
    delete this.players[playerId].snake
  }

  private onTick(deltaFPS: number) {
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

    // Clip the game graphics to the area within the arena
    this.arenaMask.clear()
    const c = this.getArenaBounds()
    if (c) this.arenaMask.drawRect(c.xl, c.yt, c.w, c.h)

    // Update UI
    this.ui.setState({
      stats: {
        fps: this.pixi.ticker.FPS,
        ping: this.network.pinger?.lastPing?.latency,
      },
      player: this.playerSnake && {
        length: this.playerSnake.state.length,
        score: this.playerSnake.state.score,
        kills: this.playerSnake.state.kills,
      },
      players: playersArray,
    })

    if (this.deathTime) {
      // WE HAVE DIED :((((((
      this.twistEffect.angle += Math.max(
        deltaMS / 1000,
        (deltaMS * this.twistEffect.angle) / 250 // 300
      )
    }
  }

  private endGame(data: Message[MESSAGETYPE.DEATH]) {
    this.removeSnake(this.network.clientId!)
    this.deathTime = Date.now()
    this.twistEffect.enabled = true
    const bg = this.gameObjects.find(o => o instanceof Background) as Background
    this.arenaLayer.mask = null // Disable arena mask so that the twist effect will work
    this.ui.setState({
      ui: 'postGame',
      postGame: {
        deathReason: data.c,
        killer:
          data.c === DeathReason.player_collision
            ? this.network.state!.players.get(data.k!)?.name
            : undefined,
        ...data.s,
      },
    })
  }

  public getViewOffset(): XY {
    if (!this.playerSnake) return { x: 0, y: 0 }
    // Player snake should be centered in view, so the view should be offset according to its head
    const center = this.playerSnake.head
    return {
      x: center.x - this.pixi.screen.width / 2,
      y: center.y - this.pixi.screen.height / 2,
    }
  }

  public getViewRelativePoint(p: XY): XY {
    const o = this.getViewOffset()
    return {
      x: p.x - o.x,
      y: p.y - o.y,
    }
  }

  public getArenaBounds(
    clipAtScreen: boolean = true
  ): Record<'xl' | 'xr' | 'yt' | 'yb' | 'w' | 'h', number> | undefined {
    if (!this.network.state) return
    const s = this.network.state.arenaSize
    const o = this.getViewOffset()
    const xl = -s - o.x
    const xr = s - o.x
    const yt = -s - o.y
    const yb = s - o.y

    return clipAtScreen
      ? {
          xl: Math.max(xl, 0),
          xr: Math.min(xr, this.pixi.screen.width),
          yt: Math.max(yt, 0),
          yb: Math.min(yb, this.pixi.screen.height),
          w: Math.min(xr, this.pixi.screen.width) - Math.max(xl, 0),
          h: Math.min(yb, this.pixi.screen.height) - Math.max(yt, 0),
        }
      : { xl, xr, yt, yb, w: s * 2, h: s * 2 }
  }
}
