import { Room, Client } from 'colyseus'
import CONFIG from 'shared/config'
import { MESSAGETYPE } from 'shared/networking'
import { RoomClientOptions } from 'types/room'
import GameState, { Player, Point } from './GameState'
import * as snakeBehaviour from 'shared/snake'
import GameController from './GameController'

export default class GameRoom extends Room<GameState> {
  game: GameController

  constructor () {
    super()
    this.game = new GameController(this)
  }

  onCreate() {
    console.log('🎮 Initializing standard game room')
    this.setState(new GameState())
    this.setPatchRate(1000 / 30) // 30FPS networking
    this.setSimulationInterval(dt => this.game.loop(dt), 1000 / 60)

    this.maxClients = CONFIG.maxClientsPerRoom
  }

  onJoin(client: Client, options: RoomClientOptions) {
    const p = this.state.players.set(
      client.id,
      new Player(this.state.arenaSize)
    )
    client.send(MESSAGETYPE.SPAWN, {
      point: p.get(client.id)!.snake!.points[0],
    })
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.id)
  }

  onDispose() {}
}
