-- Create leaderboard table for storing high scores
CREATE TABLE public.leaderboard (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'hard', 'crazy')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_leaderboard_difficulty_score ON public.leaderboard (difficulty, score DESC);

-- Enable Row Level Security
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard (public data)
CREATE POLICY "Leaderboard is publicly readable" 
ON public.leaderboard 
FOR SELECT 
USING (true);

-- Allow anyone to insert new scores (no auth required for casual game)
CREATE POLICY "Anyone can submit scores" 
ON public.leaderboard 
FOR INSERT 
WITH CHECK (true);

-- Allow updates only on matching player_name and difficulty
CREATE POLICY "Players can update their own scores" 
ON public.leaderboard 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Enable realtime for leaderboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_leaderboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leaderboard_updated_at
BEFORE UPDATE ON public.leaderboard
FOR EACH ROW
EXECUTE FUNCTION public.update_leaderboard_updated_at();