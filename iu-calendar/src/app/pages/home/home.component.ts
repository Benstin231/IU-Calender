import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { EventService } from '../../core/services/event.service';
import { EVENT_TYPE_INFO } from '../../core/models/event.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    DatePipe
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <!-- Hero Section -->
      <section class="text-center mb-12">
        <h1 class="text-4xl md:text-6xl font-bold text-purple-600 mb-4">
          IU Calendar
        </h1>
        <p class="text-xl text-gray-600 dark:text-gray-300 mb-8">
          探索 IU（李知恩）的歷史足跡，回顧每一個精彩時刻
        </p>
        <div class="flex justify-center gap-4">
          <a mat-raised-button color="primary" routerLink="/calendar">
            <mat-icon>calendar_today</mat-icon>
            查看月曆
          </a>
          <a mat-stroked-button routerLink="/albums">
            <mat-icon>album</mat-icon>
            專輯資料庫
          </a>
        </div>
      </section>

      <!-- Today in History -->
      <section class="mb-12">
        <mat-card class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <mat-card-header>
            <mat-icon mat-card-avatar class="text-purple-600 text-3xl">history</mat-icon>
            <mat-card-title class="text-2xl">歷史上的今天</mat-card-title>
            <mat-card-subtitle>{{ today | date:'MM月dd日' }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="mt-4">
            @if (todayEvents().length > 0) {
              <div class="space-y-4">
                @for (event of todayEvents(); track event.id) {
                  <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                    <div class="flex items-start gap-3">
                      <span class="px-2 py-1 rounded text-white text-xs font-medium"
                            [class]="'event-type-' + event.type">
                        {{ getEventTypeLabel(event.type) }}
                      </span>
                      <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 dark:text-gray-100">
                          {{ event.year }}年 - {{ event.title }}
                        </h4>
                        <p class="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {{ event.description }}
                        </p>
                        @if (event.tags && event.tags.length > 0) {
                          <div class="flex gap-1 mt-2">
                            @for (tag of event.tags; track tag) {
                              <mat-chip class="text-xs">{{ tag }}</mat-chip>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-gray-500 dark:text-gray-400 text-center py-8">
                今天沒有歷史事件記錄
              </p>
            }
          </mat-card-content>
        </mat-card>
      </section>

      <!-- About IU -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6 text-center">關於 IU</h2>
        <mat-card>
          <mat-card-content>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
              <div>
                <h3 class="text-xl font-semibold mb-4 text-purple-600">基本資料</h3>
                <ul class="space-y-2 text-gray-700 dark:text-gray-300">
                  <li><strong>本名：</strong>李知恩（이지은 / Lee Ji-eun）</li>
                  <li><strong>藝名：</strong>IU（아이유）</li>
                  <li><strong>出生日期：</strong>1993年5月16日</li>
                  <li><strong>出道日期：</strong>2008年9月18日</li>
                  <li><strong>經紀公司：</strong>EDAM Entertainment</li>
                  <li><strong>職業：</strong>歌手、詞曲作家、演員</li>
                </ul>
              </div>
              <div>
                <h3 class="text-xl font-semibold mb-4 text-purple-600">重要成就</h3>
                <ul class="space-y-2 text-gray-700 dark:text-gray-300">
                  <li>韓國頂級女 Solo 歌手</li>
                  <li>多次獲得音樂頒獎典禮大獎</li>
                  <li>電視劇《我的大叔》、《Hotel Del Luna》等代表作</li>
                  <li>被譽為「國民妹妹」</li>
                  <li>持續活躍於音樂和戲劇界超過15年</li>
                </ul>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </section>

      <!-- Event Types -->
      <section class="mb-12">
        <h2 class="text-2xl font-bold mb-6 text-center">事件類型</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          @for (typeInfo of eventTypes; track typeInfo.type) {
            <mat-card class="text-center p-4 hover:shadow-lg transition-shadow">
              <mat-icon class="text-4xl mb-2" [style.color]="getTypeColor(typeInfo.type)">
                {{ typeInfo.icon }}
              </mat-icon>
              <p class="font-medium">{{ typeInfo.label }}</p>
              <p class="text-sm text-gray-500">{{ typeInfo.labelKo }}</p>
            </mat-card>
          }
        </div>
      </section>

      <!-- Statistics -->
      <section>
        <h2 class="text-2xl font-bold mb-6 text-center">資料統計</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <mat-card class="text-center p-6">
            <mat-icon class="text-5xl text-purple-600 mb-2">event</mat-icon>
            <p class="text-3xl font-bold text-purple-600">{{ totalEvents() }}</p>
            <p class="text-gray-600 dark:text-gray-300">總事件數</p>
          </mat-card>
          <mat-card class="text-center p-6">
            <mat-icon class="text-5xl text-pink-600 mb-2">date_range</mat-icon>
            <p class="text-3xl font-bold text-pink-600">{{ yearsActive }}</p>
            <p class="text-gray-600 dark:text-gray-300">活躍年數</p>
          </mat-card>
          <mat-card class="text-center p-6">
            <mat-icon class="text-5xl text-orange-600 mb-2">star</mat-icon>
            <p class="text-3xl font-bold text-orange-600">{{ debutDate }}</p>
            <p class="text-gray-600 dark:text-gray-300">出道日期</p>
          </mat-card>
        </div>
      </section>
    </div>
  `
})
export class HomeComponent {
  private eventService = inject(EventService);

  today = new Date();
  debutDate = '2008-09-18';
  yearsActive = new Date().getFullYear() - 2008;

  eventTypes = Object.values(EVENT_TYPE_INFO);

  todayEvents = this.eventService.getTodayInHistory();
  totalEvents = computed(() => this.eventService.allEvents().length);

  getEventTypeLabel(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.label || type;
  }

  getTypeColor(type: string): string {
    const colors: Record<string, string> = {
      release: '#EC4899',
      concert: '#F97316',
      award: '#EAB308',
      broadcast: '#3B82F6',
      social_media: '#22C55E',
      milestone: '#EF4444'
    };
    return colors[type] || '#6B7280';
  }
}
