// ============================================
// LocalStorage Persistence Layer
// ============================================

import type { Objective, KeyResult, Task, Habit, HabitEntry, TaskStatus } from '../types';
import { generateId, getCurrentQuarter } from './utils';

// Helper to get current quarter ID string (e.g., 'q1-2026')
function getCurrentQuarterId(): string {
  const { year, quarter } = getCurrentQuarter();
  return `q${quarter}-${year}`;
}

// Storage keys
const KEYS = {
  OBJECTIVES: 'mastermind_objectives',
  KEY_RESULTS: 'mastermind_key_results',
  TASKS: 'mastermind_tasks',
  HABITS: 'mastermind_habits',
  HABIT_ENTRIES: 'mastermind_habit_entries',
  VISION: 'mastermind_vision',
  SETTINGS: 'mastermind_settings',
  CURRENT_WEEK: 'mastermind_current_week',
  MEMBERS: 'mastermind_members',
  CURRENT_MEMBER: 'mastermind_current_member',
};

// ============================================
// Members
// ============================================

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
}

const DEFAULT_MEMBERS: Member[] = [
  { id: 'member-1', name: 'You', initials: 'ME', color: '#f59e0b' },
  { id: 'member-2', name: 'Alex', initials: 'AK', color: '#3b82f6' },
  { id: 'member-3', name: 'Jordan', initials: 'JM', color: '#22c55e' },
  { id: 'member-4', name: 'Sam', initials: 'SW', color: '#a855f7' },
];

export function getMembers(): Member[] {
  return get<Member[]>(KEYS.MEMBERS, DEFAULT_MEMBERS);
}

export function saveMember(member: Omit<Member, 'id'>): Member {
  const members = getMembers();
  const newMember: Member = {
    ...member,
    id: generateId(),
  };
  set(KEYS.MEMBERS, [...members, newMember]);
  return newMember;
}

export function getCurrentMember(): Member {
  const members = getMembers();
  const currentId = get<string>(KEYS.CURRENT_MEMBER, members[0]?.id || 'member-1');
  return members.find(m => m.id === currentId) || members[0];
}

export function setCurrentMember(memberId: string): void {
  set(KEYS.CURRENT_MEMBER, memberId);
}

// Helper to get member-specific storage key
function getMemberKey(baseKey: string, memberId?: string): string {
  const member = memberId || getCurrentMember().id;
  return `${baseKey}_${member}`;
}

// ============================================
// Generic helpers
// ============================================

function get<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function set<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Storage error:', error);
  }
}

// ============================================
// Objectives
// ============================================

export interface StoredObjective extends Omit<Objective, 'key_results'> {
  id: string;
  quarter_id: string;
  title: string;
  weight: number;
  category: string;
  order_index: number;
}

function getDefaultObjectives(): StoredObjective[] {
  const qid = getCurrentQuarterId();
  return [
    { id: 'obj-1', quarter_id: qid, title: 'Double protocol usage', weight: 40, category: 'Growth', order_index: 0 },
    { id: 'obj-2', quarter_id: qid, title: 'Ship key integrations', weight: 35, category: 'Technology', order_index: 1 },
    { id: 'obj-3', quarter_id: qid, title: 'Feel stability, health, peace', weight: 25, category: 'Health', order_index: 2 },
  ];
}

const DEFAULT_KEY_RESULTS: StoredKeyResult[] = [
  { id: 'kr-1-1', objective_id: 'obj-1', description: 'Real Mainnet Orgs', current_value: 61, target_value: 86, unit: 'orgs', order_index: 0 },
  { id: 'kr-1-2', objective_id: 'obj-1', description: 'Workshops booked', current_value: 7, target_value: 12, unit: 'workshops', order_index: 1 },
  { id: 'kr-1-3', objective_id: 'obj-1', description: 'Revenue', current_value: 133, target_value: 300, unit: '$k', order_index: 2 },
  { id: 'kr-2-1', objective_id: 'obj-2', description: 'Farcaster integration', current_value: 70, target_value: 100, unit: '%', order_index: 0 },
  { id: 'kr-2-2', objective_id: 'obj-2', description: 'Safe/HSGv2 integration', current_value: 50, target_value: 100, unit: '%', order_index: 1 },
  { id: 'kr-3-1', objective_id: 'obj-3', description: 'Meditation streak', current_value: 21, target_value: 30, unit: 'days', order_index: 0 },
  { id: 'kr-3-2', objective_id: 'obj-3', description: 'Exercise 3x/week', current_value: 9, target_value: 12, unit: 'weeks', order_index: 1 },
];

