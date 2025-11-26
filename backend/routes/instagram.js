/**
 * Instagram API Routes
 * 處理 Instagram 同步相關的 API 請求
 */

const express = require('express');
const router = express.Router();
const InstagramService = require('../services/instagram');

/**
 * POST /api/instagram/sync
 * 手動觸發 Instagram 同步
 */
router.post('/sync', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API Key not configured'
      });
    }

    const instagramService = new InstagramService(prisma, geminiApiKey);

    // 從請求體獲取選項
    const { useAI = true, maxPosts = 50 } = req.body;

    console.log('[API] Manual Instagram sync triggered');
    console.log(`[API] Options: useAI=${useAI}, maxPosts=${maxPosts}`);

    const result = await instagramService.syncPosts({ useAI, maxPosts });

    res.json(result);

  } catch (error) {
    console.error('[API] Instagram sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/instagram/status
 * 查詢 Instagram 同步狀態
 */
router.get('/status', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    // 取得最近一次同步記錄
    const lastSync = await prisma.syncLog.findFirst({
      where: { source: 'instagram' },
      orderBy: { syncedAt: 'desc' }
    });

    // 取得 Instagram 事件統計
    const stats = await prisma.event.groupBy({
      by: ['type'],
      where: {
        source: {
          contains: 'Instagram'
        }
      },
      _count: true
    });

    // 取得總數
    const totalEvents = await prisma.event.count({
      where: {
        source: {
          contains: 'Instagram'
        }
      }
    });

    res.json({
      lastSync: lastSync ? {
        status: lastSync.status,
        syncedAt: lastSync.syncedAt,
        itemsProcessed: lastSync.itemsProcessed,
        error: lastSync.error
      } : null,
      stats: {
        total: totalEvents,
        byType: stats.map(s => ({
          type: s.type,
          count: s._count
        }))
      }
    });

  } catch (error) {
    console.error('[API] Instagram status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/instagram/posts
 * 查詢 Instagram 貼文事件
 */
router.get('/posts', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { type, limit = 50, offset = 0 } = req.query;

    const where = {
      source: {
        contains: 'Instagram'
      }
    };

    if (type) {
      where.type = type;
    }

    const posts = await prisma.event.findMany({
      where,
      orderBy: { date: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.event.count({ where });

    res.json({
      success: true,
      data: posts,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + posts.length
      }
    });

  } catch (error) {
    console.error('[API] Instagram posts query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/instagram/events
 * 清除所有 Instagram 事件（用於測試）
 */
router.delete('/events', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const result = await prisma.event.deleteMany({
      where: {
        source: {
          contains: 'Instagram'
        }
      }
    });

    res.json({
      success: true,
      message: `Deleted ${result.count} Instagram events`
    });

  } catch (error) {
    console.error('[API] Instagram events delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
