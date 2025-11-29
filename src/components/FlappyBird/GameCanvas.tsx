import { useRef, useEffect, useCallback, useState } from 'react';
import { Bird, Pipe, GameState, GameConfig } from './types';
import { useGameLoop } from './useGameLoop';

const CONFIG: GameConfig = {
  gravity: 1200,
  jumpForce: -380,
  pipeSpeed: 180,
  pipeSpawnInterval: 2.0,
  pipeGap: 180,
  groundHeight: 80,
};

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
  birdBody: '#FFD700',
  birdWing: '#FFA500',
  birdBeak: '#FF6600',
  birdEye: '#FFFFFF',
  birdPupil: '#000000',
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
  const gameStartDelayRef = useRef(0);
  const isStartingRef = useRef(false);

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
    gameStartDelayRef.current = 0;
    isStartingRef.current = false;
  }, [width, height]);

  useEffect(() => {
    if (gameState.status === 'idle') {
      resetGame();
    }
  }, [gameState.status, resetGame]);

  const jump = useCallback(() => {
    if (gameState.status === 'idle') {
      onStart();
      isStartingRef.current = true;
      gameStartDelayRef.current = 0;
      birdRef.current.velocity = CONFIG.jumpForce * 0.8;
    } else if (gameState.status === 'playing' && !isStartingRef.current) {
      birdRef.current.velocity = Math.max(CONFIG.jumpForce, birdRef.current.velocity + CONFIG.jumpForce * 0.5);
      if (birdRef.current.velocity < CONFIG.jumpForce) {
        birdRef.current.velocity = CONFIG.jumpForce;
      }
    }
  }, [gameState.status, onStart]);

  const spawnPipe = useCallback(() => {
    const minHeight = 80;
    const maxHeight = height - CONFIG.groundHeight - CONFIG.pipeGap - minHeight - 40;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipesRef.current.push({
      x: width,
      topHeight,
      bottomY: topHeight + CONFIG.pipeGap,
      width: 70,
      gap: CONFIG.pipeGap,
      passed: false,
    });
  }, [width, height]);

  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    // Ground collision
    if (bird.y + bird.height / 2 >= height - CONFIG.groundHeight) {
      return true;
    }
    // Ceiling collision - more forgiving
    if (bird.y - bird.height / 2 <= -10) {
      return true;
    }
    // Pipe collision - slightly more forgiving hitbox
    const hitboxPadding = 6;
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

    // Handle start delay - gives player time to react
    if (isStartingRef.current) {
      gameStartDelayRef.current += deltaTime;
      if (gameStartDelayRef.current > 0.3) {
        isStartingRef.current = false;
      }
      // Still update bird during delay but don't spawn pipes
      const bird = birdRef.current;
      bird.velocity += CONFIG.gravity * deltaTime * 0.5;
      bird.y += bird.velocity * deltaTime;
      bird.rotation = Math.min(Math.max(bird.velocity / 12, -25), 70);
      wingAngleRef.current += deltaTime * 15;
      return;
    }

    const bird = birdRef.current;
    
    // Update bird physics with velocity clamping
    bird.velocity += CONFIG.gravity * deltaTime;
    bird.velocity = Math.min(bird.velocity, 600);
    bird.y += bird.velocity * deltaTime;
    
    // Keep bird from going too high
    if (bird.y < 30) {
      bird.y = 30;
      bird.velocity = Math.max(0, bird.velocity);
    }
    
    bird.rotation = Math.min(Math.max(bird.velocity / 12, -25), 70);

    // Update wing animation
    wingAngleRef.current += deltaTime * 15;

    // Update ground offset
    groundOffsetRef.current = (groundOffsetRef.current + CONFIG.pipeSpeed * deltaTime) % 40;

    // Spawn pipes
    pipeTimerRef.current += deltaTime;
    if (pipeTimerRef.current >= CONFIG.pipeSpawnInterval) {
      spawnPipe();
      pipeTimerRef.current = 0;
    }

    // Update pipes
    pipesRef.current = pipesRef.current.filter(pipe => {
      pipe.x -= CONFIG.pipeSpeed * deltaTime;
      
      // Score check with visual feedback
      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        onScoreUpdate(gameState.score + 1);
        setScoreFlash(true);
        setTimeout(() => setScoreFlash(false), 150);
      }
      
      return pipe.x + pipe.width > -50;
    });

    // Collision check
    if (checkCollision(bird, pipesRef.current)) {
      onGameOver(gameState.score);
    }
  }, [gameState.status, gameState.score, spawnPipe, checkCollision, onScoreUpdate, onGameOver]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, COLORS.skyTop);
    skyGradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const cloudPositions = [
      { x: (Date.now() / 50) % (width + 200) - 100, y: 60, size: 40 },
      { x: ((Date.now() / 40) + 300) % (width + 200) - 100, y: 120, size: 50 },
      { x: ((Date.now() / 60) + 500) % (width + 200) - 100, y: 80, size: 35 },
    ];
    cloudPositions.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 1.4, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw pipes with better visuals
    pipesRef.current.forEach(pipe => {
      // Top pipe
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      pipeGradient.addColorStop(0, COLORS.pipeShadow);
      pipeGradient.addColorStop(0.2, COLORS.pipeMain);
      pipeGradient.addColorStop(0.5, COLORS.pipeHighlight);
      pipeGradient.addColorStop(0.8, COLORS.pipeMain);
      pipeGradient.addColorStop(1, COLORS.pipeShadow);
      
      ctx.fillStyle = pipeGradient;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      
      // Top pipe cap
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 30);
      ctx.strokeStyle = COLORS.pipeBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 30);
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight - 30);

      // Bottom pipe
      ctx.fillStyle = pipeGradient;
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY - CONFIG.groundHeight);
      
      // Bottom pipe cap
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 30);
      ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 30);
      ctx.strokeRect(pipe.x, pipe.bottomY + 30, pipe.width, height - pipe.bottomY - CONFIG.groundHeight - 30);
    });

    // Draw ground
    const groundY = height - CONFIG.groundHeight;
    ctx.fillStyle = COLORS.groundTop;
    ctx.fillRect(0, groundY, width, 20);
    
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, groundY + 20, width, CONFIG.groundHeight - 20);
    
    // Ground pattern
    ctx.fillStyle = COLORS.groundPattern;
    for (let i = -groundOffsetRef.current; i < width + 40; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i + 20, groundY + 20);
      ctx.lineTo(i, groundY + 20);
      ctx.fill();
    }

    // Draw bird with shadow
    const bird = birdRef.current;
    
    // Bird shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(bird.x + 5, height - CONFIG.groundHeight - 10, bird.width / 2.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Bird body
    const bodyGradient = ctx.createRadialGradient(0, -5, 0, 0, 0, bird.width / 2);
    bodyGradient.addColorStop(0, '#FFEB3B');
    bodyGradient.addColorStop(1, COLORS.birdBody);
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E6A800';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing
    const wingY = Math.sin(wingAngleRef.current) * 6;
    ctx.fillStyle = COLORS.birdWing;
    ctx.beginPath();
    ctx.ellipse(-5, wingY, 12, 8, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#CC7000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye
    ctx.fillStyle = COLORS.birdEye;
    ctx.beginPath();
    ctx.arc(bird.width / 4, -bird.height / 6, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Pupil - looking in direction of movement
    const pupilOffsetY = Math.min(bird.velocity / 200, 2);
    ctx.fillStyle = COLORS.birdPupil;
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 2, -bird.height / 6 + pupilOffsetY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlight
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 4, -bird.height / 6 - 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = COLORS.birdBeak;
    ctx.beginPath();
    ctx.moveTo(bird.width / 2 - 5, 0);
    ctx.lineTo(bird.width / 2 + 12, 3);
    ctx.lineTo(bird.width / 2 - 5, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#CC4400';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    // Score flash effect
    if (scoreFlash) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, scoreFlash]);

  useGameLoop((deltaTime) => {
    updateGame(deltaTime);
    drawGame();
  }, gameState.status === 'playing');

  // Idle animation
  useEffect(() => {
    if (gameState.status === 'idle') {
      let animationId: number;
      const idleAnimate = () => {
        const bird = birdRef.current;
        bird.y = height / 2 + Math.sin(Date.now() / 300) * 20;
        wingAngleRef.current += 0.15;
        groundOffsetRef.current = (groundOffsetRef.current + 1) % 40;
        drawGame();
        animationId = requestAnimationFrame(idleAnimate);
      };
      animationId = requestAnimationFrame(idleAnimate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [gameState.status, height, drawGame]);

  // Game over - keep drawing
  useEffect(() => {
    if (gameState.status === 'gameOver') {
      drawGame();
    }
  }, [gameState.status, drawGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="game-canvas cursor-pointer"
      onClick={jump}
      onTouchStart={(e) => {
        e.preventDefault();
        jump();
      }}
    />
  );
};
