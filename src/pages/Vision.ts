// ============================================
// Vision/Mission/Values Page
// ============================================

import { modal } from '../components/layout/Modal';
import { getVision, saveVision } from '../lib/storage';
import type { StoredVision } from '../lib/storage';

let currentContainer: Element | null = null;

export function renderVision(container: Element): void {
  currentContainer = container;
  const vision = getVision();

  container.innerHTML = `
    <div class="container stagger">
      <div class="page-header">
        <h1 class="page-header__title">Vision & Values</h1>
        <p class="page-header__subtitle">Your north star for the mastermind journey</p>
      </div>

      <!-- Vision Section -->
      <section class="section">
        <div class="card">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold mb-1">Vision</h2>
              <p class="text-sm text-tertiary">The future state you're working toward</p>
            </div>
            <button class="btn btn--ghost btn--sm edit-btn" data-field="vision">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          </div>
          <div class="vision-content">
            <p class="text-lg leading-relaxed">
              ${vision.vision || 'Define your vision - the future state you\'re working toward...'}
            </p>
          </div>
        </div>
      </section>

      <!-- Mission Section -->
      <section class="section">
        <div class="card">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold mb-1">Mission</h2>
              <p class="text-sm text-tertiary">How you're going to achieve your vision</p>
            </div>
            <button class="btn btn--ghost btn--sm edit-btn" data-field="mission">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          </div>
          <div class="mission-content">
            <p class="text-lg leading-relaxed">
              ${vision.mission || 'Define your mission - how you\'ll achieve your vision...'}
            </p>
          </div>
        </div>
      </section>

      <!-- Values Section -->
      <section class="section">
        <div class="card">
          <div class="flex items-start justify-between mb-4">
            <div>
              <h2 class="text-lg font-semibold mb-1">Values</h2>
              <p class="text-sm text-tertiary">The principles that guide your decisions</p>
            </div>
            <button class="btn btn--ghost btn--sm edit-btn" data-field="values">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit
            </button>
          </div>
          <div class="values-content">
            ${renderValues(vision.values)}
          </div>
        </div>
      </section>

      <!-- Doing vs Being -->
      <div class="grid gap-6" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));">
        <section class="section">
          <div class="card" style="border-left: 3px solid var(--accent);">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-accent">DOING</h3>
              <button class="btn btn--ghost btn--sm edit-btn" data-field="doing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <p class="text-secondary leading-relaxed mb-4">
              External goals and achievements. What you're building, creating, and accomplishing in the world.
            </p>
            <ul class="flex flex-col gap-2">
              ${vision.doing.map(item => `
                <li class="flex items-start gap-3">
                  <span class="text-accent mt-1">→</span>
                  <span>${item}</span>
                </li>
              `).join('')}
              ${vision.doing.length === 0 ? '<li class="text-tertiary">Add your external goals...</li>' : ''}
            </ul>
          </div>
        </section>

        <section class="section">
          <div class="card" style="border-left: 3px solid var(--success);">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-success">BEING</h3>
              <button class="btn btn--ghost btn--sm edit-btn" data-field="being">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <p class="text-secondary leading-relaxed mb-4">
              Internal states and qualities. Who you're becoming and how you show up in the world.
            </p>
            <ul class="flex flex-col gap-2">
              ${vision.being.map(item => `
                <li class="flex items-start gap-3">
                  <span class="text-success mt-1">→</span>
                  <span>${item}</span>
                </li>
              `).join('')}
              ${vision.being.length === 0 ? '<li class="text-tertiary">Add your internal qualities...</li>' : ''}
            </ul>
          </div>
        </section>
      </div>

      <!-- SMART Goals Reminder -->
      <section class="section mt-8">
        <div class="card bg-surface">
          <h3 class="text-lg font-semibold mb-4">Setting SMART Goals</h3>
          <p class="text-secondary mb-4">
            When setting OKRs, remember to make them SMART:
          </p>
          <div class="grid gap-4" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
            <div class="p-4 rounded-lg bg-elevated">
              <div class="text-accent font-semibold mb-1">S</div>
              <div class="text-sm font-medium">Specific</div>
              <div class="text-xs text-tertiary mt-1">Clear and well-defined</div>
            </div>
            <div class="p-4 rounded-lg bg-elevated">
              <div class="text-accent font-semibold mb-1">M</div>
              <div class="text-sm font-medium">Measurable</div>
              <div class="text-xs text-tertiary mt-1">Quantifiable progress</div>
            </div>
            <div class="p-4 rounded-lg bg-elevated">
              <div class="text-accent font-semibold mb-1">A</div>
              <div class="text-sm font-medium">Achievable</div>
              <div class="text-xs text-tertiary mt-1">Challenging but possible</div>
            </div>
            <div class="p-4 rounded-lg bg-elevated">
              <div class="text-accent font-semibold mb-1">R</div>
              <div class="text-sm font-medium">Relevant</div>
              <div class="text-xs text-tertiary mt-1">Aligned with vision</div>
            </div>
            <div class="p-4 rounded-lg bg-elevated">
              <div class="text-accent font-semibold mb-1">T</div>
              <div class="text-sm font-medium">Time-bound</div>
              <div class="text-xs text-tertiary mt-1">Has a deadline</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  bindEvents(container, vision);
}

function bindEvents(container: Element, vision: StoredVision): void {
  container.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const field = (btn as HTMLElement).dataset.field as keyof StoredVision;
      if (field) {
        showEditModal(field, vision);
      }
    });
  });
}

function showEditModal(field: keyof StoredVision, vision: StoredVision): void {
  const fieldLabels: Record<string, string> = {
    vision: 'Vision',
    mission: 'Mission',
    values: 'Values',
    doing: 'DOING Goals',
    being: 'BEING Qualities',
  };

  const fieldHints: Record<string, string> = {
    vision: 'The future state you\'re working toward',
    mission: 'How you\'re going to achieve your vision',
    values: 'Separate values with commas (e.g., Integrity, Growth, Balance)',
    doing: 'One item per line. External goals and achievements.',
    being: 'One item per line. Internal states and qualities.',
  };

  const isListField = field === 'doing' || field === 'being';
  const currentValue = isListField
    ? (vision[field] as string[]).join('\n')
    : (vision[field] as string);

  modal.show({
    title: `Edit ${fieldLabels[field]}`,
    content: `
      <div class="field">
        <label class="field__label">${fieldLabels[field]}</label>
        <textarea
          name="value"
          class="field__input"
          rows="${isListField ? 5 : 4}"
          placeholder="${fieldHints[field]}"
        >${currentValue}</textarea>
        <p class="field__hint mt-2">${fieldHints[field]}</p>
      </div>
    `,
    submitLabel: 'Save',
    onSubmit: (formData) => {
      const value = formData.get('value') as string;

      if (isListField) {
        const items = value.split('\n').map(s => s.trim()).filter(s => s.length > 0);
        saveVision({ [field]: items });
      } else {
        saveVision({ [field]: value });
      }

      if (currentContainer) {
        renderVision(currentContainer);
      }
    },
  });
}

function renderValues(valuesText: string): string {
  if (!valuesText) {
    return '<p class="text-secondary">Define your core values...</p>';
  }

  // Parse values (comma or period separated)
  const values = valuesText
    .split(/[,.]/)
    .map(v => v.trim())
    .filter(v => v.length > 0);

  if (values.length === 0) {
    return `<p class="text-lg leading-relaxed">${valuesText}</p>`;
  }

  return `
    <div class="flex flex-wrap gap-3">
      ${values.map(value => `
        <span class="badge badge--accent text-sm" style="padding: 0.5rem 1rem;">
          ${value}
        </span>
      `).join('')}
    </div>
  `;
}
