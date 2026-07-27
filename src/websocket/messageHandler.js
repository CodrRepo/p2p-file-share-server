const roomManager = require('../rooms/roomManager');

function handleCreateRoom(io, socket) {
  const roomCode = roomManager.createRoom(socket.id);
  socket.join(roomCode);
  socket.roomCode = roomCode;
  socket.emit('room-created', { roomCode });
}

function handleJoinRoom(io, socket, { roomCode }) {
  const result = roomManager.joinRoom(roomCode, socket.id);

  if (!result.success) {
    socket.emit('error', { message: result.error });
    return;
  }

  socket.join(roomCode);
  socket.roomCode = roomCode;
  socket.emit('room-joined', { roomCode });

  // Tell the other peer already in the room that someone joined
  socket.to(roomCode).emit('peer-joined');
}

// Offer/answer/ICE candidates: server doesn't need to understand these,
// just relay them to the other peer in the room.
function handleRelayMessage(socket, eventName, payload) {
  if (!socket.roomCode) {
    socket.emit('error', { message: 'Not in a room' });
    return;
  }
  socket.to(socket.roomCode).emit(eventName, payload);
}

function handleDisconnect(socket) {
  if (!socket.roomCode) return;
  roomManager.leaveRoom(socket.roomCode, socket.id);
  socket.to(socket.roomCode).emit('peer-left');
}

module.exports = {
  handleCreateRoom,
  handleJoinRoom,
  handleRelayMessage,
  handleDisconnect,
};
