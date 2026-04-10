import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface YouTubeVideo {
  videoId: string;
  title: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  updatedAt: string;
  channelName: string;
  views: number | null;
  daysSincePublished: number;
  fromCache?: boolean;
}

export interface YouTubeStats {
  channelId: string;
  channelName: string;
  channelUrl: string;
  latestVideo: YouTubeVideo;
  daysSinceLastUpload: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class YouTubeService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl || 'http://localhost:3000';

  // 狀態管理
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // 資料快取
  private latestVideoCache = signal<YouTubeVideo | null>(null);
  private lastFetchTime = signal<Date | null>(null);

  // 計算屬性
  latestVideo = computed(() => this.latestVideoCache());
  daysSinceLastUpload = computed(() => this.latestVideoCache()?.daysSincePublished ?? null);

  /**
   * 取得 IU YouTube 頻道最新影片
   */
  fetchLatestVideo(): Observable<YouTubeVideo | null> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<ApiResponse<YouTubeVideo>>(`${this.baseUrl}/api/youtube/latest`).pipe(
      tap(response => {
        if (response.success && response.data) {
          this.latestVideoCache.set(response.data);
          this.lastFetchTime.set(new Date());
        }
        this.isLoading.set(false);
      }),
      catchError(err => {
        this.isLoading.set(false);
        const errorMessage = err.status === 0
          ? '無法連線到後端服務'
          : err.error?.message || '取得 YouTube 資料失敗';
        this.error.set(errorMessage);
        console.error('[YouTube] 取得最新影片失敗:', err);
        return of(null);
      }),
      tap(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return null;
      })
    ) as Observable<YouTubeVideo | null>;
  }

  /**
   * 取得頻道統計資訊
   */
  fetchChannelStats(): Observable<YouTubeStats | null> {
    return this.http.get<ApiResponse<YouTubeStats>>(`${this.baseUrl}/api/youtube/stats`).pipe(
      catchError(err => {
        console.error('[YouTube] 取得頻道統計失敗:', err);
        return of(null);
      }),
      tap(response => {
        if (response && 'data' in response) {
          return response.data;
        }
        return null;
      })
    ) as Observable<YouTubeStats | null>;
  }

  /**
   * 格式化天數顯示
   */
  formatDaysSince(days: number | null): string {
    if (days === null) return '載入中...';
    if (days === 0) return '今天';
    if (days === 1) return '1 天前';
    return `${days} 天前`;
  }

  /**
   * 取得顯示樣式（根據天數）
   */
  getDaysStyle(days: number | null): { color: string; urgency: 'recent' | 'normal' | 'old' } {
    if (days === null) return { color: 'gray', urgency: 'normal' };
    if (days <= 7) return { color: 'green', urgency: 'recent' };
    if (days <= 30) return { color: 'blue', urgency: 'normal' };
    if (days <= 90) return { color: 'orange', urgency: 'normal' };
    return { color: 'red', urgency: 'old' };
  }
}
