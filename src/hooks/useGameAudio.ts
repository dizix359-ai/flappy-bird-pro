import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
}

const STORAGE_KEY = 'flappy-bird-audio-settings';

const defaultSettings: AudioSettings = {
  soundEnabled: true,
  musicEnabled: true,
  soundVolume: 0.5,
  musicVolume: 0.3,
};

export const useGameAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorRef = useRef<OscillatorNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const isMusicPlayingRef = useRef(false);

  // Initialize audio context
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  // Play a simple tone
  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'square', volume = 0.3) => {
    if (!settings.soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      const actualVolume = volume * settings.soundVolume;
      gainNode.gain.setValueAtTime(actualVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Jump sound - quick upward chirp
  const playJump = useCallback(() => {
    if (!settings.soundEnabled) return;
    
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

      const volume = 0.2 * settings.soundVolume;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Score sound - happy ding
  const playScore = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      // Play two notes for a "ding ding" effect
      [523.25, 659.25].forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

        const volume = 0.25 * settings.soundVolume;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + i * 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.1 + 0.2);

        oscillator.start(ctx.currentTime + i * 0.1);
        oscillator.stop(ctx.currentTime + i * 0.1 + 0.2);
      });
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Game over sound - sad descending tone
  const playGameOver = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const notes = [392, 349.23, 293.66, 261.63];
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);

        const volume = 0.2 * settings.soundVolume;
        gainNode.gain.setValueAtTime(volume, ctx.currentTime + i * 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);

        oscillator.start(ctx.currentTime + i * 0.15);
        oscillator.stop(ctx.currentTime + i * 0.15 + 0.2);
      });
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Weapon upgrade sound - powerful electric/fire effect
  const playWeaponUpgrade = useCallback((level: number) => {
    if (!settings.soundEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      if (level === 2) {
        // Lightning upgrade - electric zap sound
        const frequencies = [800, 1200, 1600, 2000, 1400, 1800];
        frequencies.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.03);
          osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + i * 0.03 + 0.05);
          
          const volume = 0.25 * settings.soundVolume;
          gain.gain.setValueAtTime(volume, ctx.currentTime + i * 0.03);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.03 + 0.1);
          
          osc.start(ctx.currentTime + i * 0.03);
          osc.stop(ctx.currentTime + i * 0.03 + 0.1);
        });
      } else if (level === 3) {
        // Fire upgrade - deep roaring flame sound
        const baseFreqs = [150, 200, 180, 220, 250, 300, 350, 400];
        baseFreqs.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
          osc.frequency.exponentialRampToValueAtTime(freq * 2, ctx.currentTime + i * 0.05 + 0.1);
          
          const volume = 0.3 * settings.soundVolume;
          gain.gain.setValueAtTime(volume, ctx.currentTime + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.05 + 0.15);
          
          osc.start(ctx.currentTime + i * 0.05);
          osc.stop(ctx.currentTime + i * 0.05 + 0.15);
        });
        
        // Add high frequency crackle
        for (let i = 0; i < 10; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'square';
          osc.frequency.setValueAtTime(800 + Math.random() * 1200, ctx.currentTime + i * 0.04);
          
          const volume = 0.15 * settings.soundVolume;
          gain.gain.setValueAtTime(volume, ctx.currentTime + i * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.04 + 0.05);
          
          osc.start(ctx.currentTime + i * 0.04);
          osc.stop(ctx.currentTime + i * 0.04 + 0.05);
        }
      }
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Shield upgrade sound - powerful transformation effect
  const playShieldUpgrade = useCallback(() => {
    if (!settings.soundEnabled) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      // Epic power-up rising tone
      const notes = [200, 300, 400, 500, 600, 800, 1000, 1200];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.06);
        
        const volume = 0.3 * settings.soundVolume;
        gain.gain.setValueAtTime(volume, ctx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.06 + 0.12);
        
        osc.start(ctx.currentTime + i * 0.06);
        osc.stop(ctx.currentTime + i * 0.06 + 0.12);
      });

      // Add power chord
      const chordFreqs = [400, 500, 600];
      chordFreqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + 0.5);
        
        const volume = 0.25 * settings.soundVolume;
        gain.gain.setValueAtTime(volume, ctx.currentTime + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        osc.start(ctx.currentTime + 0.5);
        osc.stop(ctx.currentTime + 0.8);
      });

      // Epic finish
      const finishOsc = ctx.createOscillator();
      const finishGain = ctx.createGain();
      finishOsc.connect(finishGain);
      finishGain.connect(ctx.destination);
      
      finishOsc.type = 'sine';
      finishOsc.frequency.setValueAtTime(1400, ctx.currentTime + 0.7);
      
      const finishVolume = 0.35 * settings.soundVolume;
      finishGain.gain.setValueAtTime(finishVolume, ctx.currentTime + 0.7);
      finishGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      
      finishOsc.start(ctx.currentTime + 0.7);
      finishOsc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.soundEnabled, settings.soundVolume, getAudioContext]);

  // Background music - simple looping melody
  const startMusic = useCallback(() => {
    if (!settings.musicEnabled || isMusicPlayingRef.current) return;

    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const gainNode = ctx.createGain();
      gainNode.connect(ctx.destination);
      gainNode.gain.setValueAtTime(0.1 * settings.musicVolume, ctx.currentTime);
      musicGainRef.current = gainNode;

      // Simple arpeggio pattern
      const playMelody = () => {
        if (!settings.musicEnabled || !isMusicPlayingRef.current) return;

        const notes = [261.63, 329.63, 392, 329.63, 261.63, 329.63, 392, 523.25];
        const noteDuration = 0.25;

        notes.forEach((freq, i) => {
          if (!isMusicPlayingRef.current) return;

          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * noteDuration);

          const volume = 0.08 * settings.musicVolume;
          gain.gain.setValueAtTime(volume, ctx.currentTime + i * noteDuration);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * noteDuration + noteDuration * 0.9);

          osc.start(ctx.currentTime + i * noteDuration);
          osc.stop(ctx.currentTime + i * noteDuration + noteDuration);
        });

        // Loop
        if (isMusicPlayingRef.current) {
          setTimeout(playMelody, notes.length * noteDuration * 1000);
        }
      };

      isMusicPlayingRef.current = true;
      playMelody();
    } catch (e) {
      console.log('Audio not supported');
    }
  }, [settings.musicEnabled, settings.musicVolume, getAudioContext]);

  const stopMusic = useCallback(() => {
    isMusicPlayingRef.current = false;
    if (musicOscillatorRef.current) {
      try {
        musicOscillatorRef.current.stop();
      } catch (e) {}
      musicOscillatorRef.current = null;
    }
    if (musicGainRef.current) {
      musicGainRef.current.disconnect();
      musicGainRef.current = null;
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  const toggleMusic = useCallback(() => {
    setSettings(prev => {
      const newMusicEnabled = !prev.musicEnabled;
      if (!newMusicEnabled) {
        stopMusic();
      }
      return { ...prev, musicEnabled: newMusicEnabled };
    });
  }, [stopMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopMusic]);

  return {
    settings,
    updateSettings,
    toggleSound,
    toggleMusic,
    playJump,
    playScore,
    playGameOver,
    playWeaponUpgrade,
    playShieldUpgrade,
    startMusic,
    stopMusic,
  };
};
