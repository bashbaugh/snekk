const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  snake: {
    baseSpeed: 100,
    startLength: 100,
  },
  maxClientsPerRoom: 50,
  interpDeltaMs: 100,
  server: {
    // maxLagMs: 500,
    patchRate: 10,
  },
})

export default CONFIG
