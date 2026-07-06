export type Language = 'en' | 'zh';

export interface Translation {
  home: string;
  resume: string;
  laboratory: string;
  colors: string;
  think: string;
  search: string;
  cook: string;
  contactMe: string;
  personalSpace: string;
  openNavigation: string;
  closeNavigation: string;
  switchLanguage: string;
  close: string;
  wechatQrAlt: string;
  wechatUnavailable: string;
  loadingPage: string;
  homeIntro: string;
  woodenFishAria: string;
  meritProgress: string;
  merit: string;
  meritFull: string;
  totalCount: string;
  points: string;
  download: string;
  downloadFull: string;
  privacyPreview: string;
  privacyNoteTitle: string;
  privacyNote: string;
  resumeName: string;
  resumeRole: string;
  resumeStats: string[];
  workExperience: string;
  mainProjects: string;
  resumePreviewUnavailableTitle: string;
  resumePreviewUnavailableBody: string;
  previewHiddenDetails: string;
  downloadResumeTitle: string;
  downloadResumeHelp: string;
  downloadLimitTitle: string;
  downloadLimitBody: string;
  requestDownload: string;
  downloadStarted: string;
  downloadFailed: string;
  downloadForm: {
    name: string;
    nameLabel: string;
    namePlaceholder: string;
    position: string;
    positionLabel: string;
    positionPlaceholder: string;
    company: string;
    companyLabel: string;
    companyPlaceholder: string;
    submit: string;
  };
  limits: string;
  laboratoryIntro: string;
  laboratoryCards: Record<'colors' | 'think' | 'search' | 'cook', string>;
  tools: {
    colors: {
      random: string;
    };
    think: {
      noEssays: string;
      contactCta: string;
      loadingText: string;
      failedText: string;
      loadingDocument: string;
      failedDocument: string;
    };
    search: {
      title: string;
      note: string;
      placeholder: string;
      submit: string;
      loading: string;
      failed: string;
      noResults: string;
      viewInfo: string;
    };
    cook: {
      title: string;
      placeholder: string;
      submit: string;
      idea: string;
      loading: string;
      failed: string;
      failedRandom: string;
      noResults: string;
      viewRecipe: string;
    };
  };
}

