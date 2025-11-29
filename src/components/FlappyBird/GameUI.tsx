import { GameState } from './types';

interface GameUIProps {
  gameState: GameState;
  onRestart: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const GameUI = ({ gameState, onRestart, canvasWidth, canvasHeight }: GameUIProps) => {
  if (gameState.status === 'playing') {
    return (
      <div 
        className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none"
        style={{ width: canvasWidth }}
      >
        <span className="score-display">{gameState.score}</span>
      </div>
    );
  }

  if (gameState.status === 'idle') {
    return (
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center gap-8"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <h1 className="game-title">Flappy Bird</h1>
        <div className="text-center space-y-2">
          <p className="text-sm md:text-base text-card opacity-90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            اضغط للطيران
          </p>
          <p className="text-xs text-card opacity-70" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Tap or Space to fly
          </p>
        </div>
        {gameState.highScore > 0 && (
          <div className="text-center">
            <p className="text-xs text-card opacity-80" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
              أفضل نتيجة: {gameState.highScore}
            </p>
          </div>
        )}
        <div className="floating">
          <svg width="60" height="45" viewBox="0 0 60 45" className="drop-shadow-lg">
            <ellipse cx="30" cy="22" rx="25" ry="18" fill="#FFD700" stroke="#E6A800" strokeWidth="2"/>
            <ellipse cx="22" cy="22" rx="10" ry="7" fill="#FFA500" stroke="#CC7000" strokeWidth="1"/>
            <circle cx="40" cy="17" r="7" fill="white"/>
            <circle cx="42" cy="17" r="3.5" fill="black"/>
            <path d="M50 22 L65 24 L50 28 Z" fill="#FF6600"/>
          </svg>
        </div>
      </div>
    );
  }

  if (gameState.status === 'gameOver') {
    return (
      <div 
        className="game-overlay rounded-2xl"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <h2 className="text-2xl md:text-4xl font-bold text-primary" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>
          انتهت اللعبة!
        </h2>
        <div className="text-center space-y-3">
          <p className="text-lg md:text-2xl text-card">
            النتيجة: <span className="text-primary font-bold">{gameState.score}</span>
          </p>
          <p className="text-sm md:text-lg text-card opacity-80">
            أفضل نتيجة: <span className="text-accent font-bold">{gameState.highScore}</span>
          </p>
        </div>
        <button
          onClick={onRestart}
          className="game-button text-sm md:text-lg"
        >
          العب مرة أخرى
        </button>
      </div>
    );
  }

  return null;
};
