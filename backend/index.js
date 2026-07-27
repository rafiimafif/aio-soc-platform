import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import client from 'prom-client';
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Prometheus metrics configuration
client.collectDefaultMetrics({ register: client.register });

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
client.register.registerMetric(httpRequestDurationMicroseconds);

app.use(cors());
app.use(express.json());

// Prometheus request duration middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const duration = process.hrtime(start);
    const durationInSeconds = duration[0] + duration[1] / 1e9;
    const path = req.route ? req.route.path : req.path;
    if (path !== '/api/metrics') {
      httpRequestDurationMicroseconds
        .labels(req.method, path || req.path, res.statusCode)
        .observe(durationInSeconds);
    }
  });
  next();
});

// Initialize PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'cyberops_db',
  password: process.env.PG_PASSWORD || 'postgres',
  port: process.env.PG_PORT || 5432,
});

// Test DB Connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.stack);
  } else {
    console.log('Connected to PostgreSQL Database successfully');
  }
});

// Setup Initial Tables if they don't exist
const initializeDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        team VARCHAR(100) NOT NULL,
        time_elapsed VARCHAR(50) NOT NULL,
        tactic VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables verified.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

initializeDB();

// API Routes

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CyberOps Backend is running.' });
});

// Prometheus metrics endpoint
app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

import { createHash } from 'crypto';

app.post('/api/auth', async (req, res) => {
  const { username, password } = req.body;
  if (username === 'sec_analyst') {
    const hash = createHash('sha256').update(password).digest('hex');
    // SHA-256 of "SecurityPassword123!"
    if (hash === '31928642d1e0beec45501504274d8031f3db3cf04a0bfcf2bf03e98c6b22be5b') {
      res.json({ success: true, message: 'Authenticated' });
      return;
    }
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
    // Map snake_case to camelCase
    const mappedRows = rows.map(r => ({
      id: r.id,
      title: r.title,
      severity: r.severity,
      status: r.status,
      team: r.team,
      timeElapsed: r.time_elapsed,
      tactic: r.tactic
    }));
    res.json(mappedRows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/incidents', async (req, res) => {
  const { id, title, severity, status, team, timeElapsed, tactic } = req.body;
  try {
    await pool.query(
      'INSERT INTO incidents (id, title, severity, status, team, time_elapsed, tactic) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [id, title, severity, status, team, timeElapsed, tactic]
    );
    res.status(201).json({ message: 'Incident created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/incidents/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE incidents SET status = $1 WHERE id = $2', [status, id]);
    res.json({ message: 'Incident status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vt', async (req, res) => {
  const { hash, apiKey } = req.body;
  if (!hash || !apiKey) return res.status(400).json({ error: 'Missing hash or API key' });
  
  try {
    const vtRes = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json'
      }
    });
    const data = await vtRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ioc/:ip', async (req, res) => {
  try {
    const ipRes = await fetch(`http://ip-api.com/json/${req.params.ip}`);
    const data = await ipRes.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`CyberOps API Gateway running on port ${port}`);
});
