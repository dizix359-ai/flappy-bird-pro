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
    if (selectedLevel) {
      // Find the original level to get clean data
      const originalLevel = LEVELS.find(l => l.id === selectedLevel.id);
      if (originalLevel) {
        // Create a fresh copy with a timestamp to force re-mount
        const freshLevel: Level = {
          ...originalLevel,
          birds: [...originalLevel.birds],
          pigs: originalLevel.pigs.map(p => ({ ...p })),
          blocks: originalLevel.blocks.map(b => ({ ...b })),
          stars: [...originalLevel.stars] as [number, number, number],
        };
        setSelectedLevel(null);
        // Use requestAnimationFrame for more reliable timing
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setSelectedLevel(freshLevel);
          });
        });
      }
    }
  };

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-700 to-emerald-600 flex flex-col items-center justify-center p-2 md:p-4 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Stars */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
            }}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Floating clouds */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`cloud-${i}`}
            className="absolute bg-white/20 rounded-full blur-xl"
            style={{
              width: 100 + Math.random() * 150,
              height: 40 + Math.random() * 30,
              top: `${10 + Math.random() * 30}%`,
            }}
            animate={{
              x: [-200, window.innerWidth + 200],
            }}
            transition={{
              duration: 30 + Math.random() * 20,
              repeat: Infinity,
              delay: i * 8,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {gameStatus === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-5xl z-10 px-2"
          >
            {/* Header */}
            <div className="text-center mb-4 md:mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="relative inline-block"
              >
                {/* Title glow effect */}
                <div className="absolute inset-0 blur-xl bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 opacity-50" />
                <h1 className={`relative font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-orange-400 to-red-600 drop-shadow-2xl mb-2 tracking-tight
                  ${isMobile ? 'text-3xl' : 'text-5xl md:text-7xl'}
                `}>
                  الطيور الغاضبة
                </h1>
              </motion.div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-white/90 font-medium mt-2 ${isMobile ? 'text-sm' : 'text-xl'}`}
              >
                ⚔️ ضد الخنازير الحديدية الغازية! ⚔️
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate('/')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`mt-4 md:mt-6 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl text-white font-bold transition-all border border-white/30 shadow-lg
                  ${isMobile ? 'px-4 py-2 text-sm' : 'px-8 py-3'}
                `}
              >
                ← العودة للألعاب
              </motion.button>
            </div>

            {/* Bird Types Legend - Collapsible on mobile */}
            {!isMobile && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg rounded-3xl p-6 mb-8 border border-white/10 shadow-2xl"
              >
                <h3 className="text-white font-bold mb-4 text-center text-lg">🐦 أنواع الطيور</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {(['red', 'yellow', 'black', 'white'] as const).map((type, index) => (
                    <motion.div 
                      key={type} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="flex items-center gap-3 bg-gradient-to-r from-white/15 to-white/5 rounded-2xl px-5 py-3 border border-white/10 shadow-lg"
                    >
                      <div
                        className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl border-2 border-white/30"
                        style={{ 
                          background: `radial-gradient(circle at 30% 30%, ${BIRD_PROPERTIES[type].color}aa, ${BIRD_PROPERTIES[type].color})`,
                          boxShadow: `0 4px 15px ${BIRD_PROPERTIES[type].color}50`
                        }}
                      >
                        {type === 'red' && '😠'}
                        {type === 'yellow' && '⚡'}
                        {type === 'black' && '💣'}
                        {type === 'white' && '🥚'}
                      </div>
                      <div className="text-white">
                        <div className="font-bold text-sm">{BIRD_PROPERTIES[type].description}</div>
                        <div className="text-white/60 text-xs">{BIRD_PROPERTIES[type].special}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Levels Grid */}
            <div className={`grid gap-3 md:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              {LEVELS.map((level, index) => {
                const isUnlocked = progress.unlockedLevels.includes(level.id);
                const stars = progress.levelStars[level.id] || 0;
                const highScore = progress.highScores[level.id] || 0;
                
                return (
                  <motion.div
                    key={level.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.08 }}
                    whileHover={isUnlocked ? { scale: 1.03, y: -5 } : {}}
                    whileTap={isUnlocked ? { scale: 0.98 } : {}}
                    onClick={() => handleLevelSelect(level)}
                    className={`
                      relative rounded-2xl md:rounded-3xl cursor-pointer transition-all overflow-hidden
                      ${isMobile ? 'p-3' : 'p-6'}
                      ${isUnlocked
                        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-2xl hover:shadow-orange-500/40'
                        : 'bg-gradient-to-br from-slate-600/50 to-slate-800/50 cursor-not-allowed border border-white/10'
                      }
                    `}
                  >
                    {/* Decorative elements for unlocked levels */}
                    {isUnlocked && (
                      <>
                        <div className="absolute top-0 right-0 w-20 md:w-32 h-20 md:h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-16 md:w-24 h-16 md:h-24 bg-black/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                      </>
                    )}
                    
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-2xl md:rounded-3xl">
                        <motion.span 
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`drop-shadow-lg ${isMobile ? 'text-4xl' : 'text-7xl'}`}
                        >
                          🔒
                        </motion.span>
                      </div>
                    )}
                    
                    <div className={`relative ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                      <div className="flex items-center justify-between mb-1 md:mb-2">
                        <span className={`font-medium bg-white/20 rounded-full ${isMobile ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}`}>
                          المستوى {level.id}
                        </span>
                        {isUnlocked && highScore > 0 && !isMobile && (
                          <span className="text-xs bg-black/20 px-2 py-1 rounded-full">
                            🏆 {highScore}
                          </span>
                        )}
                      </div>
                      
                      <h3 className={`font-black mb-0.5 md:mb-1 ${isMobile ? 'text-lg' : 'text-3xl'}`}>{level.nameAr}</h3>
                      {!isMobile && <p className="text-sm opacity-80 font-medium">{level.name}</p>}
                      
                      {isUnlocked && (
                        <>
                          {/* Stars */}
                          <div className={`flex ${isMobile ? 'gap-1 mt-2' : 'gap-2 mt-4'}`}>
                            {[1, 2, 3].map(i => (
                              <motion.span
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
                                className={`drop-shadow-lg ${i <= stars ? '' : 'opacity-30 grayscale'} ${isMobile ? 'text-xl' : 'text-3xl'}`}
                              >
                                ⭐
                              </motion.span>
                            ))}
                          </div>
                          
                          {/* Birds preview */}
                          <div className={`flex ${isMobile ? 'gap-1 mt-2' : 'gap-2 mt-4'}`}>
                            {level.birds.slice(0, isMobile ? 4 : level.birds.length).map((type, i) => (
                              <motion.div
                                key={i}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.4 + i * 0.05 }}
                                className={`rounded-full border-2 border-white/50 shadow-md ${isMobile ? 'w-5 h-5' : 'w-8 h-8'}`}
                                style={{ 
                                  background: `radial-gradient(circle at 30% 30%, ${BIRD_PROPERTIES[type].color}cc, ${BIRD_PROPERTIES[type].color})`
                                }}
                              />
                            ))}
                            {isMobile && level.birds.length > 4 && (
                              <span className="text-xs text-white/70">+{level.birds.length - 4}</span>
                            )}
                          </div>
                          
                          {/* Play button */}
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className={`bg-white/20 hover:bg-white/30 rounded-xl md:rounded-2xl text-center font-bold transition-all
                              ${isMobile ? 'mt-2 py-2 text-sm' : 'mt-4 py-3'}
                            `}
                          >
                            ▶️ {isMobile ? 'العب' : 'العب الآن'}
                          </motion.div>
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
            className="relative z-10"
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
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
            onClick={handleBackToMenu}
          >
          <motion.div
            initial={{ scale: 0.8, y: 50, rotateX: 20 }}
            animate={{ scale: 1, y: 0, rotateX: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            onClick={e => e.stopPropagation()}
            className={`bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 rounded-2xl md:rounded-[2rem] text-center text-white shadow-2xl border-4 border-white/20
              ${isMobile ? 'p-6 max-w-xs mx-4' : 'p-10 max-w-md'}
            `}
          >
            <motion.h2 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", bounce: 0.6 }}
              className={`font-black mb-4 md:mb-6 ${isMobile ? 'text-2xl' : 'text-4xl'}`}
            >
              {showResult.stars > 0 ? '🎉 أحسنت! 🎉' : '💪 حاول مرة أخرى!'}
            </motion.h2>
            
            <div className="flex justify-center gap-2 md:gap-3 mb-4 md:mb-6">
              {[1, 2, 3].map(i => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: i * 0.15, type: "spring", bounce: 0.6 }}
                  className={`drop-shadow-lg ${i <= showResult.stars ? '' : 'opacity-30 grayscale'} ${isMobile ? 'text-4xl' : 'text-6xl'}`}
                >
                  ⭐
                </motion.span>
              ))}
            </div>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className={`font-black mb-4 md:mb-8 ${isMobile ? 'text-xl' : 'text-3xl'}`}
            >
              النتيجة: <span className="text-yellow-300">{showResult.score}</span>
            </motion.p>
            
            <div className={`flex gap-2 md:gap-3 justify-center ${isMobile ? 'flex-col' : 'flex-wrap'}`}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRetry}
              className={`bg-white/20 hover:bg-white/30 rounded-xl md:rounded-2xl font-bold transition-all border border-white/30
                ${isMobile ? 'px-4 py-2.5 text-sm w-full' : 'px-6 py-3'}
              `}
            >
              🔄 إعادة
            </motion.button>
            
            {showResult.stars > 0 && selectedLevel && selectedLevel.id < LEVELS.length && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNextLevel}
                className={`bg-white text-orange-600 hover:bg-white/90 rounded-xl md:rounded-2xl font-bold transition-all shadow-lg
                  ${isMobile ? 'px-4 py-2.5 text-sm w-full' : 'px-6 py-3'}
                `}
              >
                المستوى التالي ➡️
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBackToMenu}
              className={`bg-red-700 hover:bg-red-800 rounded-xl md:rounded-2xl font-bold transition-all border border-red-500/50
                ${isMobile ? 'px-4 py-2.5 text-sm w-full' : 'px-6 py-3'}
              `}
            >
              القائمة
            </motion.button>
          </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
