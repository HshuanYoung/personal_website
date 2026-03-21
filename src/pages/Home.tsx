import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, type Language } from '../types';
import { cn } from '../lib/utils';

export default function Home({ lang }: { lang: Language }) {
  const [meritCount, setMeritCount] = useState(0);
  const [totalMerit, setTotalMerit] = useState<number | null>(null);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  useEffect(() => {
    fetch('/api/merit-stats')
      .then(res => res.json())
      .then(data => setTotalMerit(data.total))
      .catch(err => console.error('Failed to fetch merit stats:', err));
  }, []);

  const handleFishClick = async () => {
    try {
      const response = await fetch('/api/click-fish', {
        method: 'POST',
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 100));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        setError(t.meritFull);
        setTimeout(() => setError(null), 3000);
        return;
      }

      setMeritCount(prev => prev + 1);
      setTotalMerit(data.total);
      setShowPlusOne(true);
      setTimeout(() => setShowPlusOne(false), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center h-[70vh] gap-12"
    >
      <div className="text-center">
        <h2 className="text-5xl font-bold tracking-tight mb-4">hsyoung.icu</h2>
        <p className="text-neutral-500 max-w-md mx-auto">
          Welcome to my personal space. Tap the wooden fish to accumulate merit for the day.
        </p>
      </div>

      <div className="relative group">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFishClick}
          className="w-64 h-64 bg-neutral-900 rounded-full flex items-center justify-center shadow-2xl border-8 border-neutral-800 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <span className="text-8xl select-none">🐟</span>
        </motion.button>

        <AnimatePresence>
          {showPlusOne && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -100 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-500 font-bold text-2xl pointer-events-none"
            >
              {t.merit}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium border border-red-100 whitespace-nowrap"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-neutral-400">Daily Merit Status</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={cn("w-2 h-2 rounded-full", i < meritCount ? "bg-emerald-500" : "bg-neutral-200")} />
            ))}
          </div>
        </div>

        {totalMerit !== null && (
          <div className="bg-neutral-50 px-6 py-3 rounded-2xl border border-neutral-100 flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1">Global Merit</span>
            <span className="text-2xl font-mono font-bold text-neutral-900">{totalMerit.toLocaleString()}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}


