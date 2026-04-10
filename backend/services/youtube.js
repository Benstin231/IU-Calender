/**
 * YouTube 服務
 * 使用 RSS Feed 取得 IU 頻道的最新影片資訊（不需要 API Key）
 */

const axios = require('axios');

// IU 官方 YouTube 頻道 ID
const IU_CHANNEL_ID = 'UC3SyT4_WLHzN7JmHQwKQZww';

// 快取設定（避免頻繁請求）
let cache = {
  lastVideo: null,
  fetchedAt: null,
  ttl: 30 * 60 * 1000 // 30 分鐘快取
};

/**
 * 從 YouTube RSS Feed 取得最新影片
 * @returns {Promise<Object>} 最新影片資訊
 */
async function getLatestVideo() {
  // 檢查快取
  if (cache.lastVideo && cache.fetchedAt) {
    const age = Date.now() - cache.fetchedAt;
    if (age < cache.ttl) {
      return cache.lastVideo;
    }
  }

  try {
    const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${IU_CHANNEL_ID}`;
    const response = await axios.get(feedUrl, {
      headers: {
        'Accept': 'application/xml'
      },
      timeout: 10000
    });

    const xml = response.data;

    // 簡單的 XML 解析（找第一個 <entry>）
    const entryMatch = xml.match(/<entry>([\s\S]*?)<\/entry>/);
    if (!entryMatch) {
      throw new Error('No video entries found in feed');
    }

    const entry = entryMatch[1];

    // 解析影片資訊
    const videoId = extractTag(entry, 'yt:videoId');
    const title = extractTag(entry, 'title');
    const published = extractTag(entry, 'published');
    const updated = extractTag(entry, 'updated');
    const channelName = extractTag(entry, 'name');

    // 取得縮圖
    const thumbnailMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : null;

    // 取得觀看次數（如果有）
    const viewsMatch = entry.match(/<media:statistics[^>]*views="(\d+)"/);
    const views = viewsMatch ? parseInt(viewsMatch[1]) : null;

    const videoInfo = {
      videoId,
      title: decodeHTMLEntities(title),
      url: `https://www.youtube.com/watch?v=${videoId}`,
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
      publishedAt: published,
      updatedAt: updated,
      channelName,
      views,
      daysSincePublished: calculateDaysSince(published)
    };

    // 更新快取
    cache.lastVideo = videoInfo;
    cache.fetchedAt = Date.now();

    return videoInfo;

  } catch (error) {
    console.error('[YouTube] Failed to fetch RSS feed:', error.message);

    // 如果有舊的快取，返回舊資料
    if (cache.lastVideo) {
      console.log('[YouTube] Returning cached data');
      return {
        ...cache.lastVideo,
        daysSincePublished: calculateDaysSince(cache.lastVideo.publishedAt),
        fromCache: true
      };
    }

    throw error;
  }
}

/**
 * 計算距今天數
 */
function calculateDaysSince(dateString) {
  const publishDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - publishDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * 從 XML 中提取標籤內容
 */
function extractTag(xml, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`);
  const match = xml.match(regex);
  return match ? match[1] : null;
}

/**
 * 解碼 HTML 實體
 */
function decodeHTMLEntities(text) {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
}

/**
 * 取得頻道統計資訊
 */
async function getChannelStats() {
  const latestVideo = await getLatestVideo();

  return {
    channelId: IU_CHANNEL_ID,
    channelName: latestVideo.channelName || 'IU Official',
    channelUrl: `https://www.youtube.com/channel/${IU_CHANNEL_ID}`,
    latestVideo,
    daysSinceLastUpload: latestVideo.daysSincePublished
  };
}

/**
 * 清除快取
 */
function clearCache() {
  cache.lastVideo = null;
  cache.fetchedAt = null;
}

module.exports = {
  getLatestVideo,
  getChannelStats,
  clearCache,
  IU_CHANNEL_ID
};
