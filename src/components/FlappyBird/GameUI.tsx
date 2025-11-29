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
        className="absolute top-4 left-0 right-0 flex flex-col items-center pointer-events-none z-10"
        style={{ width: canvasWidth }}
      >
        <span className="score-display">{gameState.score}</span>
        <span className="text-xs text-white/80 mt-1" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          {difficultyLabel}
        </span>
      </div>
    );
  }

  if (gameState.status === 'idle') {
    // UI is overlay but allows touches to pass through to canvas
    return (
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 z-10 pointer-events-none"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <div className="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-5 text-center pointer-events-none">
          <p className="text-lg md:text-xl text-white font-bold mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            {difficultyLabel}
          </p>
          <p className="text-base md:text-lg text-white" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            👆 اضغط للبدء!
          </p>
          <p className="text-xs text-white/70 mt-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Tap anywhere to Start
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBackToMenu();
          }}
          className="text-sm text-white/80 underline hover:text-white transition-colors pointer-events-auto bg-black/30 px-4 py-2 rounded-lg active:scale-95"
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
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 z-10"
        style={{ 
          width: canvasWidth, 
          height: canvasHeight,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)'
        }}
      >
        <h2 className="text-xl md:text-3xl font-bold text-yellow-400" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.4)' }}>
          انتهت اللعبة!
        </h2>
        
        <p className="text-sm text-white/80">{difficultyLabel}</p>
        
        {isNewHighScore && (
          <div className="bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg animate-bounce">
            <p className="text-sm font-bold">🎉 رقم قياسي جديد!</p>
          </div>
        )}
        
        <div className="text-center bg-white/20 backdrop-blur-sm rounded-xl px-8 py-5">
          <p className="text-sm text-white/80 mb-1">النتيجة</p>
          <p className="text-4xl text-yellow-400 font-bold">{gameState.score}</p>
          <div className="border-t border-white/30 mt-4 pt-4">
            <p className="text-xs text-white/70">أفضل نتيجة</p>
            <p className="text-xl text-orange-400 font-bold">{gameState.highScore}</p>
          </div>
        </div>
        
        <div className="flex flex-col gap-3 w-full max-w-[220px]">
          <button
            onClick={onRestart}
            className="game-button text-sm py-3 active:scale-95"
          >
            🔄 العب مرة أخرى
          </button>
          
          <button
            onClick={onBackToMenu}
            className="text-sm text-white/70 underline hover:text-white transition-colors bg-black/20 px-4 py-2 rounded-lg active:scale-95"
          >
            ← القائمة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return null;
};
