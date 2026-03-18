import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'theme_mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private current: ThemeMode = 'light';

  init(): void {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode | null) ?? null;
    if (stored === 'dark' || stored === 'light') {
      this.setMode(stored);
      return;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
    this.setMode(prefersDark ? 'dark' : 'light');
  }

  get mode(): ThemeMode {
    return this.current;
  }

  toggle(): void {
    this.setMode(this.current === 'dark' ? 'light' : 'dark');
  }

  setMode(mode: ThemeMode): void {
    this.current = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    document.documentElement.setAttribute('data-theme', mode);
  }
}

