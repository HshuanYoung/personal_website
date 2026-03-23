import { motion } from 'motion/react';
import { type Language } from '../../types';

export default function CookTool({ lang }: { lang: Language }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      <div className="bg-white p-12 rounded-[2rem] border border-black/5 shadow-xl flex items-center justify-center text-neutral-400">
        <p>Cooking functionality coming soon.</p>
      </div>
    </motion.div>
  );
}
