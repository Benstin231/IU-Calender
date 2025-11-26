/**
 * Instagram 同步服務
 * 整合 Python 爬蟲和 Gemini 分類器
 */

const { spawn } = require('child_process');
const path = require('path');
const GeminiClassifier = require('./gemini-classifier');

class InstagramService {
  constructor(prisma, geminiApiKey) {
    this.prisma = prisma;
    this.classifier = geminiApiKey ? new GeminiClassifier(geminiApiKey) : null;
    this.scraperPath = path.join(__dirname, '../../instagram-scraper/scraper.py');
  }

  /**
   * 同步 Instagram 貼文
   * @param {Object} options - 選項
   * @param {boolean} options.useAI - 是否使用 AI 分類
   * @param {number} options.maxPosts - 最多爬取幾篇貼文
   * @returns {Promise<Object>} 同步結果
   */
  async syncPosts(options = {}) {
    const { useAI = true, maxPosts = 50 } = options;

    console.log('[Instagram] Starting sync...');
    console.log(`[Instagram] Options: AI=${useAI}, MaxPosts=${maxPosts}`);

    try {
      // 步驟 1: 執行 Python 爬蟲
      const posts = await this.runScraper(maxPosts);

      if (posts.length === 0) {
        console.log('[Instagram] No posts fetched');
        return { success: true, count: 0, message: 'No posts to sync' };
      }

      console.log(`[Instagram] Fetched ${posts.length} posts`);

      // 步驟 2: 分類貼文
      let classifiedPosts;
      if (useAI && this.classifier) {
        console.log('[Instagram] Using AI classification...');
        classifiedPosts = await this.classifier.batchClassify(posts);
      } else {
        console.log('[Instagram] Using keyword classification...');
        classifiedPosts = posts.map(post => ({
          ...post,
          type: this.keywordClassify(post.caption, post.hashtags)
        }));
      }

      // 步驟 3: 儲存到資料庫
      const saved = await this.savePosts(classifiedPosts);

      // 步驟 4: 記錄同步日誌
      await this.logSync('instagram', 'success', saved);

      console.log(`[Instagram] Sync completed: ${saved} posts saved`);

      return {
        success: true,
        count: saved,
        total: posts.length,
        message: `Successfully synced ${saved} Instagram posts`
      };

    } catch (error) {
      console.error('[Instagram] Sync failed:', error);
      await this.logSync('instagram', 'error', 0, error.message);

      return {
        success: false,
        count: 0,
        error: error.message
      };
    }
  }

  /**
   * 執行 Python 爬蟲腳本
   * @private
   */
  async runScraper(maxPosts) {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        INSTAGRAM_MAX_POSTS: maxPosts.toString(),
        PYTHONIOENCODING: 'utf-8'  // 強制 Python 使用 UTF-8
      };

      // Windows 使用 'python' 或 'py'，Linux/Mac 使用 'python3'
      const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
      const python = spawn(pythonCommand, [this.scraperPath], {
        env,
        encoding: 'utf8'
      });

      let dataString = '';
      let errorString = '';

      python.stdout.setEncoding('utf8');
      python.stderr.setEncoding('utf8');

      python.stdout.on('data', (data) => {
        dataString += data;
      });

      python.stderr.on('data', (data) => {
        // stderr 包含進度訊息，記錄但不視為錯誤
        console.log('[Python]', data.trim());
        errorString += data;
      });

      python.on('close', (code) => {
        if (code !== 0) {
          const error = new Error(`Scraper failed with code ${code}: ${errorString}`);
          return reject(error);
        }

        try {
          const posts = JSON.parse(dataString);
          resolve(posts);
        } catch (error) {
          reject(new Error(`Failed to parse scraper output: ${error.message}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start scraper: ${error.message}`));
      });
    });
  }

  /**
   * 儲存貼文到資料庫
   * @private
   */
  async savePosts(posts) {
    let savedCount = 0;

    for (const post of posts) {
      try {
        const postDate = new Date(post.date);

        // 使用 upsert 避免重複
        await this.prisma.event.upsert({
          where: {
            sourceUrl: post.url
          },
          update: {
            // 更新讚數和留言數（其他欄位保持不變）
            description: this.buildDescription(post)
          },
          create: {
            date: postDate.toISOString().split('T')[0],
            year: postDate.getFullYear(),
            month: postDate.getMonth() + 1,
            day: postDate.getDate(),
            type: post.type,
            title: this.extractTitle(post.caption, post.type),
            titleKo: '',
            description: this.buildDescription(post),
            source: `Instagram (@${post.owner_username})`,
            sourceUrl: post.url,
            imageUrl: post.media_url,
            videoUrl: post.is_video ? post.media_url : null,
            tags: this.buildTags(post)
          }
        });

        savedCount++;
      } catch (error) {
        console.error(`[Instagram] Failed to save post ${post.shortcode}:`, error.message);
      }
    }

    return savedCount;
  }

  /**
   * 提取標題
   * @private
   */
  extractTitle(caption, type) {
    if (!caption) {
      const typeLabels = {
        concert: 'IU 演唱會相關',
        release: 'IU 音樂發行',
        award: 'IU 獲獎消息',
        broadcast: 'IU 節目播出',
        endorsement: 'IU 品牌代言',
        social_media: 'IU Instagram 動態'
      };
      return typeLabels[type] || 'IU Instagram Post';
    }

    // 移除 hashtags
    let title = caption.replace(/#\w+/g, '').trim();

    // 取前 80 字
    if (title.length > 80) {
      title = title.substring(0, 80) + '...';
    }

    return title || 'IU Instagram 動態';
  }

  /**
   * 建立描述
   * @private
   */
  buildDescription(post) {
    const parts = [];

    if (post.caption) {
      parts.push(post.caption);
    }

    parts.push(`\n👍 ${post.likes.toLocaleString()} likes`);
    parts.push(`💬 ${post.comments.toLocaleString()} comments`);

    if (post.is_video) {
      parts.push('🎥 Video');
    }

    return parts.join('\n');
  }

  /**
   * 建立標籤
   * @private
   */
  buildTags(post) {
    const tags = ['Instagram', 'IU', post.owner_username];

    // 加入前 5 個 hashtags
    if (post.hashtags && post.hashtags.length > 0) {
      tags.push(...post.hashtags.slice(0, 5));
    }

    // 加入類型標籤
    tags.push(post.type);

    return tags;
  }

  /**
   * 關鍵字分類（備用方案）
   * @private
   */
  keywordClassify(caption, hashtags) {
    if (!caption && hashtags.length === 0) {
      return 'social_media';
    }

    const text = `${caption} ${hashtags.join(' ')}`.toLowerCase();

    const keywords = {
      concert: ['演唱會', '콘서트', 'concert', 'tour', '見面會', '팬미팅'],
      release: ['新專輯', 'comeback', '發行', '발매', 'release', 'mv', '音源'],
      award: ['獲獎', '수상', 'award', '대상', '一位'],
      broadcast: ['播出', '방송', 'drama', '드라마', '綜藝'],
      endorsement: ['代言', '광고', 'ad', 'brand', '品牌', 'ambassador']
    };

    for (const [type, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (text.includes(word)) {
          return type;
        }
      }
    }

    return 'social_media';
  }

  /**
   * 記錄同步日誌
   * @private
   */
  async logSync(source, status, count, error = null) {
    try {
      await this.prisma.syncLog.create({
        data: {
          source,
          status,
          itemsProcessed: count,
          error,
          syncedAt: new Date()
        }
      });
    } catch (err) {
      console.error('[Instagram] Failed to log sync:', err.message);
    }
  }
}

module.exports = InstagramService;
