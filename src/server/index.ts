import { Server } from 'colyseus'
import { createServer } from 'http'
import express from 'express'
import { WebSocketTransport } from '@colyseus/ws-transport'
import GameRoom from './GameRoom'
import { monitor } from '@colyseus/monitor'
import basicAuth from 'express-basic-auth'

console.log('Starting...')

const app = express()
app.use(express.json())

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

gameServer.define('classic', GameRoom)

const port = Number(process.env.port) || 3001

const start = async () => {
  gameServer.listen(port)
  console.log('👾 Game server listening on port', port)
}

start()
