import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  FileText, 
  FlaskConical, 
  Languages, 
  Mail, 
  Github, 
  MessageCircle, 
  Menu,
  ChevronRight
} from 'lucide-react';
import { translations, type Language } from './types';
import { cn } from './lib/utils';
import { assetUrl } from './lib/runtime';
import HomePage from './pages/Home';

const ResumePage = lazy(() => import('./pages/Resume'));
const LaboratoryPage = lazy(() => import('./pages/Laboratory'));

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [currentPage, setCurrentPage] = useState<'home' | 'resume' | 'laboratory'>('home');
  const [subPage, setSubPage] = useState<'colors' | 'think' | 'search' | 'cook' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showWechatQR, setShowWechatQR] = useState(false);
  const [wechatLoadFailed, setWechatLoadFailed] = useState(false);

  const t = translations[lang];

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }, [lang]);

  const handleNavClick = (page: 'home' | 'resume' | 'laboratory') => {
    setCurrentPage(page);
    setSubPage(null);
    setIsSidebarOpen(false);
  };

  const handleSubNavClick = (page: 'colors' | 'think' | 'search' | 'cook') => {
    setSubPage(page);
    setIsSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setShowContact(false);
    setIsSidebarOpen(prev => !prev);
  };

  const toggleContact = () => {
    setIsSidebarOpen(false);
    setShowContact(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Topbar */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-black/5 z-50 flex flex-col">
        <div className="h-16 flex items-center justify-between px-6">
          {/* Left: Sidebar Toggle & Contact Me */}
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
              aria-controls="site-navigation"
              aria-expanded={isSidebarOpen}
              aria-label={isSidebarOpen ? t.closeNavigation : t.openNavigation}
            >
              <Menu size={20} />
            </button>
            
            <div className="relative">
              <button 
                onClick={toggleContact}
                className="p-2 rounded-full hover:bg-neutral-100 transition-colors flex items-center gap-2"
                title={t.contactMe}
                aria-expanded={showContact}
                aria-haspopup="menu"
                aria-label={t.contactMe}
              >
                <Mail size={20} />
                <span className="text-sm font-medium hidden sm:block">{t.contactMe}</span>
              </button>
              <AnimatePresence>
                {showContact && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowContact(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      role="menu"
                      className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/5 p-2 overflow-hidden z-50"
                    >
                      <a href="https://github.com/HshuanYoung" target="_blank" rel="noreferrer" role="menuitem" className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors">
                        <Github size={18} /> <span>GitHub</span>
                      </a>
                      <button 
                        type="button"
                        role="menuitem"
                        className="flex w-full items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors text-left"
                        onClick={() => {
                          setShowContact(false);
                          setWechatLoadFailed(false);
                          setShowWechatQR(true);
                        }}
                      >
                        <MessageCircle size={18} /> <span>WeChat</span>
                      </button>
                      <a href="mailto:masteryoung045@gmail.com" role="menuitem" className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-colors">
                        <Mail size={18} /> <span>Email</span>
                      </a>
                    </motion.div>
                  </>
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
              title={t.switchLanguage}
              aria-label={t.switchLanguage}
            >
              <Languages size={20} />
              <span className="text-sm font-medium uppercase">{lang}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.nav 
        id="site-navigation"
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        aria-hidden={!isSidebarOpen}
        className={cn(
          "fixed top-0 left-0 h-full w-72 bg-white/90 backdrop-blur-xl border-r border-black/5 z-40 p-8 flex flex-col gap-8 shadow-2xl",
          !isSidebarOpen && "pointer-events-none"
        )}
      >
        <div className="mt-12 flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">hsyoung.com</h1>
            <p className="text-xs text-neutral-500 font-mono mt-1 uppercase tracking-widest">{t.personalSpace}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <SidebarItem 
            icon={<Home size={20} />} 
            label={t.home} 
            active={currentPage === 'home'} 
            onClick={() => handleNavClick('home')} 
            interactive={isSidebarOpen}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label={t.resume} 
            active={currentPage === 'resume'} 
            onClick={() => handleNavClick('resume')} 
            interactive={isSidebarOpen}
          />
          <div className="flex flex-col gap-1">
            <SidebarItem 
              icon={<FlaskConical size={20} />} 
              label={t.laboratory} 
              active={currentPage === 'laboratory'} 
              onClick={() => handleNavClick('laboratory')} 
              interactive={isSidebarOpen}
            />
            <AnimatePresence>
              {currentPage === 'laboratory' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="ml-6 flex flex-col gap-1 overflow-hidden"
                >
                  <SubItem label={t.colors} active={subPage === 'colors'} onClick={() => handleSubNavClick('colors')} interactive={isSidebarOpen} />
                  <SubItem label={t.think} active={subPage === 'think'} onClick={() => handleSubNavClick('think')} interactive={isSidebarOpen} />
                  <SubItem label={t.search} active={subPage === 'search'} onClick={() => handleSubNavClick('search')} interactive={isSidebarOpen} />
                  <SubItem label={t.cook} active={subPage === 'cook'} onClick={() => handleSubNavClick('cook')} interactive={isSidebarOpen} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-auto text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
          © 2026 hsyoung.com
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-500 min-h-screen px-4 sm:px-8 pb-12",
        currentPage === 'home' ? "pt-20" : currentPage === 'laboratory' ? "pt-32" : "pt-24"
      )}>
        <AnimatePresence mode="wait">
          {currentPage === 'home' && <HomePage key="home" lang={lang} />}
          {currentPage === 'resume' && (
            <Suspense fallback={<LoadingFallback label={t.loadingPage} />}>
              <ResumePage key="resume" lang={lang} />
            </Suspense>
          )}
          {currentPage === 'laboratory' && (
            <Suspense fallback={<LoadingFallback label={t.loadingPage} />}>
              <LaboratoryPage key="laboratory" lang={lang} subPage={subPage} setSubPage={setSubPage} />
            </Suspense>
          )}
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
              {wechatLoadFailed ? (
                <div className="flex h-64 w-64 items-center justify-center rounded-xl bg-neutral-100 p-6 text-center text-sm font-medium text-neutral-500">
                  {t.wechatUnavailable}
                </div>
              ) : (
                <img
                  src={assetUrl('/assets/icon/wechat.jpg')}
                  alt={t.wechatQrAlt}
                  className="w-64 h-64 object-contain rounded-xl"
                  onError={() => setWechatLoadFailed(true)}
                />
              )}
              <button 
                onClick={() => setShowWechatQR(false)}
                className="mt-6 w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 rounded-xl font-medium transition-colors"
                aria-label={t.close}
              >
                {t.close}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-sm font-medium text-neutral-500">
      {label}
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick, interactive }: { icon: ReactNode, label: string, active: boolean, onClick: () => void, interactive: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={!interactive}
      tabIndex={interactive ? 0 : -1}
      aria-current={active ? 'page' : undefined}
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

function SubItem({ label, active, onClick, interactive }: { label: string, active: boolean, onClick: () => void, interactive: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={!interactive}
      tabIndex={interactive ? 0 : -1}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "p-2 rounded-xl text-sm transition-all text-left w-full",
        active ? "text-neutral-900 font-semibold bg-neutral-100" : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
      )}
    >
      {label}
    </button>
  );
}
