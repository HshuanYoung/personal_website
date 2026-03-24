import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { type Language } from '../../types';
import { Search, X, Pill } from 'lucide-react';
import Markdown from 'react-markdown';

type DrugResult = {
  title: string;
  content: string;
};

export default function SearchTool({ lang }: { lang: Language }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DrugResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<DrugResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setError(null);
    try {
      const res = await fetch(`/api/drug/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Search failed');
        setResults([]);
      } else {
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
      setError('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      {/* Search Section */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 text-blue-800">
          <Pill size={28} />
          <h2 className="text-2xl font-bold">Drug Information Search</h2>
        </div>
        
        <p className="text-neutral-500 text-sm">
          Note: Each IP can only make 3 incorrect inputs per day.
        </p>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for a drug name..."
              className="w-full pl-12 pr-4 py-4 bg-neutral-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-2xl transition-all outline-none text-lg"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold rounded-2xl transition-colors whitespace-nowrap"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {hasSearched && (
        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="p-12 text-center text-blue-600 bg-white rounded-3xl border border-black/5 shadow-sm flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="font-medium animate-pulse">Searching drug info... (AI might take a moment)</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500 bg-red-50 rounded-3xl border border-red-100 shadow-sm">
              {error}
            </div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <button
                key={index}
                onClick={() => setSelectedResult(result)}
                className="flex items-center justify-between p-6 bg-white rounded-2xl border border-black/5 shadow-sm hover:bg-blue-700 hover:text-white transition-all group w-full text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 group-hover:text-white transition-colors capitalize">
                    {result.title}
                  </h3>
                </div>
                <span className="text-blue-600 font-medium group-hover:text-blue-200 transition-colors">
                  View Info &rarr;
                </span>
              </button>
            ))
          ) : (
            <div className="p-12 text-center text-neutral-500 bg-white rounded-3xl border border-black/5 shadow-sm">
              No results found. Try another search!
            </div>
          )}
        </div>
      )}

      {/* Result Modal */}
      <AnimatePresence>
        {selectedResult && (
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
              <div className="flex items-center justify-between p-6 border-b border-black/5 bg-blue-50">
                <h3 className="font-bold text-2xl text-blue-900 capitalize flex items-center gap-3">
                  <Pill className="text-blue-600" />
                  {selectedResult.title}
                </h3>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="p-2 rounded-full hover:bg-blue-200 text-blue-800 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <div className="prose prose-blue prose-lg max-w-none prose-img:rounded-2xl prose-img:shadow-md prose-headings:text-blue-900 prose-a:text-blue-600">
                  <Markdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a {...props} target="_blank" rel="noopener noreferrer" />
                      ),
                    }}
                  >
                    {selectedResult.content}
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
