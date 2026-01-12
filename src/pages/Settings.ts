// ============================================
// Settings Page
// ============================================

import { appStore } from '../app';
import { confirm } from '../components/layout/Modal';
import {
  getSettings,
  saveSettings,
  downloadJSON,
  downloadCSV,
} from '../lib/storage';
import type { StoredSettings } from '../lib/storage';

let currentContainer: Element | null = null;

export function renderSettings(container: Element): void {
  currentContainer = container;
  const state = appStore.getState();
  const user = state.user;
  const settings = getSettings();

  container.innerHTML = `
    <div class="container stagger" style="max-width: 640px;">
      <div class="page-header">
        <h1 class="page-header__title">Settings</h1>
        <p class="page-header__subtitle">Manage your account and preferences</p>
      </div>

      <!-- Profile Section -->
      <section class="section">
        <div class="card">
          <h2 class="text-lg font-semibold mb-6">Profile</h2>

          <div class="flex items-center gap-6 mb-6">
            <div class="avatar avatar--lg">${user?.name?.charAt(0) || 'U'}</div>
            <div>
              <div class="font-semibold text-lg">${user?.name || 'User'}</div>
              <div class="text-secondary">${user?.email || 'email@example.com'}</div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="field">
              <label class="field__label" for="name">Name</label>
              <input type="text" id="name-input" class="field__input" value="${user?.name || ''}" />
            </div>

            <div class="field">
              <label class="field__label" for="email">Email</label>
              <input type="email" id="email-input" class="field__input" value="${user?.email || ''}" disabled />
              <p class="field__hint">Email cannot be changed in demo mode</p>
            </div>

            <div class="flex justify-end">
              <button class="btn btn--primary" id="save-profile-btn">Save Changes</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Appearance Section -->
      <section class="section">
        <div class="card">
          <h2 class="text-lg font-semibold mb-6">Appearance</h2>

          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Dark Mode</div>
                <div class="text-sm text-tertiary">Use dark theme throughout the app</div>
              </div>
              <label class="toggle">
                <input type="checkbox" class="toggle__input" id="theme-toggle" ${settings.theme === 'dark' ? 'checked' : ''} />
                <span class="toggle__slider"></span>
              </label>
            </div>

            <div class="divider"></div>

            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Compact Mode</div>
                <div class="text-sm text-tertiary">Reduce spacing for more content</div>
              </div>
              <label class="toggle">
                <input type="checkbox" class="toggle__input" id="compact-toggle" ${settings.compactMode ? 'checked' : ''} />
                <span class="toggle__slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Notifications Section -->
      <section class="section">
        <div class="card">
          <h2 class="text-lg font-semibold mb-6">Notifications</h2>

          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Meeting Reminders</div>
                <div class="text-sm text-tertiary">Get notified before meetings</div>
              </div>
              <label class="toggle">
                <input type="checkbox" class="toggle__input" id="meeting-reminders-toggle" ${settings.notifications.meetingReminders ? 'checked' : ''} />
                <span class="toggle__slider"></span>
              </label>
            </div>

            <div class="divider"></div>

            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Daily Habit Reminder</div>
                <div class="text-sm text-tertiary">Remind me to log habits</div>
              </div>
              <label class="toggle">
                <input type="checkbox" class="toggle__input" id="habit-reminder-toggle" ${settings.notifications.dailyHabitReminder ? 'checked' : ''} />
                <span class="toggle__slider"></span>
              </label>
            </div>

            <div class="divider"></div>

            <div class="flex items-center justify-between">
              <div>
                <div class="font-medium">Weekly Summary</div>
                <div class="text-sm text-tertiary">Email summary of your progress</div>
              </div>
              <label class="toggle">
                <input type="checkbox" class="toggle__input" id="weekly-summary-toggle" ${settings.notifications.weeklySummary ? 'checked' : ''} />
                <span class="toggle__slider"></span>
              </label>
            </div>
          </div>
        </div>
      </section>

      <!-- Data Section -->
      <section class="section">
        <div class="card">
          <h2 class="text-lg font-semibold mb-6">Data</h2>

          <div class="flex flex-col gap-4">
            <button class="btn btn--secondary w-full justify-start" id="export-json-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export All Data (JSON)
            </button>

            <button class="btn btn--secondary w-full justify-start" id="export-csv-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Tasks (CSV)
            </button>

            <button class="btn btn--secondary w-full justify-start" id="import-btn" disabled>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Import Data (Coming Soon)
            </button>
          </div>
        </div>
      </section>

      <!-- Danger Zone -->
      <section class="section">
        <div class="card" style="border-color: var(--warning);">
          <h2 class="text-lg font-semibold mb-4 text-warning">Danger Zone</h2>

          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium">Clear All Data</div>
              <div class="text-sm text-tertiary">Reset all local data to defaults</div>
            </div>
            <button class="btn btn--ghost" style="color: var(--warning);" id="clear-data-btn">Clear</button>
          </div>
        </div>
      </section>

      <!-- Sign Out -->
      <section class="section">
        <button class="btn btn--secondary w-full" id="sign-out-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </section>
    </div>
  `;

  bindEvents(container);
}

