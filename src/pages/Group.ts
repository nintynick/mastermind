// ============================================
// Group Page - Member Overview
// ============================================

import { getCurrentQuarter } from '../lib/utils';

// Demo members with their progress
const DEMO_MEMBERS = [
  {
    id: '1',
    name: 'Nick',
    initials: 'N',
    role: 'admin',
    quarterProgress: 56,
    objectives: [
      { title: 'Double protocol usage', progress: 51, category: 'Growth' },
      { title: 'Ship key integrations', progress: 60, category: 'Technology' },
      { title: 'Feel stability, health, peace', progress: 75, category: 'Health' },
    ],
    weeklyTasks: { completed: 3, total: 6 },
    habitStreak: 21,
  },
  {
    id: '2',
    name: 'Charlie',
    initials: 'C',
    role: 'member',
    quarterProgress: 62,
    objectives: [
      { title: 'Launch new product line', progress: 70, category: 'Growth' },
      { title: 'Build team capacity', progress: 55, category: 'Development' },
      { title: 'Improve personal finances', progress: 60, category: 'Wealth' },
    ],
    weeklyTasks: { completed: 5, total: 7 },
    habitStreak: 14,
  },
  {
    id: '3',
    name: 'Chris',
    initials: 'CR',
    role: 'member',
    quarterProgress: 48,
    objectives: [
      { title: 'Complete certification program', progress: 40, category: 'Development' },
      { title: 'Establish morning routine', progress: 65, category: 'Health' },
      { title: 'Network expansion', progress: 38, category: 'Growth' },
    ],
    weeklyTasks: { completed: 2, total: 5 },
    habitStreak: 7,
  },
];

export function renderGroup(container: Element): void {
  const { year, quarter } = getCurrentQuarter();

  // Calculate group averages
  const avgProgress = Math.round(DEMO_MEMBERS.reduce((sum, m) => sum + m.quarterProgress, 0) / DEMO_MEMBERS.length);
  const avgHabitStreak = Math.round(DEMO_MEMBERS.reduce((sum, m) => sum + m.habitStreak, 0) / DEMO_MEMBERS.length);

  container.innerHTML = `
    <div class="container stagger">
      <div class="page-header">
        <h1 class="page-header__title">Mastermind Group</h1>
        <p class="page-header__subtitle">Q${quarter} ${year} · ${DEMO_MEMBERS.length} members</p>
      </div>

      <!-- Group Stats -->
      <section class="section">
        <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Group Avg</span>
              <span class="stat-card__icon">◎</span>
            </div>
            <div class="stat-card__value text-accent">${avgProgress}%</div>
            <div class="stat-card__meta">quarter progress</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Avg Streak</span>
              <span class="stat-card__icon">🔥</span>
            </div>
            <div class="stat-card__value text-success">${avgHabitStreak}</div>
            <div class="stat-card__meta">days</div>
          </div>

          <div class="stat-card">
            <div class="stat-card__header">
              <span class="stat-card__label">Active Since</span>
              <span class="stat-card__icon">📅</span>
            </div>
            <div class="stat-card__value">10</div>
            <div class="stat-card__meta">years</div>
          </div>
        </div>
      </section>

      <!-- Member Cards -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Members</h2>
          <div class="flex gap-2">
            <button class="btn btn--ghost btn--sm active" data-view="grid">Grid</button>
            <button class="btn btn--ghost btn--sm" data-view="compare">Compare</button>
          </div>
        </div>

        <div class="grid gap-6" id="members-grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
          ${DEMO_MEMBERS.map(member => `
            <div class="card card--interactive">
              <!-- Member Header -->
              <div class="flex items-center gap-4 mb-6">
                <div class="avatar avatar--lg">${member.initials}</div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="text-lg font-semibold">${member.name}</h3>
                    ${member.role === 'admin' ? '<span class="badge badge--accent">Admin</span>' : ''}
                  </div>
                  <div class="text-sm text-tertiary">Member since 2015</div>
                </div>
                <div class="progress-ring" style="width: 56px; height: 56px;">
                  <svg class="progress-ring__svg" width="56" height="56" viewBox="0 0 56 56">
                    <circle class="progress-ring__track" cx="28" cy="28" r="22" stroke-width="5"/>
                    <circle
                      class="progress-ring__fill ${member.quarterProgress >= 70 ? 'progress-ring__fill--success' : ''}"
                      cx="28" cy="28" r="22"
                      stroke-width="5"
                      stroke-dasharray="${2 * Math.PI * 22}"
                      stroke-dashoffset="${2 * Math.PI * 22 * (1 - member.quarterProgress / 100)}"
                    />
                  </svg>
                  <span class="progress-ring__value text-sm">${member.quarterProgress}%</span>
                </div>
              </div>

              <!-- Objectives -->
              <div class="mb-6">
                <div class="text-xs text-tertiary uppercase tracking-wide mb-3">Objectives</div>
                <div class="flex flex-col gap-2">
                  ${member.objectives.map(obj => `
                    <div class="flex items-center justify-between gap-3">
                      <div class="flex items-center gap-2 flex-1 min-w-0">
                        <span class="badge text-xs">${obj.category.slice(0, 3)}</span>
                        <span class="text-sm truncate">${obj.title}</span>
                      </div>
                      <span class="mono text-sm ${obj.progress >= 70 ? 'text-success' : 'text-secondary'}">${obj.progress}%</span>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Quick Stats -->
              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-subtle">
                <div>
                  <div class="text-xs text-tertiary">Weekly Tasks</div>
                  <div class="font-semibold">${member.weeklyTasks.completed}/${member.weeklyTasks.total}</div>
                </div>
                <div>
                  <div class="text-xs text-tertiary">Habit Streak</div>
                  <div class="font-semibold text-success">${member.habitStreak}d 🔥</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Group Activity Feed -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Recent Activity</h2>
        </div>

        <div class="card">
          <div class="flex flex-col gap-4">
            ${[
              { member: 'Charlie', action: 'completed key result', target: 'Launch new product line', time: '2 hours ago' },
              { member: 'Nick', action: 'hit 21-day streak on', target: 'Meditation', time: '5 hours ago' },
              { member: 'Chris', action: 'added new objective', target: 'Complete certification program', time: '1 day ago' },
              { member: 'Nick', action: 'completed all weekly tasks', target: 'Week 1', time: '2 days ago' },
              { member: 'Charlie', action: 'updated progress on', target: 'Build team capacity', time: '3 days ago' },
            ].map(activity => `
              <div class="flex items-start gap-4 p-3 rounded-lg bg-elevated">
                <div class="avatar avatar--sm">${activity.member.charAt(0)}</div>
                <div class="flex-1">
                  <div class="text-sm">
                    <span class="font-medium">${activity.member}</span>
                    <span class="text-secondary"> ${activity.action} </span>
                    <span class="text-accent">${activity.target}</span>
                  </div>
                  <div class="text-xs text-tertiary mt-1">${activity.time}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Group Settings -->
      <section class="section">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Group Settings</h3>
          <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
            <button class="btn btn--secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <line x1="20" y1="8" x2="20" y2="14"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              Invite Member
            </button>
            <button class="btn btn--secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Schedule Meeting
            </button>
            <button class="btn btn--secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Data
            </button>
          </div>
        </div>
      </section>
    </div>
  `;

  // View toggle
  container.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
      (e.target as Element).classList.add('active');
    });
  });
}
