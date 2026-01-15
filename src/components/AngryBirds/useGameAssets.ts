import { useEffect, useState, useRef } from 'react';

// Import assets
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

export interface GameAssets {
  birds: {
    red: HTMLImageElement;
    yellow: HTMLImageElement;
    black: HTMLImageElement;
    white: HTMLImageElement;
  };
  pig: HTMLImageElement;
  blocks: {
    wood: HTMLImageElement;
    stone: HTMLImageElement;
    glass: HTMLImageElement;
    iron: HTMLImageElement;
  };
  slingshot: HTMLImageElement;
  background: HTMLImageElement;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

export const useGameAssets = () => {
  const [assets, setAssets] = useState<GameAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadAllAssets = async () => {
      try {
        setLoading(true);
        
        const [
          birdRed,
          birdYellow,
          birdBlack,
          birdWhite,
          pig,
          blockWood,
          blockStone,
          blockGlass,
          blockIron,
          slingshot,
          background,
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

        setAssets({
          birds: {
            red: birdRed,
            yellow: birdYellow,
            black: birdBlack,
            white: birdWhite,
          },
          pig,
          blocks: {
            wood: blockWood,
            stone: blockStone,
            glass: blockGlass,
            iron: blockIron,
          },
          slingshot,
          background,
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load game assets:', err);
        setError('Failed to load game assets');
        setLoading(false);
      }
    };

    loadAllAssets();
  }, []);

  return { assets, loading, error };
};
