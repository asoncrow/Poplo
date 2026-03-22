-- Run this in your Supabase SQL Editor to ensure the table and RLS are set up correctly

-- 1. Create the sites table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  site_name text NOT NULL,
  site_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

-- 3. Create policies to allow users to manage their own sites
CREATE POLICY "Users can view their own sites" ON public.sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sites" ON public.sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sites" ON public.sites FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sites" ON public.sites FOR DELETE USING (auth.uid() = user_id);

-- 4. Create site_configs table
CREATE TABLE IF NOT EXISTS public.site_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notification_type text,
  message_template text,
  position text,
  theme text,
  delay_seconds integer,
  interval_seconds integer,
  min_daily integer,
  max_daily integer,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.site_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own site configs"
ON public.site_configs
FOR ALL
USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()))
WITH CHECK (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));

-- 5. Create notification_events table
CREATE TABLE IF NOT EXISTS public.notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  name text,
  city text,
  action text,
  timestamp text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification events"
ON public.notification_events
FOR ALL
USING (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()))
WITH CHECK (site_id IN (SELECT id FROM public.sites WHERE user_id = auth.uid()));
