import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email Transporter - Lazy initialization
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT || '587');

    if (user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });
    }
  }
  return transporter;
}

// MariaDB Pool - Lazy initialization
let pool: mysql.Pool | null = null;

async function getDbPool() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hsyoung_icu',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    try {
      pool = mysql.createPool(config);
      // Test connection
      const connection = await pool.getConnection();
      console.log('Connected to MariaDB successfully');
      
      // Initialize tables
      await connection.query(`
        CREATE TABLE IF NOT EXISTS merit_stats (
          id INT PRIMARY KEY DEFAULT 1,
          total_points BIGINT DEFAULT 0
        )
      `);
      
      await connection.query(`
        INSERT IGNORE INTO merit_stats (id, total_points) VALUES (1, 0)
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS merit_clicks (
          ip VARCHAR(45),
          click_date DATE,
          click_count INT DEFAULT 0,
          PRIMARY KEY (ip, click_date)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS download_stats (
          ip VARCHAR(45),
          month_year VARCHAR(7),
          count INT DEFAULT 0,
          PRIMARY KEY (ip, month_year)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS global_download_stats (
          month_year VARCHAR(7) PRIMARY KEY,
          total_count INT DEFAULT 0
        )
      `);

      connection.release();
    } catch (err) {
      console.error('Failed to connect to MariaDB:', err);
      // Fallback to in-memory for preview if DB is not configured
      console.warn('Falling back to in-memory storage for preview mode');
      return null;
    }
  }
  return pool;
}

// In-memory fallback for preview
const memoryStats = {
  meritTotal: 0,
  meritClicksCounts: {} as Record<string, number>,
  downloadIpCounts: {} as Record<string, number>,
  downloadTotal: 0,
  lastResetMonth: new Date().getMonth()
};

