import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  FileText, 
  FlaskConical, 
  Palette, 
  Mic, 
  MessageSquare, 
  Languages, 
  Mail, 
  Github, 
  Linkedin, 
  MessageCircle, 
  Menu,
  ChevronRight
} from 'lucide-react';
import { translations, type Language } from './types';
import { cn } from './lib/utils';
import HomePage from './pages/Home';
import ResumePage from './pages/Resume';
import LaboratoryPage from './pages/Laboratory';

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentPage, setCurrentPage] = useState<'home' | 'resume' | 'laboratory'>('home');
  const [subPage, setSubPage] = useState<'colors' | 'think' | 'search' | 'cook' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showWechatQR, setShowWechatQR] = useState(false);
  const sidebarTimer = useRef<NodeJS.Timeout | null>(null);

  const t = translations[lang];

  const handleSidebarHover = (isHovering: boolean) => {
    if (isHovering) {
      if (sidebarTimer.current) clearTimeout(sidebarTimer.current);
      setIsSidebarOpen(true);
    } else {
      sidebarTimer.current = setTimeout(() => {
        setIsSidebarOpen(false);
      }, 5000);
    }
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-black/5 z-50 flex flex-col">
        <div className="h-16 flex items-center justify-between px-6">
          {/* Left: Sidebar Toggle & Contact Me */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowContact(!showContact)}
                className="p-2 rounded-full hover:bg-neutral-100 transition-colors flex items-center gap-2"
                title={t.contactMe}
              >
                <Mail size={20} />
                <span className="text-sm font-medium hidden sm:block">{t.contactMe}</span>
              </button>
              <AnimatePresence>
                {showContact && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/5 p-2 overflow-hidden"
                  >
                    <a href="https://github.com/HshuanYoung" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors">
                      <Github size={18} /> <span>GitHub</span>
                    </a>
                    <div 
                      className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors cursor-pointer"
                      onClick={() => setShowWechatQR(true)}
                    >
                      <MessageCircle size={18} /> <span>WeChat</span>
                    </div>
                    <a href="mailto:masteryoung045@gmail.com" className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors">
                      <Mail size={18} /> <span>Email</span>
                    </a>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Center: Title */}
          <div className="absolute left-1/2 -translate-x-1/2 font-bold text-lg tracking-tight lowercase">
            {t[currentPage]}{subPage ? `.${t[subPage]}` : ''}
          </div>

          {/* Right: Language Switch */}
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleLang}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors flex items-center gap-2"
              title="Switch Language"
            >
              <Languages size={20} />
              <span className="text-sm font-medium uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <motion.nav 
        onMouseEnter={() => handleSidebarHover(true)}
        onMouseLeave={() => handleSidebarHover(false)}
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="fixed top-0 left-0 h-full w-72 bg-white/80 backdrop-blur-xl border-r border-black/5 z-40 p-8 flex flex-col gap-8 shadow-2xl"
      >
        <div className="mt-12 flex items-center gap-4">
          <img 
            src="/assets/logo.png" 
            alt="Logo" 
            className="w-10 h-10 rounded-xl object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "https://picsum.photos/seed/logo/100/100";
            }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">hsyoung.icu</h1>
            <p className="text-xs text-neutral-500 font-mono mt-1 uppercase tracking-widest">Personal Space</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SidebarItem 
            icon={<Home size={20} />} 
            label={t.home} 
            active={currentPage === 'home'} 
            onClick={() => { setCurrentPage('home'); setSubPage(null); }} 
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label={t.resume} 
            active={currentPage === 'resume'} 
            onClick={() => { setCurrentPage('resume'); setSubPage(null); }} 
          />
          <div className="flex flex-col gap-1">
            <SidebarItem 
              icon={<FlaskConical size={20} />} 
              label={t.laboratory} 
              active={currentPage === 'laboratory'} 
              onClick={() => { setCurrentPage('laboratory'); setSubPage(null); }} 
            />
            <AnimatePresence>
              {currentPage === 'laboratory' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-6 flex flex-col gap-1 overflow-hidden"
                >
                  <SubItem label={t.colors} active={subPage === 'colors'} onClick={() => setSubPage('colors')} />
                  <SubItem label={t.think} active={subPage === 'think'} onClick={() => setSubPage('think')} />
                  <SubItem label={t.search} active={subPage === 'search'} onClick={() => setSubPage('search')} />
                  <SubItem label={t.cook} active={subPage === 'cook'} onClick={() => setSubPage('cook')} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-auto text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
          © 2026 hsyoung.icu
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-500 min-h-screen px-8 pb-12",
        isSidebarOpen ? "pl-80" : "pl-8",
        currentPage === 'laboratory' ? "pt-32" : "pt-24"
      )}>
        <AnimatePresence mode="wait">
          {currentPage === 'home' && <HomePage key="home" lang={lang} />}
          {currentPage === 'resume' && <ResumePage key="resume" lang={lang} />}
          {currentPage === 'laboratory' && <LaboratoryPage key="laboratory" lang={lang} subPage={subPage} setSubPage={setSubPage} />}
        </AnimatePresence>
      </main>

      {/* WeChat QR Modal */}
      <AnimatePresence>
        {showWechatQR && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWechatQR(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-3xl shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <img src="/assets/icon/wechat.png" alt="WeChat QR Code" className="w-64 h-64 object-contain rounded-xl" />
              <button 
                onClick={() => setShowWechatQR(false)}
                className="mt-6 w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl font-medium transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-3 rounded-2xl transition-all w-full text-left group",
        active ? "bg-neutral-900 text-white shadow-lg" : "hover:bg-neutral-100 text-neutral-600"
      )}
    >
      <span className={cn("transition-transform group-hover:scale-110", active ? "text-emerald-400" : "text-neutral-400")}>{icon}</span>
      <span className="font-medium">{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto"><ChevronRight size={16} /></motion.div>}
    </button>
  );
}

function SubItem({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "p-2 rounded-xl text-sm transition-all text-left w-full",
        active ? "text-neutral-900 font-semibold bg-neutral-100" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
      )}
    >
      {label}
    </button>
  );
}
