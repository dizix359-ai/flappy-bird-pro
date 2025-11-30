import { useRef, useEffect, useCallback, useState } from 'react';
import { Bird, Pipe, GameState, GameConfig, DIFFICULTY_CONFIGS, Coin, CoinType, Enemy, Shield, COIN_VALUES } from './types';
import { useGameLoop } from './useGameLoop';

const COLORS = {
  skyTop: '#87CEEB',
  skyBottom: '#B0E0E6',
  crazySkyTop: '#1a0a2e',
  crazySkyBottom: '#16213e',
  pipeMain: '#3D8B40',
  pipeHighlight: '#4CAF50',
  pipeShadow: '#2E7D32',
  pipeBorder: '#1B5E20',
  crazyPipeMain: '#8B008B',
  crazyPipeHighlight: '#9932CC',
  crazyPipeShadow: '#4B0082',
  crazyPipeBorder: '#2E0854',
  ground: '#8B6914',
  groundTop: '#4CAF50',
  groundPattern: '#7CB342',
  crazyGround: '#2d1b4e',
  crazyGroundTop: '#6B238E',
  crazyGroundPattern: '#9932CC',
};

interface GameCanvasProps {
  width: number;
  height: number;
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  gameState: GameState;
  onStart: () => void;
  onJump?: () => void;
  onScore?: () => void;
}

