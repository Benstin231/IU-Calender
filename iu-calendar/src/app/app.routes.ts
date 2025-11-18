import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'IU Calendar - 首頁'
  },
  {
    path: 'calendar',
    loadComponent: () => import('./pages/calendar/calendar.component').then(m => m.CalendarComponent),
    title: 'IU Calendar - 月曆'
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),
    title: 'IU Calendar - 搜尋'
  },
  {
    path: 'albums',
    loadComponent: () => import('./pages/albums/albums.component').then(m => m.AlbumsComponent),
    title: 'IU Calendar - 專輯資料庫'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
