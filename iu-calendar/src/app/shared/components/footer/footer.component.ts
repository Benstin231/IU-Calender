import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  template: `
    <footer class="bg-gray-100 dark:bg-gray-800 py-8 mt-auto">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- About -->
          <div>
            <h3 class="text-lg font-semibold mb-4 text-purple-600">關於 IU Calendar</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              收集並展示 IU（李知恩）的重要事件和歷史資料，讓粉絲可以查看「歷史上的今天」發生了什麼。
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-lg font-semibold mb-4 text-purple-600">快速連結</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <a href="https://www.instagram.com/dlwlrma/" target="_blank" rel="noopener"
                   class="text-gray-600 dark:text-gray-300 hover:text-purple-600">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@이지금" target="_blank" rel="noopener"
                   class="text-gray-600 dark:text-gray-300 hover:text-purple-600">
                  YouTube
                </a>
              </li>
              <li>
                <a href="https://en.wikipedia.org/wiki/IU_(singer)" target="_blank" rel="noopener"
                   class="text-gray-600 dark:text-gray-300 hover:text-purple-600">
                  Wikipedia
                </a>
              </li>
            </ul>
          </div>

          <!-- Disclaimer -->
          <div>
            <h3 class="text-lg font-semibold mb-4 text-purple-600">免責聲明</h3>
            <p class="text-gray-600 dark:text-gray-300 text-sm">
              本網站為粉絲自製，與 IU 本人及其經紀公司無關。所有資料來源均標註出處，僅供粉絲參考。
            </p>
          </div>
        </div>

        <div class="border-t border-gray-300 dark:border-gray-600 mt-8 pt-4 text-center">
          <p class="text-gray-500 dark:text-gray-400 text-sm">
            &copy; {{ currentYear }} IU Calendar. Made with love by fans.
          </p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
