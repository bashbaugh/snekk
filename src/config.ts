const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  version: '0.1.0',
  snake: {
    baseSpeed: 100,
    startLength: 150,
    startTerritoryMargin: 100,
  },
  maxClientsPerRoom: 50,
  interpDeltaMs: 50,
  server: {
    // maxLagMs: 500,
    patchRate: 20,
  },
})

export default CONFIG
