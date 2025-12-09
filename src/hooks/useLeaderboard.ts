import { supabase } from '@/integrations/supabase/client';
import { Difficulty } from '@/components/FlappyBird/types';

const PLAYER_NAME_KEY = 'flappy-bird-player-name';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  difficulty: string;
}

export const useLeaderboard = () => {
  // Get saved player name
  const getSavedPlayerName = (): string | null => {
    return localStorage.getItem(PLAYER_NAME_KEY);
  };

  // Save player name
  const savePlayerName = (name: string) => {
    localStorage.setItem(PLAYER_NAME_KEY, name);
  };

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
        return true;
      }

      if (!data || data.length < 20) {
        return true;
      }

      const lowestScore = data[data.length - 1]?.score || 0;
      return score > lowestScore;
    } catch (error) {
      console.error('Error checking leaderboard:', error);
      return true;
    }
  };

  // Check if player needs to enter name (first time or not in leaderboard yet)
  const needsNameInput = async (score: number, difficulty: Difficulty): Promise<boolean> => {
    const savedName = getSavedPlayerName();
    
    // No saved name - need input
    if (!savedName) {
      return true;
    }

    // Check if player already has an entry for this difficulty
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('id, score')
      .eq('player_name', savedName)
      .eq('difficulty', difficulty)
      .maybeSingle();

    // Player has entry - auto update if score is higher
    if (existing) {
      if (score > existing.score) {
        await supabase
          .from('leaderboard')
          .update({ score, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
      return false; // Don't show name input
    }

    // Player doesn't have entry for this difficulty - auto insert
    await supabase
      .from('leaderboard')
      .insert({
        player_name: savedName,
        score,
        difficulty,
      });

    return false; // Don't show name input
  };

  // Submit a new high score (first time)
  const submitScore = async (
    playerName: string,
    score: number,
    difficulty: Difficulty
  ): Promise<boolean> => {
    try {
      // Save player name for future
      savePlayerName(playerName);

      const { data: existing } = await supabase
        .from('leaderboard')
        .select('id, score')
        .eq('player_name', playerName)
        .eq('difficulty', difficulty)
        .maybeSingle();

      if (existing) {
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
    getSavedPlayerName,
    savePlayerName,
    checkIfQualifies,
    needsNameInput,
    submitScore,
  };
};
