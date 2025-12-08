export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  width: number;
  height: number;
  hasShield?: boolean;
  shieldLevel?: 1 | 2; // 1 = normal, 2 = enhanced (3 hits)
  shieldHits?: number; // Remaining hits for enhanced shield
  hasWeapon?: boolean;
  weaponAmmo?: number;
  weaponLevel?: 1 | 2 | 3; // 1 = normal, 2 = lightning, 3 = fire
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  gap: number;
  passed: boolean;
  moving?: boolean;
  moveDirection?: number;
  moveSpeed?: number;
  originalTopHeight?: number;
}

export type CoinType = 'gold' | 'silver' | 'diamond';

export interface Coin {
  x: number;
  y: number;
  type: CoinType;
  collected: boolean;
  radius: number;
  rotation: number;
}

export type EnemyType = 'bird' | 'missile' | 'hunter' | 'plane';

export interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  health?: number;
  lastShot?: number;
  shotInterval?: number;
}

export type BulletType = 'normal' | 'lightning' | 'fire';

export interface Bullet {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  fromPlayer: boolean;
  radius: number;
  type?: BulletType;
}

export interface Bomb {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}

export interface Shield {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  rotation: number;
}

export interface Weapon {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  rotation: number;
  ammo: number;
}

export interface Particle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'spark' | 'explosion' | 'coin' | 'star';
}

export interface Lightning {
  startX: number;
  startY: number;
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
}

export type Difficulty = 'easy' | 'hard' | 'crazy';

export interface GameState {
  status: 'menu' | 'idle' | 'playing' | 'gameOver';
  score: number;
  highScore: number;
  difficulty: Difficulty;
  coins?: number;
  hasShield?: boolean;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  pipeSpeed: number;
  pipeSpawnInterval: number;
  pipeGap: number;
  groundHeight: number;
  maxFallSpeed: number;
  // Extended mode features
  hasCoins?: boolean;
  hasEnemies?: boolean;
  hasMovingPipes?: boolean;
  coinSpawnChance?: number;
  enemySpawnInterval?: number;
  shieldSpawnChance?: number;
  weaponSpawnChance?: number;
  advancedEnemiesScore?: number;
  hunterSpeedMultiplier?: number;
  hunterShotInterval?: number;
}

export const COIN_VALUES: Record<CoinType, number> = {
  silver: 1,
  gold: 3,
  diamond: 5,
};

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: {
    gravity: 1400,
    jumpForce: -420,
    pipeSpeed: 150,
    pipeSpawnInterval: 2.2,
    pipeGap: 200,
    groundHeight: 80,
    maxFallSpeed: 500,
    // Easy mode - learning mode with slow hunters
    hasCoins: true,
    hasEnemies: true,
    hasMovingPipes: false,
    coinSpawnChance: 0.5,
    enemySpawnInterval: 12, // Very slow spawn
    shieldSpawnChance: 0,
    weaponSpawnChance: 0.2, // More weapons to learn
    advancedEnemiesScore: 15, // Hunters appear after 15 points
    hunterSpeedMultiplier: 0.4, // Very slow hunters
    hunterShotInterval: 3000, // Slow shooting
  },
  hard: {
    gravity: 2200,
    jumpForce: -520,
    pipeSpeed: 220,
    pipeSpawnInterval: 1.6,
    pipeGap: 160,
    groundHeight: 80,
    maxFallSpeed: 750,
    // Hard mode - preparation for crazy
    hasCoins: true,
    hasEnemies: true,
    hasMovingPipes: false,
    coinSpawnChance: 0.6,
    enemySpawnInterval: 8, // Faster than easy
    shieldSpawnChance: 0.1, // Shields available
    weaponSpawnChance: 0.15,
    advancedEnemiesScore: 10, // Hunters appear after 10 points
    hunterSpeedMultiplier: 0.6, // Medium speed hunters
    hunterShotInterval: 2000, // Faster shooting than easy
  },
  crazy: {
    gravity: 2400,
    jumpForce: -550,
    pipeSpeed: 260,
    pipeSpawnInterval: 1.4,
    pipeGap: 155,
    groundHeight: 80,
    maxFallSpeed: 800,
    hasCoins: true,
    hasEnemies: true,
    hasMovingPipes: true,
    coinSpawnChance: 0.7,
    enemySpawnInterval: 3,
    shieldSpawnChance: 0.15,
    weaponSpawnChance: 0.12,
    advancedEnemiesScore: 20,
    hunterSpeedMultiplier: 1.0, // Full speed
    hunterShotInterval: 1200, // Fast shooting
  },
};
