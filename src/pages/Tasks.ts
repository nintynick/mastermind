// ============================================
// Tasks Page - Weekly Task Management
// ============================================

import { getCurrentQuarter, formatDate, getWeekDates } from '../lib/utils';
import { modal, confirm } from '../components/layout/Modal';
import {
  getTasks,
  saveTask,
  updateTask,
  deleteTask,
  getObjectives,
  getKeyResults,
  getCurrentWeekNumber,
  setCurrentWeekNumber,
  getWeeklyReflection,
  saveWeeklyReflection,
} from '../lib/storage';
import type { StoredTask, StoredObjective } from '../lib/storage';
import type { TaskStatus } from '../types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; icon: string }> = {
  planned: { label: 'Planned', color: 'info', icon: '○' },
  in_progress: { label: 'In Progress', color: 'accent', icon: '◐' },
  completed: { label: 'Completed', color: 'success', icon: '✓' },
  completed_plus: { label: 'Completed+', color: 'success', icon: '✓✓' },
  postponed: { label: 'Postponed', color: 'muted', icon: '→' },
  try_again: { label: 'Try Again', color: 'accent', icon: '↻' },
  deprecated: { label: 'Deprecated', color: 'muted', icon: '✕' },
};

let currentWeek = getCurrentWeekNumber();
let currentContainer: Element | null = null;

export function renderTasks(container: Element): void {
  currentContainer = container;
  const { year, quarter } = getCurrentQuarter();
  const quarterId = `q${quarter}-${year}`;

  // Get tasks for current week
  const tasks = getTasks(currentWeek, quarterId);
  const objectives = getObjectives(quarterId);

  // Calculate week dates
  const quarterStart = new Date(year, (quarter - 1) * 3, 1);
  const weekStart = new Date(quarterStart);
  weekStart.setDate(quarterStart.getDate() + (currentWeek - 1) * 7);
  const weekDates = getWeekDates(weekStart);

  // Get reflection
  const reflection = getWeeklyReflection(currentWeek, quarterId);

  // Calculate stats
  const completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'completed_plus').length;
  const totalTasks = tasks.length;

  container.innerHTML = `
    <div class="container stagger">
      <div class="page-header">
        <h1 class="page-header__title">Weekly Tasks</h1>
        <p class="page-header__subtitle">Q${quarter} ${year} · Week ${currentWeek}</p>
      </div>

      <!-- Week Navigator -->
      <div class="week-nav">
        <button class="week-nav__btn" id="prev-week-btn" ${currentWeek <= 1 ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div class="flex-1 text-center">
          <div class="week-nav__current">Week ${currentWeek}</div>
          <div class="week-nav__label">
            ${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}
          </div>
        </div>
        <button class="week-nav__btn" id="next-week-btn" ${currentWeek >= 13 ? 'disabled' : ''}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <!-- Progress Summary -->
      <section class="section">
        <div class="card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="text-2xl font-semibold">${completedCount}/${totalTasks}</span>
              <span class="text-secondary ml-2">tasks completed</span>
            </div>
            <div class="flex gap-2">
              ${Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = tasks.filter(t => t.status === status).length;
                if (count === 0) return '';
                return `
                  <span class="badge badge--${config.color}" title="${config.label}">
                    ${config.icon} ${count}
                  </span>
                `;
              }).join('')}
            </div>
          </div>
          <div class="progress-bar" style="height: 8px;">
            <div
              class="progress-bar__fill progress-bar__fill--success"
              style="width: ${totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0}%;"
            ></div>
          </div>
        </div>
      </section>

      <!-- Add Task -->
      <section class="section">
        <div class="card">
          <form id="add-task-form" class="flex gap-3">
            <input
              type="text"
              placeholder="Add a new task..."
              class="field__input flex-1"
              id="new-task-input"
              required
            />
            <select class="field__input" style="width: 160px;" id="task-okr-select">
              <option value="">No OKR link</option>
              ${objectives.map(obj => `
                <option value="${obj.id}">${obj.title.slice(0, 30)}${obj.title.length > 30 ? '...' : ''}</option>
              `).join('')}
            </select>
            <button type="submit" class="btn btn--primary">Add</button>
          </form>
        </div>
      </section>

      <!-- Tasks List -->
      <section class="section">
        <div class="section__header">
          <h2 class="section__title">Tasks</h2>
          <div class="flex gap-2">
            <button class="btn btn--ghost btn--sm active" data-filter="all">All</button>
            <button class="btn btn--ghost btn--sm" data-filter="planned">Planned</button>
            <button class="btn btn--ghost btn--sm" data-filter="completed">Done</button>
          </div>
        </div>

        <div class="task-list" id="task-list">
          ${tasks.length > 0
            ? tasks.map(task => renderTaskItem(task, objectives)).join('')
            : '<p class="text-center text-secondary py-8">No tasks for this week. Add one above!</p>'
          }
        </div>
      </section>

      <!-- Weekly Reflection -->
      <section class="section mt-8">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">Weekly Reflection</h3>
          <textarea
            class="field__input w-full"
            rows="4"
            placeholder="What went well? What could be improved? Notes for next week..."
            id="weekly-reflection"
          >${reflection}</textarea>
          <div class="flex justify-end mt-3">
            <button class="btn btn--secondary btn--sm" id="save-reflection-btn">Save Notes</button>
          </div>
        </div>
      </section>
    </div>
  `;

  bindEvents(container, quarterId, objectives);
}

