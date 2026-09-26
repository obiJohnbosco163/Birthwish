-- ==============================================================================
-- 1. SQL MIGRATIONS (Tables, Row Level Security, Functions & Triggers)
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/pduilappwormmqgpusgv/sql/new
-- ==============================================================================

-- 1. Create public.profiles table referencing auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow users to view their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 4. Automatic User Trigger Function
-- Automatically creates a public profile row whenever a new user signs up
-- via Email/Password, Google OAuth, or GitHub OAuth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  extracted_dob DATE;
  raw_dob TEXT;
BEGIN
  -- Safely parse date_of_birth if passed in raw_user_meta_data
  raw_dob := new.raw_user_meta_data->>'date_of_birth';
  IF raw_dob IS NOT NULL AND raw_dob <> '' THEN
    BEGIN
      extracted_dob := raw_dob::DATE;
    EXCEPTION WHEN OTHERS THEN
      extracted_dob := NULL;
    END;
  ELSE
    extracted_dob := NULL;
  END IF;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    date_of_birth,
    gender,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      NULL
    ),
    extracted_dob,
    new.raw_user_meta_data->>'gender',
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.profiles.date_of_birth),
    gender = COALESCE(EXCLUDED.gender, public.profiles.gender),
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Attach Trigger to auth.users (AFTER INSERT)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure birthwishes table exists with RLS
CREATE TABLE IF NOT EXISTS public.birthwishes (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id TEXT,
  category TEXT,
  custom_category TEXT,
  color_theme TEXT,
  celebrant_name TEXT NOT NULL,
  celebrant_nickname TEXT,
  celebrant_gender TEXT,
  cover_image TEXT,
  main_image TEXT,
  short_message TEXT,
  final_epistle TEXT,
  sender_relation TEXT,
  sender_name TEXT,
  has_gift BOOLEAN DEFAULT FALSE,
  gift_amount NUMERIC DEFAULT 0,
  gift_currency TEXT DEFAULT 'NGN',
  gift_passcode TEXT,
  gift_status TEXT DEFAULT 'holding',
  gift_claimed_at TIMESTAMP WITH TIME ZONE,
  claim_details JSONB,
  kora_reference TEXT
);

ALTER TABLE public.birthwishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for celebrant view"
  ON public.birthwishes
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert birthwishes"
  ON public.birthwishes
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update birthwishes"
  ON public.birthwishes
  FOR UPDATE
  TO public
  USING (true);
