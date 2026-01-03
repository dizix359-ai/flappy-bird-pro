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
  {
    id: 1,
    name: 'First Contact',
    nameAr: 'أول مواجهة',
    birds: ['red', 'red', 'yellow'],
    pigs: [
      { x: 650, y: 400, radius: 25, health: 2, maxHealth: 2, isIron: false },
      { x: 700, y: 400, radius: 20, health: 1, maxHealth: 1, isIron: false },
    ],
    blocks: [
      { x: 600, y: 420, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 750, y: 420, width: 20, height: 80, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 675, y: 340, width: 170, height: 20, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
    ],
    stars: [1000, 2000, 3000],
  },
  {
    id: 2,
    name: 'Iron Invasion',
    nameAr: 'الغزو الحديدي',
    birds: ['red', 'yellow', 'black', 'red'],
    pigs: [
      { x: 650, y: 380, radius: 25, health: 3, maxHealth: 3, isIron: true },
      { x: 720, y: 400, radius: 20, health: 2, maxHealth: 2, isIron: false },
      { x: 580, y: 400, radius: 20, health: 2, maxHealth: 2, isIron: false },
    ],
    blocks: [
      { x: 550, y: 420, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 650, y: 420, width: 20, height: 80, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 750, y: 420, width: 20, height: 80, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 650, y: 320, width: 220, height: 20, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 600, y: 280, width: 20, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
      { x: 700, y: 280, width: 20, height: 60, type: 'glass', health: 1, maxHealth: 1, rotation: 0 },
    ],
    stars: [2000, 4000, 6000],
  },
  {
    id: 3,
    name: 'Fortress of Doom',
    nameAr: 'قلعة الهلاك',
    birds: ['yellow', 'black', 'white', 'red', 'black'],
    pigs: [
      { x: 700, y: 350, radius: 30, health: 5, maxHealth: 5, isIron: true },
      { x: 600, y: 400, radius: 22, health: 2, maxHealth: 2, isIron: true },
      { x: 800, y: 400, radius: 22, health: 2, maxHealth: 2, isIron: true },
      { x: 650, y: 250, radius: 18, health: 1, maxHealth: 1, isIron: false },
      { x: 750, y: 250, radius: 18, health: 1, maxHealth: 1, isIron: false },
    ],
    blocks: [
      { x: 550, y: 420, width: 25, height: 100, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 850, y: 420, width: 25, height: 100, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 700, y: 320, width: 320, height: 25, type: 'iron', health: 5, maxHealth: 5, rotation: 0 },
      { x: 625, y: 270, width: 20, height: 70, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 775, y: 270, width: 20, height: 70, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 700, y: 200, width: 170, height: 20, type: 'stone', health: 3, maxHealth: 3, rotation: 0 },
      { x: 650, y: 420, width: 15, height: 60, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
      { x: 750, y: 420, width: 15, height: 60, type: 'wood', health: 2, maxHealth: 2, rotation: 0 },
    ],
    stars: [3000, 6000, 10000],
  },
];
