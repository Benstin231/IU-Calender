import { Injectable, inject, signal, computed } from '@angular/core';
import { IUEvent, EventType } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // 載入狀態
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // 事件資料（從 EventsApiService 獲取，這裡作為備用或混合使用）
  private eventsData = signal<IUEvent[]>([]);

  // 篩選條件
  selectedTypes = signal<EventType[]>([]);
  searchQuery = signal<string>('');

  // 計算屬性：所有事件
  allEvents = computed(() => this.eventsData());

  // 計算屬性：篩選後的事件
  filteredEvents = computed(() => {
    let events = this.allEvents();

    // 依類型篩選
    const types = this.selectedTypes();
    if (types.length > 0) {
      events = events.filter(event => types.includes(event.type));
    }

    // 依搜尋關鍵字篩選
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      events = events.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        (event.titleKo && event.titleKo.toLowerCase().includes(query))
      );
    }

    return events;
  });

  // 取得特定日期的事件（歷史上的今天）
  getEventsForDate(month: number, day: number) {
    return computed(() => {
      return this.filteredEvents().filter(
        event => event.month === month && event.day === day
      );
    });
  }

  // 取得特定年月的事件
  getEventsForMonth(year: number, month: number) {
    return computed(() => {
      return this.filteredEvents().filter(
        event => event.year === year && event.month === month
      );
    });
  }

  // 取得今天的歷史事件
  getTodayInHistory() {
    const today = new Date();
    return this.getEventsForDate(today.getMonth() + 1, today.getDate());
  }

  // 依 ID 取得事件
  getEventById(id: string) {
    return computed(() => {
      return this.allEvents().find(event => event.id === id) || null;
    });
  }

  // 設定篩選類型
  setSelectedTypes(types: EventType[]): void {
    this.selectedTypes.set(types);
  }

  // 切換篩選類型
  toggleType(type: EventType): void {
    this.selectedTypes.update(current => {
      if (current.includes(type)) {
        return current.filter(t => t !== type);
      } else {
        return [...current, type];
      }
    });
  }

  // 設定搜尋關鍵字
  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  // 清除所有篩選
  clearFilters(): void {
    this.selectedTypes.set([]);
    this.searchQuery.set('');
  }
}
