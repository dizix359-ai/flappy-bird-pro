import { useRef, useEffect, useCallback, useState } from 'react';
import { 
  AngryBird, Pig, Block, Egg, Explosion, Level,
  BIRD_PROPERTIES, BLOCK_PROPERTIES, BirdType
} from './types';
import { useAngryBirdsAudio } from '@/hooks/useAngryBirdsAudio';

// Import game assets
import birdRedImg from '@/assets/angry-birds/bird-red.png';
import birdYellowImg from '@/assets/angry-birds/bird-yellow.png';
import birdBlackImg from '@/assets/angry-birds/bird-black.png';
import birdWhiteImg from '@/assets/angry-birds/bird-white.png';
import pigImg from '@/assets/angry-birds/pig.png';
import blockWoodImg from '@/assets/angry-birds/block-wood.png';
import blockStoneImg from '@/assets/angry-birds/block-stone.png';
import blockGlassImg from '@/assets/angry-birds/block-glass.png';
import blockIronImg from '@/assets/angry-birds/block-iron.png';
import slingshotImg from '@/assets/angry-birds/slingshot.png';
import backgroundImg from '@/assets/angry-birds/background.png';

interface GameCanvasProps {
  level: Level;
  onLevelComplete: (score: number, starsEarned: number) => void;
  onBackToMenu: () => void;
}

interface GameAssets {
  birds: Record<BirdType, HTMLImageElement>;
  pig: HTMLImageElement;
  blocks: Record<string, HTMLImageElement>;
  slingshot: HTMLImageElement;
  background: HTMLImageElement;
  loaded: boolean;
}

// Enhanced Physics Constants
const GRAVITY = 0.45;
const AIR_RESISTANCE = 0.998;
const GROUND_FRICTION = 0.85;
const BOUNCE_DAMPING = 0.55;
const ANGULAR_DAMPING = 0.95;
const MIN_BOUNCE_VELOCITY = 2;
const GROUND_HEIGHT = 100;
const SLINGSHOT_X = 160;
const SLINGSHOT_Y = 280;
const MAX_DRAG_DISTANCE = 130;
const COLLISION_ITERATIONS = 3;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  type: 'debris' | 'spark' | 'smoke' | 'star';
}

interface ScreenShake {
  intensity: number;
  duration: number;
  time: number;
}

