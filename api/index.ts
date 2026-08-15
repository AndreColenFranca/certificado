// Vercel Serverless Function Handler
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const app = express();
app.use(express.json({ limit: '10mb' }));

// Initialize Supabase Client
let supabase: any = null;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('[DEBUG] Supabase URL:', !!supabaseUrl);
console.log('[DEBUG] Service Key configured:', !!supabaseServiceKey);

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('[DEBUG] Supabase initialized');
  } catch (err: any) {
    console.error('[ERROR] Supabase init failed:', err.message);
  }
}

// Routes
app.get('/api/health', (req, res) => {
  res.json({ message: 'API Certificado de Joias', status: 'online', version: '1.0' });
});

app.get('/api/debug/env', (req, res) => {
  res.json({
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseInitialized: !!supabase,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/certificates', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/customers', (req, res) => {
  res.json({ success: true, data: [] });
});

app.get('/api/organizations', (req, res) => {
  res.json({ success: true, data: [] });
});

// Serve SPA
const distDir = path.join(__dirname, '../dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

export default app;
