import { useRef, useEffect, useCallback, useState } from 'react';
import { 
  AngryBird, Pig, Block, Egg, Explosion, BirdType, Level,
  BIRD_PROPERTIES, BLOCK_PROPERTIES
} from './types';

interface GameCanvasProps {
  level: Level;
  onLevelComplete: (score: number, starsEarned: number) => void;
  onBackToMenu: () => void;
}

const GRAVITY = 0.5;
const GROUND_HEIGHT = 60;
const SLINGSHOT_X = 120;
const SLINGSHOT_Y = 380;

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
  
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragCurrentRef = useRef({ x: SLINGSHOT_X, y: SLINGSHOT_Y });

  // Initialize level
  useEffect(() => {
    // Create birds queue
    birdsRef.current = level.birds.map((type, index) => ({
      id: `bird-${index}`,
      type,
      x: 50 + index * 40,
      y: 420,
      radius: BIRD_PROPERTIES[type].radius,
      velocityX: 0,
      velocityY: 0,
      rotation: 0,
      isFlying: false,
      hasLanded: false,
      specialUsed: false,
    }));

    // Create pigs
    pigsRef.current = level.pigs.map((pig, index) => ({
      ...pig,
      id: `pig-${index}`,
      velocityX: 0,
      velocityY: 0,
    }));

    // Create blocks
    blocksRef.current = level.blocks.map((block, index) => ({
      ...block,
      id: `block-${index}`,
      velocityX: 0,
      velocityY: 0,
    }));

    eggsRef.current = [];
    explosionsRef.current = [];
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
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameStatus !== 'waiting' && gameStatus !== 'aiming') return;
    
    const canvas = canvasRef.current;
    if (!canvas || !currentBirdRef.current) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking near the bird
    const bird = currentBirdRef.current;
    const dist = Math.sqrt((x - bird.x) ** 2 + (y - bird.y) ** 2);
    
    if (dist < 50) {
      isDraggingRef.current = true;
      dragStartRef.current = { x, y };
      dragCurrentRef.current = { x: bird.x, y: bird.y };
      setGameStatus('aiming');
    }
  }, [gameStatus]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Limit drag distance
    const dx = x - SLINGSHOT_X;
    const dy = y - SLINGSHOT_Y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 80;
    
    if (dist > maxDist) {
      dragCurrentRef.current = {
        x: SLINGSHOT_X + (dx / dist) * maxDist,
        y: SLINGSHOT_Y + (dy / dist) * maxDist,
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
    
    const power = 0.2;
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
      bird.velocityX *= 2;
      bird.velocityY *= 0.5;
      bird.specialUsed = true;
    } else if (bird.type === 'black') {
      // Explode
      createExplosion(bird.x, bird.y, 100);
      bird.specialUsed = true;
      bird.hasLanded = true;
      
      // Damage nearby objects
      [...pigsRef.current, ...blocksRef.current].forEach(obj => {
        const dist = Math.sqrt((obj.x - bird.x) ** 2 + (obj.y - bird.y) ** 2);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          obj.health -= Math.ceil(force * 3);
          obj.velocityX += ((obj.x - bird.x) / dist) * force * 15;
          obj.velocityY += ((obj.y - bird.y) / dist) * force * 15;
        }
      });
    } else if (bird.type === 'white') {
      // Drop egg
      eggsRef.current.push({
        x: bird.x,
        y: bird.y + bird.radius,
        velocityX: 0,
        velocityY: 5,
        radius: 12,
      });
      bird.velocityY = -8;
      bird.specialUsed = true;
    }
  }, [gameStatus]);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameLoop = () => {
      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      drawBackground(ctx, canvas.width, canvas.height);
      
      // Update physics
      updatePhysics(canvas.height);
      
      // Draw slingshot
      drawSlingshot(ctx);
      
      // Draw blocks
      blocksRef.current.forEach(block => drawBlock(ctx, block));
      
      // Draw pigs
      pigsRef.current.forEach(pig => drawPig(ctx, pig));
      
      // Draw eggs
      eggsRef.current.forEach(egg => drawEgg(ctx, egg));
      
      // Draw explosions
      explosionsRef.current.forEach(exp => drawExplosion(ctx, exp));
      
      // Draw current bird
      if (currentBirdRef.current) {
        drawBird(ctx, currentBirdRef.current);
        
        // Draw trajectory when aiming
        if (isDraggingRef.current) {
          drawTrajectory(ctx);
        }
      }
      
      // Draw waiting birds
      birdsRef.current.slice(currentBirdIndex + 1).forEach((bird, index) => {
        drawBird(ctx, { ...bird, x: 50 + index * 40, y: canvas.height - GROUND_HEIGHT - bird.radius });
      });
      
      // Draw UI
      drawUI(ctx, canvas.width);
      
      // Check win/lose conditions
      checkGameEnd();
      
      animationRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [currentBirdIndex, gameStatus, score, level]);

  const updatePhysics = (canvasHeight: number) => {
    const groundY = canvasHeight - GROUND_HEIGHT;
    
    // Update current bird
    if (currentBirdRef.current?.isFlying && !currentBirdRef.current.hasLanded) {
      const bird = currentBirdRef.current;
      bird.velocityY += GRAVITY;
      bird.x += bird.velocityX;
      bird.y += bird.velocityY;
      bird.rotation += bird.velocityX * 0.05;
      
      // Ground collision
      if (bird.y + bird.radius > groundY) {
        bird.y = groundY - bird.radius;
        bird.hasLanded = true;
        bird.velocityX *= 0.5;
        bird.velocityY = 0;
      }
      
      // Wall collision
      if (bird.x < bird.radius || bird.x > 900) {
        bird.hasLanded = true;
      }
      
      // Block collision
      blocksRef.current.forEach(block => {
        if (checkBirdBlockCollision(bird, block)) {
          const damage = Math.ceil(Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2) / 3);
          block.health -= damage;
          setScore(s => s + damage * 50);
          
          // Transfer momentum
          block.velocityX += bird.velocityX * 0.3;
          block.velocityY += bird.velocityY * 0.3;
          
          bird.velocityX *= -0.3;
          bird.velocityY *= -0.3;
        }
      });
      
      // Pig collision
      pigsRef.current.forEach(pig => {
        const dist = Math.sqrt((bird.x - pig.x) ** 2 + (bird.y - pig.y) ** 2);
        if (dist < bird.radius + pig.radius) {
          const damage = Math.ceil(Math.sqrt(bird.velocityX ** 2 + bird.velocityY ** 2) / 2);
          pig.health -= damage;
          setScore(s => s + damage * 100);
          
          pig.velocityX += bird.velocityX * 0.5;
          pig.velocityY += bird.velocityY * 0.5;
          
          bird.velocityX *= 0.5;
          bird.velocityY *= 0.5;
        }
      });
    }
    
    // Update blocks
    blocksRef.current = blocksRef.current.filter(block => {
      if (block.health <= 0) {
        setScore(s => s + 100);
        return false;
      }
      
      block.velocityY += GRAVITY * 0.5;
      block.x += block.velocityX;
      block.y += block.velocityY;
      block.velocityX *= 0.98;
      
      // Ground collision
      if (block.y + block.height / 2 > groundY) {
        block.y = groundY - block.height / 2;
        block.velocityY = -block.velocityY * 0.3;
        block.velocityX *= 0.8;
      }
      
      return true;
    });
    
    // Update pigs
    pigsRef.current = pigsRef.current.filter(pig => {
      if (pig.health <= 0) {
        setScore(s => s + 500);
        createExplosion(pig.x, pig.y, 40);
        return false;
      }
      
      pig.velocityY += GRAVITY * 0.5;
      pig.x += pig.velocityX;
      pig.y += pig.velocityY;
      pig.velocityX *= 0.98;
      
      // Ground collision
      if (pig.y + pig.radius > groundY) {
        pig.y = groundY - pig.radius;
        pig.velocityY = -pig.velocityY * 0.3;
        pig.velocityX *= 0.8;
      }
      
      return true;
    });
    
    // Update eggs
    eggsRef.current = eggsRef.current.filter(egg => {
      egg.velocityY += GRAVITY;
      egg.y += egg.velocityY;
      
      // Ground collision - explode
      if (egg.y + egg.radius > groundY) {
        createExplosion(egg.x, egg.y, 60);
        
        // Damage nearby
        [...pigsRef.current, ...blocksRef.current].forEach(obj => {
          const dist = Math.sqrt((obj.x - egg.x) ** 2 + (obj.y - egg.y) ** 2);
          if (dist < 80) {
            obj.health -= 2;
            obj.velocityY -= 10;
          }
        });
        
        return false;
      }
      
      return true;
    });
    
    // Update explosions
    explosionsRef.current = explosionsRef.current.filter(exp => {
      exp.radius += 5;
      exp.life -= 0.05;
      return exp.life > 0;
    });
    
    // Check if bird stopped and load next
    if (currentBirdRef.current?.hasLanded && gameStatus === 'flying') {
      const bird = currentBirdRef.current;
      if (Math.abs(bird.velocityX) < 0.5) {
        setTimeout(() => {
          loadNextBird();
        }, 500);
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
      // All pigs destroyed = win
      if (pigsRef.current.length === 0) {
        const starsEarned = score >= level.stars[2] ? 3 : score >= level.stars[1] ? 2 : score >= level.stars[0] ? 1 : 0;
        onLevelComplete(score, starsEarned);
      }
    }
  };

  // Drawing functions
  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Ground
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, height - GROUND_HEIGHT, width, GROUND_HEIGHT);
    
    // Grass
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, height - GROUND_HEIGHT, width, 15);
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    [[100, 80], [300, 50], [600, 100], [800, 60]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.arc(x + 25, y - 10, 25, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawSlingshot = (ctx: CanvasRenderingContext2D) => {
    // Back band
    if (isDraggingRef.current && currentBirdRef.current) {
      ctx.strokeStyle = '#4A3728';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X - 15, SLINGSHOT_Y - 30);
      ctx.lineTo(currentBirdRef.current.x, currentBirdRef.current.y);
      ctx.stroke();
    }
    
    // Slingshot base
    ctx.fillStyle = '#654321';
    ctx.fillRect(SLINGSHOT_X - 8, SLINGSHOT_Y - 10, 16, 80);
    
    // Slingshot fork
    ctx.fillRect(SLINGSHOT_X - 25, SLINGSHOT_Y - 50, 12, 60);
    ctx.fillRect(SLINGSHOT_X + 13, SLINGSHOT_Y - 50, 12, 60);
    
    // Front band
    if (isDraggingRef.current && currentBirdRef.current) {
      ctx.strokeStyle = '#4A3728';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(SLINGSHOT_X + 15, SLINGSHOT_Y - 30);
      ctx.lineTo(currentBirdRef.current.x, currentBirdRef.current.y);
      ctx.stroke();
    }
  };

  const drawBird = (ctx: CanvasRenderingContext2D, bird: AngryBird) => {
    const props = BIRD_PROPERTIES[bird.type];
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);
    
    // Body
    ctx.fillStyle = props.color;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Belly
    ctx.fillStyle = props.secondaryColor;
    ctx.beginPath();
    ctx.ellipse(0, bird.radius * 0.3, bird.radius * 0.6, bird.radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.ellipse(-bird.radius * 0.25, -bird.radius * 0.2, bird.radius * 0.25, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(bird.radius * 0.25, -bird.radius * 0.2, bird.radius * 0.25, bird.radius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Pupils
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-bird.radius * 0.15, -bird.radius * 0.15, bird.radius * 0.12, 0, Math.PI * 2);
    ctx.arc(bird.radius * 0.35, -bird.radius * 0.15, bird.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Angry eyebrows
    ctx.fillStyle = bird.type === 'black' ? '#666' : '#5D4037';
    ctx.save();
    ctx.translate(-bird.radius * 0.25, -bird.radius * 0.45);
    ctx.rotate(-0.3);
    ctx.fillRect(-bird.radius * 0.3, 0, bird.radius * 0.5, bird.radius * 0.12);
    ctx.restore();
    ctx.save();
    ctx.translate(bird.radius * 0.25, -bird.radius * 0.45);
    ctx.rotate(0.3);
    ctx.fillRect(-bird.radius * 0.2, 0, bird.radius * 0.5, bird.radius * 0.12);
    ctx.restore();
    
    // Beak
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(bird.radius * 0.5, 0);
    ctx.lineTo(bird.radius * 0.9, bird.radius * 0.15);
    ctx.lineTo(bird.radius * 0.5, bird.radius * 0.3);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  };

  const drawPig = (ctx: CanvasRenderingContext2D, pig: Pig) => {
    ctx.save();
    ctx.translate(pig.x, pig.y);
    
    // Body
    ctx.fillStyle = pig.isIron ? '#607D8B' : '#8BC34A';
    ctx.beginPath();
    ctx.arc(0, 0, pig.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Iron armor effect
    if (pig.isIron) {
      ctx.strokeStyle = '#455A64';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Rivets
      ctx.fillStyle = '#37474F';
      [[-pig.radius * 0.5, -pig.radius * 0.5], [pig.radius * 0.5, -pig.radius * 0.5], 
       [-pig.radius * 0.5, pig.radius * 0.5], [pig.radius * 0.5, pig.radius * 0.5]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Snout
    ctx.fillStyle = pig.isIron ? '#78909C' : '#689F38';
    ctx.beginPath();
    ctx.ellipse(0, pig.radius * 0.2, pig.radius * 0.5, pig.radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Nostrils
    ctx.fillStyle = '#33691E';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.15, pig.radius * 0.2, 4, 0, Math.PI * 2);
    ctx.arc(pig.radius * 0.15, pig.radius * 0.2, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.3, -pig.radius * 0.2, pig.radius * 0.25, 0, Math.PI * 2);
    ctx.arc(pig.radius * 0.3, -pig.radius * 0.2, pig.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(-pig.radius * 0.25, -pig.radius * 0.15, pig.radius * 0.12, 0, Math.PI * 2);
    ctx.arc(pig.radius * 0.35, -pig.radius * 0.15, pig.radius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    const healthPercent = pig.health / pig.maxHealth;
    ctx.fillStyle = '#333';
    ctx.fillRect(-pig.radius, -pig.radius - 15, pig.radius * 2, 8);
    ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
    ctx.fillRect(-pig.radius, -pig.radius - 15, pig.radius * 2 * healthPercent, 8);
    
    ctx.restore();
  };

  const drawBlock = (ctx: CanvasRenderingContext2D, block: Block) => {
    const props = BLOCK_PROPERTIES[block.type];
    const healthPercent = block.health / block.maxHealth;
    
    ctx.save();
    ctx.translate(block.x, block.y);
    ctx.rotate(block.rotation);
    
    // Block
    ctx.fillStyle = props.color;
    ctx.fillRect(-block.width / 2, -block.height / 2, block.width, block.height);
    
    // Damage cracks
    if (healthPercent < 1) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      const numCracks = Math.ceil((1 - healthPercent) * 5);
      for (let i = 0; i < numCracks; i++) {
        ctx.beginPath();
        ctx.moveTo((Math.random() - 0.5) * block.width, (Math.random() - 0.5) * block.height);
        ctx.lineTo((Math.random() - 0.5) * block.width, (Math.random() - 0.5) * block.height);
        ctx.stroke();
      }
    }
    
    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-block.width / 2, -block.height / 2, block.width, block.height);
    
    ctx.restore();
  };

  const drawEgg = (ctx: CanvasRenderingContext2D, egg: Egg) => {
    ctx.fillStyle = '#FFF8E1';
    ctx.beginPath();
    ctx.ellipse(egg.x, egg.y, egg.radius * 0.8, egg.radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFE082';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawExplosion = (ctx: CanvasRenderingContext2D, exp: Explosion) => {
    const gradient = ctx.createRadialGradient(exp.x, exp.y, 0, exp.x, exp.y, exp.radius);
    gradient.addColorStop(0, `rgba(255, 200, 50, ${exp.life})`);
    gradient.addColorStop(0.5, `rgba(255, 100, 0, ${exp.life * 0.7})`);
    gradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawTrajectory = (ctx: CanvasRenderingContext2D) => {
    if (!currentBirdRef.current) return;
    
    const dx = SLINGSHOT_X - dragCurrentRef.current.x;
    const dy = SLINGSHOT_Y - dragCurrentRef.current.y;
    const power = 0.2;
    
    let vx = dx * power;
    let vy = dy * power;
    let x = SLINGSHOT_X;
    let y = SLINGSHOT_Y;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 50; i += 3) {
      x += vx;
      y += vy;
      vy += GRAVITY;
      
      if (y > 440) break;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawUI = (ctx: CanvasRenderingContext2D, width: number) => {
    // Score
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, width - 20, 40);
    
    // Level name
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px "Press Start 2P", monospace';
    ctx.fillText(level.nameAr, 20, 40);
    
    // Birds remaining
    const remaining = birdsRef.current.length - currentBirdIndex - 1;
    ctx.fillText(`🐦 x${remaining}`, 20, 70);
    
    // Pigs remaining
    ctx.fillText(`🐷 x${pigsRef.current.length}`, 20, 100);
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={900}
        height={500}
        className="rounded-lg shadow-2xl cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
      
      {/* Back button */}
      <button
        onClick={onBackToMenu}
        className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full text-white font-bold transition-all"
      >
        ← رجوع
      </button>
      
      {/* Instructions */}
      {gameStatus === 'waiting' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full text-white text-center">
          اسحب الطائر للخلف ثم أفلت للإطلاق!
        </div>
      )}
      
      {/* Game Over */}
      {gameStatus === 'finished' && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
          <div className="text-center text-white">
            {pigsRef.current.length === 0 ? (
              <>
                <h2 className="text-4xl font-bold mb-4 text-yellow-400">🎉 فوز! 🎉</h2>
                <p className="text-2xl mb-4">النتيجة: {score}</p>
              </>
            ) : (
              <>
                <h2 className="text-4xl font-bold mb-4 text-red-400">انتهت الطيور!</h2>
                <p className="text-xl mb-4">حاول مرة أخرى</p>
              </>
            )}
            <button
              onClick={onBackToMenu}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 px-8 py-3 rounded-full font-bold text-lg hover:scale-105 transition-transform"
            >
              العودة للقائمة
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
