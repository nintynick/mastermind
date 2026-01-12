// ============================================
// OKRs (Objectives & Key Results) Page
// ============================================

import { appStore } from '../app';
import { getCurrentQuarter } from '../lib/utils';
import { modal, confirm } from '../components/layout/Modal';
import {
  getObjectives,
  getKeyResults,
  saveObjective,
  updateObjective,
  deleteObjective,
  saveKeyResult,
  updateKeyResult,
  deleteKeyResult,
} from '../lib/storage';
import type { StoredObjective, StoredKeyResult } from '../lib/storage';

// Calculate progress from key results
function calculateProgress(objectiveId: string): number {
  const keyResults = getKeyResults(objectiveId);
  if (keyResults.length === 0) return 0;
  const totalProgress = keyResults.reduce((sum, kr) => {
    const progress = Math.min(100, Math.round((kr.current_value / kr.target_value) * 100));
    return sum + progress;
  }, 0);
  return Math.round(totalProgress / keyResults.length);
}

export function renderOKRs(container: Element): void {
  const { year, quarter } = getCurrentQuarter();
  const state = appStore.getState();
  const quarterId = `q${quarter}-${year}`;

  // Load data from storage
  const objectives = getObjectives(quarterId);
  const allKeyResults = getKeyResults();

  // Calculate objective progress
  const objectivesWithProgress = objectives.map(obj => ({
    ...obj,
    progress: calculateProgress(obj.id),
    keyResults: allKeyResults.filter(kr => kr.objective_id === obj.id),
  }));

  // Calculate overall progress
  const totalWeight = objectivesWithProgress.reduce((sum, o) => sum + o.weight, 0) || 1;
  const overallProgress = Math.round(
    objectivesWithProgress.reduce((sum, o) => sum + o.progress * (o.weight / totalWeight), 0)
  );

  container.innerHTML = `
    <div class="container stagger">
      <div class="page-header">
        <div class="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 class="page-header__title">Objectives & Key Results</h1>
            <p class="page-header__subtitle">Q${quarter} ${year} · Week ${state.currentWeek?.week_number || 1} of 13</p>
          </div>
          <div class="quarter-select">
            ${[1, 2, 3, 4].map(q => `
              <button class="quarter-select__btn ${q === quarter ? 'active' : ''}" data-quarter="${q}">Q${q}</button>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Overall Progress -->
      <section class="section">
        <div class="card">
          <div class="flex items-center gap-8 flex-wrap">
            <div class="progress-ring" style="width: 120px; height: 120px;">
              <svg class="progress-ring__svg" width="120" height="120" viewBox="0 0 120 120">
                <circle class="progress-ring__track" cx="60" cy="60" r="52" stroke-width="8"/>
                <circle
                  class="progress-ring__fill"
                  cx="60" cy="60" r="52"
                  stroke-width="8"
                  stroke-dasharray="${2 * Math.PI * 52}"
                  stroke-dashoffset="${2 * Math.PI * 52 * (1 - overallProgress / 100)}"
                />
              </svg>
              <span class="progress-ring__value text-2xl">${overallProgress}%</span>
            </div>
            <div class="flex-1">
              <h2 class="text-xl font-semibold mb-2">Quarter Progress</h2>
              <p class="text-secondary mb-4">
                ${objectives.length} objectives with ${allKeyResults.filter(kr => objectives.some(o => o.id === kr.objective_id)).length} key results
              </p>
              <div class="progress-bar" style="height: 8px;">
                <div class="progress-bar__fill progress-bar__fill--glow" style="width: ${overallProgress}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Objectives List -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Objectives</h2>
          <button class="btn btn--primary btn--sm" id="add-objective-btn">
            + Add Objective
          </button>
        </div>

        <div class="flex flex-col gap-6" id="objectives-list">
          ${objectivesWithProgress.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state__icon">◎</div>
              <div class="empty-state__title">No objectives yet</div>
              <div class="empty-state__description">Add your first objective to start tracking progress</div>
            </div>
          ` : objectivesWithProgress.map((obj, index) => `
            <div class="okr-card slide-up" style="animation-delay: ${index * 100}ms;" data-objective-id="${obj.id}">
              <div class="okr-card__header">
                <div class="progress-ring okr-card__progress-ring" style="width: 64px; height: 64px;">
                  <svg class="progress-ring__svg" width="64" height="64" viewBox="0 0 64 64">
                    <circle class="progress-ring__track" cx="32" cy="32" r="26" stroke-width="5"/>
                    <circle
                      class="progress-ring__fill ${obj.progress >= 70 ? 'progress-ring__fill--success' : ''}"
                      cx="32" cy="32" r="26"
                      stroke-width="5"
                      stroke-dasharray="${2 * Math.PI * 26}"
                      stroke-dashoffset="${2 * Math.PI * 26 * (1 - obj.progress / 100)}"
                    />
                  </svg>
                  <span class="progress-ring__value text-base">${obj.progress}%</span>
                </div>
                <div class="okr-card__info flex-1">
                  <div class="okr-card__title text-lg">${obj.title}</div>
                  <div class="okr-card__weight">${obj.weight}% weight · ${obj.keyResults.length} key results</div>
                </div>
                <div class="flex gap-2">
                  <button class="btn btn--ghost btn--icon edit-objective-btn" data-id="${obj.id}" title="Edit objective">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="btn btn--ghost btn--icon delete-objective-btn" data-id="${obj.id}" title="Delete objective">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="okr-card__key-results">
                ${obj.keyResults.map((kr, krIndex) => {
                  const krProgress = Math.round((kr.current_value / kr.target_value) * 100);
                  return `
                    <div class="key-result" data-kr-id="${kr.id}">
                      <div class="key-result__header">
                        <div class="flex items-center gap-3">
                          <span class="badge">${index + 1}-${krIndex + 1}</span>
                          <span class="key-result__title">${kr.description}</span>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="key-result__value mono">
                            ${kr.current_value}/${kr.target_value} ${kr.unit}
                            <span class="text-tertiary ml-2">(${Math.min(krProgress, 100)}%)</span>
                          </span>
                          <button class="btn btn--ghost btn--icon btn--sm edit-kr-btn" data-id="${kr.id}" title="Edit">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                          </button>
                          <button class="btn btn--ghost btn--icon btn--sm delete-kr-btn" data-id="${kr.id}" title="Delete">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div class="progress-bar">
                        <div
                          class="progress-bar__fill ${krProgress >= 70 ? 'progress-bar__fill--success' : ''}"
                          style="width: ${Math.min(krProgress, 100)}%;"
                        ></div>
                      </div>
                    </div>
                  `;
                }).join('')}

                <button class="btn btn--ghost btn--sm mt-2 add-kr-btn" data-objective-id="${obj.id}">
                  + Add Key Result
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      ${objectivesWithProgress.length > 0 ? `
      <!-- Weight Distribution -->
      <section class="section mt-8">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Weight Distribution</h3>
          <div class="flex gap-2" style="height: 24px;">
            ${objectivesWithProgress.map((obj, i) => `
              <div
                class="rounded-full transition"
                style="
                  flex: ${obj.weight || 1};
                  background: var(--accent);
                  opacity: ${0.5 + (obj.progress / 200)};
                "
                title="${obj.title}: ${obj.weight}%"
              ></div>
            `).join('')}
          </div>
          <div class="flex justify-between mt-3 text-sm text-tertiary">
            ${objectivesWithProgress.map(obj => `
              <span>${obj.weight}%</span>
            `).join('')}
          </div>
        </div>
      </section>
      ` : ''}
    </div>
  `;

  // Bind events
  bindEvents(container, quarterId);
}

function bindEvents(container: Element, quarterId: string): void {
  // Add Objective
  container.querySelector('#add-objective-btn')?.addEventListener('click', () => {
    showObjectiveModal(null, quarterId, () => renderOKRs(container));
  });

  // Edit Objective
  container.querySelectorAll('.edit-objective-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id!;
      const objectives = getObjectives();
      const objective = objectives.find(o => o.id === id);
      if (objective) {
        showObjectiveModal(objective, quarterId, () => renderOKRs(container));
      }
    });
  });

  // Delete Objective
  container.querySelectorAll('.delete-objective-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id!;
      const confirmed = await confirm('Delete this objective and all its key results?', 'Delete Objective');
      if (confirmed) {
        deleteObjective(id);
        renderOKRs(container);
      }
    });
  });

  // Add Key Result
  container.querySelectorAll('.add-kr-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const objectiveId = (btn as HTMLElement).dataset.objectiveId!;
      showKeyResultModal(null, objectiveId, () => renderOKRs(container));
    });
  });

  // Edit Key Result
  container.querySelectorAll('.edit-kr-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id!;
      const keyResults = getKeyResults();
      const kr = keyResults.find(k => k.id === id);
      if (kr) {
        showKeyResultModal(kr, kr.objective_id, () => renderOKRs(container));
      }
    });
  });

  // Delete Key Result
  container.querySelectorAll('.delete-kr-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id!;
      const confirmed = await confirm('Delete this key result?', 'Delete Key Result');
      if (confirmed) {
        deleteKeyResult(id);
        renderOKRs(container);
      }
    });
  });

  // Quarter selector
  container.querySelectorAll('.quarter-select__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // In a full app, this would load different quarter data
      container.querySelectorAll('.quarter-select__btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// SMART tips for guided mode
const SMART_TIPS = {
  specific: {
    title: 'Be Specific',
    examples: [
      'Instead of "Get healthier" → "Establish consistent exercise routine"',
      'Instead of "Grow business" → "Double active user base"',
    ],
  },
  measurable: {
    title: 'Make it Measurable',
    tip: 'Define 2-3 key results with concrete metrics. You\'ll add these after creating the objective.',
  },
  achievable: {
    title: 'Is it Achievable?',
    questions: [
      'Do you have the skills and resources needed?',
      'Is this challenging but attainable in one quarter?',
      'What obstacles might you face?',
    ],
  },
  relevant: {
    title: 'Is it Relevant?',
    questions: [
      'Does this align with your vision and values?',
      'Is this the right time for this goal?',
      'Does it support your other priorities?',
    ],
  },
  timeBound: {
    title: 'Time-Bound',
    tip: 'Objectives are quarterly (13 weeks). This creates natural urgency and review cadence.',
  },
};

function showObjectiveModal(objective: StoredObjective | null, quarterId: string, onSave: () => void): void {
  const isEdit = objective !== null;

  // For editing, always use simple mode
  if (isEdit) {
    showSimpleObjectiveModal(objective, quarterId, onSave);
    return;
  }

  // For new objectives, show modal with mode selection
  let currentMode: 'simple' | 'guided' = 'simple';
  let currentStep = 1;
  const totalSteps = 4;

  // State for guided mode
  const guidedState = {
    title: '',
    weight: 25,
    keyResults: [] as Array<{ description: string; target_value: number; unit: string }>,
  };

  function renderModalContent(): string {
    return `
      <div class="objective-modal">
        <!-- Mode Tabs -->
        <div class="mode-tabs">
          <button type="button" class="mode-tab ${currentMode === 'simple' ? 'mode-tab--active' : ''}" data-mode="simple">
            <span class="mode-tab__icon">⚡</span>
            <span class="mode-tab__label">Quick Add</span>
          </button>
          <button type="button" class="mode-tab ${currentMode === 'guided' ? 'mode-tab--active' : ''}" data-mode="guided">
            <span class="mode-tab__icon">🎯</span>
            <span class="mode-tab__label">Guided</span>
          </button>
        </div>

        <!-- Content Area -->
        <div class="mode-content">
          ${currentMode === 'simple' ? renderSimpleMode() : renderGuidedMode()}
        </div>
      </div>
    `;
  }

  function renderSimpleMode(): string {
    return `
      <div class="flex flex-col gap-4">
        <div class="field">
          <label class="field__label" for="obj-title">Title</label>
          <input type="text" id="obj-title" name="title" class="field__input" value="${guidedState.title}" placeholder="What do you want to achieve?" required />
        </div>
        <div class="field">
          <label class="field__label" for="obj-weight">Weight (%)</label>
          <input type="number" id="obj-weight" name="weight" class="field__input" min="0" max="100" value="${guidedState.weight}" />
          <span class="field__hint">How much of your total focus goes here</span>
        </div>
        <div class="help-link">
          <button type="button" class="btn btn--ghost btn--sm switch-to-guided">
            Need help setting a good goal? Try guided mode →
          </button>
        </div>
      </div>
    `;
  }

  function renderGuidedMode(): string {
    return `
      <div class="wizard">
        <!-- Step Indicator -->
        <div class="wizard__steps">
          ${[1, 2, 3, 4].map(step => `
            <div class="wizard__step ${step === currentStep ? 'wizard__step--active' : ''} ${step < currentStep ? 'wizard__step--completed' : ''}">
              <div class="wizard__step-number">${step < currentStep ? '✓' : step}</div>
              <div class="wizard__step-label">${['Define', 'Key Results', 'Weight', 'Review'][step - 1]}</div>
            </div>
          `).join('')}
        </div>

        <!-- Step Content -->
        <div class="wizard__content">
          ${renderGuidedStep()}
        </div>

        <!-- Hidden inputs for form submission -->
        <input type="hidden" name="title" value="${guidedState.title}" />
        <input type="hidden" name="weight" value="${guidedState.weight}" />

        <!-- Step Navigation -->
        <div class="wizard__nav">
          ${currentStep > 1 ? `
            <button type="button" class="btn btn--secondary wizard__prev">← Back</button>
          ` : '<div></div>'}
          ${currentStep < totalSteps ? `
            <button type="button" class="btn btn--primary wizard__next">Next →</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderGuidedStep(): string {
    switch (currentStep) {
      case 1: // Define Objective (SMART - Specific)
        return `
          <div class="wizard-step">
            <h3 class="wizard-step__title">Define your objective</h3>
            <div class="smart-tip">
              <div class="smart-tip__badge">S</div>
              <div class="smart-tip__content">
                <div class="smart-tip__title">${SMART_TIPS.specific.title}</div>
                <div class="smart-tip__examples">
                  ${SMART_TIPS.specific.examples.map(ex => `<div class="smart-tip__example">${ex}</div>`).join('')}
                </div>
              </div>
            </div>
            <div class="field mt-4">
              <label class="field__label" for="guided-title">What do you want to achieve?</label>
              <input
                type="text"
                id="guided-title"
                class="field__input field__input--lg"
                value="${guidedState.title}"
                placeholder="e.g., Double protocol usage through enterprise partnerships"
              />
              <span class="field__hint">Be specific about the outcome, not just the activity</span>
            </div>
          </div>
        `;

      case 2: // Key Results (SMART - Measurable)
        return `
          <div class="wizard-step">
            <h3 class="wizard-step__title">How will you measure success?</h3>
            <div class="smart-tip mb-4">
              <div class="smart-tip__badge">M</div>
              <div class="smart-tip__content">
                <div class="smart-tip__title">${SMART_TIPS.measurable.title}</div>
                <div class="smart-tip__text">Define 2-3 measurable key results with specific targets.</div>
              </div>
            </div>

            <div class="kr-builder" id="kr-builder">
              ${guidedState.keyResults.length === 0 ? `
                <div class="kr-empty">
                  <p class="text-secondary">No key results yet. Add your first one below.</p>
                </div>
              ` : `
                <div class="kr-list">
                  ${guidedState.keyResults.map((kr, i) => `
                    <div class="kr-item" data-index="${i}">
                      <div class="kr-item__content">
                        <span class="kr-item__description">${kr.description}</span>
                        <span class="kr-item__target mono">Target: ${kr.target_value} ${kr.unit}</span>
                      </div>
                      <button type="button" class="btn btn--ghost btn--icon btn--sm kr-remove-btn" data-index="${i}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  `).join('')}
                </div>
              `}

              <div class="kr-form">
                <div class="kr-form__row">
                  <div class="field flex-1">
                    <input
                      type="text"
                      id="new-kr-description"
                      class="field__input"
                      placeholder="e.g., Increase monthly active users"
                    />
                  </div>
                </div>
                <div class="kr-form__row">
                  <div class="field" style="width: 100px;">
                    <input
                      type="number"
                      id="new-kr-target"
                      class="field__input"
                      placeholder="Target"
                      value="100"
                    />
                  </div>
                  <div class="field" style="width: 80px;">
                    <input
                      type="text"
                      id="new-kr-unit"
                      class="field__input"
                      placeholder="unit"
                      value="%"
                    />
                  </div>
                  <button type="button" class="btn btn--secondary btn--sm" id="add-kr-btn">
                    + Add
                  </button>
                </div>
              </div>
            </div>

            <p class="field__hint mt-3">Aim for 2-3 key results per objective. You can always add more later.</p>
          </div>
        `;

      case 3: // Weight (SMART - Achievable & Relevant)
        return `
          <div class="wizard-step">
            <h3 class="wizard-step__title">How much focus should this get?</h3>
            <div class="smart-tips-row">
              <div class="smart-tip smart-tip--compact">
                <div class="smart-tip__badge">A</div>
                <div class="smart-tip__content">
                  <div class="smart-tip__title">${SMART_TIPS.achievable.title}</div>
                  <ul class="smart-tip__questions">
                    ${SMART_TIPS.achievable.questions.map(q => `<li>${q}</li>`).join('')}
                  </ul>
                </div>
              </div>
              <div class="smart-tip smart-tip--compact">
                <div class="smart-tip__badge">R</div>
                <div class="smart-tip__content">
                  <div class="smart-tip__title">${SMART_TIPS.relevant.title}</div>
                  <ul class="smart-tip__questions">
                    ${SMART_TIPS.relevant.questions.map(q => `<li>${q}</li>`).join('')}
                  </ul>
                </div>
              </div>
            </div>
            <div class="field mt-4">
              <label class="field__label" for="guided-weight">Weight (%)</label>
              <div class="weight-slider">
                <input
                  type="range"
                  id="guided-weight-range"
                  min="5"
                  max="60"
                  step="5"
                  value="${guidedState.weight}"
                  class="weight-slider__input"
                />
                <input
                  type="number"
                  id="guided-weight"
                  class="field__input weight-slider__value"
                  min="5"
                  max="100"
                  value="${guidedState.weight}"
                />
              </div>
              <span class="field__hint">Your objectives should total ~100%. Higher weight = more focus and priority.</span>
            </div>
          </div>
        `;

      case 4: // Review
        return `
          <div class="wizard-step">
            <h3 class="wizard-step__title">Review your objective</h3>
            <div class="smart-tip mb-4">
              <div class="smart-tip__badge">T</div>
              <div class="smart-tip__content">
                <div class="smart-tip__title">${SMART_TIPS.timeBound.title}</div>
                <div class="smart-tip__text">${SMART_TIPS.timeBound.tip}</div>
              </div>
            </div>
            <div class="review-card">
              <div class="review-card__title">${guidedState.title || '(No title set)'}</div>
              <div class="review-card__meta">
                <span class="review-card__weight">${guidedState.weight}% weight</span>
                <span class="review-card__quarter">Q${quarterId.match(/q(\d)/)?.[1]} ${quarterId.match(/(\d{4})/)?.[1]}</span>
              </div>
              ${guidedState.keyResults.length > 0 ? `
                <div class="review-card__krs">
                  <div class="review-card__krs-title">Key Results (${guidedState.keyResults.length})</div>
                  ${guidedState.keyResults.map((kr, i) => `
                    <div class="review-card__kr">
                      <span class="badge badge--sm">${i + 1}</span>
                      <span>${kr.description}</span>
                      <span class="mono text-tertiary">→ ${kr.target_value} ${kr.unit}</span>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
            <div class="smart-checklist">
              <div class="smart-checklist__title">SMART Checklist</div>
              <div class="smart-checklist__items">
                <label class="smart-checklist__item">
                  <input type="checkbox" checked disabled />
                  <span><strong>S</strong>pecific - Clear and well-defined</span>
                </label>
                <label class="smart-checklist__item">
                  <input type="checkbox" ${guidedState.keyResults.length > 0 ? 'checked' : ''} disabled />
                  <span><strong>M</strong>easurable - ${guidedState.keyResults.length} key result${guidedState.keyResults.length !== 1 ? 's' : ''} defined</span>
                </label>
                <label class="smart-checklist__item">
                  <input type="checkbox" checked disabled />
                  <span><strong>A</strong>chievable - Challenging but attainable</span>
                </label>
                <label class="smart-checklist__item">
                  <input type="checkbox" checked disabled />
                  <span><strong>R</strong>elevant - Aligns with your priorities</span>
                </label>
                <label class="smart-checklist__item">
                  <input type="checkbox" checked disabled />
                  <span><strong>T</strong>ime-bound - Due end of quarter</span>
                </label>
              </div>
            </div>
          </div>
        `;

      default:
        return '';
    }
  }

  function updateModal(): void {
    const contentEl = document.querySelector('.modal__body');
    if (contentEl) {
      contentEl.innerHTML = renderModalContent();
      bindModalEvents();

      // Update submit button visibility
      const submitBtn = document.querySelector('.modal__footer .btn--primary') as HTMLButtonElement;
      if (submitBtn) {
        if (currentMode === 'guided' && currentStep < totalSteps) {
          submitBtn.style.display = 'none';
        } else {
          submitBtn.style.display = '';
        }
      }
    }
  }

  function bindModalEvents(): void {
    // Mode switching
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const mode = (e.currentTarget as HTMLElement).dataset.mode as 'simple' | 'guided';
        if (mode !== currentMode) {
          currentMode = mode;
          currentStep = 1;
          updateModal();
        }
      });
    });

    // Switch to guided from simple mode
    document.querySelector('.switch-to-guided')?.addEventListener('click', () => {
      currentMode = 'guided';
      currentStep = 1;
      updateModal();
    });

    // Guided mode navigation
    document.querySelector('.wizard__prev')?.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateModal();
      }
    });

    document.querySelector('.wizard__next')?.addEventListener('click', () => {
      // Save current step data before proceeding
      saveStepData();
      if (currentStep < totalSteps) {
        currentStep++;
        updateModal();
      }
    });

    // Title input in guided mode
    const titleInput = document.getElementById('guided-title') as HTMLInputElement;
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        guidedState.title = (e.target as HTMLInputElement).value;
        // Update hidden input
        const hiddenTitle = document.querySelector('input[name="title"]') as HTMLInputElement;
        if (hiddenTitle) hiddenTitle.value = guidedState.title;
      });
    }

    // Weight slider sync
    const weightRange = document.getElementById('guided-weight-range') as HTMLInputElement;
    const weightNumber = document.getElementById('guided-weight') as HTMLInputElement;
    if (weightRange && weightNumber) {
      weightRange.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        weightNumber.value = value;
        guidedState.weight = parseInt(value);
        const hiddenWeight = document.querySelector('input[name="weight"]') as HTMLInputElement;
        if (hiddenWeight) hiddenWeight.value = value;
      });
      weightNumber.addEventListener('input', (e) => {
        const value = (e.target as HTMLInputElement).value;
        weightRange.value = value;
        guidedState.weight = parseInt(value);
        const hiddenWeight = document.querySelector('input[name="weight"]') as HTMLInputElement;
        if (hiddenWeight) hiddenWeight.value = value;
      });
    }

    // Key Results builder
    const addKrBtn = document.getElementById('add-kr-btn');
    if (addKrBtn) {
      addKrBtn.addEventListener('click', () => {
        const descInput = document.getElementById('new-kr-description') as HTMLInputElement;
        const targetInput = document.getElementById('new-kr-target') as HTMLInputElement;
        const unitInput = document.getElementById('new-kr-unit') as HTMLInputElement;

        const description = descInput?.value.trim();
        const target_value = parseFloat(targetInput?.value) || 100;
        const unit = unitInput?.value.trim() || '%';

        if (description) {
          guidedState.keyResults.push({ description, target_value, unit });
          updateModal();
        }
      });
    }

    // Remove key result buttons
    document.querySelectorAll('.kr-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.currentTarget as HTMLElement).dataset.index || '0');
        guidedState.keyResults.splice(index, 1);
        updateModal();
      });
    });

    // Simple mode inputs - sync to guidedState
    const simpleTitleInput = document.getElementById('obj-title') as HTMLInputElement;
    const simpleWeightInput = document.getElementById('obj-weight') as HTMLInputElement;

    if (simpleTitleInput) {
      simpleTitleInput.addEventListener('input', (e) => {
        guidedState.title = (e.target as HTMLInputElement).value;
      });
    }
    if (simpleWeightInput) {
      simpleWeightInput.addEventListener('input', (e) => {
        guidedState.weight = parseInt((e.target as HTMLInputElement).value) || 25;
      });
    }
  }

  function saveStepData(): void {
    // Save data from current step inputs
    if (currentStep === 1) {
      const titleInput = document.getElementById('guided-title') as HTMLInputElement;
      if (titleInput) guidedState.title = titleInput.value;
    }
    // Step 2 (Key Results) - data is already saved via add button
    if (currentStep === 3) {
      const weightInput = document.getElementById('guided-weight') as HTMLInputElement;
      if (weightInput) guidedState.weight = parseInt(weightInput.value) || 25;
    }

    // Update hidden inputs
    const hiddenTitle = document.querySelector('input[name="title"]') as HTMLInputElement;
    const hiddenWeight = document.querySelector('input[name="weight"]') as HTMLInputElement;

    if (hiddenTitle) hiddenTitle.value = guidedState.title;
    if (hiddenWeight) hiddenWeight.value = guidedState.weight.toString();
  }

  modal.show({
    title: 'Add Objective',
    content: renderModalContent(),
    submitLabel: 'Create Objective',
    onSubmit: (formData) => {
      const title = formData.get('title') as string || guidedState.title;
      const weight = parseInt(formData.get('weight') as string) || guidedState.weight;

      if (!title.trim()) {
        alert('Please enter an objective title');
        return;
      }

      // Save the objective and get its ID
      const newObjective = saveObjective({ title, category: '', weight, quarter_id: quarterId });

      // Save any key results from guided mode
      if (guidedState.keyResults.length > 0) {
        guidedState.keyResults.forEach(kr => {
          saveKeyResult({
            description: kr.description,
            current_value: 0,
            target_value: kr.target_value,
            unit: kr.unit,
            objective_id: newObjective.id,
          });
        });
      }

      onSave();
    },
  });

  // Bind events after modal is shown
  setTimeout(bindModalEvents, 0);
}