export function getObjectives(quarterId?: string, memberId?: string): StoredObjective[] {
  const key = memberId ? getMemberKey(KEYS.OBJECTIVES, memberId) : KEYS.OBJECTIVES;
  const objectives = get<StoredObjective[]>(key, memberId ? [] : getDefaultObjectives());
  if (quarterId) {
    return objectives.filter(o => o.quarter_id === quarterId);
  }
  return objectives;
}

export function saveObjective(objective: Omit<StoredObjective, 'id' | 'order_index'>): StoredObjective {
  const objectives = getObjectives();
  const newObjective: StoredObjective = {
    ...objective,
    id: generateId(),
    order_index: objectives.length,
  };
  set(KEYS.OBJECTIVES, [...objectives, newObjective]);
  return newObjective;
}

export function updateObjective(id: string, updates: Partial<StoredObjective>): void {
  const objectives = getObjectives();
  const index = objectives.findIndex(o => o.id === id);
  if (index !== -1) {
    objectives[index] = { ...objectives[index], ...updates };
    set(KEYS.OBJECTIVES, objectives);
  }
}

export function deleteObjective(id: string): void {
  const objectives = getObjectives().filter(o => o.id !== id);
  set(KEYS.OBJECTIVES, objectives);
  // Also delete associated key results
  const keyResults = getKeyResults().filter(kr => kr.objective_id !== id);
  set(KEYS.KEY_RESULTS, keyResults);
}

// ============================================
// Key Results
// ============================================

export interface StoredKeyResult {
  id: string;
  objective_id: string;
  description: string;
  current_value: number;
  target_value: number;
  unit: string;
  order_index: number;
}

export function getKeyResults(objectiveId?: string, memberId?: string): StoredKeyResult[] {
  const key = memberId ? getMemberKey(KEYS.KEY_RESULTS, memberId) : KEYS.KEY_RESULTS;
  const keyResults = get<StoredKeyResult[]>(key, memberId ? [] : DEFAULT_KEY_RESULTS);
  if (objectiveId) {
    return keyResults.filter(kr => kr.objective_id === objectiveId);
  }
  return keyResults;
}

export function saveKeyResult(keyResult: Omit<StoredKeyResult, 'id' | 'order_index'>): StoredKeyResult {
  const keyResults = getKeyResults();
  const objectiveKRs = keyResults.filter(kr => kr.objective_id === keyResult.objective_id);
  const newKeyResult: StoredKeyResult = {
    ...keyResult,
    id: generateId(),
    order_index: objectiveKRs.length,
  };
  set(KEYS.KEY_RESULTS, [...keyResults, newKeyResult]);
  return newKeyResult;
}

export function updateKeyResult(id: string, updates: Partial<StoredKeyResult>): void {
  const keyResults = getKeyResults();
  const index = keyResults.findIndex(kr => kr.id === id);
  if (index !== -1) {
    keyResults[index] = { ...keyResults[index], ...updates };
    set(KEYS.KEY_RESULTS, keyResults);
  }
}

export function deleteKeyResult(id: string): void {
  const keyResults = getKeyResults().filter(kr => kr.id !== id);
  set(KEYS.KEY_RESULTS, keyResults);
}

// ============================================
// Tasks
// ============================================

export interface StoredTask {
  id: string;
  week_number: number;
  quarter_id: string;
  description: string;
  status: TaskStatus;
  objective_id?: string;
  created_at: string;
}

