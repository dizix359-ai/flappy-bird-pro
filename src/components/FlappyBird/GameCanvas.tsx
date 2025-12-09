import { useRef, useEffect, useCallback, useState } from 'react';
import { Bird, Pipe, GameState, GameConfig, DIFFICULTY_CONFIGS, Coin, CoinType, Enemy, Shield, Weapon, Bullet, Bomb, Particle, Lightning, COIN_VALUES, BulletType } from './types';
import { SHOP_BIRDS, SHOP_WEAPONS } from './shopTypes';
import { useGameLoop } from './useGameLoop';

const COLORS = {
  skyTop: '#87CEEB',
  skyBottom: '#B0E0E6',
  crazySkyTop: '#0a0015',
  crazySkyBottom: '#1a0a30',
  pipeMain: '#3D8B40',
  pipeHighlight: '#4CAF50',
  pipeShadow: '#2E7D32',
  pipeBorder: '#1B5E20',
  crazyPipeMain: '#6B0F9C',
  crazyPipeHighlight: '#9C27B0',
  crazyPipeShadow: '#38006b',
  crazyPipeBorder: '#1a0033',
  ground: '#8B6914',
  groundTop: '#4CAF50',
  groundPattern: '#7CB342',
  crazyGround: '#1a0033',
  crazyGroundTop: '#4A148C',
  crazyGroundPattern: '#7B1FA2',
};

interface GameCanvasProps {
  width: number;
  height: number;
  onGameOver: (score: number, coinsCollected?: number, killsCount?: number) => void;
  onScoreUpdate: (score: number) => void;
  gameState: GameState;
  onStart: () => void;
  onJump?: () => void;
  onScore?: () => void;
  onWeaponUpgrade?: (level: number) => void;
  onShieldUpgrade?: () => void;
  selectedBird?: string;
  selectedWeapon?: string;
}

