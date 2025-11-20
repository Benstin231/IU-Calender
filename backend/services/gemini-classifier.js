/**
 * Google Gemini AI 分類器
 * 使用 Gemini API 智能分類 Instagram 貼文
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiClassifier {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Gemini API Key is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,  // 降低隨機性，提高準確度
        maxOutputTokens: 20,
      }
    });

    this.validTypes = [
      'concert',
      'release',
      'award',
      'broadcast',
      'endorsement',
      'social_media'
    ];
  }

  /**
   * 分類單一貼文
   * @param {string} caption - 貼文內容
   * @param {Array<string>} hashtags - Hashtags
   * @returns {Promise<string>} 事件類型
   */
  async classifyPost(caption, hashtags = []) {
    try {
      const prompt = this.buildPrompt(caption, hashtags);
      const result = await this.model.generateContent(prompt);
      const response = result.response.text().trim().toLowerCase();

      console.log(`[Gemini] Classification result: ${response}`);

      // 驗證回應是否為有效類型
      if (this.validTypes.includes(response)) {
        return response;
      }

      // 如果不是有效類型，嘗試從回應中提取
      for (const type of this.validTypes) {
        if (response.includes(type)) {
          return type;
        }
      }

      // 預設分類
      console.warn(`[Gemini] Invalid response: ${response}, defaulting to social_media`);
      return 'social_media';

    } catch (error) {
      console.error('[Gemini] Classification error:', error.message);
      // 發生錯誤時使用關鍵字分類
      return this.fallbackClassify(caption, hashtags);
    }
  }

  /**
   * 批次分類貼文
   * @param {Array<Object>} posts - 貼文陣列
   * @returns {Promise<Array<Object>>} 包含分類結果的貼文陣列
   */
  async batchClassify(posts) {
    const results = [];

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];

      try {
        const type = await this.classifyPost(post.caption, post.hashtags);
        results.push({ ...post, type });

        console.log(`[Gemini] Classified ${i + 1}/${posts.length}: ${type}`);

        // 避免超過 rate limit，每次請求間隔 1 秒
        if (i < posts.length - 1) {
          await this.delay(1000);
        }

      } catch (error) {
        console.error(`[Gemini] Error classifying post ${i + 1}:`, error.message);
        // 發生錯誤時使用預設分類
        results.push({ ...post, type: 'social_media' });
      }
    }

    return results;
  }

  /**
   * 建立分類 Prompt
   * @private
   */
  buildPrompt(caption, hashtags) {
    const hashtagsText = hashtags.length > 0 ? hashtags.join(', ') : '無';

    return `你是 IU（李知恩）粉絲行事曆的內容分類助手。

請分析以下 Instagram 貼文，判斷最適合的類別。

貼文內容：
${caption || '無文字內容'}

標籤：${hashtagsText}

類別選項及說明：
- concert: 演唱會、見面會、巡迴演出、粉絲見面會、音樂會
- release: 專輯發行、單曲發行、MV 發布、新歌曲、音源發布
- award: 獲獎、音樂獎項、頒獎典禮、得獎
- broadcast: 綜藝節目、戲劇播出、電視出演、廣播節目
- endorsement: 廣告代言、品牌合作、代言商品、品牌大使
- social_media: 日常分享、粉絲感謝、一般照片、生活紀錄

規則：
1. 只回傳一個類別名稱（小寫英文）
2. 不要包含任何解釋或標點符號
3. 如果不確定，優先選擇 social_media

請回答：`;
  }

  /**
   * 備用關鍵字分類（當 AI 失敗時使用）
   * @private
   */
  fallbackClassify(caption, hashtags) {
    if (!caption && hashtags.length === 0) {
      return 'social_media';
    }

    const text = `${caption} ${hashtags.join(' ')}`.toLowerCase();

    const keywords = {
      concert: ['演唱會', '콘서트', 'concert', 'tour', '見面會', '팬미팅', 'fanmeeting', 'meet & greet'],
      release: ['新專輯', 'comeback', '發行', '발매', 'release', 'album', 'single', 'mv', '뮤직비디오', 'music video', '音源'],
      award: ['獲獎', '得獎', '수상', 'award', '대상', '一位', '#1', 'winner', '頒獎'],
      broadcast: ['播出', '방송', 'drama', '드라마', '綜藝', 'variety', 'tv show', '電視', '廣播'],
      endorsement: ['代言', '광고', 'advertisement', 'ad', 'brand', '品牌', 'ambassador', '大使', 'cf']
    };

    // 檢查關鍵字
    for (const [type, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (text.includes(word)) {
          console.log(`[Fallback] Matched keyword "${word}" for type: ${type}`);
          return type;
        }
      }
    }

    return 'social_media';
  }

  /**
   * 延遲函數
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = GeminiClassifier;
