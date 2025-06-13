import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Meeting from './models/Meeting.js';
import ChatMessage from './models/ChatMessage.js';

dotenv.config();

// ── App Setup ──────────────────────────────────────────────
const app = express();
const server = createServer(app);

app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://wavemeet-frontend.onrender.com',
];

const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true,
};

app.use(cors(corsOptions));

// ── MongoDB Connection ─────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wavemeet';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('[OK] MongoDB connected'))
  .catch((err) => console.error('[ERROR] MongoDB connection error:', err.message));

// ── ICE Server Config (STUN/TURN) ─────────────────────────
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
];

// ── In-Memory Room Tracker ─────────────────────────────────
const rooms = new Map();

const normalizeRoomId = (roomId) => roomId.toLowerCase().trim();

// ── REST API Routes ────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'WaveMeet signaling server is running' });
});

// Get meeting info
app.get('/api/meeting/:roomId', async (req, res) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chat history for a room
app.get('/api/chat/:roomId', async (req, res) => {
  try {
    const roomId = normalizeRoomId(req.params.roomId);
    const messages = await ChatMessage.find({ roomId })
      .sort({ timestamp: 1 })
      .limit(200);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Socket.IO Setup ────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.on('connection', (socket) => {
  console.log(`[SOCKET] Connected: ${socket.id}`);

  // ── Join Room ──────────────────────────────────────────
  socket.on('join-room', async ({ roomId, userId, userName }) => {
    const nRoomId = normalizeRoomId(roomId);

    // Track in memory
    if (!rooms.has(nRoomId)) {
      rooms.set(nRoomId, new Map());
    }

    const room = rooms.get(nRoomId);
    room.set(socket.id, { userId, userName });
    socket.join(nRoomId);

    // Save to DB (create meeting if first user)
    try {
      let meeting = await Meeting.findOne({ roomId: nRoomId });
      if (!meeting) {
        meeting = await Meeting.create({
          roomId: nRoomId,
          hostId: userId,
          hostName: userName,
          participants: [{ userId, userName }],
        });
      } else {
        const alreadyIn = meeting.participants.some(
          (p) => p.userId === userId && !p.leftAt
        );
        if (!alreadyIn) {
          meeting.participants.push({ userId, userName });
          await meeting.save();
        }
      }
    } catch (err) {
      console.error('DB error on join:', err.message);
    }

    // Build peer list (everyone already in room except the joiner)
    const peers = Array.from(room.entries())
      .filter(([id]) => id !== socket.id)
      .map(([id, user]) => ({
        socketId: id,
        userId: user.userId,
        userName: user.userName,
      }));

    // Send room info + ICE config to the joining user
    socket.emit('room-joined', {
      roomId: nRoomId,
      iceServers,
      peers,
    });

    // Tell everyone else about the new user
    socket.to(nRoomId).emit('user-joined', {
      socketId: socket.id,
      userId,
      userName,
    });

    console.log(`[JOIN] ${userName} joined room ${nRoomId} (${room.size} users)`);
  });

  // ── WebRTC Signaling: Offer ────────────────────────────
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', {
      from: socket.id,
      offer,
    });
  });

  // ── WebRTC Signaling: Answer ───────────────────────────
  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', {
      from: socket.id,
      answer,
    });
  });

  // ── WebRTC Signaling: ICE Candidate ────────────────────
  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', {
      from: socket.id,
      candidate,
    });
  });

  // ── Chat Message ───────────────────────────────────────
  socket.on('chat-message', async ({ roomId, userId, userName, message }) => {
    const nRoomId = normalizeRoomId(roomId);
    const timestamp = new Date();

    // Broadcast to everyone in room (including sender)
    io.in(nRoomId).emit('chat-message', {
      senderId: userId,
      senderName: userName,
      message,
      timestamp,
    });

    // Persist to DB
    try {
      await ChatMessage.create({
        roomId: nRoomId,
        senderId: userId,
        senderName: userName,
        message,
        timestamp,
      });
    } catch (err) {
      console.error('DB error saving chat:', err.message);
    }
  });

  // ── Toggle Media (notify peers) ────────────────────────
  socket.on('toggle-media', ({ roomId, kind, enabled }) => {
    const nRoomId = normalizeRoomId(roomId);
    socket.to(nRoomId).emit('peer-media-toggle', {
      socketId: socket.id,
      kind, // 'audio' or 'video'
      enabled,
    });
  });

  // ── Screen Share status ────────────────────────────────
  socket.on('screen-share', ({ roomId, sharing }) => {
    const nRoomId = normalizeRoomId(roomId);
    socket.to(nRoomId).emit('peer-screen-share', {
      socketId: socket.id,
      sharing,
    });
  });

  // ── Leave Room ─────────────────────────────────────────
  socket.on('leave-room', ({ roomId }) => {
    const nRoomId = normalizeRoomId(roomId);
    handleUserLeave(socket, nRoomId);
  });

  // ── Disconnect ─────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[SOCKET] Disconnected: ${socket.id}`);
    // Remove from all rooms
    for (const [roomId] of rooms.entries()) {
      handleUserLeave(socket, roomId);
    }
  });
});

// ── Helper: handle user leaving a room ─────────────────────
async function handleUserLeave(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.has(socket.id)) return;

  const user = room.get(socket.id);
  room.delete(socket.id);
  socket.leave(roomId);

  // Notify remaining peers
  socket.to(roomId).emit('user-left', {
    socketId: socket.id,
  });

  console.log(`[LEAVE] ${user.userName} left room ${roomId} (${room.size} left)`);

  // Update DB
  try {
    const meeting = await Meeting.findOne({ roomId });
    if (meeting) {
      const participant = meeting.participants.find(
        (p) => p.userId === user.userId && !p.leftAt
      );
      if (participant) {
        participant.leftAt = new Date();
        await meeting.save();
      }

      // If room is empty, mark meeting as ended
      if (room.size === 0) {
        meeting.status = 'ended';
        meeting.endedAt = new Date();
        await meeting.save();
        rooms.delete(roomId);
        console.log(`[ROOM] Room ${roomId} ended and cleaned up`);
      }
    }
  } catch (err) {
    console.error('DB error on leave:', err.message);
  }
}

// ── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[SERVER] WaveMeet server running on port ${PORT}`);
  console.log(`[SERVER] http://localhost:${PORT}`);
});
