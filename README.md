# Signaling Server

Small WebSocket server that introduces two browsers to each other so they can
establish a direct WebRTC connection. It never touches file data — only
handshake messages (room codes, offers, answers, ICE candidates).

## Folder structure

```
server/
├── src/
│   ├── config.js                    # env vars, constants
│   ├── rooms/
│   │   └── roomManager.js           # room create/join/leave, in-memory state
│   ├── websocket/
│   │   ├── connectionHandler.js     # wires ws lifecycle → message handler
│   │   └── messageHandler.js        # routes each message type
│   └── index.js                     # entry point — http + ws server setup
├── package.json
└── README.md
```

Why split this way:
- **`roomManager.js`** owns room state only. If you later move from in-memory
  storage to Redis (needed once you run more than one server instance), this
  is the only file that changes.
- **`messageHandler.js`** owns message routing/logic, independent of the raw
  websocket transport.
- **`connectionHandler.js`** is the thin glue between `ws` events and the
  message handler.
- **`index.js`** just boots the server — no business logic lives here.

## Run locally

```bash
cd server
npm install
npm start
```

Server starts on port 8080 (or `PORT` env var). Use `npm run dev` for
auto-restart on file changes during development.

## Message reference (Socket.io events)

**Client emits → Server**
| event | payload | purpose |
|---|---|---|
| `create-room` | — | Start a new room, get a code back |
| `join-room` | `{ roomCode }` | Join an existing room |
| `offer` | `{ sdp }` | Forward WebRTC offer to the other peer |
| `answer` | `{ sdp }` | Forward WebRTC answer to the other peer |
| `ice-candidate` | `{ candidate }` | Forward an ICE candidate |

**Server emits → Client**
| event | payload | meaning |
|---|---|---|
| `room-created` | `{ roomCode }` | Room successfully created |
| `room-joined` | `{ roomCode }` | You successfully joined |
| `peer-joined` | — | The other person joined your room |
| `peer-left` | — | The other person disconnected |
| `error` | `{ message }` | Something went wrong |
| `offer` / `answer` / `ice-candidate` | (relayed) | Forwarded from the other peer |

Client-side usage looks like:
```js
socket.emit('create-room');
socket.on('room-created', ({ roomCode }) => { ... });
```

## Scaling notes (for later)

- Current room storage is in-memory (`Map`/`Set`), which only works with a
  **single server instance**. Fine for now.
- To run multiple instances behind a load balancer later, use the official
  `socket.io-redis-adapter` package — it lets `socket.to(room).emit(...)`
  work correctly even when the two peers are connected to different server
  instances, without changing your event-handling code.

## Deploying to Azure App Service (free tier)

1. Create an App Service (Linux, Node 20 LTS) — choose the **F1 (Free)** tier.
2. Set the startup command to `npm start`.
3. Deploy via GitHub Actions, `az webapp up`, or ZIP deploy through the portal.
4. **Note:** F1 tier apps sleep after ~20 min idle — expect a cold-start delay
   on the first connection after inactivity.
5. Client connects to `wss://<your-app-name>.azurewebsites.net`.
