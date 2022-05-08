import { Server } from 'colyseus'
import { createServer } from 'http'
import express from 'express'
import { WebSocketTransport } from '@colyseus/ws-transport'
import ArenaRoom from './game/ArenaRoom'
import { monitor } from '@colyseus/monitor'
import basicAuth from 'express-basic-auth'
import cors from 'cors'
import CONFIG from 'config'

console.log("Starting...")

const app = express()
app.use(express.json())

app.use(
  cors({
    // TODO FIX CORS (NGINX?)
    origin: ['snekk.xyz', 's.snekk.xyz', 'localhost:3000'],
  })
)

app.get('/', (req, res) =>
  res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
)

const adminAuthMiddleware = basicAuth({
  users: {
    benjamin: 'snekland50.',
  },
  challenge: true,
})
app.use('/mon', adminAuthMiddleware, monitor())

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(app),
    verifyClient: (info, next) => {
      // TODO check origin
      next(true)
    },
  }),
})

gameServer.define('arena', ArenaRoom)

const port = Number(process.env.PORT) || 3002

const start = async () => {
  gameServer.listen(port)
  if (process.env.NODE_ENV !== 'production') {
    gameServer.simulateLatency(CONFIG.server.devLatency)
  }
  console.log('👾 Game server listening on port', port)
}

start()
