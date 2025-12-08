import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Difficulty } from './types';

interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  difficulty: string;
  updated_at: string;
}

interface LeaderboardProps {
  onClose: () => void;
}

export const Leaderboard = ({ onClose }: LeaderboardProps) => {
  const [activeTab, setActiveTab] = useState<Difficulty>('crazy');
  const [entries, setEntries] = useState<Record<Difficulty, LeaderboardEntry[]>>({
    easy: [],
    hard: [],
    crazy: [],
  });
  const [loading, setLoading] = useState(true);

  const tabs: { key: Difficulty; label: string; icon: string }[] = [
    { key: 'easy', label: 'سهل', icon: '🌱' },
    { key: 'hard', label: 'صعب', icon: '🔥' },
    { key: 'crazy', label: 'مجنون', icon: '💀' },
  ];

  // Fetch leaderboard data
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const difficulties: Difficulty[] = ['easy', 'hard', 'crazy'];
      const results: Record<Difficulty, LeaderboardEntry[]> = { easy: [], hard: [], crazy: [] };

      for (const diff of difficulties) {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .eq('difficulty', diff)
          .order('score', { ascending: false })
          .limit(20);

        if (!error && data) {
          results[diff] = data;
        }
      }

      setEntries(results);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to realtime updates
  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboard',
        },
        () => {
          // Refetch on any change
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getMedalEmoji = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `${index + 1}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <button
          onClick={onClose}
          className="text-white/70 hover:text-white transition-colors text-2xl"
        >
          ✕
        </button>
        <h1 className="text-xl font-bold text-yellow-400">🏆 لوحة المتصدرين</h1>
        <div className="w-8" /> {/* Spacer */}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-2 bg-black/20">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
              activeTab === tab.key
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-lg animate-pulse">
              ⏳ جاري التحميل...
            </div>
          </div>
        ) : entries[activeTab].length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <span className="text-4xl mb-3">🎮</span>
            <p className="text-white/60">لا توجد نتائج بعد</p>
            <p className="text-white/40 text-sm mt-1">كن أول من يسجل رقمًا قياسيًا!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries[activeTab].map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  index < 3
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-full ${
                  index < 3 ? 'bg-yellow-500/30 text-xl' : 'bg-white/10 text-white/60 text-sm font-bold'
                }`}>
                  {getMedalEmoji(index)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{entry.player_name}</p>
                  <p className="text-white/40 text-xs">{formatDate(entry.updated_at)}</p>
                </div>
                
                <div className="text-right">
                  <p className={`font-bold text-lg ${
                    index < 3 ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {entry.score}
                  </p>
                  <p className="text-white/40 text-xs">نقطة</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-black/20">
        <p className="text-center text-white/40 text-xs">
          🔄 يتم التحديث تلقائياً
        </p>
      </div>
    </div>
  );
};
