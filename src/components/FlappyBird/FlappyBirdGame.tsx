import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { DifficultyMenu } from './DifficultyMenu';
import { GameState, Difficulty } from './types';

const STORAGE_KEY_EASY = 'flappy-bird-high-score-easy';
const STORAGE_KEY_HARD = 'flappy-bird-high-score-hard';

export const FlappyBirdGame = () => {
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [highScores, setHighScores] = useState<Record<Difficulty, number>>({ easy: 0, hard: 0 });
  const [gameState, setGameState] = useState<GameState>({
    status: 'menu',
    score: 0,
    highScore: 0,
    difficulty: 'easy',
  });

  // Load high scores
  useEffect(() => {
    const easyScore = parseInt(localStorage.getItem(STORAGE_KEY_EASY) || '0', 10);
    const hardScore = parseInt(localStorage.getItem(STORAGE_KEY_HARD) || '0', 10);
    setHighScores({ easy: easyScore, hard: hardScore });
  }, []);

  // Responsive dimensions optimized for mobile
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
  }, []);

  const handleScoreUpdate = useCallback((score: number) => {
    setGameState(prev => ({ ...prev, score }));
  }, []);

  const handleGameOver = useCallback((finalScore: number) => {
    setGameState(prev => {
      const storageKey = prev.difficulty === 'easy' ? STORAGE_KEY_EASY : STORAGE_KEY_HARD;
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
  }, [highScores]);

  const handleRestart = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'idle',
      score: 0,
    }));
  }, []);

  const handleBackToMenu = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'menu',
      score: 0,
    }));
  }, []);

  return (
    <div className="game-container">
      <div className="relative" style={{ width: dimensions.width, height: dimensions.height }}>
        {/* Background canvas always visible */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ 
            background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
          }}
        />
        
        {gameState.status === 'menu' ? (
          <DifficultyMenu 
            onSelect={handleSelectDifficulty} 
            highScores={highScores}
          />
        ) : (
          <>
            <GameCanvas
              width={dimensions.width}
              height={dimensions.height}
              gameState={gameState}
              onStart={handleStart}
              onScoreUpdate={handleScoreUpdate}
              onGameOver={handleGameOver}
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
