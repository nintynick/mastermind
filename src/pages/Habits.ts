// ============================================
// Habits Page - Daily Habit Tracking
// ============================================

import { formatDate, getWeekDates, isToday, getDayName, calculateStreak } from '../lib/utils';
import { modal, confirm } from '../components/layout/Modal';
import {
  getHabits,
  saveHabit,
  updateHabit,
  deleteHabit,
  getHabitEntries,
  toggleHabitEntry,
  getWeeklyReflection,
  saveWeeklyReflection,
  getCurrentWeekNumber,
} from '../lib/storage';
import type { StoredHabit, StoredHabitEntry } from '../lib/storage';
import { getCurrentQuarter } from '../lib/utils';

// Common emojis for habits
const EMOJI_OPTIONS = ['📝', '🧘', '💪', '😴', '🙏', '🚫', '📚', '🏃', '🥗', '💧', '🎯', '✍️', '🧠', '🌅', '🌙', '⚡'];

let currentContainer: Element | null = null;

export function renderHabits(container: Element): void {
  currentContainer = container;
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekDates = getWeekDates(weekStart);
  const todayStr = today.toISOString().split('T')[0];

  // Get data from storage
  const habits = getHabits();
  const allEntries = getHabitEntries();
  const { year, quarter } = getCurrentQuarter();
  const weekNumber = getCurrentWeekNumber();
  const habitNotes = getWeeklyReflection(weekNumber, `habits-q${quarter}-${year}`);

  // Build a map of entries by habit and date
  const entriesMap = new Map<string, Map<string, boolean>>();
  habits.forEach(h => entriesMap.set(h.id, new Map()));
  allEntries.forEach(entry => {
    const habitMap = entriesMap.get(entry.habit_id);
    if (habitMap) {
      habitMap.set(entry.date, entry.completed);
    }
  });

  // Calculate stats
  const totalHabits = habits.length;
  const todayCompleted = habits.filter(h => entriesMap.get(h.id)?.get(todayStr) === true).length;

  // Calculate streaks for all habits
  const habitStreaks = new Map<string, number>();
  habits.forEach(habit => {
    const habitEntries = allEntries
      .filter(e => e.habit_id === habit.id)
      .map(e => ({ date: e.date, completed: e.completed }));
    habitStreaks.set(habit.id, calculateStreak(habitEntries));
  });

  const bestStreak = habits.length > 0 ? Math.max(...Array.from(habitStreaks.values()), 0) : 0;

  // Calculate weekly completion rate
  let weeklyTotal = 0;
  let weeklyCompleted = 0;
  habits.forEach(habit => {
    weekDates.forEach(date => {
      if (date <= today) {
        weeklyTotal++;
        const dateStr = date.toISOString().split('T')[0];
        if (entriesMap.get(habit.id)?.get(dateStr) === true) {
          weeklyCompleted++;
        }
      }
    });
  });
  const weeklyRate = weeklyTotal > 0 ? Math.round((weeklyCompleted / weeklyTotal) * 100) : 0;

  container.innerHTML = `
    <div class="container stagger">
      <div class="page-header">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-header__title">Habit Tracker</h1>
            <p class="page-header__subtitle">${formatDate(today, 'long')}</p>
          </div>
          <button class="btn btn--primary btn--sm" id="add-habit-btn">
            + Add Habit
          </button>
        </div>
      </div>

      <!-- Today's Summary -->
      <section class="section">
        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Today</span>
              <span class="stat-card__icon">◎</span>
            </div>
            <div class="stat-card__value text-accent">${todayCompleted}/${totalHabits}</div>
            <div class="stat-card__meta">habits completed</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Best Streak</span>
              <span class="stat-card__icon">🔥</span>
            </div>
            <div class="stat-card__value text-success">${bestStreak}</div>
            <div class="stat-card__meta">days</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">This Week</span>
              <span class="stat-card__icon">📊</span>
            </div>
            <div class="stat-card__value">${weeklyRate}%</div>
            <div class="stat-card__meta">completion rate</div>
          </div>
        </div>
      </section>

      <!-- Quick Check Today -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Today's Habits</h2>
        </div>

        <div class="card">
          ${habits.length > 0 ? `
            <div class="grid gap-3">
              ${habits.map(habit => {
                const isCompleted = entriesMap.get(habit.id)?.get(todayStr) === true;
                const streak = habitStreaks.get(habit.id) || 0;
                return `
                  <div class="habit-today-item flex items-center justify-between p-3 rounded-lg bg-elevated transition" data-habit-id="${habit.id}">
                    <label class="flex items-center gap-4 cursor-pointer flex-1">
                      <div class="checkbox">
                        <input type="checkbox" class="checkbox__input habit-toggle" ${isCompleted ? 'checked' : ''} data-habit="${habit.id}" data-date="${todayStr}"/>
                        <span class="checkbox__box">
                          <svg class="checkbox__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      </div>
                      <span class="text-xl">${habit.emoji}</span>
                      <span class="font-medium">${habit.name}</span>
                    </label>
                    <div class="flex items-center gap-3">
                      ${streak > 0 ? `<span class="badge badge--success">${streak}d 🔥</span>` : ''}
                      <button class="btn btn--ghost btn--icon opacity-50 habit-edit-btn" data-habit-id="${habit.id}" title="Edit">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="btn btn--ghost btn--icon opacity-50 habit-delete-btn" data-habit-id="${habit.id}" title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <p class="text-center text-secondary py-8">No habits yet. Add your first habit above!</p>
          `}
        </div>
      </section>

      <!-- Weekly Grid -->
      ${habits.length > 0 ? `
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">Weekly Overview</h2>
          </div>

          <div class="card overflow-x-auto">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 0.75rem; color: var(--text-tertiary); font-weight: 500;">Habit</th>
                  ${weekDates.map(date => `
                    <th style="text-align: center; padding: 0.75rem; min-width: 48px;">
                      <div class="text-xs text-tertiary">${getDayName(date, 'short')}</div>
                      <div class="text-sm ${isToday(date) ? 'text-accent font-semibold' : 'text-secondary'}">${date.getDate()}</div>
                    </th>
                  `).join('')}
                  <th style="text-align: right; padding: 0.75rem; color: var(--text-tertiary); font-weight: 500;">Streak</th>
                </tr>
              </thead>
              <tbody>
                ${habits.map(habit => {
                  const streak = habitStreaks.get(habit.id) || 0;
                  return `
                    <tr style="border-top: 1px solid var(--border-subtle);">
                      <td style="padding: 0.75rem;">
                        <div class="flex items-center gap-3">
                          <span class="text-lg">${habit.emoji}</span>
                          <span class="font-medium">${habit.name}</span>
                        </div>
                      </td>
                      ${weekDates.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isCompleted = entriesMap.get(habit.id)?.get(dateStr) === true;
                        const isFuture = date > today;
                        return `
                          <td style="text-align: center; padding: 0.75rem;">
                            <div
                              class="habit-cell ${isCompleted ? 'habit-cell--completed' : ''} ${isFuture ? 'habit-cell--empty' : ''} ${isToday(date) ? 'border-accent' : ''}"
                              style="margin: 0 auto;"
                              data-habit="${habit.id}"
                              data-date="${dateStr}"
                              ${isFuture ? '' : 'role="button" tabindex="0"'}
                            ></div>
                          </td>
                        `;
                      }).join('')}
                      <td style="text-align: right; padding: 0.75rem;">
                        <span class="mono ${streak > 0 ? 'text-success' : 'text-tertiary'}">
                          ${streak > 0 ? `${streak}d` : '-'}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </section>
      ` : ''}

      <!-- Notes Section -->
      <section class="section">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Weekly Notes</h3>
          <textarea
            class="field__input w-full"
            rows="3"
            placeholder="Diet experiments, observations, things to try..."
            id="habit-notes"
          >${habitNotes}</textarea>
          <div class="flex justify-end mt-3">
            <button class="btn btn--secondary btn--sm" id="save-notes-btn">Save Notes</button>
          </div>
        </div>
      </section>
    </div>
  `;

  bindEvents(container);
}

function bindEvents(container: Element): void {
  const { year, quarter } = getCurrentQuarter();
  const weekNumber = getCurrentWeekNumber();

  // Add habit button
  const addBtn = container.querySelector('#add-habit-btn');
  addBtn?.addEventListener('click', () => {
    showAddHabitModal();
  });

  // Toggle habit completion (today quick check and weekly grid)
  container.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains('habit-toggle')) {
      const habitId = target.dataset.habit;
      const date = target.dataset.date;
      if (habitId && date) {
        toggleHabitEntry(habitId, date);
        // Re-render to update streaks
        if (currentContainer) {
          renderHabits(currentContainer);
        }
      }
    }
  });

  // Toggle habit cell in weekly grid
  container.querySelectorAll('.habit-cell[role="button"]').forEach(cell => {
    const handleToggle = () => {
      const habitId = (cell as HTMLElement).dataset.habit;
      const date = (cell as HTMLElement).dataset.date;
      if (habitId && date) {
        toggleHabitEntry(habitId, date);
        // Re-render to update streaks and checkboxes
        if (currentContainer) {
          renderHabits(currentContainer);
        }
      }
    };

    cell.addEventListener('click', handleToggle);
    cell.addEventListener('keydown', (e) => {
      if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    });
  });

  // Edit habit buttons
  container.querySelectorAll('.habit-edit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const habitId = (btn as HTMLElement).dataset.habitId;
      if (habitId) {
        const habits = getHabits();
        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          showEditHabitModal(habit);
        }
      }
    });
  });

  // Delete habit buttons
  container.querySelectorAll('.habit-delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const habitId = (btn as HTMLElement).dataset.habitId;
      if (habitId) {
        const confirmed = await confirm('Delete this habit? This will remove all tracking data.', 'Delete Habit');
        if (confirmed) {
          deleteHabit(habitId);
          if (currentContainer) {
            renderHabits(currentContainer);
          }
        }
      }
    });
  });

  // Save notes button
  const saveNotesBtn = container.querySelector('#save-notes-btn');
  saveNotesBtn?.addEventListener('click', () => {
    const textarea = container.querySelector('#habit-notes') as HTMLTextAreaElement;
    saveWeeklyReflection(weekNumber, `habits-q${quarter}-${year}`, textarea.value);
    // Visual feedback
    saveNotesBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveNotesBtn.textContent = 'Save Notes';
    }, 1500);
  });
}

