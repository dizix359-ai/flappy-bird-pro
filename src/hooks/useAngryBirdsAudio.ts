import { useRef, useCallback, useEffect } from 'react';

interface AudioContextRef {
  ctx: AudioContext | null;
  initialized: boolean;
}

export const useAngryBirdsAudio = () => {
  const audioRef = useRef<AudioContextRef>({ ctx: null, initialized: false });

  // Initialize audio context on user interaction
  const initAudio = useCallback(() => {
    if (audioRef.current.initialized) return;
    
    try {
      audioRef.current.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioRef.current.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }, []);

  // Play a synthesized sound
  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.3,
    frequencyEnd?: number
  ) => {
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    if (frequencyEnd) {
      oscillator.frequency.exponentialRampToValueAtTime(frequencyEnd, ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  // Play noise (for explosions)
  const playNoise = useCallback((duration: number, volume: number = 0.3) => {
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    source.buffer = buffer;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + duration);

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
  }, []);

  // Slingshot stretch sound
  const playStretch = useCallback(() => {
    initAudio();
    playTone(200, 0.1, 'sine', 0.15, 400);
  }, [initAudio, playTone]);

  // Launch/shoot sound
  const playLaunch = useCallback(() => {
    initAudio();
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    // Whoosh sound
    playTone(300, 0.15, 'sine', 0.25, 800);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.15, 200), 50);
  }, [initAudio, playTone]);

  // Explosion sound
  const playExplosion = useCallback(() => {
    initAudio();
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    // Deep boom
    playTone(80, 0.4, 'sine', 0.5, 20);
    playNoise(0.5, 0.4);
    
    // Crackle
    setTimeout(() => {
      playNoise(0.3, 0.2);
    }, 100);
  }, [initAudio, playTone, playNoise]);

  // Block destruction sound
  const playBlockDestroy = useCallback((blockType: 'wood' | 'stone' | 'glass' | 'iron') => {
    initAudio();
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    switch (blockType) {
      case 'wood':
        // Cracking wood sound
        playTone(200, 0.15, 'sawtooth', 0.2, 100);
        playNoise(0.1, 0.15);
        break;
      case 'glass':
        // High-pitched shatter
        playTone(2000, 0.2, 'sine', 0.25, 500);
        playTone(3000, 0.15, 'sine', 0.15, 800);
        setTimeout(() => playTone(1500, 0.1, 'sine', 0.1, 400), 50);
        break;
      case 'stone':
        // Deep crumbling
        playTone(150, 0.2, 'square', 0.2, 80);
        playNoise(0.15, 0.2);
        break;
      case 'iron':
        // Metallic clang
        playTone(800, 0.3, 'sine', 0.3, 200);
        playTone(1200, 0.2, 'sine', 0.15, 300);
        break;
    }
  }, [initAudio, playTone, playNoise]);

  // Block hit/damage sound
  const playBlockHit = useCallback((blockType: 'wood' | 'stone' | 'glass' | 'iron') => {
    initAudio();
    
    switch (blockType) {
      case 'wood':
        playTone(300, 0.08, 'triangle', 0.15, 150);
        break;
      case 'glass':
        playTone(1500, 0.1, 'sine', 0.12, 800);
        break;
      case 'stone':
        playTone(200, 0.1, 'square', 0.12, 100);
        break;
      case 'iron':
        playTone(600, 0.12, 'sine', 0.15, 300);
        break;
    }
  }, [initAudio, playTone]);

  // Pig death/pop sound
  const playPigDeath = useCallback(() => {
    initAudio();
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    // Squeal
    playTone(400, 0.15, 'sine', 0.3, 800);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.2, 300), 80);
    
    // Pop
    setTimeout(() => {
      playTone(200, 0.1, 'sine', 0.25, 50);
      playNoise(0.08, 0.15);
    }, 150);
  }, [initAudio, playTone, playNoise]);

  // Pig damage/oink sound
  const playPigHit = useCallback(() => {
    initAudio();
    playTone(350, 0.12, 'sine', 0.2, 500);
    setTimeout(() => playTone(450, 0.08, 'sine', 0.15, 250), 60);
  }, [initAudio, playTone]);

  // Bird special ability sound
  const playSpecialAbility = useCallback((birdType: 'yellow' | 'black' | 'white') => {
    initAudio();
    const ctx = audioRef.current.ctx;
    if (!ctx) return;

    switch (birdType) {
      case 'yellow':
        // Speed boost - whoosh
        playTone(500, 0.2, 'sine', 0.3, 1500);
        playTone(800, 0.15, 'sine', 0.2, 2000);
        break;
      case 'black':
        // Explosion charging
        playTone(100, 0.3, 'sine', 0.3, 300);
        break;
      case 'white':
        // Egg drop
        playTone(600, 0.15, 'sine', 0.25, 300);
        playTone(400, 0.1, 'sine', 0.2, 200);
        break;
    }
  }, [initAudio, playTone]);

  // Victory sound
  const playVictory = useCallback(() => {
    initAudio();
    
    // Fanfare
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 150);
    });
  }, [initAudio, playTone]);

  // Defeat sound
  const playDefeat = useCallback(() => {
    initAudio();
    
    // Sad descending tones
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.25, 'sine', 0.15), i * 200);
    });
  }, [initAudio, playTone]);

  // Collision/impact sound
  const playImpact = useCallback((intensity: number = 1) => {
    initAudio();
    playTone(150 * intensity, 0.08, 'sine', 0.15 * intensity, 80);
    playNoise(0.05, 0.1 * intensity);
  }, [initAudio, playTone, playNoise]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioRef.current.ctx) {
        audioRef.current.ctx.close();
      }
    };
  }, []);

  return {
    initAudio,
    playStretch,
    playLaunch,
    playExplosion,
    playBlockDestroy,
    playBlockHit,
    playPigDeath,
    playPigHit,
    playSpecialAbility,
    playVictory,
    playDefeat,
    playImpact,
  };
};
