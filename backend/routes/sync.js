const express = require('express');
const router = express.Router();
const spotifyService = require('../services/spotify');

/**
 * POST /api/sync/spotify
 * 手動觸發 Spotify 資料同步
 */
router.post('/spotify', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    console.log('[API] Manual Spotify sync triggered');
    const result = await spotifyService.syncAlbums(prisma);

    res.json({
      success: true,
      message: `Synced ${result.count} albums`,
      details: result
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      message: error.message
    });
  }
});

/**
 * GET /api/sync/status
 * 取得同步狀態和歷史記錄
 */
router.get('/status', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const [lastSync, recentLogs] = await Promise.all([
      prisma.syncLog.findFirst({
        where: { source: 'spotify' },
        orderBy: { syncedAt: 'desc' }
      }),
      prisma.syncLog.findMany({
        orderBy: { syncedAt: 'desc' },
        take: 10
      })
    ]);

    res.json({
      lastSync: lastSync ? {
        source: lastSync.source,
        status: lastSync.status,
        syncedAt: lastSync.syncedAt,
        itemCount: lastSync.itemCount,
        message: lastSync.message
      } : null,
      recentLogs: recentLogs
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
});

module.exports = router;
