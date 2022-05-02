const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  version: '0.1.0',
  snake: {
    baseSpeed: 100,
    startLength: 250,
    startTerritoryMargin: 100,
  },
  maxClientsPerRoom: 50,
  interpDeltaMs: 50,
  server: {
    patchRate: 20,
  },
  food: {
    foodInterval: 500,
    collisionRadius: 30,
    growAmount: 10
  }
})

export default CONFIG
