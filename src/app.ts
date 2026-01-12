// ============================================
// App State and Initialization
// ============================================

import { Store } from './lib/store';
import { router } from './lib/router';
import type { AppState, Route, User, Quarter, Week } from './types';
import { getCurrentQuarter, getQuarterStartDate } from './lib/utils';

// Demo data for development
const DEMO_USER: User = {
  id: 'demo-user',
  email: 'nick@example.com',
  name: 'Nick',
  vision: 'Help humanity transition to a post-scarcity economy by creating sovereignty-respecting coordination mechanisms.',
  mission: 'Establish Hats Protocol as the go-to infrastructure for roles in web3 and beyond.',
  values: 'Craft, Ownership, Being a Creator not Consumer. Health, Wealth, Freedom. Integrity, Gratitude, Presence, Wholeness, Graceful Execution.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const { year, quarter } = getCurrentQuarter();
const DEMO_QUARTER: Quarter = {
  id: 'demo-quarter',
  user_id: 'demo-user',
  year,
  quarter,
  created_at: new Date().toISOString(),
};

const quarterStart = getQuarterStartDate(year, quarter);
const DEMO_WEEK: Week = {
  id: 'demo-week',
  quarter_id: 'demo-quarter',
  week_number: Math.ceil((Date.now() - quarterStart.getTime()) / (7 * 24 * 60 * 60 * 1000)),
  start_date: new Date(Date.now() - new Date().getDay() * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

// Create global app store
export const appStore = new Store<AppState>({
  user: DEMO_USER, // Start with demo user for now
  currentRoute: 'dashboard',
  currentQuarter: DEMO_QUARTER,
  currentWeek: DEMO_WEEK,
  isLoading: false,
  error: null,
});

// Auth guard for protected routes
const protectedRoutes: Route[] = ['dashboard', 'vision', 'okrs', 'tasks', 'habits', 'meetings', 'group', 'settings'];
const publicRoutes: Route[] = ['login', 'signup'];

export function initApp(): void {
  const app = document.getElementById('app');
  if (!app) throw new Error('App container not found');

  // Set up router
  router.init({
    routes: {
      dashboard: () => renderPage('dashboard'),
      vision: () => renderPage('vision'),
      okrs: () => renderPage('okrs'),
      tasks: () => renderPage('tasks'),
      habits: () => renderPage('habits'),
      meetings: () => renderPage('meetings'),
      group: () => renderPage('group'),
      settings: () => renderPage('settings'),
      login: () => renderPage('login'),
      signup: () => renderPage('signup'),
    },
    defaultRoute: 'dashboard',
    onBeforeNavigate: async (to, from) => {
      const state = appStore.getState();

      // Redirect to login if not authenticated and trying to access protected route
      if (protectedRoutes.includes(to) && !state.user) {
        router.navigate('login', true);
        return false;
      }

      // Redirect to dashboard if authenticated and trying to access public route
      if (publicRoutes.includes(to) && state.user) {
        router.navigate('dashboard', true);
        return false;
      }

      return true;
    },
    onAfterNavigate: (to) => {
      appStore.setState({ currentRoute: to });
      updateActiveNavLinks(to);
    },
  });
}

async function renderPage(route: Route): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const state = appStore.getState();

  // Render auth pages without shell
  if (route === 'login' || route === 'signup') {
    const { renderAuthPage } = await import('./pages/auth/Auth');
    renderAuthPage(app, route);
    return;
  }

  // Render app shell with page content
  app.innerHTML = renderAppShell(route);

  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Load and render the appropriate page
  switch (route) {
    case 'dashboard':
      const { renderDashboard } = await import('./pages/Dashboard');
      renderDashboard(mainContent);
      break;
    case 'vision':
      const { renderVision } = await import('./pages/Vision');
      renderVision(mainContent);
      break;
    case 'okrs':
      const { renderOKRs } = await import('./pages/OKRs');
      renderOKRs(mainContent);
      break;
    case 'tasks':
      const { renderTasks } = await import('./pages/Tasks');
      renderTasks(mainContent);
      break;
    case 'habits':
      const { renderHabits } = await import('./pages/Habits');
      renderHabits(mainContent);
      break;
    case 'meetings':
      const { renderMeetings } = await import('./pages/Meetings');
      renderMeetings(mainContent);
      break;
    case 'group':
      const { renderGroup } = await import('./pages/Group');
      renderGroup(mainContent);
      break;
    case 'settings':
      const { renderSettings } = await import('./pages/Settings');
      renderSettings(mainContent);
      break;
  }

  updateActiveNavLinks(route);
}

function renderAppShell(currentRoute: Route): string {
  const state = appStore.getState();
  const user = state.user;

  return `
    <div class="app-shell">
      <header class="header">
        <a href="#dashboard" class="header__logo">
          <span class="header__logo-icon">◎</span>
          <span class="hide-mobile">Mastermind</span>
        </a>

        <nav class="header__nav">
          <a href="#dashboard" class="header__nav-link" data-route="dashboard">Dashboard</a>
          <a href="#okrs" class="header__nav-link" data-route="okrs">OKRs</a>
          <a href="#tasks" class="header__nav-link" data-route="tasks">Tasks</a>
          <a href="#habits" class="header__nav-link" data-route="habits">Habits</a>
          <a href="#meetings" class="header__nav-link" data-route="meetings">Meetings</a>
        </nav>

        <div class="header__actions">
          <a href="#settings" class="btn btn--icon btn--ghost" data-route="settings" title="Settings">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
            </svg>
          </a>
          <div class="avatar" title="${user?.name || 'User'}">
            ${user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <main id="main-content" class="main-content">
        <div class="container">
          <div class="skeleton" style="height: 200px;"></div>
        </div>
      </main>

      <nav class="bottom-nav">
        <a href="#dashboard" class="bottom-nav__item" data-route="dashboard">
          <span class="bottom-nav__icon">◎</span>
          <span>Home</span>
        </a>
        <a href="#okrs" class="bottom-nav__item" data-route="okrs">
          <span class="bottom-nav__icon">◉</span>
          <span>OKRs</span>
        </a>
        <a href="#tasks" class="bottom-nav__item" data-route="tasks">
          <span class="bottom-nav__icon">☐</span>
          <span>Tasks</span>
        </a>
        <a href="#habits" class="bottom-nav__item" data-route="habits">
          <span class="bottom-nav__icon">✦</span>
          <span>Habits</span>
        </a>
        <a href="#group" class="bottom-nav__item" data-route="group">
          <span class="bottom-nav__icon">◈</span>
          <span>Group</span>
        </a>
      </nav>
    </div>
  `;
}

function updateActiveNavLinks(currentRoute: Route): void {
  // Update header nav links
  document.querySelectorAll('.header__nav-link').forEach(link => {
    const route = link.getAttribute('data-route');
    link.classList.toggle('active', route === currentRoute);
  });

  // Update bottom nav links
  document.querySelectorAll('.bottom-nav__item').forEach(link => {
    const route = link.getAttribute('data-route');
    link.classList.toggle('active', route === currentRoute);
  });
}

// Export for use in components
export function getUser(): User | null {
  return appStore.getState().user;
}

export function getCurrentQuarterState(): Quarter | null {
  return appStore.getState().currentQuarter;
}

export function getCurrentWeekState(): Week | null {
  return appStore.getState().currentWeek;
}
