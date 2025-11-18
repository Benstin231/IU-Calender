import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IUEvent } from '../models/event.model';

// API 回應的事件格式
interface ApiEvent {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  type: string;
  source: string;
  externalUrl: string | null;
  imageUrl: string | null;
  metadata: {
    albumType?: string;
    totalTracks?: number;
    artists?: string[];
    uri?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  sourceId: string | null;
}

interface ApiResponse {
  data: ApiEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface SyncStatus {
  lastSync: {
    source: string;
    status: string;
    syncedAt: string;
    itemCount: number;
    message: string | null;
  } | null;
  recentLogs: Array<{
    id: string;
    source: string;
    status: string;
    message: string | null;
    syncedAt: string;
    itemCount: number;
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class EventsApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl || 'http://localhost:3000';

  // 狀態管理
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastFetchTime = signal<Date | null>(null);
  syncStatus = signal<SyncStatus | null>(null);

  // 事件資料快取
  private eventsCache = signal<IUEvent[]>([]);

  // 計算屬性
  events = computed(() => this.eventsCache());

  /**
   * 從後端 API 載入所有事件
   */
  loadEvents(): Observable<IUEvent[]> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse>(`${this.baseUrl}/api/events?limit=1000`).pipe(
      map(response => response.data.map(this.transformApiEvent)),
      tap(events => {
        this.eventsCache.set(events);
        this.lastFetchTime.set(new Date());
        this.isLoading.set(false);
        console.log(`[EventsAPI] 已載入 ${events.length} 個事件`);
      }),
      catchError(err => {
        this.isLoading.set(false);
        const errorMessage = this.getErrorMessage(err);
        this.error.set(errorMessage);
        console.error('[EventsAPI] 載入事件失敗:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * 載入特定月份的事件（月曆視圖優化）
   */
  loadCalendarEvents(year: number, month: number): Observable<IUEvent[]> {
    return this.http.get<{year: number; month: number; events: Record<string, ApiEvent[]>}>
      (`${this.baseUrl}/api/events/calendar?year=${year}&month=${month}`).pipe(
      map(response => {
        const events: IUEvent[] = [];
        Object.values(response.events).forEach(dayEvents => {
          events.push(...dayEvents.map(this.transformApiEvent));
        });
        return events;
      }),
      catchError(err => {
        console.error('[EventsAPI] 載入月曆事件失敗:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * 手動觸發 Spotify 同步
   */
  triggerSpotifySync(): Observable<{success: boolean; message: string; details: any}> {
    return this.http.post<{success: boolean; message: string; details: any}>
      (`${this.baseUrl}/api/sync/spotify`, {}).pipe(
      tap(result => {
        if (result.success) {
          console.log(`[EventsAPI] Spotify 同步完成: ${result.message}`);
          // 重新載入事件
          this.loadEvents().subscribe();
          this.loadSyncStatus().subscribe();
        }
      }),
      catchError(err => {
        console.error('[EventsAPI] Spotify 同步失敗:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * 載入同步狀態
   */
  loadSyncStatus(): Observable<SyncStatus> {
    return this.http.get<SyncStatus>(`${this.baseUrl}/api/sync/status`).pipe(
      tap(status => {
        this.syncStatus.set(status);
      }),
      catchError(err => {
        console.error('[EventsAPI] 載入同步狀態失敗:', err);
        return of({ lastSync: null, recentLogs: [] });
      })
    );
  }

  /**
   * 轉換 API 事件格式為應用程式格式
   */
  private transformApiEvent = (apiEvent: ApiEvent): IUEvent => {
    const date = new Date(apiEvent.date);

    return {
      id: apiEvent.id,
      date: apiEvent.date.split('T')[0],
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      type: this.mapEventType(apiEvent.type),
      title: apiEvent.title,
      titleKo: undefined,
      description: this.buildDescription(apiEvent),
      source: this.mapSource(apiEvent.source),
      sourceUrl: apiEvent.externalUrl || undefined,
      imageUrl: apiEvent.imageUrl || undefined,
      videoUrl: undefined,
      tags: this.buildTags(apiEvent)
    };
  };

  /**
   * 對應事件類型到應用程式類型
   */
  private mapEventType(type: string): 'release' | 'concert' | 'broadcast' | 'milestone' | 'award' | 'social_media' {
    switch (type) {
      case 'album':
      case 'single':
      case 'compilation':
        return 'release';
      case 'concert':
        return 'concert';
      case 'birthday':
      case 'anniversary':
        return 'milestone';
      case 'broadcast':
        return 'broadcast';
      case 'award':
        return 'award';
      default:
        return 'milestone';
    }
  }

  /**
   * 對應來源名稱
   */
  private mapSource(source: string): string {
    switch (source) {
      case 'spotify':
        return 'Spotify';
      case 'youtube':
        return 'YouTube';
      case 'manual':
        return '手動輸入';
      default:
        return source;
    }
  }

  /**
   * 建立事件描述
   */
  private buildDescription(apiEvent: ApiEvent): string {
    if (apiEvent.description) {
      return apiEvent.description;
    }

    if (apiEvent.metadata && apiEvent.source === 'spotify') {
      const typeLabel = {
        'album': '專輯',
        'single': '單曲',
        'compilation': '合輯'
      }[apiEvent.metadata.albumType || ''] || '作品';

      return `${typeLabel}發行，共 ${apiEvent.metadata.totalTracks || 0} 首曲目`;
    }

    return '';
  }

  /**
   * 建立標籤列表
   */
  private buildTags(apiEvent: ApiEvent): string[] {
    const tags: string[] = [apiEvent.type];

    if (apiEvent.source) {
      tags.push(apiEvent.source);
    }

    if (apiEvent.metadata?.artists) {
      tags.push(...apiEvent.metadata.artists);
    }

    const date = new Date(apiEvent.date);
    tags.push(date.getFullYear().toString());

    return tags;
  }

  /**
   * 取得錯誤訊息
   */
  private getErrorMessage(error: any): string {
    if (error.status === 0) {
      return '無法連線到後端服務，請確認服務是否已啟動';
    }
    return error.error?.message || error.message || '發生未知錯誤';
  }

  /**
   * 取得事件統計
   */
  getStatistics = computed(() => {
    const events = this.eventsCache();
    const byType: Record<string, number> = {};

    events.forEach(event => {
      byType[event.type] = (byType[event.type] || 0) + 1;
    });

    return {
      total: events.length,
      byType,
      yearRange: events.length > 0 ? {
        earliest: Math.min(...events.map(e => e.year)),
        latest: Math.max(...events.map(e => e.year))
      } : null
    };
  });

  /**
   * 清除快取
   */
  clearCache(): void {
    this.eventsCache.set([]);
    this.lastFetchTime.set(null);
    this.error.set(null);
  }
}
