const debug = require('debug')('linto-admin:ioevents')
const EventEmitter = require('eventemitter3')
const io = require('socket.io')

class SocketHandler extends EventEmitter {
  constructor(app) {
    super(app)
    this.app = app
    this.id = 'SocketHandler'
    this.socket = io.listen(process.env.WEBSOCKET_PORT)
    this.socket.on('connection', (socket) => {
      console.log('Connection socketio ???')
      socket.on('linto_admin', (data) => {
        console.log(data)
        socket.emit('stt', 'Voila ma réponse')
      })
    })
  }
  write (channel, data) {
    console.log('EMIT ? ', channel, data)
    this.socket.emit(channel, data)
  }
}

module.exports = app => new SocketHandler(app)
