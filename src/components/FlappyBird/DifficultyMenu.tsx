import { Difficulty } from './types';
import { AboutDialog } from './AboutDialog';
import { ThemeToggle } from './ThemeToggle';
import { SettingsDialog } from './SettingsDialog';

interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
}

interface DifficultyMenuProps {
  onSelect: (difficulty: Difficulty) => void;
  highScores: Record<Difficulty, number>;
  audioSettings: AudioSettings;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onUpdateAudioSettings: (settings: Partial<AudioSettings>) => void;
  onOpenShop?: () => void;
  onOpenLeaderboard?: () => void;
  crazyCoins?: number;
}

export const DifficultyMenu = ({ 
  onSelect, 
  highScores,
  audioSettings,
  onToggleSound,
  onToggleMusic,
  onUpdateAudioSettings,
  onOpenShop,
  onOpenLeaderboard,
  crazyCoins = 0,
}: DifficultyMenuProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-5 px-6 relative">
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="flex gap-2">
          <AboutDialog />
          <SettingsDialog
            settings={audioSettings}
            onToggleSound={onToggleSound}
            onToggleMusic={onToggleMusic}
            onUpdateSettings={onUpdateAudioSettings}
          />
        </div>
        <ThemeToggle />
      </div>
      <h1 className="game-title text-2xl md:text-4xl mb-2">Flappy Bird</h1>
      
      <div className="floating my-3">
        <svg width="70" height="52" viewBox="0 0 60 45" className="drop-shadow-lg">
          <ellipse cx="30" cy="22" rx="25" ry="18" fill="#FFD700" stroke="#E6A800" strokeWidth="2"/>
          <ellipse cx="22" cy="22" rx="10" ry="7" fill="#FFA500" stroke="#CC7000" strokeWidth="1"/>
          <circle cx="40" cy="17" r="7" fill="white"/>
          <circle cx="42" cy="17" r="3.5" fill="black"/>
          <circle cx="43" cy="15" r="1.5" fill="white"/>
          <path d="M50 22 L65 24 L50 28 Z" fill="#FF6600"/>
        </svg>
      </div>

      <p className="text-sm md:text-base text-white font-medium" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.5)' }}>
        اختر مستوى الصعوبة
      </p>

      <div className="flex flex-col gap-3 w-full max-w-[280px]">
        {/* Easy Mode */}
        <button
          onClick={() => onSelect('easy')}
          className="difficulty-button easy-mode"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div className="text-right">
                <p className="font-bold text-base md:text-lg">سهل</p>
                <p className="text-xs opacity-80">Easy Mode</p>
              </div>
            </div>
            {highScores.easy > 0 && (
              <div className="text-left bg-white/20 rounded-lg px-3 py-1">
                <p className="text-xs opacity-80">أفضل</p>
                <p className="font-bold text-sm">{highScores.easy}</p>
              </div>
            )}
          </div>
        </button>

        {/* Hard Mode */}
        <button
          onClick={() => onSelect('hard')}
          className="difficulty-button hard-mode"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div className="text-right">
                <p className="font-bold text-base md:text-lg">صعب</p>
                <p className="text-xs opacity-80">Hard Mode</p>
              </div>
            </div>
            {highScores.hard > 0 && (
              <div className="text-left bg-white/20 rounded-lg px-3 py-1">
                <p className="text-xs opacity-80">أفضل</p>
                <p className="font-bold text-sm">{highScores.hard}</p>
              </div>
            )}
          </div>
        </button>

        {/* Crazy Mode */}
        <button
          onClick={() => onSelect('crazy')}
          className="difficulty-button crazy-mode"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💀</span>
              <div className="text-right">
                <p className="font-bold text-base md:text-lg">مجنون</p>
                <p className="text-xs opacity-80">Crazy Mode</p>
              </div>
            </div>
            {highScores.crazy > 0 && (
              <div className="text-left bg-white/20 rounded-lg px-3 py-1">
                <p className="text-xs opacity-80">أفضل</p>
                <p className="font-bold text-sm">{highScores.crazy}</p>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Buttons Row */}
      <div className="flex gap-3 mt-3">
        {/* Shop Button */}
        {onOpenShop && (
          <button
            onClick={onOpenShop}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:scale-105"
          >
            <span className="text-lg">🛒</span>
            <span>المتجر</span>
            <span className="bg-yellow-500/30 px-2 py-0.5 rounded-full text-yellow-300 text-sm">
              💰 {crazyCoins}
            </span>
          </button>
        )}

        {/* Leaderboard Button */}
        {onOpenLeaderboard && (
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:scale-105"
          >
            <span className="text-lg">🏆</span>
            <span>المتصدرين</span>
          </button>
        )}
      </div>

      <p className="text-xs text-white/70 mt-2 text-center" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>
        تجنب الأنابيب واجمع أكبر عدد من النقاط!
      </p>
    </div>
  );
};
