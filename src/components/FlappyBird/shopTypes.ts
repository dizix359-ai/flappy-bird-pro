// Shop types for Crazy Mode

export interface ShopBird {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  unlockRequirement?: {
    type: 'score' | 'coins' | 'kills';
    value: number;
  };
  colors: {
    body: string;
    bodyHighlight: string;
    wing: string;
    wingHighlight: string;
    beak: string;
    eye: string;
  };
  special?: string;
}

export interface ShopWeapon {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  unlockRequirement?: {
    type: 'score' | 'coins' | 'kills';
    value: number;
  };
  damage: number;
  fireRate: number;
  bulletColor: string;
  special?: string;
}

export interface PlayerProgress {
  totalCoins: number;
  highestScore: number;
  totalKills: number;
  purchasedBirds: string[];
  purchasedWeapons: string[];
  selectedBird: string;
  selectedWeapon: string;
}

export const SHOP_BIRDS: ShopBird[] = [
  {
    id: 'classic',
    name: 'Classic Bird',
    nameAr: 'الطائر الكلاسيكي',
    price: 0,
    colors: {
      body: '#FFD700',
      bodyHighlight: '#FFA500',
      wing: '#FFA500',
      wingHighlight: '#CC7000',
      beak: '#FF6600',
      eye: '#000000',
    },
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    nameAr: 'طائر الفينيكس',
    price: 2500,
    unlockRequirement: { type: 'score', value: 50 },
    colors: {
      body: '#FF4500',
      bodyHighlight: '#FF6347',
      wing: '#FF8C00',
      wingHighlight: '#FF4500',
      beak: '#FFD700',
      eye: '#FFFFFF',
    },
    special: 'النيران لا تؤثر عليه',
  },
  {
    id: 'ice',
    name: 'Ice Bird',
    nameAr: 'طائر الجليد',
    price: 3750,
    unlockRequirement: { type: 'score', value: 50 },
    colors: {
      body: '#00BFFF',
      bodyHighlight: '#87CEEB',
      wing: '#4169E1',
      wingHighlight: '#1E90FF',
      beak: '#E0FFFF',
      eye: '#000080',
    },
    special: 'يبطئ الأعداء القريبين',
  },
  {
    id: 'shadow',
    name: 'Shadow Bird',
    nameAr: 'طائر الظل',
    price: 5000,
    unlockRequirement: { type: 'kills', value: 100 },
    colors: {
      body: '#2F2F2F',
      bodyHighlight: '#4A4A4A',
      wing: '#1A1A1A',
      wingHighlight: '#333333',
      beak: '#8B0000',
      eye: '#FF0000',
    },
    special: 'أصغر حجماً وأسرع',
  },
  {
    id: 'golden',
    name: 'Golden Bird',
    nameAr: 'الطائر الذهبي',
    price: 7500,
    unlockRequirement: { type: 'coins', value: 5000 },
    colors: {
      body: '#FFD700',
      bodyHighlight: '#FFEC8B',
      wing: '#DAA520',
      wingHighlight: '#FFD700',
      beak: '#FF8C00',
      eye: '#8B4513',
    },
    special: 'يجمع عملات إضافية +50%',
  },
  {
    id: 'cyber',
    name: 'Cyber Bird',
    nameAr: 'الطائر السايبر',
    price: 10000,
    unlockRequirement: { type: 'score', value: 100 },
    colors: {
      body: '#00FF00',
      bodyHighlight: '#39FF14',
      wing: '#008000',
      wingHighlight: '#00FF00',
      beak: '#00FFFF',
      eye: '#FF00FF',
    },
    special: 'رؤية الأعداء من بعيد',
  },
  {
    id: 'dragon',
    name: 'Dragon Bird',
    nameAr: 'طائر التنين',
    price: 15000,
    unlockRequirement: { type: 'score', value: 150 },
    colors: {
      body: '#8B0000',
      bodyHighlight: '#DC143C',
      wing: '#4B0000',
      wingHighlight: '#8B0000',
      beak: '#FF4500',
      eye: '#FFD700',
    },
    special: 'نار تلقائية كل 5 ثوان',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Bird',
    nameAr: 'الطائر الكوني',
    price: 20000,
    unlockRequirement: { type: 'kills', value: 250 },
    colors: {
      body: '#9400D3',
      bodyHighlight: '#BA55D3',
      wing: '#4B0082',
      wingHighlight: '#8A2BE2',
      beak: '#FF00FF',
      eye: '#00FFFF',
    },
    special: 'درع تلقائي كل 30 ثانية',
  },
  {
    id: 'royal',
    name: 'Royal Bird',
    nameAr: 'الطائر الملكي',
    price: 30000,
    unlockRequirement: { type: 'score', value: 200 },
    colors: {
      body: '#4169E1',
      bodyHighlight: '#6495ED',
      wing: '#000080',
      wingHighlight: '#0000CD',
      beak: '#FFD700',
      eye: '#FFFFFF',
    },
    special: 'نقاط مضاعفة x2',
  },
];