function bindEvents(container: Element, quarterId: string, objectives: StoredObjective[]): void {
  // Week navigation
  const prevBtn = container.querySelector('#prev-week-btn');
  const nextBtn = container.querySelector('#next-week-btn');

  prevBtn?.addEventListener('click', () => {
    if (currentWeek > 1) {
      currentWeek--;
      setCurrentWeekNumber(currentWeek);
      renderTasks(container);
    }
  });

  nextBtn?.addEventListener('click', () => {
    if (currentWeek < 13) {
      currentWeek++;
      setCurrentWeekNumber(currentWeek);
      renderTasks(container);
    }
  });

  // Add task form
  const form = container.querySelector('#add-task-form') as HTMLFormElement;
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = container.querySelector('#new-task-input') as HTMLInputElement;
    const okrSelect = container.querySelector('#task-okr-select') as HTMLSelectElement;

    if (input.value.trim()) {
      saveTask({
        week_number: currentWeek,
        quarter_id: quarterId,
        description: input.value.trim(),
        status: 'planned',
        objective_id: okrSelect.value || undefined,
      });

      input.value = '';
      okrSelect.value = '';
      renderTasks(container);
    }
  });

  // Filter buttons
  container.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = (e.target as Element).getAttribute('data-filter');
      container.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
      (e.target as Element).classList.add('active');

      const taskItems = container.querySelectorAll('.task-item');
      taskItems.forEach(task => {
        const status = task.getAttribute('data-status') as TaskStatus;
        if (filter === 'all') {
          (task as HTMLElement).style.display = '';
        } else if (filter === 'completed') {
          (task as HTMLElement).style.display = (status === 'completed' || status === 'completed_plus') ? '' : 'none';
        } else if (filter === 'planned') {
          (task as HTMLElement).style.display = status === 'planned' ? '' : 'none';
        }
      });
    });
  });

  // Task checkbox toggle
  container.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    if (target.classList.contains('checkbox__input')) {
      const taskItem = target.closest('.task-item');
      const taskId = taskItem?.getAttribute('data-id');
      if (taskId) {
        const newStatus: TaskStatus = target.checked ? 'completed' : 'planned';
        updateTask(taskId, { status: newStatus });
        taskItem?.classList.toggle('task-item--completed', target.checked);
        taskItem?.setAttribute('data-status', newStatus);
        // Update status badge
        const statusBadge = taskItem?.querySelector('.status-dropdown__trigger');
        if (statusBadge) {
          const config = STATUS_CONFIG[newStatus];
          statusBadge.className = `status-dropdown__trigger status status--${config.color === 'muted' ? 'postponed' : config.color}`;
          statusBadge.innerHTML = `<span class="status__dot"></span>${config.label}`;
        }
      }
    }
  });

  // Status dropdown and actions
  container.addEventListener('click', async (e) => {
    const target = e.target as Element;

    // Status dropdown trigger
    if (target.closest('.status-dropdown__trigger')) {
      const dropdown = target.closest('.status-dropdown');
      // Close other dropdowns
      container.querySelectorAll('.status-dropdown.open').forEach(d => {
        if (d !== dropdown) d.classList.remove('open');
      });
      dropdown?.classList.toggle('open');
      e.stopPropagation();
      return;
    }

    // Status option click
    if (target.closest('.status-option')) {
      const option = target.closest('.status-option') as HTMLElement;
      const newStatus = option.getAttribute('data-status') as TaskStatus;
      const taskItem = option.closest('.task-item');
      const taskId = taskItem?.getAttribute('data-id');

      if (taskId && newStatus) {
        updateTask(taskId, { status: newStatus });
        renderTasks(container);
      }
      return;
    }

    // Delete button
    if (target.closest('.task-delete-btn')) {
      const taskItem = target.closest('.task-item');
      const taskId = taskItem?.getAttribute('data-id');
      if (taskId) {
        const confirmed = await confirm('Delete this task?', 'Delete Task');
        if (confirmed) {
          deleteTask(taskId);
          renderTasks(container);
        }
      }
      return;
    }

    // Edit button
    if (target.closest('.task-edit-btn')) {
      const taskItem = target.closest('.task-item');
      const taskId = taskItem?.getAttribute('data-id');
      if (taskId) {
        const tasks = getTasks(currentWeek, quarterId);
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          showEditTaskModal(task, objectives, quarterId);
        }
      }
      return;
    }

    // Close dropdowns when clicking outside
    container.querySelectorAll('.status-dropdown.open').forEach(d => {
      d.classList.remove('open');
    });
  });

  // Save reflection
  const saveReflectionBtn = container.querySelector('#save-reflection-btn');
  saveReflectionBtn?.addEventListener('click', () => {
    const textarea = container.querySelector('#weekly-reflection') as HTMLTextAreaElement;
    saveWeeklyReflection(currentWeek, quarterId, textarea.value);
    // Visual feedback
    saveReflectionBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveReflectionBtn.textContent = 'Save Notes';
    }, 1500);
  });
}

