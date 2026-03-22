import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileText, CheckCircle2, AlertCircle, X, Shield, User, Briefcase, Building2 } from 'lucide-react';
import { translations, type Language } from '../types';

export default function Resume({ lang }: { lang: Language }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Download failed');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_yangming.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setIsModalOpen(false);
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-12"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-black/5 pb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Shield size={20} />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Privacy Protected Preview</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter">My Resume</h1>
          <p className="text-neutral-500 max-w-md">
            Preview my professional background. Personal contact details are hidden for security.
          </p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="group relative bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-emerald-500/20"
        >
          <Download size={20} className="group-hover:bounce" />
          <span>Download Full PDF</span>
        </button>
      </div>

      {/* Resume Preview Area */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-black/5 overflow-hidden min-h-[800px] flex flex-col">
        {/* Redacted Overlay for Personal Info */}
        <div className="p-12 md:p-20 flex flex-col gap-16">
          {/* Header Redaction */}
          <div className="flex flex-col gap-6">
            <div className="h-12 w-64 bg-neutral-100 rounded-lg animate-pulse" />
            <div className="flex flex-wrap gap-4">
              <div className="h-6 w-32 bg-neutral-50 rounded-md border border-black/5 flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-mono text-neutral-400">REDACTED</span>
              </div>
              <div className="h-6 w-40 bg-neutral-50 rounded-md border border-black/5 flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-mono text-neutral-400">HIDDEN INFO</span>
              </div>
              <div className="h-6 w-24 bg-neutral-50 rounded-md border border-black/5 flex items-center px-3 gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-[10px] font-mono text-neutral-400">PRIVATE</span>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-l-4 border-emerald-500 pl-4">Professional Summary</h3>
            <div className="flex flex-col gap-3">
              <div className="h-4 w-full bg-neutral-50 rounded" />
              <div className="h-4 w-[95%] bg-neutral-50 rounded" />
              <div className="h-4 w-[98%] bg-neutral-50 rounded" />
              <div className="h-4 w-[60%] bg-neutral-50 rounded" />
            </div>
          </div>

          {/* Experience Section */}
          <div className="flex flex-col gap-10">
            <h3 className="text-xl font-bold border-l-4 border-emerald-500 pl-4">Work Experience</h3>
            
            {[1, 2].map((i) => (
              <div key={i} className="flex flex-col gap-4 pl-4 border-l border-neutral-100">
                <div className="flex justify-between items-start">
                  <div className="h-6 w-48 bg-neutral-100 rounded" />
                  <div className="h-4 w-32 bg-neutral-50 rounded" />
                </div>
                <div className="h-4 w-32 bg-neutral-50 rounded mb-2" />
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-full bg-neutral-50/50 rounded" />
                  <div className="h-3 w-[90%] bg-neutral-50/50 rounded" />
                  <div className="h-3 w-[95%] bg-neutral-50/50 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Education Section */}
          <div className="flex flex-col gap-6">
            <h3 className="text-xl font-bold border-l-4 border-emerald-500 pl-4">Education</h3>
            <div className="flex flex-col gap-4 pl-4 border-l border-neutral-100">
              <div className="h-6 w-64 bg-neutral-100 rounded" />
              <div className="h-4 w-48 bg-neutral-50 rounded" />
            </div>
          </div>
        </div>

        {/* Bottom Fade & CTA */}
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white via-white/90 to-transparent flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center px-6">
            <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mb-2">
              <Shield size={32} />
            </div>
            <h4 className="text-xl font-bold">Full Resume Locked</h4>
            <p className="text-sm text-neutral-500 max-w-xs">
              To protect my privacy, please provide your details to download the full unredacted PDF.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
            >
              <Download size={18} />
              <span>Unlock & Download</span>
            </button>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-2">
                    <h3 className="text-3xl font-black tracking-tight">Download Resume</h3>
                    <p className="text-neutral-500 text-sm">
                      Please fill in your details to proceed with the download.
                    </p>
                  </div>

                  <form onSubmit={handleDownload} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <User size={12} />
                        Your Name
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder="e.g. Jane Smith"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <Briefcase size={12} />
                        Your Position
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.position}
                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder="e.g. HR Manager"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <Building2 size={12} />
                        Company
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder="e.g. Google"
                      />
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl flex flex-col gap-2 border border-emerald-100 mt-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle size={14} />
                        Download Limits
                      </div>
                      <p className="text-[11px] text-emerald-600 leading-relaxed">
                        Each IP can download a maximum of 2 times per month. 
                        Total site limit: 200 downloads/month.
                      </p>
                    </div>

                    <button
                      disabled={status === 'loading'}
                      type="submit"
                      className="w-full bg-neutral-900 text-white p-5 rounded-2xl font-bold hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4 shadow-xl"
                    >
                      {status === 'loading' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Download size={20} />
                          <span>Request Download</span>
                        </>
                      )}
                    </button>

                    <AnimatePresence>
                      {status === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-emerald-600 justify-center text-sm font-bold"
                        >
                          <CheckCircle2 size={16} />
                          <span>Download Started!</span>
                        </motion.div>
                      )}
                      {status === 'error' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 text-red-600 justify-center text-sm font-bold"
                        >
                          <AlertCircle size={16} />
                          <span>{errorMessage}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
