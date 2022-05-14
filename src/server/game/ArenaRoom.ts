import { Room, Client } from 'colyseus'
import CONFIG from 'config'
import { RoomClientOptions } from 'types/room'
import GameState, { PlayerState, SnakePoint } from 'shared/serverState'
import GameController from './GameController'
import { Message, MESSAGETYPE } from 'types/networking'
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator'
import { defaultTerritorySkin } from 'shared/skins'

export default class ArenaRoom extends Room<GameState> {
  game: GameController = undefined as any

  onCreate() {
    console.log('🎮 Initializing classic arena room', this.roomId)
    this.setState(new GameState())
    this.setPatchRate(1000 / CONFIG.server.patchRate)
    this.setSimulationInterval(dt => this.game.loop(dt), 1000 / 60)
    this.maxClients = CONFIG.server.maxClientsPerRoom

    this.game = new GameController(this)

    this.clock.setInterval(() => this.game.addFood(), CONFIG.food.foodInterval)

    this.registerMessageHandlers()
  }

  registerMessageHandlers() {
    this.onMessage<Message[MESSAGETYPE.TURN]>(
      MESSAGETYPE.TURN,
      (client, data) => this.game.onPlayerTurn(client, data)
    )

    this.onMessage<Message[MESSAGETYPE.STARTBOOST]>(MESSAGETYPE.STARTBOOST, c =>
      this.game.onPlayerBoost(c, true)
    )
    this.onMessage<Message[MESSAGETYPE.STOPBOOST]>(MESSAGETYPE.STOPBOOST, c =>
      this.game.onPlayerBoost(c, false)
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
      const p = this.state.players.get(client.sessionId)!

      const name =
        d.n ||
        p.name || // If player already has a name set
        uniqueNamesGenerator({
          dictionaries: [colors, animals],
          length: 2,
          separator: ' ',
        })
      p.name = name.trim().slice(0, CONFIG.snake.maxNameLength + 1)
      p.territorySkin = d.tskin || defaultTerritorySkin
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
