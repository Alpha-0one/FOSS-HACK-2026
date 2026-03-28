
-- Add attachment columns to messages table
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_url text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_type text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachment_name text;

-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blocks" ON public.blocked_users
  FOR SELECT TO authenticated
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block others" ON public.blocked_users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock" ON public.blocked_users
  FOR DELETE TO authenticated
  USING (auth.uid() = blocker_id);

-- Create chat_attachments storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('chat_attachments', 'chat_attachments', true, 104857600);

-- Storage policies for chat_attachments
CREATE POLICY "Authenticated users can upload chat attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view chat attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat_attachments');

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat_attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create video_call_signals table for WebRTC signaling
CREATE TABLE public.video_call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id text NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  signal_type text NOT NULL,
  signal_data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_call_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signals in their rooms" ON public.video_call_signals
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send signals" ON public.video_call_signals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own signals" ON public.video_call_signals
  FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Enable realtime for signaling
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_signals;
