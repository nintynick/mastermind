// ============================================
// Modal Component - Reusable Dialog
// ============================================

export interface ModalOptions {
  title: string;
  content: string;
  onSubmit?: (formData: FormData) => void | Promise<void>;
  onClose?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

class ModalManager {
  private overlay: HTMLDivElement | null = null;
  private currentOptions: ModalOptions | null = null;

  show(options: ModalOptions): void {
    this.currentOptions = options;
    this.render();
    this.bindEvents();

    // Trigger animation
    requestAnimationFrame(() => {
      this.overlay?.classList.add('active');
      // Focus first input
      const firstInput = this.overlay?.querySelector('input, textarea, select') as HTMLElement;
      firstInput?.focus();
    });

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  hide(): void {
    if (!this.overlay) return;

    this.overlay.classList.remove('active');

    // Wait for animation
    setTimeout(() => {
      this.overlay?.remove();
      this.overlay = null;
      this.currentOptions = null;
      document.body.style.overflow = '';
    }, 250);
  }

  private render(): void {
    const { title, content, submitLabel = 'Save', cancelLabel = 'Cancel', size = 'md' } = this.currentOptions!;

    const sizeClass = size === 'sm' ? 'max-width: 360px;' : size === 'lg' ? 'max-width: 600px;' : 'max-width: 480px;';

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.innerHTML = `
      <div class="modal" style="${sizeClass}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal__header">
          <h2 class="modal__title" id="modal-title">${title}</h2>
          <button class="btn btn--ghost btn--icon modal__close" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <form class="modal__form" id="modal-form">
          <div class="modal__body">
            ${content}
          </div>
          <div class="modal__footer">
            <button type="button" class="btn btn--secondary modal__cancel">${cancelLabel}</button>
            <button type="submit" class="btn btn--primary modal__submit">${submitLabel}</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(this.overlay);
  }

  private bindEvents(): void {
    if (!this.overlay) return;

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.currentOptions?.onClose?.();
        this.hide();
      }
    });

    // Close button
    const closeBtn = this.overlay.querySelector('.modal__close');
    closeBtn?.addEventListener('click', () => {
      this.currentOptions?.onClose?.();
      this.hide();
    });

    // Cancel button
    const cancelBtn = this.overlay.querySelector('.modal__cancel');
    cancelBtn?.addEventListener('click', () => {
      this.currentOptions?.onClose?.();
      this.hide();
    });

    // Form submit
    const form = this.overlay.querySelector('#modal-form') as HTMLFormElement;
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      try {
        await this.currentOptions?.onSubmit?.(formData);
        this.hide();
      } catch (error) {
        console.error('Modal submit error:', error);
      }
    });

    // Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.currentOptions?.onClose?.();
        this.hide();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
}

// Singleton instance
export const modal = new ModalManager();

// Helper function for confirm dialogs
export function confirm(message: string, title = 'Confirm'): Promise<boolean> {
  return new Promise((resolve) => {
    modal.show({
      title,
      content: `<p class="text-secondary">${message}</p>`,
      submitLabel: 'Confirm',
      cancelLabel: 'Cancel',
      size: 'sm',
      onSubmit: () => resolve(true),
      onClose: () => resolve(false),
    });
  });
}

// Helper for alert dialogs
export function alert(message: string, title = 'Alert'): Promise<void> {
  return new Promise((resolve) => {
    modal.show({
      title,
      content: `<p class="text-secondary">${message}</p>`,
      submitLabel: 'OK',
      cancelLabel: '',
      size: 'sm',
      onSubmit: () => resolve(),
      onClose: () => resolve(),
    });
  });
}