function getDefaultTasks(): StoredTask[] {
  const qid = getCurrentQuarterId();
  return [
    { id: 'task-1', week_number: 2, quarter_id: qid, description: 'Review quarterly progress with team', status: 'completed', objective_id: 'obj-1', created_at: new Date().toISOString() },
    { id: 'task-2', week_number: 2, quarter_id: qid, description: 'Prepare workshop materials', status: 'planned', objective_id: 'obj-1', created_at: new Date().toISOString() },
    { id: 'task-3', week_number: 2, quarter_id: qid, description: 'Code review for integration PR', status: 'planned', objective_id: 'obj-2', created_at: new Date().toISOString() },
    { id: 'task-4', week_number: 2, quarter_id: qid, description: 'Schedule mid-quarter check-in', status: 'planned', created_at: new Date().toISOString() },
  ];
}

export function getTasks(weekNumber?: number, quarterId?: string, memberId?: string): StoredTask[] {
  const key = memberId ? getMemberKey(KEYS.TASKS, memberId) : KEYS.TASKS;
  const tasks = get<StoredTask[]>(key, memberId ? [] : getDefaultTasks());
  return tasks.filter(t => {
    if (weekNumber !== undefined && t.week_number !== weekNumber) return false;
    if (quarterId && t.quarter_id !== quarterId) return false;
    return true;
  });
}

export function saveTask(task: Omit<StoredTask, 'id' | 'created_at'>): StoredTask {
  const tasks = get<StoredTask[]>(KEYS.TASKS, getDefaultTasks());
  const newTask: StoredTask = {
    ...task,
    id: generateId(),
    created_at: new Date().toISOString(),
  };
  set(KEYS.TASKS, [...tasks, newTask]);
  return newTask;
}

export function updateTask(id: string, updates: Partial<StoredTask>): void {
  const tasks = get<StoredTask[]>(KEYS.TASKS, getDefaultTasks());
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    set(KEYS.TASKS, tasks);
  }
}

export function deleteTask(id: string): void {
  const tasks = get<StoredTask[]>(KEYS.TASKS, getDefaultTasks()).filter(t => t.id !== id);
  set(KEYS.TASKS, tasks);
}

// ============================================
// Habits
// ============================================

export interface StoredHabit {
  id: string;
  name: string;
  emoji: string;
  is_active: boolean;
  order_index: number;
}

const DEFAULT_HABITS: StoredHabit[] = [
  { id: 'habit-1', name: 'Reflection', emoji: '📝', is_active: true, order_index: 0 },
  { id: 'habit-2', name: 'Meditation', emoji: '🧘', is_active: true, order_index: 1 },
  { id: 'habit-3', name: 'Exercise', emoji: '💪', is_active: true, order_index: 2 },
  { id: 'habit-4', name: 'Sleep 7h+', emoji: '😴', is_active: true, order_index: 3 },
  { id: 'habit-5', name: 'Gratitude', emoji: '🙏', is_active: true, order_index: 4 },
  { id: 'habit-6', name: 'No alcohol', emoji: '🚫', is_active: true, order_index: 5 },
];

export function getHabits(memberId?: string): StoredHabit[] {
  const key = memberId ? getMemberKey(KEYS.HABITS, memberId) : KEYS.HABITS;
  return get<StoredHabit[]>(key, memberId ? [] : DEFAULT_HABITS).filter(h => h.is_active);
}

export function saveHabit(habit: Omit<StoredHabit, 'id' | 'order_index' | 'is_active'>): StoredHabit {
  const habits = get<StoredHabit[]>(KEYS.HABITS, DEFAULT_HABITS);
  const newHabit: StoredHabit = {
    ...habit,
    id: generateId(),
    is_active: true,
    order_index: habits.length,
  };
  set(KEYS.HABITS, [...habits, newHabit]);
  return newHabit;
}

