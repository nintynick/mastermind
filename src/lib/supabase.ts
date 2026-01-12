// ============================================
// Supabase Client Setup
// ============================================

import { createClient } from '@supabase/supabase-js';
import type {
  User,
  Quarter,
  Objective,
  KeyResult,
  Week,
  Task,
  Habit,
  HabitEntry,
  Group,
  GroupMember,
  Meeting,
  Attendance,
} from '../types';

// These will be replaced with actual values from environment
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Auth helpers
export async function signUp(email: string, password: string, name: string) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (authError) throw authError;

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

// Quarters
export async function getQuarters(userId: string): Promise<Quarter[]> {
  const { data, error } = await supabase
    .from('quarters')
    .select('*')
    .eq('user_id', userId)
    .order('year', { ascending: false })
    .order('quarter', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createQuarter(quarter: Omit<Quarter, 'id' | 'created_at'>): Promise<Quarter> {
  const { data, error } = await supabase
    .from('quarters')
    .insert(quarter)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Objectives
export async function getObjectives(quarterId: string): Promise<Objective[]> {
  const { data, error } = await supabase
    .from('objectives')
    .select(`
      *,
      key_results (*)
    `)
    .eq('quarter_id', quarterId)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function createObjective(objective: Omit<Objective, 'id'>): Promise<Objective> {
  const { data, error } = await supabase
    .from('objectives')
    .insert(objective)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateObjective(id: string, updates: Partial<Objective>): Promise<Objective> {
  const { data, error } = await supabase
    .from('objectives')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Key Results
export async function createKeyResult(keyResult: Omit<KeyResult, 'id'>): Promise<KeyResult> {
  const { data, error } = await supabase
    .from('key_results')
    .insert(keyResult)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKeyResult(id: string, updates: Partial<KeyResult>): Promise<KeyResult> {
  const { data, error } = await supabase
    .from('key_results')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Weeks
export async function getWeeks(quarterId: string): Promise<Week[]> {
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('quarter_id', quarterId)
    .order('week_number');

  if (error) throw error;
  return data || [];
}

export async function createWeek(week: Omit<Week, 'id'>): Promise<Week> {
  const { data, error } = await supabase
    .from('weeks')
    .insert(week)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Tasks
export async function getTasks(weekId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('week_id', weekId)
    .order('created_at');

  if (error) throw error;
  return data || [];
}

export async function createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Habits
export async function getHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('order_index');

  if (error) throw error;
  return data || [];
}

export async function createHabit(habit: Omit<Habit, 'id' | 'created_at'>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Habit Entries
export async function getHabitEntries(habitIds: string[], startDate: string, endDate: string): Promise<HabitEntry[]> {
  const { data, error } = await supabase
    .from('habit_entries')
    .select('*')
    .in('habit_id', habitIds)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) throw error;
  return data || [];
}

export async function upsertHabitEntry(entry: Omit<HabitEntry, 'id'>): Promise<HabitEntry> {
  const { data, error } = await supabase
    .from('habit_entries')
    .upsert(entry, { onConflict: 'habit_id,date' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Groups
export async function getGroups(userId: string): Promise<Group[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      group:groups (*)
    `)
    .eq('user_id', userId);

  if (error) throw error;
  return (data || []).map(d => d.group as unknown as Group);
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      user:users (*)
    `)
    .eq('group_id', groupId);

  if (error) throw error;
  return data || [];
}

// Meetings
export async function getMeetings(groupId: string): Promise<Meeting[]> {
  const { data, error } = await supabase
    .from('meetings')
    .select(`
      *,
      leader:users (*)
    `)
    .eq('group_id', groupId)
    .order('scheduled_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createMeeting(meeting: Omit<Meeting, 'id'>): Promise<Meeting> {
  const { data, error } = await supabase
    .from('meetings')
    .insert(meeting)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Attendance
export async function getAttendance(meetingId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('meeting_id', meetingId);

  if (error) throw error;
  return data || [];
}

export async function upsertAttendance(attendance: Attendance): Promise<Attendance> {
  const { data, error } = await supabase
    .from('attendance')
    .upsert(attendance, { onConflict: 'meeting_id,user_id' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// User profile
export async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Real-time subscriptions
export function subscribeToTasks(weekId: string, callback: (tasks: Task[]) => void) {
  return supabase
    .channel(`tasks:${weekId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `week_id=eq.${weekId}` },
      async () => {
        const tasks = await getTasks(weekId);
        callback(tasks);
      }
    )
    .subscribe();
}

export function subscribeToHabitEntries(habitIds: string[], callback: (entries: HabitEntry[]) => void) {
  const filter = habitIds.map(id => `habit_id.eq.${id}`).join(',');
  return supabase
    .channel('habit_entries')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'habit_entries', filter: `or(${filter})` },
      async () => {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const entries = await getHabitEntries(habitIds, weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
        callback(entries);
      }
    )
    .subscribe();
}
