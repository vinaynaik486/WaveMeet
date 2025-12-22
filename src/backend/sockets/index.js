import Meeting from '../models/Meeting.js';
import ChatMessage from '../models/ChatMessage.js';
import logger from '../utils/logger.js';

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

if (process.env.TURN_URL) {
  iceServers.push({
    urls: process.env.TURN_URL,
    username: process.env.TURN_USERNAME,
    credential: process.env.TURN_PASSWORD
  });
}

const rooms = new Map(); // roomId -> Map(socketId -> { odId, userName, audioEnabled, videoEnabled })

export default function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info(`[SOCKET] Connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, userId, userName, photoURL, approved, waitingRoomEnabled }) => {
      const nRoomId = roomId.trim().toLowerCase();

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
        } catch (e) { /* proceed */ }
      }

      socket.join(nRoomId);
      if (!rooms.has(nRoomId)) rooms.set(nRoomId, new Map());
      const room = rooms.get(nRoomId);

      const existingUsers = [];
      for (const [sid, info] of room.entries()) {
        existingUsers.push({ socketId: sid, ...info });
      }
      socket.emit('room-users', { users: existingUsers, iceServers });
      room.set(socket.id, { odId: userId, userName, photoURL, audioEnabled: true, videoEnabled: true });
      socket.to(nRoomId).emit('user-joined', { socketId: socket.id, odId: userId, userName, photoURL });

      try {
        const updatedMeeting = await Meeting.findOneAndUpdate({ roomId: nRoomId }, {
          $push: { participants: { odId: userId, displayName: userName, role: 'participant' } },
          $set: { status: 'active' },
          $setOnInsert: { hostId: userId, title: 'Ad-hoc Meeting', waitingRoomEnabled: waitingRoomEnabled || false },
        }, { upsert: true, setDefaultsOnInsert: true, new: true });

        socket.emit('room-info', { hostId: updatedMeeting.hostId, waitingRoomEnabled: updatedMeeting.waitingRoomEnabled });
      } catch (e) { logger.error('[DB]', e.message); }

      try {
        const history = await ChatMessage.find({ roomId: nRoomId }).sort({ createdAt: -1 }).limit(50);
        socket.emit('chat-history', history.reverse());
      } catch (e) { /* ignore */ }

      try {
        const meeting = await Meeting.findOne({ roomId: nRoomId });
        if (meeting?.tasks) socket.emit('tasks-updated', meeting.tasks);
        if (meeting && meeting.hostId === userId && meeting.waitingRoom?.length > 0) {
          socket.emit('pending-requests', meeting.waitingRoom);
        }
      } catch (e) { /* ignore */ }

      logger.info(`[JOIN] ${userName} joined ${nRoomId} (${room.size} users)`);
    });

    socket.on('offer', ({ to, offer }) => io.to(to).emit('offer', { from: socket.id, offer }));
    socket.on('answer', ({ to, answer }) => io.to(to).emit('answer', { from: socket.id, answer }));
    socket.on('ice-candidate', ({ to, candidate }) => io.to(to).emit('ice-candidate', { from: socket.id, candidate }));

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

    socket.on('screen-share-start', ({ roomId }) => socket.to(roomId).emit('screen-share-start', { socketId: socket.id }));
    socket.on('screen-share-stop', ({ roomId }) => socket.to(roomId).emit('screen-share-stop', { socketId: socket.id }));

    socket.on('chat-message', async ({ roomId, message, senderId, senderName }) => {
      const msg = { roomId, senderId, senderName, message, type: 'text', createdAt: new Date() };
      io.to(roomId).emit('new-message', msg);
      try { await ChatMessage.create(msg); } catch (e) { /* ignore */ }
    });

    socket.on('typing', ({ roomId, userName }) => socket.to(roomId).emit('user-typing', { userName }));

    socket.on('reaction', ({ roomId, emoji }) => {
      const room = rooms.get(roomId);
      const user = room?.get(socket.id);
      if (user) io.to(roomId).emit('user-reaction', { socketId: socket.id, userName: user.userName, emoji });
    });

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

    socket.on('join-request', async ({ roomId, odId, displayName }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      for (const [sid] of room.entries()) {
        io.to(sid).emit('join-request-received', { odId, displayName, socketId: socket.id });
        break;
      }
      try { await Meeting.findOneAndUpdate({ roomId }, { $push: { waitingRoom: { odId, displayName, socketId: socket.id } } }); } catch (e) { /* ignore */ }
    });

    socket.on('join-approve', async ({ roomId, targetSocketId, approved }) => {
      if (approved) io.to(targetSocketId).emit('join-approved', { roomId });
      else io.to(targetSocketId).emit('join-rejected', { reason: 'Host declined your request' });
      try { await Meeting.findOneAndUpdate({ roomId }, { $pull: { waitingRoom: { socketId: targetSocketId } } }); } catch (e) { /* ignore */ }
    });

    socket.on('mute-user', ({ roomId, targetSocketId }) => {
      io.to(targetSocketId).emit('force-muted', { by: 'Host' });
      const room = rooms.get(roomId);
      if (room?.has(targetSocketId)) room.get(targetSocketId).audioEnabled = false;
      io.to(roomId).emit('user-media-toggle', { socketId: targetSocketId, audioEnabled: false, videoEnabled: room?.get(targetSocketId)?.videoEnabled });
    });

    socket.on('remove-user', ({ targetSocketId }) => {
      io.to(targetSocketId).emit('removed-from-meeting', { reason: 'You were removed by the host' });
    });

    socket.on('promote-cohost', async ({ roomId, targetUid }) => {
      try {
        await Meeting.findOneAndUpdate({ roomId, 'participants.odId': targetUid }, { $set: { 'participants.$.role': 'cohost' }, $push: { coHosts: targetUid } });
        io.to(roomId).emit('role-changed', { odId: targetUid, role: 'cohost' });
      } catch (e) { /* ignore */ }
    });

    socket.on('disconnect', () => {
      logger.info(`[SOCKET] Disconnected: ${socket.id}`);
      for (const [roomId, room] of rooms.entries()) {
        if (room.has(socket.id)) handleUserLeave(socket, roomId, io);
      }
    });

    socket.on('leave-room', ({ roomId }) => handleUserLeave(socket, roomId, io));
  });
}

async function handleUserLeave(socket, roomId, io) {
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
