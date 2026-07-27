const { ROOM_CODE_LENGTH, ROOM_CODE_CHARS, MAX_PEERS_PER_ROOM } = require('../config');

// We still track room membership ourselves (by socket id) so we can enforce
// "max 2 peers per room" -- Socket.io's built-in rooms don't cap size on their own.
// NOTE: this only works for a single server instance. If you later scale to
// multiple signaling server instances, swap this Map for Redis (Socket.io has
// an official Redis adapter for exactly this -- socket.io-redis-adapter).
const rooms = new Map(); // Map<roomCode, Set<socketId>>

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

function createRoom(socketId) {
  const roomCode = generateRoomCode();
  rooms.set(roomCode, new Set([socketId]));
  return roomCode;
}

function joinRoom(roomCode, socketId) {
  const room = rooms.get(roomCode);

  if (!room) {
    return { success: false, error: 'Room not found' };
  }
  if (room.size >= MAX_PEERS_PER_ROOM) {
    return { success: false, error: 'Room is full' };
  }

  room.add(socketId);
  return { success: true };
}

function leaveRoom(roomCode, socketId) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.delete(socketId);
  if (room.size === 0) {
    rooms.delete(roomCode);
  }
}

function roomExists(roomCode) {
  return rooms.has(roomCode);
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  roomExists,
};
