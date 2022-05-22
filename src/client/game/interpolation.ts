import { Server } from 'colyseus'
import CONFIG from 'config'
import { SourceMapSourcesMode } from 'javascript-obfuscator/typings/src/enums/source-map/SourceMapSourcesMode'
import GameState from 'shared/serverState'
import { lerp } from 'shared/util'
import { SharedSnakeState } from 'types/state'
import Game from './game'
import Snake from './player/snake'

export type ServerSnakeFrame = Omit<SharedSnakeState, `make${string}` | 'hue'>
export interface ServerFrame {
  serverTs: number
  clientTs: number

  snakes: Record<string, ServerSnakeFrame>
  arenaSize: number
}

export default class InterpolationController {
  private serverQueue: Array<ServerFrame> = []

  public arenaSize: number

  constructor(private game: Game) {
    this.arenaSize = game.network.state?.arenaSize || 0
  }

  public onState(state: GameState) {
    // Update snakes when we receive a new state patch
    const snakeFrames: ServerFrame['snakes'] = {}

    for (const [id, { snake }] of Object.entries(this.game.players)) {
      if (snake) {
        // TODO do we need to check for existence of state?
        snakeFrames[id] = Snake.cloneSnakeState(state.players.get(id)!.snake!)
      }
    }

    this.serverQueue.unshift({
      serverTs: this.game.network.lastServerTs,
      clientTs: Date.now(),
      snakes: snakeFrames,
      arenaSize: state.arenaSize,
    })
  }

  /** Interpolate State */
  public update(delta: number) {
    // This is the timestamp (on the server) that we're hoping to interpolate to
    const interpTarget = this.game.network.serverTime - CONFIG.interpDeltaMs

    const nextF = this.serverQueue[0]
    if (!nextF) return

    // Make sure that we have a frame between now and target time
    const canInterpolate = nextF?.serverTs >= interpTarget

    const snakes: Array<[string, Snake]> = Object.entries(this.game.players)
      .map(([id, p]) => [id, p.snake] as [string, Snake])
      .filter(([_, s]) => !!s)

    if (canInterpolate) {
      // Find a frame on the other side of the target ts
      let lastF: ServerFrame | undefined
      for (const [i, f] of this.serverQueue.entries()) {
        if (f.serverTs < interpTarget) {
          lastF = f

          // Remove old frames
          this.serverQueue.splice(i + 1)
          break
        }
      }
      if (!lastF) return // Cancel interpolation if we don't have enough frames

      // Now that we have two frames we can interpolate between them:

      // Calculate interpolation percent since last frame
      // TODO smooth framedelta?
      const frameDelta = nextF.serverTs - lastF.serverTs
      const interpProgressMs = interpTarget - lastF.serverTs
      const interpPercent = interpProgressMs / frameDelta

      // Interpolate arena walls
      this.arenaSize = lerp(lastF.arenaSize, nextF.arenaSize, interpPercent)

      // Interpolate snakes
      snakes.forEach(([id, s]) => {
        const [lastS, nextS] = [lastF!.snakes[id], nextF.snakes[id]]
        if (!lastS || !nextS) return
        s.interpolateState(
          lastS,
          nextS,
          lastF!.serverTs,
          nextF.serverTs,
          interpTarget,
          interpPercent
        )
      })
    } else {
      // We can't interpolate so extrapolate snakes from latest frame
      const frameTs = nextF.serverTs
      const serverTime = this.game.network.serverTime
      // Time between extrapolation target and last available frame
      const frameDelta = serverTime - CONFIG.interpDeltaMs - frameTs
      snakes.forEach(([id, s]) => {
        const sframe = nextF.snakes[id]
        if (sframe) s.extrapolatePosition(sframe, frameDelta)
      })
    }
  }
}
