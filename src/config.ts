const PATCHRATE = 20

const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  version: '0.1.0',
  fps: {
    min: 40,
    max: 80
  },
  snake: {
    baseSpeed: 100,
    baseLength: 250,
    territoryStartMargin: 100,
  },
  interpDeltaMs: (1000 / PATCHRATE) * 1,
  server: {
    maxClientsPerRoom: 50,
    patchRate: PATCHRATE,
    devLatency: 200
  },
  food: {
    foodInterval: 500,
    collisionRadius: 30,
    growAmount: 10,
  },
})

export default CONFIG
