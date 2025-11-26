/**
 * 清理同步日誌腳本
 * 用途：清除舊的錯誤日誌，但保留事件資料
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearSyncLogs() {
  try {
    console.log('🗑️  清理同步日誌...');

    // 清除所有同步日誌
    const result = await prisma.syncLog.deleteMany({});

    console.log(`✅ 已清除 ${result.count} 筆同步日誌`);

    // 顯示目前的事件統計
    const eventCount = await prisma.event.count();
    const eventsBySource = await prisma.event.groupBy({
      by: ['source'],
      _count: true
    });

    console.log(`\n📊 目前事件統計:`);
    console.log(`   總計: ${eventCount} 筆事件`);
    eventsBySource.forEach(item => {
      console.log(`   - ${item.source}: ${item._count} 筆`);
    });

  } catch (error) {
    console.error('❌ 清理失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSyncLogs();
