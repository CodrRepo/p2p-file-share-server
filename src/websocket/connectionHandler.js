const messageHandler = require('./messageHandler');

function handleConnection(io, socket) {
  socket.roomCode = null;

  socket.on('create-room', () => {
    messageHandler.handleCreateRoom(io, socket);
  });

  socket.on('join-room', (payload) => {
    messageHandler.handleJoinRoom(io, socket, payload);
  });

  // Relay events -- offer/answer/ice-candidate all just get forwarded as-is
  socket.on('offer', (payload) => {
    messageHandler.handleRelayMessage(socket, 'offer', payload);
  });

  socket.on('answer', (payload) => {
    messageHandler.handleRelayMessage(socket, 'answer', payload);
  });

  socket.on('ice-candidate', (payload) => {
    messageHandler.handleRelayMessage(socket, 'ice-candidate', payload);
  });

  socket.on('disconnect', () => {
    messageHandler.handleDisconnect(socket);
  });
}

module.exports = { handleConnection };
