import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AngryBirdsCanvas } from './AngryBirdsCanvas';
import { LEVELS, GameProgress, Level, BIRD_PROPERTIES } from './types';

const STORAGE_KEY = 'angry-birds-progress';

export const AngryBirdsGame = () => {
  const navigate = useNavigate();
  const [gameStatus, setGameStatus] = useState<'menu' | 'playing'>('menu');
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [progress, setProgress] = useState<GameProgress>({
    unlockedLevels: [1],
    levelStars: {},
    highScores: {},
  });
  const [showResult, setShowResult] = useState<{ score: number; stars: number } | null>(null);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch {
        // Invalid saved data
      }
    }
  }, []);

  // Save progress
  const saveProgress = (newProgress: GameProgress) => {
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  const handleLevelSelect = (level: Level) => {
    if (!progress.unlockedLevels.includes(level.id)) return;
    setSelectedLevel(level);
    setGameStatus('playing');
  };

  const handleLevelComplete = (score: number, starsEarned: number) => {
    setShowResult({ score, stars: starsEarned });
    
    if (selectedLevel && starsEarned > 0) {
      const newProgress = { ...progress };
      
      // Update stars if better
      if (!newProgress.levelStars[selectedLevel.id] || starsEarned > newProgress.levelStars[selectedLevel.id]) {
        newProgress.levelStars[selectedLevel.id] = starsEarned;
      }
      
      // Update high score
      if (!newProgress.highScores[selectedLevel.id] || score > newProgress.highScores[selectedLevel.id]) {
        newProgress.highScores[selectedLevel.id] = score;
      }
      
      // Unlock next level
      const nextLevelId = selectedLevel.id + 1;
      if (nextLevelId <= LEVELS.length && !newProgress.unlockedLevels.includes(nextLevelId)) {
        newProgress.unlockedLevels.push(nextLevelId);
      }
      
      saveProgress(newProgress);
    }
  };

  const handleBackToMenu = () => {
    setGameStatus('menu');
    setSelectedLevel(null);
    setShowResult(null);
  };

  const handleNextLevel = () => {
    if (selectedLevel) {
      const nextLevel = LEVELS.find(l => l.id === selectedLevel.id + 1);
      if (nextLevel && progress.unlockedLevels.includes(nextLevel.id)) {
        setSelectedLevel(nextLevel);
        setShowResult(null);
      } else {
        handleBackToMenu();
      }
    }
  };

  const handleRetry = () => {
    setShowResult(null);
    // Force re-render by toggling status
    setGameStatus('menu');
    setTimeout(() => {
      setGameStatus('playing');
    }, 10);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-400 via-red-500 to-red-700 flex flex-col items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {gameStatus === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <motion.h1
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg mb-2"
              >
                الطيور الغاضبة
              </motion.h1>
              <p className="text-white/80 text-lg">ضد الخنازير الحديدية الغازية!</p>
              
              <button
                onClick={() => navigate('/')}
                className="mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-2 rounded-full text-white font-bold transition-all"
              >
                ← العودة للألعاب
              </button>
            </div>

            {/* Bird Types Legend */}
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-4 mb-6">
              <h3 className="text-white font-bold mb-3 text-center">أنواع الطيور</h3>
              <div className="flex flex-wrap justify-center gap-4">
                {(['red', 'yellow', 'black', 'white'] as const).map(type => (
                  <div key={type} className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: BIRD_PROPERTIES[type].color }}
                    />
                    <div className="text-white text-sm">
                      <div className="font-bold">{BIRD_PROPERTIES[type].description}</div>
                      <div className="text-white/60 text-xs">{BIRD_PROPERTIES[type].special}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Levels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LEVELS.map(level => {
                const isUnlocked = progress.unlockedLevels.includes(level.id);
                const stars = progress.levelStars[level.id] || 0;
                const highScore = progress.highScores[level.id] || 0;
                
                return (
                  <motion.div
                    key={level.id}
                    whileHover={isUnlocked ? { scale: 1.05 } : {}}
                    whileTap={isUnlocked ? { scale: 0.98 } : {}}
                    onClick={() => handleLevelSelect(level)}
                    className={`
                      relative p-6 rounded-2xl cursor-pointer transition-all
                      ${isUnlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg hover:shadow-xl'
                        : 'bg-gray-600/50 cursor-not-allowed'
                      }
                    `}
                  >
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl">🔒</span>
                      </div>
                    )}
                    
                    <div className={isUnlocked ? 'text-white' : 'text-white/30'}>
                      <div className="text-lg font-bold mb-1">المستوى {level.id}</div>
                      <div className="text-2xl font-bold mb-2">{level.nameAr}</div>
                      <div className="text-sm opacity-80">{level.name}</div>
                      
                      {isUnlocked && (
                        <>
                          {/* Stars */}
                          <div className="flex gap-1 mt-3">
                            {[1, 2, 3].map(i => (
                              <span
                                key={i}
                                className={`text-2xl ${i <= stars ? '' : 'opacity-30'}`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                          
                          {highScore > 0 && (
                            <div className="text-sm mt-2 opacity-80">
                              أعلى نتيجة: {highScore}
                            </div>
                          )}
                          
                          {/* Birds preview */}
                          <div className="flex gap-1 mt-3">
                            {level.birds.map((type, i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full border-2 border-white/50"
                                style={{ backgroundColor: BIRD_PROPERTIES[type].color }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            {selectedLevel && (
              <AngryBirdsCanvas
                level={selectedLevel}
                onLevelComplete={handleLevelComplete}
                onBackToMenu={handleBackToMenu}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
            onClick={handleBackToMenu}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={e => e.stopPropagation()}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-3xl text-center text-white shadow-2xl max-w-md"
            >
              <h2 className="text-3xl font-bold mb-4">
                {showResult.stars > 0 ? '🎉 أحسنت! 🎉' : '😅 حاول مرة أخرى!'}
              </h2>
              
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3].map(i => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className={`text-5xl ${i <= showResult.stars ? '' : 'opacity-30'}`}
                  >
                    ⭐
                  </motion.span>
                ))}
              </div>
              
              <p className="text-2xl font-bold mb-6">النتيجة: {showResult.score}</p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full font-bold transition-all"
                >
                  🔄 إعادة
                </button>
                
                {showResult.stars > 0 && selectedLevel && selectedLevel.id < LEVELS.length && (
                  <button
                    onClick={handleNextLevel}
                    className="bg-white text-orange-500 hover:bg-white/90 px-6 py-3 rounded-full font-bold transition-all"
                  >
                    المستوى التالي ➡️
                  </button>
                )}
                
                <button
                  onClick={handleBackToMenu}
                  className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-full font-bold transition-all"
                >
                  القائمة
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
