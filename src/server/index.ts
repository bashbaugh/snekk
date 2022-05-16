console.log('Starting...')
import { Server } from 'colyseus'
import express from 'express'
import expressify from 'uwebsockets-express'
import { uWebSocketsTransport } from '@colyseus/uwebsockets-transport'
import ArenaRoom from './game/ArenaRoom'
import { monitor } from '@colyseus/monitor'
import basicAuth from 'express-basic-auth'
import cors from 'cors'
import CONFIG from 'config'

const transport = new uWebSocketsTransport({
  idleTimeout: 32,
})

const app = expressify(transport.app)
app.use(express.json())

app.use(
  cors({
    // TODO FIX CORS
    origin: '*',
  })
)

app.get('/', (req, res) =>
  res.redirect('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
)

app.get('/version', (req, res) => res.send(CONFIG.version))

const adminAuthMiddleware = basicAuth({
  users: {
    benjamin: 'snekland50.',
  },
  challenge: true,
})
app.use('/mon', adminAuthMiddleware as any, monitor())

const gameServer = new Server({ transport })

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
