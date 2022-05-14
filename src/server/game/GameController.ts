import GameState, { Food, PlayerState } from 'shared/serverState'
import ArenaRoom from './ArenaRoom'
import { Message, MESSAGETYPE } from 'types/networking'
import { Client } from 'colyseus'
import Snake from './Snake'
import { DeathReason } from 'types/game'
import { randomInt } from 'shared/util'
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

  public pointIsInArena(p: XY): boolean {
    return (
      Math.abs(p.x) <= this.state.arenaSize &&
      Math.abs(p.y) <= this.state.arenaSize
    )
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
        time: Date.now() - player.snake!.state.spawnTs
      }
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
}
