// Achievements System for Flappy Bird

export interface Achievement {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  requirement: {
    type: 'score' | 'coins' | 'kills' | 'games' | 'streak';
    value: number;
    difficulty?: 'easy' | 'hard' | 'crazy';
  };
  reward: {
    type: 'coins' | 'unlock_bird' | 'unlock_weapon';
    value: number | string;
  };
}

export interface AchievementProgress {
  unlockedAchievements: string[];
  gamesPlayed: number;
  easyHighScore: number;
  hardHighScore: number;
  crazyHighScore: number;
  totalCoinsEarned: number;
  totalKills: number;
  currentStreak: number;
  bestStreak: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Score achievements
  {
    id: 'score_10',
    name: 'First Steps',
    nameAr: 'الخطوات الأولى',
    description: 'Score 10 points',
    descriptionAr: 'احصل على 10 نقاط',
    icon: '🌟',
    requirement: { type: 'score', value: 10 },
    reward: { type: 'coins', value: 50 },
  },
  {
    id: 'score_25',
    name: 'Getting Better',
    nameAr: 'تحسن ملحوظ',
    description: 'Score 25 points',
    descriptionAr: 'احصل على 25 نقطة',
    icon: '⭐',
    requirement: { type: 'score', value: 25 },
    reward: { type: 'coins', value: 100 },
  },
  {
    id: 'score_50',
    name: 'Pro Player',
    nameAr: 'لاعب محترف',
    description: 'Score 50 points',
    descriptionAr: 'احصل على 50 نقطة',
    icon: '🏆',
    requirement: { type: 'score', value: 50 },
    reward: { type: 'coins', value: 250 },
  },
  {
    id: 'score_100',
    name: 'Master',
    nameAr: 'السيد',
    description: 'Score 100 points',
    descriptionAr: 'احصل على 100 نقطة',
    icon: '👑',
    requirement: { type: 'score', value: 100 },
    reward: { type: 'coins', value: 500 },
  },
  {
    id: 'score_150',
    name: 'Legend',
    nameAr: 'الأسطورة',
    description: 'Score 150 points',
    descriptionAr: 'احصل على 150 نقطة',
    icon: '🔱',
    requirement: { type: 'score', value: 150 },
    reward: { type: 'coins', value: 1000 },
  },
  // Kill achievements
  {
    id: 'kills_10',
    name: 'Hunter',
    nameAr: 'الصياد',
    description: 'Kill 10 enemies',
    descriptionAr: 'اقتل 10 أعداء',
    icon: '🎯',
    requirement: { type: 'kills', value: 10 },
    reward: { type: 'coins', value: 100 },
  },
  {
    id: 'kills_50',
    name: 'Warrior',
    nameAr: 'المحارب',
    description: 'Kill 50 enemies',
    descriptionAr: 'اقتل 50 عدو',
    icon: '⚔️',
    requirement: { type: 'kills', value: 50 },
    reward: { type: 'coins', value: 300 },
  },
  {
    id: 'kills_100',
    name: 'Destroyer',
    nameAr: 'المدمر',
    description: 'Kill 100 enemies',
    descriptionAr: 'اقتل 100 عدو',
    icon: '💀',
    requirement: { type: 'kills', value: 100 },
    reward: { type: 'coins', value: 750 },
  },
  {
    id: 'kills_250',
    name: 'Annihilator',
    nameAr: 'المُبيد',
    description: 'Kill 250 enemies',
    descriptionAr: 'اقتل 250 عدو',
    icon: '☠️',
    requirement: { type: 'kills', value: 250 },
    reward: { type: 'coins', value: 1500 },
  },
  // Coin achievements
  {
    id: 'coins_100',
    name: 'Collector',
    nameAr: 'الجامع',
    description: 'Collect 100 coins total',
    descriptionAr: 'اجمع 100 عملة',
    icon: '💰',
    requirement: { type: 'coins', value: 100 },
    reward: { type: 'coins', value: 50 },
  },
  {
    id: 'coins_500',
    name: 'Rich',
    nameAr: 'الغني',
    description: 'Collect 500 coins total',
    descriptionAr: 'اجمع 500 عملة',
    icon: '💎',
    requirement: { type: 'coins', value: 500 },
    reward: { type: 'coins', value: 200 },
  },
  {
    id: 'coins_2500',
    name: 'Millionaire',
    nameAr: 'المليونير',
    description: 'Collect 2500 coins total',
    descriptionAr: 'اجمع 2500 عملة',
    icon: '🏦',
    requirement: { type: 'coins', value: 2500 },
    reward: { type: 'coins', value: 500 },
  },
  // Games played
  {
    id: 'games_10',
    name: 'Dedicated',
    nameAr: 'مُتفاني',
    description: 'Play 10 games',
    descriptionAr: 'العب 10 مباريات',
    icon: '🎮',
    requirement: { type: 'games', value: 10 },
    reward: { type: 'coins', value: 100 },
  },
  {
    id: 'games_50',
    name: 'Addicted',
    nameAr: 'مُدمن',
    description: 'Play 50 games',
    descriptionAr: 'العب 50 مباراة',
    icon: '🕹️',
    requirement: { type: 'games', value: 50 },
    reward: { type: 'coins', value: 300 },
  },
  // Easy mode specific
  {
    id: 'easy_30',
    name: 'Easy Champion',
    nameAr: 'بطل السهل',
    description: 'Score 30 in Easy mode',
    descriptionAr: 'احصل على 30 في الوضع السهل',
    icon: '🥉',
    requirement: { type: 'score', value: 30, difficulty: 'easy' },
    reward: { type: 'coins', value: 150 },
  },
  // Hard mode specific
  {
    id: 'hard_25',
    name: 'Hard Challenger',
    nameAr: 'متحدي الصعب',
    description: 'Score 25 in Hard mode',
    descriptionAr: 'احصل على 25 في الوضع الصعب',
    icon: '🥈',
    requirement: { type: 'score', value: 25, difficulty: 'hard' },
    reward: { type: 'coins', value: 200 },
  },
  {
    id: 'hard_50',
    name: 'Hard Master',
    nameAr: 'سيد الصعب',
    description: 'Score 50 in Hard mode',
    descriptionAr: 'احصل على 50 في الوضع الصعب',
    icon: '🏅',
    requirement: { type: 'score', value: 50, difficulty: 'hard' },
    reward: { type: 'coins', value: 400 },
  },
  // Crazy mode specific
  {
    id: 'crazy_20',
    name: 'Crazy Survivor',
    nameAr: 'الناجي المجنون',
    description: 'Score 20 in Crazy mode',
    descriptionAr: 'احصل على 20 في الوضع المجنون',
    icon: '🔥',
    requirement: { type: 'score', value: 20, difficulty: 'crazy' },
    reward: { type: 'coins', value: 300 },
  },
  {
    id: 'crazy_50',
    name: 'Crazy Legend',
    nameAr: 'أسطورة المجنون',
    description: 'Score 50 in Crazy mode',
    descriptionAr: 'احصل على 50 في الوضع المجنون',
    icon: '🌟',
    requirement: { type: 'score', value: 50, difficulty: 'crazy' },
    reward: { type: 'coins', value: 750 },
  },
];

