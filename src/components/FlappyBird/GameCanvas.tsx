import { useRef, useEffect, useCallback, useState } from 'react';
import { Bird, Pipe, GameState, GameConfig, DIFFICULTY_CONFIGS } from './types';
import { useGameLoop } from './useGameLoop';

const COLORS = {
  skyTop: '#87CEEB',
  skyBottom: '#B0E0E6',
  pipeMain: '#3D8B40',
  pipeHighlight: '#4CAF50',
  pipeShadow: '#2E7D32',
  pipeBorder: '#1B5E20',
  ground: '#8B6914',
  groundTop: '#4CAF50',
  groundPattern: '#7CB342',
};

interface GameCanvasProps {
  width: number;
  height: number;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  gameState: GameState;
  onStart: () => void;
}

export const GameCanvas = ({ width, height, onGameOver, onScoreUpdate, gameState, onStart }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scoreFlash, setScoreFlash] = useState(false);
  const configRef = useRef<GameConfig>(DIFFICULTY_CONFIGS[gameState.difficulty]);
  
  const birdRef = useRef<Bird>({
    x: width * 0.2,
    y: height / 2,
    velocity: 0,
    rotation: 0,
    width: 40,
    height: 30,
  });
  const pipesRef = useRef<Pipe[]>([]);
  const pipeTimerRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const wingAngleRef = useRef(0);
  const lastJumpTimeRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  // Update config when difficulty changes
  useEffect(() => {
    configRef.current = DIFFICULTY_CONFIGS[gameState.difficulty];
  }, [gameState.difficulty]);

  const resetGame = useCallback(() => {
    birdRef.current = {
      x: width * 0.2,
      y: height / 2,
      velocity: 0,
      rotation: 0,
      width: 40,
      height: 30,
    };
    pipesRef.current = [];
    pipeTimerRef.current = 0;
    lastJumpTimeRef.current = 0;
  }, [width, height]);

  useEffect(() => {
    if (gameState.status === 'idle') {
      resetGame();
    }
  }, [gameState.status, resetGame]);

  // Responsive jump - optimized for mobile
  const jump = useCallback(() => {
    const now = performance.now();
    const config = configRef.current;
    
    if (gameState.status === 'idle') {
      onStart();
      birdRef.current.velocity = config.jumpForce;
      lastJumpTimeRef.current = now;
      wingAngleRef.current = 0;
      return;
    }
    
    if (gameState.status === 'playing') {
      // 40ms minimum between jumps for mobile responsiveness
      if (now - lastJumpTimeRef.current < 40) return;
      
      birdRef.current.velocity = config.jumpForce;
      lastJumpTimeRef.current = now;
      wingAngleRef.current = 0;
    }
  }, [gameState.status, onStart]);

  const spawnPipe = useCallback(() => {
    const config = configRef.current;
    const minHeight = 70;
    const maxHeight = height - config.groundHeight - config.pipeGap - minHeight - 30;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipesRef.current.push({
      x: width,
      topHeight,
      bottomY: topHeight + config.pipeGap,
      width: 70,
      gap: config.pipeGap,
      passed: false,
    });
  }, [width, height]);

  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    const config = configRef.current;
    
    if (bird.y + bird.height / 2 >= height - config.groundHeight) {
      return true;
    }
    if (bird.y - bird.height / 2 <= 0) {
      birdRef.current.y = bird.height / 2;
      birdRef.current.velocity = 50;
      return false;
    }
    
    const hitboxPadding = 5;
    for (const pipe of pipes) {
      const birdLeft = bird.x - bird.width / 2 + hitboxPadding;
      const birdRight = bird.x + bird.width / 2 - hitboxPadding;
      const birdTop = bird.y - bird.height / 2 + hitboxPadding;
      const birdBottom = bird.y + bird.height / 2 - hitboxPadding;

      if (birdRight > pipe.x && birdLeft < pipe.x + pipe.width) {
        if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
          return true;
        }
      }
    }
    return false;
  }, [height]);

  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.status !== 'playing') return;

    const config = configRef.current;
    const bird = birdRef.current;
    
    // Clamp deltaTime for consistent physics on slow devices
    const dt = Math.min(deltaTime, 0.033); // Cap at ~30fps equivalent
    
    // Physics
    bird.velocity += config.gravity * dt;
    if (bird.velocity > config.maxFallSpeed) {
      bird.velocity = config.maxFallSpeed;
    }
    bird.y += bird.velocity * dt;
    
    // Smooth rotation
    const targetRotation = bird.velocity > 0 
      ? Math.min(bird.velocity / 8, 80)
      : Math.max(bird.velocity / 6, -30);
    bird.rotation += (targetRotation - bird.rotation) * 0.12;

    // Wing animation
    const timeSinceJump = performance.now() - lastJumpTimeRef.current;
    wingAngleRef.current += dt * (timeSinceJump < 200 ? 40 : 12);

    // Ground scroll
    groundOffsetRef.current = (groundOffsetRef.current + config.pipeSpeed * dt) % 40;

    // Spawn pipes
    pipeTimerRef.current += dt;
    if (pipeTimerRef.current >= config.pipeSpawnInterval) {
      spawnPipe();
      pipeTimerRef.current = 0;
    }

    // Update pipes
    pipesRef.current = pipesRef.current.filter(pipe => {
      pipe.x -= config.pipeSpeed * dt;
      
      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        onScoreUpdate(gameState.score + 1);
        setScoreFlash(true);
        setTimeout(() => setScoreFlash(false), 100);
      }
      
      return pipe.x + pipe.width > -50;
    });

    if (checkCollision(bird, pipesRef.current)) {
      onGameOver(gameState.score);
    }
  }, [gameState.status, gameState.score, spawnPipe, checkCollision, onScoreUpdate, onGameOver]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const config = configRef.current;

    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, COLORS.skyTop);
    skyGradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Clouds (simplified for performance)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const time = performance.now();
    const clouds = [
      { x: (time / 60) % (width + 150) - 75, y: 55, s: 35 },
      { x: ((time / 50) + 250) % (width + 150) - 75, y: 100, s: 42 },
    ];
    clouds.forEach(c => {
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.s, 0, Math.PI * 2);
      ctx.arc(c.x + c.s * 0.7, c.y - c.s * 0.2, c.s * 0.6, 0, Math.PI * 2);
      ctx.arc(c.x + c.s * 1.2, c.y, c.s * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pipes
    pipesRef.current.forEach(pipe => {
      const pg = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      pg.addColorStop(0, COLORS.pipeShadow);
      pg.addColorStop(0.3, COLORS.pipeMain);
      pg.addColorStop(0.6, COLORS.pipeHighlight);
      pg.addColorStop(1, COLORS.pipeShadow);
      
      ctx.fillStyle = pg;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 28, pipe.width + 10, 28);
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY - config.groundHeight);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 28);
      
      ctx.strokeStyle = COLORS.pipeBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 5, pipe.topHeight - 28, pipe.width + 10, 28);
      ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 28);
    });

    // Ground
    const groundY = height - config.groundHeight;
    ctx.fillStyle = COLORS.groundTop;
    ctx.fillRect(0, groundY, width, 18);
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, groundY + 18, width, config.groundHeight - 18);
    
    ctx.fillStyle = COLORS.groundPattern;
    for (let i = -groundOffsetRef.current; i < width + 40; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i + 18, groundY + 18);
      ctx.lineTo(i, groundY + 18);
      ctx.fill();
    }

    // Bird
    const bird = birdRef.current;
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Body
    const bg = ctx.createRadialGradient(-3, -5, 2, 0, 0, bird.width / 2);
    bg.addColorStop(0, '#FFF176');
    bg.addColorStop(0.5, '#FFD700');
    bg.addColorStop(1, '#FFA000');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing
    const wy = Math.sin(wingAngleRef.current) * 7;
    ctx.fillStyle = '#FFA500';
    ctx.beginPath();
    ctx.ellipse(-5, wy, 13, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#BF360C';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 2, -bird.height / 6, 9, 0, Math.PI * 2);
    ctx.fill();
    
    const py = Math.min(bird.velocity / 250, 3);
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 4, -bird.height / 6 + py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 5, -bird.height / 6 - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#FF5722';
    ctx.beginPath();
    ctx.moveTo(bird.width / 2 - 3, -2);
    ctx.lineTo(bird.width / 2 + 14, 4);
    ctx.lineTo(bird.width / 2 - 3, 10);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Score flash
    if (scoreFlash) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, scoreFlash]);

  // Game loop with RAF optimization
  useGameLoop((deltaTime) => {
    updateGame(deltaTime);
    drawGame();
  }, gameState.status === 'playing');

  // Idle animation
  useEffect(() => {
    if (gameState.status === 'idle') {
      let animationId: number;
      let lastTime = performance.now();
      
      const idleAnimate = (currentTime: number) => {
        const delta = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        
        const bird = birdRef.current;
        bird.y = height / 2 + Math.sin(currentTime / 400) * 25;
        bird.rotation = Math.sin(currentTime / 500) * 8;
        wingAngleRef.current += delta * 10;
        groundOffsetRef.current = (groundOffsetRef.current + delta * 50) % 40;
        drawGame();
        animationId = requestAnimationFrame(idleAnimate);
      };
      animationId = requestAnimationFrame(idleAnimate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [gameState.status, height, drawGame]);

  useEffect(() => {
    if (gameState.status === 'gameOver') {
      drawGame();
    }
  }, [gameState.status, drawGame]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  // Optimized touch handling for mobile
  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    jump();
  }, [jump]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="game-canvas cursor-pointer touch-none"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchEnd={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
