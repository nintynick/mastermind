// ============================================
// Auth Pages - Login & Signup
// ============================================

import type { Route } from '../../types';

export function renderAuthPage(container: Element, page: Route): void {
  const isLogin = page === 'login';

  container.innerHTML = `
    <div class="auth-layout">
      <div class="auth-card fade-in">
        <div class="auth-card__logo">
          <div class="auth-card__logo-icon">◎</div>
          <h1 class="auth-card__title">Mastermind</h1>
          <p class="text-secondary">Track your goals, habits, and growth</p>
        </div>

        <form class="auth-card__form" id="auth-form">
          ${!isLogin ? `
            <div class="field">
              <label class="field__label" for="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                class="field__input"
                placeholder="Your name"
                required
              />
            </div>
          ` : ''}

          <div class="field">
            <label class="field__label" for="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              class="field__input"
              placeholder="you@example.com"
              required
            />
          </div>

          <div class="field">
            <label class="field__label" for="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              class="field__input"
              placeholder="••••••••"
              minlength="8"
              required
            />
          </div>

          <button type="submit" class="btn btn--primary btn--lg w-full mt-4">
            ${isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div class="auth-card__footer">
          ${isLogin
            ? `Don't have an account? <a href="#signup">Sign up</a>`
            : `Already have an account? <a href="#login">Sign in</a>`
          }
        </div>
      </div>

      <p class="text-tertiary text-sm mt-6">
        Demo mode: Click sign in to explore the app
      </p>
    </div>
  `;

  // Handle form submission
  const form = document.getElementById('auth-form') as HTMLFormElement;
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    // For demo, just navigate to dashboard
    window.location.hash = 'dashboard';
  });
}
