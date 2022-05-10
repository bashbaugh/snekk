const PATCHRATE = 20
const dev = process.env.NODE_ENV === 'development'

const CONFIG = Object.freeze({
  debug: dev,
  serverURL: dev ? 'ws://localhost:3002' : 'wss://server1.snekk.xyz',
  version: '0.1.0',
  fps: {
    min: 40,
    max: 80,
  },
  snake: {
    baseSpeed: 100,
    baseLength: 250,
    territoryStartMargin: 100,
    territorySpeedBoost: 50,

    scoreMultiplier: 0.01,
    lengthValMultiplier: 0.1,
    maxNameLength: 20,
  },
  interpDeltaMs: (1000 / PATCHRATE) * 1,
  server: {
    maxClientsPerRoom: 50,
    patchRate: PATCHRATE,
    devLatency: 200,
  },
  food: {
    foodInterval: 500,
    collisionRadius: 30,
    growAmount: 10,
  },
  /** Graphics */
  g: {
    snakeSaturation: 1,
    snakeLightness: 0.7,
    territorySaturation: 0.8,
    territoryLightness: 0.55,

    backgroundColor: 0x05041c,
    backgroundPatternColor: 0xd90000,
  },
})

export default CONFIG
