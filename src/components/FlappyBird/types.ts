export interface Bird {
  x: number;
  y: number;
  velocity: number;
  rotation: number;
  width: number;
  height: number;
}

export interface Pipe {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  gap: number;
  passed: boolean;
}

export type Difficulty = 'easy' | 'hard';

export interface GameState {
  status: 'menu' | 'idle' | 'playing' | 'gameOver';
  score: number;
  highScore: number;
  difficulty: Difficulty;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  pipeSpeed: number;
  pipeSpawnInterval: number;
  pipeGap: number;
  groundHeight: number;
  maxFallSpeed: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: {
    gravity: 1400,           // Lighter gravity
    jumpForce: -420,         // Gentler jump
    pipeSpeed: 150,          // Slower pipes
    pipeSpawnInterval: 2.2,  // More time between pipes
    pipeGap: 200,            // Bigger gap
    groundHeight: 80,
    maxFallSpeed: 500,       // Slower fall
  },
  hard: {
    gravity: 2200,           // Strong gravity
    jumpForce: -520,         // Strong jump needed
    pipeSpeed: 220,          // Fast pipes
    pipeSpawnInterval: 1.6,  // Less time
    pipeGap: 160,            // Tighter gap
    groundHeight: 80,
    maxFallSpeed: 750,       // Fast fall
  },
};
