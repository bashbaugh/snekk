const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  snake: {
    baseSpeed: 100,
    startLength: 150,
  },
  maxClientsPerRoom: 50,
  interpDelta: 100,
  server: {
    maxLagMs: 500,
    patchRate: 10,
  },
})

export default CONFIG
