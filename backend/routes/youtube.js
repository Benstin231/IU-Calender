const express = require('express');
const router = express.Router();
const youtubeService = require('../services/youtube');

/**
 * GET /api/youtube/latest
 * 取得 IU YouTube 頻道最新影片資訊
 */
router.get('/latest', async (req, res) => {
  try {
    const latestVideo = await youtubeService.getLatestVideo();

    res.json({
      success: true,
      data: latestVideo
    });
  } catch (error) {
    console.error('[YouTube API] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch latest video',
      message: error.message
    });
  }
});

/**
 * GET /api/youtube/stats
 * 取得 IU YouTube 頻道統計資訊
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await youtubeService.getChannelStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[YouTube API] Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch channel stats',
      message: error.message
    });
  }
});

/**
 * POST /api/youtube/refresh
 * 強制重新整理快取
 */
router.post('/refresh', async (req, res) => {
  try {
    youtubeService.clearCache();
    const latestVideo = await youtubeService.getLatestVideo();

    res.json({
      success: true,
      message: 'Cache refreshed successfully',
      data: latestVideo
    });
  } catch (error) {
    console.error('[YouTube API] Refresh error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh cache',
      message: error.message
    });
  }
});

module.exports = router;
