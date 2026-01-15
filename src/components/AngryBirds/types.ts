export type BirdType = 'red' | 'yellow' | 'black' | 'white';

export interface AngryBird {
  id: string;
  type: BirdType;
  x: number;
  y: number;
  radius: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  isFlying: boolean;
  hasLanded: boolean;
  specialUsed: boolean;
}

export interface Pig {
  id: string;
  x: number;
  y: number;
  radius: number;
  health: number;
  maxHealth: number;
  isIron: boolean;
  velocityX: number;
  velocityY: number;
}

export interface Block {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wood' | 'stone' | 'glass' | 'iron';
  health: number;
  maxHealth: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
}

export interface Egg {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

export interface Level {
  id: number;
  name: string;
  nameAr: string;
  birds: BirdType[];
  pigs: Omit<Pig, 'id' | 'velocityX' | 'velocityY'>[];
  blocks: Omit<Block, 'id' | 'velocityX' | 'velocityY'>[];
  stars: [number, number, number]; // Score thresholds for 1, 2, 3 stars
}

export interface GameProgress {
  unlockedLevels: number[];
  levelStars: Record<number, number>;
  highScores: Record<number, number>;
}

export const BIRD_PROPERTIES: Record<BirdType, {
  color: string;
  secondaryColor: string;
  radius: number;
  description: string;
  special: string;
}> = {
  red: {
    color: '#E53935',
    secondaryColor: '#FFCDD2',
    radius: 25,
    description: 'الطائر الكلاسيكي',
    special: 'لا توجد قدرة خاصة',
  },
  yellow: {
    color: '#FDD835',
    secondaryColor: '#FFF9C4',
    radius: 22,
    description: 'طائر سريع',
    special: 'اضغط للتسارع',
  },
  black: {
    color: '#212121',
    secondaryColor: '#424242',
    radius: 30,
    description: 'طائر متفجر',
    special: 'اضغط للانفجار',
  },
  white: {
    color: '#FAFAFA',
    secondaryColor: '#E0E0E0',
    radius: 28,
    description: 'طائر البيض',
    special: 'اضغط لإسقاط بيضة',
  },
};

export const BLOCK_PROPERTIES: Record<Block['type'], {
  color: string;
  health: number;
}> = {
  glass: { color: '#81D4FA', health: 1 },
  wood: { color: '#8D6E63', health: 2 },
  stone: { color: '#78909C', health: 3 },
  iron: { color: '#455A64', health: 5 },
};

export const LEVELS: Level[] = [
  // المستوى 1: أول مواجهة - سهل جداً للمبتدئين
  {
    id: 1,
    name: 'First Contact',
    nameAr: 'أول مواجهة',
    birds: ['red', 'red', 'yellow'],
    pigs: [
      { x: 650, y: 380, radius: 25, health: 2, maxHealth: 2, isIron: false },
      { x: 720, y: 380, radius: 22, health: 1, maxHealth: 1, isIron: false },
    ],
    blocks: [
      { x: 600, y: 400, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 770, y: 400, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 685, y: 320, width: 190, height: 20, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
    ],
    stars: [1000, 2000, 3000],
  },
  // المستوى 2: الغزو الحديدي - تقديم الطائر الأسود
  {
    id: 2,
    name: 'Iron Invasion',
    nameAr: 'الغزو الحديدي',
    birds: ['red', 'yellow', 'black', 'red'],
    pigs: [
      { x: 650, y: 360, radius: 25, health: 3, maxHealth: 3, isIron: true },
      { x: 740, y: 380, radius: 22, health: 2, maxHealth: 2, isIron: false },
      { x: 560, y: 380, radius: 22, health: 2, maxHealth: 2, isIron: false },
    ],
    blocks: [
      { x: 520, y: 400, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 650, y: 400, width: 20, height: 80, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 780, y: 400, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 650, y: 300, width: 280, height: 20, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 580, y: 250, width: 20, height: 70, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 720, y: 250, width: 20, height: 70, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
    ],
    stars: [2000, 4000, 6000],
  },
  // المستوى 3: قلعة الهلاك - قلعة كبيرة
  {
    id: 3,
    name: 'Fortress of Doom',
    nameAr: 'قلعة الهلاك',
    birds: ['yellow', 'black', 'white', 'red', 'black'],
    pigs: [
      { x: 700, y: 330, radius: 30, health: 5, maxHealth: 5, isIron: true },
      { x: 580, y: 380, radius: 24, health: 2, maxHealth: 2, isIron: true },
      { x: 820, y: 380, radius: 24, health: 2, maxHealth: 2, isIron: true },
      { x: 640, y: 220, radius: 20, health: 1, maxHealth: 1, isIron: false },
      { x: 760, y: 220, radius: 20, health: 1, maxHealth: 1, isIron: false },
    ],
    blocks: [
      { x: 520, y: 400, width: 25, height: 100, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 880, y: 400, width: 25, height: 100, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 700, y: 300, width: 380, height: 25, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 610, y: 240, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 790, y: 240, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 700, y: 170, width: 200, height: 20, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 640, y: 400, width: 15, height: 70, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 760, y: 400, width: 15, height: 70, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
    ],
    stars: [3000, 6000, 10000],
  },
  // المستوى 4: البرج الزجاجي - هش لكن مرتفع
  {
    id: 4,
    name: 'Glass Tower',
    nameAr: 'البرج الزجاجي',
    birds: ['red', 'yellow', 'red', 'yellow'],
    pigs: [
      { x: 700, y: 180, radius: 28, health: 3, maxHealth: 3, isIron: true },
      { x: 700, y: 280, radius: 22, health: 2, maxHealth: 2, isIron: false },
      { x: 700, y: 380, radius: 20, health: 1, maxHealth: 1, isIron: false },
    ],
    blocks: [
      // الطابق الأول
      { x: 650, y: 400, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 750, y: 400, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 700, y: 355, width: 120, height: 15, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      // الطابق الثاني
      { x: 660, y: 320, width: 15, height: 50, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 740, y: 320, width: 15, height: 50, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 700, y: 280, width: 100, height: 15, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      // الطابق الثالث
      { x: 670, y: 245, width: 15, height: 50, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 730, y: 245, width: 15, height: 50, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 700, y: 205, width: 80, height: 15, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      // القمة
      { x: 700, y: 160, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
    ],
    stars: [2500, 4500, 7000],
  },
  // المستوى 5: الهرم - تصميم هرمي صعب
  {
    id: 5,
    name: 'Pyramid of Pigs',
    nameAr: 'هرم الخنازير',
    birds: ['black', 'white', 'yellow', 'black', 'red'],
    pigs: [
      // الصف السفلي
      { x: 580, y: 385, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 660, y: 385, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 740, y: 385, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 820, y: 385, radius: 20, health: 2, maxHealth: 2, isIron: false },
      // الصف الأوسط
      { x: 620, y: 310, radius: 22, health: 3, maxHealth: 3, isIron: true },
      { x: 780, y: 310, radius: 22, health: 3, maxHealth: 3, isIron: true },
      // القمة
      { x: 700, y: 230, radius: 28, health: 5, maxHealth: 5, isIron: true },
    ],
    blocks: [
      // القاعدة
      { x: 540, y: 400, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 620, y: 400, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 700, y: 400, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 780, y: 400, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 860, y: 400, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      // الطابق الأول
      { x: 700, y: 340, width: 340, height: 20, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      // الطابق الثاني
      { x: 580, y: 310, width: 20, height: 60, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 700, y: 310, width: 20, height: 60, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 820, y: 310, width: 20, height: 60, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 700, y: 265, width: 260, height: 18, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      // القمة
      { x: 660, y: 230, width: 18, height: 50, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 740, y: 230, width: 18, height: 50, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 700, y: 190, width: 100, height: 15, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
    ],
    stars: [4000, 8000, 12000],
  },
  // المستوى 6: الجسر المعلق - هيكل أفقي
  {
    id: 6,
    name: 'Hanging Bridge',
    nameAr: 'الجسر المعلق',
    birds: ['yellow', 'yellow', 'white', 'red', 'black'],
    pigs: [
      { x: 550, y: 280, radius: 22, health: 2, maxHealth: 2, isIron: false },
      { x: 650, y: 280, radius: 24, health: 3, maxHealth: 3, isIron: true },
      { x: 750, y: 280, radius: 22, health: 2, maxHealth: 2, isIron: false },
      { x: 850, y: 280, radius: 24, health: 3, maxHealth: 3, isIron: true },
    ],
    blocks: [
      // الأعمدة
      { x: 500, y: 350, width: 25, height: 150, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 600, y: 370, width: 20, height: 110, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 700, y: 370, width: 20, height: 110, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 800, y: 370, width: 20, height: 110, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 900, y: 350, width: 25, height: 150, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // الجسر العلوي
      { x: 700, y: 260, width: 420, height: 18, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      // سقف
      { x: 550, y: 220, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 650, y: 220, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 750, y: 220, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 850, y: 220, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 700, y: 175, width: 350, height: 15, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
    ],
    stars: [3500, 7000, 11000],
  },
  // المستوى 7: الدفاع المزدوج - هيكلين منفصلين
  {
    id: 7,
    name: 'Double Defense',
    nameAr: 'الدفاع المزدوج',
    birds: ['red', 'black', 'yellow', 'white', 'black', 'red'],
    pigs: [
      // الهيكل الأيسر
      { x: 480, y: 340, radius: 24, health: 3, maxHealth: 3, isIron: true },
      { x: 480, y: 250, radius: 20, health: 2, maxHealth: 2, isIron: false },
      // الهيكل الأيمن
      { x: 820, y: 340, radius: 24, health: 3, maxHealth: 3, isIron: true },
      { x: 820, y: 250, radius: 20, health: 2, maxHealth: 2, isIron: false },
      // خنزير وسط
      { x: 650, y: 385, radius: 22, health: 2, maxHealth: 2, isIron: false },
    ],
    blocks: [
      // الهيكل الأيسر
      { x: 430, y: 400, width: 18, height: 90, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 530, y: 400, width: 18, height: 90, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 480, y: 340, width: 120, height: 15, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 450, y: 290, width: 15, height: 70, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 510, y: 290, width: 15, height: 70, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 480, y: 240, width: 80, height: 15, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      // الهيكل الأيمن
      { x: 770, y: 400, width: 18, height: 90, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 870, y: 400, width: 18, height: 90, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 820, y: 340, width: 120, height: 15, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 790, y: 290, width: 15, height: 70, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 850, y: 290, width: 15, height: 70, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 820, y: 240, width: 80, height: 15, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      // الوسط
      { x: 620, y: 400, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 680, y: 400, width: 15, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 650, y: 355, width: 80, height: 12, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
    ],
    stars: [4500, 9000, 14000],
  },
  // المستوى 8: المتاهة الحديدية - صعب جداً
  {
    id: 8,
    name: 'Iron Maze',
    nameAr: 'المتاهة الحديدية',
    birds: ['black', 'black', 'white', 'yellow', 'black', 'red'],
    pigs: [
      { x: 600, y: 385, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 700, y: 385, radius: 22, health: 3, maxHealth: 3, isIron: true },
      { x: 800, y: 385, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 650, y: 290, radius: 24, health: 4, maxHealth: 4, isIron: true },
      { x: 750, y: 290, radius: 24, health: 4, maxHealth: 4, isIron: true },
      { x: 700, y: 195, radius: 28, health: 5, maxHealth: 5, isIron: true },
    ],
    blocks: [
      // الطابق السفلي
      { x: 550, y: 400, width: 22, height: 80, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 650, y: 400, width: 22, height: 80, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 750, y: 400, width: 22, height: 80, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 850, y: 400, width: 22, height: 80, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 700, y: 345, width: 320, height: 20, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // الطابق الأوسط
      { x: 580, y: 310, width: 18, height: 60, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 700, y: 310, width: 18, height: 60, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 820, y: 310, width: 18, height: 60, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 700, y: 265, width: 260, height: 18, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // الطابق العلوي
      { x: 640, y: 225, width: 15, height: 60, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 760, y: 225, width: 15, height: 60, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 700, y: 180, width: 140, height: 18, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // القمة
      { x: 700, y: 140, width: 15, height: 60, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
    ],
    stars: [6000, 12000, 18000],
  },
  // المستوى 9: قلعة الملك - ضخم ومعقد
  {
    id: 9,
    name: 'King\'s Castle',
    nameAr: 'قلعة الملك',
    birds: ['yellow', 'black', 'white', 'black', 'white', 'red', 'black'],
    pigs: [
      // الحراس
      { x: 500, y: 380, radius: 22, health: 2, maxHealth: 2, isIron: true },
      { x: 900, y: 380, radius: 22, health: 2, maxHealth: 2, isIron: true },
      // الصف الأوسط
      { x: 600, y: 310, radius: 24, health: 3, maxHealth: 3, isIron: true },
      { x: 700, y: 310, radius: 24, health: 3, maxHealth: 3, isIron: true },
      { x: 800, y: 310, radius: 24, health: 3, maxHealth: 3, isIron: true },
      // الأبراج
      { x: 540, y: 220, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 860, y: 220, radius: 20, health: 2, maxHealth: 2, isIron: false },
      // الملك
      { x: 700, y: 180, radius: 30, health: 6, maxHealth: 6, isIron: true },
    ],
    blocks: [
      // الجدار الأيسر
      { x: 460, y: 400, width: 25, height: 100, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 540, y: 400, width: 20, height: 100, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      // الجدار الأيمن
      { x: 860, y: 400, width: 20, height: 100, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 940, y: 400, width: 25, height: 100, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // القلب
      { x: 620, y: 400, width: 18, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 700, y: 400, width: 18, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 780, y: 400, width: 18, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      // الطابق الأول
      { x: 700, y: 340, width: 500, height: 22, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // الأبراج الجانبية
      { x: 500, y: 290, width: 18, height: 70, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 580, y: 290, width: 18, height: 70, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 540, y: 240, width: 100, height: 15, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 820, y: 290, width: 18, height: 70, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 900, y: 290, width: 18, height: 70, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 860, y: 240, width: 100, height: 15, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // غرفة العرش
      { x: 640, y: 290, width: 15, height: 70, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 760, y: 290, width: 15, height: 70, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 700, y: 240, width: 140, height: 18, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      // سقف العرش
      { x: 660, y: 200, width: 12, height: 60, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 740, y: 200, width: 12, height: 60, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 700, y: 155, width: 100, height: 15, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      // التاج
      { x: 540, y: 195, width: 12, height: 50, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 860, y: 195, width: 12, height: 50, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
    ],
    stars: [8000, 16000, 24000],
  },
];
