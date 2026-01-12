// ============================================
// Reactive State Store
// Fine-grained reactivity without a framework
// ============================================

type Listener<T> = (value: T, prevValue: T) => void;
type Selector<T, R> = (state: T) => R;

export class Store<T extends object> {
  private state: T;
  private listeners: Map<string, Set<Listener<unknown>>> = new Map();
  private globalListeners: Set<Listener<T>> = new Set();

  constructor(initialState: T) {
    this.state = this.createProxy(initialState);
  }

  private createProxy(obj: T): T {
    return new Proxy(obj, {
      set: (target, prop, value) => {
        const prevValue = (target as Record<string, unknown>)[prop as string];
        if (prevValue === value) return true;

        (target as Record<string, unknown>)[prop as string] = value;

        // Notify property-specific listeners
        const propListeners = this.listeners.get(prop as string);
        if (propListeners) {
          propListeners.forEach(listener => listener(value, prevValue));
        }

        // Notify global listeners
        this.globalListeners.forEach(listener => listener(this.state, { ...this.state, [prop]: prevValue } as T));

        return true;
      },
      get: (target, prop) => {
        return (target as Record<string, unknown>)[prop as string];
      }
    });
  }

  getState(): T {
    return this.state;
  }

  setState(partial: Partial<T>): void {
    Object.assign(this.state, partial);
  }

  subscribe(listener: Listener<T>): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  subscribeToKey<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void {
    if (!this.listeners.has(key as string)) {
      this.listeners.set(key as string, new Set());
    }
    const listeners = this.listeners.get(key as string)!;
    listeners.add(listener as Listener<unknown>);
    return () => listeners.delete(listener as Listener<unknown>);
  }

  select<R>(selector: Selector<T, R>): R {
    return selector(this.state);
  }
}

// Create a simple signal implementation for component-level reactivity
export function createSignal<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void] {
  let value = initialValue;
  const listeners = new Set<(value: T) => void>();

  const get = () => value;

  const set = (newValue: T | ((prev: T) => T)) => {
    const resolved = typeof newValue === 'function'
      ? (newValue as (prev: T) => T)(value)
      : newValue;

    if (resolved !== value) {
      value = resolved;
      listeners.forEach(listener => listener(value));
    }
  };

  return [get, set];
}

// Effect for running side effects when signals change
export function createEffect(fn: () => void | (() => void)): () => void {
  let cleanup: (() => void) | void;

  const run = () => {
    if (cleanup) cleanup();
    cleanup = fn();
  };

  run();

  return () => {
    if (cleanup) cleanup();
  };
}

// Computed value that derives from other signals
export function createComputed<T>(fn: () => T): () => T {
  let cachedValue: T;
  let isStale = true;

  return () => {
    if (isStale) {
      cachedValue = fn();
      isStale = false;
      // In a real implementation, we'd track dependencies
      // For simplicity, we'll always recompute
      setTimeout(() => { isStale = true; }, 0);
    }
    return cachedValue;
  };
}

// Batch multiple state updates
let batchQueue: (() => void)[] = [];
let isBatching = false;

export function batch(fn: () => void): void {
  if (isBatching) {
    batchQueue.push(fn);
    return;
  }

  isBatching = true;
  fn();

  while (batchQueue.length > 0) {
    const next = batchQueue.shift()!;
    next();
  }

  isBatching = false;
}
