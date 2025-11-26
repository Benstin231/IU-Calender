import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventsApiService } from '../../core/services/events-api.service';
import { IUEvent } from '../../core/models/event.model';

interface AlbumDisplay {
  id: string;
  name: string;
  type: 'album' | 'single';
  releaseDate: Date;
  imageUrl: string | null;
  spotifyUrl: string | null;
  totalTracks: number;
  artists: string[];
}

@Component({
  selector: 'app-albums',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- 標題區域 -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          <mat-icon class="align-middle mr-2">album</mat-icon>
          IU 專輯資料庫
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          透過 Spotify API 自動同步的專輯發行資訊
        </p>
      </div>

      <!-- 資料庫狀態 -->
      <mat-card class="mb-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
        <mat-card-content class="py-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <mat-icon class="text-blue-600">storage</mat-icon>
              <div>
                <h3 class="font-semibold text-blue-800 dark:text-blue-200">
                  資料庫狀態
                </h3>
                @if (eventsApiService.isLoading()) {
                  <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    正在載入資料...
                  </p>
                } @else if (eventsApiService.error()) {
                  <p class="text-red-600 dark:text-red-400 text-sm mt-1">
                    錯誤: {{ eventsApiService.error() }}
                  </p>
                } @else if (albums().length > 0) {
                  <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    已載入 {{ albums().length }} 張專輯/單曲
                    @if (eventsApiService.syncStatus()?.lastSync) {
                      <span class="ml-2 text-xs">
                        (上次同步: {{ formatSyncTime(eventsApiService.syncStatus()!.lastSync!.syncedAt) }})
                      </span>
                    }
                  </p>
                } @else {
                  <p class="text-blue-700 dark:text-blue-300 text-sm mt-1">
                    尚未載入資料
                  </p>
                }
              </div>
            </div>
            <button mat-stroked-button
                    (click)="refreshData()"
                    [disabled]="eventsApiService.isLoading()"
                    class="flex items-center">
              @if (eventsApiService.isLoading()) {
                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                <span>載入中...</span>
              } @else {
                <ng-container>
                  <mat-icon class="mr-1">refresh</mat-icon>
                  <span>重新載入</span>
                </ng-container>
              }
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- 搜尋與篩選 -->
      @if (albums().length > 0) {
        <div class="flex flex-wrap gap-4 mb-6 items-center justify-end">
          <mat-form-field appearance="outline" class="w-64">
            <mat-label>搜尋專輯</mat-label>
            <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearchChange($event)"
                   placeholder="輸入專輯名稱...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>篩選類型</mat-label>
            <mat-select [(ngModel)]="selectedType" (ngModelChange)="onTypeChange($event)">
              <mat-option value="all">全部</mat-option>
              <mat-option value="album">專輯</mat-option>
              <mat-option value="single">單曲</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      }

      <!-- 統計資訊 -->
      @if (albums().length > 0) {
        <div class="grid grid-cols-3 gap-4 mb-8">
          <mat-card class="text-center p-4">
            <div class="text-3xl font-bold text-purple-600">
              {{ statistics().total }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">總發行數</div>
          </mat-card>
          <mat-card class="text-center p-4">
            <div class="text-3xl font-bold text-pink-600">
              {{ statistics().albums }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">專輯</div>
          </mat-card>
          <mat-card class="text-center p-4">
            <div class="text-3xl font-bold text-blue-600">
              {{ statistics().singles }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">單曲</div>
          </mat-card>
        </div>
      }

      <!-- 專輯列表 -->
      @if (eventsApiService.isLoading()) {
        <div class="flex justify-center py-12">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (filteredAlbums().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (album of filteredAlbums(); track album.id) {
            <mat-card class="hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              <!-- 專輯封面 -->
              @if (album.imageUrl) {
                <img [src]="album.imageUrl" [alt]="album.name"
                     class="w-full aspect-square object-cover">
              } @else {
                <div class="w-full aspect-square bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <mat-icon class="text-6xl text-gray-400">album</mat-icon>
                </div>
              }

              <mat-card-content class="p-4">
                <!-- 專輯類型標籤 -->
                <div class="mb-2">
                  <mat-chip [class]="getTypeChipClass(album.type)" class="text-xs">
                    {{ getTypeLabel(album.type) }}
                  </mat-chip>
                </div>

                <!-- 專輯名稱 -->
                <h3 class="font-bold text-lg mb-1 line-clamp-2" [matTooltip]="album.name">
                  {{ album.name }}
                </h3>

                <!-- 發行日期 -->
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <mat-icon class="text-sm align-middle mr-1">calendar_today</mat-icon>
                  {{ album.releaseDate | date:'yyyy 年 MM 月 dd 日' }}
                </p>

                <!-- 曲目數 -->
                <p class="text-sm text-gray-500 dark:text-gray-500">
                  <mat-icon class="text-sm align-middle mr-1">music_note</mat-icon>
                  {{ album.totalTracks }} 首曲目
                </p>
              </mat-card-content>

              <mat-card-actions class="px-4 pb-4">
                @if (album.spotifyUrl) {
                  <a mat-button color="primary" [href]="album.spotifyUrl" target="_blank">
                    <mat-icon>open_in_new</mat-icon>
                    <span class="ml-1">在 Spotify 開啟</span>
                  </a>
                }
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <!-- 顯示數量 -->
        <div class="text-center mt-6 text-gray-600 dark:text-gray-400">
          顯示 {{ filteredAlbums().length }} 筆結果
          @if (filteredAlbums().length !== albums().length) {
            （共 {{ albums().length }} 筆）
          }
        </div>
      } @else if (albums().length === 0 && !eventsApiService.isLoading()) {
        <mat-card class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">album</mat-icon>
          <h3 class="text-xl text-gray-600 dark:text-gray-400 mb-2">
            尚無專輯資料
          </h3>
          <p class="text-gray-500 dark:text-gray-500">
            點擊「同步 Spotify」按鈕以從 Spotify 取得 IU 的專輯資訊
          </p>
        </mat-card>
      } @else {
        <mat-card class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">search_off</mat-icon>
          <h3 class="text-xl text-gray-600 dark:text-gray-400">
            找不到符合條件的專輯
          </h3>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: calc(100vh - 64px);
    }

    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  `]
})
export class AlbumsComponent implements OnInit {
  eventsApiService = inject(EventsApiService);
  private destroyRef = inject(DestroyRef);

  searchQuery = '';
  selectedType: 'all' | 'album' | 'single' = 'all';

  // 從事件資料中提取專輯（排除合輯）
  albums = computed(() => {
    return this.eventsApiService.events()
      .filter(event => event.source === 'spotify')
      .filter(event => !event.tags?.includes('compilation')) // 排除合輯
      .map(this.eventToAlbum)
      .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
  });

  filteredAlbums = signal<AlbumDisplay[]>([]);

  statistics = computed(() => {
    const allAlbums = this.albums();
    return {
      total: allAlbums.length,
      albums: allAlbums.filter(a => a.type === 'album').length,
      singles: allAlbums.filter(a => a.type === 'single').length
    };
  });

  ngOnInit() {
    // 載入事件資料
    this.eventsApiService.loadEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.updateFilteredAlbums();
        },
        error: (err) => console.error('載入失敗:', err)
      });

    // 載入同步狀態
    this.eventsApiService.loadSyncStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  refreshData() {
    this.eventsApiService.loadEvents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.updateFilteredAlbums(),
        error: (err) => console.error('重新載入失敗:', err)
      });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.updateFilteredAlbums();
  }

  onTypeChange(type: 'all' | 'album' | 'single') {
    this.selectedType = type;
    this.updateFilteredAlbums();
  }

  private updateFilteredAlbums() {
    let albumList = this.albums();

    // 篩選類型
    if (this.selectedType !== 'all') {
      albumList = albumList.filter(album => album.type === this.selectedType);
    }

    // 搜尋
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      albumList = albumList.filter(album =>
        album.name.toLowerCase().includes(query) ||
        album.artists.some(artist => artist.toLowerCase().includes(query))
      );
    }

    this.filteredAlbums.set(albumList);
  }

  private eventToAlbum = (event: IUEvent): AlbumDisplay => {
    // 從 type 或 metadata 中提取專輯類型
    let albumType: 'album' | 'single' = 'single';

    // 直接從 event.type 判斷（後端已經設定為 'album' 或 'single'）
    if (event.type === 'album' || event.type === 'single') {
      albumType = event.type as 'album' | 'single';
    } else if (event.metadata) {
      // 備用：從 metadata 中解析
      const metadata = typeof event.metadata === 'string'
        ? JSON.parse(event.metadata)
        : event.metadata;

      albumType = metadata?.albumType === 'album' ? 'album' : 'single';
    }

    // 從 metadata 或描述中提取曲目數
    let totalTracks = 0;
    if (event.metadata) {
      const metadata = typeof event.metadata === 'string'
        ? JSON.parse(event.metadata)
        : event.metadata;
      totalTracks = metadata?.totalTracks || 0;
    } else if (event.description) {
      const tracksMatch = event.description.match(/(\d+)\s*track/);
      totalTracks = tracksMatch ? parseInt(tracksMatch[1], 10) : 0;
    }

    // 從 metadata 中提取藝人
    let artists = ['IU'];
    if (event.metadata) {
      const metadata = typeof event.metadata === 'string'
        ? JSON.parse(event.metadata)
        : event.metadata;
      artists = metadata?.artists || ['IU'];
    }

    return {
      id: event.id,
      name: event.title,
      type: albumType,
      releaseDate: new Date(event.date),
      imageUrl: event.imageUrl || null,
      spotifyUrl: event.sourceUrl || null,
      totalTracks,
      artists
    };
  };

  formatSyncTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTypeLabel(type: 'album' | 'single'): string {
    switch (type) {
      case 'album': return '專輯';
      case 'single': return '單曲';
      default: return type;
    }
  }

  getTypeChipClass(type: 'album' | 'single'): string {
    switch (type) {
      case 'album': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'single': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return '';
    }
  }
}
