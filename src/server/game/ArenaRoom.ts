import { Room, Client } from 'colyseus'
import CONFIG from 'config'
import { RoomClientOptions } from 'types/room'
import GameState, { PlayerState, SnakePoint } from 'shared/serverState'
import GameController from './GameController'
import { Message, MESSAGETYPE } from 'types/networking'

export default class ArenaRoom extends Room<GameState> {
  game: GameController = undefined as any

  onCreate() {
    console.log('🎮 Initializing classic arena room')
    this.setState(new GameState())
    this.setPatchRate(1000 / CONFIG.server.patchRate)
    this.setSimulationInterval(dt => this.game.loop(dt), 1000 / 60)
    this.maxClients = CONFIG.maxClientsPerRoom

    this.game = new GameController(this)

    this.registerMessageHandlers()
  }

  registerMessageHandlers() {
    this.onMessage<Message[MESSAGETYPE.TURN]>(
      MESSAGETYPE.TURN,
      (client, data) => this.game.onPlayerTurn(client, data)
    )

    // Ping handler
    this.onMessage<Message[MESSAGETYPE.TIMESYNC]>(
      MESSAGETYPE.TIMESYNC,
      (client, data) => {
        client.send(MESSAGETYPE.TIMESYNC, {
          i: data.i,
          t: this.clock.currentTime,
        })
      }
    )

    this.onMessage<Message[MESSAGETYPE.JOIN]>(MESSAGETYPE.JOIN, (client, d) => {
      this.state.players.get(client.sessionId)!.name = d.n
      this.game.spawnSnake(client.sessionId)
    })
  }

  onJoin(client: Client, options: RoomClientOptions) {
    console.log('💻 Player', client.sessionId, 'joined', this.roomId)
    this.game.addPlayer(client)
  }

  onLeave(client: Client, consented: boolean) {
    console.log('❌ Player', client.sessionId, 'left', this.roomId)
    this.game.removePlayer(client)
  }

  onDispose() {}
}
