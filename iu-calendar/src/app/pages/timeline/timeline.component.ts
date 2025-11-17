import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { EventService } from '../../core/services/event.service';
import { EVENT_TYPE_INFO, IUEvent } from '../../core/models/event.model';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule
  ],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6 text-center text-purple-600">時間軸</h1>

      <!-- Timeline -->
      <div class="relative">
        <!-- Center Line -->
        <div class="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-purple-200 dark:bg-purple-800"></div>

        @for (group of groupedEvents(); track group.year) {
          <!-- Year Marker -->
          <div class="relative flex justify-center mb-8">
            <div class="bg-purple-600 text-white px-6 py-2 rounded-full font-bold text-xl z-10">
              {{ group.year }}
            </div>
          </div>

          <!-- Events for this year -->
          @for (event of group.events; track event.id; let i = $index) {
            <div class="relative flex mb-8"
                 [class.justify-start]="i % 2 === 0"
                 [class.justify-end]="i % 2 !== 0">
              <!-- Event Card -->
              <div class="w-5/12">
                <mat-card class="hover:shadow-lg transition-shadow">
                  <mat-card-header>
                    <span mat-card-avatar
                          class="flex items-center justify-center w-10 h-10 rounded-full text-white"
                          [class]="'event-type-' + event.type">
                      <mat-icon>{{ getEventIcon(event.type) }}</mat-icon>
                    </span>
                    <mat-card-title class="text-base">{{ event.title }}</mat-card-title>
                    <mat-card-subtitle>
                      {{ event.year }}年{{ event.month }}月{{ event.day }}日
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content class="mt-2">
                    <p class="text-gray-600 dark:text-gray-300 text-sm">
                      {{ event.description }}
                    </p>
                    @if (event.tags.length > 0) {
                      <div class="flex flex-wrap gap-1 mt-2">
                        @for (tag of event.tags; track tag) {
                          <mat-chip class="text-xs">{{ tag }}</mat-chip>
                        }
                      </div>
                    }
                    @if (event.sourceUrl) {
                      <a [href]="event.sourceUrl" target="_blank" rel="noopener"
                         class="inline-flex items-center gap-1 text-purple-600 hover:underline text-sm mt-2">
                        <mat-icon class="text-base">link</mat-icon>
                        查看來源
                      </a>
                    }
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Timeline Dot -->
              <div class="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 z-10"
                   [class.border-purple-500]="event.type === 'debut'"
                   [class.border-pink-500]="event.type === 'release'"
                   [class.border-orange-500]="event.type === 'concert'"
                   [class.border-yellow-500]="event.type === 'award'"
                   [class.border-blue-500]="event.type === 'broadcast'"
                   [class.border-green-500]="event.type === 'social_media'"
                   [class.border-red-500]="event.type === 'milestone'">
              </div>
            </div>
          }
        }

        @if (groupedEvents().length === 0) {
          <div class="text-center py-12 text-gray-500">
            <mat-icon class="text-6xl mb-4">event_busy</mat-icon>
            <p>目前沒有事件資料</p>
          </div>
        }
      </div>
    </div>
  `
})
export class TimelineComponent {
  private eventService = inject(EventService);

  groupedEvents = computed(() => {
    const events = this.eventService.filteredEvents();
    const sorted = [...events].sort((a, b) => {
      const dateA = new Date(a.year, a.month - 1, a.day);
      const dateB = new Date(b.year, b.month - 1, b.day);
      return dateB.getTime() - dateA.getTime(); // 最新的在前
    });

    const groups: { year: number; events: IUEvent[] }[] = [];
    let currentYear = -1;

    for (const event of sorted) {
      if (event.year !== currentYear) {
        currentYear = event.year;
        groups.push({ year: currentYear, events: [] });
      }
      groups[groups.length - 1].events.push(event);
    }

    return groups;
  });

  getEventIcon(type: string): string {
    return EVENT_TYPE_INFO[type as keyof typeof EVENT_TYPE_INFO]?.icon || 'event';
  }
}
