-- ============================================
-- Mastermind Tracker - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  vision TEXT,
  mission TEXT,
  values TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members junction table
CREATE TABLE public.group_members (
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (group_id, user_id)
);

-- Quarters table
CREATE TABLE public.quarters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter IN (1, 2, 3, 4)) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, year, quarter)
);

-- Objectives table
CREATE TABLE public.objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quarter_id UUID REFERENCES public.quarters(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  weight INTEGER CHECK (weight >= 0 AND weight <= 100) DEFAULT 0,
  category TEXT DEFAULT 'Other',
  order_index INTEGER DEFAULT 0
);

-- Key Results table
CREATE TABLE public.key_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  current_value NUMERIC DEFAULT 0,
  target_value NUMERIC NOT NULL,
  unit TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0
);

-- Weeks table
CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quarter_id UUID REFERENCES public.quarters(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER CHECK (week_number >= 1 AND week_number <= 13) NOT NULL,
  start_date DATE NOT NULL,
  reflection_notes TEXT,
  UNIQUE (quarter_id, week_number)
);

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_id UUID REFERENCES public.weeks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  objective_id UUID REFERENCES public.objectives(id) ON DELETE SET NULL,
  key_result_id UUID REFERENCES public.key_results(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT CHECK (status IN ('planned', 'completed', 'completed_plus', 'postponed', 'try_again', 'deprecated')) DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habits table
CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '✓',
  is_active BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habit entries table
CREATE TABLE public.habit_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  UNIQUE (habit_id, date)
);

-- Meetings table
CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('start_quarter', 'mid_quarter', 'end_quarter', 'start_week', 'end_week')) NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  leader_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  duration_minutes INTEGER DEFAULT 30
);

-- Attendance table
CREATE TABLE public.attendance (
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('present', 'absent', 'late')) DEFAULT 'present',
  late_minutes INTEGER,
  PRIMARY KEY (meeting_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_quarters_user ON public.quarters(user_id);
CREATE INDEX idx_objectives_quarter ON public.objectives(quarter_id);
CREATE INDEX idx_key_results_objective ON public.key_results(objective_id);
CREATE INDEX idx_weeks_quarter ON public.weeks(quarter_id);
CREATE INDEX idx_tasks_week ON public.tasks(week_id);
CREATE INDEX idx_tasks_user ON public.tasks(user_id);
CREATE INDEX idx_habits_user ON public.habits(user_id);
CREATE INDEX idx_habit_entries_habit ON public.habit_entries(habit_id);
CREATE INDEX idx_habit_entries_date ON public.habit_entries(date);
CREATE INDEX idx_meetings_group ON public.meetings(group_id);
CREATE INDEX idx_meetings_date ON public.meetings(scheduled_date);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quarters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.key_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Users can read/write their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Users can view group members if they're in the group
CREATE POLICY "Group members can view group" ON public.groups FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()));

CREATE POLICY "Group members can view other members" ON public.group_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid()));

-- Users can manage their own quarters
CREATE POLICY "Users can manage own quarters" ON public.quarters FOR ALL USING (user_id = auth.uid());

-- Users can manage their own objectives (via quarters)
CREATE POLICY "Users can manage own objectives" ON public.objectives FOR ALL
  USING (EXISTS (SELECT 1 FROM public.quarters WHERE id = quarter_id AND user_id = auth.uid()));

-- Users can manage their own key results (via objectives)
CREATE POLICY "Users can manage own key results" ON public.key_results FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.objectives o
    JOIN public.quarters q ON o.quarter_id = q.id
    WHERE o.id = objective_id AND q.user_id = auth.uid()
  ));

-- Users can manage their own weeks (via quarters)
CREATE POLICY "Users can manage own weeks" ON public.weeks FOR ALL
  USING (EXISTS (SELECT 1 FROM public.quarters WHERE id = quarter_id AND user_id = auth.uid()));

-- Users can manage their own tasks
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (user_id = auth.uid());

-- Users can manage their own habits
CREATE POLICY "Users can manage own habits" ON public.habits FOR ALL USING (user_id = auth.uid());

-- Users can manage their own habit entries
CREATE POLICY "Users can manage own habit entries" ON public.habit_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM public.habits WHERE id = habit_id AND user_id = auth.uid()));

-- Group members can view meetings
CREATE POLICY "Group members can view meetings" ON public.meetings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_id = meetings.group_id AND user_id = auth.uid()));

-- Group members can view attendance
CREATE POLICY "Group members can view attendance" ON public.attendance FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meetings m
    JOIN public.group_members gm ON m.group_id = gm.group_id
    WHERE m.id = meeting_id AND gm.user_id = auth.uid()
  ));

-- Group members can view each other's data for accountability
CREATE POLICY "Group members can view each other's quarters" ON public.quarters FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid() AND gm2.user_id = quarters.user_id
  ));

CREATE POLICY "Group members can view each other's objectives" ON public.objectives FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quarters q
    JOIN public.group_members gm1 ON gm1.user_id = q.user_id
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE q.id = quarter_id AND gm2.user_id = auth.uid()
  ));

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