export const SHOP_WEAPONS: ShopWeapon[] = [
  {
    id: 'basic',
    name: 'Basic Gun',
    nameAr: 'المسدس الأساسي',
    price: 0,
    damage: 1,
    fireRate: 0.3,
    bulletColor: '#FFFF00',
  },
  {
    id: 'rapid',
    name: 'Rapid Fire',
    nameAr: 'الإطلاق السريع',
    price: 2000,
    unlockRequirement: { type: 'score', value: 25 },
    damage: 1,
    fireRate: 0.15,
    bulletColor: '#FFA500',
    special: 'سرعة إطلاق مضاعفة',
  },
  {
    id: 'plasma',
    name: 'Plasma Gun',
    nameAr: 'مسدس البلازما',
    price: 4000,
    unlockRequirement: { type: 'kills', value: 50 },
    damage: 2,
    fireRate: 0.25,
    bulletColor: '#00FFFF',
    special: 'ضرر مضاعف',
  },
  {
    id: 'laser',
    name: 'Laser Beam',
    nameAr: 'شعاع الليزر',
    price: 6000,
    unlockRequirement: { type: 'kills', value: 75 },
    damage: 3,
    fireRate: 0.2,
    bulletColor: '#FF0000',
    special: 'يخترق الأعداء',
  },
  {
    id: 'thunder',
    name: 'Thunder Cannon',
    nameAr: 'مدفع الرعد',
    price: 9000,
    unlockRequirement: { type: 'score', value: 75 },
    damage: 4,
    fireRate: 0.35,
    bulletColor: '#9400D3',
    special: 'صعق متسلسل للأعداء',
  },
  {
    id: 'inferno',
    name: 'Inferno Blaster',
    nameAr: 'قاذف الجحيم',
    price: 12500,
    unlockRequirement: { type: 'kills', value: 150 },
    damage: 5,
    fireRate: 0.4,
    bulletColor: '#FF4500',
    special: 'حرق مستمر',
  },
  {
    id: 'omega',
    name: 'Omega Destroyer',
    nameAr: 'مدمر أوميغا',
    price: 20000,
    unlockRequirement: { type: 'score', value: 100 },
    damage: 7,
    fireRate: 0.5,
    bulletColor: '#FF00FF',
    special: 'انفجار شامل',
  },
];

const PROGRESS_KEY = 'flappy-bird-crazy-progress';

export const getDefaultProgress = (): PlayerProgress => ({
  totalCoins: 0,
  highestScore: 0,
  totalKills: 0,
  purchasedBirds: ['classic'],
  purchasedWeapons: ['basic'],
  selectedBird: 'classic',
  selectedWeapon: 'basic',
});

export const loadProgress = (): PlayerProgress => {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (saved) {
      return { ...getDefaultProgress(), ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load progress');
  }
  return getDefaultProgress();
};

export const saveProgress = (progress: PlayerProgress): void => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress');
  }
};
