import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, type Language } from '../types';
import { cn } from '../lib/utils';

export default function Home({ lang }: { lang: Language }) {
  const [meritCount, setMeritCount] = useState(0);
  const [totalMerit, setTotalMerit] = useState<number | null>(null);
  const [showPlusOne, setShowPlusOne] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = translations[lang];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isHitting, setIsHitting] = useState(false);

  useEffect(() => {
    fetch('/api/merit-stats')
      .then(res => res.json())
      .then(data => {
        setTotalMerit(data.total);
        setMeritCount(data.dailyCount || 0);
      })
      .catch(err => console.error('Failed to fetch merit stats:', err));
    
    // Preload "muyu" sound
    audioRef.current = new Audio('https://www.myinstants.com/media/sounds/muyu.mp3');
    audioRef.current.load();
  }, []);

  const handleFishClick = async () => {
    if (isHitting) return;

    // Play "muyu" sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Audio play blocked:', e));
    }

    // Trigger animation
    setIsHitting(true);
    setTimeout(() => setIsHitting(false), 200);

    try {
      const response = await fetch('/api/click-fish', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(t.meritFull);
        setTimeout(() => setError(null), 3000);
        return;
      }

      setMeritCount(data.dailyCount);
      setTotalMerit(data.total);
      setShowPlusOne(true);
      setTimeout(() => setShowPlusOne(false), 5000);
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
          Welcome to my personal page.Try click it!
        </p>
      </div>

      <div className="relative group cursor-pointer" onClick={handleFishClick}>
        <div className="w-80 h-80 bg-[#121212] rounded-[4rem] flex items-center justify-center relative shadow-2xl border border-white/5 overflow-hidden">
          <svg viewBox="0 0 200 200" className="w-full h-full p-6">
            {/* Wooden Fish Body */}
            <motion.g
              animate={isHitting ? { 
                scale: [1, 0.96, 1], 
                y: [0, 4, 0],
                filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
              } : {}}
              transition={{ duration: 0.15 }}
            >
              {/* Main Body Shape - Positioned lower to avoid top clipping */}
              <path 
                d="M35 155 
                   C25 145 25 125 35 115 
                   C45 105 55 75 110 75 
                   C165 75 175 110 175 135 
                   C175 160 165 175 110 175 
                   C85 175 65 185 35 155 Z" 
                fill="white" 
              />
              
              {/* Subtle shading */}
              <path 
                d="M35 155 C25 145 25 125 35 115" 
                fill="#e5e5e5" 
                opacity="0.3"
              />

              {/* The "Mouth" Cutout */}
              <g fill="#121212">
                <circle cx="135" cy="135" r="20" />
                <rect x="135" y="131" width="45" height="8" />
              </g>
            </motion.g>

            {/* The Mallet (Stick) */}
            {/* Idle: Higher up, clear distance */}
            {/* Click: Descends to just touch the top of the fish without overlapping */}
            <motion.g
              initial={{ rotate: -20, y: -15, x: -5 }}
              animate={isHitting ? { 
                rotate: [ -20, 5, -20 ],
                y: [ -15, 18, -15 ],
                x: [ -5, 0, -5 ]
              } : { rotate: -20, y: -15, x: -5 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              style={{ originX: "100px", originY: "30px" }}
            >
              {/* Mallet Handle */}
              <rect x="45" y="35" width="100" height="12" rx="6" fill="white" />
              {/* Mallet Head */}
              <circle cx="145" cy="41" r="22" fill="white" />
            </motion.g>
          </svg>

          {/* Hit ripple effect */}
          <AnimatePresence>
            {isHitting && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 0.15, scale: 1.6 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-white rounded-full blur-3xl pointer-events-none"
              />
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showPlusOne && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 1 }}
              animate={{ opacity: 1, y: -180, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 text-emerald-500 font-bold pointer-events-none z-20 drop-shadow-lg"
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
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium border border-red-100 whitespace-nowrap shadow-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Daily Merit Progress</span>
          <div className="flex gap-2">
            {[...Array(10)].map((_, i) => (
              <motion.div 
                key={i} 
                initial={false}
                animate={{ 
                  backgroundColor: i < meritCount ? "#10b981" : "#e5e5e5",
                  scale: i < meritCount ? [1, 1.2, 1] : 1
                }}
                className="w-3 h-3 rounded-full shadow-inner" 
              />
            ))}
          </div>
        </div>

        {totalMerit !== null && (
          <motion.div 
            layout
            className="bg-neutral-900 px-8 py-4 rounded-3xl shadow-xl flex flex-col items-center border border-white/10"
          >
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-neutral-500 mb-1">Global Merit Accumulation</span>
            <span className="text-3xl font-mono font-bold text-white tabular-nums">
              {totalMerit.toLocaleString()}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}


