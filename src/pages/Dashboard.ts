// ============================================
// Dashboard Page
// ============================================

import { appStore } from '../app';
import { formatDate, calculateStreak, getCurrentQuarter } from '../lib/utils';
import {
  getObjectives,
  getKeyResults,
  getTasks,
  getHabits,
  getHabitEntries,
  toggleHabitEntry,
  updateTask,
  getCurrentWeekNumber,
  getMembers,
  getCurrentMember,
  setCurrentMember,
  resetAllMemberData,
} from '../lib/storage';
import type { Member } from '../lib/storage';

// Initialize demo data for all members on first load
let demoDataInitialized = false;
const DEMO_DATA_VERSION = 'v3'; // Bump this to force reset demo data

let currentContainer: Element | null = null;
let selectedMemberId: string | null = null;

export function renderDashboard(container: Element): void {
  currentContainer = container;

  // Initialize demo data for all members (runs once per version)
  if (!demoDataInitialized) {
    const storedVersion = localStorage.getItem('mastermind_demo_version');
    if (storedVersion !== DEMO_DATA_VERSION) {
      resetAllMemberData();
      localStorage.setItem('mastermind_demo_version', DEMO_DATA_VERSION);
    }
    demoDataInitialized = true;
  }

  const state = appStore.getState();
  const { year, quarter } = getCurrentQuarter();
  const quarterId = `q${quarter}-${year}`;
  const weekNumber = getCurrentWeekNumber();

  // Get members and current selection
  const members = getMembers();
  const currentMember = selectedMemberId
    ? members.find(m => m.id === selectedMemberId) || members[0]
    : getCurrentMember();
  const memberId = currentMember.id;

  // Load data from storage (member-specific if viewing another member)
  const isViewingOther = selectedMemberId && selectedMemberId !== getCurrentMember().id;
  const objectives = getObjectives(quarterId, isViewingOther ? memberId : undefined);
  const allKeyResults = getKeyResults(undefined, isViewingOther ? memberId : undefined);
  const tasks = getTasks(weekNumber, quarterId, isViewingOther ? memberId : undefined);
  const habits = getHabits(isViewingOther ? memberId : undefined);
  const habitEntries = getHabitEntries(undefined, undefined, isViewingOther ? memberId : undefined);

  // Calculate objective progress
  const objectivesWithProgress = objectives.map(obj => {
    const krs = allKeyResults.filter(kr => kr.objective_id === obj.id);
    const progress = krs.length > 0
      ? Math.round(krs.reduce((sum, kr) => sum + (kr.current_value / kr.target_value) * 100, 0) / krs.length)
      : 0;
    return { ...obj, progress, keyResults: krs };
  });

  // Calculate overall progress
  const totalWeight = objectives.reduce((sum, o) => sum + o.weight, 0);
  const overallProgress = totalWeight > 0
    ? Math.round(objectivesWithProgress.reduce((sum, o) => sum + o.progress * (o.weight / totalWeight), 0))
    : 0;

  // Get today's info
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todayDayOfWeek = today.getDay();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Get week dates for habit display
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayDayOfWeek);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }

  // Build habits with completion data
  const habitsWithData = habits.map(habit => {
    const entries = habitEntries.filter(e => e.habit_id === habit.id);
    const entriesMap = new Map(entries.map(e => [e.date, e.completed]));
    const weekCompletions = weekDates.map(date => entriesMap.get(date) === true);
    const streak = calculateStreak(entries.map(e => ({ date: e.date, completed: e.completed })));
    return { ...habit, weekCompletions, streak };
  });

  // Best streak
  const bestStreak = habitsWithData.length > 0 ? Math.max(...habitsWithData.map(h => h.streak), 0) : 0;
  const bestStreakHabit = habitsWithData.find(h => h.streak === bestStreak);

  // Task counts
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'completed_plus').length;

  // Next meeting date (Monday or Friday)
  const getNextMeetingDate = () => {
    const next = new Date(today);
    const day = today.getDay();
    if (day === 0) next.setDate(today.getDate() + 1); // Sunday -> Monday
    else if (day === 1) next.setDate(today.getDate()); // Monday is today
    else if (day < 5) next.setDate(today.getDate() + (5 - day)); // Tue-Thu -> Friday
    else if (day === 5) next.setDate(today.getDate()); // Friday is today
    else next.setDate(today.getDate() + 2); // Saturday -> Monday
    return next;
  };
  const nextMeeting = getNextMeetingDate();
  const meetingType = nextMeeting.getDay() === 1 ? 'Start of Week' : 'End of Week';

  container.innerHTML = `
    <div class="container stagger">
      <!-- Page Header with Member Selector -->
      <div class="page-header">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 class="page-header__title">
              <span>Dashboard</span>
              <span class="badge badge--accent">Q${quarter} ${year}</span>
            </h1>
            <p class="page-header__subtitle">Week ${weekNumber} of 13</p>
          </div>

          <!-- Member Selector -->
          <div class="member-selector">
            <div class="member-selector__tabs">
              ${members.map(member => `
                <button
                  class="member-tab ${member.id === memberId ? 'member-tab--active' : ''}"
                  data-member-id="${member.id}"
                  style="--member-color: ${member.color}"
                >
                  <span class="member-tab__avatar" style="background: ${member.color}">${member.initials}</span>
                  <span class="member-tab__name">${member.name}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        ${isViewingOther ? `
          <div class="viewing-banner" style="background: ${currentMember.color}15; border: 1px solid ${currentMember.color}40; color: ${currentMember.color};">
            <span>Viewing ${currentMember.name}'s dashboard</span>
            <button class="btn btn--sm btn--ghost" id="back-to-mine">← Back to mine</button>
          </div>
        ` : ''}
      </div>

      <!-- Stats Overview -->
      <div class="dashboard-grid mb-8">
        <!-- Quarter Progress -->
        <div class="stat-card">
          <div class="stat-card__header">
            <span class="stat-card__label">Quarter Progress</span>
            <span class="stat-card__icon">◎</span>
          </div>
          <div class="flex items-end gap-4">
            <div class="progress-ring" style="width: 80px; height: 80px;">
              <svg class="progress-ring__svg" width="80" height="80" viewBox="0 0 80 80">
                <circle class="progress-ring__track" cx="40" cy="40" r="34"/>
                <circle
                  class="progress-ring__fill"
                  cx="40" cy="40" r="34"
                  stroke-dasharray="${2 * Math.PI * 34}"
                  stroke-dashoffset="${2 * Math.PI * 34 * (1 - overallProgress / 100)}"
                />
              </svg>
              <span class="progress-ring__value">${overallProgress}%</span>
            </div>
            <div>
              <div class="stat-card__value text-accent">${objectives.length}</div>
              <div class="stat-card__meta">objectives</div>
            </div>
          </div>
        </div>

        <!-- Tasks This Week -->
        <div class="stat-card">
          <div class="stat-card__header">
            <span class="stat-card__label">Tasks This Week</span>
            <span class="stat-card__icon">☐</span>
          </div>
          <div class="stat-card__value">
            ${completedTasks}/${tasks.length}
          </div>
          <div class="stat-card__meta">
            ${tasks.length > 0 ? `${Math.round((completedTasks / tasks.length) * 100)}% complete` : 'No tasks yet'}
          </div>
        </div>

        <!-- Habit Streak -->
        <div class="stat-card">
          <div class="stat-card__header">
            <span class="stat-card__label">Best Streak</span>
            <span class="stat-card__icon">✦</span>
          </div>
          <div class="stat-card__value text-success">
            ${bestStreak}
          </div>
          <div class="stat-card__meta">${bestStreakHabit ? `days ${bestStreakHabit.name.toLowerCase()}` : 'Start a streak!'}</div>
        </div>
      </div>

      <!-- Two Column Layout -->
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
        <!-- OKRs Summary -->
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">Objectives</h2>
            <a href="#okrs" class="btn btn--ghost btn--sm">View All →</a>
          </div>

          <div class="flex flex-col gap-4">
            ${objectivesWithProgress.length > 0 ? objectivesWithProgress.map(obj => `
              <div class="okr-card card--interactive" onclick="window.location.hash='okrs'">
                <div class="okr-card__header">
                  <div class="progress-ring okr-card__progress-ring" style="width: 48px; height: 48px;">
                    <svg class="progress-ring__svg" width="48" height="48" viewBox="0 0 48 48">
                      <circle class="progress-ring__track" cx="24" cy="24" r="20" stroke-width="4"/>
                      <circle
                        class="progress-ring__fill ${obj.progress >= 70 ? 'progress-ring__fill--success' : ''}"
                        cx="24" cy="24" r="20"
                        stroke-width="4"
                        stroke-dasharray="${2 * Math.PI * 20}"
                        stroke-dashoffset="${2 * Math.PI * 20 * (1 - obj.progress / 100)}"
                      />
                    </svg>
                    <span class="progress-ring__value text-sm">${obj.progress}%</span>
                  </div>
                  <div class="okr-card__info">
                    <div class="okr-card__category">${obj.category}</div>
                    <div class="okr-card__title">${obj.title}</div>
                    <div class="okr-card__weight">${obj.weight}% weight</div>
                  </div>
                </div>
              </div>
            `).join('') : `
              <div class="card text-center py-8">
                <p class="text-secondary mb-4">No objectives set for this quarter</p>
                <a href="#okrs" class="btn btn--primary btn--sm">Set OKRs</a>
              </div>
            `}
          </div>
        </section>

        <!-- This Week's Tasks -->
        <section class="section">
          <div class="section__header">
            <h2 class="section__title">This Week's Tasks</h2>
            <a href="#tasks" class="btn btn--ghost btn--sm">View All →</a>
          </div>

          <div class="task-list">
            ${tasks.slice(0, 5).map(task => {
              const isCompleted = task.status === 'completed' || task.status === 'completed_plus';
              const objective = objectives.find(o => o.id === task.objective_id);
              return `
                <div class="task-item ${isCompleted ? 'task-item--completed' : ''}" data-task-id="${task.id}">
                  <label class="checkbox">
                    <input
                      type="checkbox"
                      class="checkbox__input task-checkbox"
                      ${isCompleted ? 'checked' : ''}
                      data-task-id="${task.id}"
                    />
                    <span class="checkbox__box">
                      <svg class="checkbox__icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  </label>
                  <div class="task-item__content">
                    <div class="task-item__text">${task.description}</div>
                    <div class="task-item__meta">
                      ${objective ? `<span class="task-item__okr-link">${objective.title.slice(0, 15)}...</span>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
            ${tasks.length === 0 ? `
              <p class="text-center text-secondary py-4">No tasks for this week</p>
            ` : ''}
            ${tasks.length > 5 ? `
              <p class="text-center text-tertiary text-sm mt-2">+${tasks.length - 5} more tasks</p>
            ` : ''}
          </div>

          <button class="btn btn--secondary w-full mt-4" onclick="window.location.hash='tasks'">
            + Add Task
          </button>
        </section>
      </div>

      <!-- Habits This Week -->
      ${habits.length > 0 ? `
        <section class="section mt-8">
          <div class="section__header">
            <h2 class="section__title">Habits This Week</h2>
            <a href="#habits" class="btn btn--ghost btn--sm">View All →</a>
          </div>

          <div class="card">
            <div class="habit-grid">
              <!-- Header Row -->
              <div class="habit-row mb-4">
                <div></div>
                <div class="habit-row__cells">
                  ${weekDays.map((day, i) => `
                    <div class="habit-cell ${i === todayDayOfWeek ? 'border border-accent' : ''}" style="background: transparent; display: flex; align-items: center; justify-content: center;">
                      <span class="text-xs text-tertiary font-medium">${day}</span>
                    </div>
                  `).join('')}
                </div>
                <div class="habit-row__streak text-xs text-tertiary">Streak</div>
              </div>

              ${habitsWithData.map(habit => `
                <div class="habit-row">
                  <div class="habit-row__name">
                    <span class="habit-row__emoji">${habit.emoji}</span>
                    <span class="text-sm">${habit.name}</span>
                  </div>
                  <div class="habit-row__cells">
                    ${habit.weekCompletions.map((done, i) => {
                      const isFuture = i > todayDayOfWeek;
                      return `
                        <div
                          class="habit-cell ${done ? 'habit-cell--completed' : ''} ${isFuture ? 'habit-cell--empty' : ''} ${i === todayDayOfWeek ? 'border-accent' : ''}"
                          data-habit="${habit.id}"
                          data-date="${weekDates[i]}"
                          ${isFuture ? '' : 'role="button" tabindex="0"'}
                        ></div>
                      `;
                    }).join('')}
                  </div>
                  <div class="habit-row__streak ${habit.streak > 0 ? 'habit-row__streak--active' : ''}">
                    ${habit.streak > 0 ? `${habit.streak}d 🔥` : '-'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Upcoming Meeting -->
      <section class="section mt-8">
        <div class="section__header">
          <h2 class="section__title">Next Meeting</h2>
          <a href="#meetings" class="btn btn--ghost btn--sm">View All →</a>
        </div>

        <div class="meeting-card">
          <div class="meeting-card__date">
            <span class="meeting-card__day">${nextMeeting.getDate()}</span>
            <span class="meeting-card__month">${nextMeeting.toLocaleDateString('en-US', { month: 'short' })}</span>
          </div>
          <div class="meeting-card__info">
            <div class="meeting-card__type">${meetingType}</div>
            <div class="meeting-card__meta">${nextMeeting.toLocaleDateString('en-US', { weekday: 'long' })}, 9:00 AM · 9 min</div>
          </div>
          <div class="meeting-card__leader">
            <div class="avatar avatar--sm">${state.user?.name?.charAt(0) || 'U'}</div>
            <span class="text-sm text-secondary">Leading</span>
          </div>
        </div>
      </section>
    </div>
  `;

  bindEvents(container, quarterId);
}

function bindEvents(container: Element, quarterId: string): void {
  // Member tab switching
  container.querySelectorAll('.member-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const memberId = (tab as HTMLElement).dataset.memberId;
      if (memberId) {
        selectedMemberId = memberId;
        if (currentContainer) {
          renderDashboard(currentContainer);
        }
      }
    });
  });

  // Back to mine button
  const backBtn = container.querySelector('#back-to-mine');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      selectedMemberId = null;
      if (currentContainer) {
        renderDashboard(currentContainer);
      }
    });
  }

  // Habit cell toggles (only if viewing own data)
  const isViewingOther = selectedMemberId && selectedMemberId !== getCurrentMember().id;
  if (!isViewingOther) {
    container.querySelectorAll('.habit-cell[role="button"]').forEach(cell => {
      const handleToggle = () => {
        const habitId = (cell as HTMLElement).dataset.habit;
        const date = (cell as HTMLElement).dataset.date;
        if (habitId && date) {
          toggleHabitEntry(habitId, date);
          if (currentContainer) {
            renderDashboard(currentContainer);
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

    // Task checkboxes
    container.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const taskId = target.dataset.taskId;
        if (taskId) {
          const newStatus = target.checked ? 'completed' : 'planned';
          updateTask(taskId, { status: newStatus });
          const taskItem = target.closest('.task-item');
          taskItem?.classList.toggle('task-item--completed', target.checked);
        }
      });
    });
  }
}
