
-- Drop the overly permissive anon policy on timeline events
DROP POLICY IF EXISTS "Public can view timeline events" ON public.transfer_timeline_events;

-- Create a function that returns timeline events for a given public_id
CREATE OR REPLACE FUNCTION public.get_timeline_by_public_id(p_public_id TEXT)
RETURNS SETOF public.transfer_timeline_events
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tte.*
  FROM public.transfer_timeline_events tte
  JOIN public.transfers t ON t.id = tte.transfer_id
  WHERE t.public_id = p_public_id
  ORDER BY tte.step_order ASC;
$$;
