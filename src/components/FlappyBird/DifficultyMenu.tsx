import { Difficulty } from './types';

interface DifficultyMenuProps {
  onSelect: (difficulty: Difficulty) => void;
  highScores: Record<Difficulty, number>;
}

export const DifficultyMenu = ({ onSelect, highScores }: DifficultyMenuProps) => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 px-4 z-10">
      <h1 className="game-title text-2xl md:text-4xl lg:text-5xl mb-2">Flappy Bird</h1>
      
      <div className="floating my-2">
        <svg width="70" height="52" viewBox="0 0 60 45" className="drop-shadow-lg">
          <ellipse cx="30" cy="22" rx="25" ry="18" fill="#FFD700" stroke="#E6A800" strokeWidth="2"/>
          <ellipse cx="22" cy="22" rx="10" ry="7" fill="#FFA500" stroke="#CC7000" strokeWidth="1"/>
          <circle cx="40" cy="17" r="7" fill="white"/>
          <circle cx="42" cy="17" r="3.5" fill="black"/>
          <circle cx="43" cy="15" r="1.5" fill="white"/>
          <path d="M50 22 L65 24 L50 28 Z" fill="#FF6600"/>
        </svg>
      </div>

      <p className="text-sm md:text-base text-card font-medium mb-2" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
        اختر مستوى الصعوبة
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {/* Easy Mode */}
        <button
          onClick={() => onSelect('easy')}
          className="difficulty-button easy-mode group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div className="text-right">
                <p className="font-bold text-lg">سهل</p>
                <p className="text-xs opacity-80">Easy Mode</p>
              </div>
            </div>
            {highScores.easy > 0 && (
              <div className="text-left">
                <p className="text-xs opacity-70">أفضل</p>
                <p className="font-bold">{highScores.easy}</p>
              </div>
            )}
          </div>
        </button>

        {/* Hard Mode */}
        <button
          onClick={() => onSelect('hard')}
          className="difficulty-button hard-mode group"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div className="text-right">
                <p className="font-bold text-lg">صعب</p>
                <p className="text-xs opacity-80">Hard Mode</p>
              </div>
            </div>
            {highScores.hard > 0 && (
              <div className="text-left">
                <p className="text-xs opacity-70">أفضل</p>
                <p className="font-bold">{highScores.hard}</p>
              </div>
            )}
          </div>
        </button>
      </div>

      <p className="text-xs text-card/60 mt-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>
        تجنب الأنابيب واجمع أكبر عدد من النقاط!
      </p>
    </div>
  );
};
