require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const spotifyService = require('./services/spotify');
const eventsRouter = require('./routes/events');
const syncRouter = require('./routes/sync');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:4200'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// Make prisma available to routes
app.set('prisma', prisma);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// API Routes
app.use('/api/events', eventsRouter);
app.use('/api/sync', syncRouter);

// Scheduled Tasks - 每天凌晨 3 點自動同步 Spotify 資料
cron.schedule('0 3 * * *', async () => {
  console.log('[CRON] Starting daily Spotify sync...');
  try {
    const result = await spotifyService.syncAlbums(prisma);
    console.log(`[CRON] Sync completed: ${result.count} albums synced`);
  } catch (error) {
    console.error('[CRON] Sync failed:', error.message);
  }
});

// Startup sync - 啟動時自動同步一次
async function startupSync() {
  console.log('[STARTUP] Checking if initial sync needed...');
  const lastSync = await prisma.syncLog.findFirst({
    where: { source: 'spotify', status: 'success' },
    orderBy: { syncedAt: 'desc' }
  });

  // 如果從未同步過，或超過 24 小時，執行同步
  const needsSync = !lastSync ||
    (Date.now() - lastSync.syncedAt.getTime()) > 24 * 60 * 60 * 1000;

  if (needsSync) {
    console.log('[STARTUP] Running initial Spotify sync...');
    try {
      const result = await spotifyService.syncAlbums(prisma);
      console.log(`[STARTUP] Initial sync completed: ${result.count} albums`);
    } catch (error) {
      console.error('[STARTUP] Initial sync failed:', error.message);
    }
  } else {
    console.log('[STARTUP] Data is fresh, skipping sync');
  }
}

// Validate configuration
function validateConfig() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    console.error('ERROR: SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('ERROR: DATABASE_URL must be set');
    process.exit(1);
  }
}

// Start server
validateConfig();
app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════════╗
║   IU Calendar Backend Service              ║
║   Port: ${PORT}                                ║
║   Database: SQLite                         ║
╚════════════════════════════════════════════╝
  `);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log('API Endpoints:');
  console.log('  GET  /api/events           - 查詢所有事件');
  console.log('  GET  /api/events/:id       - 查詢單一事件');
  console.log('  POST /api/sync/spotify     - 手動觸發 Spotify 同步');
  console.log('  GET  /api/sync/status      - 查看同步狀態');
  console.log('');

  // Run startup sync
  await startupSync();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
