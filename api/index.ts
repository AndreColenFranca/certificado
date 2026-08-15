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

// Helper function for attribute endpoints
const createAttributeEndpoints = (tableName: string, apiPath: string) => {
  app.get(`/api/${apiPath}`, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('order', { ascending: true });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: data || [], count: data?.length || 0 });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post(`/api/${apiPath}`, async (req, res) => {
    try {
      const { name, description, order } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

      const { data, error } = await supabase
        .from(tableName)
        .insert([{ name, description, order }])
        .select();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.status(201).json({ success: true, data: data?.[0] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const { name, description, order } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

      const { data, error } = await supabase
        .from(tableName)
        .update({ name, description, order })
        .eq('id', req.params.id)
        .select();

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, data: data?.[0] });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', req.params.id);

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      res.json({ success: true, message: 'Atributo deletado com sucesso' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
};

// Register all attribute endpoints
createAttributeEndpoints('collections', 'collections');
createAttributeEndpoints('manufacturers', 'manufacturers');
createAttributeEndpoints('metal_purities', 'metal-purities');
createAttributeEndpoints('metal_colors', 'metal-colors');
createAttributeEndpoints('finishes', 'finishes');
createAttributeEndpoints('stone_types', 'stone-types');
createAttributeEndpoints('setting_types', 'setting-types');
createAttributeEndpoints('cut_shapes', 'cut-shapes');
createAttributeEndpoints('color_grades', 'color-grades');

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
