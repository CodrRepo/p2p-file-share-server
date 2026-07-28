const roomManager = require('../rooms/roomManager');

/**
 * Register a socket under its Device ID so it can receive incoming connection
 * requests. The socket joins the private room "device:<deviceId>".
 */
function handleRegisterDevice(io, socket, { deviceId }) {
  if (!deviceId || typeof deviceId !== 'string') return;
  socket.deviceId = deviceId;
  socket.join(`device:${deviceId}`);
}

/**
 * Relay a connection request from Device A → Device B.
 * If Device B is offline (room empty), emit an error back to Device A.
 */
function handleConnectRequest(io, socket, { toDeviceId, fromDeviceId }) {
  if (!toDeviceId || !fromDeviceId) return;

  const targetRoom = `device:${toDeviceId}`;
  // io.sockets.adapter.rooms is a Map; no entry or size 0 means offline
  const room = io.sockets.adapter.rooms.get(targetRoom);
  if (!room || room.size === 0) {
    socket.emit('error', { message: `Device "${toDeviceId}" is not online.` });
    return;
  }

  // Forward the request to the target device's listener room
  io.to(targetRoom).emit('connection-request', { fromDeviceId });
}

/**
 * Relay Device B's accept/reject decision back to Device A.
 */
function handleConnectionResponse(io, socket, { accepted, toDeviceId }) {
  if (!toDeviceId) return;
  const targetRoom = `device:${toDeviceId}`;
  io.to(targetRoom).emit('connection-response', {
    accepted,
    fromDeviceId: socket.deviceId,
  });
}

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
  handleRegisterDevice,
  handleConnectRequest,
  handleConnectionResponse,
  handleCreateRoom,
  handleJoinRoom,
  handleRelayMessage,
  handleDisconnect,
};