export const translations: Record<Language, Translation> = {
  en: {
    home: 'Home',
    resume: 'Resume',
    laboratory: 'Laboratory',
    colors: 'Colors',
    think: 'Think',
    search: 'Search',
    cook: 'Cook',
    contactMe: 'Contact Me',
    personalSpace: 'Personal Space',
    openNavigation: 'Open navigation',
    closeNavigation: 'Close navigation',
    switchLanguage: 'Switch language',
    close: 'Close',
    wechatQrAlt: 'WeChat QR code',
    wechatUnavailable: 'WeChat QR is unavailable in this environment.',
    loadingPage: 'Loading page...',
    homeIntro: "Yang Ming's personal lab for embedded systems, practical tools, and small thoughtful experiments. Tap the wooden fish for a little luck.",
    woodenFishAria: 'Tap the wooden fish to add one merit point',
    meritProgress: 'Daily Merit Progress',
    merit: 'Merit +1',
    meritFull: 'Merit is full, come back tomorrow',
    totalCount: 'Total count:',
    points: 'pts',
    download: 'Download PDF',
    downloadFull: 'Download Full PDF',
    privacyPreview: 'Privacy Protected Preview',
    privacyNoteTitle: 'Privacy Note',
    privacyNote: 'Educational background and basic contact information are hidden in this preview. To view the full resume, please download the PDF version.',
    resumeName: 'Yang Ming',
    resumeRole: 'Embedded Software Engineer',
    resumeStats: ['6 Years Exp', 'T5L & Linux', 'OTA & Tooling'],
    workExperience: 'Work Experience',
    mainProjects: 'Main Projects',
    resumePreviewUnavailableTitle: 'Resume preview unavailable',
    resumePreviewUnavailableBody: 'The resume data asset is not available in this environment. The production site can still serve it when /assets/resume/resume_describe.json is deployed.',
    previewHiddenDetails: 'Some details are hidden in this public preview. Download the full PDF to view more.',
    downloadResumeTitle: 'Download Resume',
    downloadResumeHelp: 'Please fill in your details to proceed with the download.',
    downloadLimitTitle: 'Download Limits',
    downloadLimitBody: 'Each IP can download a maximum of 2 times per month. Total site limit: 200 downloads/month.',
    requestDownload: 'Request Download',
    downloadStarted: 'Download Started!',
    downloadFailed: 'Download failed. Please try again later.',
    downloadForm: {
      name: 'Name',
      nameLabel: 'Your Name',
      namePlaceholder: 'e.g. Jane Smith',
      position: 'Position',
      positionLabel: 'Your Position',
      positionPlaceholder: 'e.g. HR Manager',
      company: 'Company',
      companyLabel: 'Company',
      companyPlaceholder: 'e.g. Google',
      submit: 'Download',
    },
    limits: 'Limit: 2 downloads/month per IP, 200 total/month.',
    laboratoryIntro: 'Select an experiment to begin.',
    laboratoryCards: {
      colors: 'Choose, convert, and compare color values.',
      think: 'Read notes, essays, and saved thoughts.',
      search: 'Query drug information from the local knowledge base.',
      cook: 'Find recipes and generate cooking ideas.',
    },
    tools: {
      colors: {
        random: 'Random color',
      },
      think: {
        noEssays: 'No essays found.',
        contactCta: 'Do you want to say something? Click Contact Me to learn more.',
        loadingText: 'Loading text...',
        failedText: 'Failed to load text content.',
        loadingDocument: 'Loading secure document...',
        failedDocument: 'Failed to load document.',
      },
      search: {
        title: 'Drug Information Search',
        note: 'Note: Each IP can only make 3 incorrect inputs per day.',
        placeholder: 'Search for a drug name...',
        submit: 'Search',
        loading: 'Searching drug info... AI might take a moment.',
        failed: 'Search failed',
        noResults: 'No results found. Try another search.',
        viewInfo: 'View Info',
      },
      cook: {
        title: 'Cookbook',
        placeholder: 'Search for a recipe, such as potato...',
        submit: 'Search',
        idea: 'Idea',
        loading: 'Cooking up results... AI might take a moment.',
        failed: 'Search failed',
        failedRandom: 'Failed to fetch random recipe',
        noResults: 'No recipes found. Try another search.',
        viewRecipe: 'View Recipe',
      },
    },
  },
  zh: {
    home: '首页',
    resume: '简历',
    laboratory: '实验室',
    colors: '颜色',
    think: '思考',
    search: '搜索',
    cook: '烹饪',
    contactMe: '联系我',
    personalSpace: '个人空间',
    openNavigation: '打开导航',
    closeNavigation: '关闭导航',
    switchLanguage: '切换语言',
    close: '关闭',
    wechatQrAlt: '微信二维码',
    wechatUnavailable: '当前环境无法加载微信二维码。',
    loadingPage: '页面加载中...',
    homeIntro: '杨铭的个人实验室：嵌入式系统、实用工具和一些认真打磨的小实验。敲一下木鱼，攒一点好运。',
    woodenFishAria: '敲击木鱼，增加一点功德',
    meritProgress: '今日功德进度',
    merit: '功德 +1',
    meritFull: '功德已满，明天再来',
    totalCount: '总功德：',
    points: '点',
    download: '下载 PDF',
    downloadFull: '下载完整 PDF',
    privacyPreview: '隐私保护预览',
    privacyNoteTitle: '隐私声明',
    privacyNote: '教育背景和基本联系信息已在预览中隐藏。如需查看完整简历，请下载 PDF 版本。',
    resumeName: '杨铭',
    resumeRole: '嵌入式软件工程师',
    resumeStats: ['6年经验', 'T5L & Linux', 'OTA & 工具化'],
    workExperience: '工作经历',
    mainProjects: '主要项目',
    resumePreviewUnavailableTitle: '简历预览暂不可用',
    resumePreviewUnavailableBody: '当前环境未提供简历数据资源。生产环境部署 /assets/resume/resume_describe.json 后会正常展示。',
    previewHiddenDetails: '公开预览已隐藏部分细节。如需查看完整内容，请下载 PDF 简历。',
    downloadResumeTitle: '下载简历',
    downloadResumeHelp: '请填写您的信息以继续下载。',
    downloadLimitTitle: '下载限制',
    downloadLimitBody: '每个 IP 每月最多下载 2 次。全站每月限制 200 次。',
    requestDownload: '请求下载',
    downloadStarted: '下载已开始！',
    downloadFailed: '下载失败，请稍后再试。',
    downloadForm: {
      name: '姓名',
      nameLabel: '您的姓名',
      namePlaceholder: '例如：张三',
      position: '职位',
      positionLabel: '您的职位',
      positionPlaceholder: '例如：HR 经理',
      company: '公司',
      companyLabel: '公司名称',
      companyPlaceholder: '例如：谷歌',
      submit: '下载',
    },
    limits: '限制：每个 IP 每月 2 次，全站每月 200 次。',
    laboratoryIntro: '选择一个实验开始。',
    laboratoryCards: {
      colors: '选择、转换和对比颜色数值。',
      think: '阅读笔记、文章和保存下来的想法。',
      search: '查询本地知识库中的药品信息。',
      cook: '查找菜谱，也可以生成一点做饭灵感。',
    },
    tools: {
      colors: {
        random: '随机颜色',
      },
      think: {
        noEssays: '暂无文章。',
        contactCta: '想说点什么？点击联系我了解更多。',
        loadingText: '正文加载中...',
        failedText: '正文加载失败。',
        loadingDocument: '安全文档加载中...',
        failedDocument: '文档加载失败。',
      },
      search: {
        title: '药品信息搜索',
        note: '提示：每个 IP 每天最多允许 3 次错误输入。',
        placeholder: '搜索药品名称...',
        submit: '搜索',
        loading: '正在搜索药品信息，AI 可能需要一点时间。',
        failed: '搜索失败',
        noResults: '没有找到结果，请换个关键词试试。',
        viewInfo: '查看信息',
      },
      cook: {
        title: '烹饪手册',
        placeholder: '搜索菜谱，例如：土豆...',
        submit: '搜索',
        idea: '灵感',
        loading: '正在整理结果，AI 可能需要一点时间。',
        failed: '搜索失败',
        failedRandom: '随机菜谱获取失败',
        noResults: '没有找到菜谱，请换个关键词试试。',
        viewRecipe: '查看菜谱',
      },
    },
  },
};
