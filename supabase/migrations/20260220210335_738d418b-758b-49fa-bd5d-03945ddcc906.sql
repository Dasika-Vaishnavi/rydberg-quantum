
-- Players table for real-time GPS positions
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'atom',
  lat DOUBLE PRECISION NOT NULL DEFAULT 0,
  lon DOUBLE PRECISION NOT NULL DEFAULT 0,
  atom_state TEXT NOT NULL DEFAULT 'ground',
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Anyone can see all players (public game)
CREATE POLICY "Anyone can view players"
  ON public.players FOR SELECT
  USING (true);

-- Players can insert their own row (matched by session_id)
CREATE POLICY "Players can insert themselves"
  ON public.players FOR INSERT
  WITH CHECK (true);

-- Players can update their own row
CREATE POLICY "Players can update themselves"
  ON public.players FOR UPDATE
  USING (true);

-- Players can delete their own row
CREATE POLICY "Players can delete themselves"
  ON public.players FOR DELETE
  USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.players;

-- Index for geo queries
CREATE INDEX idx_players_location ON public.players (lat, lon);

-- Index for cleanup of stale players
CREATE INDEX idx_players_last_seen ON public.players (last_seen);
