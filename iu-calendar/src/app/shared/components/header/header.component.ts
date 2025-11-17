import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar class="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div class="container mx-auto flex items-center justify-between w-full px-4">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-2 no-underline">
          <mat-icon class="text-purple-600">calendar_month</mat-icon>
          <span class="text-xl font-bold text-purple-600">IU Calendar</span>
        </a>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-2">
          <a mat-button routerLink="/" routerLinkActive="bg-purple-100 dark:bg-purple-900"
             [routerLinkActiveOptions]="{exact: true}"
             class="text-gray-700 dark:text-gray-200">
            <mat-icon>home</mat-icon>
            <span class="ml-1">首頁</span>
          </a>
          <a mat-button routerLink="/calendar" routerLinkActive="bg-purple-100 dark:bg-purple-900"
             class="text-gray-700 dark:text-gray-200">
            <mat-icon>calendar_today</mat-icon>
            <span class="ml-1">月曆</span>
          </a>
          <a mat-button routerLink="/timeline" routerLinkActive="bg-purple-100 dark:bg-purple-900"
             class="text-gray-700 dark:text-gray-200">
            <mat-icon>timeline</mat-icon>
            <span class="ml-1">時間軸</span>
          </a>
          <a mat-button routerLink="/search" routerLinkActive="bg-purple-100 dark:bg-purple-900"
             class="text-gray-700 dark:text-gray-200">
            <mat-icon>search</mat-icon>
            <span class="ml-1">搜尋</span>
          </a>
        </nav>

        <!-- Theme Toggle & Mobile Menu -->
        <div class="flex items-center gap-2">
          <button mat-icon-button (click)="themeService.toggleTheme()"
                  class="text-gray-700 dark:text-gray-200">
            @if (themeService.isDarkMode()) {
              <mat-icon>light_mode</mat-icon>
            } @else {
              <mat-icon>dark_mode</mat-icon>
            }
          </button>

          <!-- Mobile Menu -->
          <button mat-icon-button [matMenuTriggerFor]="mobileMenu" class="md:hidden">
            <mat-icon>menu</mat-icon>
          </button>
          <mat-menu #mobileMenu="matMenu">
            <a mat-menu-item routerLink="/">
              <mat-icon>home</mat-icon>
              <span>首頁</span>
            </a>
            <a mat-menu-item routerLink="/calendar">
              <mat-icon>calendar_today</mat-icon>
              <span>月曆</span>
            </a>
            <a mat-menu-item routerLink="/timeline">
              <mat-icon>timeline</mat-icon>
              <span>時間軸</span>
            </a>
            <a mat-menu-item routerLink="/search">
              <mat-icon>search</mat-icon>
              <span>搜尋</span>
            </a>
          </mat-menu>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class HeaderComponent {
  themeService = inject(ThemeService);
}
