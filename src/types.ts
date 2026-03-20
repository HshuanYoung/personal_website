export type Language = 'en' | 'zh';

export interface Translation {
  home: string;
  resume: string;
  tools: string;
  color: string;
  tts: string;
  aiChat: string;
  contactMe: string;
  merit: string;
  meritFull: string;
  download: string;
  downloadForm: {
    name: string;
    position: string;
    company: string;
    submit: string;
  };
  limits: string;
}

export const translations: Record<Language, Translation> = {
  en: {
    home: 'Home',
    resume: 'Resume',
    tools: 'Tools',
    color: 'Color Tool',
    tts: 'Text to Speech',
    aiChat: 'AI Chatbot',
    contactMe: 'Contact Me',
    merit: 'Merit +1',
    meritFull: 'Merit is full, come back tomorrow',
    download: 'Download PDF',
    downloadForm: {
      name: 'Name',
      position: 'Position',
      company: 'Company',
      submit: 'Download',
    },
    limits: 'Limit: 2 downloads/month per IP, 200 total/month.',
  },
  zh: {
    home: '首页',
    resume: '简历',
    tools: '工具',
    color: '颜色工具',
    tts: '语音合成',
    aiChat: 'AI 聊天',
    contactMe: '联系我',
    merit: '功德 +1',
    meritFull: '功德已满，明天再来',
    download: '下载 PDF',
    downloadForm: {
      name: '姓名',
      position: '职位',
      company: '公司',
      submit: '下载',
    },
    limits: '限制：每个 IP 每月 2 次，全站每月 200 次。',
  },
};
