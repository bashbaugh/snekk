const CONFIG = Object.freeze({
  debug: process.env.NODE_ENV === 'development',
  snake: {
    baseSpeed: 1,
    startLength: 150,
  },
  maxClientsPerRoom: 50,
})

export default CONFIG
