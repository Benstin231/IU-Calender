const express = require('express');
const router = express.Router();

/**
 * GET /api/events
 * 查詢事件列表，支援過濾和分頁
 *
 * Query Parameters:
 * - type: 事件類型 (album, single, concert, birthday, etc.)
 * - source: 資料來源 (spotify, youtube, manual)
 * - year: 年份
 * - month: 月份 (1-12)
 * - limit: 回傳數量 (預設 100)
 * - offset: 跳過數量 (分頁用)
 */
router.get('/', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { type, source, year, month, limit = 100, offset = 0 } = req.query;

    // 建立查詢條件
    const where = {};

    if (type) {
      where.type = type;
    }

    if (source) {
      where.source = source;
    }

    // 日期範圍過濾
    if (year || month) {
      const dateFilter = {};

      if (year && month) {
        // 特定年月
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      } else if (year) {
        // 整年
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31, 23, 59, 59);
        dateFilter.gte = startDate;
        dateFilter.lte = endDate;
      }

      where.date = dateFilter;
    }

    // 查詢事件
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.event.count({ where })
    ]);

    // 解析 metadata JSON
    const eventsWithMetadata = events.map(event => ({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null
    }));

    res.json({
      data: eventsWithMetadata,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + events.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * GET /api/events/calendar
 * 取得月曆格式的事件資料（按日期分組）
 *
 * Query Parameters:
 * - year: 年份 (必填)
 * - month: 月份 (必填, 1-12)
 */
router.get('/calendar', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: 'year and month are required' });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // 按日期分組
    const groupedByDate = {};
    events.forEach(event => {
      const dateKey = event.date.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push({
        ...event,
        metadata: event.metadata ? JSON.parse(event.metadata) : null
      });
    });

    res.json({
      year: parseInt(year),
      month: parseInt(month),
      events: groupedByDate
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

/**
 * GET /api/events/:id
 * 取得單一事件詳情
 */
router.get('/:id', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      ...event,
      metadata: event.metadata ? JSON.parse(event.metadata) : null
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

/**
 * GET /api/events/stats/summary
 * 取得事件統計摘要
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const prisma = req.app.get('prisma');

    const [totalEvents, typeStats, sourceStats] = await Promise.all([
      prisma.event.count(),
      prisma.event.groupBy({
        by: ['type'],
        _count: { id: true }
      }),
      prisma.event.groupBy({
        by: ['source'],
        _count: { id: true }
      })
    ]);

    res.json({
      total: totalEvents,
      byType: typeStats.reduce((acc, item) => {
        acc[item.type] = item._count.id;
        return acc;
      }, {}),
      bySource: sourceStats.reduce((acc, item) => {
        acc[item.source] = item._count.id;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
