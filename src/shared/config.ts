const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  snake: {
    baseSpeed: 100,
    startLength: 150,
  },
  maxClientsPerRoom: 50,
})

export default CONFIG
