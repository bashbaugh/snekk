const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  snake: {
    baseSpeed: 100,
    startLength: 150,
  },
  maxClientsPerRoom: 50,
  interpDeltaMs: 50,
  server: {
    // maxLagMs: 500,
    patchRate: 20,
  },
})

export default CONFIG
