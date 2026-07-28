const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const config = require('./config');
const { handleConnection } = require('./websocket/connectionHandler');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.CORS_ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.get('/', (req, res) => {
  res.send('Signaling server is running');
});

// console.log('CORS allowed origins:', config.CORS_ALLOWED_ORIGINS);

io.on('connection', (socket) => {
  handleConnection(io, socket);
});

server.listen(config.PORT, () => {
  console.log(`Signaling server listening on port ${config.PORT}`);
});
