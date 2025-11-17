import { Component, inject, OnInit, signal } from '@angular/core';
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
import { SpotifyService } from '../../core/services/spotify.service';
import { AlbumRelease } from '../../core/models/spotify.model';

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
          透過 Spotify API 自動抓取的專輯發行資訊
        </p>
      </div>

      <!-- 設定警告 -->
      @if (!spotifyService.isConfigured()) {
        <mat-card class="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500">
          <mat-card-content class="py-4">
            <div class="flex items-center gap-3">
              <mat-icon class="text-yellow-600">warning</mat-icon>
              <div>
                <h3 class="font-semibold text-yellow-800 dark:text-yellow-200">
                  Spotify API 尚未設定
                </h3>
                <p class="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  請在 <code class="bg-yellow-100 dark:bg-yellow-800 px-1 rounded">src/environments/environment.ts</code>
                  中填入你的 Spotify Client ID 和 Client Secret。
                </p>
                <p class="text-yellow-700 dark:text-yellow-300 text-sm mt-2">
                  前往
                  <a href="https://developer.spotify.com/dashboard" target="_blank"
                     class="underline hover:no-underline">
                    Spotify Developer Dashboard
                  </a>
                  建立應用程式以取得憑證。
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- 控制區域 -->
      <div class="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <div class="flex gap-4 items-center">
          <button mat-raised-button color="primary"
                  (click)="fetchAlbums()"
                  [disabled]="spotifyService.isLoading() || !spotifyService.isConfigured()">
            @if (spotifyService.isLoading()) {
              <mat-spinner diameter="20" class="inline-block mr-2"></mat-spinner>
              抓取中...
            } @else {
              <ng-container>
                <mat-icon>cloud_download</mat-icon>
                <span class="ml-1">抓取專輯資料</span>
              </ng-container>
            }
          </button>

          @if (spotifyService.lastFetchTime()) {
            <span class="text-sm text-gray-500 dark:text-gray-400">
              最後更新：{{ spotifyService.lastFetchTime() | date:'yyyy/MM/dd HH:mm' }}
            </span>
          }
        </div>

        <!-- 搜尋與篩選 -->
        @if (spotifyService.albums().length > 0) {
          <div class="flex gap-4 items-center">
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
                <mat-option value="compilation">合輯</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        }
      </div>

      <!-- 錯誤訊息 -->
      @if (spotifyService.error()) {
        <mat-card class="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
          <mat-card-content class="py-4">
            <div class="flex items-center gap-3">
              <mat-icon class="text-red-600">error</mat-icon>
              <div>
                <h3 class="font-semibold text-red-800 dark:text-red-200">發生錯誤</h3>
                <p class="text-red-700 dark:text-red-300 text-sm">
                  {{ spotifyService.error() }}
                </p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- 統計資訊 -->
      @if (spotifyService.albums().length > 0) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <mat-card class="text-center p-4">
            <div class="text-3xl font-bold text-green-600">
              {{ statistics().compilations }}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">合輯</div>
          </mat-card>
        </div>
      }

      <!-- 專輯列表 -->
      @if (spotifyService.isLoading()) {
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
                <a mat-button color="primary" [href]="album.spotifyUrl" target="_blank">
                  <mat-icon>open_in_new</mat-icon>
                  <span class="ml-1">在 Spotify 開啟</span>
                </a>
              </mat-card-actions>
            </mat-card>
          }
        </div>

        <!-- 顯示數量 -->
        <div class="text-center mt-6 text-gray-600 dark:text-gray-400">
          顯示 {{ filteredAlbums().length }} 筆結果
          @if (filteredAlbums().length !== spotifyService.albums().length) {
            （共 {{ spotifyService.albums().length }} 筆）
          }
        </div>
      } @else if (spotifyService.albums().length === 0 && !spotifyService.isLoading()) {
        <mat-card class="text-center py-12">
          <mat-icon class="text-6xl text-gray-400 mb-4">album</mat-icon>
          <h3 class="text-xl text-gray-600 dark:text-gray-400 mb-2">
            尚無專輯資料
          </h3>
          <p class="text-gray-500 dark:text-gray-500">
            點擊「抓取專輯資料」按鈕以從 Spotify 取得 IU 的專輯資訊
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
  spotifyService = inject(SpotifyService);

  searchQuery = '';
  selectedType: 'all' | 'album' | 'single' | 'compilation' = 'all';
  filteredAlbums = signal<AlbumRelease[]>([]);
  statistics = this.spotifyService.getStatistics();

  ngOnInit() {
    this.updateFilteredAlbums();
  }

  fetchAlbums() {
    this.spotifyService.fetchIUAlbums().subscribe({
      next: () => {
        this.updateFilteredAlbums();
      },
      error: (err) => {
        console.error('Error fetching albums:', err);
      }
    });
  }

  onSearchChange(query: string) {
    this.searchQuery = query;
    this.updateFilteredAlbums();
  }

  onTypeChange(type: 'all' | 'album' | 'single' | 'compilation') {
    this.selectedType = type;
    this.updateFilteredAlbums();
  }

  private updateFilteredAlbums() {
    let albums = this.spotifyService.albums();

    // 篩選類型
    if (this.selectedType !== 'all') {
      albums = albums.filter(album => album.type === this.selectedType);
    }

    // 搜尋
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      albums = albums.filter(album =>
        album.name.toLowerCase().includes(query) ||
        album.artists.some(artist => artist.toLowerCase().includes(query))
      );
    }

    this.filteredAlbums.set(albums);
  }

  getTypeLabel(type: 'album' | 'single' | 'compilation'): string {
    switch (type) {
      case 'album': return '專輯';
      case 'single': return '單曲';
      case 'compilation': return '合輯';
      default: return type;
    }
  }

  getTypeChipClass(type: 'album' | 'single' | 'compilation'): string {
    switch (type) {
      case 'album': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      case 'single': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'compilation': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return '';
    }
  }
}
