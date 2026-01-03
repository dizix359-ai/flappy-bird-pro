import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const GameSelect = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: 'flappy-bird',
      title: 'Flappy Bird',
      titleAr: 'الطائر الخفاق',
      description: 'تجنب الأنابيب واجمع العملات في هذه اللعبة الكلاسيكية المثيرة!',
      path: '/flappy-bird',
      gradient: 'from-sky-400 via-cyan-500 to-blue-600',
      iconGradient: 'from-yellow-400 to-orange-500',
      shadowColor: 'shadow-cyan-500/50',
    },
    {
      id: 'angry-birds',
      title: 'Angry Birds',
      titleAr: 'الطيور الغاضبة',
      description: 'أطلق الطيور لتدمير الخنازير الحديدية الغازية من عالم آخر!',
      path: '/angry-birds',
      gradient: 'from-red-500 via-orange-500 to-yellow-500',
      iconGradient: 'from-red-600 to-red-800',
      shadowColor: 'shadow-red-500/50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden relative">
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          />
        ))}
      </div>

      {/* Title */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 mb-4 drop-shadow-lg">
          اختر لعبتك
        </h1>
        <p className="text-lg md:text-xl text-white/70">
          Choose Your Game
        </p>
      </motion.div>

      {/* Game Cards */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-10 relative z-10 w-full max-w-4xl px-4">
        {games.map((game, index) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.2 }}
            whileHover={{ scale: 1.05, y: -10 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(game.path)}
            className={`
              flex-1 cursor-pointer rounded-3xl p-1 bg-gradient-to-br ${game.gradient}
              shadow-2xl ${game.shadowColor} hover:shadow-3xl transition-all duration-300
            `}
          >
            <div className="bg-slate-900/90 backdrop-blur-sm rounded-[22px] p-6 md:p-8 h-full flex flex-col items-center text-center">
              {/* Game Icon */}
              <div className={`
                w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br ${game.iconGradient}
                flex items-center justify-center mb-6 shadow-lg
              `}>
                {game.id === 'flappy-bird' ? (
                  <FlappyBirdIcon />
                ) : (
                  <AngryBirdIcon />
                )}
              </div>

              {/* Title */}
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {game.title}
              </h2>
              <h3 className="text-lg md:text-xl font-semibold text-white/80 mb-4">
                {game.titleAr}
              </h3>

              {/* Description */}
              <p className="text-white/60 text-sm md:text-base leading-relaxed">
                {game.description}
              </p>

              {/* Play Button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`
                  mt-6 px-8 py-3 rounded-full bg-gradient-to-r ${game.gradient}
                  text-white font-bold text-lg shadow-lg
                `}
              >
                العب الآن
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 text-white/40 text-sm relative z-10"
      >
        © 2024 Bird Games Collection
      </motion.p>
    </div>
  );
};

const FlappyBirdIcon = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-20 md:h-20">
    {/* Bird body */}
    <ellipse cx="50" cy="50" rx="35" ry="30" fill="#FFD93D" />
    {/* Wing */}
    <ellipse cx="35" cy="55" rx="15" ry="10" fill="#FFA726" />
    {/* Eye */}
    <circle cx="60" cy="40" r="12" fill="white" />
    <circle cx="63" cy="40" r="6" fill="black" />
    <circle cx="65" cy="38" r="2" fill="white" />
    {/* Beak */}
    <ellipse cx="80" cy="50" rx="15" ry="8" fill="#FF5722" />
  </svg>
);

const AngryBirdIcon = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16 md:w-20 md:h-20">
    {/* Bird body */}
    <circle cx="50" cy="55" r="35" fill="#E53935" />
    {/* Belly */}
    <ellipse cx="50" cy="70" rx="20" ry="15" fill="#FFCDD2" />
    {/* Eyes */}
    <ellipse cx="40" cy="45" rx="10" ry="12" fill="white" />
    <ellipse cx="60" cy="45" rx="10" ry="12" fill="white" />
    <circle cx="42" cy="47" r="5" fill="black" />
    <circle cx="62" cy="47" r="5" fill="black" />
    {/* Eyebrows (angry) */}
    <rect x="30" y="32" width="18" height="4" fill="#5D4037" transform="rotate(15 39 34)" />
    <rect x="52" y="32" width="18" height="4" fill="#5D4037" transform="rotate(-15 61 34)" />
    {/* Beak */}
    <polygon points="50,55 40,65 50,75 60,65" fill="#FF9800" />
    {/* Top feathers */}
    <ellipse cx="50" cy="22" rx="4" ry="8" fill="#E53935" />
    <ellipse cx="45" cy="24" rx="3" ry="6" fill="#E53935" />
  </svg>
);

export default GameSelect;
