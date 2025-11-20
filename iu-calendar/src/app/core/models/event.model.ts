export type EventType =
  | 'release'         // 專輯/單曲發行
  | 'concert'         // 演唱會/見面會
  | 'award'           // 獲獎
  | 'broadcast'       // 綜藝/戲劇
  | 'social_media'    // 社群貼文
  | 'endorsement'     // 廣告代言
  | 'milestone';      // 重要里程碑

export interface IUEvent {
  id: string;
  date: string;                    // ISO 8601 格式 YYYY-MM-DD
  year: number;
  month: number;
  day: number;
  type: EventType;
  title: string;
  titleKo?: string;                // 韓文標題
  description: string;
  source: string;
  sourceUrl?: string;
  imageUrl?: string;               // 外部圖片連結
  videoUrl?: string;               // YouTube 等連結
  tags: string[];
}

export interface EventTypeInfo {
  type: EventType;
  label: string;
  labelKo: string;
  color: string;
  icon: string;
}

export const EVENT_TYPE_INFO: Record<EventType, EventTypeInfo> = {
  release: {
    type: 'release',
    label: '發行',
    labelKo: '발매',
    color: 'pink',
    icon: 'album'
  },
  concert: {
    type: 'concert',
    label: '演唱會',
    labelKo: '콘서트',
    color: 'orange',
    icon: 'music_note'
  },
  award: {
    type: 'award',
    label: '獲獎',
    labelKo: '수상',
    color: 'yellow',
    icon: 'emoji_events'
  },
  broadcast: {
    type: 'broadcast',
    label: '播出',
    labelKo: '방송',
    color: 'blue',
    icon: 'tv'
  },
  social_media: {
    type: 'social_media',
    label: '社群',
    labelKo: 'SNS',
    color: 'green',
    icon: 'share'
  },
  endorsement: {
    type: 'endorsement',
    label: '代言',
    labelKo: '광고',
    color: 'purple',
    icon: 'campaign'
  },
  milestone: {
    type: 'milestone',
    label: '里程碑',
    labelKo: '이정표',
    color: 'red',
    icon: 'flag'
  }
};