function showEditTaskModal(task: StoredTask, objectives: StoredObjective[], quarterId: string): void {
  modal.show({
    title: 'Edit Task',
    content: `
      <div class="field mb-4">
        <label class="field__label">Description</label>
        <input type="text" name="description" class="field__input" value="${task.description}" required />
      </div>
      <div class="field mb-4">
        <label class="field__label">Status</label>
        <select name="status" class="field__input">
          ${Object.entries(STATUS_CONFIG).map(([status, config]) => `
            <option value="${status}" ${task.status === status ? 'selected' : ''}>${config.label}</option>
          `).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field__label">Link to Objective</label>
        <select name="objective_id" class="field__input">
          <option value="">No OKR link</option>
          ${objectives.map(obj => `
            <option value="${obj.id}" ${task.objective_id === obj.id ? 'selected' : ''}>${obj.title}</option>
          `).join('')}
        </select>
      </div>
    `,
    submitLabel: 'Save',
    onSubmit: (formData) => {
      updateTask(task.id, {
        description: formData.get('description') as string,
        status: formData.get('status') as TaskStatus,
        objective_id: formData.get('objective_id') as string || undefined,
      });
      if (currentContainer) {
        renderTasks(currentContainer);
      }
    },
  });
}

function renderTaskItem(task: StoredTask, objectives: StoredObjective[]): string {
  const config = STATUS_CONFIG[task.status];
  const isCompleted = task.status === 'completed' || task.status === 'completed_plus';
  const objective = objectives.find(o => o.id === task.objective_id);

  return `
    <div class="task-item ${isCompleted ? 'task-item--completed' : ''}" data-id="${task.id}" data-status="${task.status}">
      <label class="checkbox">
        <input
          type="checkbox"
          class="checkbox__input"
          ${isCompleted ? 'checked' : ''}
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
          ${objective ? `<span class="task-item__okr-link">${objective.title.slice(0, 20)}${objective.title.length > 20 ? '...' : ''}</span>` : ''}
          <div class="status-dropdown relative">
            <button class="status-dropdown__trigger status status--${config.color === 'muted' ? 'postponed' : config.color}">
              <span class="status__dot"></span>
              ${config.label}
            </button>
            <div class="status-dropdown__menu">
              ${Object.entries(STATUS_CONFIG).map(([status, cfg]) => `
                <button class="status-option ${task.status === status ? 'active' : ''}" data-status="${status}">
                  <span class="status-option__icon">${cfg.icon}</span>
                  ${cfg.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="task-item__actions">
        <button class="btn btn--ghost btn--icon opacity-50 hover-scale task-edit-btn" title="Edit">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn--ghost btn--icon opacity-50 hover-scale task-delete-btn" title="Delete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}