function bindEvents(container: Element): void {
  // Save profile
  const saveProfileBtn = container.querySelector('#save-profile-btn');
  saveProfileBtn?.addEventListener('click', () => {
    const nameInput = container.querySelector('#name-input') as HTMLInputElement;
    // In a real app, would save to Supabase
    appStore.setState({ user: { ...appStore.getState().user!, name: nameInput.value } });
    saveProfileBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveProfileBtn.textContent = 'Save Changes';
    }, 1500);
  });

  // Theme toggle
  const themeToggle = container.querySelector('#theme-toggle') as HTMLInputElement;
  themeToggle?.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    saveSettings({ theme });
    applyTheme(theme);
  });

  // Compact mode toggle
  const compactToggle = container.querySelector('#compact-toggle') as HTMLInputElement;
  compactToggle?.addEventListener('change', () => {
    saveSettings({ compactMode: compactToggle.checked });
    document.body.classList.toggle('compact-mode', compactToggle.checked);
  });

  // Notification toggles
  const meetingRemindersToggle = container.querySelector('#meeting-reminders-toggle') as HTMLInputElement;
  meetingRemindersToggle?.addEventListener('change', () => {
    const settings = getSettings();
    saveSettings({
      notifications: { ...settings.notifications, meetingReminders: meetingRemindersToggle.checked },
    });
  });

  const habitReminderToggle = container.querySelector('#habit-reminder-toggle') as HTMLInputElement;
  habitReminderToggle?.addEventListener('change', () => {
    const settings = getSettings();
    saveSettings({
      notifications: { ...settings.notifications, dailyHabitReminder: habitReminderToggle.checked },
    });
  });

  const weeklySummaryToggle = container.querySelector('#weekly-summary-toggle') as HTMLInputElement;
  weeklySummaryToggle?.addEventListener('change', () => {
    const settings = getSettings();
    saveSettings({
      notifications: { ...settings.notifications, weeklySummary: weeklySummaryToggle.checked },
    });
  });

  // Export buttons
  const exportJsonBtn = container.querySelector('#export-json-btn');
  exportJsonBtn?.addEventListener('click', () => {
    downloadJSON();
    showFeedback(exportJsonBtn as HTMLElement, 'Downloaded!');
  });

  const exportCsvBtn = container.querySelector('#export-csv-btn');
  exportCsvBtn?.addEventListener('click', () => {
    downloadCSV();
    showFeedback(exportCsvBtn as HTMLElement, 'Downloaded!');
  });

  // Clear data
  const clearDataBtn = container.querySelector('#clear-data-btn');
  clearDataBtn?.addEventListener('click', async () => {
    const confirmed = await confirm('This will reset all your data to defaults. This cannot be undone.', 'Clear All Data');
    if (confirmed) {
      localStorage.clear();
      window.location.reload();
    }
  });

  // Sign out
  const signOutBtn = container.querySelector('#sign-out-btn');
  signOutBtn?.addEventListener('click', () => {
    appStore.setState({ isAuthenticated: false, user: null });
    window.location.hash = 'login';
  });
}

function applyTheme(theme: 'dark' | 'light'): void {
  document.documentElement.setAttribute('data-theme', theme);
}

function showFeedback(element: HTMLElement, text: string): void {
  const originalHTML = element.innerHTML;
  element.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>${text}`;
  setTimeout(() => {
    element.innerHTML = originalHTML;
  }, 2000);
}
