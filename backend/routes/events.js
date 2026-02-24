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

    // 使用 year / month 整數欄位進行日期篩選（避免 String 欄位的範圍比較問題）
    if (year) {
      where.year = parseInt(year);
    }

    if (month) {
      where.month = parseInt(month);
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

    res.json({
      data: events,
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

    // 使用整數欄位查詢，避免 String date 欄位的範圍比較問題
    const events = await prisma.event.findMany({
      where: {
        year: parseInt(year),
        month: parseInt(month)
      },
      orderBy: { date: 'asc' }
    });

    // 按日期分組（date 欄位已是 "YYYY-MM-DD" 字串，直接使用）
    const groupedByDate = {};
    events.forEach(event => {
      const dateKey = event.date;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(event);
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

    res.json(event);
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
