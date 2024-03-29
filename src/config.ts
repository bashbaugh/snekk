const IS_DEV = process.env.NODE_ENV !== 'production'
export const DEV_PORT = 3001

const PATCHRATE = 20
const INTERP_FRAMES_DELTA = 1 // at least 1
export const DEV_SCALE = false

const CONFIG = Object.freeze({
  version: '0.2.5',
  gameName: 'sneks.zone',
  gameEmail: 'contact@sneks.zone',
  debug: IS_DEV,
  serverURL: IS_DEV ? `ws://localhost:${DEV_PORT}` : 'wss://server1.snekk.xyz',
  fps: {
    min: 40,
    max: 80,
  },
  targetScale: {
    width: 1440,
    height: 768,
    devWidth: 2560,
    devHeight: 2000,
  },
  snake: {
    baseSpeed: 100,
    baseLength: IS_DEV ? 2000 : 300,
    snakeBoostSpeed: 300,
    boostCostPerSec: 100,
    minLength: 200,
    territoryStartMargin: 100,
    territorySpeedBoost: 50,

    tScoreMultiplier: 0.01,
    lScoreMultiplier: 0.3,
    kScoreMultiplier: 1000,

    lengthValMultiplier: 0.1,
    maxNameLength: 20,

    // allowFreezing: !!dev
    allowFreezing: true,
  },
  arena: {
    spawnPadding: 50,
    areaPerSnake: 2000 ** 2,
    minArea: 2000 ** 2,
    resizePeriod: 3,
    resizePadding: 50,
  },
  interpDeltaMs: (1000 / PATCHRATE) * INTERP_FRAMES_DELTA,
  server: {
    maxClientsPerRoom: 20,
    patchRate: PATCHRATE,
    devLatency: 200,
    networkCullMargin: 50,
  },
  food: {
    foodInterval: 200,
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
    snakeMinWidth: 6,
    snakeMaxWidth: 12,
    territorySaturation: 0.8,
    territoryLightness: 0.55,

    backgroundColor: 0x05041c,
    backgroundPatternColor: 0xd90000,

    cullMargin: 30,
  },
})

export default CONFIG
