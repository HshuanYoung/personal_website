import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Shield, Briefcase, Cpu, CheckCircle2, AlertCircle, X, User, Building2, ExternalLink } from 'lucide-react';
import { translations, type Language } from '../types';

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string[];
}

interface Project {
  title: string;
  description: string[];
  tags: string[];
}

interface ResumeData {
  experiences: Experience[];
  projects: Project[];
}

export default function Resume({ lang }: { lang: Language }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', position: '', company: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const t = translations[lang];

  useEffect(() => {
    fetch('/resume/resume_describe.json')
      .then(res => res.json())
      .then(data => {
        setResumeData(data[lang]);
      })
      .catch(err => console.error('Failed to load resume data:', err));
  }, [lang]);

  const experiences = resumeData?.experiences || [];
  const projects = resumeData?.projects || [];

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
      className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-16"
    >
      {/* Header Section */}
      <div className="flex flex-col gap-8 border-b border-black/5 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <Shield size={20} />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{lang === 'zh' ? '隐私保护预览' : 'Privacy Protected Preview'}</span>
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-6xl font-black tracking-tighter text-neutral-900">
                {lang === 'zh' ? '杨铭' : 'Yang Ming'}
              </h1>
              <p className="text-xl font-medium text-neutral-500">
                {lang === 'zh' ? '嵌入式开发工程师' : 'Embedded Systems Developer'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-black/5">
                {lang === 'zh' ? '5年经验' : '5 Years Exp'}
              </span>
              <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-black/5">
                {lang === 'zh' ? 'Linux 专家' : 'Linux Expert'}
              </span>
              <span className="px-3 py-1 bg-neutral-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-neutral-500 border border-black/5">
                {lang === 'zh' ? '全栈嵌入式' : 'Full-stack Embedded'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col gap-4 w-full md:w-auto">
            {/* Privacy Note with Green Background */}
            <div className="p-4 bg-emerald-500 text-white rounded-2xl flex flex-col gap-2 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center gap-2">
                <Shield size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{lang === 'zh' ? '隐私声明' : 'Privacy Note'}</span>
              </div>
              <p className="text-xs leading-relaxed font-medium">
                {lang === 'zh' 
                  ? '教育背景和基本联系信息已在预览中隐藏。如需查看完整简历，请点击下方按钮下载 PDF 版本。' 
                  : 'Educational background and basic contact information are hidden in this preview. To view the full resume, please download the PDF version.'}
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative bg-neutral-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-red-500/20"
            >
              <Download size={20} className="group-hover:animate-bounce" />
              <span>{lang === 'zh' ? '下载完整 PDF' : 'Download Full PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-16">
        {/* Work Experience Section */}
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-neutral-900 text-white rounded-2xl">
              <Briefcase size={24} />
            </div>
            <h2 className="text-3xl font-black tracking-tight">{lang === 'zh' ? '工作经历' : 'Work Experience'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {experiences.map((exp, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-8 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors">{exp.company}</h3>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-50 px-2 py-1 rounded-md border border-black/5">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-emerald-600 font-bold text-xs uppercase tracking-wider">{exp.role}</p>
                  </div>
                  <div className="bg-neutral-50/80 p-5 rounded-2xl border border-black/[0.03]">
                    <ul className="flex flex-col gap-3">
                      {exp.description.map((item, i) => (
                        <li key={i} className="text-neutral-600 text-sm leading-relaxed flex gap-3">
                          <span className="text-emerald-400 mt-1.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Projects Section */}
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-neutral-900 text-white rounded-2xl">
              <Cpu size={24} />
            </div>
            <h2 className="text-3xl font-black tracking-tight">{lang === 'zh' ? '主要项目' : 'Main Projects'}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 bg-white rounded-3xl border border-black/5 shadow-sm hover:shadow-xl transition-all group flex flex-col"
              >
                <div className="flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors">{project.title}</h3>
                    <ExternalLink size={16} className="text-neutral-300 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="bg-emerald-50/30 p-4 rounded-2xl border border-emerald-500/5 mt-auto text-center">
                    <ul className="flex flex-col gap-2">
                      {project.description.map((item, i) => (
                        <li key={i} className="text-neutral-500 text-xs leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
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
                    <h3 className="text-3xl font-black tracking-tight">{lang === 'zh' ? '下载简历' : 'Download Resume'}</h3>
                    <p className="text-neutral-500 text-sm">
                      {lang === 'zh' ? '请填写您的信息以继续下载。' : 'Please fill in your details to proceed with the download.'}
                    </p>
                  </div>

                  <form onSubmit={handleDownload} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <User size={12} />
                        {lang === 'zh' ? '您的姓名' : 'Your Name'}
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder={lang === 'zh' ? '例如：张三' : 'e.g. Jane Smith'}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <Briefcase size={12} />
                        {lang === 'zh' ? '您的职位' : 'Your Position'}
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.position}
                        onChange={e => setFormData({ ...formData, position: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder={lang === 'zh' ? '例如：HR 经理' : 'e.g. HR Manager'}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                        <Building2 size={12} />
                        {lang === 'zh' ? '公司名称' : 'Company'}
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.company}
                        onChange={e => setFormData({ ...formData, company: e.target.value })}
                        className="w-full p-4 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        placeholder={lang === 'zh' ? '例如：谷歌' : 'e.g. Google'}
                      />
                    </div>

                    <div className="bg-emerald-50 p-4 rounded-2xl flex flex-col gap-2 border border-emerald-100 mt-2">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                        <AlertCircle size={14} />
                        {lang === 'zh' ? '下载限制' : 'Download Limits'}
                      </div>
                      <p className="text-[11px] text-emerald-600 leading-relaxed">
                        {lang === 'zh' 
                          ? '每个 IP 每月最多下载 2 次。全站每月限制 200 次。' 
                          : 'Each IP can download a maximum of 2 times per month. Total site limit: 200 downloads/month.'}
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
                          <span>{lang === 'zh' ? '请求下载' : 'Request Download'}</span>
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
                          <span>{lang === 'zh' ? '下载已开始！' : 'Download Started!'}</span>
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
