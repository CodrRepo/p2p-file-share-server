const messageHandler = require('./messageHandler');

function handleConnection(io, socket) {
  socket.roomCode = null;
  socket.deviceId = null;

  // --- Device Identity events ---
  socket.on('register-device', (payload) => {
    messageHandler.handleRegisterDevice(io, socket, payload);
  });

  socket.on('connect-request', (payload) => {
    messageHandler.handleConnectRequest(io, socket, payload);
  });

  socket.on('connection-response', (payload) => {
    messageHandler.handleConnectionResponse(io, socket, payload);
  });

  // --- Existing room / relay events ---
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