const ACHIEVEMENT_PROGRESS_KEY = 'flappy-bird-achievements';

export const getDefaultAchievementProgress = (): AchievementProgress => ({
  unlockedAchievements: [],
  gamesPlayed: 0,
  easyHighScore: 0,
  hardHighScore: 0,
  crazyHighScore: 0,
  totalCoinsEarned: 0,
  totalKills: 0,
  currentStreak: 0,
  bestStreak: 0,
});

export const loadAchievementProgress = (): AchievementProgress => {
  try {
    const saved = localStorage.getItem(ACHIEVEMENT_PROGRESS_KEY);
    if (saved) {
      return { ...getDefaultAchievementProgress(), ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load achievement progress');
  }
  return getDefaultAchievementProgress();
};

export const saveAchievementProgress = (progress: AchievementProgress): void => {
  try {
    localStorage.setItem(ACHIEVEMENT_PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save achievement progress');
  }
};

export const checkAchievements = (
  progress: AchievementProgress,
  difficulty?: 'easy' | 'hard' | 'crazy'
): { newlyUnlocked: Achievement[]; totalReward: number } => {
  const newlyUnlocked: Achievement[] = [];
  let totalReward = 0;

  for (const achievement of ACHIEVEMENTS) {
    if (progress.unlockedAchievements.includes(achievement.id)) continue;

    const req = achievement.requirement;
    let isUnlocked = false;

    switch (req.type) {
      case 'score':
        if (req.difficulty) {
          const scoreKey = `${req.difficulty}HighScore` as keyof AchievementProgress;
          isUnlocked = (progress[scoreKey] as number) >= req.value;
        } else {
          const maxScore = Math.max(
            progress.easyHighScore,
            progress.hardHighScore,
            progress.crazyHighScore
          );
          isUnlocked = maxScore >= req.value;
        }
        break;
      case 'coins':
        isUnlocked = progress.totalCoinsEarned >= req.value;
        break;
      case 'kills':
        isUnlocked = progress.totalKills >= req.value;
        break;
      case 'games':
        isUnlocked = progress.gamesPlayed >= req.value;
        break;
      case 'streak':
        isUnlocked = progress.bestStreak >= req.value;
        break;
    }

    if (isUnlocked) {
      newlyUnlocked.push(achievement);
      if (achievement.reward.type === 'coins') {
        totalReward += achievement.reward.value as number;
      }
    }
  }

  return { newlyUnlocked, totalReward };
};
