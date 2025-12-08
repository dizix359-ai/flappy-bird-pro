import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  SHOP_BIRDS, 
  SHOP_WEAPONS, 
  ShopBird, 
  ShopWeapon, 
  PlayerProgress 
} from './shopTypes';

interface ShopProps {
  progress: PlayerProgress;
  onPurchase: (type: 'bird' | 'weapon', id: string, price: number) => boolean;
  onSelect: (type: 'bird' | 'weapon', id: string) => void;
  onClose: () => void;
}

export const Shop = ({ progress, onPurchase, onSelect, onClose }: ShopProps) => {
  const [activeTab, setActiveTab] = useState<'birds' | 'weapons'>('birds');
  const [message, setMessage] = useState<string | null>(null);

  const isUnlocked = (item: ShopBird | ShopWeapon): boolean => {
    if (!item.unlockRequirement) return true;
    const { type, value } = item.unlockRequirement;
    switch (type) {
      case 'score': return progress.highestScore >= value;
      case 'coins': return progress.totalCoins >= value; // Total coins earned, not current
      case 'kills': return progress.totalKills >= value;
      default: return true;
    }
  };

  const getUnlockProgress = (item: ShopBird | ShopWeapon): { current: number; required: number; percent: number } | null => {
    if (!item.unlockRequirement) return null;
    const { type, value } = item.unlockRequirement;
    let current = 0;
    switch (type) {
      case 'score': current = progress.highestScore; break;
      case 'coins': current = progress.totalCoins; break;
      case 'kills': current = progress.totalKills; break;
    }
    return { current, required: value, percent: Math.min(100, (current / value) * 100) };
  };

  const isPurchased = (type: 'bird' | 'weapon', id: string): boolean => {
    return type === 'bird' 
      ? progress.purchasedBirds.includes(id)
      : progress.purchasedWeapons.includes(id);
  };

  const isSelected = (type: 'bird' | 'weapon', id: string): boolean => {
    return type === 'bird'
      ? progress.selectedBird === id
      : progress.selectedWeapon === id;
  };

  const handleAction = (type: 'bird' | 'weapon', item: ShopBird | ShopWeapon) => {
    if (!isUnlocked(item)) {
      const req = item.unlockRequirement!;
      const reqText = req.type === 'score' ? `نقاط: ${req.value}` 
        : req.type === 'coins' ? `عملات: ${req.value}` 
        : `قتل: ${req.value}`;
      setMessage(`🔒 يتطلب: ${reqText}`);
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    if (isPurchased(type, item.id)) {
      onSelect(type, item.id);
      setMessage(`✅ تم اختيار: ${item.nameAr}`);
      setTimeout(() => setMessage(null), 1500);
    } else {
      if (progress.totalCoins >= item.price) {
        const success = onPurchase(type, item.id, item.price);
        if (success) {
          setMessage(`🎉 تم الشراء: ${item.nameAr}`);
          setTimeout(() => setMessage(null), 2000);
        }
      } else {
        setMessage(`💰 عملات غير كافية! تحتاج ${item.price - progress.totalCoins} إضافية`);
        setTimeout(() => setMessage(null), 2000);
      }
    }
  };

  const renderBirdPreview = (bird: ShopBird, size: number = 50) => (
    <svg width={size} height={size * 0.75} viewBox="0 0 60 45">
      <ellipse cx="30" cy="22" rx="25" ry="18" fill={bird.colors.body} stroke={bird.colors.bodyHighlight} strokeWidth="2"/>
      <ellipse cx="22" cy="22" rx="10" ry="7" fill={bird.colors.wing} stroke={bird.colors.wingHighlight} strokeWidth="1"/>
      <circle cx="40" cy="17" r="7" fill="white"/>
      <circle cx="42" cy="17" r="3.5" fill={bird.colors.eye}/>
      <circle cx="43" cy="15" r="1.5" fill="white"/>
      <path d={`M50 22 L65 24 L50 28 Z`} fill={bird.colors.beak}/>
    </svg>
  );

  const renderWeaponPreview = (weapon: ShopWeapon, size: number = 50) => (
    <div 
      className="flex items-center justify-center rounded-lg"
      style={{ 
        width: size, 
        height: size * 0.75,
        background: `linear-gradient(135deg, ${weapon.bulletColor}40, ${weapon.bulletColor}80)`,
        border: `2px solid ${weapon.bulletColor}`,
        boxShadow: `0 0 10px ${weapon.bulletColor}60`,
      }}
    >
      <span className="text-2xl">
        {weapon.id === 'basic' ? '🔫' : 
         weapon.id === 'rapid' ? '⚡' : 
         weapon.id === 'plasma' ? '💠' : 
         weapon.id === 'laser' ? '🔴' : 
         weapon.id === 'thunder' ? '⛈️' : '🔥'}
      </span>
    </div>
  );

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-sm flex flex-col p-4 z-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-2xl transition-colors"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold text-white text-center flex-1">🛒 المتجر</h2>
        <div className="flex items-center gap-1 bg-yellow-500/30 px-3 py-1 rounded-full">
          <span className="text-yellow-400 font-bold">{progress.totalCoins}</span>
          <span className="text-yellow-300">💰</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-center gap-4 mb-4 text-xs">
        <div className="bg-white/10 px-2 py-1 rounded text-white/70">
          🏆 أعلى نقاط: {progress.highestScore}
        </div>
        <div className="bg-white/10 px-2 py-1 rounded text-white/70">
          💀 قتل: {progress.totalKills}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('birds')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'birds'
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          🐦 الطيور
        </button>
        <button
          onClick={() => setActiveTab('weapons')}
          className={`flex-1 py-2 rounded-lg font-bold transition-all ${
            activeTab === 'weapons'
              ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          🔫 الأسلحة
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="bg-black/50 text-white text-center py-2 px-4 rounded-lg mb-3 animate-fade-in text-sm">
          {message}
        </div>
      )}

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3">
          {activeTab === 'birds' ? (
            SHOP_BIRDS.map((bird) => {
              const unlocked = isUnlocked(bird);
              const purchased = isPurchased('bird', bird.id);
              const selected = isSelected('bird', bird.id);
              const unlockProgress = getUnlockProgress(bird);
              
              return (
                <div
                  key={bird.id}
                  onClick={() => handleAction('bird', bird)}
                  className={`relative p-3 rounded-xl cursor-pointer transition-all ${
                    selected 
                      ? 'bg-gradient-to-br from-green-500/40 to-emerald-600/40 ring-2 ring-green-400'
                      : unlocked
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-black/30 opacity-80'
                  }`}
                >
                  {!unlocked && unlockProgress && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl p-2">
                      <span className="text-2xl mb-1">🔒</span>
                      <div className="w-full px-2">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
                            style={{ width: `${unlockProgress.percent}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-white/70 text-center mt-1">
                          {bird.unlockRequirement?.type === 'score' ? '🏆' : bird.unlockRequirement?.type === 'kills' ? '💀' : '💰'}
                          {' '}{unlockProgress.current}/{unlockProgress.required}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-2">
                    {renderBirdPreview(bird, 55)}
                    <p className="text-white font-bold text-xs text-center">{bird.nameAr}</p>
                    
                    {bird.special && (
                      <p className="text-yellow-300 text-[10px] text-center leading-tight">{bird.special}</p>
                    )}
                    
                    <div className="mt-1">
                      {selected ? (
                        <span className="text-green-400 text-xs font-bold">✓ مُختار</span>
                      ) : purchased ? (
                        <span className="text-blue-300 text-xs">اختيار</span>
                      ) : unlocked ? (
                        <span className="text-yellow-400 text-xs font-bold">
                          {bird.price === 0 ? 'مجاني' : `💰 ${bird.price.toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold">
                          💰 {bird.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            SHOP_WEAPONS.map((weapon) => {
              const unlocked = isUnlocked(weapon);
              const purchased = isPurchased('weapon', weapon.id);
              const selected = isSelected('weapon', weapon.id);
              const unlockProgress = getUnlockProgress(weapon);
              
              return (
                <div
                  key={weapon.id}
                  onClick={() => handleAction('weapon', weapon)}
                  className={`relative p-3 rounded-xl cursor-pointer transition-all ${
                    selected 
                      ? 'bg-gradient-to-br from-green-500/40 to-emerald-600/40 ring-2 ring-green-400'
                      : unlocked
                        ? 'bg-white/10 hover:bg-white/20'
                        : 'bg-black/30 opacity-80'
                  }`}
                >
                  {!unlocked && unlockProgress && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl p-2">
                      <span className="text-2xl mb-1">🔒</span>
                      <div className="w-full px-2">
                        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all"
                            style={{ width: `${unlockProgress.percent}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-white/70 text-center mt-1">
                          {weapon.unlockRequirement?.type === 'score' ? '🏆' : weapon.unlockRequirement?.type === 'kills' ? '💀' : '💰'}
                          {' '}{unlockProgress.current}/{unlockProgress.required}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-2">
                    {renderWeaponPreview(weapon, 55)}
                    <p className="text-white font-bold text-xs text-center">{weapon.nameAr}</p>
                    
                    <div className="flex gap-2 text-[10px] text-white/60">
                      <span>⚔️ {weapon.damage}</span>
                      <span>⚡ {(1 / weapon.fireRate).toFixed(1)}/ث</span>
                    </div>
                    
                    {weapon.special && (
                      <p className="text-cyan-300 text-[10px] text-center leading-tight">{weapon.special}</p>
                    )}
                    
                    <div className="mt-1">
                      {selected ? (
                        <span className="text-green-400 text-xs font-bold">✓ مُختار</span>
                      ) : purchased ? (
                        <span className="text-blue-300 text-xs">اختيار</span>
                      ) : unlocked ? (
                        <span className="text-yellow-400 text-xs font-bold">
                          {weapon.price === 0 ? 'مجاني' : `💰 ${weapon.price.toLocaleString()}`}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs font-bold">
                          💰 {weapon.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Current Selection */}
      <div className="mt-4 p-3 bg-white/10 rounded-xl">
        <p className="text-white/70 text-xs text-center mb-2">المُختار حالياً:</p>
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2">
            {renderBirdPreview(SHOP_BIRDS.find(b => b.id === progress.selectedBird) || SHOP_BIRDS[0], 35)}
            <span className="text-white text-xs">
              {SHOP_BIRDS.find(b => b.id === progress.selectedBird)?.nameAr}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {renderWeaponPreview(SHOP_WEAPONS.find(w => w.id === progress.selectedWeapon) || SHOP_WEAPONS[0], 35)}
            <span className="text-white text-xs">
              {SHOP_WEAPONS.find(w => w.id === progress.selectedWeapon)?.nameAr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
