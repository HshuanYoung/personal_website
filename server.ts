import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import OpenAI from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({ 
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.OPENAI_API_KEY });

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

      await connection.query(`
        CREATE TABLE IF NOT EXISTS cook_search_errors (
          ip VARCHAR(45),
          error_date DATE,
          error_count INT DEFAULT 0,
          PRIMARY KEY (ip, error_date)
        )
      `);

      await connection.query(`
        CREATE TABLE IF NOT EXISTS drug_search_errors (
          ip VARCHAR(45),
          error_date DATE,
          error_count INT DEFAULT 0,
          PRIMARY KEY (ip, error_date)
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
  lastResetMonth: new Date().getMonth(),
  cookSearchErrors: {} as Record<string, number>,
  drugSearchErrors: {} as Record<string, number>
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

  // API: List Essays
  app.get('/api/essays', async (req, res) => {
    try {
      const fs = await import('fs/promises');
      const essayDir = path.join(__dirname, 'public', 'assets', 'essay');
      
      // Check if directory exists
      try {
        await fs.access(essayDir);
      } catch {
        return res.json({ essays: [] });
      }

      const files = await fs.readdir(essayDir);
      const essays = files
        .filter(file => file.endsWith('.txt') || file.endsWith('.pdf'))
        .map(file => ({
          title: file.replace(/\.(txt|pdf)$/i, ''),
          format: file.split('.').pop()?.toLowerCase(),
          file: `/assets/essay/${file}`
        }));
        
      res.json({ essays });
    } catch (err) {
      console.error('Failed to read essays directory:', err);
      res.status(500).json({ error: 'Failed to read essays' });
    }
  });

  // API: Cook Search
  app.get('/api/cook/search', async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    try {
      const cookbookDir = path.join(__dirname, 'public', 'cookbook');
      await fs.mkdir(cookbookDir, { recursive: true });

      const folders = await fs.readdir(cookbookDir, { withFileTypes: true });
      const matchingFolders = folders
        .filter(dirent => dirent.isDirectory() && dirent.name.toLowerCase().includes(q.toLowerCase()))
        .map(dirent => dirent.name);

      if (matchingFolders.length > 0) {
        const recipes = await Promise.all(
          matchingFolders.map(async (folder) => {
            const recipePath = path.join(cookbookDir, folder, 'recipe.md');
            try {
              const content = await fs.readFile(recipePath, 'utf-8');
              return { title: folder, content };
            } catch {
              return null;
            }
          })
        );
        return res.json({ recipes: recipes.filter(Boolean) });
      }

      // No matches found, check limits and use AI to validate and generate
      const ip = req.ip || 'unknown';
      const today = new Date().toISOString().split('T')[0];
      const db = await getDbPool();
      let currentErrorCount = 0;

      if (db) {
        try {
          const [existing]: any = await db.query(
            'SELECT error_count FROM cook_search_errors WHERE ip = ? AND error_date = ?',
            [ip, today]
          );
          currentErrorCount = existing[0]?.error_count || 0;
        } catch (err) {
          console.error('Failed to check cook search errors:', err);
        }
      } else {
        const key = `${ip}_${today}`;
        currentErrorCount = memoryStats.cookSearchErrors[key] || 0;
      }

      if (currentErrorCount >= 10) {
        return res.status(403).json({ error: 'You have reached the maximum number of incorrect inputs for today.' });
      }

      // Validate input using AI
      const validationPrompt = `"${q}"是食材或者菜品名吗？仅需要返回YES或者NO`;
      const validationResponse = await openai.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: [{ role: 'system', content: validationPrompt }],
      });

      const isValid = validationResponse.choices[0].message.content?.trim().toUpperCase() === 'YES';

      if (!isValid) {
        const newErrorCount = currentErrorCount + 1;
        const remaining = 10 - newErrorCount;
        
        if (db) {
          try {
            if (currentErrorCount > 0) {
              await db.query('UPDATE cook_search_errors SET error_count = error_count + 1 WHERE ip = ? AND error_date = ?', [ip, today]);
            } else {
              await db.query('INSERT INTO cook_search_errors (ip, error_date, error_count) VALUES (?, ?, 1)', [ip, today]);
            }
          } catch (err) {
            console.error('Failed to update cook search errors:', err);
          }
        } else {
          const key = `${ip}_${today}`;
          memoryStats.cookSearchErrors[key] = newErrorCount;
        }

        return res.status(400).json({ 
          error: `This doesn't seem like a dish. To prevent abuse, you can only enter ${remaining} times` 
        });
      }

      // Generate new recipe
      const prompt = `以Markdown格式为“${q}”生成一个食谱。包括食材准备、烹饪步骤和参考链接。不要将回复包裹在Markdown代码块中。`;
      
      const response = await openai.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: [{ role: 'system', content: prompt }],
      });

      const generatedMarkdown = response.choices[0].message.content || '';
      
      const newRecipeFolder = path.join(cookbookDir, q);
      await fs.mkdir(newRecipeFolder, { recursive: true });
      await fs.writeFile(path.join(newRecipeFolder, 'recipe.md'), generatedMarkdown, 'utf-8');

      res.json({ recipes: [{ title: q, content: generatedMarkdown }] });
    } catch (err) {
      console.error('Cook search error:', err);
      res.status(500).json({ error: 'Failed to search or generate recipe' });
    }
  });

  function parseDrugMarkdown(markdown: string, defaultTitle: string) {
    const sections = markdown.split(/(?=^#{2,4}\s+)/m).filter(s => s.trim().length > 0);
    
    const parsed = [];
    let currentIntro = '';

    for (const section of sections) {
      const match = section.match(/^#{2,4}\s+(.*)/);
      if (match) {
        const title = match[1].replace(/^\d+\.\s*/, '').replace(/\*+/g, '').trim();
        parsed.push({ title, content: (currentIntro + '\n\n' + section).trim() });
        currentIntro = '';
      } else {
        if (parsed.length === 0) {
          currentIntro += section;
        } else {
          parsed[parsed.length - 1].content += '\n\n' + section.trim();
        }
      }
    }

    if (parsed.length === 0 && currentIntro) {
      parsed.push({ title: defaultTitle, content: currentIntro.trim() });
    }

    return parsed;
  }

  // API: Drug Search
  app.get('/api/drug/search', async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: 'Search query required' });

    try {
      const drugsDir = path.join(__dirname, 'public', 'drugs');
      await fs.mkdir(drugsDir, { recursive: true });

      const folders = await fs.readdir(drugsDir, { withFileTypes: true });
      const queryLower = q.toLowerCase();
      
      let matchingFolders = folders
        .filter(dirent => {
          if (!dirent.isDirectory()) return false;
          const folderName = dirent.name.toLowerCase();
          return folderName.includes(queryLower) || (folderName.length >= 2 && queryLower.includes(folderName));
        })
        .map(dirent => dirent.name);

      // Sort to put the best match first
      matchingFolders.sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        if (aLower === queryLower) return -1;
        if (bLower === queryLower) return 1;
        return a.length - b.length;
      });

      const now = new Date();

      if (matchingFolders.length > 0) {
        const results = await Promise.all(
          matchingFolders.map(async (folder) => {
            const infoPath = path.join(drugsDir, folder, 'info.md');
            try {
              const stats = await fs.stat(infoPath);
              // Check if it's from the current month and year
              if (stats.mtime.getMonth() === now.getMonth() && stats.mtime.getFullYear() === now.getFullYear()) {
                const content = await fs.readFile(infoPath, 'utf-8');
                return parseDrugMarkdown(content, folder);
              }
              return null;
            } catch {
              return null;
            }
          })
        );
        
        const validResults = results.filter(Boolean).flat();
        if (validResults.length > 0) {
          return res.json({ results: validResults });
        }
      }

      // No matches found or cache is old, check limits and use AI to validate and generate
      // To avoid duplicate creation, if we had a fuzzy match but it was old, we update the best match
      const targetDrugName = matchingFolders.length > 0 ? matchingFolders[0] : q;

      const ip = req.ip || 'unknown';
      const today = now.toISOString().split('T')[0];
      const db = await getDbPool();
      let currentErrorCount = 0;

      if (db) {
        try {
          const [existing]: any = await db.query(
            'SELECT error_count FROM drug_search_errors WHERE ip = ? AND error_date = ?',
            [ip, today]
          );
          currentErrorCount = existing[0]?.error_count || 0;
        } catch (err) {
          console.error('Failed to check drug search errors:', err);
        }
      } else {
        const key = `${ip}_${today}`;
        currentErrorCount = memoryStats.drugSearchErrors[key] || 0;
      }

      if (currentErrorCount >= 3) {
        return res.status(403).json({ error: 'You have reached the maximum number of incorrect inputs for today.' });
      }

      // Validate input using AI
      const validationPrompt = `"${q}"是药品全称或者简写吗？仅需要返回YES或者NO`;
      const validationResponse = await openai.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: [{ role: 'system', content: validationPrompt }],
      });

      const isValid = validationResponse.choices[0].message.content?.trim().toUpperCase() === 'YES';

      if (!isValid) {
        const newErrorCount = currentErrorCount + 1;
        const remaining = 3 - newErrorCount;
        
        if (db) {
          try {
            if (currentErrorCount > 0) {
              await db.query('UPDATE drug_search_errors SET error_count = error_count + 1 WHERE ip = ? AND error_date = ?', [ip, today]);
            } else {
              await db.query('INSERT INTO drug_search_errors (ip, error_date, error_count) VALUES (?, ?, 1)', [ip, today]);
            }
          } catch (err) {
            console.error('Failed to update drug search errors:', err);
          }
        } else {
          const key = `${ip}_${today}`;
          memoryStats.drugSearchErrors[key] = newErrorCount;
        }

        return res.status(400).json({ 
          error: `This doesn't seem like a drug. To prevent abuse, you can only enter ${remaining} times` 
        });
      }

      // Generate new drug info
      const prompt = `以Markdown格式为药品“${targetDrugName}”及其相似药品生成信息。必须包含以下内容：规格、原研/仿制类型、参考价格及报销后价格、报销规定、医保类型、说明书链接（https://drugs.dxy.cn/pc/search?keyword=药品名称）。去掉其他的说明，只需要列出药品，不要将回复包裹在Markdown代码块中。请使用二级或三级标题（## 或 ###）来分隔不同的药品。`;
      
      const response = await openai.chat.completions.create({
        model: 'deepseek-reasoner',
        messages: [{ role: 'system', content: prompt }],
      });

      const generatedMarkdown = response.choices[0].message.content || '';
      
      const newDrugFolder = path.join(drugsDir, targetDrugName);
      await fs.mkdir(newDrugFolder, { recursive: true });
      await fs.writeFile(path.join(newDrugFolder, 'info.md'), generatedMarkdown, 'utf-8');

      const parsedResults = parseDrugMarkdown(generatedMarkdown, targetDrugName);
      res.json({ results: parsedResults });
    } catch (err) {
      console.error('Drug search error:', err);
      res.status(500).json({ error: 'Failed to search or generate drug info' });
    }
  });

  // API: Cook Random
  app.get('/api/cook/random', async (req, res) => {
    const cookbookDir = path.join(__dirname, 'public', 'cookbook');
    try {
      await fs.mkdir(cookbookDir, { recursive: true });
      const folders = await fs.readdir(cookbookDir, { withFileTypes: true });
      const recipeFolders = folders.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
      
      if (recipeFolders.length === 0) {
        return res.json({ recipes: [] });
      }

      const randomFolder = recipeFolders[Math.floor(Math.random() * recipeFolders.length)];
      const recipePath = path.join(cookbookDir, randomFolder, 'recipe.md');
      const content = await fs.readFile(recipePath, 'utf-8');
      
      res.json({ recipes: [{ title: randomFolder, content }] });
    } catch (err) {
      console.error('Cook random error:', err);
      res.status(500).json({ error: 'Failed to fetch random recipe' });
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
