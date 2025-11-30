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
    startMusic,
    stopMusic,
  };
};