function showAddHabitModal(): void {
  modal.show({
    title: 'Add Habit',
    content: `
      <div class="field mb-4">
        <label class="field__label">Habit Name</label>
        <input type="text" name="name" class="field__input" placeholder="e.g., Morning Exercise" required />
      </div>
      <div class="field">
        <label class="field__label">Emoji</label>
        <div class="emoji-picker grid gap-2" style="grid-template-columns: repeat(8, 1fr);">
          ${EMOJI_OPTIONS.map((emoji, i) => `
            <label class="emoji-option">
              <input type="radio" name="emoji" value="${emoji}" ${i === 0 ? 'checked' : ''} class="sr-only" />
              <span class="emoji-option__label">${emoji}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `,
    submitLabel: 'Add Habit',
    onSubmit: (formData) => {
      const name = formData.get('name') as string;
      const emoji = formData.get('emoji') as string;
      if (name) {
        saveHabit({ name, emoji: emoji || '📝' });
        if (currentContainer) {
          renderHabits(currentContainer);
        }
      }
    },
  });
}

function showEditHabitModal(habit: StoredHabit): void {
  modal.show({
    title: 'Edit Habit',
    content: `
      <div class="field mb-4">
        <label class="field__label">Habit Name</label>
        <input type="text" name="name" class="field__input" value="${habit.name}" required />
      </div>
      <div class="field">
        <label class="field__label">Emoji</label>
        <div class="emoji-picker grid gap-2" style="grid-template-columns: repeat(8, 1fr);">
          ${EMOJI_OPTIONS.map(emoji => `
            <label class="emoji-option">
              <input type="radio" name="emoji" value="${emoji}" ${habit.emoji === emoji ? 'checked' : ''} class="sr-only" />
              <span class="emoji-option__label">${emoji}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `,
    submitLabel: 'Save',
    onSubmit: (formData) => {
      const name = formData.get('name') as string;
      const emoji = formData.get('emoji') as string;
      if (name) {
        updateHabit(habit.id, { name, emoji: emoji || habit.emoji });
        if (currentContainer) {
          renderHabits(currentContainer);
        }
      }
    },
  });
}
