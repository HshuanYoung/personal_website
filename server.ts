import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    if (!name || !position || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await getDbPool();
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

        console.log(`[EMAIL NOTIFICATION] To: masteryoung045@gmail.com`);
        console.log(`Subject: Resume Downloaded by ${name}`);
        console.log(`Body: ${name} (${position} at ${company}) has downloaded the resume. IP: ${ip}`);

        return res.json({ success: true, message: 'Download started' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Database error' });
      }
    }

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

    console.log(`[EMAIL NOTIFICATION] To: masteryoung045@gmail.com`);
    console.log(`Subject: Resume Downloaded by ${name}`);
    console.log(`Body: ${name} (${position} at ${company}) has downloaded the resume. IP: ${ip}`);

    res.json({ success: true, message: 'Download started' });
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
