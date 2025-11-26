import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { EventService } from '../../core/services/event.service';
import { EVENT_TYPE_INFO } from '../../core/models/event.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    FormsModule,
    MatCardModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-purple-600">搜尋事件</h1>

      <!-- Search Input -->
      <mat-card class="mb-6">
        <mat-card-content class="p-4">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>搜尋關鍵字</mat-label>
            <input matInput
                   [ngModel]="searchQuery()"
                   (ngModelChange)="onSearchChange($event)"
                   placeholder="輸入事件標題、描述或標籤...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>

          <!-- Popular Tags -->
          <div class="mt-4">
            <p class="text-sm font-medium mb-2">熱門標籤：</p>
            <div class="flex flex-wrap gap-2">
              @for (tag of popularTags; track tag) {
                <button mat-stroked-button
                        (click)="searchByTag(tag)"
                        class="text-sm">
                  {{ tag }}
                </button>
              }
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Search Results -->
      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-300">
          找到 <strong>{{ eventService.filteredEvents().length }}</strong> 個結果
        </p>

        @for (event of eventService.filteredEvents(); track event.id) {
          <mat-card class="hover:shadow-lg transition-shadow">
            <mat-card-content class="p-4">
              <div class="flex items-start gap-4">
                <!-- Event Type Badge -->
                <div class="flex-shrink-0">
                  <span class="inline-flex items-center justify-center w-12 h-12 rounded-full text-white"
                        [class]="'event-type-' + event.type">
                    <mat-icon>{{ getEventIcon(event.type) }}</mat-icon>
                  </span>
                </div>

                <!-- Event Details -->
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-1 rounded text-white text-xs font-medium"
                          [class]="'event-type-' + event.type">
                      {{ getEventTypeLabel(event.type) }}
                    </span>
                    <span class="text-sm text-gray-500">
                      {{ event.year }}年{{ event.month }}月{{ event.day }}日
                    </span>
                  </div>

                  <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {{ event.title }}
                  </h3>
                  @if (event.titleKo) {
                    <p class="text-sm text-gray-500 mb-2">{{ event.titleKo }}</p>
                  }

                  <p class="text-gray-600 dark:text-gray-300">
                    {{ event.description }}
                  </p>

                  <div class="flex items-center gap-4 mt-3">
                    <!-- Tags -->
                    @if (event.tags && event.tags.length > 0) {
                      <div class="flex flex-wrap gap-1">
                        @for (tag of event.tags; track tag) {
                          <mat-chip (click)="searchByTag(tag)"
                                    class="cursor-pointer text-xs">
                            {{ tag }}
                          </mat-chip>
                        }
                      </div>
                    }

                    <!-- Source -->
                    <div class="flex items-center gap-1 text-sm text-gray-500">
                      <mat-icon class="text-base">source</mat-icon>
                      <span>{{ event.source }}</span>
                    </div>

                    @if (event.sourceUrl) {
                      <a [href]="event.sourceUrl" target="_blank" rel="noopener"
                         class="text-purple-600 hover:underline text-sm">
                        查看來源
                      </a>
                    }
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        }

        @if (eventService.filteredEvents().length === 0) {
          <mat-card class="text-center py-12">
            <mat-icon class="text-6xl text-gray-400 mb-4">search_off</mat-icon>
            <p class="text-gray-500">找不到符合條件的事件</p>
            <button mat-button color="primary" (click)="clearSearch()" class="mt-2">
              清除搜尋
            </button>
          </mat-card>
        }
      </div>
    </div>
  `
})
export class SearchComponent {
  eventService = inject(EventService);

  searchQuery = this.eventService.searchQuery;

  popularTags = [
    '專輯',
    '單曲',
    '演唱會',
    '獲獎',
    '電視劇',
    '綜藝',
    'MV',
    'Comeback'
  ];

  onSearchChange(query: string): void {
    this.eventService.setSearchQuery(query);
  }

  searchByTag(tag: string): void {
    this.eventService.setSearchQuery(tag);
  }

  clearSearch(): void {
    this.eventService.setSearchQuery('');
  }

  getEventTypeLabel(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.label || type;
  }

  getEventIcon(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.icon || 'event';
  }
}