export const AngryBirdsCanvas = ({ level, onLevelComplete, onBackToMenu }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  // Audio hooks
  const audio = useAngryBirdsAudio();
  
  const [gameStatus, setGameStatus] = useState<'waiting' | 'aiming' | 'flying' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const birdsRef = useRef<AngryBird[]>([]);
  const pigsRef = useRef<Pig[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const eggsRef = useRef<Egg[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const currentBirdRef = useRef<AngryBird | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const screenShakeRef = useRef<ScreenShake>({ intensity: 0, duration: 0, time: 0 });
  const assetsRef = useRef<GameAssets | null>(null);
  
  const isDraggingRef = useRef(false);
  const dragCurrentRef = useRef({ x: SLINGSHOT_X, y: SLINGSHOT_Y });
  const timeRef = useRef(0);
  const flightTimeRef = useRef(0);
  const birdTransitionRef = useRef(false);
  const gameEndedRef = useRef(false);
  const launchTimeRef = useRef(0);
  const justLaunchedRef = useRef(false);
  const lastCollisionTimeRef = useRef(0);

  // Load game assets
  useEffect(() => {
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    const loadAssets = async () => {
      try {
        const [
          birdRed, birdYellow, birdBlack, birdWhite,
          pig, blockWood, blockStone, blockGlass, blockIron,
          slingshot, background
        ] = await Promise.all([
          loadImage(birdRedImg),
          loadImage(birdYellowImg),
          loadImage(birdBlackImg),
          loadImage(birdWhiteImg),
          loadImage(pigImg),
          loadImage(blockWoodImg),
          loadImage(blockStoneImg),
          loadImage(blockGlassImg),
          loadImage(blockIronImg),
          loadImage(slingshotImg),
          loadImage(backgroundImg),
        ]);

        assetsRef.current = {
          birds: { red: birdRed, yellow: birdYellow, black: birdBlack, white: birdWhite },
          pig,
          blocks: { wood: blockWood, stone: blockStone, glass: blockGlass, iron: blockIron },
          slingshot,
          background,
          loaded: true,
        };
        setAssetsLoaded(true);
      } catch (err) {
        console.error('Failed to load assets:', err);
        // Continue without sprite assets - use fallback drawing
        setAssetsLoaded(true);
      }
    };

    loadAssets();
  }, []);

  // Initialize level
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GROUND_HEIGHT;
    
    birdsRef.current = level.birds.map((type, index) => ({
      id: `bird-${index}`,
      type,
      x: 40 + index * 50,
      y: groundY - BIRD_PROPERTIES[type].radius - 8,
      radius: BIRD_PROPERTIES[type].radius,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      isFlying: false,
      hasLanded: false,
      specialUsed: false,
    }));

    pigsRef.current = level.pigs.map((pig, index) => ({
      ...pig,
      id: `pig-${index}`,
      y: pig.y + 20,
      velocityX: 0,
      velocityY: 0,
    }));

    blocksRef.current = level.blocks.map((block, index) => ({
      ...block,
      id: `block-${index}`,
      y: block.y + 20,
      velocityX: 0,
      velocityY: 0,
    }));

    eggsRef.current = [];
    explosionsRef.current = [];
    particlesRef.current = [];
    birdTransitionRef.current = false;
    gameEndedRef.current = false;
    timeRef.current = 0;
    flightTimeRef.current = 0;
    launchTimeRef.current = 0;
    justLaunchedRef.current = false;
    lastCollisionTimeRef.current = 0;
    setCurrentBirdIndex(0);
    setScore(0);
    setGameStatus('waiting');
    
    if (birdsRef.current.length > 0) {
      const firstBird = birdsRef.current[0];
      currentBirdRef.current = {
        ...firstBird,
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
      };
    }
  }, [level]);

  // Handle restart level
  const handleRestart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GROUND_HEIGHT;
    
    birdsRef.current = level.birds.map((type, index) => ({
      id: `bird-${index}`,
      type,
      x: 40 + index * 50,
      y: groundY - BIRD_PROPERTIES[type].radius - 8,
      radius: BIRD_PROPERTIES[type].radius,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      isFlying: false,
      hasLanded: false,
      specialUsed: false,
    }));

    pigsRef.current = level.pigs.map((pig, index) => ({
      ...pig,
      id: `pig-${index}`,
      y: pig.y + 20,
      velocityX: 0,
      velocityY: 0,
    }));

    blocksRef.current = level.blocks.map((block, index) => ({
      ...block,
      id: `block-${index}`,
      y: block.y + 20,
      velocityX: 0,
      velocityY: 0,
    }));

    eggsRef.current = [];
    explosionsRef.current = [];
    particlesRef.current = [];
    birdTransitionRef.current = false;
    gameEndedRef.current = false;
    timeRef.current = 0;
    flightTimeRef.current = 0;
    launchTimeRef.current = 0;
    justLaunchedRef.current = false;
    lastCollisionTimeRef.current = 0;
    setCurrentBirdIndex(0);
    setScore(0);
    setGameStatus('waiting');
    setIsPaused(false);
    
    if (birdsRef.current.length > 0) {
      const firstBird = birdsRef.current[0];
      currentBirdRef.current = {
        ...firstBird,
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
      };
    }
  }, [level]);

  const addScreenShake = (intensity: number, duration: number) => {
    screenShakeRef.current = { intensity, duration, time: 0 };
  };

  const createExplosion = (x: number, y: number, maxRadius: number) => {
    explosionsRef.current.push({
      x,
      y,
      radius: 10,
      maxRadius,
      life: 1,
    });
    
    addScreenShake(maxRadius / 15, 0.4);
    
    // Fire particles
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3;
      const speed = 6 + Math.random() * 10;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        color: ['#FF6B35', '#FFD93D', '#FF4444', '#FFFFFF', '#FFA500', '#FF8C00'][Math.floor(Math.random() * 6)],
        size: 5 + Math.random() * 8,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        type: 'spark',
      });
    }
    
    // Smoke particles
    for (let i = 0; i < 15; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 3,
        vy: -Math.random() * 4 - 2,
        life: 1,
        color: '#555',
        size: 15 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        type: 'smoke',
      });
    }
  };

  const createDebris = (x: number, y: number, color: string, intensity: number = 1) => {
    const count = Math.floor(12 * intensity);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = (4 + Math.random() * 8) * intensity;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5,
        life: 1,
        color,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        type: 'debris',
      });
    }
    
    // Impact dust
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 0.7,
        color: 'rgba(200, 180, 150, 0.6)',
        size: 10 + Math.random() * 15,
        rotation: 0,
        rotationSpeed: 0,
        type: 'smoke',
      });
    }
  };

  const createImpactStars = (x: number, y: number) => {
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * 6,
        vy: Math.sin(angle) * 6,
        life: 1,
        color: '#FFD700',
        size: 8,
        rotation: 0,
        rotationSpeed: 0.2,
        type: 'star',
      });
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'waiting' && gameStatus !== 'aiming') return;
    
    const canvas = canvasRef.current;
    if (!canvas || !currentBirdRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const bird = currentBirdRef.current;
    const dist = Math.sqrt((x - bird.x) ** 2 + (y - bird.y) ** 2);
    
    if (dist < 100) {
      isDraggingRef.current = true;
      dragCurrentRef.current = { x: bird.x, y: bird.y };
      setGameStatus('aiming');
      audio.playStretch();
    }
  }, [gameStatus, audio]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const dx = x - SLINGSHOT_X;
    const dy = y - SLINGSHOT_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > MAX_DRAG_DISTANCE) {
      dragCurrentRef.current = {
        x: SLINGSHOT_X + (dx / dist) * MAX_DRAG_DISTANCE,
        y: SLINGSHOT_Y + (dy / dist) * MAX_DRAG_DISTANCE,
      };
    } else {
      dragCurrentRef.current = { x, y };
    }
    
    if (currentBirdRef.current) {
      currentBirdRef.current.x = dragCurrentRef.current.x;
      currentBirdRef.current.y = dragCurrentRef.current.y;
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!isDraggingRef.current || !currentBirdRef.current) return;
    
    isDraggingRef.current = false;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    
    const pullDistance = Math.sqrt(dx * dx + dy * dy);
    if (pullDistance < 25) {
      currentBirdRef.current.x = SLINGSHOT_X;
      currentBirdRef.current.y = SLINGSHOT_Y;
      setGameStatus('waiting');
      return;
    }
    
    const power = 0.19;
    currentBirdRef.current.velocityX = dx * power;
    currentBirdRef.current.velocityY = dy * power;
    currentBirdRef.current.isFlying = true;
    flightTimeRef.current = 0;
    launchTimeRef.current = Date.now();
    justLaunchedRef.current = true;
    
    // Launch effect
    addScreenShake(3, 0.15);
    audio.playLaunch();
    
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 0.5,
        color: '#8B7355',
        size: 3 + Math.random() * 3,
        rotation: 0,
        rotationSpeed: 0,
        type: 'debris',
      });
    }
    
    setTimeout(() => {
      justLaunchedRef.current = false;
    }, 300);
    
    setGameStatus('flying');
  }, [audio]);

  const handleClick = useCallback(() => {
    if (gameStatus !== 'flying' || !currentBirdRef.current) return;
    
    const bird = currentBirdRef.current;
    if (bird.specialUsed) return;
    
    const timeSinceLaunch = Date.now() - launchTimeRef.current;
    if (timeSinceLaunch < 400 || justLaunchedRef.current) return;
    
    if (bird.type === 'yellow') {
      bird.velocityX *= 2.2;
      bird.velocityY *= 0.4;
      bird.specialUsed = true;
      addScreenShake(4, 0.2);
      audio.playSpecialAbility('yellow');
      
      for (let i = 0; i < 20; i++) {
        particlesRef.current.push({
          x: bird.x,
          y: bird.y,
          vx: -bird.velocityX * 0.4 + (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 1,
          color: '#FFD93D',
          size: 6,
          rotation: 0,
          rotationSpeed: 0,
          type: 'spark',
        });
      }
    } else if (bird.type === 'black') {
      createExplosion(bird.x, bird.y, 160);
      bird.specialUsed = true;
      bird.hasLanded = true;
      audio.playSpecialAbility('black');
      audio.playExplosion();
      
      [...pigsRef.current, ...blocksRef.current].forEach(obj => {
        const dist = Math.sqrt((obj.x - bird.x) ** 2 + (obj.y - bird.y) ** 2);
        if (dist < 200) {
          const force = (200 - dist) / 200;
          obj.health -= Math.ceil(force * 6);
          const angle = Math.atan2(obj.y - bird.y, obj.x - bird.x);
          obj.velocityX += Math.cos(angle) * force * 30;
          obj.velocityY += Math.sin(angle) * force * 30 - 12;
        }
      });
    } else if (bird.type === 'white') {
      eggsRef.current.push({
        x: bird.x,
        y: bird.y + bird.radius,
        velocityX: bird.velocityX * 0.15,
        velocityY: 12,
        radius: 20,
      });
      bird.velocityY = -15;
      bird.specialUsed = true;
      addScreenShake(2, 0.1);
      audio.playSpecialAbility('white');
    }
  }, [gameStatus, audio]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>;
    
    handleMouseDown(mouseEvent);
  }, [handleMouseDown]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>;
    
    handleMouseMove(mouseEvent);
  }, [handleMouseMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Skip updates when paused
      if (isPaused) {
        animationRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const deltaTime = 0.016;
      timeRef.current += deltaTime;
      
      // Update screen shake
      if (screenShakeRef.current.duration > 0) {
        screenShakeRef.current.time += deltaTime;
        if (screenShakeRef.current.time >= screenShakeRef.current.duration) {
          screenShakeRef.current = { intensity: 0, duration: 0, time: 0 };
        }
      }
      
      // Apply screen shake
      ctx.save();
      if (screenShakeRef.current.intensity > 0) {
        const shake = screenShakeRef.current;
        const progress = shake.time / shake.duration;
        const currentIntensity = shake.intensity * (1 - progress);
        const offsetX = (Math.random() - 0.5) * currentIntensity * 2;
        const offsetY = (Math.random() - 0.5) * currentIntensity * 2;
        ctx.translate(offsetX, offsetY);
      }
      
      ctx.clearRect(-10, -10, canvas.width + 20, canvas.height + 20);
      
      // Draw enhanced sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, '#0c1445');
      skyGradient.addColorStop(0.15, '#1a237e');
      skyGradient.addColorStop(0.35, '#283593');
      skyGradient.addColorStop(0.55, '#3949ab');
      skyGradient.addColorStop(0.75, '#5c6bc0');
      skyGradient.addColorStop(0.9, '#7986cb');
      skyGradient.addColorStop(1, '#9fa8da');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Multiple physics iterations for stability
      for (let i = 0; i < COLLISION_ITERATIONS; i++) {
        updatePhysics(canvas.height, deltaTime / COLLISION_ITERATIONS);
      }
      
      updateParticles(deltaTime);
      
      drawSlingshotBack(ctx);
      
      if (isDraggingRef.current && currentBirdRef.current) {
        drawRubberBand(ctx, currentBirdRef.current, 'back');
      }
      
      blocksRef.current.forEach(block => drawBlock(ctx, block));
      pigsRef.current.forEach(pig => drawPig(ctx, pig));
      eggsRef.current.forEach(egg => drawEgg(ctx, egg));
      
      if (currentBirdRef.current) {
        drawBird(ctx, currentBirdRef.current);
        
        if (isDraggingRef.current) {
          drawTrajectory(ctx);
        }
      }
      
      if (isDraggingRef.current && currentBirdRef.current) {
        drawRubberBand(ctx, currentBirdRef.current, 'front');
      }
      
      drawSlingshotFront(ctx);
      explosionsRef.current.forEach(exp => drawExplosion(ctx, exp));
      drawParticles(ctx);
      
      const groundY = canvas.height - GROUND_HEIGHT;
      birdsRef.current.slice(currentBirdIndex + 1).forEach((bird, index) => {
        drawBird(ctx, { ...bird, x: 40 + index * 50, y: groundY - bird.radius - 8 });
      });
      
      drawUI(ctx, canvas.width);
      
      if (isDraggingRef.current) {
        drawPowerIndicator(ctx);
      }
      
      ctx.restore();
      
      checkGameEnd();
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [currentBirdIndex, gameStatus, score, level, isPaused]);

  const updateParticles = (deltaTime: number) => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      
      if (p.type === 'smoke') {
        p.vy -= 0.08;
        p.vx *= 0.98;
        p.size *= 1.01;
        p.life -= 0.015;
      } else if (p.type === 'spark') {
        p.vy += 0.3;
        p.life -= 0.025;
      } else if (p.type === 'star') {
        p.life -= 0.04;
      } else {
        p.vy += 0.35;
        p.vx *= 0.99;
        p.life -= 0.02;
      }
      
      return p.life > 0;
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.life;
      
      if (p.type === 'star') {
        // Draw star shape
        ctx.fillStyle = p.color;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? p.size : p.size / 2;
          if (i === 0) {
            ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          } else {
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
          }
          const nextAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
          const nextR = p.size / 2.5;
          ctx.lineTo(Math.cos(nextAngle) * nextR, Math.sin(nextAngle) * nextR);
        }
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'smoke') {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'debris') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size * p.life, p.size * p.life);
      } else {
        // Spark with glow
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.restore();
    });
  };

  const updatePhysics = (canvasHeight: number, deltaTime: number) => {
    const groundY = canvasHeight - GROUND_HEIGHT;
    const scaledDelta = deltaTime * 60; // Normalize to 60fps
    
    // Update current bird with enhanced physics
    if (currentBirdRef.current?.isFlying) {
      const bird = currentBirdRef.current;
      flightTimeRef.current += deltaTime;
      
      if (!bird.hasLanded) {
        // Apply gravity
        bird.velocityY += GRAVITY * scaledDelta;
        
        // Apply air resistance
        bird.velocityX *= Math.pow(AIR_RESISTANCE, scaledDelta);
        bird.velocityY *= Math.pow(AIR_RESISTANCE, scaledDelta);
        
        // Update position
        bird.x += bird.velocityX * scaledDelta;
        bird.y += bird.velocityY * scaledDelta;
        
        // Angular velocity based on movement
        const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
        bird.rotation += (bird.velocityX * 0.02 + speed * 0.005) * scaledDelta;
        
        // Trail effect
        if (Math.random() > 0.5) {
          particlesRef.current.push({
            x: bird.x - bird.velocityX * 0.3,
            y: bird.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.5,
            color: BIRD_PROPERTIES[bird.type].color,
            size: 4 + Math.random() * 2,
            rotation: 0,
            rotationSpeed: 0,
            type: 'spark',
          });
        }
        
        // Ground collision with bounce
        if (bird.y + bird.radius > groundY) {
          bird.y = groundY - bird.radius;
          
          const impactSpeed = Math.abs(bird.velocityY);
          if (impactSpeed > MIN_BOUNCE_VELOCITY) {
            bird.velocityY = -bird.velocityY * BOUNCE_DAMPING;
            bird.velocityX *= GROUND_FRICTION;
            
            // Impact effects
            if (impactSpeed > 5) {
              createDebris(bird.x, groundY, '#8B7355', impactSpeed / 15);
              addScreenShake(impactSpeed / 4, 0.15);
            }
          } else {
            bird.velocityY = 0;
            bird.hasLanded = true;
          }
          
          // Apply ground friction
          bird.velocityX *= GROUND_FRICTION;
        }
        
        // Top boundary
        if (bird.y < -150) {
          bird.hasLanded = true;
        }
        
        // Left wall collision with bounce
        if (bird.x < bird.radius) {
          bird.x = bird.radius;
          bird.velocityX = -bird.velocityX * BOUNCE_DAMPING;
          addScreenShake(3, 0.1);
        }
        
        // Right boundary
        if (bird.x > canvasRef.current!.width + 100) {
          bird.hasLanded = true;
        }
      } else {
        // On ground physics
        bird.velocityX *= Math.pow(0.88, scaledDelta);
        bird.velocityY = 0;
        bird.rotation *= Math.pow(ANGULAR_DAMPING, scaledDelta);
        
        if (Math.abs(bird.velocityX) < 0.05) bird.velocityX = 0;
      }
      
      // Block collisions
      blocksRef.current.forEach(block => {
        if (checkBirdBlockCollision(bird, block)) {
          const now = Date.now();
          if (now - lastCollisionTimeRef.current > 50) {
            lastCollisionTimeRef.current = now;
            
            const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
            const damage = Math.ceil(speed / 1.8);
            block.health -= damage;
            setScore(s => s + damage * 50);
            
            createDebris(bird.x, bird.y, BLOCK_PROPERTIES[block.type].color, speed / 10);
            createImpactStars(bird.x, bird.y);
            addScreenShake(speed / 3, 0.12);
            audio.playBlockHit(block.type as 'wood' | 'stone' | 'glass' | 'iron');
            
            // Realistic collision response
            const angle = Math.atan2(bird.y - block.y, bird.x - block.x);
            const overlap = 5;
            bird.x += Math.cos(angle) * overlap;
            bird.y += Math.sin(angle) * overlap;
            
            // Transfer momentum with restitution
            const restitution = 0.6;
            const relVelX = bird.velocityX - block.velocityX;
            const relVelY = bird.velocityY - block.velocityY;
            
            bird.velocityX = -relVelX * restitution * 0.4 + block.velocityX;
            bird.velocityY = -relVelY * restitution * 0.4 + block.velocityY;
            
            block.velocityX += relVelX * 0.6;
            block.velocityY += relVelY * 0.6;
            block.rotation += (Math.random() - 0.5) * 0.1;
          }
        }
      });
      
      // Pig collisions
      pigsRef.current.forEach(pig => {
        const dist = Math.sqrt((bird.x - pig.x) ** 2 + (bird.y - pig.y) ** 2);
        if (dist < bird.radius + pig.radius) {
          const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
          const damage = Math.ceil(speed / 1.5);
          pig.health -= damage;
          setScore(s => s + damage * 100);
          
          createImpactStars((bird.x + pig.x) / 2, (bird.y + pig.y) / 2);
          addScreenShake(speed / 2.5, 0.15);
          audio.playPigHit();
          
          // Collision response
          const angle = Math.atan2(pig.y - bird.y, pig.x - bird.x);
          const pushForce = speed * 0.5;
          
          pig.velocityX += Math.cos(angle) * pushForce;
          pig.velocityY += Math.sin(angle) * pushForce - 3;
          
          bird.velocityX *= 0.3;
          bird.velocityY *= 0.3;
        }
      });
    }
    
    // Update blocks with improved physics
    blocksRef.current = blocksRef.current.filter(block => {
      if (block.health <= 0) {
        setScore(s => s + 100);
        createDebris(block.x, block.y, BLOCK_PROPERTIES[block.type].color, 1.5);
        addScreenShake(4, 0.1);
        audio.playBlockDestroy(block.type as 'wood' | 'stone' | 'glass' | 'iron');
        return false;
      }
      
      // Check if block is supported (has something below it or is on ground)
      const isOnGround = block.y + block.height / 2 >= groundY - 2;
      let isSupported = isOnGround;
      
      if (!isSupported) {
        // Check if there's a block below supporting this one
        blocksRef.current.forEach(other => {
          if (other.id !== block.id) {
            const horizontalOverlap = Math.abs(block.x - other.x) < (block.width + other.width) / 2 - 5;
            const verticallyBelow = other.y > block.y && 
              other.y - other.height / 2 <= block.y + block.height / 2 + 5;
            if (horizontalOverlap && verticallyBelow) {
              isSupported = true;
            }
          }
        });
      }
      
      // Apply gravity (always, but stronger if not supported)
      const gravityMultiplier = isSupported ? 0.3 : 0.8;
      block.velocityY += GRAVITY * gravityMultiplier * scaledDelta;
      
      // Apply air resistance
      block.velocityX *= Math.pow(0.99, scaledDelta);
      block.velocityY *= Math.pow(0.995, scaledDelta);
      
      // Apply rotational damping (NEW!)
      block.rotation *= Math.pow(0.96, scaledDelta);
      
      // Clamp small velocities to zero for stability
      if (Math.abs(block.velocityX) < 0.1) block.velocityX = 0;
      if (Math.abs(block.velocityY) < 0.1 && isOnGround) block.velocityY = 0;
      if (Math.abs(block.rotation) < 0.01) block.rotation = 0;
      
      // Update position
      block.x += block.velocityX * scaledDelta;
      block.y += block.velocityY * scaledDelta;
      
      // Rotation based on horizontal velocity with damping
      if (Math.abs(block.velocityX) > 1) {
        block.rotation += block.velocityX * 0.003 * scaledDelta;
      }
      
      // Ground collision with bounce
      if (block.y + block.height / 2 > groundY) {
        block.y = groundY - block.height / 2;
        
        if (Math.abs(block.velocityY) > MIN_BOUNCE_VELOCITY) {
          const impactSpeed = Math.abs(block.velocityY);
          block.velocityY = -block.velocityY * 0.25;
          block.velocityX *= 0.65;
          block.rotation *= 0.5; // Reduce rotation on ground impact
          
          // Fall damage
          if (impactSpeed > 8) {
            block.health -= 1;
            createDebris(block.x, groundY, BLOCK_PROPERTIES[block.type].color, 0.5);
            addScreenShake(impactSpeed / 4, 0.1);
          }
        } else {
          block.velocityY = 0;
          block.rotation *= 0.8; // Slowly stabilize rotation
        }
        
        // Ground friction
        block.velocityX *= 0.85;
      }
      
      // Wall collision
      if (block.x < block.width / 2) {
        block.x = block.width / 2;
        block.velocityX = -block.velocityX * 0.4;
        block.rotation -= 0.1;
      }
      if (block.x > canvasRef.current!.width - block.width / 2) {
        block.x = canvasRef.current!.width - block.width / 2;
        block.velocityX = -block.velocityX * 0.4;
        block.rotation += 0.1;
      }
      
      // Block-to-block collisions with improved physics
      blocksRef.current.forEach(other => {
        if (other.id !== block.id) {
          if (checkBlockBlockCollision(block, other)) {
            const angle = Math.atan2(block.y - other.y, block.x - other.x);
            const overlapX = (block.width + other.width) / 2 - Math.abs(block.x - other.x);
            const overlapY = (block.height + other.height) / 2 - Math.abs(block.y - other.y);
            
            // Separate based on smallest overlap
            if (overlapX < overlapY) {
              const push = overlapX * 0.5;
              block.x += Math.sign(block.x - other.x) * push;
              other.x -= Math.sign(block.x - other.x) * push;
            } else {
              const push = overlapY * 0.5;
              block.y += Math.sign(block.y - other.y) * push;
              other.y -= Math.sign(block.y - other.y) * push;
            }
            
            // Calculate relative velocity
            const relVelX = block.velocityX - other.velocityX;
            const relVelY = block.velocityY - other.velocityY;
            const relSpeed = Math.sqrt(relVelX ** 2 + relVelY ** 2);
            
            // Exchange momentum with restitution
            const restitution = 0.6;
            const tempVx = block.velocityX;
            const tempVy = block.velocityY;
            block.velocityX = other.velocityX * restitution;
            block.velocityY = other.velocityY * restitution;
            other.velocityX = tempVx * restitution;
            other.velocityY = tempVy * restitution;
            
            // Add some rotation from collision
            block.rotation += relVelX * 0.01;
            other.rotation -= relVelX * 0.01;
            
            // Collision damage if fast enough
            if (relSpeed > 10) {
              const damage = Math.ceil(relSpeed / 15);
              block.health -= damage;
              other.health -= damage;
              createDebris((block.x + other.x) / 2, (block.y + other.y) / 2, 
                BLOCK_PROPERTIES[block.type].color, 0.3);
            }
          }
        }
      });
      
      return true;
    });
    
    // Update pigs with improved physics
    pigsRef.current = pigsRef.current.filter(pig => {
      if (pig.health <= 0) {
        setScore(s => s + 500);
        createExplosion(pig.x, pig.y, 70);
        audio.playPigDeath();
        return false;
      }
      
      pig.velocityY += GRAVITY * 0.7 * scaledDelta;
      pig.velocityX *= Math.pow(0.97, scaledDelta);
      
      pig.x += pig.velocityX * scaledDelta;
      pig.y += pig.velocityY * scaledDelta;
      
      // Ground collision with bounce
      if (pig.y + pig.radius > groundY) {
        pig.y = groundY - pig.radius;
        
        if (Math.abs(pig.velocityY) > MIN_BOUNCE_VELOCITY) {
          pig.velocityY = -pig.velocityY * 0.35;
          pig.velocityX *= 0.75;
          
          // Fall damage
          if (Math.abs(pig.velocityY) > 10) {
            pig.health -= 1;
            createDebris(pig.x, groundY, '#7cb342', 0.5);
          }
        } else {
          pig.velocityY = 0;
        }
      }
      
      // Wall collision
      if (pig.x < pig.radius) {
        pig.x = pig.radius;
        pig.velocityX = -pig.velocityX * 0.4;
      }
      if (pig.x > canvasRef.current!.width - pig.radius) {
        pig.x = canvasRef.current!.width - pig.radius;
        pig.velocityX = -pig.velocityX * 0.4;
      }
      
      // Pig-to-Pig collision (NEW!)
      pigsRef.current.forEach(otherPig => {
        if (otherPig.id !== pig.id) {
          const dist = Math.sqrt((pig.x - otherPig.x) ** 2 + (pig.y - otherPig.y) ** 2);
          const minDist = pig.radius + otherPig.radius;
          
          if (dist < minDist && dist > 0) {
            // Calculate collision response
            const angle = Math.atan2(pig.y - otherPig.y, pig.x - otherPig.x);
            const overlap = minDist - dist;
            
            // Separate the pigs
            pig.x += Math.cos(angle) * overlap * 0.5;
            pig.y += Math.sin(angle) * overlap * 0.5;
            otherPig.x -= Math.cos(angle) * overlap * 0.5;
            otherPig.y -= Math.sin(angle) * overlap * 0.5;
            
            // Calculate relative velocity
            const relVelX = pig.velocityX - otherPig.velocityX;
            const relVelY = pig.velocityY - otherPig.velocityY;
            const relSpeed = Math.sqrt(relVelX ** 2 + relVelY ** 2);
            
            // Exchange velocities with damping
            const restitution = 0.5;
            const tempVx = pig.velocityX;
            const tempVy = pig.velocityY;
            pig.velocityX = otherPig.velocityX * restitution;
            pig.velocityY = otherPig.velocityY * restitution;
            otherPig.velocityX = tempVx * restitution;
            otherPig.velocityY = tempVy * restitution;
            
            // Collision damage if fast enough
            if (relSpeed > 8) {
              const damage = Math.ceil(relSpeed / 10);
              pig.health -= damage;
              otherPig.health -= damage;
              createImpactStars((pig.x + otherPig.x) / 2, (pig.y + otherPig.y) / 2);
              addScreenShake(relSpeed / 5, 0.1);
            }
          }
        }
      });
      
      // Block collision
      blocksRef.current.forEach(block => {
        if (checkPigBlockCollision(pig, block)) {
          const relSpeed = Math.sqrt(
            (pig.velocityX - block.velocityX) ** 2 + 
            (pig.velocityY - block.velocityY) ** 2
          );
          
          if (relSpeed > 5) {
            pig.health -= Math.ceil(relSpeed / 5);
            block.health -= Math.ceil(relSpeed / 8);
            createImpactStars(pig.x, pig.y);
          }
          
          const angle = Math.atan2(pig.y - block.y, pig.x - block.x);
          pig.x += Math.cos(angle) * 3;
          pig.y += Math.sin(angle) * 3;
          
          pig.velocityX = Math.cos(angle) * relSpeed * 0.4;
          pig.velocityY = Math.sin(angle) * relSpeed * 0.4;
        }
      });
      
      return true;
    });
    
    // Update eggs with block collision (IMPROVED!)
    eggsRef.current = eggsRef.current.filter(egg => {
      egg.velocityY += GRAVITY * 1.2;
      egg.x += egg.velocityX * scaledDelta;
      egg.y += egg.velocityY * scaledDelta;
      
      // Check collision with blocks in the air (NEW!)
      let hitSomething = false;
      blocksRef.current.forEach(block => {
        const closestX = Math.max(block.x - block.width / 2, Math.min(egg.x, block.x + block.width / 2));
        const closestY = Math.max(block.y - block.height / 2, Math.min(egg.y, block.y + block.height / 2));
        const dist = Math.sqrt((egg.x - closestX) ** 2 + (egg.y - closestY) ** 2);
        
        if (dist < egg.radius && !hitSomething) {
          hitSomething = true;
          createExplosion(egg.x, egg.y, 100);
          audio.playExplosion();
          
          // Damage nearby objects
          [...pigsRef.current, ...blocksRef.current].forEach(obj => {
            const objDist = Math.sqrt((obj.x - egg.x) ** 2 + (obj.y - egg.y) ** 2);
            if (objDist < 120) {
              const force = (120 - objDist) / 120;
              obj.health -= Math.ceil(force * 4);
              obj.velocityY -= force * 15;
              obj.velocityX += (obj.x - egg.x) / (objDist || 1) * force * 10;
            }
          });
        }
      });
      
      if (hitSomething) return false;
      
      // Check collision with pigs in the air (NEW!)
      pigsRef.current.forEach(pig => {
        const dist = Math.sqrt((egg.x - pig.x) ** 2 + (egg.y - pig.y) ** 2);
        if (dist < egg.radius + pig.radius && !hitSomething) {
          hitSomething = true;
          createExplosion(egg.x, egg.y, 100);
          audio.playExplosion();
          
          // Direct hit damage
          pig.health -= 3;
          pig.velocityY -= 10;
          pig.velocityX += (pig.x - egg.x) / (dist || 1) * 8;
          
          // Damage nearby objects
          [...pigsRef.current, ...blocksRef.current].forEach(obj => {
            const objDist = Math.sqrt((obj.x - egg.x) ** 2 + (obj.y - egg.y) ** 2);
            if (objDist < 100 && obj !== pig) {
              const force = (100 - objDist) / 100;
              obj.health -= Math.ceil(force * 3);
              obj.velocityY -= force * 12;
              obj.velocityX += (obj.x - egg.x) / (objDist || 1) * force * 8;
            }
          });
        }
      });
      
      if (hitSomething) return false;
      
      // Ground collision
      if (egg.y + egg.radius > groundY) {
        createExplosion(egg.x, groundY - 10, 120);
        audio.playExplosion();
        
        [...pigsRef.current, ...blocksRef.current].forEach(obj => {
          const dist = Math.sqrt((obj.x - egg.x) ** 2 + (obj.y - egg.y) ** 2);
          if (dist < 140) {
            const force = (140 - dist) / 140;
            obj.health -= Math.ceil(force * 5);
            obj.velocityY -= force * 18;
            obj.velocityX += (obj.x - egg.x) / (dist || 1) * force * 12;
          }
        });
        
        return false;
      }
      
      return true;
    });
    
    // Update explosions
    explosionsRef.current = explosionsRef.current.filter(exp => {
      exp.radius += 10;
      exp.life -= 0.04;
      return exp.life > 0;
    });
    
    // Check if bird stopped
    if (currentBirdRef.current && gameStatus === 'flying' && !gameEndedRef.current) {
      const bird = currentBirdRef.current;
      const isOutOfBounds = bird.x > canvasRef.current!.width + 100 || bird.x < -100 || bird.y < -150;
      const hasStopped = bird.hasLanded && Math.abs(bird.velocityX) < 0.2;
      const flownTooLong = flightTimeRef.current > 10;
      
      if ((isOutOfBounds || hasStopped || flownTooLong) && !birdTransitionRef.current) {
        birdTransitionRef.current = true;
        
        setTimeout(() => {
          if (!gameEndedRef.current) {
            loadNextBird();
          }
          birdTransitionRef.current = false;
        }, 700);
      }
    }
  };

  const checkBlockBlockCollision = (a: Block, b: Block): boolean => {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 &&
           Math.abs(a.y - b.y) < (a.height + b.height) / 2;
  };

  const checkPigBlockCollision = (pig: Pig, block: Block): boolean => {
    const closestX = Math.max(block.x - block.width / 2, Math.min(pig.x, block.x + block.width / 2));
    const closestY = Math.max(block.y - block.height / 2, Math.min(pig.y, block.y + block.height / 2));
    const dist = Math.sqrt((pig.x - closestX) ** 2 + (pig.y - closestY) ** 2);
    return dist < pig.radius;
  };

  const loadNextBird = () => {
    if (gameEndedRef.current) return;
    
    if (pigsRef.current.length === 0) {
      checkGameEnd();
      return;
    }
    
    const nextIndex = currentBirdIndex + 1;
    if (nextIndex < birdsRef.current.length) {
      setCurrentBirdIndex(nextIndex);
      currentBirdRef.current = {
        ...birdsRef.current[nextIndex],
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
        isFlying: false,
        hasLanded: false,
        specialUsed: false,
        velocityX: 0,
        velocityY: 0,
        rotation: 0,
      };
      flightTimeRef.current = 0;
      setGameStatus('waiting');
    } else {
      setGameStatus('finished');
      checkGameEnd();
    }
  };

  const checkBirdBlockCollision = (bird: AngryBird, block: Block): boolean => {
    const closestX = Math.max(block.x - block.width / 2, Math.min(bird.x, block.x + block.width / 2));
    const closestY = Math.max(block.y - block.height / 2, Math.min(bird.y, block.y + block.height / 2));
    const dist = Math.sqrt((bird.x - closestX) ** 2 + (bird.y - closestY) ** 2);
    return dist < bird.radius;
  };

  const checkGameEnd = useCallback(() => {
    if (gameEndedRef.current) return;
    
    if (pigsRef.current.length === 0) {
      gameEndedRef.current = true;
      const unusedBirds = birdsRef.current.length - currentBirdIndex - 1;
      const bonus = Math.max(0, unusedBirds) * 1000;
      const finalScore = score + bonus;
      
      const starsEarned = finalScore >= level.stars[2] ? 3 : finalScore >= level.stars[1] ? 2 : finalScore >= level.stars[0] ? 1 : 0;
      
      setScore(finalScore);
      audio.playVictory();
      setTimeout(() => {
        onLevelComplete(finalScore, Math.max(1, starsEarned));
      }, 1000);
      return;
    }
    
    if (gameStatus === 'finished' && pigsRef.current.length > 0) {
      gameEndedRef.current = true;
      audio.playDefeat();
      setTimeout(() => {
        onLevelComplete(score, 0);
      }, 1000);
    }
  }, [score, currentBirdIndex, level.stars, gameStatus, onLevelComplete, audio]);

  // Enhanced Drawing functions
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Use background image if loaded
    if (assetsRef.current?.background) {
      ctx.drawImage(assetsRef.current.background, 0, 0, width, height - GROUND_HEIGHT + 20);
    } else {
      // Fallback gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#87CEEB');
      skyGradient.addColorStop(1, '#E0F6FF');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);
    }
    
    // Ground with rich gradient
    const groundGradient = ctx.createLinearGradient(0, height - GROUND_HEIGHT, 0, height);
    groundGradient.addColorStop(0, '#5cb85c');
    groundGradient.addColorStop(0.05, '#4caf50');
    groundGradient.addColorStop(0.12, '#388e3c');
    groundGradient.addColorStop(0.2, '#8d6e63');
    groundGradient.addColorStop(0.5, '#6d4c41');
    groundGradient.addColorStop(1, '#4e342e');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // Animated grass with wind effect
    for (let x = 0; x < width; x += 5) {
      const wind = Math.sin(timeRef.current * 2 + x * 0.05) * 3;
      const grassHeight = 15 + Math.sin(x * 0.1 + timeRef.current) * 5;
      const hue = 100 + Math.sin(x * 0.02) * 20;
      ctx.strokeStyle = `hsl(${hue}, 60%, 40%)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, height - GROUND_HEIGHT);
      ctx.quadraticCurveTo(
        x + wind, height - GROUND_HEIGHT - grassHeight / 2,
        x + wind * 1.5, height - GROUND_HEIGHT - grassHeight
      );
      ctx.stroke();
    }
  };

  const drawSlingshotBack = (ctx: CanvasRenderingContext2D) => {
    const woodGradient = ctx.createLinearGradient(SLINGSHOT_X - 35, 0, SLINGSHOT_X - 5, 0);
    woodGradient.addColorStop(0, '#5d4037');
    woodGradient.addColorStop(0.4, '#8d6e63');
    woodGradient.addColorStop(0.7, '#6d4c41');
    woodGradient.addColorStop(1, '#4e342e');
    ctx.fillStyle = woodGradient;
    
    // Back fork with better shape
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 32, SLINGSHOT_Y - 60);
    ctx.quadraticCurveTo(SLINGSHOT_X - 25, SLINGSHOT_Y - 30, SLINGSHOT_X - 8, SLINGSHOT_Y);
    ctx.lineTo(SLINGSHOT_X - 16, SLINGSHOT_Y);
    ctx.quadraticCurveTo(SLINGSHOT_X - 28, SLINGSHOT_Y - 25, SLINGSHOT_X - 38, SLINGSHOT_Y - 58);
    ctx.closePath();
    ctx.fill();
    
    // Fork top decoration
    ctx.beginPath();
    ctx.arc(SLINGSHOT_X - 26, SLINGSHOT_Y - 62, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 30, SLINGSHOT_Y - 55);
    ctx.lineTo(SLINGSHOT_X - 20, SLINGSHOT_Y - 20);
    ctx.stroke();
  };

  const drawRubberBand = (ctx: CanvasRenderingContext2D, bird: AngryBird, side: 'back' | 'front') => {
    const stretch = Math.sqrt(
      (bird.x - SLINGSHOT_X) ** 2 + (bird.y - SLINGSHOT_Y) ** 2
    ) / MAX_DRAG_DISTANCE;
    
    const bandWidth = 12 - stretch * 4;
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Band shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = bandWidth + 4;
    ctx.beginPath();
    if (side === 'back') {
      ctx.moveTo(SLINGSHOT_X - 26, SLINGSHOT_Y - 55);
    } else {
      ctx.moveTo(SLINGSHOT_X + 26, SLINGSHOT_Y - 55);
    }
    ctx.lineTo(bird.x + 2, bird.y + 2);
    ctx.stroke();
    
    // Main band
    const bandGradient = ctx.createLinearGradient(
      SLINGSHOT_X, SLINGSHOT_Y - 55,
      bird.x, bird.y
    );
    bandGradient.addColorStop(0, '#a1887f');
    bandGradient.addColorStop(0.3, '#8d6e63');
    bandGradient.addColorStop(0.7, '#6d4c41');
    bandGradient.addColorStop(1, '#5d4037');
    
    ctx.strokeStyle = bandGradient;
    ctx.lineWidth = bandWidth;
    ctx.beginPath();
    if (side === 'back') {
      ctx.moveTo(SLINGSHOT_X - 26, SLINGSHOT_Y - 55);
    } else {
      ctx.moveTo(SLINGSHOT_X + 26, SLINGSHOT_Y - 55);
    }
    ctx.lineTo(bird.x, bird.y);
    ctx.stroke();
    
    // Inner highlight
    ctx.strokeStyle = 'rgba(188, 170, 164, 0.5)';
    ctx.lineWidth = bandWidth / 3;
    ctx.stroke();
  };

  const drawSlingshotFront = (ctx: CanvasRenderingContext2D) => {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(SLINGSHOT_X + 8, SLINGSHOT_Y + 135, 35, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Main trunk with enhanced gradient
    const woodGradient = ctx.createLinearGradient(SLINGSHOT_X - 20, 0, SLINGSHOT_X + 20, 0);
    woodGradient.addColorStop(0, '#5d4037');
    woodGradient.addColorStop(0.25, '#8d6e63');
    woodGradient.addColorStop(0.5, '#a1887f');
    woodGradient.addColorStop(0.75, '#6d4c41');
    woodGradient.addColorStop(1, '#4e342e');
    ctx.fillStyle = woodGradient;
    
    // Base with curve
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 22, SLINGSHOT_Y + 125);
    ctx.quadraticCurveTo(SLINGSHOT_X - 18, SLINGSHOT_Y + 60, SLINGSHOT_X - 14, SLINGSHOT_Y);
    ctx.lineTo(SLINGSHOT_X + 14, SLINGSHOT_Y);
    ctx.quadraticCurveTo(SLINGSHOT_X + 18, SLINGSHOT_Y + 60, SLINGSHOT_X + 22, SLINGSHOT_Y + 125);
    ctx.closePath();
    ctx.fill();
    
    // Front fork
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X + 32, SLINGSHOT_Y - 60);
    ctx.quadraticCurveTo(SLINGSHOT_X + 25, SLINGSHOT_Y - 30, SLINGSHOT_X + 8, SLINGSHOT_Y);
    ctx.lineTo(SLINGSHOT_X + 16, SLINGSHOT_Y);
    ctx.quadraticCurveTo(SLINGSHOT_X + 28, SLINGSHOT_Y - 25, SLINGSHOT_X + 38, SLINGSHOT_Y - 58);
    ctx.closePath();
    ctx.fill();
    
    // Fork top
    ctx.beginPath();
    ctx.arc(SLINGSHOT_X + 26, SLINGSHOT_Y - 62, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Wood grain
    ctx.strokeStyle = 'rgba(62, 39, 35, 0.25)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const offset = -12 + i * 3.5;
      ctx.moveTo(SLINGSHOT_X + offset, SLINGSHOT_Y + 125);
      ctx.bezierCurveTo(
        SLINGSHOT_X + offset * 0.8, SLINGSHOT_Y + 70,
        SLINGSHOT_X + offset * 0.6, SLINGSHOT_Y + 35,
        SLINGSHOT_X + offset * 0.5, SLINGSHOT_Y
      );
      ctx.stroke();
    }
    
    // Highlight edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 14, SLINGSHOT_Y + 120);
    ctx.quadraticCurveTo(SLINGSHOT_X - 10, SLINGSHOT_Y + 60, SLINGSHOT_X - 8, SLINGSHOT_Y + 5);
    ctx.stroke();
  };

  const drawPowerIndicator = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / MAX_DRAG_DISTANCE, 1);
    
    const barX = 22;
    const barY = 150;
    const barWidth = 22;
    const barHeight = 130;
    
    // Power bar background with glow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Border glow based on power
    const glowColor = power < 0.4 ? '#22c55e' : power < 0.7 ? '#eab308' : '#ef4444';
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Power bar fill with segments
    const segments = 10;
    const segmentHeight = (barHeight - 4) / segments;
    const filledSegments = Math.ceil(power * segments);
    
    for (let i = 0; i < filledSegments; i++) {
      const segmentY = barY + barHeight - 2 - (i + 1) * segmentHeight;
      const segmentPower = (i + 1) / segments;
      
      let color;
      if (segmentPower < 0.4) color = '#22c55e';
      else if (segmentPower < 0.7) color = '#eab308';
      else color = '#ef4444';
      
      const gradient = ctx.createLinearGradient(barX, segmentY, barX + barWidth, segmentY);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.5, lightenColor(color, 30));
      gradient.addColorStop(1, color);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(barX + 2, segmentY, barWidth - 4, segmentHeight - 2, 3);
      ctx.fill();
    }
    
    // Power percentage
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(`${Math.round(power * 100)}%`, barX + barWidth / 2, barY + barHeight + 25);
    ctx.shadowBlur = 0;
    
    // Label
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('قوة', barX + barWidth / 2, barY - 12);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, bird: AngryBird) => {
    const props = BIRD_PROPERTIES[bird.type];
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    // Dynamic shadow based on height
    const shadowScale = 0.8 + (bird.y / 500) * 0.2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(5, bird.radius * shadowScale, bird.radius * 0.8 * shadowScale, bird.radius * 0.3 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer glow when flying
    if (bird.isFlying && !bird.hasLanded) {
      const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
      const glowIntensity = Math.min(speed / 20, 0.5);
      ctx.shadowColor = props.color;
      ctx.shadowBlur = 15 + speed;
      ctx.globalAlpha = glowIntensity;
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = props.color;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    
    // Body with enhanced gradient
    const bodyGradient = ctx.createRadialGradient(
      -bird.radius * 0.4, -bird.radius * 0.4, 0,
      0, 0, bird.radius * 1.15
    );
    bodyGradient.addColorStop(0, lightenColor(props.color, 50));
    bodyGradient.addColorStop(0.4, lightenColor(props.color, 20));
    bodyGradient.addColorStop(0.7, props.color);
    bodyGradient.addColorStop(1, darkenColor(props.color, 35));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline with depth
    ctx.strokeStyle = darkenColor(props.color, 45);
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Inner rim light
    ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius - 3, Math.PI * 0.8, Math.PI * 1.8);
    ctx.stroke();
    
    // Belly with gradient
    const bellyGradient = ctx.createRadialGradient(0, bird.radius * 0.3, 0, 0, bird.radius * 0.4, bird.radius * 0.5);
    bellyGradient.addColorStop(0, lightenColor(props.secondaryColor, 20));
    bellyGradient.addColorStop(1, props.secondaryColor);
    ctx.fillStyle = bellyGradient;
    ctx.beginPath();
    ctx.ellipse(0, bird.radius * 0.38, bird.radius * 0.6, bird.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes with depth
    const eyeGradient = ctx.createRadialGradient(-bird.radius * 0.25, -bird.radius * 0.1, 0, -bird.radius * 0.25, -bird.radius * 0.05, bird.radius * 0.25);
    eyeGradient.addColorStop(0, '#ffffff');
    eyeGradient.addColorStop(0.8, '#f5f5f5');
    eyeGradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.ellipse(-bird.radius * 0.26, -bird.radius * 0.05, bird.radius * 0.24, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeGradient2 = ctx.createRadialGradient(bird.radius * 0.25, -bird.radius * 0.1, 0, bird.radius * 0.25, -bird.radius * 0.05, bird.radius * 0.25);
    eyeGradient2.addColorStop(0, '#ffffff');
    eyeGradient2.addColorStop(0.8, '#f5f5f5');
    eyeGradient2.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = eyeGradient2;
    ctx.beginPath();
    ctx.ellipse(bird.radius * 0.26, -bird.radius * 0.05, bird.radius * 0.24, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye outlines
    ctx.strokeStyle = '#424242';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(-bird.radius * 0.26, -bird.radius * 0.05, bird.radius * 0.24, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(bird.radius * 0.26, -bird.radius * 0.05, bird.radius * 0.24, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    
    // Angry pupils - look forward when flying
    const pupilOffsetX = bird.isFlying ? bird.radius * 0.14 : bird.radius * 0.06;
    const pupilOffsetY = bird.isFlying ? -bird.radius * 0.03 : 0;
    const pupilSize = bird.radius * 0.14;
    
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.18 + pupilOffsetX, -bird.radius * 0.02 + pupilOffsetY, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.radius * 0.34 + pupilOffsetX, -bird.radius * 0.02 + pupilOffsetY, pupilSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye shine
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.22 + pupilOffsetX, -bird.radius * 0.09 + pupilOffsetY, bird.radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.radius * 0.3 + pupilOffsetX, -bird.radius * 0.09 + pupilOffsetY, bird.radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // VERY ANGRY EYEBROWS
    const eyebrowGradient = ctx.createLinearGradient(-bird.radius * 0.5, -bird.radius * 0.5, bird.radius * 0.5, -bird.radius * 0.3);
    eyebrowGradient.addColorStop(0, bird.type === 'black' ? '#0a0a0a' : '#3e2723');
    eyebrowGradient.addColorStop(1, bird.type === 'black' ? '#1a1a1a' : '#5d4037');
    ctx.fillStyle = eyebrowGradient;
    
    // Left eyebrow - angled down towards center (angrier!)
    ctx.save();
    ctx.translate(-bird.radius * 0.28, -bird.radius * 0.38);
    ctx.rotate(0.55);
    ctx.beginPath();
    ctx.roundRect(-bird.radius * 0.35, -bird.radius * 0.1, bird.radius * 0.6, bird.radius * 0.18, 4);
    ctx.fill();
    ctx.strokeStyle = bird.type === 'black' ? '#000' : '#2d1b14';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    
    // Right eyebrow
    ctx.save();
    ctx.translate(bird.radius * 0.28, -bird.radius * 0.38);
    ctx.rotate(-0.55);
    ctx.beginPath();
    ctx.roundRect(-bird.radius * 0.25, -bird.radius * 0.1, bird.radius * 0.6, bird.radius * 0.18, 4);
    ctx.fill();
    ctx.strokeStyle = bird.type === 'black' ? '#000' : '#2d1b14';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
    
    // Aggressive beak
    const beakGradient = ctx.createLinearGradient(bird.radius * 0.3, 0, bird.radius * 1.2, bird.radius * 0.3);
    beakGradient.addColorStop(0, '#ffca28');
    beakGradient.addColorStop(0.4, '#ffa000');
    beakGradient.addColorStop(1, '#ff6f00');
    ctx.fillStyle = beakGradient;
    
    // Upper beak
    ctx.beginPath();
    ctx.moveTo(bird.radius * 0.38, bird.radius * 0.1);
    ctx.lineTo(bird.radius * 1.15, bird.radius * 0.2);
    ctx.lineTo(bird.radius * 0.42, bird.radius * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Lower beak
    ctx.fillStyle = '#ff8f00';
    ctx.beginPath();
    ctx.moveTo(bird.radius * 0.42, bird.radius * 0.32);
    ctx.lineTo(bird.radius * 0.9, bird.radius * 0.34);
    ctx.lineTo(bird.radius * 0.42, bird.radius * 0.46);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Tail feathers
    if (bird.type === 'red' || bird.type === 'black') {
      const tailColor = bird.type === 'black' ? '#1a1a1a' : '#c62828';
      ctx.fillStyle = tailColor;
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 1.0, 0, bird.radius * 0.32, bird.radius * 0.1, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.95, -bird.radius * 0.2, bird.radius * 0.26, bird.radius * 0.08, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.95, bird.radius * 0.2, bird.radius * 0.26, bird.radius * 0.08, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Top feathers for red bird
    if (bird.type === 'red') {
      ctx.fillStyle = '#c62828';
      ctx.beginPath();
      ctx.ellipse(0, -bird.radius * 1.2, bird.radius * 0.12, bird.radius * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.16, -bird.radius * 1.12, bird.radius * 0.1, bird.radius * 0.2, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Special ability indicators
    if (bird.type === 'yellow' && !bird.specialUsed && bird.isFlying) {
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius + 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Speed lines
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-bird.radius - 15 - i * 10, -5 + i * 8);
        ctx.lineTo(-bird.radius - 35 - i * 15, -5 + i * 8);
        ctx.stroke();
      }
    }
    
    if (bird.type === 'black' && !bird.specialUsed && bird.isFlying) {
      // Animated fuse
      const fuseGlow = 6 + Math.sin(timeRef.current * 20) * 3;
      ctx.fillStyle = '#ff5722';
      ctx.shadowColor = '#ff5722';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bird.radius * 0.15, -bird.radius * 1.15, fuseGlow, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Sparks
      for (let i = 0; i < 3; i++) {
        const sparkAngle = timeRef.current * 10 + i * 2;
        const sparkDist = 8 + Math.sin(sparkAngle) * 4;
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(
          bird.radius * 0.15 + Math.cos(sparkAngle * 2) * sparkDist,
          -bird.radius * 1.15 + Math.sin(sparkAngle * 3) * sparkDist,
          2,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
    
    ctx.restore();
  };

  const drawPig = (ctx: CanvasRenderingContext2D, pig: Pig) => {
    ctx.save();
    ctx.translate(pig.x, pig.y);
    
    // Enhanced shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(5, pig.radius * 0.9, pig.radius * 0.85, pig.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body with rich gradient
    const bodyColor = pig.isIron ? '#607D8B' : '#7cb342';
    const bodyGradient = ctx.createRadialGradient(
      -pig.radius * 0.4, -pig.radius * 0.4, 0,
      0, 0, pig.radius * 1.2
    );
    bodyGradient.addColorStop(0, lightenColor(bodyColor, 40));
    bodyGradient.addColorStop(0.4, lightenColor(bodyColor, 15));
    bodyGradient.addColorStop(0.7, bodyColor);
    bodyGradient.addColorStop(1, darkenColor(bodyColor, 30));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pig.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Iron armor effect
    if (pig.isIron) {
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 6;
      ctx.stroke();
      
      // Helmet with metallic gradient
      const helmetGradient = ctx.createLinearGradient(-pig.radius, -pig.radius, pig.radius, 0);
      helmetGradient.addColorStop(0, '#90a4ae');
      helmetGradient.addColorStop(0.3, '#78909c');
      helmetGradient.addColorStop(0.5, '#607d8b');
      helmetGradient.addColorStop(0.7, '#546e7a');
      helmetGradient.addColorStop(1, '#455a64');
      ctx.fillStyle = helmetGradient;
      ctx.beginPath();
      ctx.arc(0, -pig.radius * 0.1, pig.radius * 0.98, Math.PI, 0, false);
      ctx.fill();
      
      // Helmet highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -pig.radius * 0.1, pig.radius * 0.85, Math.PI * 0.7, Math.PI * 0.3, true);
      ctx.stroke();
      
      // Rivets with 3D effect
      const rivetPositions = [
        [-pig.radius * 0.68, -pig.radius * 0.48],
        [pig.radius * 0.68, -pig.radius * 0.48],
        [-pig.radius * 0.78, pig.radius * 0.05],
        [pig.radius * 0.78, pig.radius * 0.05],
        [-pig.radius * 0.58, pig.radius * 0.58],
        [pig.radius * 0.58, pig.radius * 0.58],
      ];
      
      rivetPositions.forEach(([x, y]) => {
        const rivetGradient = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, 6);
        rivetGradient.addColorStop(0, '#78909c');
        rivetGradient.addColorStop(0.5, '#455a64');
        rivetGradient.addColorStop(1, '#263238');
        ctx.fillStyle = rivetGradient;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      ctx.strokeStyle = darkenColor(bodyColor, 35);
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Rim light
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, pig.radius - 3, Math.PI * 0.7, Math.PI * 1.7);
      ctx.stroke();
    }
    
    // Ears with gradient
    const earColor = pig.isIron ? '#78909C' : '#689f38';
    const earGradient = ctx.createRadialGradient(-pig.radius * 0.7, -pig.radius * 0.5, 0, -pig.radius * 0.7, -pig.radius * 0.5, pig.radius * 0.4);
    earGradient.addColorStop(0, lightenColor(earColor, 20));
    earGradient.addColorStop(1, earColor);
    ctx.fillStyle = earGradient;
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.78, -pig.radius * 0.58, pig.radius * 0.3, pig.radius * 0.42, -0.4, 0, Math.PI * 2);
    ctx.fill();
    
    const earGradient2 = ctx.createRadialGradient(pig.radius * 0.7, -pig.radius * 0.5, 0, pig.radius * 0.7, -pig.radius * 0.5, pig.radius * 0.4);
    earGradient2.addColorStop(0, lightenColor(earColor, 20));
    earGradient2.addColorStop(1, earColor);
    ctx.fillStyle = earGradient2;
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.78, -pig.radius * 0.58, pig.radius * 0.3, pig.radius * 0.42, 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Snout with 3D effect
    const snoutGradient = ctx.createRadialGradient(0, pig.radius * 0.15, 0, 0, pig.radius * 0.2, pig.radius * 0.55);
    snoutGradient.addColorStop(0, pig.isIron ? '#cfd8dc' : '#aed581');
    snoutGradient.addColorStop(0.6, pig.isIron ? '#90a4ae' : '#8bc34a');
    snoutGradient.addColorStop(1, pig.isIron ? '#607d8b' : '#689f38');
    ctx.fillStyle = snoutGradient;
    ctx.beginPath();
    ctx.ellipse(0, pig.radius * 0.2, pig.radius * 0.55, pig.radius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pig.isIron ? '#546e7a' : '#558b2f';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Nostrils with depth
    ctx.fillStyle = '#33691E';
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.2, pig.radius * 0.2, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.2, pig.radius * 0.2, 7, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Nostril highlights
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.2, pig.radius * 0.22, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.2, pig.radius * 0.22, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes with gradient
    const eyeGradient = ctx.createRadialGradient(-pig.radius * 0.35, -pig.radius * 0.2, 0, -pig.radius * 0.35, -pig.radius * 0.15, pig.radius * 0.28);
    eyeGradient.addColorStop(0, '#ffffff');
    eyeGradient.addColorStop(0.8, '#f5f5f5');
    eyeGradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = eyeGradient;
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.36, -pig.radius * 0.2, pig.radius * 0.26, 0, Math.PI * 2);
    ctx.fill();
    
    const eyeGradient2 = ctx.createRadialGradient(pig.radius * 0.35, -pig.radius * 0.2, 0, pig.radius * 0.35, -pig.radius * 0.15, pig.radius * 0.28);
    eyeGradient2.addColorStop(0, '#ffffff');
    eyeGradient2.addColorStop(0.8, '#f5f5f5');
    eyeGradient2.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = eyeGradient2;
    ctx.beginPath();
    ctx.arc(pig.radius * 0.36, -pig.radius * 0.2, pig.radius * 0.26, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils - looking worried
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.32, -pig.radius * 0.14, pig.radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.4, -pig.radius * 0.14, pig.radius * 0.13, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.36, -pig.radius * 0.24, pig.radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.36, -pig.radius * 0.24, pig.radius * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar with glow
    const healthPercent = pig.health / pig.maxHealth;
    const barWidth = pig.radius * 2.4;
    const barHeight = 12;
    const barY = -pig.radius - 26;
    
    // Bar background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2 - 3, barY - 3, barWidth + 6, barHeight + 6, 8);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Health fill with color based on health
    const healthGradient = ctx.createLinearGradient(-barWidth / 2, barY, barWidth / 2, barY);
    if (healthPercent > 0.5) {
      healthGradient.addColorStop(0, '#4caf50');
      healthGradient.addColorStop(1, '#81c784');
    } else if (healthPercent > 0.25) {
      healthGradient.addColorStop(0, '#ff9800');
      healthGradient.addColorStop(1, '#ffb74d');
    } else {
      healthGradient.addColorStop(0, '#f44336');
      healthGradient.addColorStop(1, '#e57373');
    }
    ctx.fillStyle = healthGradient;
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight, 5);
    ctx.fill();
    
    // Health bar shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight / 2, [5, 5, 0, 0]);
    ctx.fill();
    
    ctx.restore();
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, block: Block) => {
    const props = BLOCK_PROPERTIES[block.type];
    const healthPercent = block.health / block.maxHealth;
    
    ctx.save();
    ctx.translate(block.x, block.y);
    ctx.rotate(block.rotation);
    
    // Enhanced shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(-block.width / 2 + 6, -block.height / 2 + 6, block.width, block.height);
    
    // Block with enhanced gradient
    const blockGradient = ctx.createLinearGradient(
      -block.width / 2, -block.height / 2,
      block.width / 2, block.height / 2
    );
    blockGradient.addColorStop(0, lightenColor(props.color, 30));
    blockGradient.addColorStop(0.3, lightenColor(props.color, 10));
    blockGradient.addColorStop(0.6, props.color);
    blockGradient.addColorStop(1, darkenColor(props.color, 30));
    ctx.fillStyle = blockGradient;
    ctx.beginPath();
    ctx.roundRect(-block.width / 2, -block.height / 2, block.width, block.height, 4);
    ctx.fill();
    
    // Enhanced textures
    if (block.type === 'wood') {
      // Wood grain pattern
      ctx.strokeStyle = 'rgba(62, 39, 35, 0.15)';
      ctx.lineWidth = 1.5;
      const grainCount = Math.floor(block.height / 12);
      for (let i = 0; i < grainCount; i++) {
        const y = -block.height / 2 + (block.height / grainCount) * (i + 0.5);
        ctx.beginPath();
        ctx.moveTo(-block.width / 2 + 4, y + Math.sin(i) * 3);
        ctx.bezierCurveTo(
          -block.width / 4, y + Math.sin(i + 1) * 4,
          block.width / 4, y + Math.sin(i + 2) * 4,
          block.width / 2 - 4, y + Math.sin(i + 3) * 3
        );
        ctx.stroke();
      }
      
      // Wood knots
      ctx.fillStyle = 'rgba(62, 39, 35, 0.2)';
      ctx.beginPath();
      ctx.ellipse(block.width * 0.2, 0, 5, 7, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-block.width * 0.25, block.height * 0.2, 4, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (block.type === 'stone') {
      // Stone texture
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(-block.width / 2 + 3, -block.height / 2 + 3, block.width / 2 - 6, block.height / 3 - 3);
      
      // Stone cracks pattern
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const x = (Math.random() - 0.5) * block.width * 0.8;
        const y = (Math.random() - 0.5) * block.height * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 20);
        ctx.stroke();
      }
    } else if (block.type === 'iron') {
      // Metallic shine
      const shineGradient = ctx.createLinearGradient(-block.width / 2, -block.height / 2, block.width / 3, block.height / 3);
      shineGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
      shineGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
      shineGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = shineGradient;
      ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
      
      // Bolt pattern
      ctx.fillStyle = 'rgba(38, 50, 56, 0.5)';
      const boltSize = 5;
      ctx.beginPath();
      ctx.arc(-block.width / 2 + 10, -block.height / 2 + 10, boltSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(block.width / 2 - 10, -block.height / 2 + 10, boltSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-block.width / 2 + 10, block.height / 2 - 10, boltSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(block.width / 2 - 10, block.height / 2 - 10, boltSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (block.type === 'glass') {
      // Glass reflection with gradient
      const glassGradient = ctx.createLinearGradient(-block.width / 2, -block.height / 2, block.width / 4, block.height / 4);
      glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      glassGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      glassGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = glassGradient;
      ctx.fillRect(-block.width / 2 + 4, -block.height / 2 + 4, block.width * 0.4, block.height * 0.4);
      
      // Secondary reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(block.width / 6, -block.height / 4, block.width * 0.15, block.height * 0.15);
    }
    
    // Damage cracks with better rendering
    if (healthPercent < 1) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 2;
      const numCracks = Math.ceil((1 - healthPercent) * 10);
      
      for (let i = 0; i < numCracks; i++) {
        const startX = (Math.sin(i * 17) * 0.5) * block.width * 0.8;
        const startY = (Math.cos(i * 23) * 0.5) * block.height * 0.8;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        
        let x = startX;
        let y = startY;
        const segments = 3 + Math.floor(Math.random() * 3);
        
        for (let j = 0; j < segments; j++) {
          x += (Math.random() - 0.5) * 20;
          y += (Math.random() - 0.5) * 20;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    
    // Enhanced border
    ctx.strokeStyle = darkenColor(props.color, 40);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-block.width / 2, -block.height / 2, block.width, block.height, 4);
    ctx.stroke();
    
    // Inner edge highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-block.width / 2 + 4, block.height / 2 - 4);
    ctx.lineTo(-block.width / 2 + 4, -block.height / 2 + 4);
    ctx.lineTo(block.width / 2 - 4, -block.height / 2 + 4);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawEgg = (ctx: CanvasRenderingContext2D, egg: Egg) => {
    ctx.save();
    ctx.translate(egg.x, egg.y);
    ctx.rotate(Math.atan2(egg.velocityY, egg.velocityX));
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(4, 4, egg.radius * 0.7, egg.radius * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Egg with enhanced gradient
    const eggGradient = ctx.createRadialGradient(-egg.radius * 0.3, -egg.radius * 0.3, 0, 0, 0, egg.radius * 1.3);
    eggGradient.addColorStop(0, '#fffef7');
    eggGradient.addColorStop(0.4, '#fffde7');
    eggGradient.addColorStop(0.8, '#fff8e1');
    eggGradient.addColorStop(1, '#ffe082');
    ctx.fillStyle = eggGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, egg.radius * 0.72, egg.radius * 1.08, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffa000';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-egg.radius * 0.22, -egg.radius * 0.35, egg.radius * 0.18, egg.radius * 0.28, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, exp: Explosion) => {
    // Multiple layers for depth
    const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${exp.life * 0.9})`);
    gradient.addColorStop(0.15, `rgba(255, 240, 180, ${exp.life * 0.8})`);
    gradient.addColorStop(0.3, `rgba(255, 180, 50, ${exp.life * 0.7})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${exp.life * 0.5})`);
    gradient.addColorStop(0.7, `rgba(200, 50, 0, ${exp.life * 0.3})`);
    gradient.addColorStop(1, `rgba(100, 20, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner bright core
    const coreGradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius * 0.3);
    coreGradient.addColorStop(0, `rgba(255, 255, 255, ${exp.life})`);
    coreGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Shockwave ring
    ctx.strokeStyle = `rgba(255, 200, 100, ${exp.life * 0.5})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 1.2, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = 0.19;
    
    let vx = dx * power;
    let vy = dy * power;
    let x = SLINGSHOT_X;
    let y = SLINGSHOT_Y;
    
    const groundY = canvasRef.current!.height - GROUND_HEIGHT - 10;
    
    // Draw trajectory dots with fade
    for (let i = 0; i < 50; i++) {
      x += vx;
      y += vy;
      vy += GRAVITY;
      vx *= AIR_RESISTANCE;
      vy *= AIR_RESISTANCE;
      
      if (y > groundY) break;
      if (x > canvasRef.current!.width) break;
      
      const alpha = 1 - (i / 50);
      const size = 5 - (i / 18);
      
      // Outer glow
      ctx.fillStyle = `rgba(255, 180, 80, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y, size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Main dot
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawUI = (ctx: CanvasRenderingContext2D, width: number) => {
    // Score panel with glass effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(width - 210, 12, 195, 60, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(width - 210, 12, 195, 30, [18, 18, 0, 0]);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(width - 210, 12, 195, 60, 18);
    ctx.stroke();
    
    // Score with glow
    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 10;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${score.toLocaleString()}`, width - 22, 55);
    ctx.shadowBlur = 0;
    
    // Score label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('النتيجة', width - 22, 32);
    
    // Level info panel
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(68, 12, 190, 45, 18);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(68, 12, 190, 22, [18, 18, 0, 0]);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(68, 12, 190, 45, 18);
    ctx.stroke();
    
    // Level name
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(level.nameAr, 163, 42);
    
    // Bird type indicator
    if (currentBirdRef.current && gameStatus !== 'finished') {
      const bird = currentBirdRef.current;
      const props = BIRD_PROPERTIES[bird.type];
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(68, 68, 215, 55, 15);
      ctx.fill();
      
      // Bird icon with glow
      ctx.shadowColor = props.color;
      ctx.shadowBlur = 8;
      const iconGradient = ctx.createRadialGradient(98, 95, 0, 98, 95, 22);
      iconGradient.addColorStop(0, lightenColor(props.color, 35));
      iconGradient.addColorStop(0.7, props.color);
      iconGradient.addColorStop(1, darkenColor(props.color, 20));
      ctx.fillStyle = iconGradient;
      ctx.beginPath();
      ctx.arc(98, 95, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      ctx.strokeStyle = darkenColor(props.color, 35);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Special ability text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.font = '14px sans-serif';
      ctx.fillText(props.special, 128, 100);
    }
    
    // Remaining birds count
    const remainingBirds = birdsRef.current.length - currentBirdIndex - 1;
    if (remainingBirds > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.beginPath();
      ctx.roundRect(width - 210, 82, 110, 40, 12);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`🐦 ${remainingBirds}`, width - 155, 108);
    }
  };

  // Color helper functions
  const lightenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + amount);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + amount);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const darkenColor = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount);
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount);
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto">
      <canvas
        ref={canvasRef}
        width={950}
        height={600}
        className="w-full rounded-3xl shadow-2xl cursor-crosshair"
        style={{ 
          touchAction: 'none',
          boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(139, 90, 43, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Control Buttons */}
      <div className="absolute top-6 left-6 flex gap-3">
        {/* Back button */}
        <button
          onClick={onBackToMenu}
          className="bg-black/70 hover:bg-black/85 backdrop-blur-xl px-5 py-3.5 rounded-2xl text-white font-bold transition-all flex items-center gap-2 border border-white/25 shadow-xl hover:scale-105"
        >
          <span className="text-xl">←</span>
          <span>رجوع</span>
        </button>
        
        {/* Restart button */}
        <button
          onClick={handleRestart}
          className="bg-amber-600/80 hover:bg-amber-600 backdrop-blur-xl px-5 py-3.5 rounded-2xl text-white font-bold transition-all flex items-center gap-2 border border-white/25 shadow-xl hover:scale-105"
        >
          <span className="text-xl">🔄</span>
          <span>إعادة</span>
        </button>
        
        {/* Pause button */}
        <button
          onClick={() => setIsPaused(true)}
          className="bg-blue-600/80 hover:bg-blue-600 backdrop-blur-xl px-5 py-3.5 rounded-2xl text-white font-bold transition-all flex items-center gap-2 border border-white/25 shadow-xl hover:scale-105"
        >
          <span className="text-xl">⏸️</span>
          <span>إيقاف</span>
        </button>
      </div>
      
      {/* Instructions */}
      {gameStatus === 'waiting' && !isPaused && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-black/75 to-black/60 backdrop-blur-xl px-12 py-6 rounded-3xl text-white text-center border border-white/25 shadow-2xl">
          <span className="text-xl font-semibold">🎯 اسحب الطائر للخلف ثم أفلت للإطلاق!</span>
        </div>
      )}
      
      {/* Special ability hint */}
      {gameStatus === 'flying' && currentBirdRef.current && !currentBirdRef.current.specialUsed && currentBirdRef.current.type !== 'red' && !isPaused && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 backdrop-blur-xl px-10 py-5 rounded-2xl text-white font-bold animate-pulse shadow-2xl border border-white/35">
          ⚡ اضغط لتفعيل القدرة الخاصة! ⚡
        </div>
      )}
      
      {/* Pause Screen */}
      {isPaused && gameStatus !== 'finished' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center rounded-3xl z-50">
          <div className="text-center text-white p-12">
            <h2 className="text-6xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 drop-shadow-lg">
              ⏸️ إيقاف مؤقت ⏸️
            </h2>
            
            <div className="flex flex-col gap-4">
              {/* Resume button */}
              <button
                onClick={() => setIsPaused(false)}
                className="bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 px-14 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-transform shadow-2xl border-2 border-white/25"
              >
                ▶️ متابعة اللعب
              </button>
              
              {/* Restart button */}
              <button
                onClick={() => {
                  setIsPaused(false);
                  handleRestart();
                }}
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 px-14 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-transform shadow-2xl border-2 border-white/25"
              >
                🔄 إعادة المستوى
              </button>
              
              {/* Back to menu button */}
              <button
                onClick={() => {
                  setIsPaused(false);
                  onBackToMenu();
                }}
                className="bg-gradient-to-r from-slate-500 via-slate-600 to-slate-500 px-14 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-transform shadow-2xl border-2 border-white/25"
              >
                ← العودة للقائمة
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Game Over */}
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 bg-black/88 backdrop-blur-md flex items-center justify-center rounded-3xl">
          <div className="text-center text-white p-12">
            {pigsRef.current.length === 0 ? (
              <>
                <h2 className="text-7xl font-black mb-10 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 animate-pulse drop-shadow-lg">
                  🎉 فوز! 🎉
                </h2>
                <p className="text-5xl mb-10 font-bold">
                  النتيجة: <span className="text-amber-400">{score.toLocaleString()}</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-6xl font-black mb-8 text-red-400">😢 انتهت الطيور!</h2>
                <p className="text-2xl mb-10 text-white/75">لا تستسلم، حاول مرة أخرى!</p>
              </>
            )}
            <div className="flex flex-col gap-4">
              <button
                onClick={handleRestart}
                className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-14 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-transform shadow-2xl border-2 border-white/25"
              >
                🔄 إعادة المستوى
              </button>
              <button
                onClick={onBackToMenu}
                className="bg-gradient-to-r from-slate-500 via-slate-600 to-slate-500 px-14 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-transform shadow-2xl border-2 border-white/25"
              >
                العودة للقائمة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
