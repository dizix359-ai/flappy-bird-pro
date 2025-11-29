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

export interface GameState {
  status: 'idle' | 'playing' | 'gameOver';
  score: number;
  highScore: number;
}

export interface GameConfig {
  gravity: number;
  jumpForce: number;
  pipeSpeed: number;
  pipeSpawnInterval: number;
  pipeGap: number;
  groundHeight: number;
}
