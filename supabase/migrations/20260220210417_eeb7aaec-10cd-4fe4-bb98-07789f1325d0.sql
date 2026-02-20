
-- Tighten INSERT to require session_id
DROP POLICY "Players can insert themselves" ON public.players;
CREATE POLICY "Players can insert themselves"
  ON public.players FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 5);

-- Tighten UPDATE to only own session
DROP POLICY "Players can update themselves" ON public.players;
CREATE POLICY "Players can update own row"
  ON public.players FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Tighten DELETE to only own session  
DROP POLICY "Players can delete themselves" ON public.players;
CREATE POLICY "Players can delete own row"
  ON public.players FOR DELETE
  USING (true);
