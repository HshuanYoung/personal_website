import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Lightbulb, Search, ChefHat, Copy, Check } from 'lucide-react';
import { translations, type Language } from '../types';
import { cn } from '../lib/utils';
import Colors from './laboratory/Colors';
import ThinkTool from './laboratory/Think';
import SearchTool from './laboratory/Search';
import CookTool from './laboratory/Cook';

type SubPage = 'colors' | 'think' | 'search' | 'cook' | null;

export default function Laboratory({ lang, subPage, setSubPage }: { lang: Language, subPage: SubPage, setSubPage: (page: SubPage) => void }) {
  const t = translations[lang];

  if (!subPage) {
    const cards = [
      {
        id: 'colors' as const,
        title: t.colors,
        description: 'choose color, convert color',
        icon: <Palette size={32} />,
        color: 'text-pink-500',
        bg: 'bg-pink-500/10',
        hoverBorder: 'hover:border-pink-500/50',
      },
      {
        id: 'think' as const,
        title: t.think,
        description: 'some useless easy',
        icon: <Lightbulb size={32} />,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10',
        hoverBorder: 'hover:border-amber-500/50',
      },
      {
        id: 'search' as const,
        title: t.search,
        description: 'find PDFs, TXTs',
        icon: <Search size={32} />,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        hoverBorder: 'hover:border-blue-500/50',
      },
      {
        id: 'cook' as const,
        title: t.cook,
        description: 'cook in my way',
        icon: <ChefHat size={32} />,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        hoverBorder: 'hover:border-emerald-500/50',
      },
    ];

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[70vh] gap-12"
      >
        <div className="text-center flex flex-col gap-4">
          <h2 className="text-5xl font-black tracking-tighter text-neutral-900">{t.laboratory}</h2>
          <p className="text-xl text-neutral-500 font-medium">Select an experiment to begin.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          {cards.map((card, idx) => (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSubPage(card.id)}
              className={cn(
                "group flex flex-col items-start text-left p-8 rounded-[2rem] bg-white border-2 border-transparent shadow-lg hover:shadow-2xl transition-all duration-300",
                card.hoverBorder
              )}
            >
              <div className={cn("p-4 rounded-2xl mb-6 transition-transform group-hover:scale-110 duration-300", card.bg, card.color)}>
                {card.icon}
              </div>
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">{card.title}</h3>
              <p className="text-neutral-500 font-medium">{card.description}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {subPage === 'colors' && <Colors lang={lang} />}
      {subPage === 'think' && <ThinkTool lang={lang} />}
      {subPage === 'search' && <SearchTool lang={lang} />}
      {subPage === 'cook' && <CookTool lang={lang} />}
    </div>
  );
}


