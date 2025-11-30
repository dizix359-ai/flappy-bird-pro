export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  width: number;
  height: number;
  hasShield?: boolean;
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

export type EnemyType = 'bird' | 'missile';

export interface Enemy {
  x: number;
  y: number;
  type: EnemyType;
  width: number;
  height: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
}

export interface Shield {
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  rotation: number;
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
  // Crazy mode specific
  hasCoins?: boolean;
  hasEnemies?: boolean;
  hasMovingPipes?: boolean;
  coinSpawnChance?: number;
  enemySpawnInterval?: number;
  shieldSpawnChance?: number;
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
  },
  hard: {
    gravity: 2200,
    jumpForce: -520,
    pipeSpeed: 220,
    pipeSpawnInterval: 1.6,
    pipeGap: 160,
    groundHeight: 80,
    maxFallSpeed: 750,
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
  },
};
