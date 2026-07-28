require('dotenv').config();
module.exports = {
  PORT: process.env.PORT,
  ROOM_CODE_LENGTH: 5,
  // Excludes 0/O/1/I to avoid visual confusion when users type codes
  ROOM_CODE_CHARS: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  MAX_PEERS_PER_ROOM: 2,
  CORS_ALLOWED_ORIGINS: ["http://localhost:3000", "https://dumpzone.vercel.app"],
};