export function updateHabit(id: string, updates: Partial<StoredHabit>): void {
  const habits = get<StoredHabit[]>(KEYS.HABITS, DEFAULT_HABITS);
  const index = habits.findIndex(h => h.id === id);
  if (index !== -1) {
    habits[index] = { ...habits[index], ...updates };
    set(KEYS.HABITS, habits);
  }
}

export function deleteHabit(id: string): void {
  // Soft delete
  updateHabit(id, { is_active: false });
}

// ============================================
// Habit Entries
// ============================================

export interface StoredHabitEntry {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export function getHabitEntries(startDate?: string, endDate?: string, memberId?: string): StoredHabitEntry[] {
  const key = memberId ? getMemberKey(KEYS.HABIT_ENTRIES, memberId) : KEYS.HABIT_ENTRIES;
  const entries = get<StoredHabitEntry[]>(key, []);
  return entries.filter(e => {
    if (startDate && e.date < startDate) return false;
    if (endDate && e.date > endDate) return false;
    return true;
  });
}

export function getHabitEntriesForHabit(habitId: string): StoredHabitEntry[] {
  const entries = get<StoredHabitEntry[]>(KEYS.HABIT_ENTRIES, []);
  return entries.filter(e => e.habit_id === habitId);
}

export function toggleHabitEntry(habitId: string, date: string): StoredHabitEntry {
  const entries = get<StoredHabitEntry[]>(KEYS.HABIT_ENTRIES, []);
  const existingIndex = entries.findIndex(e => e.habit_id === habitId && e.date === date);

  if (existingIndex !== -1) {
    entries[existingIndex].completed = !entries[existingIndex].completed;
    set(KEYS.HABIT_ENTRIES, entries);
    return entries[existingIndex];
  } else {
    const newEntry: StoredHabitEntry = {
      id: generateId(),
      habit_id: habitId,
      date,
      completed: true,
    };
    set(KEYS.HABIT_ENTRIES, [...entries, newEntry]);
    return newEntry;
  }
}

// ============================================
// Vision/Mission/Values
// ============================================

export interface StoredVision {
  vision: string;
  mission: string;
  values: string;
  doing: string[];
  being: string[];
}

const DEFAULT_VISION: StoredVision = {
  vision: 'Help humanity transition to a post-scarcity economy by creating sovereignty-respecting coordination mechanisms.',
  mission: 'Establish Hats Protocol as the go-to infrastructure for roles in web3 and beyond.',
  values: 'Craft, Ownership, Being a Creator not Consumer. Health, Wealth, Freedom. Integrity, Gratitude, Presence, Wholeness, Graceful Execution.',
  doing: ['Build products that matter', 'Create financial abundance', 'Contribute to community'],
  being: ['Present and grounded', 'Grateful and generous', 'Integrated and whole'],
};

export function getVision(memberId?: string): StoredVision {
  const key = memberId ? getMemberKey(KEYS.VISION, memberId) : KEYS.VISION;
  return get<StoredVision>(key, memberId ? { vision: '', mission: '', values: '', doing: [], being: [] } : DEFAULT_VISION);
}

export function saveVision(vision: Partial<StoredVision>): void {
  const current = getVision();
  set(KEYS.VISION, { ...current, ...vision });
}

// ============================================
// Settings
// ============================================

export interface StoredSettings {
  theme: 'dark' | 'light';
  compactMode: boolean;
  notifications: {
    meetingReminders: boolean;
    dailyHabitReminder: boolean;
    weeklySummary: boolean;
  };
}

const DEFAULT_SETTINGS: StoredSettings = {
  theme: 'dark',
  compactMode: false,
  notifications: {
    meetingReminders: true,
    dailyHabitReminder: true,
    weeklySummary: false,
  },
};

export function getSettings(): StoredSettings {
  return get<StoredSettings>(KEYS.SETTINGS, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Partial<StoredSettings>): void {
  const current = getSettings();
  set(KEYS.SETTINGS, { ...current, ...settings });
}

// ============================================
// Week Navigation
// ============================================

export function getCurrentWeekNumber(): number {
  const { year, quarter } = getCurrentQuarter();
  const stored = get<{ weekNumber: number; quarter: number; year: number }>(KEYS.CURRENT_WEEK, {
    weekNumber: 2,
    quarter,
    year,
  });
  return stored.weekNumber;
}

export function setCurrentWeekNumber(weekNumber: number): void {
  const { year, quarter } = getCurrentQuarter();
  set(KEYS.CURRENT_WEEK, { weekNumber, quarter, year });
}

// ============================================
// Weekly Reflection
// ============================================

export function getWeeklyReflection(weekNumber: number, quarterId: string): string {
  const key = `mastermind_reflection_${quarterId}_${weekNumber}`;
  return get<string>(key, '');
}

export function saveWeeklyReflection(weekNumber: number, quarterId: string, notes: string): void {
  const key = `mastermind_reflection_${quarterId}_${weekNumber}`;
  set(key, notes);
}

// ============================================
// Export Data
// ============================================

export function exportAllData(): object {
  return {
    objectives: getObjectives(),
    keyResults: getKeyResults(),
    tasks: get<StoredTask[]>(KEYS.TASKS, []),
    habits: get<StoredHabit[]>(KEYS.HABITS, []),
    habitEntries: get<StoredHabitEntry[]>(KEYS.HABIT_ENTRIES, []),
    vision: getVision(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
  };
}

export function downloadJSON(): void {
  const data = exportAllData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mastermind-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadCSV(): void {
  const tasks = get<StoredTask[]>(KEYS.TASKS, []);
  const headers = ['ID', 'Week', 'Description', 'Status', 'Created'];
  const rows = tasks.map(t => [t.id, t.week_number, `"${t.description}"`, t.status, t.created_at]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mastermind-tasks-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// Initialize Demo Data for Members
// ============================================

function getMemberDemoData(): Record<string, {
  objectives: StoredObjective[];
  keyResults: StoredKeyResult[];
  tasks: StoredTask[];
  habits: StoredHabit[];
}> {
  const qid = getCurrentQuarterId();
  return {
    'member-2': { // Alex
      objectives: [
        { id: 'ax-obj-1', quarter_id: qid, title: 'Scale customer success', weight: 45, category: 'Growth', order_index: 0 },
        { id: 'ax-obj-2', quarter_id: qid, title: 'Launch partner program', weight: 30, category: 'Partnerships', order_index: 1 },
        { id: 'ax-obj-3', quarter_id: qid, title: 'Personal wellbeing focus', weight: 25, category: 'Health', order_index: 2 },
      ],
      keyResults: [
        { id: 'ax-kr-1-1', objective_id: 'ax-obj-1', description: 'NPS score', current_value: 72, target_value: 80, unit: 'score', order_index: 0 },
        { id: 'ax-kr-1-2', objective_id: 'ax-obj-1', description: 'Customer retention', current_value: 91, target_value: 95, unit: '%', order_index: 1 },
        { id: 'ax-kr-2-1', objective_id: 'ax-obj-2', description: 'Partner deals closed', current_value: 3, target_value: 5, unit: 'deals', order_index: 0 },
        { id: 'ax-kr-3-1', objective_id: 'ax-obj-3', description: 'Weekly runs', current_value: 8, target_value: 12, unit: 'runs', order_index: 0 },
      ],
      tasks: [
        { id: 'ax-task-1', week_number: 2, quarter_id: qid, description: 'Customer feedback review', status: 'completed', objective_id: 'ax-obj-1', created_at: new Date().toISOString() },
        { id: 'ax-task-2', week_number: 2, quarter_id: qid, description: 'Partner pitch deck update', status: 'planned', objective_id: 'ax-obj-2', created_at: new Date().toISOString() },
      ],
      habits: [
        { id: 'ax-habit-1', name: 'Running', emoji: '🏃', is_active: true, order_index: 0 },
        { id: 'ax-habit-2', name: 'Reading', emoji: '📚', is_active: true, order_index: 1 },
        { id: 'ax-habit-3', name: 'Deep work', emoji: '🎯', is_active: true, order_index: 2 },
      ],
    },
    'member-3': { // Jordan
      objectives: [
        { id: 'jd-obj-1', quarter_id: qid, title: 'Ship mobile app v2', weight: 50, category: 'Product', order_index: 0 },
        { id: 'jd-obj-2', quarter_id: qid, title: 'Reduce tech debt', weight: 30, category: 'Engineering', order_index: 1 },
        { id: 'jd-obj-3', quarter_id: qid, title: 'Work-life balance', weight: 20, category: 'Personal', order_index: 2 },
      ],
      keyResults: [
        { id: 'jd-kr-1-1', objective_id: 'jd-obj-1', description: 'Features shipped', current_value: 5, target_value: 8, unit: 'features', order_index: 0 },
        { id: 'jd-kr-1-2', objective_id: 'jd-obj-1', description: 'App store rating', current_value: 4.2, target_value: 4.5, unit: 'stars', order_index: 1 },
        { id: 'jd-kr-2-1', objective_id: 'jd-obj-2', description: 'Test coverage', current_value: 68, target_value: 80, unit: '%', order_index: 0 },
        { id: 'jd-kr-3-1', objective_id: 'jd-obj-3', description: 'No weekend work weeks', current_value: 7, target_value: 10, unit: 'weeks', order_index: 0 },
      ],
      tasks: [
        { id: 'jd-task-1', week_number: 2, quarter_id: qid, description: 'Code review backlog', status: 'in_progress', objective_id: 'jd-obj-2', created_at: new Date().toISOString() },
        { id: 'jd-task-2', week_number: 2, quarter_id: qid, description: 'Feature flag cleanup', status: 'planned', objective_id: 'jd-obj-2', created_at: new Date().toISOString() },
        { id: 'jd-task-3', week_number: 2, quarter_id: qid, description: 'Sprint planning', status: 'completed', created_at: new Date().toISOString() },
      ],
      habits: [
        { id: 'jd-habit-1', name: 'Code review', emoji: '💻', is_active: true, order_index: 0 },
        { id: 'jd-habit-2', name: 'Gym', emoji: '🏋️', is_active: true, order_index: 1 },
        { id: 'jd-habit-3', name: 'Family time', emoji: '👨‍👩‍👧', is_active: true, order_index: 2 },
      ],
    },
    'member-4': { // Sam
      objectives: [
        { id: 'sm-obj-1', quarter_id: qid, title: 'Launch new product line', weight: 50, category: 'Product', order_index: 0 },
        { id: 'sm-obj-2', quarter_id: qid, title: 'Build thought leadership', weight: 30, category: 'Marketing', order_index: 1 },
        { id: 'sm-obj-3', quarter_id: qid, title: 'Health & fitness goals', weight: 20, category: 'Health', order_index: 2 },
      ],
      keyResults: [
        { id: 'sm-kr-1-1', objective_id: 'sm-obj-1', description: 'Beta users onboarded', current_value: 127, target_value: 200, unit: 'users', order_index: 0 },
        { id: 'sm-kr-1-2', objective_id: 'sm-obj-1', description: 'Feature completion', current_value: 78, target_value: 100, unit: '%', order_index: 1 },
        { id: 'sm-kr-1-3', objective_id: 'sm-obj-1', description: 'Bug-free release rate', current_value: 94, target_value: 99, unit: '%', order_index: 2 },
        { id: 'sm-kr-2-1', objective_id: 'sm-obj-2', description: 'Blog posts published', current_value: 6, target_value: 12, unit: 'posts', order_index: 0 },
        { id: 'sm-kr-2-2', objective_id: 'sm-obj-2', description: 'Newsletter subscribers', current_value: 2400, target_value: 5000, unit: 'subs', order_index: 1 },
        { id: 'sm-kr-3-1', objective_id: 'sm-obj-3', description: 'Workouts per week avg', current_value: 3.2, target_value: 4, unit: '/week', order_index: 0 },
        { id: 'sm-kr-3-2', objective_id: 'sm-obj-3', description: 'Sleep quality score', current_value: 82, target_value: 90, unit: 'score', order_index: 1 },
      ],
      tasks: [
        { id: 'sm-task-1', week_number: 2, quarter_id: qid, description: 'Finalize pricing strategy', status: 'completed', objective_id: 'sm-obj-1', created_at: new Date().toISOString() },
        { id: 'sm-task-2', week_number: 2, quarter_id: qid, description: 'Write product launch blog post', status: 'in_progress', objective_id: 'sm-obj-2', created_at: new Date().toISOString() },
        { id: 'sm-task-3', week_number: 2, quarter_id: qid, description: 'Review beta user feedback', status: 'planned', objective_id: 'sm-obj-1', created_at: new Date().toISOString() },
        { id: 'sm-task-4', week_number: 2, quarter_id: qid, description: 'Schedule podcast appearances', status: 'planned', objective_id: 'sm-obj-2', created_at: new Date().toISOString() },
        { id: 'sm-task-5', week_number: 2, quarter_id: qid, description: 'Book personal trainer session', status: 'completed', objective_id: 'sm-obj-3', created_at: new Date().toISOString() },
      ],
      habits: [
        { id: 'sm-habit-1', name: 'Morning workout', emoji: '🏋️', is_active: true, order_index: 0 },
        { id: 'sm-habit-2', name: 'Write 500 words', emoji: '✍️', is_active: true, order_index: 1 },
        { id: 'sm-habit-3', name: 'No social media before noon', emoji: '📵', is_active: true, order_index: 2 },
        { id: 'sm-habit-4', name: 'Read 30 min', emoji: '📖', is_active: true, order_index: 3 },
        { id: 'sm-habit-5', name: 'Gratitude journaling', emoji: '🙏', is_active: true, order_index: 4 },
      ],
    },
  };
}

export function initializeMemberDemoData(forceReset = false): void {
  // Reset members list to get new names
  if (forceReset) {
    localStorage.removeItem(KEYS.MEMBERS);
  }

  const members = getMembers();
  const memberDemoData = getMemberDemoData();

  members.forEach(member => {
    if (member.id === 'member-1') return; // Skip first member (uses default data)

    const demoData = memberDemoData[member.id];
    if (!demoData) return;

    const memberObjKey = getMemberKey(KEYS.OBJECTIVES, member.id);
    const existingObjectives = get<StoredObjective[]>(memberObjKey, []);

    // Initialize if no data exists OR if force reset
    if (existingObjectives.length === 0 || forceReset) {
      set(getMemberKey(KEYS.OBJECTIVES, member.id), demoData.objectives);
      set(getMemberKey(KEYS.KEY_RESULTS, member.id), demoData.keyResults);
      set(getMemberKey(KEYS.TASKS, member.id), demoData.tasks);
      set(getMemberKey(KEYS.HABITS, member.id), demoData.habits);
    }
  });
}

// Call this once to reset all demo data (useful for testing)
export function resetAllMemberData(): void {
  localStorage.removeItem(KEYS.MEMBERS);
  localStorage.removeItem(KEYS.CURRENT_MEMBER);

  // Clear all member-specific data
  const memberIds = ['member-2', 'member-3', 'member-4'];
  memberIds.forEach(memberId => {
    localStorage.removeItem(getMemberKey(KEYS.OBJECTIVES, memberId));
    localStorage.removeItem(getMemberKey(KEYS.KEY_RESULTS, memberId));
    localStorage.removeItem(getMemberKey(KEYS.TASKS, memberId));
    localStorage.removeItem(getMemberKey(KEYS.HABITS, memberId));
    localStorage.removeItem(getMemberKey(KEYS.HABIT_ENTRIES, memberId));
  });

  // Re-initialize with fresh demo data
  initializeMemberDemoData(true);
}
