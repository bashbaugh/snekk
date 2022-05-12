const PATCHRATE = 20
const dev = process.env.NODE_ENV === 'development'

const CONFIG = Object.freeze({
  gameName: 'Snekk.io',
  gameEmail: 'contact@snekk.xyz',
  debug: dev,
  serverURL: dev ? 'ws://localhost:3001' : 'wss://server1.snekk.xyz',
  version: '0.1.0',
  fps: {
    min: 40,
    max: 80,
  },
  snake: {
    baseSpeed: 100,
    baseLength: 250,
    snakeBoostSpeed: 300,
    boostCostPerSec: 100,
    minLength: 200,
    territoryStartMargin: 100,
    territorySpeedBoost: 50,

    scoreMultiplier: 0.01,
    lengthValMultiplier: 0.1,
    maxNameLength: 20,
  },
  interpDeltaMs: (1000 / PATCHRATE) * 1,
  server: {
    maxClientsPerRoom: 15,
    patchRate: PATCHRATE,
    devLatency: 200,
  },
  food: {
    foodInterval: 500,
    collisionRadius: 30,
    radius: 10,
    pulseRadius: 2,
    pulseRate: 0.3,
    growAmount: 10,
  },
  /** Graphics */
  g: {
    snakeSaturation: 1,
    snakeLightness: 0.8,
    territorySaturation: 0.8,
    territoryLightness: 0.55,

    backgroundColor: 0x05041c,
    backgroundPatternColor: 0xd90000,
  },
})

export default CONFIG
