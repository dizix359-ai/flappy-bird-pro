import { GameState } from './types';

interface GameUIProps {
  gameState: GameState;
  onRestart: () => void;
  onBackToMenu: () => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const GameUI = ({ gameState, onRestart, onBackToMenu, canvasWidth, canvasHeight }: GameUIProps) => {
  const difficultyLabel = gameState.difficulty === 'easy' ? '🌱 سهل' : '🔥 صعب';

  if (gameState.status === 'playing') {
    return (
      <div 
        className="absolute top-4 left-0 right-0 flex flex-col items-center pointer-events-none"
        style={{ width: canvasWidth }}
      >
        <span className="score-display">{gameState.score}</span>
        <span className="text-xs text-card/70 mt-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          {difficultyLabel}
        </span>
      </div>
    );
  }

  if (gameState.status === 'idle') {
    return (
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div className="bg-foreground/30 backdrop-blur-sm rounded-xl px-6 py-4 text-center">
          <p className="text-lg md:text-xl text-card font-bold mb-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            {difficultyLabel}
          </p>
          <p className="text-sm text-card/90" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            اضغط للبدء!
          </p>
          <p className="text-xs text-card/70 mt-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Tap to Start
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToMenu();
          }}
          className="text-xs text-card/60 underline hover:text-card/90 transition-colors pointer-events-auto"
          style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
        >
          ← تغيير المستوى
        </button>
      </div>
    );
  }

  if (gameState.status === 'gameOver') {
    const isNewHighScore = gameState.score === gameState.highScore && gameState.score > 0;
    
    return (
      <div 
        className="game-overlay rounded-2xl"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <h2 className="text-xl md:text-3xl font-bold text-primary" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>
          انتهت اللعبة!
        </h2>
        
        <p className="text-sm text-card/80">{difficultyLabel}</p>
        
        {isNewHighScore && (
          <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg animate-bounce">
            <p className="text-sm font-bold">🎉 رقم قياسي جديد!</p>
          </div>
        )}
        
        <div className="text-center bg-card/20 backdrop-blur-sm rounded-xl px-6 py-4">
          <p className="text-sm text-card/80 mb-1">النتيجة</p>
          <p className="text-3xl text-primary font-bold">{gameState.score}</p>
          <div className="border-t border-card/30 mt-3 pt-3">
            <p className="text-xs text-card/70">أفضل نتيجة</p>
            <p className="text-lg text-accent font-bold">{gameState.highScore}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-[200px]">
          <button
            onClick={onRestart}
            className="game-button text-sm"
          >
            🔄 العب مرة أخرى
          </button>
          
          <button
            onClick={onBackToMenu}
            className="text-sm text-card/70 underline hover:text-card transition-colors"
          >
            ← القائمة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return null;
};
