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
        className="absolute top-6 left-0 right-0 flex justify-center pointer-events-none"
        style={{ width: canvasWidth }}
      >
        <span className="score-display animate-pulse-once">{gameState.score}</span>
      </div>
    );
  }

  if (gameState.status === 'idle') {
    return (
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4"
        style={{ width: canvasWidth, height: canvasHeight }}
      >
        <h1 className="game-title text-2xl md:text-4xl lg:text-5xl">Flappy Bird</h1>
        
        <div className="floating my-4">
          <svg width="70" height="52" viewBox="0 0 60 45" className="drop-shadow-lg">
            <ellipse cx="30" cy="22" rx="25" ry="18" fill="#FFD700" stroke="#E6A800" strokeWidth="2"/>
            <ellipse cx="22" cy="22" rx="10" ry="7" fill="#FFA500" stroke="#CC7000" strokeWidth="1"/>
            <circle cx="40" cy="17" r="7" fill="white"/>
            <circle cx="42" cy="17" r="3.5" fill="black"/>
            <circle cx="43" cy="15" r="1.5" fill="white"/>
            <path d="M50 22 L65 24 L50 28 Z" fill="#FF6600"/>
          </svg>
        </div>

        <div className="text-center space-y-3 bg-foreground/20 backdrop-blur-sm rounded-xl px-6 py-4">
          <p className="text-base md:text-lg text-card font-medium" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            اضغط أو انقر للطيران
          </p>
          <p className="text-xs md:text-sm text-card/80" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
            Tap anywhere or press Space to fly
          </p>
        </div>

        {gameState.highScore > 0 && (
          <div className="text-center bg-accent/90 rounded-lg px-4 py-2">
            <p className="text-xs md:text-sm text-accent-foreground font-bold">
              🏆 أفضل نتيجة: {gameState.highScore}
            </p>
          </div>
        )}

        <div className="text-xs text-card/60 mt-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          تجنب الأنابيب واجمع النقاط!
        </div>
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
        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-primary" style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}>
          انتهت اللعبة!
        </h2>
        
        {isNewHighScore && (
          <div className="bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg animate-bounce">
            <p className="text-sm md:text-base font-bold">🎉 رقم قياسي جديد!</p>
          </div>
        )}
        
        <div className="text-center space-y-4 bg-card/20 backdrop-blur-sm rounded-xl px-8 py-6">
          <div>
            <p className="text-sm text-card/80 mb-1">النتيجة</p>
            <p className="text-3xl md:text-4xl text-primary font-bold">{gameState.score}</p>
          </div>
          <div className="border-t border-card/30 pt-4">
            <p className="text-xs text-card/70 mb-1">أفضل نتيجة</p>
            <p className="text-lg md:text-xl text-accent font-bold">{gameState.highScore}</p>
          </div>
        </div>
        
        <button
          onClick={onRestart}
          className="game-button text-sm md:text-base mt-4"
        >
          🔄 العب مرة أخرى
        </button>
        
        <p className="text-xs text-card/50 mt-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
          انقر في أي مكان للبدء
        </p>
      </div>
    );
  }

  return null;
};
