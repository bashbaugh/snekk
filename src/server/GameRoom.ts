import { Room, Client } from 'colyseus'
import CONFIG from 'shared/config'
import { RoomClientOptions } from 'types/room'
import GameState from './GameState'

export default class GameRoom extends Room<GameState> {
  onCreate() {
    console.log('🎮 Initializing standard game room')
    this.setState(new GameState())
    this.setPatchRate(1000 / 30) // 30FPS networking
    this.setSimulationInterval(dt => this.update(dt), 1000 / 60)

    this.maxClients = CONFIG.maxClientsPerRoom
  }

  onJoin(client: Client, options: RoomClientOptions) {}

  onLeave(client: Client, consented: boolean) {}

  update(delta: number) {}

  onDispose() {}
}
