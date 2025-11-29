import { useRef, useEffect, useCallback, useState } from 'react';
import { Bird, Pipe, GameState, GameConfig } from './types';
import { useGameLoop } from './useGameLoop';

// Optimized physics for responsive, satisfying gameplay
const CONFIG: GameConfig = {
  gravity: 2200,           // Strong gravity for snappy feel
  jumpForce: -520,         // Strong immediate jump
  pipeSpeed: 200,          
  pipeSpawnInterval: 1.8,  
  pipeGap: 170,            
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
  const canJumpRef = useRef(true);
  const lastJumpTimeRef = useRef(0);

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
    canJumpRef.current = true;
    lastJumpTimeRef.current = 0;
  }, [width, height]);

  useEffect(() => {
    if (gameState.status === 'idle') {
      resetGame();
    }
  }, [gameState.status, resetGame]);

  // Responsive jump function - immediate response
  const jump = useCallback(() => {
    const now = Date.now();
    
    if (gameState.status === 'idle') {
      onStart();
      // First jump - immediate and strong
      birdRef.current.velocity = CONFIG.jumpForce;
      lastJumpTimeRef.current = now;
      wingAngleRef.current = 0; // Reset wing for flap effect
      return;
    }
    
    if (gameState.status === 'playing') {
      // Minimum 50ms between jumps to prevent spam but keep responsive
      if (now - lastJumpTimeRef.current < 50) return;
      
      // Immediate velocity set - no gradual changes
      birdRef.current.velocity = CONFIG.jumpForce;
      lastJumpTimeRef.current = now;
      wingAngleRef.current = 0; // Wing flap on jump
    }
  }, [gameState.status, onStart]);

  const spawnPipe = useCallback(() => {
    const minHeight = 70;
    const maxHeight = height - CONFIG.groundHeight - CONFIG.pipeGap - minHeight - 30;
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
    // Ceiling - soft bounce instead of death
    if (bird.y - bird.height / 2 <= 0) {
      birdRef.current.y = bird.height / 2;
      birdRef.current.velocity = 50; // Small bounce down
      return false;
    }
    // Pipe collision with fair hitbox
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

    const bird = birdRef.current;
    
    // Smooth physics with deltaTime
    // Apply gravity
    bird.velocity += CONFIG.gravity * deltaTime;
    
    // Terminal velocity - cap falling speed for fairness
    const maxFallSpeed = 700;
    if (bird.velocity > maxFallSpeed) {
      bird.velocity = maxFallSpeed;
    }
    
    // Update position
    bird.y += bird.velocity * deltaTime;
    
    // Dynamic rotation based on velocity - more expressive
    const targetRotation = bird.velocity > 0 
      ? Math.min(bird.velocity / 8, 80)  // Diving down
      : Math.max(bird.velocity / 6, -30); // Going up
    
    // Smooth rotation transition
    bird.rotation += (targetRotation - bird.rotation) * 0.15;

    // Wing animation - faster when jumping
    const timeSinceJump = Date.now() - lastJumpTimeRef.current;
    if (timeSinceJump < 200) {
      // Fast flap after jump
      wingAngleRef.current += deltaTime * 40;
    } else {
      // Normal glide animation
      wingAngleRef.current += deltaTime * 12;
    }

    // Update ground offset for scrolling effect
    groundOffsetRef.current = (groundOffsetRef.current + CONFIG.pipeSpeed * deltaTime) % 40;

    // Spawn pipes with initial delay
    pipeTimerRef.current += deltaTime;
    if (pipeTimerRef.current >= CONFIG.pipeSpawnInterval) {
      spawnPipe();
      pipeTimerRef.current = 0;
    }

    // Update pipes
    pipesRef.current = pipesRef.current.filter(pipe => {
      pipe.x -= CONFIG.pipeSpeed * deltaTime;
      
      // Score check
      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        onScoreUpdate(gameState.score + 1);
        setScoreFlash(true);
        setTimeout(() => setScoreFlash(false), 100);
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

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    skyGradient.addColorStop(0, COLORS.skyTop);
    skyGradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Animated clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    const time = Date.now();
    const cloudPositions = [
      { x: (time / 50) % (width + 200) - 100, y: 60, size: 40 },
      { x: ((time / 40) + 300) % (width + 200) - 100, y: 120, size: 50 },
      { x: ((time / 60) + 500) % (width + 200) - 100, y: 80, size: 35 },
    ];
    cloudPositions.forEach(cloud => {
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.size, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 0.8, cloud.y - cloud.size * 0.2, cloud.size * 0.7, 0, Math.PI * 2);
      ctx.arc(cloud.x + cloud.size * 1.4, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw pipes
    pipesRef.current.forEach(pipe => {
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      pipeGradient.addColorStop(0, COLORS.pipeShadow);
      pipeGradient.addColorStop(0.2, COLORS.pipeMain);
      pipeGradient.addColorStop(0.5, COLORS.pipeHighlight);
      pipeGradient.addColorStop(0.8, COLORS.pipeMain);
      pipeGradient.addColorStop(1, COLORS.pipeShadow);
      
      // Top pipe
      ctx.fillStyle = pipeGradient;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 30);
      ctx.strokeStyle = COLORS.pipeBorder;
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 5, pipe.topHeight - 30, pipe.width + 10, 30);
      ctx.strokeRect(pipe.x, 0, pipe.width, pipe.topHeight - 30);

      // Bottom pipe
      ctx.fillStyle = pipeGradient;
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY - CONFIG.groundHeight);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 30);
      ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 30);
      ctx.strokeRect(pipe.x, pipe.bottomY + 30, pipe.width, height - pipe.bottomY - CONFIG.groundHeight - 30);
    });

    // Ground
    const groundY = height - CONFIG.groundHeight;
    ctx.fillStyle = COLORS.groundTop;
    ctx.fillRect(0, groundY, width, 20);
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, groundY + 20, width, CONFIG.groundHeight - 20);
    
    ctx.fillStyle = COLORS.groundPattern;
    for (let i = -groundOffsetRef.current; i < width + 40; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, groundY);
      ctx.lineTo(i + 20, groundY + 20);
      ctx.lineTo(i, groundY + 20);
      ctx.fill();
    }

    // Bird shadow
    const bird = birdRef.current;
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(bird.x + 3, height - CONFIG.groundHeight - 8, bird.width / 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Draw bird
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate((bird.rotation * Math.PI) / 180);

    // Body with gradient
    const bodyGradient = ctx.createRadialGradient(-3, -5, 2, 0, 0, bird.width / 2);
    bodyGradient.addColorStop(0, '#FFF176');
    bodyGradient.addColorStop(0.5, '#FFD700');
    bodyGradient.addColorStop(1, '#FFA000');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing with flap animation
    const wingY = Math.sin(wingAngleRef.current) * 7;
    const wingScale = 1 + Math.sin(wingAngleRef.current) * 0.15;
    ctx.fillStyle = COLORS.birdWing;
    ctx.beginPath();
    ctx.ellipse(-5, wingY, 13 * wingScale, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#BF360C';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye white
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 2, -bird.height / 6, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Pupil - follows velocity direction
    const pupilOffsetX = Math.min(Math.max(bird.velocity / 300, -2), 2);
    const pupilOffsetY = Math.min(bird.velocity / 250, 3);
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 3 + pupilOffsetX, -bird.height / 6 + pupilOffsetY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlight
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
    ctx.strokeStyle = '#BF360C';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Belly highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(-2, 5, bird.width / 3, bird.height / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Score flash effect
    if (scoreFlash) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.fillRect(0, 0, width, height);
    }
  }, [width, height, scoreFlash]);

  useGameLoop((deltaTime) => {
    updateGame(deltaTime);
    drawGame();
  }, gameState.status === 'playing');

  // Idle animation - smooth floating
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

  // Game over state
  useEffect(() => {
    if (gameState.status === 'gameOver') {
      drawGame();
    }
  }, [gameState.status, drawGame]);

  // Keyboard controls
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

  // Touch and click handling with immediate response
  const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    jump();
  }, [jump]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="game-canvas cursor-pointer"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      onTouchEnd={(e) => e.preventDefault()}
    />
  );
};
