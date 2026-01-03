import { useRef, useEffect, useCallback, useState } from 'react';
import { 
  AngryBird, Pig, Block, Egg, Explosion, Level,
  BIRD_PROPERTIES, BLOCK_PROPERTIES
} from './types';

interface GameCanvasProps {
  level: Level;
  onLevelComplete: (score: number, starsEarned: number) => void;
  onBackToMenu: () => void;
}

const GRAVITY = 0.4;
const GROUND_HEIGHT = 80;
const SLINGSHOT_X = 150;
const SLINGSHOT_Y = 320; // رفع القاذفة للأعلى
const MAX_DRAG_DISTANCE = 100; // زيادة مسافة السحب

export const AngryBirdsCanvas = ({ level, onLevelComplete, onBackToMenu }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  
  const [gameStatus, setGameStatus] = useState<'waiting' | 'aiming' | 'flying' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [currentBirdIndex, setCurrentBirdIndex] = useState(0);
  
  const birdsRef = useRef<AngryBird[]>([]);
  const pigsRef = useRef<Pig[]>([]);
  const blocksRef = useRef<Block[]>([]);
  const eggsRef = useRef<Egg[]>([]);
  const explosionsRef = useRef<Explosion[]>([]);
  const currentBirdRef = useRef<AngryBird | null>(null);
  const particlesRef = useRef<{x: number; y: number; vx: number; vy: number; life: number; color: string; size: number}[]>([]);
  
  const isDraggingRef = useRef(false);
  const dragCurrentRef = useRef({ x: SLINGSHOT_X, y: SLINGSHOT_Y });
  const timeRef = useRef(0);

  // Initialize level
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GROUND_HEIGHT;
    
    // Create birds queue
    birdsRef.current = level.birds.map((type, index) => ({
      id: `bird-${index}`,
      type,
      x: 30 + index * 45,
      y: groundY - BIRD_PROPERTIES[type].radius - 5,
      radius: BIRD_PROPERTIES[type].radius,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      isFlying: false,
      hasLanded: false,
      specialUsed: false,
    }));

    // Create pigs with adjusted Y positions
    pigsRef.current = level.pigs.map((pig, index) => ({
      ...pig,
      id: `pig-${index}`,
      y: pig.y + 40, // تعديل مواضع الخنازير
      velocityX: 0,
      velocityY: 0,
    }));

    // Create blocks with adjusted Y positions
    blocksRef.current = level.blocks.map((block, index) => ({
      ...block,
      id: `block-${index}`,
      y: block.y + 40, // تعديل مواضع الكتل
      velocityX: 0,
      velocityY: 0,
    }));

    eggsRef.current = [];
    explosionsRef.current = [];
    particlesRef.current = [];
    setCurrentBirdIndex(0);
    setScore(0);
    setGameStatus('waiting');
    
    // Put first bird on slingshot
    if (birdsRef.current.length > 0) {
      const firstBird = birdsRef.current[0];
      currentBirdRef.current = {
        ...firstBird,
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
      };
    }
  }, [level]);

  const createExplosion = (x: number, y: number, maxRadius: number) => {
    explosionsRef.current.push({
      x,
      y,
      radius: 10,
      maxRadius,
      life: 1,
    });
    
    // Add particles
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15;
      const speed = 3 + Math.random() * 5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: ['#FF6B35', '#FFD93D', '#FF4444', '#FFFFFF'][Math.floor(Math.random() * 4)],
        size: 3 + Math.random() * 4,
      });
    }
  };

  const createDebris = (x: number, y: number, color: string) => {
    for (let i = 0; i < 8; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 1,
        color,
        size: 2 + Math.random() * 3,
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
    
    // Check if clicking near the bird or slingshot area
    const bird = currentBirdRef.current;
    const dist = Math.sqrt((x - bird.x) ** 2 + (y - bird.y) ** 2);
    
    if (dist < 80) {
      isDraggingRef.current = true;
      dragCurrentRef.current = { x: bird.x, y: bird.y };
      setGameStatus('aiming');
    }
  }, [gameStatus]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Limit drag distance and direction (only allow pulling back and down)
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
    
    // Calculate launch velocity
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    
    // Only launch if pulled back enough
    const pullDistance = Math.sqrt(dx * dx + dy * dy);
    if (pullDistance < 20) {
      // Reset bird position
      currentBirdRef.current.x = SLINGSHOT_X;
      currentBirdRef.current.y = SLINGSHOT_Y;
      setGameStatus('waiting');
      return;
    }
    
    const power = 0.18;
    currentBirdRef.current.velocityX = dx * power;
    currentBirdRef.current.velocityY = dy * power;
    currentBirdRef.current.isFlying = true;
    
    setGameStatus('flying');
  }, []);

  const handleClick = useCallback(() => {
    // Handle special abilities when bird is flying
    if (gameStatus !== 'flying' || !currentBirdRef.current) return;
    
    const bird = currentBirdRef.current;
    if (bird.specialUsed) return;
    
    if (bird.type === 'yellow') {
      // Speed boost
      bird.velocityX *= 1.8;
      bird.velocityY *= 0.6;
      bird.specialUsed = true;
      
      // Visual effect
      for (let i = 0; i < 10; i++) {
        particlesRef.current.push({
          x: bird.x,
          y: bird.y,
          vx: -bird.velocityX * 0.3 + (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          color: '#FFD93D',
          size: 4,
        });
      }
    } else if (bird.type === 'black') {
      // Explode
      createExplosion(bird.x, bird.y, 120);
      bird.specialUsed = true;
      bird.hasLanded = true;
      
      // Damage nearby objects
      [...pigsRef.current, ...blocksRef.current].forEach(obj => {
        const dist = Math.sqrt((obj.x - bird.x) ** 2 + (obj.y - bird.y) ** 2);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          obj.health -= Math.ceil(force * 4);
          const angle = Math.atan2(obj.y - bird.y, obj.x - bird.x);
          obj.velocityX += Math.cos(angle) * force * 20;
          obj.velocityY += Math.sin(angle) * force * 20 - 5;
        }
      });
    } else if (bird.type === 'white') {
      // Drop egg
      eggsRef.current.push({
        x: bird.x,
        y: bird.y + bird.radius,
        velocityX: bird.velocityX * 0.3,
        velocityY: 8,
        radius: 15,
      });
      bird.velocityY = -10;
      bird.specialUsed = true;
    }
  }, [gameStatus]);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
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
      timeRef.current += 0.016;
      
      // Clear and draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, '#1e3c72');
      skyGradient.addColorStop(0.3, '#2a5298');
      skyGradient.addColorStop(0.6, '#74b9ff');
      skyGradient.addColorStop(1, '#a8e6cf');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Update physics
      updatePhysics(canvas.height);
      
      // Update particles
      updateParticles();
      
      // Draw slingshot (back part)
      drawSlingshotBack(ctx);
      
      // Draw blocks
      blocksRef.current.forEach(block => drawBlock(ctx, block));
      
      // Draw pigs
      pigsRef.current.forEach(pig => drawPig(ctx, pig));
      
      // Draw eggs
      eggsRef.current.forEach(egg => drawEgg(ctx, egg));
      
      // Draw current bird
      if (currentBirdRef.current) {
        drawBird(ctx, currentBirdRef.current);
        
        // Draw trajectory when aiming
        if (isDraggingRef.current) {
          drawTrajectory(ctx);
        }
      }
      
      // Draw slingshot (front part)
      drawSlingshotFront(ctx);
      
      // Draw explosions
      explosionsRef.current.forEach(exp => drawExplosion(ctx, exp));
      
      // Draw particles
      drawParticles(ctx);
      
      // Draw waiting birds
      const groundY = canvas.height - GROUND_HEIGHT;
      birdsRef.current.slice(currentBirdIndex + 1).forEach((bird, index) => {
        drawBird(ctx, { ...bird, x: 30 + index * 45, y: groundY - bird.radius - 5 });
      });
      
      // Draw UI
      drawUI(ctx, canvas.width);
      
      // Draw power indicator when aiming
      if (isDraggingRef.current) {
        drawPowerIndicator(ctx);
      }
      
      // Check win/lose conditions
      checkGameEnd();
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [currentBirdIndex, gameStatus, score, level]);

  const updateParticles = () => {
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.2;
      p.life -= 0.02;
      return p.life > 0;
    });
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  const updatePhysics = (canvasHeight: number) => {
    const groundY = canvasHeight - GROUND_HEIGHT;
    
    // Update current bird
    if (currentBirdRef.current?.isFlying && !currentBirdRef.current.hasLanded) {
      const bird = currentBirdRef.current;
      bird.velocityY += GRAVITY;
      bird.x += bird.velocityX;
      bird.y += bird.velocityY;
      bird.rotation += bird.velocityX * 0.03;
      
      // Trail effect for flying bird
      if (Math.random() > 0.7) {
        particlesRef.current.push({
          x: bird.x - bird.velocityX * 0.5,
          y: bird.y,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: 0.5,
          color: BIRD_PROPERTIES[bird.type].color,
          size: 3,
        });
      }
      
      // Ground collision
      if (bird.y + bird.radius > groundY) {
        bird.y = groundY - bird.radius;
        bird.hasLanded = true;
        bird.velocityX *= 0.3;
        bird.velocityY = 0;
        createDebris(bird.x, bird.y, '#8B7355');
      }
      
      // Wall collision
      if (bird.x < bird.radius) {
        bird.x = bird.radius;
        bird.velocityX *= -0.5;
      }
      if (bird.x > canvasRef.current!.width - bird.radius) {
        bird.hasLanded = true;
      }
      
      // Block collision
      blocksRef.current.forEach(block => {
        if (checkBirdBlockCollision(bird, block)) {
          const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
          const damage = Math.ceil(speed / 2.5);
          block.health -= damage;
          setScore(s => s + damage * 50);
          
          createDebris(bird.x, bird.y, BLOCK_PROPERTIES[block.type].color);
          
          // Transfer momentum
          block.velocityX += bird.velocityX * 0.4;
          block.velocityY += bird.velocityY * 0.4;
          
          bird.velocityX *= -0.2;
          bird.velocityY *= -0.2;
        }
      });
      
      // Pig collision
      pigsRef.current.forEach(pig => {
        const dist = Math.sqrt((bird.x - pig.x) ** 2 + (bird.y - pig.y) ** 2);
        if (dist < bird.radius + pig.radius) {
          const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
          const damage = Math.ceil(speed / 2);
          pig.health -= damage;
          setScore(s => s + damage * 100);
          
          pig.velocityX += bird.velocityX * 0.6;
          pig.velocityY += bird.velocityY * 0.6;
          
          bird.velocityX *= 0.4;
          bird.velocityY *= 0.4;
        }
      });
    }
    
    // Update blocks
    blocksRef.current = blocksRef.current.filter(block => {
      if (block.health <= 0) {
        setScore(s => s + 100);
        createDebris(block.x, block.y, BLOCK_PROPERTIES[block.type].color);
        return false;
      }
      
      block.velocityY += GRAVITY * 0.6;
      block.x += block.velocityX;
      block.y += block.velocityY;
      block.velocityX *= 0.98;
      
      // Ground collision
      if (block.y + block.height / 2 > groundY) {
        block.y = groundY - block.height / 2;
        block.velocityY = -block.velocityY * 0.2;
        block.velocityX *= 0.7;
        
        if (Math.abs(block.velocityY) < 0.5) block.velocityY = 0;
      }
      
      // Wall collision
      if (block.x < block.width / 2) {
        block.x = block.width / 2;
        block.velocityX *= -0.5;
      }
      
      return true;
    });
    
    // Update pigs
    pigsRef.current = pigsRef.current.filter(pig => {
      if (pig.health <= 0) {
        setScore(s => s + 500);
        createExplosion(pig.x, pig.y, 50);
        return false;
      }
      
      pig.velocityY += GRAVITY * 0.6;
      pig.x += pig.velocityX;
      pig.y += pig.velocityY;
      pig.velocityX *= 0.98;
      
      // Ground collision
      if (pig.y + pig.radius > groundY) {
        pig.y = groundY - pig.radius;
        pig.velocityY = -pig.velocityY * 0.2;
        pig.velocityX *= 0.7;
      }
      
      return true;
    });
    
    // Update eggs
    eggsRef.current = eggsRef.current.filter(egg => {
      egg.velocityY += GRAVITY;
      egg.x += egg.velocityX;
      egg.y += egg.velocityY;
      
      // Ground or object collision - explode
      if (egg.y + egg.radius > groundY) {
        createExplosion(egg.x, groundY - 10, 80);
        
        // Damage nearby
        [...pigsRef.current, ...blocksRef.current].forEach(obj => {
          const dist = Math.sqrt((obj.x - egg.x) ** 2 + (obj.y - egg.y) ** 2);
          if (dist < 100) {
            const force = (100 - dist) / 100;
            obj.health -= Math.ceil(force * 3);
            obj.velocityY -= force * 12;
            obj.velocityX += (obj.x - egg.x) / dist * force * 8;
          }
        });
        
        return false;
      }
      
      return true;
    });
    
    // Update explosions
    explosionsRef.current = explosionsRef.current.filter(exp => {
      exp.radius += 6;
      exp.life -= 0.04;
      return exp.life > 0;
    });
    
    // Check if bird stopped and load next
    if (currentBirdRef.current?.hasLanded && gameStatus === 'flying') {
      const bird = currentBirdRef.current;
      if (Math.abs(bird.velocityX) < 0.3) {
        setTimeout(() => {
          loadNextBird();
        }, 800);
      }
    }
  };

  const loadNextBird = () => {
    const nextIndex = currentBirdIndex + 1;
    if (nextIndex < birdsRef.current.length) {
      setCurrentBirdIndex(nextIndex);
      currentBirdRef.current = {
        ...birdsRef.current[nextIndex],
        x: SLINGSHOT_X,
        y: SLINGSHOT_Y,
      };
      setGameStatus('waiting');
    } else {
      setGameStatus('finished');
    }
  };

  const checkBirdBlockCollision = (bird: AngryBird, block: Block): boolean => {
    const closestX = Math.max(block.x - block.width / 2, Math.min(bird.x, block.x + block.width / 2));
    const closestY = Math.max(block.y - block.height / 2, Math.min(bird.y, block.y + block.height / 2));
    const dist = Math.sqrt((bird.x - closestX) ** 2 + (bird.y - closestY) ** 2);
    return dist < bird.radius;
  };

  const checkGameEnd = () => {
    if (gameStatus === 'finished') {
      if (pigsRef.current.length === 0) {
        const starsEarned = score >= level.stars[2] ? 3 : score >= level.stars[1] ? 2 : score >= level.stars[0] ? 1 : 0;
        onLevelComplete(score, starsEarned);
      }
    }
  };

  // Drawing functions
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Mountains in background
    ctx.fillStyle = '#34495e';
    ctx.beginPath();
    ctx.moveTo(0, height - GROUND_HEIGHT - 50);
    ctx.lineTo(150, height - GROUND_HEIGHT - 150);
    ctx.lineTo(300, height - GROUND_HEIGHT - 80);
    ctx.lineTo(450, height - GROUND_HEIGHT - 180);
    ctx.lineTo(600, height - GROUND_HEIGHT - 100);
    ctx.lineTo(750, height - GROUND_HEIGHT - 160);
    ctx.lineTo(width, height - GROUND_HEIGHT - 60);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Ground with gradient
    const groundGradient = ctx.createLinearGradient(0, height - GROUND_HEIGHT, 0, height);
    groundGradient.addColorStop(0, '#27ae60');
    groundGradient.addColorStop(0.15, '#2ecc71');
    groundGradient.addColorStop(0.2, '#8B4513');
    groundGradient.addColorStop(1, '#5D3A1A');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // Grass blades
    ctx.fillStyle = '#27ae60';
    for (let x = 0; x < width; x += 8) {
      const grassHeight = 8 + Math.sin(x * 0.1 + timeRef.current * 2) * 3;
      ctx.fillRect(x, height - GROUND_HEIGHT - grassHeight + 5, 3, grassHeight);
    }
    
    // Clouds with animation
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const clouds = [
      [100 + Math.sin(timeRef.current * 0.3) * 20, 60],
      [350 + Math.sin(timeRef.current * 0.2 + 1) * 15, 40],
      [600 + Math.sin(timeRef.current * 0.25 + 2) * 25, 80],
      [800 + Math.sin(timeRef.current * 0.35 + 3) * 10, 50],
    ];
    
    clouds.forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 20, y - 8, 20, 0, Math.PI * 2);
      ctx.arc(x + 40, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 20, y + 5, 18, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Sun
    const sunGradient = ctx.createRadialGradient(width - 80, 70, 0, width - 80, 70, 50);
    sunGradient.addColorStop(0, '#FFD93D');
    sunGradient.addColorStop(0.5, '#FF9500');
    sunGradient.addColorStop(1, 'rgba(255, 149, 0, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(width - 80, 70, 50, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSlingshotBack = (ctx: CanvasRenderingContext2D) => {
    // Back band (behind bird)
    if (isDraggingRef.current && currentBirdRef.current) {
      ctx.strokeStyle = '#5D4E37';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X - 20, SLINGSHOT_Y - 45);
      ctx.lineTo(currentBirdRef.current.x, currentBirdRef.current.y);
      ctx.stroke();
    }
  };

  const drawSlingshotFront = (ctx: CanvasRenderingContext2D) => {
    // Slingshot shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(SLINGSHOT_X - 5, SLINGSHOT_Y + 95, 25, 10);
    
    // Slingshot base with wood texture
    const woodGradient = ctx.createLinearGradient(SLINGSHOT_X - 10, 0, SLINGSHOT_X + 10, 0);
    woodGradient.addColorStop(0, '#8B4513');
    woodGradient.addColorStop(0.3, '#A0522D');
    woodGradient.addColorStop(0.7, '#8B4513');
    woodGradient.addColorStop(1, '#654321');
    ctx.fillStyle = woodGradient;
    
    // Base
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 12, SLINGSHOT_Y + 100);
    ctx.lineTo(SLINGSHOT_X + 12, SLINGSHOT_Y + 100);
    ctx.lineTo(SLINGSHOT_X + 8, SLINGSHOT_Y - 10);
    ctx.lineTo(SLINGSHOT_X - 8, SLINGSHOT_Y - 10);
    ctx.closePath();
    ctx.fill();
    
    // Left fork
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 8, SLINGSHOT_Y - 10);
    ctx.lineTo(SLINGSHOT_X - 28, SLINGSHOT_Y - 60);
    ctx.lineTo(SLINGSHOT_X - 18, SLINGSHOT_Y - 65);
    ctx.lineTo(SLINGSHOT_X - 2, SLINGSHOT_Y - 10);
    ctx.closePath();
    ctx.fill();
    
    // Right fork
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X + 8, SLINGSHOT_Y - 10);
    ctx.lineTo(SLINGSHOT_X + 28, SLINGSHOT_Y - 60);
    ctx.lineTo(SLINGSHOT_X + 18, SLINGSHOT_Y - 65);
    ctx.lineTo(SLINGSHOT_X + 2, SLINGSHOT_Y - 10);
    ctx.closePath();
    ctx.fill();
    
    // Wood grain details
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X - 5 + i * 3, SLINGSHOT_Y + 100);
      ctx.lineTo(SLINGSHOT_X - 3 + i * 2, SLINGSHOT_Y - 10);
      ctx.stroke();
    }
    
    // Front band
    if (isDraggingRef.current && currentBirdRef.current) {
      ctx.strokeStyle = '#5D4E37';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X + 20, SLINGSHOT_Y - 45);
      ctx.lineTo(currentBirdRef.current.x, currentBirdRef.current.y);
      ctx.stroke();
    }
  };

  const drawPowerIndicator = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = Math.sqrt(dx * dx + dy * dy) / MAX_DRAG_DISTANCE;
    
    // Power bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(20, 130, 15, 100, 5);
    ctx.fill();
    
    // Power bar fill
    const powerGradient = ctx.createLinearGradient(20, 230, 20, 130);
    powerGradient.addColorStop(0, '#2ecc71');
    powerGradient.addColorStop(0.5, '#f1c40f');
    powerGradient.addColorStop(1, '#e74c3c');
    ctx.fillStyle = powerGradient;
    ctx.fillRect(22, 228 - power * 96, 11, power * 96);
    
    // Power text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(power * 100)}%`, 27, 245);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, bird: AngryBird) => {
    const props = BIRD_PROPERTIES[bird.type];
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(3, bird.radius - 5, bird.radius * 0.8, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body with gradient
    const bodyGradient = ctx.createRadialGradient(-bird.radius * 0.3, -bird.radius * 0.3, 0, 0, 0, bird.radius);
    bodyGradient.addColorStop(0, lightenColor(props.color, 30));
    bodyGradient.addColorStop(0.7, props.color);
    bodyGradient.addColorStop(1, darkenColor(props.color, 20));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = darkenColor(props.color, 30);
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Belly
    ctx.fillStyle = props.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, bird.radius * 0.35, bird.radius * 0.55, bird.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-bird.radius * 0.28, -bird.radius * 0.15, bird.radius * 0.22, bird.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bird.radius * 0.28, -bird.radius * 0.15, bird.radius * 0.22, bird.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils (looking forward when flying)
    const pupilOffsetX = bird.isFlying ? bird.radius * 0.08 : 0;
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.2 + pupilOffsetX, -bird.radius * 0.1, bird.radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.radius * 0.36 + pupilOffsetX, -bird.radius * 0.1, bird.radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.24 + pupilOffsetX, -bird.radius * 0.14, bird.radius * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.radius * 0.32 + pupilOffsetX, -bird.radius * 0.14, bird.radius * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.fillStyle = bird.type === 'black' ? '#444' : '#5D4037';
    ctx.save();
    ctx.translate(-bird.radius * 0.28, -bird.radius * 0.42);
    ctx.rotate(-0.35);
    ctx.fillRect(-bird.radius * 0.25, 0, bird.radius * 0.4, bird.radius * 0.1);
    ctx.restore();
    ctx.save();
    ctx.translate(bird.radius * 0.28, -bird.radius * 0.42);
    ctx.rotate(0.35);
    ctx.fillRect(-bird.radius * 0.15, 0, bird.radius * 0.4, bird.radius * 0.1);
    ctx.restore();
    
    // Beak
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(bird.radius * 0.45, bird.radius * 0.05);
    ctx.lineTo(bird.radius * 0.95, bird.radius * 0.2);
    ctx.lineTo(bird.radius * 0.45, bird.radius * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#E65100';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Tail feathers for certain birds
    if (bird.type === 'red' || bird.type === 'black') {
      ctx.fillStyle = bird.type === 'black' ? '#333' : '#C62828';
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.9, 0, bird.radius * 0.25, bird.radius * 0.08, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.85, -bird.radius * 0.15, bird.radius * 0.2, bird.radius * 0.06, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.85, bird.radius * 0.15, bird.radius * 0.2, bird.radius * 0.06, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Top feathers for red bird
    if (bird.type === 'red') {
      ctx.fillStyle = '#C62828';
      ctx.beginPath();
      ctx.ellipse(0, -bird.radius * 1.1, bird.radius * 0.08, bird.radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.12, -bird.radius * 1.05, bird.radius * 0.06, bird.radius * 0.15, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawPig = (ctx: CanvasRenderingContext2D, pig: Pig) => {
    ctx.save();
    ctx.translate(pig.x, pig.y);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(3, pig.radius - 3, pig.radius * 0.8, pig.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body with gradient
    const bodyColor = pig.isIron ? '#607D8B' : '#8BC34A';
    const bodyGradient = ctx.createRadialGradient(-pig.radius * 0.3, -pig.radius * 0.3, 0, 0, 0, pig.radius);
    bodyGradient.addColorStop(0, lightenColor(bodyColor, 25));
    bodyGradient.addColorStop(0.7, bodyColor);
    bodyGradient.addColorStop(1, darkenColor(bodyColor, 15));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pig.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Iron armor effect
    if (pig.isIron) {
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      // Helmet
      ctx.fillStyle = '#455A64';
      ctx.beginPath();
      ctx.arc(0, -pig.radius * 0.2, pig.radius * 0.9, Math.PI, 0, false);
      ctx.fill();
      
      // Rivets
      ctx.fillStyle = '#263238';
      const rivetPositions = [
        [-pig.radius * 0.6, -pig.radius * 0.5],
        [pig.radius * 0.6, -pig.radius * 0.5],
        [-pig.radius * 0.7, 0],
        [pig.radius * 0.7, 0],
        [-pig.radius * 0.5, pig.radius * 0.5],
        [pig.radius * 0.5, pig.radius * 0.5],
      ];
      rivetPositions.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Ears
    ctx.fillStyle = pig.isIron ? '#78909C' : '#689F38';
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.7, -pig.radius * 0.6, pig.radius * 0.25, pig.radius * 0.35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.7, -pig.radius * 0.6, pig.radius * 0.25, pig.radius * 0.35, 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Snout
    ctx.fillStyle = pig.isIron ? '#90A4AE' : '#7CB342';
    ctx.beginPath();
    ctx.ellipse(0, pig.radius * 0.15, pig.radius * 0.45, pig.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pig.isIron ? '#607D8B' : '#558B2F';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Nostrils
    ctx.fillStyle = '#33691E';
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.15, pig.radius * 0.15, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.15, pig.radius * 0.15, 5, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.32, -pig.radius * 0.2, pig.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.32, -pig.radius * 0.2, pig.radius * 0.22, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.28, -pig.radius * 0.15, pig.radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.36, -pig.radius * 0.15, pig.radius * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.32, -pig.radius * 0.2, pig.radius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.32, -pig.radius * 0.2, pig.radius * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    const healthPercent = pig.health / pig.maxHealth;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.roundRect(-pig.radius, -pig.radius - 18, pig.radius * 2, 10, 3);
    ctx.fill();
    
    const healthGradient = ctx.createLinearGradient(-pig.radius, 0, pig.radius, 0);
    if (healthPercent > 0.5) {
      healthGradient.addColorStop(0, '#27ae60');
      healthGradient.addColorStop(1, '#2ecc71');
    } else if (healthPercent > 0.25) {
      healthGradient.addColorStop(0, '#e67e22');
      healthGradient.addColorStop(1, '#f39c12');
    } else {
      healthGradient.addColorStop(0, '#c0392b');
      healthGradient.addColorStop(1, '#e74c3c');
    }
    ctx.fillStyle = healthGradient;
    ctx.roundRect(-pig.radius + 2, -pig.radius - 16, (pig.radius * 2 - 4) * healthPercent, 6, 2);
    ctx.fill();
    
    ctx.restore();
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, block: Block) => {
    const props = BLOCK_PROPERTIES[block.type];
    const healthPercent = block.health / block.maxHealth;
    
    ctx.save();
    ctx.translate(block.x, block.y);
    ctx.rotate(block.rotation);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(-block.width / 2 + 4, -block.height / 2 + 4, block.width, block.height);
    
    // Block with gradient
    const blockGradient = ctx.createLinearGradient(-block.width / 2, -block.height / 2, block.width / 2, block.height / 2);
    blockGradient.addColorStop(0, lightenColor(props.color, 15));
    blockGradient.addColorStop(0.5, props.color);
    blockGradient.addColorStop(1, darkenColor(props.color, 15));
    ctx.fillStyle = blockGradient;
    ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
    
    // Texture based on block type
    if (block.type === 'wood') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        const y = -block.height / 2 + (block.height / 4) * i + block.height / 8;
        ctx.beginPath();
        ctx.moveTo(-block.width / 2 + 2, y);
        ctx.lineTo(block.width / 2 - 2, y);
        ctx.stroke();
      }
    } else if (block.type === 'stone' || block.type === 'iron') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(-block.width / 2, -block.height / 2, block.width / 2, block.height / 3);
    } else if (block.type === 'glass') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-block.width / 2 + 3, -block.height / 2 + 3, block.width * 0.3, block.height * 0.3);
    }
    
    // Damage cracks
    if (healthPercent < 1) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2;
      const numCracks = Math.ceil((1 - healthPercent) * 6);
      for (let i = 0; i < numCracks; i++) {
        const startX = (Math.random() - 0.5) * block.width * 0.8;
        const startY = (Math.random() - 0.5) * block.height * 0.8;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (Math.random() - 0.5) * 20, startY + (Math.random() - 0.5) * 20);
        ctx.lineTo(startX + (Math.random() - 0.5) * 30, startY + (Math.random() - 0.5) * 30);
        ctx.stroke();
      }
    }
    
    // Border
    ctx.strokeStyle = darkenColor(props.color, 25);
    ctx.lineWidth = 2;
    ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height);
    
    ctx.restore();
  };

  const drawEgg = (ctx: CanvasRenderingContext2D, egg: Egg) => {
    ctx.save();
    ctx.translate(egg.x, egg.y);
    ctx.rotate(Math.atan2(egg.velocityY, egg.velocityX));
    
    // Egg shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(2, 2, egg.radius * 0.7, egg.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Egg with gradient
    const eggGradient = ctx.createRadialGradient(-egg.radius * 0.3, -egg.radius * 0.3, 0, 0, 0, egg.radius);
    eggGradient.addColorStop(0, '#FFFDE7');
    eggGradient.addColorStop(0.7, '#FFF8E1');
    eggGradient.addColorStop(1, '#FFE082');
    ctx.fillStyle = eggGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, egg.radius * 0.7, egg.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, exp: Explosion) => {
    const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
    gradient.addColorStop(0, `rgba(255, 255, 200, ${exp.life})`);
    gradient.addColorStop(0.3, `rgba(255, 200, 50, ${exp.life * 0.8})`);
    gradient.addColorStop(0.6, `rgba(255, 100, 0, ${exp.life * 0.5})`);
    gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Explosion ring
    ctx.strokeStyle = `rgba(255, 150, 50, ${exp.life * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.8, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = 0.18;
    
    let vx = dx * power;
    let vy = dy * power;
    let x = SLINGSHOT_X;
    let y = SLINGSHOT_Y;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - GROUND_HEIGHT;
    
    for (let i = 0; i < 60; i += 2) {
      x += vx;
      y += vy;
      vy += GRAVITY;
      
      if (y > groundY - 10) break;
      
      const alpha = 1 - (i / 60);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(x, y, 4 - (i / 30), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawUI = (ctx: CanvasRenderingContext2D, width: number) => {
    // Score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(width - 180, 10, 170, 45, 10);
    ctx.fill();
    
    // Score
    ctx.fillStyle = '#FFD93D';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, width - 20, 42);
    
    // Score label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.fillText('SCORE', width - 20, 25);
    
    // Level info background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.roundRect(60, 10, 150, 35, 10);
    ctx.fill();
    
    // Level name
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.fillStyle = 'white';
    ctx.fillText(level.nameAr, 70, 35);
    
    // Bird type indicator (when aiming)
    if (currentBirdRef.current && gameStatus !== 'finished') {
      const bird = currentBirdRef.current;
      const props = BIRD_PROPERTIES[bird.type];
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.roundRect(60, 55, 180, 45, 10);
      ctx.fill();
      
      // Bird icon
      ctx.fillStyle = props.color;
      ctx.beginPath();
      ctx.arc(85, 78, 15, 0, Math.PI * 2);
      ctx.fill();
      
      // Special ability text
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.fillText(props.special, 108, 82);
    }
  };

  // Helper functions for color manipulation
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
    <div className="relative w-full max-w-4xl mx-auto">
      <canvas
        ref={canvasRef}
        width={900}
        height={550}
        className="w-full rounded-2xl shadow-2xl cursor-crosshair border-4 border-amber-900/50"
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Back button */}
      <button
        onClick={onBackToMenu}
        className="absolute top-4 left-4 bg-black/50 hover:bg-black/70 backdrop-blur-sm px-5 py-2.5 rounded-full text-white font-bold transition-all flex items-center gap-2 border border-white/20"
      >
        <span>←</span>
        <span>رجوع</span>
      </button>
      
      {/* Instructions */}
      {gameStatus === 'waiting' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm px-8 py-4 rounded-full text-white text-center border border-white/20">
          <span className="text-lg">🎯 اسحب الطائر للخلف ثم أفلت للإطلاق!</span>
        </div>
      )}
      
      {/* Special ability hint */}
      {gameStatus === 'flying' && currentBirdRef.current && !currentBirdRef.current.specialUsed && currentBirdRef.current.type !== 'red' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-yellow-500/80 backdrop-blur-sm px-6 py-3 rounded-full text-black font-bold animate-pulse">
          اضغط لتفعيل القدرة الخاصة! ⚡
        </div>
      )}
      
      {/* Game Over */}
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center rounded-2xl backdrop-blur-sm">
          <div className="text-center text-white p-8">
            {pigsRef.current.length === 0 ? (
              <>
                <h2 className="text-5xl font-bold mb-6 text-yellow-400 animate-bounce">🎉 فوز! 🎉</h2>
                <p className="text-3xl mb-6">النتيجة: <span className="text-yellow-400">{score}</span></p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold mb-4 text-red-400">😢 انتهت الطيور!</h2>
                <p className="text-xl mb-6 text-white/70">حاول مرة أخرى</p>
              </>
            )}
            <button
              onClick={onBackToMenu}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 px-10 py-4 rounded-full font-bold text-xl hover:scale-105 transition-transform shadow-lg"
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
