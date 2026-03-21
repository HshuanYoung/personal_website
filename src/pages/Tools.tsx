import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Mic, MessageSquare, Send, Copy, Check, Play, Square } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { translations, type Language } from '../types';
import { cn } from '../lib/utils';

export default function Tools({ lang, subPage }: { lang: Language, subPage: 'color' | 'tts' | 'ai' | null }) {
  const t = translations[lang];

  if (!subPage) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center h-[60vh] gap-4"
      >
        <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center text-neutral-400">
          <Wrench size={32} />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900">{t.tools}</h2>
        <p className="text-neutral-500">Select a tool from the sidebar to get started.</p>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {subPage === 'color' && <ColorTool lang={lang} />}
      {subPage === 'tts' && <TTSTool lang={lang} />}
      {subPage === 'ai' && <AIChatTool lang={lang} />}
    </div>
  );
}

function ColorTool({ lang }: { lang: Language }) {
  const [color, setColor] = useState('#10b981');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(color);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Color Tool</h2>
        <p className="text-neutral-500">Pick a color and copy its hex code.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div 
          className="h-64 rounded-[2rem] shadow-2xl transition-all duration-500 flex items-center justify-center"
          style={{ backgroundColor: color }}
        >
          <span className="text-white font-mono text-2xl font-bold drop-shadow-md">{color}</span>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-xl flex flex-col gap-6">
          <input 
            type="color" 
            value={color} 
            onChange={e => setColor(e.target.value)}
            className="w-full h-16 rounded-xl cursor-pointer bg-transparent border-none outline-none"
          />
          <button 
            onClick={copyToClipboard}
            className="w-full bg-neutral-900 text-white p-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-3"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span>{copied ? 'Copied!' : 'Copy Hex Code'}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function TTSTool({ lang }: { lang: Language }) {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synth = window.speechSynthesis;

  const handleSpeak = () => {
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-US' : 'zh-CN';
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synth.speak(utterance);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Text to Speech</h2>
        <p className="text-neutral-500">Convert your text into spoken words.</p>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-xl flex flex-col gap-6">
        <textarea 
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full h-48 p-6 rounded-2xl bg-neutral-50 border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none"
        />
        <button 
          onClick={handleSpeak}
          className="w-full bg-neutral-900 text-white p-4 rounded-2xl font-bold hover:bg-neutral-800 transition-all flex items-center justify-center gap-3"
        >
          {isSpeaking ? <Square size={20} /> : <Play size={20} />}
          <span>{isSpeaking ? 'Stop Speaking' : 'Start Speaking'}</span>
        </button>
      </div>
    </motion.div>
  );
}

function AIChatTool({ lang }: { lang: Language }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [...messages, { role: 'user', text: userMsg }].map(m => ({
          role: m.role === 'ai' ? 'model' : 'user',
          parts: [{ text: m.text }]
        }))
      });

      const response = await model;
      const aiText = response.text || 'No response';
      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I encountered an error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-[75vh] gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">AI Chatbot</h2>
        <p className="text-neutral-500">Chat with an AI assistant powered by Gemini.</p>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] border border-black/5 shadow-xl flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-neutral-400 gap-4 opacity-50">
              <MessageSquare size={48} />
              <p>Start a conversation...</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={cn(
              "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
              m.role === 'user' ? "bg-neutral-900 text-white self-end rounded-br-none" : "bg-neutral-100 text-neutral-800 self-start rounded-bl-none"
            )}>
              <ReactMarkdown>{m.text}</ReactMarkdown>
            </div>
          ))}
          {isLoading && (
            <div className="bg-neutral-100 text-neutral-800 self-start p-4 rounded-2xl rounded-bl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex gap-2">
          <input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 p-4 rounded-xl bg-white border border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading}
            className="bg-neutral-900 text-white p-4 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function Wrench(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}


