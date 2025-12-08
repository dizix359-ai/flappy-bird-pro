import { useState } from 'react';
import { Difficulty } from './types';

interface HighScoreNameInputProps {
  score: number;
  difficulty: Difficulty;
  onSubmit: (name: string) => void;
  onSkip: () => void;
}

export const HighScoreNameInput = ({ 
  score, 
  difficulty, 
  onSubmit, 
  onSkip 
}: HighScoreNameInputProps) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const difficultyLabels = {
    easy: '🌱 سهل',
    hard: '🔥 صعب',
    crazy: '💀 مجنون',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    
    setIsSubmitting(true);
    await onSubmit(name.trim());
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-indigo-900 to-purple-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/20">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-400 mb-2">
            🏆 رقم قياسي جديد!
          </h2>
          <p className="text-white/80 text-sm">{difficultyLabels[difficulty]}</p>
          <p className="text-4xl font-bold text-white mt-3">{score}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/90 text-sm mb-2 text-center">
              أدخل اسمك للظهور في لوحة المتصدرين
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسمك هنا..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-center text-lg"
              autoFocus
              disabled={isSubmitting}
            />
            <p className="text-white/50 text-xs mt-1 text-center">
              {name.length}/20 حرف
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={name.trim().length < 2 || isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:from-yellow-400 hover:to-orange-400 transition-all active:scale-95"
            >
              {isSubmitting ? '⏳ جاري الحفظ...' : '✨ سجّل اسمي'}
            </button>
            
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-2 text-white/60 text-sm hover:text-white/80 transition-colors"
              disabled={isSubmitting}
            >
              تخطي
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
