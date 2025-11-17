import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, timer, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, switchMap, retry, shareReplay, filter, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  SpotifyTokenResponse,
  SpotifyArtistAlbumsResponse,
  SpotifyAlbum,
  AlbumRelease
} from '../models/spotify.model';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private http = inject(HttpClient);

  // Token 管理
  private accessToken = signal<string | null>(null);
  private tokenExpiry = signal<Date | null>(null);
  private tokenRefreshInProgress$ = new BehaviorSubject<boolean>(false);
  private tokenObservable$: Observable<string> | null = null;

  // 狀態管理
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  lastFetchTime = signal<Date | null>(null);

  // 專輯資料快取
  private albumsCache = signal<AlbumRelease[]>([]);

  // 計算屬性
  albums = computed(() => this.albumsCache());
  hasValidToken = computed(() => {
    const token = this.accessToken();
    const expiry = this.tokenExpiry();
    if (!token || !expiry) return false;
    // 預留 5 分鐘緩衝
    return new Date() < new Date(expiry.getTime() - 5 * 60 * 1000);
  });

  // Spotify 設定
  private readonly config = environment.spotify;

  /**
   * 檢查是否已設定 Spotify API 憑證
   */
  isConfigured(): boolean {
    return !!(this.config.clientId && this.config.clientSecret);
  }

  /**
   * 使用 Client Credentials Flow 取得 Access Token
   */
  private getAccessToken(): Observable<string> {
    // 如果已有有效 token，直接返回
    if (this.hasValidToken()) {
      return of(this.accessToken()!);
    }

    // 如果正在刷新 token，等待完成
    if (this.tokenRefreshInProgress$.value && this.tokenObservable$) {
      return this.tokenObservable$;
    }

    // 開始刷新 token
    this.tokenRefreshInProgress$.next(true);

    const credentials = btoa(`${this.config.clientId}:${this.config.clientSecret}`);
    const headers = new HttpHeaders({
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`
    });

    const body = new HttpParams().set('grant_type', 'client_credentials');

    this.tokenObservable$ = this.http.post<SpotifyTokenResponse>(
      this.config.tokenEndpoint,
      body.toString(),
      { headers }
    ).pipe(
      tap(response => {
        this.accessToken.set(response.access_token);
        // 設定過期時間
        const expiryTime = new Date(Date.now() + response.expires_in * 1000);
        this.tokenExpiry.set(expiryTime);
        this.tokenRefreshInProgress$.next(false);
        console.log('Spotify access token obtained, expires at:', expiryTime);
      }),
      map(response => response.access_token),
      catchError(err => {
        this.tokenRefreshInProgress$.next(false);
        console.error('Failed to get Spotify access token:', err);
        throw new Error('無法取得 Spotify 認證 Token');
      }),
      shareReplay(1)
    );

    return this.tokenObservable$;
  }

  /**
   * 抓取 IU 的所有專輯（包含分頁處理）
   */
  fetchIUAlbums(): Observable<AlbumRelease[]> {
    if (!this.isConfigured()) {
      this.error.set('Spotify API 尚未設定，請在 environment.ts 中填入 Client ID 和 Client Secret');
      return throwError(() => new Error('Spotify API not configured'));
    }

    this.isLoading.set(true);
    this.error.set(null);

    return this.getAccessToken().pipe(
      switchMap(token => this.fetchAllAlbums(token)),
      tap(albums => {
        this.albumsCache.set(albums);
        this.lastFetchTime.set(new Date());
        this.isLoading.set(false);
        console.log(`Successfully fetched ${albums.length} albums from Spotify`);
      }),
      catchError(err => {
        this.isLoading.set(false);
        const errorMessage = err.message || '抓取專輯資料失敗';
        this.error.set(errorMessage);
        console.error('Error fetching IU albums:', err);
        return throwError(() => err);
      })
    );
  }

  /**
   * 處理分頁，抓取所有專輯
   */
  private fetchAllAlbums(token: string): Observable<AlbumRelease[]> {
    const limit = 50; // Spotify API 最大限制
    const albums: AlbumRelease[] = [];

    const fetchPage = (offset: number): Observable<AlbumRelease[]> => {
      return this.fetchAlbumsPage(token, offset, limit).pipe(
        switchMap(response => {
          // 轉換並加入結果
          const newAlbums = response.items
            .filter(album => this.isMainArtist(album)) // 只保留 IU 為主要歌手的專輯
            .map(album => this.transformAlbum(album));
          albums.push(...newAlbums);

          // 如果還有下一頁，繼續抓取
          if (response.next && offset + limit < response.total) {
            return fetchPage(offset + limit);
          }

          // 完成，按發行日期排序（最新優先）
          return of(albums.sort((a, b) =>
            b.releaseDate.getTime() - a.releaseDate.getTime()
          ));
        })
      );
    };

    return fetchPage(0);
  }

  /**
   * 抓取單一頁面的專輯資料
   */
  private fetchAlbumsPage(
    token: string,
    offset: number,
    limit: number
  ): Observable<SpotifyArtistAlbumsResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('include_groups', 'album,single,compilation')
      .set('market', 'TW') // 台灣市場
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    const url = `${this.config.apiBaseUrl}/artists/${this.config.artistId}/albums`;

    return this.http.get<SpotifyArtistAlbumsResponse>(url, { headers, params }).pipe(
      retry({ count: 3, delay: (error, retryCount) => timer(1000 * retryCount) })
    );
  }

  /**
   * 檢查 IU 是否為主要歌手
   */
  private isMainArtist(album: SpotifyAlbum): boolean {
    // 排除 "appears_on" 類型，只保留 IU 自己的作品
    return album.album_group !== 'appears_on';
  }

  /**
   * 將 Spotify 專輯資料轉換為應用程式格式
   */
  private transformAlbum(spotifyAlbum: SpotifyAlbum): AlbumRelease {
    return {
      id: spotifyAlbum.id,
      name: spotifyAlbum.name,
      type: spotifyAlbum.album_type,
      releaseDate: this.parseReleaseDate(
        spotifyAlbum.release_date,
        spotifyAlbum.release_date_precision
      ),
      releaseDatePrecision: spotifyAlbum.release_date_precision,
      imageUrl: spotifyAlbum.images.length > 0
        ? spotifyAlbum.images[0].url // 取最大的圖片
        : null,
      spotifyUrl: spotifyAlbum.external_urls.spotify,
      totalTracks: spotifyAlbum.total_tracks,
      artists: spotifyAlbum.artists.map(artist => artist.name)
    };
  }

  /**
   * 解析發行日期
   */
  private parseReleaseDate(dateString: string, precision: 'year' | 'month' | 'day'): Date {
    switch (precision) {
      case 'year':
        return new Date(`${dateString}-01-01`);
      case 'month':
        return new Date(`${dateString}-01`);
      case 'day':
      default:
        return new Date(dateString);
    }
  }

  /**
   * 取得特定類型的專輯
   */
  getAlbumsByType(type: 'album' | 'single' | 'compilation') {
    return computed(() => this.albumsCache().filter(album => album.type === type));
  }

  /**
   * 取得特定年份的專輯
   */
  getAlbumsByYear(year: number) {
    return computed(() =>
      this.albumsCache().filter(album => album.releaseDate.getFullYear() === year)
    );
  }

  /**
   * 取得最新發行的專輯
   */
  getLatestAlbums(count: number = 5) {
    return computed(() => this.albumsCache().slice(0, count));
  }

  /**
   * 搜尋專輯
   */
  searchAlbums(query: string) {
    return computed(() => {
      const q = query.toLowerCase().trim();
      if (!q) return this.albumsCache();
      return this.albumsCache().filter(album =>
        album.name.toLowerCase().includes(q) ||
        album.artists.some(artist => artist.toLowerCase().includes(q))
      );
    });
  }

  /**
   * 將專輯資料轉換為 IUEvent 格式，以便整合到現有行事曆
   */
  convertToEvents() {
    return computed(() => {
      return this.albumsCache().map(album => ({
        id: `spotify-${album.id}`,
        date: album.releaseDate.toISOString().split('T')[0],
        year: album.releaseDate.getFullYear(),
        month: album.releaseDate.getMonth() + 1,
        day: album.releaseDate.getDate(),
        type: 'release' as const,
        title: album.name,
        titleKo: undefined,
        description: `${album.type === 'album' ? '專輯' : album.type === 'single' ? '單曲' : '合輯'}發行，共 ${album.totalTracks} 首曲目`,
        source: 'Spotify',
        sourceUrl: album.spotifyUrl,
        imageUrl: album.imageUrl || undefined,
        videoUrl: undefined,
        tags: [
          album.type,
          'spotify',
          ...album.artists,
          album.releaseDate.getFullYear().toString()
        ]
      }));
    });
  }

  /**
   * 清除快取的資料
   */
  clearCache(): void {
    this.albumsCache.set([]);
    this.lastFetchTime.set(null);
    this.error.set(null);
  }

  /**
   * 取得統計資訊
   */
  getStatistics() {
    return computed(() => {
      const albums = this.albumsCache();
      return {
        total: albums.length,
        albums: albums.filter(a => a.type === 'album').length,
        singles: albums.filter(a => a.type === 'single').length,
        compilations: albums.filter(a => a.type === 'compilation').length,
        yearRange: albums.length > 0 ? {
          earliest: Math.min(...albums.map(a => a.releaseDate.getFullYear())),
          latest: Math.max(...albums.map(a => a.releaseDate.getFullYear()))
        } : null
      };
    });
  }
}
