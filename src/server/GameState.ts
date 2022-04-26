import { Schema, type } from '@colyseus/schema'

export default class GameState extends Schema {
  @type('int16') arenaSize: number = 2000
}
