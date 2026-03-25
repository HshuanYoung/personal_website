import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Language } from '../../types';
import { Search, Sparkles, X, ChefHat } from 'lucide-react';
import Markdown from 'react-markdown';

type Recipe = {
  title: string;
  content: string;
};

export default function CookTool({ lang }: { lang: Language }) {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const res = await fetch(`/api/cook/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed');
        setRecipes([]);
      } else {
        setRecipes(data.recipes || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRandomIdea = async () => {
    setLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const res = await fetch('/api/cook/random');
      const data = await res.json();
      setRecipes(data.recipes || []);
    } catch (err) {
      console.error('Random idea failed:', err);
      setError('Failed to fetch random recipe');
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      {/* Search Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 text-emerald-800">
          <ChefHat size={28} />
          <h2 className="text-2xl font-bold">Cookbook</h2>
        </div>
        
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a recipe (e.g., potato)..."
              className="w-full pl-12 pr-4 py-4 bg-neutral-100 border-transparent focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-2xl transition-all outline-none text-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold rounded-2xl transition-colors whitespace-nowrap"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleRandomIdea}
              disabled={loading}
              className="px-6 py-4 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 text-emerald-800 font-bold rounded-2xl transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Sparkles size={20} />
              <span>Idea</span>
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="p-12 text-center text-emerald-600 bg-white rounded-3xl border border-black/5 shadow-sm flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              <p className="font-medium animate-pulse">Cooking up results... (AI might take a moment)</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 bg-red-50 rounded-3xl border border-red-100 shadow-sm">
              {error}
            </div>
          ) : recipes.length > 0 ? (
            recipes.map((recipe, index) => (
              <button
                key={index}
                onClick={() => setSelectedRecipe(recipe)}
                className="flex items-center justify-between p-6 bg-white rounded-2xl border border-black/5 shadow-sm hover:bg-emerald-700 hover:text-white transition-all group w-full text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-white transition-colors capitalize">
                    {recipe.title}
                  </h3>
                </div>
                <span className="text-emerald-600 font-medium group-hover:text-emerald-200 transition-colors">
                  View Recipe &rarr;
                </span>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-neutral-500 bg-white rounded-3xl border border-black/5 shadow-sm">
              No recipes found. Try another search!
            </div>
          )}
        </div>
      )}

      {/* Recipe Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-black/5 bg-emerald-50">
                <h3 className="font-bold text-2xl text-emerald-900 capitalize flex items-center gap-3">
                  <ChefHat className="text-emerald-600" />
                  {selectedRecipe.title}
                </h3>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-2 rounded-full hover:bg-emerald-200 text-emerald-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <div className="prose prose-emerald prose-lg max-w-none prose-img:rounded-2xl prose-img:shadow-md prose-headings:text-emerald-900 prose-a:text-emerald-600">
                  <Markdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {selectedRecipe.content}
                  </Markdown>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
