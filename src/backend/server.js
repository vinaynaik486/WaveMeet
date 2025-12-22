import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import registerSocketHandlers from './sockets/index.js';

dotenv.config();

const app = express();
const server = createServer(app);

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://wavemeet-frontend.onrender.com',
  'https://wavemeet.vercel.app',
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ── MongoDB ────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wavemeet';
mongoose.connect(MONGO_URI)
  .then(() => logger.info('[OK] MongoDB connected'))
  .catch((err) => logger.error('[ERROR] MongoDB:', err.message));

// ── API Routes ─────────────────────────────────────────────
app.use('/api', routes);

// Health check
app.get('/', (_, res) => res.json({ status: 'WaveMeet API running' }));
app.get('/health', (_, res) => res.send('OK'));

// ── Socket.IO ──────────────────────────────────────────────
const io = new Server(server, { 
  cors: { 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'], 
    credentials: true 
  } 
});

registerSocketHandlers(io);

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`[SERVER] WaveMeet running on port ${PORT}`);
});
