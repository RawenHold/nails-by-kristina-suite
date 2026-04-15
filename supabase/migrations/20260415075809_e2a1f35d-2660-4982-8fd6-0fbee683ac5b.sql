
-- Create enums
CREATE TYPE public.appointment_status AS ENUM ('planned', 'confirmed', 'completed', 'canceled', 'no_show');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'transfer', 'other');
CREATE TYPE public.reminder_status AS ENUM ('upcoming', 'today', 'overdue', 'sent');
CREATE TYPE public.client_lifecycle_status AS ENUM ('new', 'active', 'inactive', 'lost', 'vip');
CREATE TYPE public.loyalty_level AS ENUM ('bronze', 'silver', 'gold', 'vip');
CREATE TYPE public.tag_type AS ENUM ('color', 'style', 'shape', 'length', 'preference', 'design', 'other');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  default_price BIGINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.services FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_services_ts BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Clients
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  telegram_username TEXT,
  telegram_link TEXT,
  avatar_url TEXT,
  notes TEXT,
  favorite_colors TEXT[],
  favorite_designs TEXT[],
  favorite_shape TEXT,
  favorite_length TEXT,
  allergies TEXT,
  total_spent BIGINT NOT NULL DEFAULT 0,
  average_check BIGINT NOT NULL DEFAULT 0,
  total_visits INTEGER NOT NULL DEFAULT 0,
  last_visit_date DATE,
  days_since_last_visit INTEGER,
  recommended_next_visit DATE,
  manual_reminder_date DATE,
  lifecycle_status public.client_lifecycle_status NOT NULL DEFAULT 'new',
  loyalty_level public.loyalty_level NOT NULL DEFAULT 'bronze',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.clients FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_clients_ts BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_clients_owner ON public.clients(owner_id);
CREATE INDEX idx_clients_lifecycle ON public.clients(owner_id, lifecycle_status);
CREATE INDEX idx_clients_name ON public.clients USING gin(to_tsvector('simple', full_name));

-- Tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag_type public.tag_type NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.tags FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Client Tags
CREATE TABLE public.client_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(client_id, tag_id)
);
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.client_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.clients WHERE id = client_id AND owner_id = auth.uid()));

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'planned',
  expected_price BIGINT NOT NULL DEFAULT 0,
  final_price BIGINT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.appointments FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_appointments_ts BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_appointments_date ON public.appointments(owner_id, start_time);

-- Appointment Services
CREATE TABLE public.appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price BIGINT NOT NULL DEFAULT 0,
  UNIQUE(appointment_id, service_id)
);
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.appointment_services FOR ALL
  USING (EXISTS (SELECT 1 FROM public.appointments WHERE id = appointment_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.appointments WHERE id = appointment_id AND owner_id = auth.uid()));

-- Visits
CREATE TABLE public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  services_performed TEXT[],
  total_price BIGINT NOT NULL DEFAULT 0,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_received BOOLEAN NOT NULL DEFAULT true,
  colors_used TEXT[],
  design_notes TEXT,
  nail_shape TEXT,
  nail_length TEXT,
  private_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.visits FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_visits_ts BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_visits_client ON public.visits(client_id);
CREATE INDEX idx_visits_date ON public.visits(owner_id, visit_date);

-- Visit Tags
CREATE TABLE public.visit_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  UNIQUE(visit_id, tag_id)
);
ALTER TABLE public.visit_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.visit_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM public.visits WHERE id = visit_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.visits WHERE id = visit_id AND owner_id = auth.uid()));

-- Visit Photos
CREATE TABLE public.visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_cover BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.visit_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.visit_photos FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Reminders
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  status public.reminder_status NOT NULL DEFAULT 'upcoming',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.reminders FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_reminders_ts BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE INDEX idx_reminders_date ON public.reminders(owner_id, reminder_date);

-- Income
CREATE TABLE public.incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  note TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.incomes FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_incomes_date ON public.incomes(owner_id, received_at);

-- Expense Categories
CREATE TABLE public.expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.expense_categories FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  note TEXT,
  attachment_url TEXT,
  spent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.expenses FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE INDEX idx_expenses_date ON public.expenses(owner_id, spent_at);

-- Message Templates
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner access" ON public.message_templates FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_templates_ts BEFORE UPDATE ON public.message_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for visit photos
INSERT INTO storage.buckets (id, name, public) VALUES ('visit-photos', 'visit-photos', false);
CREATE POLICY "Owner upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner read" ON storage.objects FOR SELECT USING (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner delete" ON storage.objects FOR DELETE USING (bucket_id = 'visit-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
