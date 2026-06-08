-- Supabase Schema for kelasmateri (CPNS Exam Simulation)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'user');
CREATE TYPE exam_type_enum AS ENUM ('ai', 'manual');
CREATE TYPE exam_status_enum AS ENUM ('in_progress', 'completed');

-- 1. Create Users Table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'user',
    can_generate_exam BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Create Manual Questions Table
CREATE TABLE public.manual_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL, -- 'TIU', 'TWK', 'TKP'
    question_text TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of strings e.g. ["A. Option 1", "B. Option 2", ...]
    correct_answer TEXT NOT NULL, -- For TIU/TWK: 'A', 'B', etc. For TKP: JSON string/object matching options to scores e.g. {"A": 5, "B": 4, "C": 3, "D": 2, "E": 1}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for manual_questions
ALTER TABLE public.manual_questions ENABLE ROW LEVEL SECURITY;

-- 3. Create Exam Sessions Table
CREATE TABLE public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    exam_type exam_type_enum NOT NULL,
    current_question_index INT NOT NULL DEFAULT 0,
    saved_answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Map of { question_id_or_index: "A"/"B"/"C"/"D"/"E" }
    remaining_time_seconds INT NOT NULL,
    status exam_status_enum NOT NULL DEFAULT 'in_progress',
    final_score INT,
    category_scores JSONB, -- { "TIU": score, "TWK": score, "TKP": score }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for exam_sessions
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;

-- Create Indexes
CREATE INDEX IF NOT EXISTS exam_sessions_user_id_idx ON public.exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS manual_questions_category_idx ON public.manual_questions(category);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
--------------------------------------------------------------------------------

-- Users Table Policies
CREATE POLICY "Allow users to read their own profile"
    ON public.users FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile details"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins have full access to users table"
    ON public.users FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Manual Questions Policies
CREATE POLICY "Allow anyone authenticated to view questions"
    ON public.manual_questions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins have full control over questions"
    ON public.manual_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Exam Sessions Policies
CREATE POLICY "Allow users to view their own sessions"
    ON public.exam_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own sessions"
    ON public.exam_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own sessions"
    ON public.exam_sessions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all exam sessions"
    ON public.exam_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

--------------------------------------------------------------------------------
-- TRIGGER FOR AUTOMATIC USER PROFILE CREATION
--------------------------------------------------------------------------------
-- This automatically creates a public profile row when a new user registers via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, can_generate_exam)
  VALUES (
    new.id,
    new.email,
    -- Make the first user an admin for easy testing, or default based on email
    CASE 
        WHEN new.email = 'admin@kelasmateri.com' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END,
    CASE 
        WHEN new.email = 'admin@kelasmateri.com' THEN true
        ELSE false
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
