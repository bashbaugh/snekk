import KeyboardManager from 'client/input/keyboard'
import Network from 'client/networking'
import UI from 'client/ui'
import { debugLog } from 'client/util'
import * as PIXI from 'pixi'
import { PlayerState } from 'shared/serverState'
import BaseObject from './baseObject'
import Background from './objects/background'
import Snake from './snake'

export default class Game {
  readonly app: PIXI.Application
  readonly input: KeyboardManager
  readonly network: Network
  readonly ui: UI
  gameContainer: PIXI.Container

  private gameObjects: BaseObject[] = []

  // ID:player map
  private players: Record<
    string,
    {
      snake?: Snake
      state: PlayerState
    }
  >
  private playerSnake?: Snake

  constructor(app: PIXI.Application, network: Network, ui: UI) {
    this.app = app
    this.network = network
    this.ui = ui
    this.app.ticker.add(t => this.onTick(t))

    this.gameContainer = new PIXI.Container()
    this.app.stage.addChild(this.gameContainer)

    this.players = {}

    this.input = new KeyboardManager()

    this.addNetworkHandlers()

    this.gameObjects.push(new Background(this))
  }

  private addNetworkHandlers() {
    this.network.onPlayerJoin((id, pState) => {
      this.players[id] = {
        state: pState,
      }

      pState.onChange = changes => {
        changes.forEach(c => {
          // If the player's snake changed...
          if (c.field === 'snake') {
            if (c.value) {
              // the player now has a snake, add the new snake to the game
              this.addSnake(id)
            } else {
              // Otherwise remove their snake
              this.removeSnake(id)
            }
          }
        })
      }
    })

    this.network.onPlayerLeave(id => {
      this.removeSnake(id)
      delete this.players[id]
    })

    // This is fired when the player's snake is created
    this.network.onSelfSpawn((spawnPoint, pState) => {
      this.playerSnake = new Snake(this, this.network.clientId!, spawnPoint)
      this.input.addTurnListener(d => {
        this.network.sendTurn({
          d,
          x: this.playerSnake!.head.x,
          y: this.playerSnake!.head.y,
          s: this.playerSnake!.head.s,
        })

        // this.playerSnake?.turnHead(d)
      })
      this.players[this.network.clientId!] = {
        snake: this.playerSnake,
        state: pState,
      }
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
      alert(`Killed by ${killerId} (${reason})`)
    })
  }

  addSnake(playerId: string) {
    debugLog('[GAME] Creating snake', playerId)
    const p = this.players[playerId]
    p.snake = new Snake(this, playerId, p.state.snake?.points[0]!)
  }

  removeSnake(playerId: string) {
    debugLog('[GAME] Removing snake', playerId)
    this.players[playerId].snake?.cleanup()
    this.players[playerId].snake = undefined
  }

  onTick(delta: number) {
    const deltaMs = this.app.ticker.deltaMS

    for (const obj of this.gameObjects) obj.update(deltaMs)
    for (const obj of this.gameObjects) obj.draw()

    for (const [id, { snake }] of Object.entries(this.players)) {
      if (!snake) continue // If this player doesn't have an active snake skip them
      snake.update(deltaMs)
      snake.draw()
    }

    // this.ui.updateText()
  }

  public getViewOffset(): XY {
    if (!this.playerSnake) return { x: 0, y: 0 }
    // Player snake should be centered in view, so the view should be offset according to its head
    const center = this.playerSnake.head
    return {
      x: center.x - this.app.view.width / 2,
      y: center.y - this.app.view.height / 2,
    }
    // return {
    //   x: -200,
    //   y: -200,
    // }
  }

  public getViewRelativePoint(p: XY): XY {
    const o = this.getViewOffset()
    return {
      x: Math.round(p.x - o.x),
      y: Math.round(p.y - o.y),
    }
  }
}
