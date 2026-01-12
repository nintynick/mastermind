// ============================================
// Utility Functions
// ============================================

// Date utilities
export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'short':
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'long':
      return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    case 'iso':
      return d.toISOString().split('T')[0];
    default:
      return d.toLocaleDateString();
  }
}

export function getWeekDates(weekStart: Date): Date[] {
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export function getQuarterStartDate(year: number, quarter: 1 | 2 | 3 | 4): Date {
  const month = (quarter - 1) * 3;
  return new Date(year, month, 1);
}

export function getQuarterEndDate(year: number, quarter: 1 | 2 | 3 | 4): Date {
  const month = quarter * 3;
  return new Date(year, month, 0);
}

export function getCurrentQuarter(): { year: number; quarter: 1 | 2 | 3 | 4 } {
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3) as 1 | 2 | 3 | 4;
  return { year: now.getFullYear(), quarter };
}

export function getWeekNumber(date: Date, quarterStart: Date): number {
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = date.getTime() - quarterStart.getTime();
  return Math.ceil(diff / msPerWeek);
}

export function getDayName(date: Date, format: 'short' | 'long' = 'short'): string {
  return date.toLocaleDateString('en-US', { weekday: format });
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  return d1.toDateString() === d2.toDateString();
}

// Number utilities
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp(Math.round((value / total) * 100), 0, 100);
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

// String utilities
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// Array utilities
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function sortBy<T>(array: T[], keyFn: (item: T) => number | string, desc = false): T[] {
  return [...array].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return desc ? -cmp : cmp;
  });
}

// DOM utilities
export function $(selector: string, parent: Element | Document = document): Element | null {
  return parent.querySelector(selector);
}

export function $$(selector: string, parent: Element | Document = document): Element[] {
  return Array.from(parent.querySelectorAll(selector));
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attributes: Record<string, string> = {},
  children: (string | Element)[] = []
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'class') {
      el.className = value;
    } else if (key.startsWith('data-')) {
      el.dataset[key.slice(5)] = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });
  return el;
}

export function html(strings: TemplateStringsArray, ...values: unknown[]): string {
  return strings.reduce((result, str, i) => {
    const value = values[i] ?? '';
    return result + str + String(value);
  }, '');
}

// Escape HTML for safe rendering
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Debounce utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

// Throttle utility
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

// Local storage utilities with error handling
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.warn('Failed to save to localStorage');
  }
}

// Calculate streak from habit entries
export function calculateStreak(entries: { date: string; completed: boolean }[]): number {
  if (entries.length === 0) return 0;

  const sortedEntries = sortBy(entries, e => e.date, true);
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const entry of sortedEntries) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((currentDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) break;
    if (entry.completed) {
      streak++;
      currentDate = entryDate;
    } else if (diffDays === 0) {
      // Today not completed, don't break streak
      continue;
    } else {
      break;
    }
  }

  return streak;
}

// Calculate objective progress from key results
export function calculateObjectiveProgress(keyResults: { current_value: number; target_value: number }[]): number {
  if (keyResults.length === 0) return 0;

  const totalProgress = keyResults.reduce((sum, kr) => {
    const progress = percentage(kr.current_value, kr.target_value);
    return sum + progress;
  }, 0);

  return Math.round(totalProgress / keyResults.length);
}
