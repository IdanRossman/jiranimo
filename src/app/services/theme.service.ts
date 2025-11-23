import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private isDarkMode$ = new BehaviorSubject<boolean>(false);

  constructor() {
    // Load saved theme or detect system preference
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme === 'dark');
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark);
    }
  }

  get isDarkMode(): Observable<boolean> {
    return this.isDarkMode$.asObservable();
  }

  get currentTheme(): boolean {
    return this.isDarkMode$.value;
  }

  toggleTheme(): void {
    this.setTheme(!this.isDarkMode$.value);
  }

  setTheme(isDark: boolean): void {
    this.isDarkMode$.next(isDark);
    localStorage.setItem(this.THEME_KEY, isDark ? 'dark' : 'light');

    if (isDark) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }
}
