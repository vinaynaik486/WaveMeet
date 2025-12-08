import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Meeting from './models/Meeting.js';
import ChatMessage from './models/ChatMessage.js';
import logger from './utils/logger.js';

dotenv.config();

const app = express();
const server = createServer(app);

app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://wavemeet-frontend.onrender.com',
  process.env.CLIENT_URL, // Dynamic Vercel/Production URL
].filter(Boolean);

app.use(cors({ origin: allowedOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: true }));

// ── MongoDB ────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wavemeet';
mongoose.connect(MONGO_URI)
  .then(() => logger.info('[OK] MongoDB connected'))
  .catch((err) => logger.error('[ERROR] MongoDB:', err.message));

// ── REST API Routes (dynamic import for ESM compat) ────────
// Auth
app.post('/api/auth/sync', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const { firebaseUid, displayName, email, photoURL } = req.body;
    let user = await User.findOne({ firebaseUid });
    if (!user) user = await User.create({ firebaseUid, displayName, email, photoURL });
    else { user.displayName = displayName || user.displayName; user.photoURL = photoURL || user.photoURL; await user.save(); }
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const user = await User.findOne({ firebaseUid: req.query.uid });
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Meetings CRUD
app.post('/api/meetings', async (req, res) => {
  try {
    const { title, hostId, scheduledAt, duration, recurring, invitees, password } = req.body;
    const roomId = Math.random().toString(36).substring(2, 10);
    const meeting = await Meeting.create({ roomId, title: title || 'WaveMeet Room', hostId, password, scheduledAt, duration, recurring, invitees, status: scheduledAt ? 'scheduled' : 'active' });
    res.json({ meeting });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/meetings', async (req, res) => {
  try {
    const q = {};
    if (req.query.hostId) q.hostId = req.query.hostId;
    if (req.query.status) q.status = req.query.status;
    const meetings = await Meeting.find(q).sort({ scheduledAt: 1 }).limit(50);
    res.json({ meetings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/meetings/:roomId', async (req, res) => {
  try {
    const m = await Meeting.findOne({ roomId: req.params.roomId });
    if (!m) return res.status(404).json({ error: 'Not found' });
    res.json({ meeting: m });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/meetings/:roomId', async (req, res) => {
  try {
    const m = await Meeting.findOneAndUpdate({ roomId: req.params.roomId }, { $set: req.body }, { new: true });
    res.json({ meeting: m });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/meetings/:roomId', async (req, res) => {
  try { await Meeting.deleteOne({ roomId: req.params.roomId }); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Chat history
app.get('/api/chat/:roomId', async (req, res) => {
  try {
    const q = { roomId: req.params.roomId };
    if (req.query.before) q._id = { $lt: req.query.before };
    const msgs = await ChatMessage.find(q).sort({ createdAt: -1 }).limit(parseInt(req.query.limit) || 50);
    res.json({ messages: msgs.reverse() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const Notification = (await import('./models/Notification.js')).default;
    const q = { userId: req.query.userId };
    if (req.query.unread === 'true') q.read = false;
    const notifications = await Notification.find(q).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.query.userId, read: false });
    res.json({ notifications, unreadCount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const Notification = (await import('./models/Notification.js')).default;
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// User settings
app.put('/api/users/settings', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const user = await User.findOneAndUpdate({ firebaseUid: req.body.firebaseUid }, { $set: { settings: req.body.settings } }, { new: true });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/profile', async (req, res) => {
  try {
    const User = (await import('./models/User.js')).default;
    const upd = {};
    if (req.body.displayName) upd.displayName = req.body.displayName;
    if (req.body.statusMessage !== undefined) upd.statusMessage = req.body.statusMessage;
    const user = await User.findOneAndUpdate({ firebaseUid: req.body.firebaseUid }, { $set: upd }, { new: true });
    res.json({ user });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Calendar
app.get('/api/calendar', async (req, res) => {
  try {
    const { hostId, month, year } = req.query;
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);
    const meetings = await Meeting.find({ hostId, scheduledAt: { $gte: start, $lte: end } }).sort({ scheduledAt: 1 });
    res.json({ meetings });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Health check
app.get('/', (_, res) => res.json({ status: 'WaveMeet API running' }));

// ── ICE Servers ────────────────────────────────────────────
const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

// ── Socket.IO ──────────────────────────────────────────────
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true } });

// Room state (in-memory)
const rooms = new Map(); // roomId -> Map(socketId -> { odId, userName, audioEnabled, videoEnabled })

io.on('connection', (socket) => {
  logger.info(`[SOCKET] Connected: ${socket.id}`);

  /**
   * Handles user requests to join a meeting room.
   * Intercepts users if the room is locked (Waiting Room enabled) unless they are pre-approved or the host.
   */
  socket.on('join-room', async ({ roomId, userId, userName, photoURL, approved, waitingRoomEnabled }) => {
    const nRoomId = roomId.trim().toLowerCase();

    // Security Gate: Check if Waiting Room is active for non-host participants.
    if (!approved) {
      try {
        const meeting = await Meeting.findOne({ roomId: nRoomId });
        if (meeting && meeting.waitingRoomEnabled && meeting.hostId !== userId) {
          socket.join(nRoomId + ':waiting');
          io.to(nRoomId).emit('join-request-received', { odId: userId, displayName: userName, photoURL, socketId: socket.id });
          socket.emit('waiting-room', { message: 'Waiting for host to accept...' });
          await Meeting.findOneAndUpdate({ roomId: nRoomId }, { $push: { waitingRoom: { odId: userId, displayName: userName, socketId: socket.id } } });
          logger.info(`[WAITING] ${userName} waiting to join ${nRoomId}`);
          return;
        }
      } catch (e) { /* proceed with normal join if DB lookup fails */ }
    }

    // Initialize presence in WebRTC state map
    socket.join(nRoomId);

    if (!rooms.has(nRoomId)) rooms.set(nRoomId, new Map());
    const room = rooms.get(nRoomId);

    // Bootstrap connection by transmitting existing peer states
    const existingUsers = [];
    for (const [sid, info] of room.entries()) {
      existingUsers.push({ socketId: sid, ...info });
    }
    socket.emit('room-users', { users: existingUsers, iceServers });

    // Register current participant
    room.set(socket.id, { odId: userId, userName, photoURL, audioEnabled: true, videoEnabled: true });

    // Broadcast entry to connected peers
    socket.to(nRoomId).emit('user-joined', { socketId: socket.id, odId: userId, userName, photoURL });

    // Persist participant entry and create ad-hoc meeting record if missing
    let updatedMeeting;
    try {
      updatedMeeting = await Meeting.findOneAndUpdate({ roomId: nRoomId }, {
        $push: { participants: { odId: userId, displayName: userName, role: 'participant' } },
        $set: { status: 'active' },
        $setOnInsert: { hostId: userId, title: 'Ad-hoc Meeting', waitingRoomEnabled: waitingRoomEnabled || false },
      }, { upsert: true, setDefaultsOnInsert: true, new: true });
      
      socket.emit('room-info', {
        hostId: updatedMeeting.hostId,
        waitingRoomEnabled: updatedMeeting.waitingRoomEnabled
      });
    } catch (e) { logger.error('[DB]', e.message); }

    // Load chat history
    try {
      const history = await ChatMessage.find({ roomId: nRoomId }).sort({ createdAt: -1 }).limit(50);
      socket.emit('chat-history', history.reverse());
    } catch (e) { /* ignore */ }

    // Load tasks
    try {
      const meeting = await Meeting.findOne({ roomId: nRoomId });
      if (meeting?.tasks) socket.emit('tasks-updated', meeting.tasks);
      
      // Load pending requests if user is host
      if (meeting && meeting.hostId === userId && meeting.waitingRoom && meeting.waitingRoom.length > 0) {
        socket.emit('pending-requests', meeting.waitingRoom);
      }
    } catch (e) { /* ignore */ }

    logger.info(`[JOIN] ${userName} joined ${nRoomId} (${room.size} users)`);
  });

  // ── WebRTC Signaling ──────────────────────────────────
  socket.on('offer', ({ to, offer }) => {
    io.to(to).emit('offer', { from: socket.id, offer });
  });

  socket.on('answer', ({ to, answer }) => {
    io.to(to).emit('answer', { from: socket.id, answer });
  });

  socket.on('ice-candidate', ({ to, candidate }) => {
    io.to(to).emit('ice-candidate', { from: socket.id, candidate });
  });

  // ── Media Controls ────────────────────────────────────
  socket.on('toggle-audio', ({ roomId, enabled }) => {
    const room = rooms.get(roomId);
    if (room?.has(socket.id)) {
      room.get(socket.id).audioEnabled = enabled;
      socket.to(roomId).emit('user-media-toggle', { socketId: socket.id, audioEnabled: enabled, videoEnabled: room.get(socket.id).videoEnabled });
    }
  });

  socket.on('toggle-video', ({ roomId, enabled }) => {
    const room = rooms.get(roomId);
    if (room?.has(socket.id)) {
      room.get(socket.id).videoEnabled = enabled;
      socket.to(roomId).emit('user-media-toggle', { socketId: socket.id, audioEnabled: room.get(socket.id).audioEnabled, videoEnabled: enabled });
    }
  });

  socket.on('screen-share-start', ({ roomId }) => {
    socket.to(roomId).emit('screen-share-start', { socketId: socket.id });
  });

  socket.on('screen-share-stop', ({ roomId }) => {
    socket.to(roomId).emit('screen-share-stop', { socketId: socket.id });
  });

  // ── Chat ──────────────────────────────────────────────
  socket.on('chat-message', async ({ roomId, message, senderId, senderName }) => {
    const msg = { roomId, senderId, senderName, message, type: 'text', createdAt: new Date() };
    io.to(roomId).emit('new-message', msg);
    try { await ChatMessage.create(msg); } catch (e) { /* ignore */ }
  });

  socket.on('typing', ({ roomId, userName }) => {
    socket.to(roomId).emit('user-typing', { userName });
  });

  // ── Reactions ─────────────────────────────────────────
  socket.on('reaction', ({ roomId, emoji }) => {
    const room = rooms.get(roomId);
    const user = room?.get(socket.id);
    if (user) {
      io.to(roomId).emit('user-reaction', { socketId: socket.id, userName: user.userName, emoji });
    }
  });

  // ── Tasks ─────────────────────────────────────────────
  socket.on('task-add', async ({ roomId, text, createdBy }) => {
    try {
      const nRoomId = roomId.trim().toLowerCase();
      const meeting = await Meeting.findOne({ roomId: nRoomId });
      if (!meeting) return;
      meeting.tasks.push({ text, completed: false, createdBy });
      await meeting.save();
      io.to(nRoomId).emit('tasks-updated', meeting.tasks);
    } catch (e) { logger.error('[TASK]', e.message); }
  });

  socket.on('task-toggle', async ({ roomId, taskId }) => {
    try {
      const nRoomId = roomId.trim().toLowerCase();
      const meeting = await Meeting.findOne({ roomId: nRoomId });
      if (!meeting) return;
      const task = meeting.tasks.id(taskId);
      if (task) { task.completed = !task.completed; await meeting.save(); }
      io.to(nRoomId).emit('tasks-updated', meeting.tasks);
    } catch (e) { logger.error('[TASK]', e.message); }
  });

  socket.on('task-delete', async ({ roomId, taskId }) => {
    try {
      const nRoomId = roomId.trim().toLowerCase();
      const meeting = await Meeting.findOne({ roomId: nRoomId });
      if (!meeting) return;
      meeting.tasks.pull({ _id: taskId });
      await meeting.save();
      io.to(nRoomId).emit('tasks-updated', meeting.tasks);
    } catch (e) { logger.error('[TASK]', e.message); }
  });

  // ── Join Requests (Waiting Room) ──────────────────────
  socket.on('join-request', async ({ roomId, odId, displayName }) => {
    // Find the host socket
    const room = rooms.get(roomId);
    if (!room) return;
    for (const [sid, info] of room.entries()) {
      // Send to first user (host) — in production check role
      io.to(sid).emit('join-request-received', { odId, displayName, socketId: socket.id });
      break;
    }
    try {
      await Meeting.findOneAndUpdate({ roomId }, { $push: { waitingRoom: { odId, displayName, socketId: socket.id } } });
    } catch (e) { /* ignore */ }
  });

  socket.on('join-approve', async ({ roomId, targetSocketId, approved }) => {
    if (approved) {
      io.to(targetSocketId).emit('join-approved', { roomId });
    } else {
      io.to(targetSocketId).emit('join-rejected', { reason: 'Host declined your request' });
    }
    // Clean up waiting room in DB
    try {
      await Meeting.findOneAndUpdate({ roomId }, { $pull: { waitingRoom: { socketId: targetSocketId } } });
    } catch (e) { /* ignore */ }
  });

  // ── Host Controls ─────────────────────────────────────
  socket.on('mute-user', ({ roomId, targetSocketId }) => {
    io.to(targetSocketId).emit('force-muted', { by: 'Host' });
    const room = rooms.get(roomId);
    if (room?.has(targetSocketId)) room.get(targetSocketId).audioEnabled = false;
    io.to(roomId).emit('user-media-toggle', { socketId: targetSocketId, audioEnabled: false, videoEnabled: room?.get(targetSocketId)?.videoEnabled });
  });

  socket.on('remove-user', ({ roomId, targetSocketId }) => {
    io.to(targetSocketId).emit('removed-from-meeting', { reason: 'You were removed by the host' });
  });

  socket.on('promote-cohost', async ({ roomId, targetUid }) => {
    try {
      await Meeting.findOneAndUpdate({ roomId, 'participants.odId': targetUid }, { $set: { 'participants.$.role': 'cohost' }, $push: { coHosts: targetUid } });
      io.to(roomId).emit('role-changed', { odId: targetUid, role: 'cohost' });
    } catch (e) { /* ignore */ }
  });

  // ── Disconnect ────────────────────────────────────────
  socket.on('disconnect', () => {
    logger.info(`[SOCKET] Disconnected: ${socket.id}`);
    for (const [roomId, room] of rooms.entries()) {
      if (room.has(socket.id)) {
        handleUserLeave(socket, roomId);
      }
    }
  });

  socket.on('leave-room', ({ roomId }) => {
    handleUserLeave(socket, roomId);
  });
});

async function handleUserLeave(socket, roomId) {
  const room = rooms.get(roomId);
  if (!room || !room.has(socket.id)) return;

  const user = room.get(socket.id);
  room.delete(socket.id);
  socket.leave(roomId);

  socket.to(roomId).emit('user-left', { socketId: socket.id, odId: user.odId, userName: user.userName });

  logger.info(`[LEAVE] ${user.userName} left ${roomId} (${room.size} left)`);

  try {
    const meeting = await Meeting.findOne({ roomId });
    if (meeting) {
      const p = meeting.participants.find(pp => pp.odId === user.odId && !pp.leftAt);
      if (p) { p.leftAt = new Date(); await meeting.save(); }
      if (room.size === 0) {
        meeting.status = 'ended';
        meeting.endedAt = new Date();
        await meeting.save();
        rooms.delete(roomId);
        logger.info(`[ROOM] ${roomId} ended`);
      }
    }
  } catch (e) { logger.error('[DB]', e.message); }
}

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`[SERVER] WaveMeet running on port ${PORT}`);
});
