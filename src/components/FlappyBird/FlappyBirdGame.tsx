import { useState, useEffect, useCallback } from 'react';
import { GameCanvas } from './GameCanvas';
import { GameUI } from './GameUI';
import { GameState } from './types';

const STORAGE_KEY = 'flappy-bird-high-score';

export const FlappyBirdGame = () => {
  const [dimensions, setDimensions] = useState({ width: 400, height: 600 });
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    score: 0,
    highScore: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setGameState(prev => ({ ...prev, highScore: parseInt(saved, 10) }));
    }
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      const maxWidth = Math.min(window.innerWidth - 16, 450);
      const maxHeight = Math.min(window.innerHeight - 32, 700);
      const aspectRatio = 0.67;
      
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
      const newHighScore = Math.max(prev.highScore, finalScore);
      if (newHighScore > prev.highScore) {
        localStorage.setItem(STORAGE_KEY, newHighScore.toString());
      }
      return {
        ...prev,
        status: 'gameOver',
        score: finalScore,
        highScore: newHighScore,
      };
    });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      status: 'idle',
      score: 0,
    }));
  }, []);

  return (
    <div className="game-container">
      <div className="relative">
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
          canvasWidth={dimensions.width}
          canvasHeight={dimensions.height}
        />
      </div>
    </div>
  );
};
