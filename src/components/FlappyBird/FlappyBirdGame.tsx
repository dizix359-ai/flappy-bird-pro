import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { DifficultyMenu } from './DifficultyMenu';
import { Shop } from './Shop';
import { GameState, Difficulty } from './types';
import { PlayerProgress, loadProgress, saveProgress, SHOP_BIRDS, SHOP_WEAPONS } from './shopTypes';
import { 
  AchievementProgress, 
  loadAchievementProgress, 
  saveAchievementProgress, 
  checkAchievements,
  Achievement,
  ACHIEVEMENTS
} from './achievementsTypes';
import { useGameAudio } from '@/hooks/useGameAudio';

const STORAGE_KEY_EASY = 'flappy-bird-high-score-easy';
const STORAGE_KEY_HARD = 'flappy-bird-high-score-hard';
const STORAGE_KEY_CRAZY = 'flappy-bird-high-score-crazy';

const getStorageKey = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy': return STORAGE_KEY_EASY;
    case 'hard': return STORAGE_KEY_HARD;
    case 'crazy': return STORAGE_KEY_CRAZY;
  }
};

export const FlappyBirdGame = () => {
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({ easy: 0, hard: 0, crazy: 0 });
  const [showShop, setShowShop] = useState(false);
  const [progress, setProgress] = useState<PlayerProgress>(loadProgress);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress>(loadAchievementProgress);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    difficulty: 'easy',
  });

  const audio = useGameAudio();

  useEffect(() => {
    const easyScore = parseInt(localStorage.getItem(STORAGE_KEY_EASY) || '0', 10);
    const hardScore = parseInt(localStorage.getItem(STORAGE_KEY_HARD) || '0', 10);
    const crazyScore = parseInt(localStorage.getItem(STORAGE_KEY_CRAZY) || '0', 10);
    setHighScores({ easy: easyScore, hard: hardScore, crazy: crazyScore });
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      const maxWidth = Math.min(window.innerWidth - 8, 420);
      const maxHeight = Math.min(window.innerHeight - 16, 680);
      const aspectRatio = 0.62;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setDimensions({ 
        width: Math.floor(width), 
        height: Math.floor(height) 
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);
    
    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  const handleSelectDifficulty = useCallback((difficulty: Difficulty) => {
    setGameState({
      status: 'idle',
      score: 0,
      highScore: highScores[difficulty],
      difficulty,
    });
  }, [highScores]);

  const handleStart = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      score: 0,
    }));
    audio.startMusic();
  }, [audio]);

  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
  }, []);

  const handleGameOver = useCallback((finalScore: number, coinsCollected: number = 0, killsCount: number = 0) => {
    audio.stopMusic();
    audio.playGameOver();
    
    // Update progress for all modes
    setProgress(prev => {
      const updated = {
        ...prev,
        totalCoins: prev.totalCoins + coinsCollected,
        totalKills: prev.totalKills + killsCount,
        highestScore: Math.max(prev.highestScore, finalScore),
      };
      saveProgress(updated);
      return updated;
    });
    
    // Update achievement progress
    setAchievementProgress(prev => {
      const scoreKey = `${gameState.difficulty}HighScore` as 'easyHighScore' | 'hardHighScore' | 'crazyHighScore';
      const updated: AchievementProgress = {
        ...prev,
        gamesPlayed: prev.gamesPlayed + 1,
        [scoreKey]: Math.max(prev[scoreKey], finalScore),
        totalCoinsEarned: prev.totalCoinsEarned + coinsCollected,
        totalKills: prev.totalKills + killsCount,
      };
      
      // Check for new achievements
      const { newlyUnlocked, totalReward } = checkAchievements(updated, gameState.difficulty);
      
      if (newlyUnlocked.length > 0) {
        updated.unlockedAchievements = [
          ...updated.unlockedAchievements,
          ...newlyUnlocked.map(a => a.id)
        ];
        
        // Add reward coins
        if (totalReward > 0) {
          setProgress(p => {
            const withReward = { ...p, totalCoins: p.totalCoins + totalReward };
            saveProgress(withReward);
            return withReward;
          });
        }
        
        // Show achievements
        setNewAchievements(newlyUnlocked);
        setTimeout(() => setNewAchievements([]), 4000);
      }
      
      saveAchievementProgress(updated);
      return updated;
    });
    
    setGameState(prev => {
      const storageKey = getStorageKey(prev.difficulty);
      const currentHigh = highScores[prev.difficulty];
      const newHighScore = Math.max(currentHigh, finalScore);
      
      if (newHighScore > currentHigh) {
        localStorage.setItem(storageKey, newHighScore.toString());
        setHighScores(h => ({ ...h, [prev.difficulty]: newHighScore }));
      }
      
      return {
        ...prev,
        status: 'gameOver',
        score: finalScore,
        highScore: newHighScore,
      };
    });
  }, [highScores, audio, gameState.difficulty]);

  const handlePurchase = useCallback((type: 'bird' | 'weapon', id: string, price: number): boolean => {
    if (progress.totalCoins < price) return false;
    
    setProgress(prev => {
      const updated = {
        ...prev,
        totalCoins: prev.totalCoins - price,
        purchasedBirds: type === 'bird' ? [...prev.purchasedBirds, id] : prev.purchasedBirds,
        purchasedWeapons: type === 'weapon' ? [...prev.purchasedWeapons, id] : prev.purchasedWeapons,
        selectedBird: type === 'bird' ? id : prev.selectedBird,
        selectedWeapon: type === 'weapon' ? id : prev.selectedWeapon,
      };
      saveProgress(updated);
      return updated;
    });
    return true;
  }, [progress.totalCoins]);

  const handleSelectItem = useCallback((type: 'bird' | 'weapon', id: string) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        selectedBird: type === 'bird' ? id : prev.selectedBird,
        selectedWeapon: type === 'weapon' ? id : prev.selectedWeapon,
      };
      saveProgress(updated);
      return updated;
    });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'idle',
      score: 0,
    }));
  }, []);

  const handleBackToMenu = useCallback(() => {
    audio.stopMusic();
    setGameState(prev => ({
      ...prev,
      status: 'menu',
      score: 0,
    }));
  }, [audio]);

  return (
    <div className="game-container">
      {/* Achievement Notification */}
      {newAchievements.length > 0 && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2">
          {newAchievements.map((achievement, i) => (
            <div
              key={achievement.id}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 rounded-lg shadow-lg animate-fade-in"
              style={{ animationDelay: `${i * 200}ms` }}
            >
              <div className="flex items-center gap-2 text-white">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <p className="font-bold text-sm">{achievement.nameAr}</p>
                  <p className="text-xs opacity-90">+{achievement.reward.value} 💰</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        {showShop ? (
          <Shop
            progress={progress}
            onPurchase={handlePurchase}
            onSelect={handleSelectItem}
            onClose={() => setShowShop(false)}
          />
        ) : gameState.status === 'menu' ? (
          <div 
            className="absolute inset-0"
            style={{ background: 'var(--gradient-sky)' }}
          >
            <DifficultyMenu 
              onSelect={handleSelectDifficulty} 
              highScores={highScores}
              audioSettings={audio.settings}
              onToggleSound={audio.toggleSound}
              onToggleMusic={audio.toggleMusic}
              onUpdateAudioSettings={audio.updateSettings}
              onOpenShop={() => setShowShop(true)}
              crazyCoins={progress.totalCoins}
            />
          </div>
        ) : (
          <>
            <GameCanvas
              width={dimensions.width}
              height={dimensions.height}
              gameState={gameState}
              onStart={handleStart}
              onScoreUpdate={handleScoreUpdate}
              onGameOver={handleGameOver}
              onJump={audio.playJump}
              onScore={audio.playScore}
              onWeaponUpgrade={audio.playWeaponUpgrade}
              onShieldUpgrade={audio.playShieldUpgrade}
              selectedBird={progress.selectedBird}
              selectedWeapon={progress.selectedWeapon}
            />
            <GameUI
              gameState={gameState}
              onRestart={handleRestart}
              onBackToMenu={handleBackToMenu}
              canvasWidth={dimensions.width}
              canvasHeight={dimensions.height}
            />
          </>
        )}
      </div>
    </div>
  );
};