export const GameCanvas = ({ width, height, onGameOver, onScoreUpdate, gameState, onStart, onJump, onScore, onWeaponUpgrade, onShieldUpgrade, selectedBird = 'classic', selectedWeapon = 'basic' }: GameCanvasProps) => {
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
    shieldLevel: 1,
    shieldHits: 1,
    hasWeapon: false,
    weaponAmmo: 0,
    weaponLevel: 1,
  });
  const pipesRef = useRef<Pipe[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const shieldsRef = useRef<Shield[]>([]);
  const weaponsRef = useRef<Weapon[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const bombsRef = useRef<Bomb[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const lightningsRef = useRef<Lightning[]>([]);
  const pipeTimerRef = useRef(0);
  const enemyTimerRef = useRef(0);
  const advancedEnemyTimerRef = useRef(0);
  const weaponTimerRef = useRef(0);
  const lightningTimerRef = useRef(0);
  const groundOffsetRef = useRef(0);
  const wingAngleRef = useRef(0);
  const lastJumpTimeRef = useRef(0);
  const totalCoinsRef = useRef(0);
  const totalKillsRef = useRef(0);
  const starsRef = useRef<{ x: number; y: number; size: number; twinkle: number }[]>([]);
  const mountainsRef = useRef<{ x: number; height: number; color: string }[]>([]);
  const meteorsRef = useRef<{ x: number; y: number; speed: number; angle: number; length: number; life: number }[]>([]);
  const bgBirdsRef = useRef<{ x: number; y: number; speed: number; wingPhase: number }[]>([]);
  const planetsRef = useRef<{ x: number; y: number; radius: number; color: string; ringColor?: string }[]>([]);

  const isCrazyMode = gameState.difficulty === 'crazy';
  const hasExtendedFeatures = gameState.difficulty !== 'easy' || configRef.current.hasEnemies;

  // Initialize environment elements
  useEffect(() => {
    // Stars
    starsRef.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height - 150),
      size: 0.5 + Math.random() * 2,
      twinkle: Math.random() * Math.PI * 2,
    }));
    
    // Mountains/Buildings for parallax
    mountainsRef.current = [
      // Far layer (slowest)
      { x: 0, height: height * 0.35, color: 'rgba(20, 10, 40, 0.8)' },
      { x: width * 0.3, height: height * 0.3, color: 'rgba(25, 12, 45, 0.8)' },
      { x: width * 0.6, height: height * 0.38, color: 'rgba(20, 10, 40, 0.8)' },
      { x: width * 0.9, height: height * 0.32, color: 'rgba(25, 12, 45, 0.8)' },
      // Near layer (faster)
      { x: width * 0.15, height: height * 0.25, color: 'rgba(40, 20, 60, 0.9)' },
      { x: width * 0.5, height: height * 0.22, color: 'rgba(45, 22, 65, 0.9)' },
      { x: width * 0.8, height: height * 0.28, color: 'rgba(40, 20, 60, 0.9)' },
    ];
    
    // Background birds
    bgBirdsRef.current = Array.from({ length: 4 }, () => ({
      x: Math.random() * width,
      y: 50 + Math.random() * 150,
      speed: 20 + Math.random() * 30,
      wingPhase: Math.random() * Math.PI * 2,
    }));
    
    // Planets
    planetsRef.current = [
      { x: width * 0.85, y: height * 0.12, radius: 30, color: '#4a2c7a', ringColor: 'rgba(200, 150, 255, 0.3)' },
      { x: width * 0.2, y: height * 0.08, radius: 15, color: '#3d5a80' },
    ];
  }, [width, height]);

  useEffect(() => {
    configRef.current = DIFFICULTY_CONFIGS[gameState.difficulty];
  }, [gameState.difficulty]);

  const createParticles = useCallback((x: number, y: number, count: number, color: string, type: 'spark' | 'explosion' | 'coin' | 'star') => {
    // Limit total particles for performance
    if (particlesRef.current.length > 150) return;
    
    // Reduce particle count for better performance
    const actualCount = Math.min(count, Math.ceil(count * 0.6));
    
    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.PI * 2 * i) / actualCount + Math.random() * 0.5;
      const speed = 50 + Math.random() * 150;
      particlesRef.current.push({
        x,
        y,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8,
        color,
        size: type === 'explosion' ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
        type,
      });
    }
  }, []);

  const createLightning = useCallback(() => {
    const startX = Math.random() * width;
    const startY = 0;
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let currentX = startX;
    let currentY = startY;
    
    while (currentY < height * 0.6) {
      currentX += (Math.random() - 0.5) * 60;
      currentY += 20 + Math.random() * 30;
      points.push({ x: currentX, y: currentY });
    }
    
    lightningsRef.current.push({
      startX,
      startY,
      points,
      life: 0.15,
      maxLife: 0.15,
    });
  }, [width, height]);

  const resetGame = useCallback(() => {
    birdRef.current = {
      x: width * 0.2,
      y: height / 2,
      velocity: 0,
      rotation: 0,
      width: 40,
      height: 30,
      hasShield: false,
      hasWeapon: false,
      weaponAmmo: 0,
    };
    pipesRef.current = [];
    coinsRef.current = [];
    enemiesRef.current = [];
    shieldsRef.current = [];
    weaponsRef.current = [];
    bulletsRef.current = [];
    bombsRef.current = [];
    particlesRef.current = [];
    lightningsRef.current = [];
    pipeTimerRef.current = 0;
    enemyTimerRef.current = 0;
    advancedEnemyTimerRef.current = 0;
    weaponTimerRef.current = 0;
    lightningTimerRef.current = 0;
    lastJumpTimeRef.current = 0;
    totalCoinsRef.current = 0;
    totalKillsRef.current = 0;
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

    // Spawn weapon occasionally
    if (config.weaponSpawnChance && Math.random() < config.weaponSpawnChance && !birdRef.current.hasWeapon) {
      const weaponY = topHeight + config.pipeGap / 2 + (Math.random() - 0.5) * 40;
      weaponsRef.current.push({
        x: width + 150,
        y: weaponY,
        radius: 14,
        collected: false,
        rotation: 0,
        ammo: 10 + Math.floor(Math.random() * 10),
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
        health: 1,
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
        health: 1,
      });
    }
  }, [width, height]);

  const spawnAdvancedEnemy = useCallback(() => {
    const config = configRef.current;
    if (!config.hasEnemies) return;

    // Only spawn hunters in easy/hard mode, hunters + planes in crazy
    const isCrazy = gameState.difficulty === 'crazy';
    const enemyType: 'hunter' | 'plane' = isCrazy && Math.random() > 0.5 ? 'plane' : 'hunter';
    const enemyY = 80 + Math.random() * (height - config.groundHeight - 200);
    
    const speedMultiplier = config.hunterSpeedMultiplier || 1.0;
    const shotInterval = config.hunterShotInterval || 1200;

    if (enemyType === 'hunter') {
      enemiesRef.current.push({
        x: width + 60,
        y: enemyY,
        type: 'hunter',
        width: 50,
        height: 45,
        velocityX: (-80 - Math.random() * 40) * speedMultiplier,
        velocityY: 0,
        rotation: 0,
        health: isCrazy ? 3 : 2, // Less health in easy/hard
        lastShot: 0,
        shotInterval: shotInterval + Math.random() * 800,
      });
    } else {
      enemiesRef.current.push({
        x: width + 60,
        y: 60 + Math.random() * 80,
        type: 'plane',
        width: 60,
        height: 30,
        velocityX: -120 - Math.random() * 60,
        velocityY: 0,
        rotation: 0,
        health: 2,
        lastShot: 0,
        shotInterval: 1500 + Math.random() * 1000,
      });
    }
  }, [width, height, gameState.difficulty]);

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

  const checkBulletCollision = useCallback((bird: Bird): boolean => {
    for (const bullet of bulletsRef.current) {
      if (bullet.fromPlayer) continue;
      const dx = bird.x - bullet.x;
      const dy = bird.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bullet.radius + bird.width / 3) {
        return true;
      }
    }
    return false;
  }, []);

  const checkBombCollision = useCallback((bird: Bird): boolean => {
    for (const bomb of bombsRef.current) {
      const dx = bird.x - bomb.x;
      const dy = bird.y - bomb.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bomb.radius + bird.width / 3) {
        return true;
      }
    }
    return false;
  }, []);

  const updateGame = useCallback((deltaTime: number) => {
    if (gameState.status !== 'playing') return;

    const config = configRef.current;
    const bird = birdRef.current;
    const currentScore = gameState.score;
    const isCrazy = gameState.difficulty === 'crazy';
    
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

      // Spawn advanced enemies after score threshold
      if (currentScore >= (config.advancedEnemiesScore || 20)) {
        advancedEnemyTimerRef.current += dt;
        const advancedInterval = Math.max(2, 4 - (currentScore - 20) * 0.05);
        if (advancedEnemyTimerRef.current >= advancedInterval) {
          spawnAdvancedEnemy();
          advancedEnemyTimerRef.current = 0;
        }
      }
    }

    // Lightning in crazy mode (less frequent for performance)
    if (isCrazy) {
      lightningTimerRef.current += dt;
      if (lightningTimerRef.current >= 5 + Math.random() * 7) {
        createLightning();
        lightningTimerRef.current = 0;
      }
    }

    // Auto-fire weapon
    if (bird.hasWeapon && bird.weaponAmmo && bird.weaponAmmo > 0) {
      weaponTimerRef.current += dt;
      const fireRate = bird.weaponLevel === 3 ? 0.2 : bird.weaponLevel === 2 ? 0.25 : 0.3;
      if (weaponTimerRef.current >= fireRate) {
        const bulletType: BulletType = bird.weaponLevel === 3 ? 'fire' : bird.weaponLevel === 2 ? 'lightning' : 'normal';
        const bulletSpeed = bird.weaponLevel === 3 ? 500 : bird.weaponLevel === 2 ? 450 : 400;
        const bulletSize = bird.weaponLevel === 3 ? 7 : bird.weaponLevel === 2 ? 6 : 5;
        
        bulletsRef.current.push({
          x: bird.x + bird.width / 2,
          y: bird.y,
          velocityX: bulletSpeed,
          velocityY: 0,
          fromPlayer: true,
          radius: bulletSize,
          type: bulletType,
        });
        bird.weaponAmmo--;
        if (bird.weaponAmmo <= 0) {
          bird.hasWeapon = false;
        }
        weaponTimerRef.current = 0;
        
        // Different particle colors for different weapon levels
        // Reduced particle effects for muzzle flash
        const particleColor = bulletType === 'fire' ? '#FF4500' : bulletType === 'lightning' ? '#00FFFF' : '#FFFF00';
        createParticles(bird.x + bird.width / 2, bird.y, bulletType === 'fire' ? 3 : 2, particleColor, 'spark');
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
          
          // Coin particle effect (reduced)
          const colors = { silver: '#E0E0E0', gold: '#FFD700', diamond: '#00FFFF' };
          createParticles(coin.x, coin.y, 8, colors[coin.type], 'coin');
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
          
          // Shield upgrade system
          if (bird.hasShield && bird.shieldLevel === 1) {
            // Upgrade to enhanced shield
            bird.shieldLevel = 2;
            bird.shieldHits = 3;
            createParticles(shield.x, shield.y, 15, '#00FFFF', 'star');
            onShieldUpgrade?.();
          } else {
            // First shield pickup
            bird.hasShield = true;
            bird.shieldLevel = 1;
            bird.shieldHits = 1;
            createParticles(shield.x, shield.y, 10, '#00FF00', 'spark');
          }
        }
      }
      
      return shield.x > -50 && !shield.collected;
    });

    // Update weapons
    weaponsRef.current = weaponsRef.current.filter(weapon => {
      weapon.x -= config.pipeSpeed * dt;
      weapon.rotation += dt * 2;
      
      if (!weapon.collected) {
        const dx = bird.x - weapon.x;
        const dy = bird.y - weapon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < weapon.radius + bird.width / 3) {
          weapon.collected = true;
          
          // Weapon upgrade system
          if (bird.hasWeapon) {
            // Upgrade weapon level
            const newLevel = Math.min((bird.weaponLevel || 1) + 1, 3) as 1 | 2 | 3;
            bird.weaponLevel = newLevel;
            bird.weaponAmmo = (bird.weaponAmmo || 0) + weapon.ammo;
            
            const upgradeColor = bird.weaponLevel === 3 ? '#FF4500' : bird.weaponLevel === 2 ? '#00FFFF' : '#FF6600';
            createParticles(weapon.x, weapon.y, 12, upgradeColor, bird.weaponLevel === 3 ? 'explosion' : 'spark');
            
            if (newLevel >= 2) {
              onWeaponUpgrade?.(newLevel);
            }
          } else {
            // First weapon pickup
            bird.hasWeapon = true;
            bird.weaponAmmo = weapon.ammo;
            bird.weaponLevel = 1;
            createParticles(weapon.x, weapon.y, 10, '#FF6600', 'spark');
          }
        }
      }
      
      return weapon.x > -50 && !weapon.collected;
    });

    // Update enemies and their shooting
    const now = performance.now();
    enemiesRef.current = enemiesRef.current.filter(enemy => {
      enemy.x += enemy.velocityX * dt;
      enemy.y += enemy.velocityY * dt;
      
      // Missiles track player with proper speed
      if (enemy.type === 'missile') {
        const dx = bird.x - enemy.x;
        const dy = bird.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const trackingSpeed = 280; // Total tracking speed
        
        if (distance > 0) {
          enemy.velocityX = (dx / distance) * trackingSpeed * -0.3 - 250; // Maintain forward movement
          enemy.velocityY = (dy / distance) * trackingSpeed * 0.8; // Strong vertical tracking
        }
        enemy.rotation = Math.atan2(enemy.velocityY, enemy.velocityX) * 180 / Math.PI;
      } else if (enemy.type === 'bird') {
        enemy.y += Math.sin(performance.now() / 200 + enemy.x) * 30 * dt;
      } else if (enemy.type === 'hunter') {
        // Hunter hovers and shoots
        enemy.y += Math.sin(now / 500 + enemy.x * 0.01) * 20 * dt;
        
        if (enemy.lastShot === undefined) enemy.lastShot = now;
        if (now - enemy.lastShot > (enemy.shotInterval || 1500)) {
          // Shoot bullet at player
          const angle = Math.atan2(bird.y - enemy.y, bird.x - enemy.x);
          bulletsRef.current.push({
            x: enemy.x - enemy.width / 2,
            y: enemy.y,
            velocityX: Math.cos(angle) * 300,
            velocityY: Math.sin(angle) * 300,
            fromPlayer: false,
            radius: 6,
          });
          enemy.lastShot = now;
          // Reduced particles for enemy shooting
          createParticles(enemy.x - enemy.width / 2, enemy.y, 3, '#FF4444', 'spark');
        }
      } else if (enemy.type === 'plane') {
        // Plane drops bombs
        if (enemy.lastShot === undefined) enemy.lastShot = now;
        if (now - enemy.lastShot > (enemy.shotInterval || 2000)) {
          bombsRef.current.push({
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            velocityX: enemy.velocityX * 0.3,
            velocityY: 100,
            radius: 10,
          });
          enemy.lastShot = now;
        }
      }
      
      return enemy.x > -100 && (enemy.health === undefined ? true : enemy.health > 0);
    });

    // Update bullets
    bulletsRef.current = bulletsRef.current.filter(bullet => {
      bullet.x += bullet.velocityX * dt;
      bullet.y += bullet.velocityY * dt;
      
      // Check if player bullet hits enemy
      if (bullet.fromPlayer) {
        for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
          const enemy = enemiesRef.current[i];
          const dx = enemy.x - bullet.x;
          const dy = enemy.y - bullet.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < bullet.radius + Math.max(enemy.width, enemy.height) / 2) {
            const bulletType = bullet.type || 'normal';
            // Lightning and fire bullets instant kill, normal does 1 damage
            const damageMultiplier = bulletType === 'fire' ? 999 : bulletType === 'lightning' ? 999 : 1;
            
            enemy.health = (enemy.health || 1) - damageMultiplier;
            
            // Enhanced explosion effects based on bullet type
            if ((enemy.health || 0) <= 0) {
              if (bulletType === 'lightning') {
                // Electric death explosion
                createParticles(enemy.x, enemy.y, 20, '#00FFFF', 'explosion');
                createParticles(enemy.x, enemy.y, 10, '#FFFFFF', 'star');
                createParticles(enemy.x, enemy.y, 8, '#0080FF', 'spark');
              } else if (bulletType === 'fire') {
                // Fiery death explosion
                createParticles(enemy.x, enemy.y, 25, '#FF4500', 'explosion');
                createParticles(enemy.x, enemy.y, 15, '#FFFF00', 'spark');
                createParticles(enemy.x, enemy.y, 10, '#FF0000', 'explosion');
              } else {
                createParticles(enemy.x, enemy.y, 15, enemy.type === 'hunter' ? '#FF0000' : '#FF6600', 'explosion');
              }
              totalKillsRef.current++;
              onScoreUpdate(gameState.score + 2);
              enemiesRef.current.splice(i, 1);
            } else {
              const explosionColor = bulletType === 'fire' ? '#FF4500' : bulletType === 'lightning' ? '#00FFFF' : '#FF0000';
              createParticles(bullet.x, bullet.y, 8, explosionColor, 'explosion');
            }
            
            return false;
          }
        }
      } else {
        // Enemy bullets - check collision with bird shield
        if (bird.hasShield && bird.shieldLevel === 2 && bird.shieldHits && bird.shieldHits > 0) {
          const dx = bullet.x - bird.x;
          const dy = bullet.y - bird.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < bullet.radius + bird.width / 2 + 10) {
            // Enhanced shield absorbs bullet
            bird.shieldHits--;
            if (bird.shieldHits <= 0) {
              bird.hasShield = false;
              bird.shieldLevel = 1;
            }
            createParticles(bullet.x, bullet.y, 8, '#00FFFF', 'star');
            return false; // Remove bullet
          }
        }
      }
      
      return bullet.x > -20 && bullet.x < width + 20 && bullet.y > -20 && bullet.y < height + 20;
    });

    // Update bombs
    bombsRef.current = bombsRef.current.filter(bomb => {
      bomb.x += bomb.velocityX * dt;
      bomb.y += bomb.velocityY * dt;
      bomb.velocityY += 200 * dt; // Gravity
      
      return bomb.y < height - config.groundHeight;
    });

    // Update particles
    particlesRef.current = particlesRef.current.filter(particle => {
      particle.x += particle.velocityX * dt;
      particle.y += particle.velocityY * dt;
      particle.velocityY += 100 * dt;
      particle.life -= dt;
      return particle.life > 0;
    });

    // Update lightning
    lightningsRef.current = lightningsRef.current.filter(lightning => {
      lightning.life -= dt;
      return lightning.life > 0;
    });

    // Check collisions
    const pipeCollision = checkCollision(bird, pipesRef.current);
    const enemyCollision = checkEnemyCollision(bird);
    const bulletCollision = checkBulletCollision(bird);
    const bombCollision = checkBombCollision(bird);

    if (pipeCollision || enemyCollision || bulletCollision || bombCollision) {
      if (bird.hasShield) {
        // Shield protects
        if (bird.shieldLevel === 2 && bird.shieldHits && bird.shieldHits > 0) {
          // Enhanced shield absorbs hit
          bird.shieldHits--;
          if (bird.shieldHits <= 0) {
            bird.hasShield = false;
            bird.shieldLevel = 1;
          }
          createParticles(bird.x, bird.y, 12, '#00FFFF', 'star');
        } else {
          // Normal shield - one hit protection
          bird.hasShield = false;
          bird.shieldLevel = 1;
          createParticles(bird.x, bird.y, 12, '#00FF00', 'explosion');
        }
        
        // Remove the enemy that hit us
        if (enemyCollision) {
          enemiesRef.current = enemiesRef.current.filter(enemy => {
            const dx = bird.x - enemy.x;
            const dy = bird.y - enemy.y;
            return Math.sqrt(dx * dx + dy * dy) > 50;
          });
        }
        // Remove bullets that hit us
        if (bulletCollision) {
          bulletsRef.current = bulletsRef.current.filter(bullet => {
            if (bullet.fromPlayer) return true;
            const dx = bird.x - bullet.x;
            const dy = bird.y - bullet.y;
            return Math.sqrt(dx * dx + dy * dy) > 30;
          });
        }
        // Remove bombs that hit us
        if (bombCollision) {
          bombsRef.current = bombsRef.current.filter(bomb => {
            const dx = bird.x - bomb.x;
            const dy = bird.y - bomb.y;
            return Math.sqrt(dx * dx + dy * dy) > 40;
          });
        }
      } else {
        createParticles(bird.x, bird.y, 20, '#FFD700', 'explosion');
        onGameOver(gameState.score, totalCoinsRef.current, totalKillsRef.current);
      }
    }
  }, [gameState.status, gameState.score, gameState.difficulty, spawnPipe, spawnEnemy, spawnAdvancedEnemy, checkCollision, checkEnemyCollision, checkBulletCollision, checkBombCollision, onScoreUpdate, onGameOver, onScore, height, width, createParticles, createLightning]);

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const config = configRef.current;
    const isCrazy = gameState.difficulty === 'crazy';
    const currentScore = gameState.score;
    const time = performance.now();

    // Sky with dynamic gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isCrazy) {
      // Dynamic sky color shift
      const skyShift = Math.sin(time / 10000) * 0.1;
      skyGradient.addColorStop(0, COLORS.crazySkyTop);
      skyGradient.addColorStop(0.4 + skyShift, COLORS.crazySkyBottom);
      skyGradient.addColorStop(1, '#2d1b4e');
    } else {
      skyGradient.addColorStop(0, COLORS.skyTop);
      skyGradient.addColorStop(1, COLORS.skyBottom);
    }
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);

    // === CRAZY MODE ENHANCED ENVIRONMENT ===
    if (isCrazy) {
      // Distant planets
      planetsRef.current.forEach(planet => {
        // Planet body
        const planetGrad = ctx.createRadialGradient(
          planet.x - planet.radius * 0.3, planet.y - planet.radius * 0.3, 0,
          planet.x, planet.y, planet.radius
        );
        planetGrad.addColorStop(0, planet.color);
        planetGrad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
        ctx.fillStyle = planetGrad;
        ctx.beginPath();
        ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Ring (if present)
        if (planet.ringColor) {
          ctx.strokeStyle = planet.ringColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(planet.x, planet.y, planet.radius * 1.8, planet.radius * 0.4, 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Glowing moon
      const moonX = width * 0.15;
      const moonY = height * 0.18;
      const moonRadius = 40;
      const moonPulse = Math.sin(time / 2000) * 0.15 + 0.85;
      
      // Moon glow
      const moonGlow = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 2.5);
      moonGlow.addColorStop(0, `rgba(200, 200, 255, ${0.3 * moonPulse})`);
      moonGlow.addColorStop(0.5, `rgba(150, 150, 220, ${0.1 * moonPulse})`);
      moonGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = moonGlow;
      ctx.fillRect(moonX - moonRadius * 3, moonY - moonRadius * 3, moonRadius * 6, moonRadius * 6);
      
      // Moon body
      const moonBodyGrad = ctx.createRadialGradient(
        moonX - moonRadius * 0.3, moonY - moonRadius * 0.3, 0,
        moonX, moonY, moonRadius
      );
      moonBodyGrad.addColorStop(0, '#E8E8F0');
      moonBodyGrad.addColorStop(0.7, '#B8B8D0');
      moonBodyGrad.addColorStop(1, '#888898');
      ctx.fillStyle = moonBodyGrad;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Moon craters
      ctx.fillStyle = 'rgba(100, 100, 120, 0.3)';
      ctx.beginPath();
      ctx.arc(moonX - 10, moonY - 5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + 12, moonY + 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX - 5, moonY + 12, 4, 0, Math.PI * 2);
      ctx.fill();

      // Stars with twinkling
      starsRef.current.forEach(star => {
        const twinkle = Math.sin(time / 300 + star.twinkle) * 0.5 + 0.5;
        const starSize = star.size * (0.6 + twinkle * 0.4);
        
        // Some stars have color variation
        const colorVariation = Math.sin(star.twinkle) > 0 ? 
          `rgba(200, 220, 255, ${0.4 + twinkle * 0.6})` : 
          `rgba(255, 240, 200, ${0.4 + twinkle * 0.6})`;
        
        ctx.fillStyle = colorVariation;
        ctx.beginPath();
        ctx.arc(star.x, star.y, starSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Nebula effects (multiple smaller ones)
      const nebulaGradient = ctx.createRadialGradient(width * 0.75, height * 0.25, 0, width * 0.75, height * 0.25, 180);
      nebulaGradient.addColorStop(0, 'rgba(138, 43, 226, 0.12)');
      nebulaGradient.addColorStop(0.6, 'rgba(75, 0, 130, 0.06)');
      nebulaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(0, 0, width, height);
      
      const nebula2 = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.3, height * 0.4, 150);
      nebula2.addColorStop(0, 'rgba(0, 100, 150, 0.1)');
      nebula2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = nebula2;
      ctx.fillRect(0, 0, width, height);

      // Parallax mountains/buildings (far layer)
      const parallaxOffset1 = (time / 80) % (width * 1.5);
      ctx.fillStyle = 'rgba(15, 8, 30, 0.9)';
      for (let i = 0; i < 4; i++) {
        const mx = (i * width / 3 - parallaxOffset1 + width * 2) % (width * 1.5) - width * 0.25;
        const mh = height * (0.28 + Math.sin(i * 1.5) * 0.08);
        
        // Mountain shape
        ctx.beginPath();
        ctx.moveTo(mx - 80, height - 80);
        ctx.lineTo(mx, height - 80 - mh);
        ctx.lineTo(mx + 80, height - 80);
        ctx.closePath();
        ctx.fill();
      }
      
      // Parallax mountains (near layer - faster)
      const parallaxOffset2 = (time / 50) % (width * 1.5);
      ctx.fillStyle = 'rgba(30, 15, 50, 0.95)';
      for (let i = 0; i < 5; i++) {
        const mx = (i * width / 4 - parallaxOffset2 + width * 2) % (width * 1.5) - width * 0.25;
        const mh = height * (0.18 + Math.sin(i * 2) * 0.06);
        
        ctx.beginPath();
        ctx.moveTo(mx - 60, height - 80);
        ctx.lineTo(mx - 30, height - 80 - mh * 0.7);
        ctx.lineTo(mx, height - 80 - mh);
        ctx.lineTo(mx + 30, height - 80 - mh * 0.6);
        ctx.lineTo(mx + 60, height - 80);
        ctx.closePath();
        ctx.fill();
      }

      // Background birds
      bgBirdsRef.current.forEach((bgBird, i) => {
        const bx = (bgBird.x + time / 1000 * bgBird.speed) % (width + 100) - 50;
        const by = bgBird.y + Math.sin(time / 500 + bgBird.wingPhase) * 5;
        const wingY = Math.sin(time / 100 + bgBird.wingPhase) * 4;
        
        ctx.fillStyle = 'rgba(20, 10, 30, 0.6)';
        ctx.beginPath();
        // Body
        ctx.ellipse(bx, by, 8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        // Wings
        ctx.beginPath();
        ctx.moveTo(bx - 3, by);
        ctx.quadraticCurveTo(bx - 10, by - 8 + wingY, bx - 15, by - 3 + wingY);
        ctx.lineTo(bx - 3, by);
        ctx.moveTo(bx + 3, by);
        ctx.quadraticCurveTo(bx + 10, by - 8 + wingY, bx + 15, by - 3 + wingY);
        ctx.lineTo(bx + 3, by);
        ctx.fill();
      });

      // Meteors (shooting stars)
      if (Math.random() < 0.003) {
        meteorsRef.current.push({
          x: width + 20,
          y: Math.random() * height * 0.4,
          speed: 300 + Math.random() * 200,
          angle: Math.PI * 0.8 + Math.random() * 0.2,
          length: 40 + Math.random() * 60,
          life: 1,
        });
      }
      
      meteorsRef.current = meteorsRef.current.filter(meteor => {
        meteor.x -= Math.cos(meteor.angle) * meteor.speed * 0.016;
        meteor.y += Math.sin(meteor.angle) * meteor.speed * 0.016;
        meteor.life -= 0.015;
        
        if (meteor.life > 0 && meteor.x > -100 && meteor.y < height) {
          const meteorGrad = ctx.createLinearGradient(
            meteor.x, meteor.y,
            meteor.x + Math.cos(meteor.angle) * meteor.length,
            meteor.y - Math.sin(meteor.angle) * meteor.length
          );
          meteorGrad.addColorStop(0, `rgba(255, 255, 255, ${meteor.life})`);
          meteorGrad.addColorStop(0.3, `rgba(255, 200, 100, ${meteor.life * 0.7})`);
          meteorGrad.addColorStop(1, 'rgba(255, 100, 50, 0)');
          
          ctx.strokeStyle = meteorGrad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(
            meteor.x + Math.cos(meteor.angle) * meteor.length,
            meteor.y - Math.sin(meteor.angle) * meteor.length
          );
          ctx.stroke();
          return true;
        }
        return false;
      });
    }

    // Lightning (optimized - reduced shadows)
    lightningsRef.current.forEach(lightning => {
      const alpha = lightning.life / lightning.maxLife;
      ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lightning.points[0].x, lightning.points[0].y);
      for (let i = 1; i < lightning.points.length; i++) {
        ctx.lineTo(lightning.points[i].x, lightning.points[i].y);
      }
      ctx.stroke();
      
      // Branches (reduced)
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = `rgba(180, 200, 255, ${alpha * 0.6})`;
      for (let i = 2; i < lightning.points.length - 1; i += 3) {
        if (Math.random() > 0.6) {
          ctx.beginPath();
          ctx.moveTo(lightning.points[i].x, lightning.points[i].y);
          ctx.lineTo(lightning.points[i].x + (Math.random() - 0.5) * 30, lightning.points[i].y + 15);
          ctx.stroke();
        }
      }
    });

    // Clouds (optimized - no shadows)
    ctx.fillStyle = isCrazy ? 'rgba(80, 40, 120, 0.4)' : 'rgba(255, 255, 255, 0.7)';
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

    // Pipes with enhanced visuals
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

      // Pipe glow removed for performance

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

      // Danger indicator for moving pipes (simplified)
      if (pipe.moving && isCrazy) {
        const pulseAlpha = 0.15 + Math.sin(time / 200) * 0.08;
        ctx.fillStyle = `rgba(255, 0, 255, ${pulseAlpha})`;
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, height - pipe.bottomY - config.groundHeight);
      }
    });

    // Draw coins with enhanced effects
    coinsRef.current.forEach(coin => {
      ctx.save();
      ctx.translate(coin.x, coin.y);
      ctx.rotate(coin.rotation);
      
      const colors = {
        silver: { main: '#C0C0C0', shine: '#FFFFFF', border: '#808080', glow: '#E0E0E0' },
        gold: { main: '#FFD700', shine: '#FFED4A', border: '#B8860B', glow: '#FFA500' },
        diamond: { main: '#00FFFF', shine: '#FFFFFF', border: '#008B8B', glow: '#00CED1' },
      };
      const c = colors[coin.type];
      
      // Enhanced glow
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 20;
      
      // Outer glow ring
      ctx.strokeStyle = c.glow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, coin.radius + 4 + Math.sin(time / 150) * 2, 0, Math.PI * 2);
      ctx.stroke();
      
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

    // Draw shields with enhanced effects
    shieldsRef.current.forEach(shield => {
      ctx.save();
      ctx.translate(shield.x, shield.y);
      ctx.rotate(shield.rotation);
      
      // Shield shape (optimized - no shadows)
      const pulse = Math.sin(time / 200) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(0, 255, 100, ${0.5 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.moveTo(0, -shield.radius);
      ctx.lineTo(shield.radius, -shield.radius / 2);
      ctx.lineTo(shield.radius, shield.radius / 2);
      ctx.lineTo(0, shield.radius);
      ctx.lineTo(-shield.radius, shield.radius / 2);
      ctx.lineTo(-shield.radius, -shield.radius / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#00AA00';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Shield icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡', 0, 0);
      
      ctx.restore();
    });

    // Draw weapons
    weaponsRef.current.forEach(weapon => {
      ctx.save();
      ctx.translate(weapon.x, weapon.y);
      ctx.rotate(weapon.rotation);
      
      // Weapon shape (gun) - no shadows
      ctx.fillStyle = '#444444';
      ctx.fillRect(-weapon.radius, -5, weapon.radius * 2, 10);
      ctx.fillStyle = '#FF6600';
      ctx.fillRect(-weapon.radius + 5, -3, weapon.radius - 5, 6);
      ctx.strokeStyle = '#222222';
      ctx.lineWidth = 2;
      ctx.strokeRect(-weapon.radius, -5, weapon.radius * 2, 10);
      
      // Ammo indicator
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '8px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${weapon.ammo}`, 0, -12);
      
      ctx.restore();
    });

    // Draw enemies with enhanced visuals
    enemiesRef.current.forEach(enemy => {
      ctx.save();
      ctx.translate(enemy.x, enemy.y);
      
      if (enemy.type === 'bird') {
        // Enemy bird (red/black) - optimized
        ctx.rotate((Math.sin(time / 100) * 10) * Math.PI / 180);
        
        // Body
        const bodyGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.width / 2);
        bodyGrad.addColorStop(0, '#CC0000');
        bodyGrad.addColorStop(1, '#660000');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4A0000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Wing
        ctx.fillStyle = '#990000';
        const wy = Math.sin(time / 50) * 5;
        ctx.beginPath();
        ctx.ellipse(5, wy, 10, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Angry eye
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(-enemy.width / 4, -enemy.height / 6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-enemy.width / 4 - 1, -enemy.height / 6, 3, 0, Math.PI * 2);
        ctx.fill();
        // Angry eyebrow
        ctx.strokeStyle = '#4A0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 4 - 6, -enemy.height / 6 - 8);
        ctx.lineTo(-enemy.width / 4 + 4, -enemy.height / 6 - 4);
        ctx.stroke();
        
        // Beak
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 2, 0);
        ctx.lineTo(-enemy.width / 2 - 15, 3);
        ctx.lineTo(-enemy.width / 2, 8);
        ctx.closePath();
        ctx.fill();
        
      } else if (enemy.type === 'missile') {
        // Missile - optimized
        ctx.rotate(enemy.rotation * Math.PI / 180);
        
        // Body
        const missileGrad = ctx.createLinearGradient(-enemy.width / 2, 0, enemy.width / 2, 0);
        missileGrad.addColorStop(0, '#FF6666');
        missileGrad.addColorStop(0.5, '#FF0000');
        missileGrad.addColorStop(1, '#880000');
        ctx.fillStyle = missileGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Tip
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 2, 0);
        ctx.lineTo(-enemy.width / 2 - 12, -6);
        ctx.lineTo(-enemy.width / 2 - 12, 6);
        ctx.closePath();
        ctx.fill();
        
        // Flame trail (optimized - reduced count)
        for (let i = 0; i < 3; i++) {
          const flameX = enemy.width / 2 + 10 + i * 6;
          const flameSize = 7 - i * 2;
          ctx.fillStyle = i === 0 ? '#FFFF00' : i === 1 ? '#FF6600' : '#FF0000';
          ctx.globalAlpha = 1 - i * 0.3;
          ctx.beginPath();
          ctx.arc(flameX, 0, flameSize, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        
      } else if (enemy.type === 'hunter') {
        // Hunter (person with gun) - optimized
        
        // Body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-15, -20, 30, 35);
        
        // Head
        ctx.fillStyle = '#DEB887';
        ctx.beginPath();
        ctx.arc(0, -28, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // Hat
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.ellipse(0, -38, 15, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-10, -45, 20, 10);
        
        // Gun
        ctx.fillStyle = '#333333';
        ctx.fillRect(-25, -5, 20, 6);
        ctx.fillRect(-30, -3, 8, 4);
        
        // Muzzle flash when shooting
        if (enemy.lastShot && time - enemy.lastShot < 100) {
          ctx.fillStyle = '#FFFF00';
          ctx.beginPath();
          ctx.arc(-32, -1, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Health bar
        if ((enemy.health || 0) > 0) {
          ctx.fillStyle = '#333333';
          ctx.fillRect(-15, -55, 30, 5);
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(-15, -55, 30 * ((enemy.health || 1) / 3), 5);
        }
        
      } else if (enemy.type === 'plane') {
        // Military plane - optimized
        
        // Body
        const planeGrad = ctx.createLinearGradient(0, -enemy.height / 2, 0, enemy.height / 2);
        planeGrad.addColorStop(0, '#556B2F');
        planeGrad.addColorStop(0.5, '#6B8E23');
        planeGrad.addColorStop(1, '#556B2F');
        ctx.fillStyle = planeGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, enemy.width / 2, enemy.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = '#4A5D23';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, -20);
        ctx.lineTo(15, -20);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 20);
        ctx.lineTo(15, 20);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#8B0000';
        ctx.beginPath();
        ctx.moveTo(-enemy.width / 2, 0);
        ctx.lineTo(-enemy.width / 2 - 15, -5);
        ctx.lineTo(-enemy.width / 2 - 15, 5);
        ctx.closePath();
        ctx.fill();
        
        // Propeller
        ctx.fillStyle = '#333333';
        const propAngle = time / 20;
        ctx.save();
        ctx.translate(-enemy.width / 2 - 15, 0);
        ctx.rotate(propAngle);
        ctx.fillRect(-2, -15, 4, 30);
        ctx.restore();
        
        // Health bar
        if ((enemy.health || 0) > 0) {
          ctx.fillStyle = '#333333';
          ctx.fillRect(-20, -25, 40, 5);
          ctx.fillStyle = '#FFFF00';
          ctx.fillRect(-20, -25, 40 * ((enemy.health || 1) / 2), 5);
        }
      }
      
      ctx.restore();
    });

    // Draw bullets
    bulletsRef.current.forEach(bullet => {
      ctx.save();
      ctx.translate(bullet.x, bullet.y);
      
      if (bullet.fromPlayer) {
        const bulletType = bullet.type || 'normal';
        
        if (bulletType === 'fire') {
          // ENHANCED Fire bullet - intense flames and glow
          const pulseSize = bullet.radius + Math.sin(time / 30) * 2;
          
          // Outer glow
          ctx.shadowColor = '#FF4500';
          ctx.shadowBlur = 15;
          
          // Core fireball
          const fireGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
          fireGrad.addColorStop(0, '#FFFFFF');
          fireGrad.addColorStop(0.2, '#FFFF00');
          fireGrad.addColorStop(0.5, '#FF6600');
          fireGrad.addColorStop(0.8, '#FF4500');
          fireGrad.addColorStop(1, '#8B0000');
          ctx.fillStyle = fireGrad;
          ctx.beginPath();
          ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          
          // Intense flame trail
          for (let i = 0; i < 5; i++) {
            const trailX = -bullet.radius * 1.5 - i * 7;
            const trailSize = bullet.radius * (1.2 - i * 0.2);
            const yOffset = Math.sin(time / 30 + i) * 3;
            const colors = ['#FFFFFF', '#FFFF00', '#FF6600', '#FF4500', '#8B0000'];
            ctx.fillStyle = colors[i];
            ctx.globalAlpha = 1 - i * 0.18;
            ctx.beginPath();
            ctx.arc(trailX, yOffset, trailSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Fire sparks around bullet
          ctx.globalAlpha = 1;
          for (let i = 0; i < 4; i++) {
            const sparkAngle = (time / 50 + i * Math.PI / 2) % (Math.PI * 2);
            const sparkDist = bullet.radius + 4 + Math.sin(time / 30 + i) * 2;
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(Math.cos(sparkAngle) * sparkDist, Math.sin(sparkAngle) * sparkDist, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
        } else if (bulletType === 'lightning') {
          // ENHANCED Lightning bullet - electric and powerful
          const pulseSize = bullet.radius + Math.sin(time / 20) * 1.5;
          
          // Electric glow
          ctx.shadowColor = '#00FFFF';
          ctx.shadowBlur = 20;
          
          // Core energy ball
          const lightningGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseSize);
          lightningGrad.addColorStop(0, '#FFFFFF');
          lightningGrad.addColorStop(0.3, '#AAFFFF');
          lightningGrad.addColorStop(0.6, '#00FFFF');
          lightningGrad.addColorStop(1, '#0040FF');
          ctx.fillStyle = lightningGrad;
          ctx.beginPath();
          ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.shadowBlur = 0;
          
          // Electric arcs shooting out
          ctx.strokeStyle = '#00FFFF';
          ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            const angle = (time / 40 + i * Math.PI / 3) % (Math.PI * 2);
            const length = bullet.radius + 8 + Math.sin(time / 25 + i) * 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            // Zigzag lightning pattern
            const midX = Math.cos(angle) * length * 0.5 + (Math.random() - 0.5) * 4;
            const midY = Math.sin(angle) * length * 0.5 + (Math.random() - 0.5) * 4;
            ctx.lineTo(midX, midY);
            ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            ctx.stroke();
          }
          
          // Electric trail
          ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.ellipse(-bullet.radius * 2.5, 0, bullet.radius * 2, bullet.radius * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Secondary electric rings
          ctx.strokeStyle = 'rgba(100, 255, 255, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, pulseSize + 4 + Math.sin(time / 15) * 2, 0, Math.PI * 2);
          ctx.stroke();
          
        } else {
          // Normal bullet (yellow/orange) - optimized
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
          ctx.fill();
          
          // Trail (simplified)
          ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
          ctx.beginPath();
          ctx.ellipse(-bullet.radius * 1.5, 0, bullet.radius * 1.5, bullet.radius / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Enemy bullet (red) - optimized
        ctx.fillStyle = '#FF4444';
        ctx.beginPath();
        ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail (simplified)
        ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-bullet.radius * 1.5, 0, bullet.radius * 1.5, bullet.radius / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // Draw bombs
    bombsRef.current.forEach(bomb => {
      ctx.save();
      ctx.translate(bomb.x, bomb.y);
      
      // Bomb body (no shadow)
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.arc(0, 0, bomb.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Fuse
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -bomb.radius);
      ctx.lineTo(0, -bomb.radius - 5);
      ctx.stroke();
      
      // Spark
      ctx.fillStyle = '#FF6600';
      ctx.beginPath();
      ctx.arc(0, -bomb.radius - 5, 3 + Math.sin(time / 50) * 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });

    // Draw particles (optimized - no shadows)
    particlesRef.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.fillStyle = particle.color;
      ctx.globalAlpha = alpha;
      
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.globalAlpha = 1;
    });

    // Ground (optimized - no shadows)
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

    // Shield aura (enhanced)
    if (bird.hasShield) {
      const shieldPulse = Math.sin(time / 150) * 0.3 + 0.7;
      const isEnhanced = bird.shieldLevel === 2;
      
      if (isEnhanced) {
        // EPIC Enhanced shield - dramatic transformation
        const fastPulse = Math.sin(time / 80) * 0.4 + 0.6;
        const rotationAngle = time / 500;
        
        // Outer energy field glow
        ctx.shadowColor = '#00FFFF';
        ctx.shadowBlur = 25;
        
        // Triple rotating rings
        for (let ring = 0; ring < 3; ring++) {
          const ringRadius = bird.width / 2 + 8 + ring * 6;
          const ringAlpha = 0.8 - ring * 0.2;
          const ringRotation = rotationAngle * (ring % 2 === 0 ? 1 : -1);
          
          ctx.strokeStyle = `rgba(0, 255, 255, ${ringAlpha * fastPulse})`;
          ctx.lineWidth = 4 - ring;
          ctx.beginPath();
          ctx.arc(0, 0, ringRadius, ringRotation, ringRotation + Math.PI * 1.5);
          ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
        
        // Energy particles orbiting
        for (let i = 0; i < 8; i++) {
          const particleAngle = (time / 200 + i * Math.PI / 4) % (Math.PI * 2);
          const particleRadius = bird.width / 2 + 15 + Math.sin(time / 100 + i) * 3;
          const particleSize = 3 + Math.sin(time / 50 + i * 2) * 1.5;
          
          ctx.fillStyle = i % 2 === 0 ? '#00FFFF' : '#FFFFFF';
          ctx.beginPath();
          ctx.arc(
            Math.cos(particleAngle) * particleRadius,
            Math.sin(particleAngle) * particleRadius,
            particleSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        
        // Electric lightning bolts
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
          const boltAngle = (time / 150 + i * Math.PI / 2) % (Math.PI * 2);
          const innerR = bird.width / 2 + 5;
          const outerR = bird.width / 2 + 20;
          
          ctx.beginPath();
          ctx.moveTo(Math.cos(boltAngle) * innerR, Math.sin(boltAngle) * innerR);
          const midR = (innerR + outerR) / 2;
          const midAngle = boltAngle + (Math.random() - 0.5) * 0.3;
          ctx.lineTo(Math.cos(midAngle) * midR + (Math.random() - 0.5) * 5, Math.sin(midAngle) * midR + (Math.random() - 0.5) * 5);
          ctx.lineTo(Math.cos(boltAngle) * outerR, Math.sin(boltAngle) * outerR);
          ctx.stroke();
        }
        
        // Inner power core glow
        const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, bird.width / 2 + 5);
        coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        coreGrad.addColorStop(0.7, 'rgba(0, 255, 255, 0.1)');
        coreGrad.addColorStop(1, `rgba(0, 255, 255, ${0.3 * fastPulse})`);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2 + 5, 0, Math.PI * 2);
        ctx.fill();
        
      } else {
        // Normal shield - simple protective aura
        ctx.strokeStyle = `rgba(0, 255, 100, ${0.4 + shieldPulse * 0.4})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2 + 8, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner shield
        ctx.strokeStyle = `rgba(100, 255, 150, ${0.3 + shieldPulse * 0.3})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, bird.width / 2 + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Weapon indicator (optimized - no shadows)
    if (bird.hasWeapon) {
      const weaponLevel = bird.weaponLevel || 1;
      const weaponColor = weaponLevel === 3 ? '#FF4500' : weaponLevel === 2 ? '#00FFFF' : '#FF6600';
      
      ctx.fillStyle = '#444444';
      ctx.fillRect(bird.width / 2 - 5, -3, 15, 6);
      
      // Weapon level indicator
      ctx.fillStyle = weaponColor;
      ctx.fillRect(bird.width / 2 - 3, -1, 11, 2);
      
      // Additional visual for advanced weapons (simplified)
      if (weaponLevel === 3) {
        // Fire effect
        ctx.fillStyle = '#FFA500';
        ctx.beginPath();
        ctx.arc(bird.width / 2 + 10, 0, 2.5 + Math.sin(time / 50) * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (weaponLevel === 2) {
        // Electric spark
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bird.width / 2 + 8, -2);
        ctx.lineTo(bird.width / 2 + 12, 0);
        ctx.lineTo(bird.width / 2 + 8, 2);
        ctx.stroke();
      }
    }

    // Body - EPIC aggressive look when enhanced shield, or custom bird colors
    const isEnhancedShield = bird.hasShield && bird.shieldLevel === 2;
    const selectedBirdData = SHOP_BIRDS.find(b => b.id === selectedBird) || SHOP_BIRDS[0];
    const birdColors = selectedBirdData.colors;
    const bg = ctx.createRadialGradient(-3, -5, 2, 0, 0, bird.width / 2);
    
    if (isEnhancedShield) {
      // Fiery aggressive coloring with pulsing effect
      const firePulse = Math.sin(time / 100) * 0.2 + 0.8;
      bg.addColorStop(0, '#FFFFFF');
      bg.addColorStop(0.3, '#FFD700');
      bg.addColorStop(0.6, `rgba(255, ${Math.floor(100 * firePulse)}, 0, 1)`);
      bg.addColorStop(1, '#8B0000');
      
      // Fiery glow around bird
      ctx.shadowColor = '#FF4500';
      ctx.shadowBlur = 15;
    } else {
      // Use selected bird colors
      bg.addColorStop(0, birdColors.bodyHighlight);
      bg.addColorStop(0.5, birdColors.body);
      bg.addColorStop(1, birdColors.wing);
    }
    
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, bird.width / 2, bird.height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isEnhancedShield ? '#FF0000' : birdColors.wingHighlight;
    ctx.lineWidth = isEnhancedShield ? 3 : 2;
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // Wing - fiery when enhanced, or custom colors
    const wy = Math.sin(wingAngleRef.current) * 7;
    ctx.fillStyle = isEnhancedShield ? '#FF6600' : birdColors.wing;
    ctx.beginPath();
    ctx.ellipse(-5, wy, 13, 9, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isEnhancedShield ? '#8B0000' : birdColors.wingHighlight;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eye - GLOWING RAGE when enhanced shield
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(bird.width / 4 + 2, -bird.height / 6, 9, 0, Math.PI * 2);
    ctx.fill();
    
    const py = Math.min(bird.velocity / 250, 3);
    
    if (isEnhancedShield) {
      // Glowing red eye with outer glow
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 10;
      
      // Red iris
      const eyeGlow = ctx.createRadialGradient(
        bird.width / 4 + 4, -bird.height / 6 + py, 0,
        bird.width / 4 + 4, -bird.height / 6 + py, 5
      );
      eyeGlow.addColorStop(0, '#FFFF00');
      eyeGlow.addColorStop(0.5, '#FF0000');
      eyeGlow.addColorStop(1, '#8B0000');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(bird.width / 4 + 4, -bird.height / 6 + py, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.shadowBlur = 0;
      
      // Angry eyebrow
      ctx.strokeStyle = '#8B0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bird.width / 4 - 4, -bird.height / 6 - 10);
      ctx.lineTo(bird.width / 4 + 10, -bird.height / 6 - 5);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.arc(bird.width / 4 + 4, -bird.height / 6 + py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    
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

    // Score flash (disabled in crazy mode to avoid visual distraction)
    if (scoreFlash && !isCrazy) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
    }

    // Enhanced HUD for crazy mode
    if (isCrazy && gameState.status === 'playing') {
      // Background panel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(width - 95, 5, 90, currentScore >= 20 ? 85 : 65);
      ctx.strokeStyle = 'rgba(138, 43, 226, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(width - 95, 5, 90, currentScore >= 20 ? 85 : 65);
      
      // Coins collected
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(`💰 ${totalCoinsRef.current}`, width - 15, 25);
      
      // Shield indicator
      if (bird.hasShield) {
        if (bird.shieldLevel === 2) {
          ctx.fillStyle = '#00FFFF';
          ctx.fillText(`🛡️ x${bird.shieldHits || 0}`, width - 15, 45);
        } else {
          ctx.fillStyle = '#00FF00';
          ctx.fillText('🛡️ ACTIVE', width - 15, 45);
        }
      } else {
        ctx.fillStyle = '#666666';
        ctx.fillText('🛡️ ---', width - 15, 45);
      }
      
      // Weapon indicator
      if (bird.hasWeapon && bird.weaponAmmo) {
        const weaponLevel = bird.weaponLevel || 1;
        const weaponColor = weaponLevel === 3 ? '#FF4500' : weaponLevel === 2 ? '#00FFFF' : '#FF6600';
        const weaponIcon = weaponLevel === 3 ? '🔥' : weaponLevel === 2 ? '⚡' : '🔫';
        ctx.fillStyle = weaponColor;
        ctx.fillText(`${weaponIcon} ${bird.weaponAmmo}`, width - 15, 65);
      } else {
        ctx.fillStyle = '#666666';
        ctx.fillText('🔫 ---', width - 15, 65);
      }
      
      // Warning for advanced enemies
      if (currentScore >= 20) {
        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 10px Arial';
        ctx.fillText('⚠️ DANGER!', width - 15, 82);
      }
    }
  }, [width, height, scoreFlash, gameState.difficulty, gameState.status, gameState.score]);

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
