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
/*const Component = require(`../component.js`)
const net = require('net')

class SocketHandler extends Component {
    constructor(app) {
        super(app)
        this.app = app
        this.id = 'SocketHandler'
        this.server = net.createServer(s => {
          s.on('connect', () => {
            s.write('Client connected')
          })
          s.on('end', () => {
            s.write('Client disconnected')
          })
          s.on('data', (data) => {
            console.log('client > ', data)
          })
          //s.write('Bonjour, je suis le server')
          s.pipe(s)
        }).listen(8001)

        this.client = net.connect({port: 8001}, () => {
          console.log('client connected')
      })
    }
    write (data) {
      this.client.write(data)
    }
}

module.exports = app => new SocketHandler(app)*/
