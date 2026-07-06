import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, type Language } from '../../types';
import { X, FileText, FileType2, Mail } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { apiUrl, assetUrl } from '../../lib/runtime';

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Essay = {
  id: string;
  title: string;
  pdf?: string;
  txt?: string;
};

export default function ThinkTool({ lang }: { lang: Language }) {
  const t = translations[lang].tools.think;
  const [articles, setArticles] = useState<Essay[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Essay | null>(null);
  const [viewFormat, setViewFormat] = useState<'pdf' | 'txt'>('pdf');
  const [textContent, setTextContent] = useState<string>('');
  const [numPages, setNumPages] = useState<number>();

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  useEffect(() => {
    fetch(apiUrl('/api/essays'))
      .then(res => res.json())
      .then(data => {
        const grouped = data.essays.reduce((acc: Record<string, Essay>, curr: any) => {
          if (!acc[curr.title]) {
            acc[curr.title] = { id: curr.title, title: curr.title };
          }
          if (curr.format === 'pdf') acc[curr.title].pdf = curr.file;
          if (curr.format === 'txt') acc[curr.title].txt = curr.file;
          return acc;
        }, {});
        setArticles(Object.values(grouped));
      })
      .catch(err => console.error('Failed to load essays:', err));
  }, []);

  useEffect(() => {
    if (selectedArticle && viewFormat === 'txt' && selectedArticle.txt) {
      setTextContent(t.loadingText);
      fetch(assetUrl(selectedArticle.txt))
        .then(res => res.text())
        .then(text => setTextContent(text))
        .catch(() => setTextContent(t.failedText));
    }
  }, [selectedArticle, viewFormat, t.failedText, t.loadingText]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        {articles.map((article, index) => (
          <button
            key={article.id}
            onClick={() => {
              setSelectedArticle(article);
              setViewFormat(article.pdf ? 'pdf' : 'txt');
            }}
            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-black/5 shadow-sm hover:bg-green-200 transition-colors group w-full text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 font-bold text-sm group-hover:bg-green-300 group-hover:text-green-900 transition-colors">
                {index + 1}
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-green-900 transition-colors">{article.title}</h3>
            </div>
            <div className="flex gap-2">
              {article.pdf && (
                <span className="flex items-center gap-1.5 py-1.5 px-3 bg-neutral-100 text-neutral-600 rounded-lg font-medium text-xs group-hover:bg-white/60 transition-colors">
                  <FileType2 size={14} /> PDF
                </span>
              )}
              {article.txt && (
                <span className="flex items-center gap-1.5 py-1.5 px-3 bg-neutral-100 text-neutral-600 rounded-lg font-medium text-xs group-hover:bg-white/60 transition-colors">
                  <FileText size={14} /> TXT
                </span>
              )}
            </div>
          </button>
        ))}
        {articles.length === 0 && (
          <div className="p-8 text-center text-neutral-500 bg-white rounded-2xl border border-black/5">
            {t.noEssays}
          </div>
        )}
      </div>

      <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-center text-center">
        <p className="text-emerald-800 font-medium flex items-center justify-center flex-wrap gap-2 text-lg">
          {t.contactCta} <Mail size={20} className="text-emerald-600" />
        </p>
      </div>

      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl overflow-hidden flex flex-col relative shadow-2xl"
              onContextMenu={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            >
              <div className="flex items-center justify-between p-4 border-b border-black/5 bg-neutral-50">
                <div className="flex items-center gap-4 px-2">
                  <h3 className="font-bold text-lg">{selectedArticle.title}</h3>
                  <div className="flex bg-neutral-200/50 rounded-lg p-1">
                    {selectedArticle.pdf && (
                      <button
                        onClick={() => setViewFormat('pdf')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewFormat === 'pdf' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                      >
                        PDF
                      </button>
                    )}
                    {selectedArticle.txt && (
                      <button
                        onClick={() => setViewFormat('txt')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${viewFormat === 'txt' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
                      >
                        TXT
                      </button>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="p-2 rounded-full hover:bg-neutral-200 transition-colors"
                  aria-label={translations[lang].close}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 relative bg-neutral-100 overflow-hidden">
                {viewFormat === 'pdf' && selectedArticle.pdf ? (
                  <div className="w-full h-full overflow-y-auto bg-neutral-200/50 flex flex-col items-center p-4 sm:p-8">
                    <Document
                      file={assetUrl(selectedArticle.pdf)}
                      onLoadSuccess={onDocumentLoadSuccess}
                      className="flex flex-col gap-6"
                      loading={
                        <div className="flex items-center justify-center p-12 text-neutral-500 font-medium">
                          {t.loadingDocument}
                        </div>
                      }
                      error={
                        <div className="flex items-center justify-center p-12 text-red-500 font-medium">
                          {t.failedDocument}
                        </div>
                      }
                    >
                      {Array.from(new Array(numPages), (el, index) => (
                        <div key={`page_${index + 1}`} className="relative shadow-xl rounded-lg overflow-hidden bg-white">
                          {/* Transparent overlay to block any right-clicks on the canvas */}
                          <div className="absolute inset-0 z-10" onContextMenu={(e) => e.preventDefault()} />
                          <Page 
                            pageNumber={index + 1} 
                            renderTextLayer={false} // Prevents text selection
                            renderAnnotationLayer={false} // Prevents links/annotations
                            width={Math.min(window.innerWidth * 0.85, 900)} // Responsive width
                            className="pointer-events-none"
                          />
                        </div>
                      ))}
                    </Document>
                  </div>
                ) : (
                  <div 
                    className="w-full h-full overflow-y-auto p-8 bg-white select-none"
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  >
                    <pre 
                      className="whitespace-pre-wrap font-sans text-neutral-800 leading-relaxed max-w-3xl mx-auto text-lg"
                      style={{ pointerEvents: 'none' }}
                    >
                      {textContent}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
