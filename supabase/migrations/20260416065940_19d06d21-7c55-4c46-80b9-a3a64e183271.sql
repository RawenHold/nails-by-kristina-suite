
-- Create timer_status enum
CREATE TYPE public.timer_status AS ENUM ('running', 'paused', 'completed');

-- Create timer_sessions table
CREATE TABLE public.timer_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  status public.timer_status NOT NULL DEFAULT 'running',
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timer_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy
CREATE POLICY "Owner access" ON public.timer_sessions FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Updated_at trigger
CREATE TRIGGER update_timer_sessions_updated_at
  BEFORE UPDATE ON public.timer_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_clients_owner_lifecycle ON public.clients(owner_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_appointments_owner_start ON public.appointments(owner_id, start_time);
CREATE INDEX IF NOT EXISTS idx_visits_owner_client ON public.visits(owner_id, client_id);
CREATE INDEX IF NOT EXISTS idx_incomes_owner_received ON public.incomes(owner_id, received_at);
CREATE INDEX IF NOT EXISTS idx_expenses_owner_spent ON public.expenses(owner_id, spent_at);
CREATE INDEX IF NOT EXISTS idx_reminders_owner_status_date ON public.reminders(owner_id, status, reminder_date);
CREATE INDEX IF NOT EXISTS idx_timer_sessions_owner ON public.timer_sessions(owner_id);
CREATE INDEX IF NOT EXISTS idx_visit_photos_owner ON public.visit_photos(owner_id);
CREATE INDEX IF NOT EXISTS idx_visit_photos_visit ON public.visit_photos(visit_id);

-- Storage policies for visit-photos bucket
CREATE POLICY "Owner can upload photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can view own photos" ON storage.objects FOR SELECT
  USING (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can update own photos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner can delete own photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
