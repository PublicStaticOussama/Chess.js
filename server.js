const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors')
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');
const { pipeline } = require('stream/promises');
// const { ChessGame } = require('./chess-game'); // Import your ChessGame class

const app = express();
const server = http.createServer(app);
// const io = new Server(server);

app.use(express.static("public"));
app.use(express.json());
// app.use(cors())

// // Store active game rooms
// const gameRooms = new Map();

// // Create a new game room
// app.post('/api/rooms', (req, res) => {
//   const roomId = uuidv4();
//   const chessGame = new ChessGame();
  
//   gameRooms.set(roomId, {
//     id: roomId,
//     game: chessGame,
//     players: [],
//     status: 'waiting' // possible values: waiting, active, finished
//   });
  
//   res.status(201).json({ roomId });
// });

// // Join an existing room
// app.post('/api/rooms/:roomId/join', (req, res) => {
//   const { roomId } = req.params;
//   const { playerId } = req.body;
  
//   if (!playerId) {
//     return res.status(400).json({ error: 'Player ID is required' });
//   }
  
//   const room = gameRooms.get(roomId);
  
//   if (!room) {
//     return res.status(404).json({ error: 'Room not found' });
//   }
  
//   if (room.players.length >= 2) {
//     return res.status(400).json({ error: 'Room is full' });
//   }
  
//   // Assign color based on join order
//   const color = room.players.length === 0 ? 'w' : 'b';
//   room.players.push({ id: playerId, color });
  
//   // Start the game if two players have joined
//   if (room.players.length === 2) {
//     room.status = 'active';
//   }
  
//   res.status(200).json({ 
//     roomId, 
//     color,
//     status: room.status,
//     position: room.game.position,
//     turn: room.game.turn
//   });
// });

// // Make a move
// app.post('/api/rooms/:roomId/move', (req, res) => {
//   const { roomId } = req.params;
//   const { playerId, oldI, oldJ, newI, newJ } = req.body;
  
//   if (!playerId || oldI === undefined || oldJ === undefined || newI === undefined || newJ === undefined) {
//     return res.status(400).json({ error: 'Missing required parameters' });
//   }
  
//   const room = gameRooms.get(roomId);
  
//   if (!room) {
//     return res.status(404).json({ error: 'Room not found' });
//   }
  
//   if (room.status !== 'active') {
//     return res.status(400).json({ error: 'Game is not active' });
//   }
  
//   // Find the player in the room
//   const player = room.players.find(p => p.id === playerId);
  
//   if (!player) {
//     return res.status(403).json({ error: 'Player not in this room' });
//   }
  
//   // Check if it's the player's turn
//   if (player.color !== room.game.turn) {
//     return res.status(400).json({ error: 'Not your turn' });
//   }
  
//   // Request the move from the chess game
//   const moveResult = room.game.request_move(oldI, oldJ, newI, newJ);
  
//   // If the move was successful, notify the other player
//   if (!moveResult.includes('invalid')) {
//     // Find opponent
//     const opponent = room.players.find(p => p.id !== playerId);
    
//     if (opponent) {
//       // Emit the move to the opponent via WebSocket
//       io.to(opponent.id).emit('move', {
//         roomId,
//         from: { i: oldI, j: oldJ },
//         to: { i: newI, j: newJ },
//         result: moveResult,
//         position: room.game.position,
//         turn: room.game.turn
//       });
//     }
//   }
  
//   res.status(200).json({
//     result: moveResult,
//     position: room.game.position,
//     turn: room.game.turn
//   });
// });

// // Get current game state
// app.get('/api/rooms/:roomId', (req, res) => {
//   const { roomId } = req.params;
  
//   const room = gameRooms.get(roomId);
  
//   if (!room) {
//     return res.status(404).json({ error: 'Room not found' });
//   }
  
//   res.status(200).json({
//     roomId,
//     status: room.status,
//     position: room.game.position,
//     turn: room.game.turn,
//     playerCount: room.players.length
//   });
// });

// // WebSocket connection handling
// io.on('connection', (socket) => {
//   console.log(`User connected: ${socket.id}`);
  
//   // Associate socket with player ID
//   socket.on('register', ({ playerId, roomId }) => {
//     socket.join(playerId); // Join a room named after the player ID
    
//     if (roomId) {
//       socket.join(roomId); // Also join the game room
//     }
//   });
  
//   // Handle disconnection
//   socket.on('disconnect', () => {
//     console.log(`User disconnected: ${socket.id}`);
    
//     // Find if this player is in any game room
//     gameRooms.forEach((room, roomId) => {
//       const playerIndex = room.players.findIndex(p => io.sockets.adapter.rooms.has(p.id) === false);
      
//       if (playerIndex !== -1 && room.status === 'active') {
//         // Player was in this room and the game was active
//         const winner = room.players.find((_, index) => index !== playerIndex);
        
//         if (winner) {
//           room.status = 'finished';
          
//           // Notify the winner
//           io.to(winner.id).emit('game_over', {
//             roomId,
//             reason: 'opponent_left',
//             winner: winner.color
//           });
//         }
//       }
//     });
//   });
// });

// // Cleanup inactive rooms periodically
// const CLEANUP_INTERVAL = 1000 * 60 * 60; // 1 hour
// setInterval(() => {
//   const now = Date.now();
  
//   gameRooms.forEach((room, roomId) => {
//     // Remove rooms that are finished or have been waiting for too long
//     if (room.status === 'finished' || 
//        (room.status === 'waiting' && room.lastActivity && now - room.lastActivity > CLEANUP_INTERVAL)) {
//       gameRooms.delete(roomId);
//     }
//   });
// }, CLEANUP_INTERVAL);

app.get('/', (req, res) => {
  res.send('Bruh how did you find this ?!');
});

app.get('/get-secure-file', async (req, res) => {
  const token = req.query.token;               // “unique string”
  if (!token) return res.status(400).send('Missing token');

  const encPath = path.join(__dirname, 'details.txt.enc');
  if (!fs.existsSync(encPath)) return res.sendStatus(404);

  try {
    // ── read header piece synchronously (28 bytes) ────────────────
    const fd     = fs.openSync(encPath, 'r');
    const header = Buffer.alloc(28);
    fs.readSync(fd, header, 0, 28, 0);
    const salt   = header.subarray(0, 16);
    const iv     = header.subarray(16); // 12 bytes

    // auth-tag is the last 16 bytes of the file
    const stats     = fs.fstatSync(fd);
    const tagOffset = stats.size - 16;
    const authTag   = Buffer.alloc(16);
    fs.readSync(fd, authTag, 0, 16, tagOffset);
    fs.closeSync(fd);

    // ── derive key & set up decipher stream ───────────────────────
    const key      = crypto.scryptSync(token, salt, 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    // ── pipe: encrypted-file-body → decipher → client ─────────────
    // skip header (28 B) and tail tag (16 B) while streaming
    const encryptedBody = fs.createReadStream(encPath, {
      start: 28,
      end: tagOffset - 1
    });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="card-details.txt"'
    );

    await pipeline(encryptedBody, decipher, res);

    console.log('✓ Sent decrypted file');

    // ── clean-up ─────────────────────────────────────────────────
    fs.unlink(encPath, err =>
      err ? console.error('Delete failed:', err) : console.log('✓ File deleted')
    );
  } catch (err) {
    console.error('Decryption error:', err.message);
    if (!res.headersSent) res.sendStatus(403); // wrong token / tampered file
  }
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Chess server running on port ${PORT}`);
});