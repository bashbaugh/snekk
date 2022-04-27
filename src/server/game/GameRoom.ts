import { Room, Client } from 'colyseus'
import CONFIG from 'shared/config'
import { RoomClientOptions } from 'types/room'
import GameState, { PlayerState, Point } from 'shared/serverState'
import GameController from './GameController'
import { Message, MESSAGETYPE } from 'types/networking'

export default class GameRoom extends Room<GameState> {
  game: GameController = undefined as any

  onCreate() {
    console.log('🎮 Initializing classic game room')
    this.setState(new GameState())
    this.setPatchRate(1000 / 30) // 30FPS networking
    this.setSimulationInterval(dt => this.game.loop(dt), 1000 / 60)
    this.maxClients = CONFIG.maxClientsPerRoom

    this.game = new GameController(this)

    this.registerMessageHandlers()
  }

  registerMessageHandlers() {
    this.onMessage<Message[MESSAGETYPE.TURN]>(
      MESSAGETYPE.TURN,
      (client, data) => this.game.onPlayerTurn(client, data.d)
    )
  }

  onJoin(client: Client, options: RoomClientOptions) {
    console.log('💻 Player', client.sessionId, 'joined', this.roomId)
    this.game.addPlayer(client)
  }

  onLeave(client: Client, consented: boolean) {
    this.game.removePlayer(client)
  }

  onDispose() {}
}
