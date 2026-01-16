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

    // Use secure RPC function to update/insert score
    try {
      await supabase.rpc('update_player_score', {
        p_player_name: savedName,
        p_score: score,
        p_difficulty: difficulty,
      });
    } catch (error) {
      console.error('Error updating score:', error);
    }

    return false; // Don't show name input
  };

  // Submit a new high score (first time)
  const submitScore = async (
    playerName: string,
    score: number,
    difficulty: Difficulty
  ): Promise<boolean> => {
    try {
      // Validate inputs before sending
      const trimmedName = playerName.trim();
      if (trimmedName.length < 1 || trimmedName.length > 50) {
        console.error('Invalid player name length');
        return false;
      }
      
      if (score < 0 || score > 999999) {
        console.error('Invalid score');
        return false;
      }

      // Save player name for future
      savePlayerName(trimmedName);

      // Use secure RPC function to update/insert score
      const { error } = await supabase.rpc('update_player_score', {
        p_player_name: trimmedName,
        p_score: score,
        p_difficulty: difficulty,
      });

      if (error) {
        console.error('Error submitting score:', error);
        return false;
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
