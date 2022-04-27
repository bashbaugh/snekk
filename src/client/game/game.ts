import KeyboardManager from 'client/input/keyboard'
import Network from 'client/networking'
import { debugLog } from 'client/util'
import * as PIXI from 'pixi'
import { PlayerState } from 'shared/serverState'
import Snake from './snake'

export default class Game {
  readonly app: PIXI.Application
  readonly input: KeyboardManager
  readonly network: Network

  arenaSize = 2000

  // ID/player map
  private players: Map<
    string,
    {
      snake?: Snake
      state: PlayerState
    }
  >
  private playerSnake?: Snake

  constructor(app: PIXI.Application, network: Network) {
    this.app = app
    this.network = network
    this.app.ticker.add(t => this.onTick(t))

    this.players = new Map()

    this.input = new KeyboardManager()

    this.addNetworkHandlers()
  }

  private addNetworkHandlers() {
    // This is fired when the player's snake is created
    this.network.onSelfSpawn((spawnPoint, pState) => {
      this.playerSnake = new Snake(
        this,
        this.network.clientId!,
        spawnPoint
      )
      this.input.addTurnListener(d => {
        this.playerSnake?.turn(d)
        this.network.sendTurn(d)
      })
      this.players.set(this.network.clientId!, {
        snake: this.playerSnake,
        state: pState,
      })
    })

    this.network.onPlayerJoin((id, state) => {
      this.players.set(id, {
        state,
      })

      // Monitor player state changes
      state.onChange = changes => {
        changes.forEach(c => {
          // If the player's snake changed...
          if (c.field === 'snake') {
            debugLog('SNAKE ADDED!', c.value)
            if (c.value) {
              // the player now has a snake, add the new snake to the game
              this.players.set(id, {
                state,
                snake: new Snake(this, id, c.value.points[0]),
              })
            } else {
              // Otherwise remove their snake
              this.players.delete(id)
            }
          }
        })
      }
    })
    this.network.onPlayerLeave(id => {
      this.players.delete(id)
    })

    // TODO delete
    // Every time we receive a patch from the server we need to update the position of all the snakes
    // this.network.onStateChange(s => {
    //   for (const [id, { snake }] of this.players.entries()) {
    //     // Only include other players' snakes
    //     if (snake && id !== this.network.clientId) {
    //       snake.interpolateServerState(s.players.get(id)!.snake!)
    //     }
    //   }
    // })
  }

  onTick(delta: number) {
    const deltaMs = this.app.ticker.deltaMS
    for (const [id, { snake }] of this.players.entries()) {
      // If this player doesn't have an active snake skip them
      if (!snake) continue
      snake.update(deltaMs)
      snake.draw()
      // For all the other snakes, we need to interpolate the latest server state
      if (id !== this.network.clientId) {
        snake.interpolateServerState()
      }
    }
  }

  public getViewOffset(): XY {
    if (!this.playerSnake) return { x: 0, y: 0 }
    // Player snake should be centered in view, so the view should be offset according to its head
    const center = this.playerSnake.head
    return {
      x: center.x - this.app.view.width / 2,
      y: center.y - this.app.view.height / 2,
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
