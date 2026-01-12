// ============================================
// Mastermind Tracker - Type Definitions
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  vision?: string;
  mission?: string;
  values?: string;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  settings: GroupSettings;
  created_at: string;
}

export interface GroupSettings {
  meeting_schedule: {
    start_of_week: string; // e.g., "Monday 9:00"
    end_of_week: string;
    start_of_quarter: string;
    mid_quarter: string;
    end_of_quarter: string;
  };
  call_leader_rotation: string[]; // user IDs
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

export interface Quarter {
  id: string;
  user_id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  created_at: string;
}

export interface Objective {
  id: string;
  quarter_id: string;
  title: string;
  weight: number; // percentage, 0-100
  category: ObjectiveCategory;
  order_index: number;
  key_results?: KeyResult[];
}

export type ObjectiveCategory =
  | 'Development'
  | 'Maintenance'
  | 'Growth'
  | 'Technology'
  | 'Ecosystem'
  | 'Resourcing'
  | 'Health'
  | 'Wealth'
  | 'Freedom'
  | 'Other';

export interface KeyResult {
  id: string;
  objective_id: string;
  description: string;
  current_value: number;
  target_value: number;
  unit: string;
  order_index: number;
}

export interface Week {
  id: string;
  quarter_id: string;
  week_number: number; // 1-13
  start_date: string;
  reflection_notes?: string;
}

export interface Task {
  id: string;
  week_id: string;
  user_id: string;
  objective_id?: string;
  key_result_id?: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export type TaskStatus =
  | 'planned'
  | 'completed'
  | 'completed_plus'
  | 'postponed'
  | 'try_again'
  | 'deprecated';

export const TaskStatusLabels: Record<TaskStatus, string> = {
  planned: 'Planned',
  completed: 'Completed',
  completed_plus: 'Completed+',
  postponed: 'Postponed',
  try_again: 'Try Again',
  deprecated: 'Deprecated',
};

export const TaskStatusColors: Record<TaskStatus, string> = {
  planned: 'info',
  completed: 'success',
  completed_plus: 'success',
  postponed: 'muted',
  try_again: 'accent',
  deprecated: 'muted',
};

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  notes?: string;
}

export interface Meeting {
  id: string;
  group_id: string;
  type: MeetingType;
  scheduled_date: string;
  leader_id: string;
  duration_minutes: number;
  leader?: User;
}

export type MeetingType =
  | 'start_quarter'
  | 'mid_quarter'
  | 'end_quarter'
  | 'start_week'
  | 'end_week';

export const MeetingTypeLabels: Record<MeetingType, string> = {
  start_quarter: 'Start of Quarter',
  mid_quarter: 'Mid Quarter',
  end_quarter: 'End of Quarter',
  start_week: 'Start of Week',
  end_week: 'End of Week',
};

export const MeetingTypeDurations: Record<MeetingType, number> = {
  start_quarter: 40,
  mid_quarter: 30,
  end_quarter: 40,
  start_week: 9,
  end_week: 9,
};

export interface Attendance {
  meeting_id: string;
  user_id: string;
  status: AttendanceStatus;
  late_minutes?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

// Computed types
export interface ObjectiveWithProgress extends Objective {
  progress: number; // 0-100
}

export interface WeekWithTasks extends Week {
  tasks: Task[];
}

export interface HabitWithEntries extends Habit {
  entries: HabitEntry[];
  streak: number;
}

// Route types
export type Route =
  | 'dashboard'
  | 'vision'
  | 'okrs'
  | 'tasks'
  | 'habits'
  | 'meetings'
  | 'group'
  | 'settings'
  | 'login'
  | 'signup';

// App state
export interface AppState {
  user: User | null;
  currentRoute: Route;
  currentQuarter: Quarter | null;
  currentWeek: Week | null;
  isLoading: boolean;
  error: string | null;
}
