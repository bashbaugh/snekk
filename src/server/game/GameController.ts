import GameState, { Food, PlayerState } from 'shared/serverState'
import ArenaRoom from './ArenaRoom'
import { Message, MESSAGETYPE } from 'types/networking'
import { Client } from 'colyseus'
import Snake from './Snake'
import { DeathReason } from 'types/game'
import { cubicEaseInterp, randomInt } from 'shared/util'
import CONFIG from 'config'
import {
  getLineIntersection,
  polygonDiff,
  polygonIntersection,
} from 'shared/geometry'

export default class GameController {
  room: ArenaRoom
  state: GameState

  players: Record<
    string,
    {
      snake?: Snake
      client: Client
    }
  > = {}

  arenaResizeTs?: number
  arenaResizeFrom?: number
  arenaResizeTarget?: number

  constructor(room: ArenaRoom) {
    this.room = room
    this.state = room.state
  }

  getRandomPoint(offset: number = 0, inEmptySpace?: boolean): XY {
    pointLoop: while (true) {
      const p = {
        x: randomInt(
          -this.state.arenaSize + offset,
          this.state.arenaSize - offset
        ),
        y: randomInt(
          -this.state.arenaSize + offset,
          this.state.arenaSize - offset
        ),
      }
      if (!inEmptySpace) return p

      // check that the point is not in any territory
      for (const [id, player] of Object.entries(this.players)) {
        if (player.snake?.pointIsInTerritory(p)) continue pointLoop
      }

      return p
    }
  }

  public pointIsInArena(p: XY, overrideArenaSize?: number): boolean {
    const s = overrideArenaSize ?? this.state.arenaSize
    return Math.abs(p.x) <= s && Math.abs(p.y) <= s
  }

  addPlayer(client: Client) {
    const playerState = new PlayerState(client.id)
    this.players[client.id] = {
      client,
    }
    this.state.players.set(client.id, playerState)
  }

  spawnSnake(playerId: string) {
    // Create a new snake instance and spawn it
    const p = this.players[playerId]
    p.snake = new Snake(this, this.state.players.get(playerId)!)
    p.client.send(MESSAGETYPE.SPAWN, {
      s: p.snake.state,
    })
  }

  removePlayer(client: Client) {
    delete this.players[client.id]
    this.state.players.delete(client.id)
  }

  killSnake(id: string, cause: DeathReason, killer?: string) {
    const player = this.players[id]
    if (!player) return

    const deathMsg: Message[MESSAGETYPE.DEATH] = {
      c: cause,
      p: id,
      k: killer,
      s: {
        kills: player.snake!.state.kills,
        score: Math.ceil(player.snake!.state.score),
        time: Date.now() - player.snake!.state.spawnTs,
      },
    }

    player.snake?.die()
    delete player.snake
    const pState = this.state.players.get(id)
    if (!pState?.snake) return
    pState.snake = undefined // NOT DELETE

    player.client.send(MESSAGETYPE.DEATH, deathMsg)
  }

  loop(delta: number) {
    for (const [id, player] of Object.entries(this.players)) {
      player.snake?.update(delta)
    }

    this.resizeArena()

    this.state.ts = this.room.clock.currentTime
  }

  addFood() {
    this.state.food.push(new Food(this.getRandomPoint(), randomInt(360)))
  }

  onPlayerTurn(client: Client, data: Message[MESSAGETYPE.TURN]) {
    this.players[client.id].snake?.turn(data)
  }

  onPlayerBoost(client: Client, boosting: boolean) {
    this.players[client.id].snake?.boost(boosting)
  }

  setPlayerFrozen(client: Client, frozen: boolean) {
    this.players[client.id].snake!.state.frozen = frozen
  }

  clipTerritories(playerId: string) {
    const playerA = this.players[playerId]
    for (const [id, playerB] of Object.entries(this.players)) {
      if (!playerB.snake) continue
      if (id === playerId) continue

      // Calculate the intersection of territories and subtract it from the other players
      const intersection = polygonIntersection([
        playerA.snake!.state.territory,
        playerB.snake.state.territory,
      ])

      if (!intersection?.length) continue

      playerB.snake.state.territory = polygonDiff(
        [playerB.snake.state.territory],
        [intersection]
      )[0].map(playerB.snake.state.makePoint)
    }
  }

  /** Update arena sized based on number of active snakes */
  resizeArena() {
    if (this.arenaResizeTarget) {
      // Currently resizing arena
      const elapsed = Date.now() - this.arenaResizeTs!
      const progress = elapsed / 1000 / CONFIG.arena.resizePeriod

      if (progress >= 1) {
        this.arenaResizeTarget = undefined
        return
      }

      this.state.arenaSize = cubicEaseInterp(
        this.arenaResizeFrom!,
        this.arenaResizeTarget,
        progress
      )

      return
    }

    const numSnakes = Object.values(this.players).filter(p => p.snake).length
    // Half of square root of area
    const targetArenaSize =
      Math.max(
        Math.sqrt(CONFIG.arena.minArea),
        Math.sqrt(numSnakes * CONFIG.arena.areaPerSnake)
      ) / 2

    if (targetArenaSize === this.state.arenaSize) return
    if (targetArenaSize < this.state.arenaSize) {
      // If we are shrinking arena need to make sure there's no territory/snakes at the edges
      for (const [id, player] of Object.entries(this.players)) {
        if (!player.snake) continue
        // Make sure territory and head aren't near edge
        if (
          !this.pointIsInArena(
            player.snake.head,
            targetArenaSize - CONFIG.arena.resizePadding
          )
        )
          return
        for (const p of player.snake.state.territory) {
          if (
            !this.pointIsInArena(
              p,
              targetArenaSize - CONFIG.arena.resizePadding
            )
          )
            return
        }
      }
    }

    // Begin resize
    this.arenaResizeTarget = targetArenaSize
    this.arenaResizeFrom = this.state.arenaSize
    this.arenaResizeTs = Date.now()
  }
}
