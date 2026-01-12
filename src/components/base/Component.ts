// ============================================
// Base Component Class
// Provides lifecycle, rendering, and event handling
// ============================================

export interface ComponentOptions {
  container: Element;
  props?: Record<string, unknown>;
}

export abstract class Component<P extends Record<string, unknown> = Record<string, unknown>> {
  protected container: Element;
  protected props: P;
  protected element: Element | null = null;
  private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];
  private unmountCallbacks: Array<() => void> = [];

  constructor(options: ComponentOptions) {
    this.container = options.container;
    this.props = (options.props || {}) as P;
  }

  // Abstract method - must be implemented by subclasses
  abstract render(): string;

  // Optional lifecycle methods
  protected onMount(): void {}
  protected onUnmount(): void {}
  protected onUpdate(prevProps: P): void {}

  // Mount the component
  mount(): this {
    const html = this.render();
    this.container.innerHTML = html;
    this.element = this.container.firstElementChild;
    this.bindEvents();
    this.onMount();
    return this;
  }

  // Update props and re-render
  update(newProps: Partial<P>): this {
    const prevProps = { ...this.props };
    this.props = { ...this.props, ...newProps };

    // Store current scroll position
    const scrollTop = this.container.scrollTop;

    // Re-render
    const html = this.render();
    this.container.innerHTML = html;
    this.element = this.container.firstElementChild;

    // Restore scroll position
    this.container.scrollTop = scrollTop;

    this.bindEvents();
    this.onUpdate(prevProps);
    return this;
  }

  // Unmount the component
  unmount(): void {
    this.removeAllEventListeners();
    this.unmountCallbacks.forEach(cb => cb());
    this.onUnmount();
    this.container.innerHTML = '';
    this.element = null;
  }

  // Event binding helper
  protected on(selector: string, event: string, handler: (e: Event, el: Element) => void): void {
    this.container.addEventListener(event, (e: Event) => {
      const target = e.target as Element;
      const matchedElement = target.closest(selector);
      if (matchedElement && this.container.contains(matchedElement)) {
        handler(e, matchedElement);
      }
    });
  }

  // Delegate event helper
  protected delegate(event: string, selector: string, handler: (e: Event, el: Element) => void): void {
    const delegatedHandler = (e: Event) => {
      const target = e.target as Element;
      const matchedElement = target.closest(selector);
      if (matchedElement && this.container.contains(matchedElement)) {
        handler(e, matchedElement);
      }
    };
    this.container.addEventListener(event, delegatedHandler);
    this.eventListeners.push({ element: this.container, event, handler: delegatedHandler });
  }

  // Add event listener with automatic cleanup
  protected addEventListener(
    element: Element | Window | Document,
    event: string,
    handler: EventListener
  ): void {
    element.addEventListener(event, handler);
    this.eventListeners.push({ element: element as Element, event, handler });
  }

  // Remove all event listeners
  private removeAllEventListeners(): void {
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];
  }

  // Register cleanup callback
  protected onCleanup(callback: () => void): void {
    this.unmountCallbacks.push(callback);
  }

  // Query helper
  protected $(selector: string): Element | null {
    return this.container.querySelector(selector);
  }

  // Query all helper
  protected $$(selector: string): Element[] {
    return Array.from(this.container.querySelectorAll(selector));
  }

  // Override in subclass to bind events after render
  protected bindEvents(): void {}

  // Emit custom event
  protected emit(eventName: string, detail?: unknown): void {
    this.container.dispatchEvent(new CustomEvent(eventName, {
      bubbles: true,
      detail
    }));
  }
}

// Helper for creating components
export function createComponent<P extends Record<string, unknown>>(
  ComponentClass: new (options: ComponentOptions) => Component<P>,
  container: Element,
  props?: P
): Component<P> {
  return new ComponentClass({ container, props }).mount();
}
