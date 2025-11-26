/**
 * 完整重置資料庫腳本
 * ⚠️ 警告：此操作會刪除所有事件和同步日誌
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetDatabase() {
  try {
    console.log('⚠️  警告：即將清除所有資料...');
    console.log('按 Ctrl+C 取消，或等待 3 秒後開始...\n');

    // 等待 3 秒
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  清除同步日誌...');
    const syncLogs = await prisma.syncLog.deleteMany({});
    console.log(`   ✅ 已清除 ${syncLogs.count} 筆同步日誌`);

    console.log('🗑️  清除所有事件...');
    const events = await prisma.event.deleteMany({});
    console.log(`   ✅ 已清除 ${events.count} 筆事件`);

    console.log('\n✨ 資料庫已完全重置！');
    console.log('💡 提示：重新啟動後端服務將自動執行初始同步');

  } catch (error) {
    console.error('❌ 重置失敗:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
