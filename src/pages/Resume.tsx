import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { translations, type Language } from '../types';

export default function Resume({ lang }: { lang: Language }) {
  const [formData, setFormData] = useState({ name: '', position: '', company: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const t = translations[lang];

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/download-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', text.substring(0, 100));
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Download failed');
      }

      setStatus('success');
      // Trigger actual file download (mock)
      const blob = new Blob(['Placeholder Resume Content'], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Resume_${formData.name}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
            <FileText size={32} />
          </div>
          <h2 className="text-4xl font-bold tracking-tight">{t.resume}</h2>
          <p className="text-neutral-500">
            I am a passionate software engineer with experience in full-stack development. 
            Download my full resume for more details.
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col gap-4">
          <h3 className="font-semibold text-lg">Download Limits</h3>
          <p className="text-sm text-neutral-500">{t.limits}</p>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Monthly Reset</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Download size={120} />
        </div>

        <form onSubmit={handleDownload} className="flex flex-col gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">{t.downloadForm.name}</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder="John Doe"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">{t.downloadForm.position}</label>
            <input
              required
              type="text"
              value={formData.position}
              onChange={e => setFormData({ ...formData, position: e.target.value })}
              className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder="Hiring Manager"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-700">{t.downloadForm.company}</label>
            <input
              required
              type="text"
              value={formData.company}
              onChange={e => setFormData({ ...formData, company: e.target.value })}
              className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
              placeholder="Tech Corp"
            />
          </div>

          <button
            disabled={status === 'loading'}
            type="submit"
            className="w-full bg-neutral-900 text-white p-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {status === 'loading' ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Download size={20} />
                <span>{t.downloadForm.submit}</span>
              </>
            )}
          </button>

          <AnimatePresence>
            {status === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-emerald-600 justify-center text-sm font-medium"
              >
                <CheckCircle2 size={16} />
                <span>Download Successful!</span>
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-red-600 justify-center text-sm font-medium"
              >
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </motion.div>
  );
}