function showSimpleObjectiveModal(objective: StoredObjective, quarterId: string, onSave: () => void): void {
  modal.show({
    title: 'Edit Objective',
    content: `
      <div class="flex flex-col gap-4">
        <div class="field">
          <label class="field__label" for="obj-title">Title</label>
          <input type="text" id="obj-title" name="title" class="field__input" value="${objective.title}" placeholder="What do you want to achieve?" required />
        </div>
        <div class="field">
          <label class="field__label" for="obj-weight">Weight (%)</label>
          <input type="number" id="obj-weight" name="weight" class="field__input" min="0" max="100" value="${objective.weight}" />
          <span class="field__hint">How much of your total focus goes here</span>
        </div>
      </div>
    `,
    submitLabel: 'Save Changes',
    onSubmit: (formData) => {
      const title = formData.get('title') as string;
      const weight = parseInt(formData.get('weight') as string) || 0;

      updateObjective(objective.id, { title, weight });
      onSave();
    },
  });
}

function showKeyResultModal(keyResult: StoredKeyResult | null, objectiveId: string, onSave: () => void): void {
  const isEdit = keyResult !== null;

  modal.show({
    title: isEdit ? 'Edit Key Result' : 'Add Key Result',
    content: `
      <div class="flex flex-col gap-4">
        <div class="field">
          <label class="field__label" for="kr-description">Description</label>
          <input type="text" id="kr-description" name="description" class="field__input" value="${keyResult?.description || ''}" placeholder="How will you measure progress?" required />
        </div>
        <div class="grid gap-4" style="grid-template-columns: 1fr 1fr;">
          <div class="field">
            <label class="field__label" for="kr-current">Current Value</label>
            <input type="number" id="kr-current" name="current_value" class="field__input" value="${keyResult?.current_value || 0}" step="any" />
          </div>
          <div class="field">
            <label class="field__label" for="kr-target">Target Value</label>
            <input type="number" id="kr-target" name="target_value" class="field__input" value="${keyResult?.target_value || 100}" step="any" required />
          </div>
        </div>
        <div class="field">
          <label class="field__label" for="kr-unit">Unit</label>
          <input type="text" id="kr-unit" name="unit" class="field__input" value="${keyResult?.unit || ''}" placeholder="%, users, $k, etc." />
        </div>
      </div>
    `,
    submitLabel: isEdit ? 'Save Changes' : 'Add Key Result',
    onSubmit: (formData) => {
      const description = formData.get('description') as string;
      const current_value = parseFloat(formData.get('current_value') as string) || 0;
      const target_value = parseFloat(formData.get('target_value') as string) || 100;
      const unit = formData.get('unit') as string;

      if (isEdit && keyResult) {
        updateKeyResult(keyResult.id, { description, current_value, target_value, unit });
      } else {
        saveKeyResult({ description, current_value, target_value, unit, objective_id: objectiveId });
      }
      onSave();
    },
  });
}