async function startServer() {
  console.log('Starting Express server with Vite middleware...');
  const app = express();
  const PORT = 3000;

  app.set('trust proxy', true);

  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // API: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', nodeEnv: process.env.NODE_ENV });
  });

  // API: Merit Stats
  app.get('/api/merit-stats', async (req, res) => {
    const db = await getDbPool();
    const ip = req.ip || 'unknown';
    const today = new Date().toISOString().split('T')[0];
    let dailyCount = 0;

    if (db) {
      try {
        const [rows]: any = await db.query('SELECT total_points FROM merit_stats WHERE id = 1');
        const [daily]: any = await db.query('SELECT click_count FROM merit_clicks WHERE ip = ? AND click_date = ?', [ip, today]);
        dailyCount = daily[0]?.click_count || 0;
        return res.json({ total: rows[0]?.total_points || 0, dailyCount });
      } catch (err) {
        console.error(err);
      }
    }
    
    // Fallback
    const key = `${ip}_${today}`;
    dailyCount = memoryStats.meritClicksCounts[key] || 0;
    res.json({ total: memoryStats.meritTotal, dailyCount });
  });

  // API: Merit Click
  app.post('/api/click-fish', async (req, res) => {
    const ip = req.ip || 'unknown';
    const today = new Date().toISOString().split('T')[0];
    const db = await getDbPool();

    if (db) {
      try {
        const [existing]: any = await db.query(
          'SELECT click_count FROM merit_clicks WHERE ip = ? AND click_date = ?',
          [ip, today]
        );

        const currentCount = existing[0]?.click_count || 0;

        if (currentCount >= 10) {
          return res.status(403).json({ error: 'Merit is full, come back tomorrow' });
        }

        if (existing.length > 0) {
          await db.query('UPDATE merit_clicks SET click_count = click_count + 1 WHERE ip = ? AND click_date = ?', [ip, today]);
        } else {
          await db.query('INSERT INTO merit_clicks (ip, click_date, click_count) VALUES (?, ?, 1)', [ip, today]);
        }
        
        await db.query('UPDATE merit_stats SET total_points = total_points + 1 WHERE id = 1');
        
        const [rows]: any = await db.query('SELECT total_points FROM merit_stats WHERE id = 1');
        return res.json({ success: true, message: 'Merit +1', total: rows[0].total_points, dailyCount: currentCount + 1 });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
    }

    // Fallback
    const key = `${ip}_${today}`;
    const currentCount = memoryStats.meritClicksCounts[key] || 0;
    if (currentCount >= 10) {
      return res.status(403).json({ error: 'Merit is full, come back tomorrow' });
    }
    memoryStats.meritClicksCounts[key] = currentCount + 1;
    memoryStats.meritTotal += 1;
    res.json({ success: true, message: 'Merit +1', total: memoryStats.meritTotal, dailyCount: currentCount + 1 });
  });

  // API: Resume Download
  app.post('/api/download-resume', async (req, res) => {
    const { name, position, company } = req.body;
    const ip = req.ip || 'unknown';
    const monthYear = new Date().toISOString().substring(0, 7); // YYYY-MM
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });

    if (!name || !position || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDbPool();
    let canDownload = false;

    if (db) {
      try {
        // Check global limit
        const [global]: any = await db.query('SELECT total_count FROM global_download_stats WHERE month_year = ?', [monthYear]);
        const totalCount = global[0]?.total_count || 0;
        if (totalCount >= 200) {
          return res.status(403).json({ error: 'Monthly total download limit reached' });
        }

        // Check IP limit
        const [ipStat]: any = await db.query('SELECT count FROM download_stats WHERE ip = ? AND month_year = ?', [ip, monthYear]);
        const ipCount = ipStat[0]?.count || 0;
        if (ipCount >= 2) {
          return res.status(403).json({ error: 'You have reached your monthly download limit (2)' });
        }

        // Update stats
        await db.query('INSERT INTO download_stats (ip, month_year, count) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE count = count + 1', [ip, monthYear]);
        await db.query('INSERT INTO global_download_stats (month_year, total_count) VALUES (?, 1) ON DUPLICATE KEY UPDATE total_count = total_count + 1', [monthYear]);
        canDownload = true;
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
    } else {
      // Fallback
      const currentMonth = new Date().getMonth();
      if (memoryStats.lastResetMonth !== currentMonth) {
        memoryStats.downloadIpCounts = {};
        memoryStats.downloadTotal = 0;
        memoryStats.lastResetMonth = currentMonth;
      }

      if (memoryStats.downloadTotal >= 200) {
        return res.status(403).json({ error: 'Monthly total download limit reached' });
      }

      const count = memoryStats.downloadIpCounts[ip] || 0;
      if (count >= 2) {
        return res.status(403).json({ error: 'You have reached your monthly download limit (2)' });
      }

      memoryStats.downloadTotal++;
      memoryStats.downloadIpCounts[ip] = count + 1;
      canDownload = true;
    }

    if (canDownload) {
      const emailContent = `
        Resume Downloaded by ${name}
        Position: ${position}
        Company: ${company}
        IP Address: ${ip}
        Time: ${now}
      `;

      console.log(`[EMAIL NOTIFICATION] To: masteryoung045@gmail.com`);
      console.log(`Subject: Resume Downloaded by ${name}`);
      console.log(`Body: ${emailContent}`);

      const mailer = getTransporter();
      if (mailer) {
        try {
          await mailer.sendMail({
            from: `"Resume Bot" <${process.env.SMTP_USER}>`,
            to: 'masteryoung045@gmail.com',
            subject: `Resume Downloaded by ${name}`,
            text: emailContent
          });
        } catch (err) {
          console.error('Failed to send email notification:', err);
        }
      }

      // Serve the file
      const filePath = path.join(__dirname, 'public', 'resume', 'resume_yangming.pdf');
      res.download(filePath, `resume_yangming.pdf`, (err) => {
        if (err) {
          console.error('Failed to serve resume file:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to serve resume file' });
          }
        }
      });
    }
  });

  // API: Resume Preview
  app.get('/api/resume-preview', async (req, res) => {
    try {
      const resumeDir = path.join(__dirname, 'public', 'resume');
      const files = await fs.readdir(resumeDir);
      const pdfFiles = files.filter(f => f.endsWith('.pdf'));
      
      if (pdfFiles.length === 0) {
        return res.status(404).json({ error: 'No resume found' });
      }

      // Read the first PDF found
      const pdfPath = path.join(resumeDir, pdfFiles[0]);
      const dataBuffer = await fs.readFile(pdfPath);
      const data = await pdfParse(dataBuffer);
      const text = data.text;

      // Basic parsing logic to extract sections
      // We look for common Chinese headings
      const headings = ['教育背景', '工作经历', '主要项目', '自我评价', '基本信息'];
      
      let workExperience = '';
      let projects = '';

      // Find indices of headings
      const indices: { name: string, index: number }[] = [];
      for (const heading of headings) {
        const idx = text.indexOf(heading);
        if (idx !== -1) {
          indices.push({ name: heading, index: idx });
        }
      }

      // Sort by index
      indices.sort((a, b) => a.index - b.index);

      for (let i = 0; i < indices.length; i++) {
        const current = indices[i];
        const next = indices[i + 1];
        const endIdx = next ? next.index : text.length;
        
        const content = text.substring(current.index + current.name.length, endIdx).trim();

        if (current.name === '工作经历') {
          workExperience = content;
        } else if (current.name === '主要项目') {
          projects = content;
        }
      }

      // Fallback to OCR text if the PDF is just our placeholder or parsing fails to find sections
      if (!workExperience && !projects) {
        workExperience = `2019.07-2020.07 华为西安研究所 云计算工程师
1.负责部门可信能力构建，三方开源软件依赖统一切换中心仓。
2.负责实现虚拟机和系统容器混部与计算角色合一，进行统一部署。

2020.07-至今 迪文科技有限公司 应用研发
1.主导外部项目和部门内部项目的需求评估，功能设计以及市场推广。
2.精通 UART, CAN, I2C,SPI 等常用串/并口通信协议，能够独立设计、开发并验证满足客户特定需求的定制化串口通信协议。
3.熟练掌握全志R11的固件开发、编译、调试与烧录全流程，并参与关键功能模块的代码编写以及复杂问题的定位。
4.23-24年间5个季度绩效排名在公司前5%，绩效占比超过30%。`;

        projects = `1.外部项目：PH仪表计
• 结合过采样原理和自行开发的滤波算法，使ph原始数据精度提升四位，稳定误差不超过0.02，最终结果接近梅特勒ph计。
• 编写标准modbusRTU协议和典型i2c通信实时时钟，四路IO控制继电器开闭。
• 200+页面逻辑处理，中英韩三语切换，支持ph和orp的热切换。

2.外部项目：充电桩三联屏
• 成功对接特来电充电协议，设计并增加重发机制实现双广告屏+单控制屏的可靠消息透传。
• 编写基于http协议的云端设备注册，广告下发/自动播放以及远程OTA功能。

3.内部项目：广告屏和美容屏
• 设计并实现基于公司T5L芯片加协处理器（专责皮肤分析和视频解码）的视频播放和摄像头解决方案，模块化协处理器并提供调用接口，大幅缩短定制功能开发时间，同时降低BOM成本超20%。
• 成功落地服务10余家客户，产生业绩超100万元。`;
      }

      // If parsing fails or sections are empty, we can provide a fallback or the raw text
      // But we will try to return what we found.
      res.json({
        success: true,
        workExperience: workExperience || 'No work experience section found.',
        projects: projects || 'No projects section found.',
        rawText: text // Optional: send raw text for debugging on frontend
      });

    } catch (err) {
      console.error('Error parsing resume:', err);
      res.status(500).json({ error: 'Failed to parse resume' });
    }
  });

  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
