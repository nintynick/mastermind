// ============================================
// Client-Side Router
// Simple hash-based routing with View Transitions
// ============================================

import type { Route } from '../types';

type RouteHandler = () => void | Promise<void>;

interface RouterConfig {
  routes: Record<Route, RouteHandler>;
  defaultRoute: Route;
  onBeforeNavigate?: (to: Route, from: Route) => boolean | Promise<boolean>;
  onAfterNavigate?: (to: Route, from: Route) => void;
}

class Router {
  private routes: Record<string, RouteHandler> = {};
  private currentRoute: Route | null = null;
  private defaultRoute: Route = 'dashboard';
  private onBeforeNavigate?: RouterConfig['onBeforeNavigate'];
  private onAfterNavigate?: RouterConfig['onAfterNavigate'];
  private listeners: Set<(route: Route) => void> = new Set();

  init(config: RouterConfig): void {
    this.routes = config.routes;
    this.defaultRoute = config.defaultRoute;
    this.onBeforeNavigate = config.onBeforeNavigate;
    this.onAfterNavigate = config.onAfterNavigate;

    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRouteChange());

    // Handle initial route
    this.handleRouteChange();
  }

  private async handleRouteChange(): Promise<void> {
    const hash = window.location.hash.slice(1) || this.defaultRoute;
    const route = hash as Route;

    if (!this.routes[route]) {
      this.navigate(this.defaultRoute);
      return;
    }

    const previousRoute = this.currentRoute;

    // Check if navigation should proceed
    if (this.onBeforeNavigate && previousRoute) {
      const canNavigate = await this.onBeforeNavigate(route, previousRoute);
      if (!canNavigate) return;
    }

    this.currentRoute = route;

    // Use View Transitions API if available
    if ('startViewTransition' in document) {
      document.startViewTransition(async () => {
        await this.routes[route]();
      });
    } else {
      await this.routes[route]();
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(route));

    // After navigation callback
    if (this.onAfterNavigate && previousRoute) {
      this.onAfterNavigate(route, previousRoute);
    }
  }

  navigate(route: Route, replace = false): void {
    if (replace) {
      window.location.replace(`#${route}`);
    } else {
      window.location.hash = route;
    }
  }

  getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  subscribe(listener: (route: Route) => void): () => void {
    this.listeners.add(listener);
    // Immediately call with current route
    if (this.currentRoute) {
      listener(this.currentRoute);
    }
    return () => this.listeners.delete(listener);
  }

  back(): void {
    window.history.back();
  }

  forward(): void {
    window.history.forward();
  }
}

export const router = new Router();

// Navigation helper for use in templates
export function navigateTo(route: Route): void {
  router.navigate(route);
}

// Link helper for creating navigation links
export function createNavLink(route: Route, text: string, className = ''): string {
  const isActive = router.getCurrentRoute() === route;
  const activeClass = isActive ? 'active' : '';
  return `<a href="#${route}" class="${className} ${activeClass}" data-route="${route}">${text}</a>`;
}
