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

const GRAVITY = 0.35;
const GROUND_HEIGHT = 100;
const SLINGSHOT_X = 160;
const SLINGSHOT_Y = 280;
const MAX_DRAG_DISTANCE = 120;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

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
  const particlesRef = useRef<Particle[]>([]);
  
  const isDraggingRef = useRef(false);
  const dragCurrentRef = useRef({ x: SLINGSHOT_X, y: SLINGSHOT_Y });
  const timeRef = useRef(0);
  const flightTimeRef = useRef(0);
  const birdTransitionRef = useRef(false);
  const gameEndedRef = useRef(false);

  // Initialize level
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const groundY = canvas.height - GROUND_HEIGHT;
    
    // Create birds queue
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

    // Create pigs with adjusted Y positions
    pigsRef.current = level.pigs.map((pig, index) => ({
      ...pig,
      id: `pig-${index}`,
      y: pig.y + 20,
      velocityX: 0,
      velocityY: 0,
    }));

    // Create blocks with adjusted Y positions
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
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20;
      const speed = 4 + Math.random() * 6;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: ['#FF6B35', '#FFD93D', '#FF4444', '#FFFFFF', '#FFA500'][Math.floor(Math.random() * 5)],
        size: 4 + Math.random() * 5,
      });
    }
  };

  const createDebris = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: -Math.random() * 8 - 3,
        life: 1,
        color,
        size: 3 + Math.random() * 4,
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
    
    if (dist < 100) {
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
    if (pullDistance < 25) {
      // Reset bird position
      currentBirdRef.current.x = SLINGSHOT_X;
      currentBirdRef.current.y = SLINGSHOT_Y;
      setGameStatus('waiting');
      return;
    }
    
    const power = 0.17;
    currentBirdRef.current.velocityX = dx * power;
    currentBirdRef.current.velocityY = dy * power;
    currentBirdRef.current.isFlying = true;
    flightTimeRef.current = 0;
    
    setGameStatus('flying');
  }, []);

  const handleClick = useCallback(() => {
    // Handle special abilities when bird is flying
    if (gameStatus !== 'flying' || !currentBirdRef.current) return;
    
    const bird = currentBirdRef.current;
    if (bird.specialUsed) return;
    
    if (bird.type === 'yellow') {
      // Speed boost
      bird.velocityX *= 1.9;
      bird.velocityY *= 0.5;
      bird.specialUsed = true;
      
      // Visual effect
      for (let i = 0; i < 15; i++) {
        particlesRef.current.push({
          x: bird.x,
          y: bird.y,
          vx: -bird.velocityX * 0.3 + (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
          color: '#FFD93D',
          size: 5,
        });
      }
    } else if (bird.type === 'black') {
      // Explode
      createExplosion(bird.x, bird.y, 140);
      bird.specialUsed = true;
      bird.hasLanded = true;
      
      // Damage nearby objects
      [...pigsRef.current, ...blocksRef.current].forEach(obj => {
        const dist = Math.sqrt((obj.x - bird.x) ** 2 + (obj.y - bird.y) ** 2);
        if (dist < 180) {
          const force = (180 - dist) / 180;
          obj.health -= Math.ceil(force * 5);
          const angle = Math.atan2(obj.y - bird.y, obj.x - bird.x);
          obj.velocityX += Math.cos(angle) * force * 25;
          obj.velocityY += Math.sin(angle) * force * 25 - 8;
        }
      });
    } else if (bird.type === 'white') {
      // Drop egg
      eggsRef.current.push({
        x: bird.x,
        y: bird.y + bird.radius,
        velocityX: bird.velocityX * 0.2,
        velocityY: 10,
        radius: 18,
      });
      bird.velocityY = -12;
      bird.specialUsed = true;
    }
  }, [gameStatus]);

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
      timeRef.current += 0.016;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky gradient
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGradient.addColorStop(0, '#0f2027');
      skyGradient.addColorStop(0.2, '#203a43');
      skyGradient.addColorStop(0.5, '#2c5364');
      skyGradient.addColorStop(0.8, '#56ab91');
      skyGradient.addColorStop(1, '#88d3a7');
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
      
      // Draw rubber band back
      if (isDraggingRef.current && currentBirdRef.current) {
        drawRubberBand(ctx, currentBirdRef.current, 'back');
      }
      
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
      
      // Draw rubber band front
      if (isDraggingRef.current && currentBirdRef.current) {
        drawRubberBand(ctx, currentBirdRef.current, 'front');
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
        drawBird(ctx, { ...bird, x: 40 + index * 50, y: groundY - bird.radius - 8 });
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
      p.vy += 0.25;
      p.life -= 0.018;
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
    if (currentBirdRef.current?.isFlying) {
      const bird = currentBirdRef.current;
      flightTimeRef.current += 0.016;
      
      if (!bird.hasLanded) {
        bird.velocityY += GRAVITY;
        bird.x += bird.velocityX;
        bird.y += bird.velocityY;
        bird.rotation += bird.velocityX * 0.03;
        
        // Trail effect for flying bird
        if (Math.random() > 0.6) {
          particlesRef.current.push({
            x: bird.x - bird.velocityX * 0.5,
            y: bird.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 0.6,
            color: BIRD_PROPERTIES[bird.type].color,
            size: 4,
          });
        }
        
        // Ground collision
        if (bird.y + bird.radius > groundY) {
          bird.y = groundY - bird.radius;
          bird.hasLanded = true;
          bird.velocityX *= 0.4;
          bird.velocityY = -bird.velocityY * 0.2;
          if (Math.abs(bird.velocityY) < 1) bird.velocityY = 0;
          createDebris(bird.x, bird.y, '#8B7355');
        }
        
        // Top boundary check - bird went too high
        if (bird.y < -100) {
          bird.hasLanded = true;
        }
        
        // Left wall collision
        if (bird.x < bird.radius) {
          bird.x = bird.radius;
          bird.velocityX *= -0.5;
          bird.hasLanded = true;
        }
        
        // Right boundary - bird flew off screen
        if (bird.x > canvasRef.current!.width + 50) {
          bird.hasLanded = true;
        }
      } else {
        // Apply friction when on ground
        bird.velocityX *= 0.92;
        bird.velocityY = 0;
        if (Math.abs(bird.velocityX) < 0.1) bird.velocityX = 0;
      }
      
      // Block collision
      blocksRef.current.forEach(block => {
        if (checkBirdBlockCollision(bird, block)) {
          const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
          const damage = Math.ceil(speed / 2.2);
          block.health -= damage;
          setScore(s => s + damage * 50);
          
          createDebris(bird.x, bird.y, BLOCK_PROPERTIES[block.type].color);
          
          // Transfer momentum
          block.velocityX += bird.velocityX * 0.5;
          block.velocityY += bird.velocityY * 0.5;
          
          bird.velocityX *= -0.15;
          bird.velocityY *= -0.15;
        }
      });
      
      // Pig collision
      pigsRef.current.forEach(pig => {
        const dist = Math.sqrt((bird.x - pig.x) ** 2 + (bird.y - pig.y) ** 2);
        if (dist < bird.radius + pig.radius) {
          const speed = Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2);
          const damage = Math.ceil(speed / 1.8);
          pig.health -= damage;
          setScore(s => s + damage * 100);
          
          pig.velocityX += bird.velocityX * 0.7;
          pig.velocityY += bird.velocityY * 0.7;
          
          bird.velocityX *= 0.35;
          bird.velocityY *= 0.35;
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
        createExplosion(pig.x, pig.y, 60);
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
        createExplosion(egg.x, groundY - 10, 100);
        
        // Damage nearby
        [...pigsRef.current, ...blocksRef.current].forEach(obj => {
          const dist = Math.sqrt((obj.x - egg.x) ** 2 + (obj.y - egg.y) ** 2);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            obj.health -= Math.ceil(force * 4);
            obj.velocityY -= force * 15;
            obj.velocityX += (obj.x - egg.x) / dist * force * 10;
          }
        });
        
        return false;
      }
      
      return true;
    });
    
    // Update explosions
    explosionsRef.current = explosionsRef.current.filter(exp => {
      exp.radius += 8;
      exp.life -= 0.035;
      return exp.life > 0;
    });
    
    // Check if bird stopped and load next
    if (currentBirdRef.current && gameStatus === 'flying' && !gameEndedRef.current) {
      const bird = currentBirdRef.current;
      const isOutOfBounds = bird.x > canvasRef.current!.width + 50 || bird.x < -50 || bird.y < -100;
      const hasStopped = bird.hasLanded && Math.abs(bird.velocityX) < 0.3;
      const flownTooLong = flightTimeRef.current > 8; // Max 8 seconds flight
      
      if ((isOutOfBounds || hasStopped || flownTooLong) && !birdTransitionRef.current) {
        birdTransitionRef.current = true;
        
        // Wait a bit for physics to settle before loading next bird
        setTimeout(() => {
          // Double check game hasn't ended
          if (!gameEndedRef.current) {
            loadNextBird();
          }
          birdTransitionRef.current = false;
        }, 600);
      }
    }
  };

  const loadNextBird = () => {
    // Don't load if game already ended
    if (gameEndedRef.current) return;
    
    // Check if all pigs destroyed first
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
      // No more birds
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
    
    // Win condition: all pigs destroyed
    if (pigsRef.current.length === 0) {
      gameEndedRef.current = true;
      // Calculate bonus for unused birds
      const unusedBirds = birdsRef.current.length - currentBirdIndex - 1;
      const bonus = Math.max(0, unusedBirds) * 1000;
      const finalScore = score + bonus;
      
      const starsEarned = finalScore >= level.stars[2] ? 3 : finalScore >= level.stars[1] ? 2 : finalScore >= level.stars[0] ? 1 : 0;
      
      // Update score display and notify after delay
      setScore(finalScore);
      setTimeout(() => {
        onLevelComplete(finalScore, Math.max(1, starsEarned));
      }, 1000);
      return;
    }
    
    // Lose condition: game finished (no more birds) and pigs still alive
    if (gameStatus === 'finished' && pigsRef.current.length > 0) {
      gameEndedRef.current = true;
      setTimeout(() => {
        onLevelComplete(score, 0);
      }, 1000);
    }
  }, [score, currentBirdIndex, level.stars, gameStatus, onLevelComplete]);

  // Drawing functions
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Stars in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 40; i++) {
      const x = (i * 137 + timeRef.current * 2) % width;
      const y = (i * 89) % (height * 0.4);
      const size = 1 + Math.sin(timeRef.current * 2 + i) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Far mountains
    ctx.fillStyle = '#1a3a3a';
    ctx.beginPath();
    ctx.moveTo(0, height - GROUND_HEIGHT - 30);
    ctx.lineTo(100, height - GROUND_HEIGHT - 100);
    ctx.lineTo(200, height - GROUND_HEIGHT - 60);
    ctx.lineTo(350, height - GROUND_HEIGHT - 140);
    ctx.lineTo(500, height - GROUND_HEIGHT - 80);
    ctx.lineTo(650, height - GROUND_HEIGHT - 130);
    ctx.lineTo(800, height - GROUND_HEIGHT - 70);
    ctx.lineTo(width, height - GROUND_HEIGHT - 50);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Near mountains
    ctx.fillStyle = '#2d4a4a';
    ctx.beginPath();
    ctx.moveTo(0, height - GROUND_HEIGHT - 10);
    ctx.lineTo(80, height - GROUND_HEIGHT - 70);
    ctx.lineTo(180, height - GROUND_HEIGHT - 40);
    ctx.lineTo(300, height - GROUND_HEIGHT - 95);
    ctx.lineTo(450, height - GROUND_HEIGHT - 55);
    ctx.lineTo(580, height - GROUND_HEIGHT - 85);
    ctx.lineTo(700, height - GROUND_HEIGHT - 45);
    ctx.lineTo(850, height - GROUND_HEIGHT - 75);
    ctx.lineTo(width, height - GROUND_HEIGHT - 30);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
    
    // Ground with gradient
    const groundGradient = ctx.createLinearGradient(0, height - GROUND_HEIGHT, 0, height);
    groundGradient.addColorStop(0, '#4ade80');
    groundGradient.addColorStop(0.08, '#22c55e');
    groundGradient.addColorStop(0.15, '#7c5a3f');
    groundGradient.addColorStop(0.5, '#5c4033');
    groundGradient.addColorStop(1, '#3d2817');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // Grass blades
    for (let x = 0; x < width; x += 6) {
      const grassHeight = 12 + Math.sin(x * 0.08 + timeRef.current * 1.5) * 4;
      const grassGradient = ctx.createLinearGradient(0, height - GROUND_HEIGHT - grassHeight, 0, height - GROUND_HEIGHT);
      grassGradient.addColorStop(0, '#34d399');
      grassGradient.addColorStop(1, '#22c55e');
      ctx.fillStyle = grassGradient;
      ctx.fillRect(x, height - GROUND_HEIGHT - grassHeight + 5, 4, grassHeight);
    }
    
    // Clouds with animation
    const clouds = [
      [80 + Math.sin(timeRef.current * 0.25) * 25, 50, 1],
      [300 + Math.sin(timeRef.current * 0.18 + 1) * 20, 35, 0.9],
      [550 + Math.sin(timeRef.current * 0.22 + 2) * 30, 65, 1.1],
      [780 + Math.sin(timeRef.current * 0.3 + 3) * 15, 45, 0.85],
    ];
    
    clouds.forEach(([x, y, scale]) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(x, y, 28 * scale, 0, Math.PI * 2);
      ctx.arc(x + 25 * scale, y - 10 * scale, 22 * scale, 0, Math.PI * 2);
      ctx.arc(x + 50 * scale, y, 28 * scale, 0, Math.PI * 2);
      ctx.arc(x + 25 * scale, y + 8 * scale, 20 * scale, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Sun with glow
    const sunX = width - 90;
    const sunY = 80;
    
    // Sun glow
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGlow.addColorStop(0, 'rgba(255, 220, 100, 0.8)');
    sunGlow.addColorStop(0.3, 'rgba(255, 180, 50, 0.4)');
    sunGlow.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();
    
    // Sun core
    const sunCore = ctx.createRadialGradient(sunX - 10, sunY - 10, 0, sunX, sunY, 40);
    sunCore.addColorStop(0, '#fffde7');
    sunCore.addColorStop(0.5, '#ffd54f');
    sunCore.addColorStop(1, '#ff9800');
    ctx.fillStyle = sunCore;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 40, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawSlingshotBack = (ctx: CanvasRenderingContext2D) => {
    // Back fork (behind bird)
    const woodGradient = ctx.createLinearGradient(SLINGSHOT_X - 30, 0, SLINGSHOT_X - 10, 0);
    woodGradient.addColorStop(0, '#5d4037');
    woodGradient.addColorStop(0.5, '#795548');
    woodGradient.addColorStop(1, '#4e342e');
    ctx.fillStyle = woodGradient;
    
    // Back fork
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 28, SLINGSHOT_Y - 55);
    ctx.lineTo(SLINGSHOT_X - 18, SLINGSHOT_Y - 60);
    ctx.lineTo(SLINGSHOT_X - 6, SLINGSHOT_Y - 5);
    ctx.lineTo(SLINGSHOT_X - 14, SLINGSHOT_Y - 5);
    ctx.closePath();
    ctx.fill();
    
    // Fork top
    ctx.beginPath();
    ctx.arc(SLINGSHOT_X - 23, SLINGSHOT_Y - 58, 8, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawRubberBand = (ctx: CanvasRenderingContext2D, bird: AngryBird, side: 'back' | 'front') => {
    const bandGradient = ctx.createLinearGradient(
      SLINGSHOT_X, SLINGSHOT_Y - 50,
      bird.x, bird.y
    );
    bandGradient.addColorStop(0, '#8d6e63');
    bandGradient.addColorStop(0.5, '#6d4c41');
    bandGradient.addColorStop(1, '#5d4037');
    
    ctx.strokeStyle = bandGradient;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    
    if (side === 'back') {
      ctx.moveTo(SLINGSHOT_X - 23, SLINGSHOT_Y - 50);
    } else {
      ctx.moveTo(SLINGSHOT_X + 23, SLINGSHOT_Y - 50);
    }
    ctx.lineTo(bird.x, bird.y);
    ctx.stroke();
    
    // Inner band highlight
    ctx.strokeStyle = 'rgba(161, 136, 127, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const drawSlingshotFront = (ctx: CanvasRenderingContext2D) => {
    // Slingshot shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(SLINGSHOT_X + 5, SLINGSHOT_Y + 130, 30, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Slingshot base with wood texture
    const woodGradient = ctx.createLinearGradient(SLINGSHOT_X - 15, 0, SLINGSHOT_X + 15, 0);
    woodGradient.addColorStop(0, '#5d4037');
    woodGradient.addColorStop(0.3, '#8d6e63');
    woodGradient.addColorStop(0.7, '#6d4c41');
    woodGradient.addColorStop(1, '#4e342e');
    ctx.fillStyle = woodGradient;
    
    // Base trunk
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 18, SLINGSHOT_Y + 120);
    ctx.lineTo(SLINGSHOT_X + 18, SLINGSHOT_Y + 120);
    ctx.lineTo(SLINGSHOT_X + 12, SLINGSHOT_Y - 5);
    ctx.lineTo(SLINGSHOT_X - 12, SLINGSHOT_Y - 5);
    ctx.closePath();
    ctx.fill();
    
    // Front fork
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X + 28, SLINGSHOT_Y - 55);
    ctx.lineTo(SLINGSHOT_X + 18, SLINGSHOT_Y - 60);
    ctx.lineTo(SLINGSHOT_X + 6, SLINGSHOT_Y - 5);
    ctx.lineTo(SLINGSHOT_X + 14, SLINGSHOT_Y - 5);
    ctx.closePath();
    ctx.fill();
    
    // Fork top
    ctx.beginPath();
    ctx.arc(SLINGSHOT_X + 23, SLINGSHOT_Y - 58, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Wood grain details
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X - 10 + i * 4, SLINGSHOT_Y + 120);
      ctx.bezierCurveTo(
        SLINGSHOT_X - 8 + i * 3, SLINGSHOT_Y + 60,
        SLINGSHOT_X - 5 + i * 2, SLINGSHOT_Y + 30,
        SLINGSHOT_X - 6 + i * 2, SLINGSHOT_Y - 5
      );
      ctx.stroke();
    }
    
    // Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(SLINGSHOT_X - 10, SLINGSHOT_Y + 115);
    ctx.lineTo(SLINGSHOT_X - 6, SLINGSHOT_Y);
    ctx.stroke();
  };

  const drawPowerIndicator = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / MAX_DRAG_DISTANCE, 1);
    
    const barX = 25;
    const barY = 160;
    const barWidth = 18;
    const barHeight = 120;
    
    // Power bar background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 10);
    ctx.fill();
    
    // Power bar border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Power bar fill
    const powerGradient = ctx.createLinearGradient(barX, barY + barHeight, barX, barY);
    powerGradient.addColorStop(0, '#22c55e');
    powerGradient.addColorStop(0.4, '#eab308');
    powerGradient.addColorStop(0.7, '#f97316');
    powerGradient.addColorStop(1, '#ef4444');
    ctx.fillStyle = powerGradient;
    
    const fillHeight = power * barHeight;
    ctx.beginPath();
    ctx.roundRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, 6);
    ctx.fill();
    
    // Power percentage text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(power * 100)}%`, barX + barWidth / 2, barY + barHeight + 20);
    
    // Label
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('قوة', barX + barWidth / 2, barY - 10);
  };

  const drawBird = (ctx: CanvasRenderingContext2D, bird: AngryBird) => {
    const props = BIRD_PROPERTIES[bird.type];
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(4, bird.radius - 3, bird.radius * 0.85, bird.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body with gradient
    const bodyGradient = ctx.createRadialGradient(-bird.radius * 0.35, -bird.radius * 0.35, 0, 0, 0, bird.radius * 1.1);
    bodyGradient.addColorStop(0, lightenColor(props.color, 40));
    bodyGradient.addColorStop(0.5, props.color);
    bodyGradient.addColorStop(1, darkenColor(props.color, 30));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Outline
    ctx.strokeStyle = darkenColor(props.color, 40);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Belly
    ctx.fillStyle = props.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, bird.radius * 0.38, bird.radius * 0.58, bird.radius * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-bird.radius * 0.3, -bird.radius * 0.12, bird.radius * 0.24, bird.radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(bird.radius * 0.3, -bird.radius * 0.12, bird.radius * 0.24, bird.radius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils (looking forward when flying)
    const pupilOffsetX = bird.isFlying ? bird.radius * 0.1 : 0;
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.22 + pupilOffsetX, -bird.radius * 0.08, bird.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.radius * 0.38 + pupilOffsetX, -bird.radius * 0.08, bird.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.26 + pupilOffsetX, -bird.radius * 0.14, bird.radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bird.radius * 0.34 + pupilOffsetX, -bird.radius * 0.14, bird.radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.fillStyle = bird.type === 'black' ? '#2d2d2d' : '#4e342e';
    ctx.save();
    ctx.translate(-bird.radius * 0.3, -bird.radius * 0.45);
    ctx.rotate(-0.4);
    ctx.fillRect(-bird.radius * 0.28, 0, bird.radius * 0.45, bird.radius * 0.12);
    ctx.restore();
    ctx.save();
    ctx.translate(bird.radius * 0.3, -bird.radius * 0.45);
    ctx.rotate(0.4);
    ctx.fillRect(-bird.radius * 0.17, 0, bird.radius * 0.45, bird.radius * 0.12);
    ctx.restore();
    
    // Beak
    const beakGradient = ctx.createLinearGradient(bird.radius * 0.4, 0, bird.radius * 1.1, bird.radius * 0.2);
    beakGradient.addColorStop(0, '#ffc107');
    beakGradient.addColorStop(1, '#ff9800');
    ctx.fillStyle = beakGradient;
    ctx.beginPath();
    ctx.moveTo(bird.radius * 0.48, bird.radius * 0.02);
    ctx.lineTo(bird.radius * 1.05, bird.radius * 0.22);
    ctx.lineTo(bird.radius * 0.48, bird.radius * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Tail feathers
    if (bird.type === 'red' || bird.type === 'black') {
      ctx.fillStyle = bird.type === 'black' ? '#1a1a1a' : '#b71c1c';
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.95, 0, bird.radius * 0.28, bird.radius * 0.1, 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.9, -bird.radius * 0.18, bird.radius * 0.22, bird.radius * 0.08, -0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.9, bird.radius * 0.18, bird.radius * 0.22, bird.radius * 0.08, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Top feathers for red bird
    if (bird.type === 'red') {
      ctx.fillStyle = '#b71c1c';
      ctx.beginPath();
      ctx.ellipse(0, -bird.radius * 1.15, bird.radius * 0.1, bird.radius * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-bird.radius * 0.14, -bird.radius * 1.08, bird.radius * 0.08, bird.radius * 0.18, 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Special effect indicators
    if (bird.type === 'yellow' && !bird.specialUsed && bird.isFlying) {
      ctx.strokeStyle = 'rgba(255, 235, 59, 0.6)';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    if (bird.type === 'black' && !bird.specialUsed && bird.isFlying) {
      // Fuse spark
      ctx.fillStyle = '#ff5722';
      const sparkSize = 4 + Math.sin(timeRef.current * 15) * 2;
      ctx.beginPath();
      ctx.arc(bird.radius * 0.2, -bird.radius * 1.1, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  };

  const drawPig = (ctx: CanvasRenderingContext2D, pig: Pig) => {
    ctx.save();
    ctx.translate(pig.x, pig.y);
    
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(4, pig.radius - 2, pig.radius * 0.85, pig.radius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Body with gradient
    const bodyColor = pig.isIron ? '#607D8B' : '#7cb342';
    const bodyGradient = ctx.createRadialGradient(-pig.radius * 0.35, -pig.radius * 0.35, 0, 0, 0, pig.radius * 1.1);
    bodyGradient.addColorStop(0, lightenColor(bodyColor, 30));
    bodyGradient.addColorStop(0.6, bodyColor);
    bodyGradient.addColorStop(1, darkenColor(bodyColor, 25));
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, pig.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Iron armor effect
    if (pig.isIron) {
      ctx.strokeStyle = '#37474F';
      ctx.lineWidth = 5;
      ctx.stroke();
      
      // Helmet
      const helmetGradient = ctx.createLinearGradient(-pig.radius, -pig.radius, pig.radius, 0);
      helmetGradient.addColorStop(0, '#78909c');
      helmetGradient.addColorStop(0.5, '#546e7a');
      helmetGradient.addColorStop(1, '#37474f');
      ctx.fillStyle = helmetGradient;
      ctx.beginPath();
      ctx.arc(0, -pig.radius * 0.15, pig.radius * 0.95, Math.PI, 0, false);
      ctx.fill();
      
      // Rivets
      ctx.fillStyle = '#263238';
      const rivetPositions = [
        [-pig.radius * 0.65, -pig.radius * 0.45],
        [pig.radius * 0.65, -pig.radius * 0.45],
        [-pig.radius * 0.75, 0],
        [pig.radius * 0.75, 0],
        [-pig.radius * 0.55, pig.radius * 0.55],
        [pig.radius * 0.55, pig.radius * 0.55],
      ];
      rivetPositions.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        // Rivet highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x - 1, y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#263238';
      });
    } else {
      ctx.strokeStyle = darkenColor(bodyColor, 30);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    
    // Ears
    ctx.fillStyle = pig.isIron ? '#78909C' : '#558b2f';
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.75, -pig.radius * 0.55, pig.radius * 0.28, pig.radius * 0.38, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.75, -pig.radius * 0.55, pig.radius * 0.28, pig.radius * 0.38, 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Snout
    const snoutGradient = ctx.createRadialGradient(0, pig.radius * 0.15, 0, 0, pig.radius * 0.15, pig.radius * 0.5);
    snoutGradient.addColorStop(0, pig.isIron ? '#b0bec5' : '#8bc34a');
    snoutGradient.addColorStop(1, pig.isIron ? '#78909C' : '#689f38');
    ctx.fillStyle = snoutGradient;
    ctx.beginPath();
    ctx.ellipse(0, pig.radius * 0.18, pig.radius * 0.5, pig.radius * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = pig.isIron ? '#607D8B' : '#4caf50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Nostrils
    ctx.fillStyle = '#33691E';
    ctx.beginPath();
    ctx.ellipse(-pig.radius * 0.18, pig.radius * 0.18, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(pig.radius * 0.18, pig.radius * 0.18, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.35, -pig.radius * 0.18, pig.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.35, -pig.radius * 0.18, pig.radius * 0.24, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.3, -pig.radius * 0.12, pig.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.4, -pig.radius * 0.12, pig.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye highlights
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.35, -pig.radius * 0.22, pig.radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pig.radius * 0.35, -pig.radius * 0.22, pig.radius * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    const healthPercent = pig.health / pig.maxHealth;
    const barWidth = pig.radius * 2.2;
    const barHeight = 10;
    const barY = -pig.radius - 22;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2 - 2, barY - 2, barWidth + 4, barHeight + 4, 5);
    ctx.fill();
    
    const healthGradient = ctx.createLinearGradient(-barWidth / 2, 0, barWidth / 2, 0);
    if (healthPercent > 0.5) {
      healthGradient.addColorStop(0, '#22c55e');
      healthGradient.addColorStop(1, '#4ade80');
    } else if (healthPercent > 0.25) {
      healthGradient.addColorStop(0, '#f59e0b');
      healthGradient.addColorStop(1, '#fbbf24');
    } else {
      healthGradient.addColorStop(0, '#dc2626');
      healthGradient.addColorStop(1, '#f87171');
    }
    ctx.fillStyle = healthGradient;
    ctx.beginPath();
    ctx.roundRect(-barWidth / 2, barY, barWidth * healthPercent, barHeight, 4);
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
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-block.width / 2 + 5, -block.height / 2 + 5, block.width, block.height);
    
    // Block with gradient
    const blockGradient = ctx.createLinearGradient(-block.width / 2, -block.height / 2, block.width / 2, block.height / 2);
    blockGradient.addColorStop(0, lightenColor(props.color, 20));
    blockGradient.addColorStop(0.4, props.color);
    blockGradient.addColorStop(1, darkenColor(props.color, 25));
    ctx.fillStyle = blockGradient;
    ctx.beginPath();
    ctx.roundRect(-block.width / 2, -block.height / 2, block.width, block.height, 3);
    ctx.fill();
    
    // Texture based on block type
    if (block.type === 'wood') {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = -block.height / 2 + (block.height / 5) * i + block.height / 10;
        ctx.beginPath();
        ctx.moveTo(-block.width / 2 + 3, y);
        ctx.lineTo(block.width / 2 - 3, y);
        ctx.stroke();
      }
      // Knots
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(block.width * 0.2, block.height * 0.1, 4, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (block.type === 'stone' || block.type === 'iron') {
      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(-block.width / 2 + 2, -block.height / 2 + 2, block.width / 2 - 4, block.height / 3);
      
      if (block.type === 'iron') {
        // Metallic shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(-block.width / 2, -block.height / 2);
        ctx.lineTo(block.width / 4, -block.height / 2);
        ctx.lineTo(-block.width / 2, block.height / 4);
        ctx.closePath();
        ctx.fill();
      }
    } else if (block.type === 'glass') {
      // Glass reflection
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fillRect(-block.width / 2 + 4, -block.height / 2 + 4, block.width * 0.35, block.height * 0.35);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(block.width / 6, -block.height / 4, block.width * 0.2, block.height * 0.2);
    }
    
    // Damage cracks
    if (healthPercent < 1) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.lineWidth = 2;
      const numCracks = Math.ceil((1 - healthPercent) * 8);
      for (let i = 0; i < numCracks; i++) {
        const startX = (Math.random() - 0.5) * block.width * 0.85;
        const startY = (Math.random() - 0.5) * block.height * 0.85;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + (Math.random() - 0.5) * 25, startY + (Math.random() - 0.5) * 25);
        ctx.lineTo(startX + (Math.random() - 0.5) * 35, startY + (Math.random() - 0.5) * 35);
        ctx.stroke();
      }
    }
    
    // Border
    ctx.strokeStyle = darkenColor(props.color, 35);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-block.width / 2, -block.height / 2, block.width, block.height, 3);
    ctx.stroke();
    
    ctx.restore();
  };

  const drawEgg = (ctx: CanvasRenderingContext2D, egg: Egg) => {
    ctx.save();
    ctx.translate(egg.x, egg.y);
    ctx.rotate(Math.atan2(egg.velocityY, egg.velocityX));
    
    // Egg shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(3, 3, egg.radius * 0.75, egg.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Egg with gradient
    const eggGradient = ctx.createRadialGradient(-egg.radius * 0.35, -egg.radius * 0.35, 0, 0, 0, egg.radius * 1.2);
    eggGradient.addColorStop(0, '#fffde7');
    eggGradient.addColorStop(0.5, '#fff8e1');
    eggGradient.addColorStop(1, '#ffe082');
    ctx.fillStyle = eggGradient;
    ctx.beginPath();
    ctx.ellipse(0, 0, egg.radius * 0.75, egg.radius * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffb300';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Egg highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(-egg.radius * 0.25, -egg.radius * 0.35, egg.radius * 0.2, egg.radius * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, exp: Explosion) => {
    const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
    gradient.addColorStop(0, `rgba(255, 255, 220, ${exp.life})`);
    gradient.addColorStop(0.25, `rgba(255, 200, 50, ${exp.life * 0.9})`);
    gradient.addColorStop(0.5, `rgba(255, 120, 0, ${exp.life * 0.7})`);
    gradient.addColorStop(0.75, `rgba(255, 60, 0, ${exp.life * 0.4})`);
    gradient.addColorStop(1, 'rgba(100, 20, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Explosion rings
    ctx.strokeStyle = `rgba(255, 200, 100, ${exp.life * 0.6})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeStyle = `rgba(255, 150, 50, ${exp.life * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = 0.17;
    
    let vx = dx * power;
    let vy = dy * power;
    let x = SLINGSHOT_X;
    let y = SLINGSHOT_Y;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const groundY = canvas.height - GROUND_HEIGHT;
    
    for (let i = 0; i < 80; i += 3) {
      x += vx;
      y += vy;
      vy += GRAVITY;
      
      if (y > groundY - 10) break;
      
      const alpha = 1 - (i / 80);
      const size = 5 - (i / 25);
      
      // Glowing dots
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawUI = (ctx: CanvasRenderingContext2D, width: number) => {
    // Score background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(width - 200, 15, 185, 55, 15);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Score
    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${score}`, width - 25, 52);
    
    // Score label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('النتيجة', width - 25, 32);
    
    // Level info background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(70, 15, 180, 40, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 100, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Level name
    ctx.textAlign = 'center';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = 'white';
    ctx.fillText(level.nameAr, 160, 42);
    
    // Bird type indicator (when aiming)
    if (currentBirdRef.current && gameStatus !== 'finished') {
      const bird = currentBirdRef.current;
      const props = BIRD_PROPERTIES[bird.type];
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(70, 65, 200, 50, 12);
      ctx.fill();
      
      // Bird icon
      const iconGradient = ctx.createRadialGradient(95, 90, 0, 95, 90, 18);
      iconGradient.addColorStop(0, lightenColor(props.color, 30));
      iconGradient.addColorStop(1, props.color);
      ctx.fillStyle = iconGradient;
      ctx.beginPath();
      ctx.arc(95, 90, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = darkenColor(props.color, 30);
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Special ability text
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.font = '13px sans-serif';
      ctx.fillText(props.special, 120, 95);
    }
    
    // Remaining birds count
    const remainingBirds = birdsRef.current.length - currentBirdIndex - 1;
    if (remainingBirds > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(width - 200, 80, 100, 35, 10);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`🐦 ${remainingBirds}`, width - 150, 103);
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
    <div className="relative w-full max-w-5xl mx-auto">
      <canvas
        ref={canvasRef}
        width={950}
        height={600}
        className="w-full rounded-3xl shadow-2xl cursor-crosshair border-4 border-amber-800/60"
        style={{ 
          touchAction: 'none',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
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
      
      {/* Back button */}
      <button
        onClick={onBackToMenu}
        className="absolute top-6 left-6 bg-black/60 hover:bg-black/80 backdrop-blur-md px-6 py-3 rounded-2xl text-white font-bold transition-all flex items-center gap-2 border border-white/20 shadow-lg"
      >
        <span className="text-lg">←</span>
        <span>رجوع</span>
      </button>
      
      {/* Instructions */}
      {gameStatus === 'waiting' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-black/70 to-black/50 backdrop-blur-md px-10 py-5 rounded-2xl text-white text-center border border-white/20 shadow-xl">
          <span className="text-xl font-medium">🎯 اسحب الطائر للخلف ثم أفلت للإطلاق!</span>
        </div>
      )}
      
      {/* Special ability hint */}
      {gameStatus === 'flying' && currentBirdRef.current && !currentBirdRef.current.specialUsed && currentBirdRef.current.type !== 'red' && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 backdrop-blur-md px-8 py-4 rounded-2xl text-white font-bold animate-pulse shadow-xl border border-white/30">
          ⚡ اضغط لتفعيل القدرة الخاصة! ⚡
        </div>
      )}
      
      {/* Game Over */}
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center rounded-3xl">
          <div className="text-center text-white p-10">
            {pigsRef.current.length === 0 ? (
              <>
                <h2 className="text-6xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 animate-pulse">
                  🎉 فوز! 🎉
                </h2>
                <p className="text-4xl mb-8 font-bold">
                  النتيجة: <span className="text-amber-400">{score}</span>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-5xl font-black mb-6 text-red-400">😢 انتهت الطيور!</h2>
                <p className="text-xl mb-8 text-white/70">لا تستسلم، حاول مرة أخرى!</p>
              </>
            )}
            <button
              onClick={onBackToMenu}
              className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-12 py-5 rounded-2xl font-black text-xl hover:scale-105 transition-transform shadow-2xl border-2 border-white/20"
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