export const GameCanvas = ({ width, height, onGameOver, onScoreUpdate, gameState, onStart, onJump, onScore }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scoreFlash, setScoreFlash] = useState(false);
  const configRef = useRef<GameConfig>(DIFFICULTY_CONFIGS[gameState.difficulty]);
  
  const birdRef = useRef<Bird>({
    x: width * 0.2,
    y: height / 2,
    velocity: 0,
    rotation: 0,
    width: 40,
    height: 30,
    hasShield: false,
  });
  const pipesRef = useRef<Pipe[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const shieldsRef = useRef<Shield[]>([]);
  const pipeTimerRef = useRef(0);
  const enemyTimerRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const wingAngleRef = useRef(0);
  const lastJumpTimeRef = useRef(0);
  const totalCoinsRef = useRef(0);

  const isCrazyMode = gameState.difficulty === 'crazy';

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
      hasShield: false,
    };
    pipesRef.current = [];
    coinsRef.current = [];
    enemiesRef.current = [];
    shieldsRef.current = [];
    pipeTimerRef.current = 0;
    enemyTimerRef.current = 0;
    lastJumpTimeRef.current = 0;
    totalCoinsRef.current = 0;
  }, [width, height]);

  useEffect(() => {
    if (gameState.status === 'idle') {
      resetGame();
    }
  }, [gameState.status, resetGame]);

  const jump = useCallback(() => {
    const now = performance.now();
    const config = configRef.current;
    
    if (gameState.status === 'idle') {
      onStart();
      birdRef.current.velocity = config.jumpForce;
      lastJumpTimeRef.current = now;
      wingAngleRef.current = 0;
      onJump?.();
      return;
    }
    
    if (gameState.status === 'playing') {
      if (now - lastJumpTimeRef.current < 35) return;
      birdRef.current.velocity = config.jumpForce;
      lastJumpTimeRef.current = now;
      wingAngleRef.current = 0;
      onJump?.();
    }
  }, [gameState.status, onStart, onJump]);

  const spawnPipe = useCallback(() => {
    const config = configRef.current;
    const minHeight = 70;
    const maxHeight = height - config.groundHeight - config.pipeGap - minHeight - 30;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    const isMoving = config.hasMovingPipes && Math.random() < 0.4;
    
    pipesRef.current.push({
      x: width,
      topHeight,
      bottomY: topHeight + config.pipeGap,
      width: 70,
      gap: config.pipeGap,
      passed: false,
      moving: isMoving,
      moveDirection: Math.random() > 0.5 ? 1 : -1,
      moveSpeed: 40 + Math.random() * 30,
      originalTopHeight: topHeight,
    });

    // Spawn coins in crazy mode
    if (config.hasCoins && Math.random() < (config.coinSpawnChance || 0.5)) {
      const coinY = topHeight + config.pipeGap / 2;
      const coinTypes: CoinType[] = ['silver', 'gold', 'diamond'];
      const typeRoll = Math.random();
      const coinType: CoinType = typeRoll < 0.5 ? 'silver' : typeRoll < 0.85 ? 'gold' : 'diamond';
      
      coinsRef.current.push({
        x: width + 35,
        y: coinY,
        type: coinType,
        collected: false,
        radius: coinType === 'diamond' ? 12 : coinType === 'gold' ? 10 : 8,
        rotation: 0,
      });
    }

    // Spawn shield occasionally
    if (config.shieldSpawnChance && Math.random() < config.shieldSpawnChance && !birdRef.current.hasShield) {
      const shieldY = topHeight + config.pipeGap / 2 + (Math.random() - 0.5) * 60;
      shieldsRef.current.push({
        x: width + 100,
        y: shieldY,
        radius: 15,
        collected: false,
        rotation: 0,
      });
    }
  }, [width, height]);

  const spawnEnemy = useCallback(() => {
    const config = configRef.current;
    if (!config.hasEnemies) return;

    const enemyType: 'bird' | 'missile' = Math.random() > 0.6 ? 'missile' : 'bird';
    const enemyY = 100 + Math.random() * (height - config.groundHeight - 200);

    if (enemyType === 'bird') {
      enemiesRef.current.push({
        x: width + 50,
        y: enemyY,
        type: 'bird',
        width: 35,
        height: 25,
        velocityX: -180 - Math.random() * 80,
        velocityY: (Math.random() - 0.5) * 60,
        rotation: 0,
      });
    } else {
      enemiesRef.current.push({
        x: width + 50,
        y: birdRef.current.y,
        type: 'missile',
        width: 40,
        height: 15,
        velocityX: -250,
        velocityY: 0,
        rotation: 0,
      });
    }
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

  const checkEnemyCollision = useCallback((bird: Bird): boolean => {
    const hitboxPadding = 8;
    for (const enemy of enemiesRef.current) {
      const birdLeft = bird.x - bird.width / 2 + hitboxPadding;
      const birdRight = bird.x + bird.width / 2 - hitboxPadding;
      const birdTop = bird.y - bird.height / 2 + hitboxPadding;
      const birdBottom = bird.y + bird.height / 2 - hitboxPadding;

      const enemyLeft = enemy.x - enemy.width / 2;
      const enemyRight = enemy.x + enemy.width / 2;
      const enemyTop = enemy.y - enemy.height / 2;
      const enemyBottom = enemy.y + enemy.height / 2;

      if (birdRight > enemyLeft && birdLeft < enemyRight &&
          birdBottom > enemyTop && birdTop < enemyBottom) {
        return true;
      }
    }
    return false;
  }, []);

  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.status !== 'playing') return;

    const config = configRef.current;
    const bird = birdRef.current;
    
    const dt = Math.min(deltaTime, 0.033);
    
    bird.velocity += config.gravity * dt;
    if (bird.velocity > config.maxFallSpeed) {
      bird.velocity = config.maxFallSpeed;
    }
    bird.y += bird.velocity * dt;
    
    const targetRotation = bird.velocity > 0 
      ? Math.min(bird.velocity / 8, 80)
      : Math.max(bird.velocity / 6, -30);
    bird.rotation += (targetRotation - bird.rotation) * 0.12;

    const timeSinceJump = performance.now() - lastJumpTimeRef.current;
    wingAngleRef.current += dt * (timeSinceJump < 200 ? 40 : 12);

    groundOffsetRef.current = (groundOffsetRef.current + config.pipeSpeed * dt) % 40;

    pipeTimerRef.current += dt;
    if (pipeTimerRef.current >= config.pipeSpawnInterval) {
      spawnPipe();
      pipeTimerRef.current = 0;
    }

    // Spawn enemies in crazy mode
    if (config.hasEnemies) {
      enemyTimerRef.current += dt;
      if (enemyTimerRef.current >= (config.enemySpawnInterval || 3)) {
        spawnEnemy();
        enemyTimerRef.current = 0;
      }
    }

    // Update pipes
    pipesRef.current = pipesRef.current.filter(pipe => {
      pipe.x -= config.pipeSpeed * dt;
      
      // Moving pipes logic
      if (pipe.moving && pipe.originalTopHeight !== undefined) {
        const moveAmount = (pipe.moveSpeed || 40) * dt * (pipe.moveDirection || 1);
        pipe.topHeight += moveAmount;
        pipe.bottomY = pipe.topHeight + pipe.gap;
        
        // Reverse direction at limits
        const minTop = 50;
        const maxTop = height - config.groundHeight - pipe.gap - 50;
        if (pipe.topHeight <= minTop || pipe.topHeight >= maxTop) {
          pipe.moveDirection = -(pipe.moveDirection || 1);
        }
      }
      
      if (!pipe.passed && pipe.x + pipe.width < bird.x) {
        pipe.passed = true;
        onScoreUpdate(gameState.score + 1);
        onScore?.();
        setScoreFlash(true);
        setTimeout(() => setScoreFlash(false), 100);
      }
      
      return pipe.x + pipe.width > -50;
    });

    // Update coins
    coinsRef.current = coinsRef.current.filter(coin => {
      coin.x -= config.pipeSpeed * dt;
      coin.rotation += dt * 4;
      
      // Check collection
      if (!coin.collected) {
        const dx = bird.x - coin.x;
        const dy = bird.y - coin.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < coin.radius + bird.width / 3) {
          coin.collected = true;
          const coinValue = COIN_VALUES[coin.type];
          totalCoinsRef.current += coinValue;
          onScoreUpdate(gameState.score + coinValue);
          onScore?.();
          setScoreFlash(true);
          setTimeout(() => setScoreFlash(false), 100);
        }
      }
      
      return coin.x > -50 && !coin.collected;
    });

    // Update shields
    shieldsRef.current = shieldsRef.current.filter(shield => {
      shield.x -= config.pipeSpeed * dt;
      shield.rotation += dt * 3;
      
      if (!shield.collected) {
        const dx = bird.x - shield.x;
        const dy = bird.y - shield.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < shield.radius + bird.width / 3) {
          shield.collected = true;
          bird.hasShield = true;
        }
      }
      
      return shield.x > -50 && !shield.collected;
    });

    // Update enemies
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      enemy.x += enemy.velocityX * dt;
      enemy.y += enemy.velocityY * dt;
      
      // Missiles track player slightly
      if (enemy.type === 'missile') {
        const dy = bird.y - enemy.y;
        enemy.velocityY = dy * 0.5;
        enemy.rotation = Math.atan2(enemy.velocityY, enemy.velocityX) * 180 / Math.PI;
      } else {
        enemy.y += Math.sin(performance.now() / 200 + enemy.x) * 30 * dt;
      }
      
      return enemy.x > -100;
    });

    // Check collisions
    const pipeCollision = checkCollision(bird, pipesRef.current);
    const enemyCollision = checkEnemyCollision(bird);

    if (pipeCollision || enemyCollision) {
      if (bird.hasShield) {
        bird.hasShield = false;
        // Remove the enemy that hit us
        if (enemyCollision) {
          enemiesRef.current = enemiesRef.current.filter(enemy => {
            const dx = bird.x - enemy.x;
            const dy = bird.y - enemy.y;
            return Math.sqrt(dx * dx + dy * dy) > 50;
          });
        }
      } else {
        onGameOver(gameState.score);
      }
    }
  }, [gameState.status, gameState.score, spawnPipe, spawnEnemy, checkCollision, checkEnemyCollision, onScoreUpdate, onGameOver, onScore, height]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const config = configRef.current;
    const isCrazy = gameState.difficulty === 'crazy';

    // Sky
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isCrazy) {
      skyGradient.addColorStop(0, COLORS.crazySkyTop);
      skyGradient.addColorStop(1, COLORS.crazySkyBottom);
    } else {
      skyGradient.addColorStop(0, COLORS.skyTop);
      skyGradient.addColorStop(1, COLORS.skyBottom);
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // Stars in crazy mode
    if (isCrazy) {
      const time = performance.now();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let i = 0; i < 30; i++) {
        const x = (i * 47 + time / 100) % width;
        const y = (i * 31) % (height - 100);
        const size = 1 + Math.sin(time / 500 + i) * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Clouds (dimmer in crazy mode)
    ctx.fillStyle = isCrazy ? 'rgba(100, 80, 150, 0.4)' : 'rgba(255, 255, 255, 0.7)';
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
      const pipeColors = isCrazy ? {
        shadow: COLORS.crazyPipeShadow,
        main: COLORS.crazyPipeMain,
        highlight: COLORS.crazyPipeHighlight,
        border: COLORS.crazyPipeBorder,
      } : {
        shadow: COLORS.pipeShadow,
        main: COLORS.pipeMain,
        highlight: COLORS.pipeHighlight,
        border: COLORS.pipeBorder,
      };

      const pg = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
      pg.addColorStop(0, pipeColors.shadow);
      pg.addColorStop(0.3, pipeColors.main);
      pg.addColorStop(0.6, pipeColors.highlight);
      pg.addColorStop(1, pipeColors.shadow);
      
      ctx.fillStyle = pg;
      ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 28, pipe.width + 10, 28);
      ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY - config.groundHeight);
      ctx.fillRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 28);
      
      ctx.strokeStyle = pipeColors.border;
      ctx.lineWidth = 2;
      ctx.strokeRect(pipe.x - 5, pipe.topHeight - 28, pipe.width + 10, 28);
      ctx.strokeRect(pipe.x - 5, pipe.bottomY, pipe.width + 10, 28);

      // Moving pipe indicator
      if (pipe.moving && isCrazy) {
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY - config.groundHeight);
      }
    });

    // Draw coins
    coinsRef.current.forEach(coin => {
      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.rotate(coin.rotation);
      
      const colors = {
        silver: { main: '#C0C0C0', shine: '#E8E8E8', border: '#808080' },
        gold: { main: '#FFD700', shine: '#FFED4A', border: '#B8860B' },
        diamond: { main: '#00FFFF', shine: '#FFFFFF', border: '#008B8B' },
      };
      const c = colors[coin.type];
      
      // Glow
      ctx.shadowColor = c.main;
      ctx.shadowBlur = 10;
      
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Shine
      ctx.fillStyle = c.shine;
      ctx.beginPath();
      ctx.arc(-coin.radius / 3, -coin.radius / 3, coin.radius / 3, 0, Math.PI * 2);
      ctx.fill();
      
      // Border
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
      ctx.stroke();
      
      // Diamond shape
      if (coin.type === 'diamond') {
        ctx.fillStyle = c.shine;
        ctx.beginPath();
        ctx.moveTo(0, -coin.radius + 3);
        ctx.lineTo(coin.radius - 3, 0);
        ctx.lineTo(0, coin.radius - 3);
        ctx.lineTo(-coin.radius + 3, 0);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    });

    // Draw shields
    shieldsRef.current.forEach(shield => {
      ctx.save();
      ctx.translate(shield.x, shield.y);
      ctx.rotate(shield.rotation);
      
      // Glow
      ctx.shadowColor = '#00FF00';
      ctx.shadowBlur = 15;
      
      // Shield shape
      ctx.fillStyle = 'rgba(0, 255, 100, 0.7)';
      ctx.beginPath();
      ctx.moveTo(0, -shield.radius);
      ctx.lineTo(shield.radius, -shield.radius / 2);
      ctx.lineTo(shield.radius, shield.radius / 2);
      ctx.lineTo(0, shield.radius);
      ctx.lineTo(-shield.radius, shield.radius / 2);
      ctx.lineTo(-shield.radius, -shield.radius / 2);
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#00AA00';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Inner shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(0, -2, shield.radius / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw enemies
    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      
      if (enemy.type === 'bird') {
        // Enemy bird (red/black)
        ctx.rotate((Math.sin(performance.now() / 100) * 10) * Math.PI / 180);
        
        // Body
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4A0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Wing
        ctx.fillStyle = '#660000';
        const wy = Math.sin(performance.now() / 50) * 5;
        ctx.beginPath();
        ctx.ellipse(5, wy, 10, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-enemy.width / 4, -enemy.height / 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-enemy.width / 4 - 1, -enemy.height / 6, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 2, 0);
        ctx.lineTo(-enemy.width / 2 - 12, 3);
        ctx.lineTo(-enemy.width / 2, 6);
        ctx.closePath();
        ctx.fill();
      } else {
        // Missile
        ctx.rotate(enemy.rotation * Math.PI / 180);
        
        // Body
        const missileGrad = ctx.createLinearGradient(-enemy.width / 2, 0, enemy.width / 2, 0);
        missileGrad.addColorStop(0, '#FF4444');
        missileGrad.addColorStop(0.5, '#FF0000');
        missileGrad.addColorStop(1, '#AA0000');
        ctx.fillStyle = missileGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tip
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 2, 0);
        ctx.lineTo(-enemy.width / 2 - 10, -5);
        ctx.lineTo(-enemy.width / 2 - 10, 5);
        ctx.closePath();
        ctx.fill();
        
        // Flame trail
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(enemy.width / 2, 0);
        ctx.lineTo(enemy.width / 2 + 15 + Math.random() * 5, -3);
        ctx.lineTo(enemy.width / 2 + 15 + Math.random() * 5, 3);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.moveTo(enemy.width / 2, 0);
        ctx.lineTo(enemy.width / 2 + 8, -2);
        ctx.lineTo(enemy.width / 2 + 8, 2);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    });

    // Ground
    const groundY = height - config.groundHeight;
    ctx.fillStyle = isCrazy ? COLORS.crazyGroundTop : COLORS.groundTop;
    ctx.fillRect(0, groundY, width, 18);
    ctx.fillStyle = isCrazy ? COLORS.crazyGround : COLORS.ground;
    ctx.fillRect(0, groundY + 18, width, config.groundHeight - 18);
    
    ctx.fillStyle = isCrazy ? COLORS.crazyGroundPattern : COLORS.groundPattern;
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

    // Shield aura
    if (bird.hasShield) {
      ctx.shadowColor = '#00FF00';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, bird.width / 2 + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

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
      ctx.fillStyle = isCrazy ? 'rgba(255, 0, 255, 0.2)' : 'rgba(255, 215, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
    }

    // Crazy mode HUD
    if (isCrazy && gameState.status === 'playing') {
      // Coins collected indicator
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(width - 80, 10, 70, 30);
      ctx.fillStyle = '#FFD700';
      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'right';
      ctx.fillText(`💰${totalCoinsRef.current}`, width - 15, 30);
      
      // Shield indicator
      if (bird.hasShield) {
        ctx.fillStyle = 'rgba(0, 255, 100, 0.8)';
        ctx.fillRect(width - 80, 45, 70, 20);
        ctx.fillStyle = '#000';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('🛡️ SHIELD', width - 15, 58);
      }
    }
  }, [width, height, scoreFlash, gameState.difficulty, gameState.status]);

  // Game loop
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

  // Game over
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

  // Touch and pointer events
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      jump();
    };

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      jump();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('pointerdown', handlePointerDown);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [jump]);

  return (
    <div 
      ref={containerRef}
      className="relative cursor-pointer select-none"
      style={{ 
        width, 
        height,
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block"
        style={{ width, height }}
      />
    </div>
  );
};
