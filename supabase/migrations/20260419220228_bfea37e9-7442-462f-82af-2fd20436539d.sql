-- Master profile table (one per owner)
CREATE TABLE public.master_profile (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  phone TEXT,
  instagram TEXT,
  telegram TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.master_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access" ON public.master_profile
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER update_master_profile_updated_at
  BEFORE UPDATE ON public.master_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Public storage bucket for master avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('master-avatars', 'master-avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'master-avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'master-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'master-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'master-avatars' AND auth.uid()::text = (storage.foldername(name))[1]);