import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);

// Configure CORS for both Express and Socket.IO
const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "https://wavemeet-production.up.railway.app"],
  methods: ["GET", "POST"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));

// Add a basic route to test server
app.get('/', (req, res) => {
  res.send('Server is running');
});

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  path: '/socket.io/'
});

// Store active rooms
const rooms = new Map();

// STUN and TURN server configuration
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' }
];

// Helper function to normalize room IDs
const normalizeRoomId = (roomId) => {
  return roomId.toLowerCase().trim();
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle room creation and joining
  socket.on('join-room', ({ roomId, userId, userName }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    console.log(`Attempting to join room: ${normalizedRoomId} (original: ${roomId})`);
    
    if (!rooms.has(normalizedRoomId)) {
      rooms.set(normalizedRoomId, new Map());
      console.log(`Created new room: ${normalizedRoomId}`);
    }
    
    const room = rooms.get(normalizedRoomId);
    room.set(socket.id, { userId, userName });
    socket.join(normalizedRoomId);
    
    console.log(`User ${socket.id} (${userName}) joined room ${normalizedRoomId}`);
    console.log(`Current room members: ${Array.from(room.keys()).join(', ')}`);
    
    // Send room info to the joining user
    socket.emit('room-info', {
      roomId: normalizedRoomId,
      iceServers,
      peers: Array.from(room.entries())
        .filter(([id]) => id !== socket.id)
        .map(([id, user]) => ({
          id,
          userId: user.userId,
          userName: user.userName
        }))
    });

    // Notify other users in the room
    socket.to(normalizedRoomId).emit('user-joined', {
      peerId: socket.id,
      userId,
      userName,
      roomId: normalizedRoomId
    });
  });

  // Handle signaling messages
  socket.on('signal', ({ to, signal, roomId }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    console.log(`Signal from ${socket.id} to ${to} in room ${normalizedRoomId}`);
    
    io.to(to).emit('signal', {
      from: socket.id,
      signal,
      roomId: normalizedRoomId
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', ({ to, candidate, roomId }) => {
    const normalizedRoomId = normalizeRoomId(roomId);
    console.log(`ICE candidate from ${socket.id} to ${to} in room ${normalizedRoomId}`);
    
    io.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate,
      roomId: normalizedRoomId
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms
    for (const [roomId, users] of rooms.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        socket.to(roomId).emit('user-left', {
          peerId: socket.id,
          roomId
        });
        
        console.log(`User ${socket.id} left room ${roomId}`);
        console.log(`Remaining room members: ${Array.from(users).join(', ')}`);
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
});
