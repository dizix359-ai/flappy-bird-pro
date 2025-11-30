import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { DifficultyMenu } from './DifficultyMenu';
import { GameState, Difficulty } from './types';
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

  const handleGameOver = useCallback((finalScore: number) => {
    audio.stopMusic();
    audio.playGameOver();
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
  }, [highScores, audio]);

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
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{ 
          width: dimensions.width, 
          height: dimensions.height,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        {gameState.status === 'menu' ? (
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
