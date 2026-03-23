import { motion } from 'motion/react';
import { translations, type Language } from '../../types';

export default function ThinkTool({ lang }: { lang: Language }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">{translations[lang].think}</h2>
        <p className="text-neutral-500">some useless easy</p>
      </div>
      <div className="bg-white p-12 rounded-[2rem] border border-black/5 shadow-xl flex items-center justify-center text-neutral-400">
        <p>Thinking...</p>
      </div>
    </motion.div>
  );
}
