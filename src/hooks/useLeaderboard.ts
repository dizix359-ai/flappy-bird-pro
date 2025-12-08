import { supabase } from '@/integrations/supabase/client';
import { Difficulty } from '@/components/FlappyBird/types';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  difficulty: string;
}

export const useLeaderboard = () => {
  // Check if score qualifies for leaderboard (top 20)
  const checkIfQualifies = async (score: number, difficulty: Difficulty): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('score')
        .eq('difficulty', difficulty)
        .order('score', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error checking leaderboard:', error);
        return true; // Allow submission on error
      }

      // If less than 20 entries, always qualifies
      if (!data || data.length < 20) {
        return true;
      }

      // Check if score beats the lowest in top 20
      const lowestScore = data[data.length - 1]?.score || 0;
      return score > lowestScore;
    } catch (error) {
      console.error('Error checking leaderboard:', error);
      return true;
    }
  };

  // Submit a new high score
  const submitScore = async (
    playerName: string,
    score: number,
    difficulty: Difficulty
  ): Promise<boolean> => {
    try {
      // Check if player already has a score for this difficulty
      const { data: existing } = await supabase
        .from('leaderboard')
        .select('id, score')
        .eq('player_name', playerName)
        .eq('difficulty', difficulty)
        .maybeSingle();

      if (existing) {
        // Only update if new score is higher
        if (score > existing.score) {
          const { error } = await supabase
            .from('leaderboard')
            .update({ score, updated_at: new Date().toISOString() })
            .eq('id', existing.id);

          if (error) {
            console.error('Error updating score:', error);
            return false;
          }
        }
      } else {
        // Insert new entry
        const { error } = await supabase
          .from('leaderboard')
          .insert({
            player_name: playerName,
            score,
            difficulty,
          });

        if (error) {
          console.error('Error inserting score:', error);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error submitting score:', error);
      return false;
    }
  };

  return {
    checkIfQualifies,
    submitScore,
  };
};
