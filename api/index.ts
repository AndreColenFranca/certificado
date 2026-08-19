import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { INITIAL_CERTIFICATES } from '../src/data/sampleCertificates';
import { INITIAL_CUSTOMERS } from '../src/data/sampleCustomers';
import { JewelryCertificate, Customer } from '../src/types';
import {
  getCertificates,
  getCertificateById,
  getCertificateByQuery,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  transformCertificateFromDb,
  createMaintenanceRecord
} from '../server-helpers/supabaseHelpers.js';
import {
  getAttributes,
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute
} from '../server-helpers/attributesHelpers.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Supabase Client
let supabase: any = null;
const supabaseUrl = process.env.SUPABASE_URL;
let supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  try {
    // Remove all whitespace including newlines from service key
    supabaseServiceKey = supabaseServiceKey.replace(/\s+/g, '').trim();
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  } catch (err: any) {
    // Failed to initialize Supabase
  }
}

// Limites das fotos da joia. Valem aqui tambem, e nao so na tela: a tela e
// so conveniencia, quem garante a regra e o servidor. Precisam bater com os
// valores em src/components/CertificateFormModal.tsx.
const MAX_FOTOS_POR_JOIA = 3;
const LIMITE_FOTO_MB = 1;
const LIMITE_FOTO_BYTES = LIMITE_FOTO_MB * 1024 * 1024;

// Devolve a mensagem de erro quando o certificado passa do teto de fotos, ou
// null quando esta dentro. Quem chama decide o status da resposta.
function conferirQuantidadeDeFotos(images: any): string | null {
  if (images === undefined || images === null) return null;
  if (!Array.isArray(images)) return 'O campo images precisa ser uma lista.';
  if (images.length > MAX_FOTOS_POR_JOIA) {
    return `Maximo de ${MAX_FOTOS_POR_JOIA} fotos por joia. Este certificado veio com ${images.length}.`;
  }
  return null;
}

// Root route
// Health check - only for API requests
app.get('/api/health', (req, res) => {
  res.json({ message: 'API Certificado de Joias', status: 'online', version: '1.0' });
});


// Default Organization UUID for local testing
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000'; // UUID correspondente a 'default'

// Middleware de autenticacao: descobre quem e o usuario a partir do token.
//
// A parte do meio de um JWT e apenas texto em base64 — qualquer um escreve o
// que quiser ali. O que prova a identidade e a assinatura, a terceira parte,
// que so o Supabase consegue produzir e conferir. Por isso o token vai inteiro
// para o `getUser`: ele responde com o usuario apenas se a assinatura bater e
// o token nao estiver expirado. Ler o token por conta propria, sem essa
// conferencia, aceitava qualquer cracha montado a mao.
app.use(async (req: any, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Ponto de partida: nao autenticado. So um token comprovado muda isso.
  req.user = { org_id: DEFAULT_ORG_ID };

  if (!token || !supabase) return next();

  try {
    const { data, error } = await supabase.auth.getUser(token);
    const usuario = data?.user;

    // Token falso, expirado ou revogado: segue sem autenticacao e o portao
    // logo abaixo devolve 401.
    if (error || !usuario?.email) return next();

    req.user = {
      id: usuario.id,
      org_id: DEFAULT_ORG_ID,
      role: 'user',
      email: usuario.email,
      authenticated: true
    };

    // org_id e papel saem da nossa tabela, nunca do que veio no token.
    const { data: authUser } = await supabase
      .from('auth_users')
      .select('org_id, role')
      .eq('email', usuario.email.toLowerCase())
      .maybeSingle();

    if (authUser) {
      req.user.org_id = authUser.org_id;
      req.user.role = authUser.role || 'user';
    }
  } catch (e) {
    // Qualquer falha na conferencia vale como nao autenticado.
    req.user = { org_id: DEFAULT_ORG_ID };
  }

  next();
});

// Gate de autenticacao: nada e acessivel sem login, com uma unica excecao -
// as rotas de autenticacao (login e recuperacao de senha), senao ninguem
// consegue entrar. Todo o resto responde 401 sem um JWT valido.
const ROTAS_PUBLICAS = new Set([
  '/api/login',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/update-password',
  '/api/auth/register',
  '/api/auth/register-profile',
  // '/api/auth/me' saiu daqui: devolve perfil, entao exige login como o resto.
  '/api/auth/create-root-user',
  '/api/auth/set-root-profile',
  '/api/health',
  '/api/organizations/health',
]);

app.use((req: any, res, next) => {
  if (ROTAS_PUBLICAS.has(req.path)) return next();
  if (req.user?.authenticated) return next();
  return res.status(401).json({ success: false, message: 'Autenticacao necessaria.' });
});

// Debug endpoint - check user org_id

// Sync/Create user in auth_users table with correct org_id
app.post('/api/sync-user-org', async (req, res) => {
  try {
    const { userId, email, org_id, role = 'operator' } = req.body;

    if (!userId || !email || !org_id) {
      return res.status(400).json({ error: 'userId, email, and org_id required' });
    }

    // Check if exists
    const { data: existing } = await supabase
      .from('auth_users')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      // Update
      const { error } = await supabase
        .from('auth_users')
        .update({ org_id, role, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;
      return res.json({ success: true, message: 'User updated', action: 'update' });
    } else {
      // Insert
      const { error } = await supabase
        .from('auth_users')
        .insert({
          id: userId,
          email,
          name: email.split('@')[0],
          org_id,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return res.json({ success: true, message: 'User created', action: 'insert' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// All data now from Supabase only - no local caches
let certificatesDb: JewelryCertificate[] = []; // Not used
let customersDb: Customer[] = []; // Not used
let usersDb: any[] = []; // Not used

// Organizations Database
let organizationsDb: any[] = [
  {
    id: DEFAULT_ORG_ID,
    name: 'Maison Lumière Joias',
    description: 'Organização padrão',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Only Admin User - All customer users come from Supabase

const DATA_FILE = path.join(process.cwd(), 'data_store.json');

const loadDataStore = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(raw);
      // Load persisted data directly without merging with INITIAL_*
      if (Array.isArray(data.certificatesDb)) {
        certificatesDb = data.certificatesDb;
      }
      if (Array.isArray(data.customersDb)) {
        customersDb = data.customersDb;
      }
      if (Array.isArray(data.usersDb)) {
        usersDb = data.usersDb;
      }
      if (Array.isArray(data.organizationsDb)) {
        organizationsDb = data.organizationsDb;
      }
    }
  } catch (e) {
  }
};

const saveDataStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ certificatesDb, customersDb, usersDb, organizationsDb }, null, 2));
  } catch (e) {
  }
};

// loadDataStore(); // Removed - using Supabase only

// Supabase User Registration Endpoint (for creating users via Supabase)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required'
      });
    }

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        display_name: name,
        role: 'customer'
      },
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user'
      });
    }

    // Create auth_users record
    await supabase
      .from('auth_users')
      .insert({
        id: authData.user.id,
        org_id: 'default-org',
        email,
        name,
        role: 'customer'
      });

    res.status(201).json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: 'customer'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Registration failed'
    });
  }
});

// Register profile after signup
app.post('/api/auth/register-profile', async (req, res) => {
  try {
    const { id, email, name, orgId, role } = req.body;

    if (!id || !email) {
      return res.status(400).json({
        success: false,
        error: 'ID e email são obrigatórios'
      });
    }

    const userOrgId = orgId;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id não foi fornecido. Faça login novamente.'
      });
    }

    // Create auth_users record
    const { error } = await supabase
      .from('auth_users')
      .upsert({
        id,
        email,
        name: name || email.split('@')[0],
        org_id: userOrgId,
        role: role || 'customer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Perfil registrado com sucesso'
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Erro ao registrar perfil'
    });
  }
});

// Get current user profile
// Perfil do usuario logado. O e-mail vem do token ja conferido pelo
// middleware, nunca do corpo da requisicao: aceitar um e-mail digitado aqui
// deixava qualquer um puxar o perfil alheio so sabendo o endereco. Os dois
// chamadores no front continuam mandando `email` no corpo; e ignorado de
// proposito, e nao precisa sumir de la para isto funcionar.
app.post('/api/auth/me', async (req: any, res) => {
  try {
    const email = req.user?.email;

    if (!email) {
      return res.status(401).json({
        success: false,
        error: 'Autenticacao necessaria.'
      });
    }

    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not initialized'
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Try to find user in auth_users table
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('email', cleanEmail)
      .single();

    // If user not found in auth_users, create a default entry from auth.users
    if (userError && userError.code === 'PGRST116') {
      // User not found - try to get from Supabase Auth and create in auth_users
      const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
      const foundAuthUser = authUser?.users?.find(u => u.email?.toLowerCase() === cleanEmail);

      if (foundAuthUser) {
        // Create default auth_users entry for this auth user
        const { data: newUser, error: insertError } = await supabase
          .from('auth_users')
          .insert({
            id: foundAuthUser.id,
            email: cleanEmail,
            name: foundAuthUser.user_metadata?.display_name || cleanEmail.split('@')[0],
            org_id: DEFAULT_ORG_ID,
            role: foundAuthUser.user_metadata?.role || 'customer',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (newUser) {
          const { data: org } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', DEFAULT_ORG_ID)
            .single();

          return res.json({
            success: true,
            data: {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              role: newUser.role,
              orgId: newUser.org_id,
              orgName: org?.display_name || org?.name || 'Organização'
            }
          });
        }
      }

      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    if (userError) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch user: ${userError.message}`,
        code: userError.code
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.org_id)
      .single();

    if (orgError && orgError.code !== 'PGRST116') {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch org: ${orgError.message}`,
        code: orgError.code
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.org_id,
        orgName: org?.display_name || org?.name || 'Organização'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Update User Profile to Root Endpoint
app.post('/api/auth/set-root-profile', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'userId and email are required'
      });
    }

    // Update or insert auth_users record with root role
    const { data, error } = await supabase
      .from('auth_users')
      .upsert({
        id: userId,
        org_id: '00000000-0000-0000-0000-000000000001',
        email,
        name: 'André Luiz Colen (Administrador Raiz)',
        role: 'root'
      }, { onConflict: 'id' })
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Root profile updated',
      data
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to set root profile'
    });
  }
});

// Forgot Password Endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Send password reset email
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/reset-password`
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password reset email sent. Check your inbox.',
      data
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to send reset email'
    });
  }
});

// Update Password Endpoint (with token)
app.post('/api/auth/update-password', async (req, res) => {
  try {
    const { password } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!password || !token) {
      return res.status(400).json({
        success: false,
        error: 'Password and token are required'
      });
    }

    // Update password with token
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Password updated successfully',
      data
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to update password'
    });
  }
});

// Create Root User Endpoint
app.post('/api/auth/create-root-user', async (req, res) => {
  try {
    const email = 'andreluiz.colen@gmail.com';
    const password = req.body.password || 'fofa!@#';
    const name = 'André Luiz Colen (Administrador Raiz)';

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        display_name: name,
        role: 'root',
        is_root: true
      },
      email_confirm: true
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes('already registered')) {
        return res.status(400).json({
          success: false,
          error: 'Root user already exists'
        });
      }
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create root user'
      });
    }

    // Create auth_users record for root
    const { data: profileData, error: profileError } = await supabase
      .from('auth_users')
      .insert({
        id: authData.user.id,
        org_id: 'root-org',
        email,
        name,
        role: 'root'
      })
      .select();

    res.status(201).json({
      success: true,
      message: 'Root user created successfully',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: 'root',
        isRoot: true
      }
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'Root user creation failed'
    });
  }
});

// API Routes


// Supabase-only login (NO local database fallback)
app.post('/api/login', async (req: any, res: any) => {
  try {
    const { email = '', password = '' } = req.body || {};
    const rawEmail = String(email || '').trim().toLowerCase();

    console.log(`[LOGIN] Tentando login com: ${rawEmail}`);

    if (!supabase) return res.status(503).json({ success: false, error: 'Supabase não disponível' });
    if (!rawEmail || !password) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });

    const { data: allUsers } = await supabase.auth.admin.listUsers();
    console.log(`[LOGIN] Usuários no Supabase:`, allUsers?.users?.map((u: any) => u.email));
    const foundAuthUser = allUsers?.users?.find((u: any) => u.email?.toLowerCase() === rawEmail);
    console.log(`[LOGIN] Usuário encontrado:`, foundAuthUser ? foundAuthUser.email : 'NENHUM');
    if (!foundAuthUser) return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });

    const { data: userProfile } = await supabase.from('auth_users').select('*').eq('id', foundAuthUser.id).single();
    if (!userProfile) {
      const { data: newProfile } = await supabase.from('auth_users').insert({
        id: foundAuthUser.id, email: foundAuthUser.email,
        name: foundAuthUser.user_metadata?.display_name || foundAuthUser.email.split('@')[0],
        role: foundAuthUser.user_metadata?.role || 'customer',
        org_id: foundAuthUser.user_metadata?.org_id,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).select().single();
      if (!newProfile) return res.status(500).json({ success: false, error: 'Falha ao criar perfil' });
      return res.json({ success: true, message: 'Login realizado com sucesso', user: {
        id: newProfile.id, name: newProfile.name, email: newProfile.email, role: newProfile.role,
        orgId: newProfile.org_id, orgName: 'Organização', createdAt: newProfile.created_at, isRoot: newProfile.role === 'root'
      }});
    }

    const { data: org } = await supabase.from('organizations').select('*').eq('id', userProfile.org_id).single();
    return res.json({ success: true, message: 'Login realizado com sucesso', user: {
      id: userProfile.id, name: userProfile.name, email: userProfile.email, role: userProfile.role,
      orgId: userProfile.org_id, orgName: org?.display_name || org?.name || 'Organização',
      createdAt: userProfile.created_at, isRoot: userProfile.role === 'root'
    }});
  } catch (err: any) {
    console.error(`[LOGIN] Erro:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email = '', password = '' } = req.body || {};
    const rawEmail = String(email || '').trim().toLowerCase();

    if (!supabase) return res.status(503).json({ success: false, error: 'Supabase não disponível' });
    if (!rawEmail || !password) return res.status(400).json({ success: false, error: 'Email e senha obrigatórios' });

    const { data: allUsers } = await supabase.auth.admin.listUsers();
    const foundAuthUser = allUsers?.users?.find((u: any) => u.email?.toLowerCase() === rawEmail);
    if (!foundAuthUser) return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });

    const { data: userProfile } = await supabase.from('auth_users').select('*').eq('id', foundAuthUser.id).single();
    if (!userProfile) {
      const { data: newProfile } = await supabase.from('auth_users').insert({
        id: foundAuthUser.id, email: foundAuthUser.email,
        name: foundAuthUser.user_metadata?.display_name || foundAuthUser.email.split('@')[0],
        role: foundAuthUser.user_metadata?.role || 'customer',
        org_id: foundAuthUser.user_metadata?.org_id,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString()
      }).select().single();
      if (!newProfile) return res.status(500).json({ success: false, error: 'Falha ao criar perfil' });
      return res.json({ success: true, message: 'Login realizado com sucesso', user: {
        id: newProfile.id, name: newProfile.name, email: newProfile.email, role: newProfile.role,
        orgId: newProfile.org_id, orgName: 'Organização', createdAt: newProfile.created_at, isRoot: newProfile.role === 'root'
      }});
    }

    const { data: org } = await supabase.from('organizations').select('*').eq('id', userProfile.org_id).single();
    return res.json({ success: true, message: 'Login realizado com sucesso', user: {
      id: userProfile.id, name: userProfile.name, email: userProfile.email, role: userProfile.role,
      orgId: userProfile.org_id, orgName: org?.display_name || org?.name || 'Organização',
      createdAt: userProfile.created_at, isRoot: userProfile.role === 'root'
    }});
  } catch (err: any) {
    console.error(`[AUTH/LOGIN] Erro:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});


// Get all registered users (filtered by org_id and role permissions)
app.get('/api/users', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Supabase não disponível' });
    }

    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }
    const userRole = (req as any).user?.role || 'user';

    let query = supabase
      .from('auth_users')
      .select('id, name, email, role, org_id, created_at, updated_at')
      .order('created_at', { ascending: false });

    // ROOT vê apenas admins de qualquer organização
    if (userRole === 'root') {
      query = query.eq('role', 'admin');
    }
    // ADMIN vê apenas operadores da mesma organização
    else if (userRole === 'admin') {
      query = query.eq('org_id', userOrgId).eq('role', 'operator');
    }
    // OPERADOR vê apenas dados da própria organização (sem listar usuários)
    else {
      return res.json({ success: true, count: 0, data: [] });
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: 'Erro ao buscar usuários' });
    }

    res.json({ success: true, count: users?.length || 0, data: users || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new user (Allowed for Root, Admins or authenticated system requests)
app.post('/api/users', async (req, res) => {
  console.log('\n\n🟢🟢🟢 POST /api/users RECEBIDA 🟢🟢🟢');
  console.log(`Body: ${JSON.stringify(req.body)}`);
  console.log(`Supabase disponível: ${!!supabase}`);

  try {
    if (!supabase) {
      console.log('❌ Supabase não inicializado!');
      return res.status(500).json({ success: false, message: 'Supabase não disponível' });
    }

    const { requesterEmail, name, email, password, role, orgId } = req.body;
    console.log(`Email recebido: ${email}, Role: ${role}`);
    const userOrgId = orgId || (req as any).user?.org_id || DEFAULT_ORG_ID;
    const requesterRole = (req as any).user?.role || 'user';

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Validação de hierarquia rigorosa (apenas na tela de cadastro):
    // ROOT: só pode criar ADMIN
    // ADMIN: só pode criar OPERATOR
    // OPERATOR/CUSTOMER: não pode criar ninguém
    if (requesterRole === 'root' && role !== 'admin') {
      console.log(`[SECURITY] Root tentou criar ${role} - apenas ADMIN é permitido`);
      return res.status(403).json({
        success: false,
        message: 'Usuário Raiz pode criar apenas Administradores.'
      });
    }

    if (requesterRole === 'admin' && role !== 'operator') {
      console.log(`[SECURITY] Admin ${requesterEmail} tentou criar ${role} - apenas OPERATOR é permitido`);
      return res.status(403).json({
        success: false,
        message: 'Administradores podem criar apenas Operadores.'
      });
    }

    if (requesterRole !== 'root' && requesterRole !== 'admin') {
      console.log(`[SECURITY] ${requesterRole} tentou criar usuário - não permitido`);
      return res.status(403).json({
        success: false,
        message: 'Apenas Administradores e o Usuário Raiz podem criar usuários.'
      });
    }

    // Verificar duplicata no Supabase
    const { data: existing, error: checkError } = await supabase
      .from('auth_users')
      .select('id')
      .eq('email', cleanEmail)
      .single();

    if (existing) {
      return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado no sistema.' });
    }

    const newUserId = uuidv4();
    const now = new Date().toISOString();

    // Salvar no Supabase
    const roleToSave = role || 'operator';
    console.log(`[DEBUG] Criando usuário: email=${cleanEmail}, role=${roleToSave}, requesterEmail=${requesterEmail}`);

    // 1. FIRST: Create user in Supabase Auth (auth.users table)
    let authUserId = newUserId;
    console.log(`[DEBUG] === INICIANDO CRIAÇÃO NO SUPABASE AUTH ===`);
    console.log(`[DEBUG] Email: ${cleanEmail}, Senha: ${password}, Role: ${roleToSave}`);

    try {
      console.log(`[DEBUG] Chamando supabase.auth.admin.createUser...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password,
        user_metadata: {
          display_name: name.trim(),
          role: roleToSave
        },
        email_confirm: true
      });

      console.log(`[DEBUG] Resposta do Supabase Auth:`);
      console.log(`[DEBUG] - authData: ${JSON.stringify(authData)}`);
      console.log(`[DEBUG] - authError: ${authError ? authError.message : 'null'}`);

      if (authError) {
        console.error(`[ERROR] Failed to create user in Supabase Auth:`, authError.message);
        return res.status(400).json({
          success: false,
          message: `Erro ao criar usuário no Supabase Auth: ${authError.message}`
        });
      }

      if (authData.user) {
        authUserId = authData.user.id;
        console.log(`[DEBUG] ✅ Usuário criado no Supabase Auth: id=${authUserId}`);
      } else {
        console.log(`[DEBUG] ⚠️ authData.user é null`);
      }
    } catch (authErr: any) {
      console.error(`[ERROR] Exception creating user in Supabase Auth:`, authErr.message);
      console.error(`[ERROR] Stack:`, authErr.stack);
      return res.status(400).json({
        success: false,
        message: `Erro ao criar usuário na autenticação: ${authErr.message}`
      });
    }

    // 2. THEN: Create auth_users record in application table
    const { data: insertedUser, error: insertError } = await supabase
      .from('auth_users')
      .insert({
        id: authUserId,
        email: cleanEmail,
        name: name.trim(),
        org_id: userOrgId,
        role: roleToSave,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (insertError || !insertedUser) {
      console.error(`[ERROR] Failed to create auth_users record:`, insertError?.message);
      // Note: User was created in Supabase Auth but failed in auth_users table
      // This is not ideal but won't block login
      return res.status(500).json({
        success: false,
        message: insertError?.message || 'Erro ao criar registro do usuário no banco de dados'
      });
    }

    console.log(`[DEBUG] Usuário criado: id=${insertedUser.id}, role=${insertedUser.role}`);

    res.status(201).json({
      success: true,
      data: insertedUser,
      message: `Usuário "${name.trim()}" cadastrado com sucesso!`
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ success: false, message: error.message || 'Erro ao cadastrar usuário' });
  }
});

// Update user
app.put('/api/users/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Supabase não disponível' });
    }

    const param = req.params.id;
    const { name, email, role } = req.body;

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Nome e role são obrigatórios' });
    }

    // Buscar usuário no Supabase
    const { data: user, error: findError } = await supabase
      .from('auth_users')
      .select('id, email')
      .or(`id.eq.${param},email.eq.${param}`)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    if (user.email?.toLowerCase() === 'andreluiz.colen@gmail.com') {
      return res.status(403).json({ success: false, message: 'O Usuário Raiz principal não pode ser alterado!' });
    }

    const now = new Date().toISOString();
    const cleanEmail = email ? email.trim().toLowerCase() : undefined;

    console.log(`[UPDATE] Validando email: ${cleanEmail} (anterior: ${user.email})`);

    // Validar email duplicado (se foi alterado)
    if (cleanEmail && cleanEmail !== user.email?.toLowerCase()) {
      console.log(`[UPDATE] Email foi alterado, verificando duplicatas...`);
      const { data: existingEmail, error: checkError } = await supabase
        .from('auth_users')
        .select('id, email')
        .eq('email', cleanEmail);

      console.log(`[UPDATE] Resultado da busca: ${JSON.stringify({ existingEmail, checkError })}`);

      if (existingEmail && existingEmail.length > 0) {
        console.log(`[UPDATE] Email já existe! Retornando erro.`);
        return res.status(400).json({
          success: false,
          message: 'Este e-mail já está cadastrado para outro usuário.'
        });
      }
    }

    // Se email foi alterado, atualizar também no Supabase Auth
    if (cleanEmail && cleanEmail !== user.email?.toLowerCase()) {
      try {
        await supabase.auth.admin.updateUserById(user.id, {
          email: cleanEmail
        });
        console.log(`[UPDATE] Email atualizado no Supabase Auth: ${user.email} → ${cleanEmail}`);
      } catch (authErr: any) {
        console.error(`[UPDATE] Erro ao atualizar email em Supabase Auth: ${authErr.message}`);
        return res.status(400).json({
          success: false,
          message: `Erro ao atualizar email: ${authErr.message}`
        });
      }
    }

    // Atualizar no Supabase auth_users
    const updateData: any = {
      name: name.trim(),
      role: role,
      updated_at: now
    };

    if (cleanEmail) {
      updateData.email = cleanEmail;
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('auth_users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return res.status(500).json({
        success: false,
        message: updateError?.message || 'Erro ao atualizar usuário'
      });
    }

    res.json({
      success: true,
      data: updatedUser,
      message: 'Usuário atualizado com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ success: false, message: error.message || 'Erro ao atualizar usuário' });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Supabase não disponível' });
    }

    const param = req.params.id;

    // Buscar usuário no Supabase
    const { data: user, error: findError } = await supabase
      .from('auth_users')
      .select('id, email')
      .or(`id.eq.${param},email.eq.${param}`)
      .single();

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
    }

    if (user.email?.toLowerCase() === 'andreluiz.colen@gmail.com') {
      return res.status(403).json({ success: false, message: 'O Usuário Raiz principal não pode ser removido!' });
    }

    // 1. Deletar do Supabase Auth (auth.users)
    try {
      await supabase.auth.admin.deleteUser(user.id);
      console.log(`[DELETE] Usuário ${user.email} removido do Supabase Auth`);
    } catch (authErr: any) {
      console.error(`[DELETE] Erro ao remover do Supabase Auth: ${authErr.message}`);
      // Continua mesmo se falhar aqui
    }

    // 2. Deletar de auth_users
    const { error: deleteError } = await supabase
      .from('auth_users')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      return res.status(500).json({ success: false, message: 'Erro ao remover usuário' });
    }

    res.json({ success: true, message: 'Usuário removido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ success: false, message: error.message || 'Erro ao remover usuário' });
  }
});

// DEBUG: Get ALL customers (no filter)

// DEBUG: Get customer by UUID

// DEBUG: Check user org_id from JWT

// --- Customers API ---
// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase not initialized', data: [] });
    }

    // Get org_id from JWT or use default
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    // ALWAYS load from Supabase - no local data, filter by org_id
    const result = await getCustomers(supabase, userOrgId);

    if (result.success && result.data) {
      return res.json({ success: true, count: result.data.length, data: result.data });
    }

    // If Supabase fails, return error
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Unknown error', data: [] });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message, data: [] });
  }
});

// Create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const newCust: Customer = req.body;
    const cleanEmail = (newCust.email || '').trim().toLowerCase();
    const password = (newCust.password || '').trim();

    if (!cleanEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email e senha são obrigatórios' });
    }

    if (!newCust.id) {
      newCust.id = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const now = new Date().toISOString();
    newCust.createdAt = now;
    newCust.updatedAt = now;
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    // 1. Create in Supabase customers table
    const supabaseCreateResult = await createCustomer(supabase, {
      customer_code: newCust.id,
      name: newCust.name,
      cpf: String(newCust.cpf),
      email: cleanEmail,
      phone: newCust.phone || '',
      notes: newCust.notes || '',
      org_id: userOrgId
    });

    if (!supabaseCreateResult.success) {
      return res.status(400).json({ success: false, message: supabaseCreateResult.error });
    }

    // 2. Create in Supabase Auth (OBRIGATÓRIO)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        display_name: newCust.name,
        role: 'customer',
        customer_id: newCust.id
      }
    });

    if (authError || !authData?.user) {
      // Rollback: delete from customers if auth fails
      await supabase.from('customers').delete().eq('customer_code', newCust.id);
      return res.status(400).json({ success: false, message: `Autenticação obrigatória falhou: ${authError?.message || 'Desconhecido'}` });
    }

    // 3. Create profile in auth_users table
    const { error: profileError } = await supabase.from('auth_users').insert({
      id: authData.user.id,
      email: cleanEmail,
      name: newCust.name,
      role: 'customer',
      org_id: userOrgId,
      created_at: now,
      updated_at: now
    });

    if (profileError) {
      return res.status(400).json({ success: false, message: `Falha ao criar perfil: ${profileError.message}` });
    }

    res.status(201).json({ success: true, data: newCust, message: 'Cliente cadastrado com sucesso' });
  } catch (error: any) {
    console.error(`[CUSTOMER] Erro ao cadastrar cliente:`, error.message);
    res.status(400).json({ success: false, message: error.message || 'Erro ao cadastrar cliente' });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const newCust: Customer = req.body;
    const password = (newCust.password || '').trim();

    // O frontend envia o UUID do cliente (getCustomers devolve id = UUID),
    // mas chamadas antigas podem mandar o codigo CLI-xxxx. Aceita os dois.
    const ehUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const colunaId = ehUuid ? 'id' : 'customer_code';

    const { data: existingCust, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .eq(colunaId, id)
      .single();

    if (fetchError || !existingCust) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    // 1. Update in customers table (but NEVER change email - it's a credential)
    // Colunas explicitas: o payload traz password e orgId, que nao existem na
    // tabela e fariam o update falhar. Email fica de fora de proposito - e
    // credencial de login e nao pode mudar por aqui.
    const updateData: any = { updated_at: new Date().toISOString() };
    if (newCust.name !== undefined) updateData.name = newCust.name;
    if (newCust.cpf !== undefined) updateData.cpf = String(newCust.cpf);
    if (newCust.phone !== undefined) updateData.phone = newCust.phone || null;
    if (newCust.notes !== undefined) updateData.notes = newCust.notes || null;

    const { error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq(colunaId, id);

    if (updateError) {
      return res.status(400).json({ success: false, message: updateError.message });
    }

    // 2. Update password in Supabase Auth ONLY (email is immutable credential)
    if (password) {
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const authUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === existingCust.email?.toLowerCase());

      if (authUser) {
        const { error: authErr } = await supabase.auth.admin.updateUserById(authUser.id, { password });
        if (authErr) return res.status(400).json({ success: false, message: `Falha ao atualizar senha: ${authErr.message}` });

        // Update name in auth_users profile
        await supabase.from('auth_users').update({ name: newCust.name, updated_at: new Date().toISOString() }).eq('id', authUser.id);
      }
    }

    res.json({ success: true, data: newCust, message: 'Cliente atualizado com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao atualizar cliente' });
  }
});

// Sync missing Supabase Auth for customers (admin endpoint)
app.post('/api/customers/sync/missing-auth', async (req, res) => {
  try {
    console.log('[SYNC] Sincronizando clientes sem Supabase Auth...');

    // Get all customers
    const { data: allCustomers } = await supabase.from('customers').select('*');
    if (!allCustomers || allCustomers.length === 0) {
      return res.json({ success: true, synced: 0, message: 'Nenhum cliente encontrado' });
    }

    // Get all auth users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const authEmails = new Set(authUsers?.users?.map(u => u.email?.toLowerCase()) || []);

    let synced = 0;
    const errors = [];

    // For each customer not in Supabase Auth
    for (const customer of allCustomers) {
      const custEmail = customer.email?.toLowerCase();
      if (!custEmail) continue;

      if (!authEmails.has(custEmail)) {
        console.log(`[SYNC] Criando Auth para ${custEmail}...`);

        // Create in Supabase Auth with default password
        const { data: newAuth, error: authError } = await supabase.auth.admin.createUser({
          email: custEmail,
          password: '123456',
          email_confirm: true,
          user_metadata: {
            display_name: customer.name,
            role: 'customer',
            customer_id: customer.customer_code
          }
        });

        if (authError) {
          errors.push(`${custEmail}: ${authError.message}`);
          continue;
        }

        // Create profile in auth_users
        await supabase.from('auth_users').insert({
          id: newAuth.user?.id,
          email: custEmail,
          name: customer.name,
          role: 'customer',
          org_id: customer.org_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        synced++;
        console.log(`[SYNC] ✅ ${custEmail} sincronizado`);
      }
    }

    res.json({ success: true, synced, errors, message: `${synced} clientes sincronizados` });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userOrgId = (req as any).user?.org_id;

    if (!userOrgId) {
      return res.status(401).json({ success: false, message: 'Usuário não autenticado' });
    }

    // 1. Find customer - try customer_code first, then UUID
    let targetCust: any = null;
    let fetchError: any = null;

    // Try by customer_code first (usual case)
    const { data: custByCode, error: errCode } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_code', id)
      .eq('org_id', userOrgId)
      .single();

    if (custByCode) {
      targetCust = custByCode;
    } else if (errCode?.code !== 'PGRST116') {
      // Actual error (not "no rows")
      fetchError = errCode;
    } else {
      // Try by UUID
      const { data: custByUuid, error: errUuid } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .eq('org_id', userOrgId)
        .single();

      if (custByUuid) {
        targetCust = custByUuid;
      } else {
        fetchError = errUuid;
      }
    }

    if (fetchError || !targetCust) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    // 2. Delete from Supabase Auth and auth_users table
    // Delete from auth_users table FIRST (easier, less risky)
    try {
      await supabase
        .from('auth_users')
        .delete()
        .eq('email', targetCust.email);
    } catch (authUsersErr: any) {
      // Silent fail
    }

    // Then try to delete from Supabase Auth
    try {
      const { data: authUsers } = await supabase.auth.admin.listUsers();

      if (authUsers) {
        const authUser = authUsers.users?.find((u: any) => u.email?.toLowerCase() === targetCust.email?.toLowerCase());

        if (authUser) {
          await supabase.auth.admin.deleteUser(authUser.id);
        }
      }
    } catch (authErr: any) {
      // Silent fail
    }

    // 3. Delete from customers table using UUID (double-check org_id for security)
    const { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', targetCust.id)
      .eq('org_id', userOrgId);

    if (deleteError) {
      return res.status(400).json({ success: false, message: `Falha ao deletar cliente: ${deleteError.message}` });
    }

    res.json({ success: true, message: 'Cliente removido com sucesso (autenticação e dados)' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao remover cliente' });
  }
});

// --- Maintenance Records API ---

// Create maintenance record
app.post('/api/maintenance', async (req, res) => {
  try {
    const userOrgId = (req as any).user?.org_id;

    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    const {
      certId,
      maintenanceDate,
      maintenanceType,
      performer,
      notes,
      customerName,
      customerCpf,
      customerEmail
    } = req.body;

    if (!certId || !maintenanceDate || !maintenanceType || !performer) {
      return res.status(400).json({
        success: false,
        message: 'Campos obrigatórios: certId, maintenanceDate, maintenanceType, performer'
      });
    }

    const result = await createMaintenanceRecord(
      supabase,
      certId,
      userOrgId,
      maintenanceDate,
      maintenanceType,
      performer,
      notes,
      customerName,
      customerCpf,
      customerEmail
    );

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.json({ success: true, data: result.data, message: 'Registro de manutenção criado com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao criar registro de manutenção' });
  }
});

// --- Certificates API ---

// Sync local certificates array with server database
app.post('/api/certificates/sync', (req, res) => {
  try {
    const { localCertificates = [] } = req.body || {};
    if (Array.isArray(localCertificates) && localCertificates.length > 0) {
      localCertificates.forEach((lc: any) => {
        if (lc && lc.id) {
          const idx = certificatesDb.findIndex(c => c.id === lc.id);
          if (idx === -1) {
            certificatesDb.push(lc);
          } else {
            certificatesDb[idx] = { ...certificatesDb[idx], ...lc };
          }
        }
      });
      // saveDataStore(); // Removed - using Supabase only
    }
    res.json({ success: true, count: certificatesDb.length, data: certificatesDb });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get all certificates (ALWAYS from Supabase)
app.get('/api/certificates', async (req, res) => {
  try {
    // Get org_id from JWT or use default
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase not initialized' });
    }

    // ALWAYS load from Supabase - no local data, filter by org_id
    const result = await getCertificates(supabase, userOrgId);

    if (result.success && result.data) {
      const transformedData = result.data.map(transformCertificateFromDb);
      console.log(`[GET /api/certificates] Retrieved ${transformedData.length} certs for org:`, userOrgId, {
        certIds: transformedData.map(c => ({ id: c.id, title: c.title, isRoot: c.isRoot, orgId: c.orgId }))
      });
      return res.json({ success: true, count: transformedData.length, data: transformedData });
    }

    // If Supabase fails, return error
    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error || 'Unknown error' });
    }

    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao carregar certificados' });
  }
});

// Get certificate by ID, Serial Number, Cert Code or Authenticity Hash
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const query = req.params.id.trim().toUpperCase();
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    // Try Supabase first - search by cert_code, serial_number, or id
    const result = await getCertificateByQuery(supabase, query, userOrgId);
    if (result.success && result.data) {
      const transformedData = transformCertificateFromDb(result.data);
      return res.json({ success: true, data: transformedData });
    }

    // Fallback to in-memory search with multiple fields
    const cert = certificatesDb.find(
      c => c.id.toUpperCase() === query ||
           c.serialNumber.toUpperCase() === query ||
           (c.authenticityHash && c.authenticityHash.toUpperCase() === query)
    );

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    res.json({ success: true, data: cert });
  } catch (err: any) {
    // Fallback to in-memory on error
    const query = req.params.id.trim().toUpperCase();
    const cert = certificatesDb.find(
      c => c.id.toUpperCase() === query ||
           c.serialNumber.toUpperCase() === query ||
           (c.authenticityHash && c.authenticityHash.toUpperCase() === query)
    );

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    res.json({ success: true, data: cert });
  }
});

// Create new certificate
app.post('/api/certificates', async (req, res) => {
  try {
    const userOrgId = (req as any).user?.org_id;

    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    const newCert: JewelryCertificate = req.body;

    const excessoDeFotos = conferirQuantidadeDeFotos(newCert.images);
    if (excessoDeFotos) {
      return res.status(400).json({ success: false, message: excessoDeFotos });
    }

    // Ensure unique ID and timestamps
    const certCode = newCert.id || `CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const uuidId = uuidv4(); // UUID válido para o Supabase

    if (!newCert.serialNumber) {
      newCert.serialNumber = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Gerar hash de autenticidade
    const authHash = crypto
      .createHash('sha256')
      .update(uuidId + certCode + Date.now())
      .digest('hex');

    // Manter apenas campos essenciais que existem na tabela Supabase (snake_case!)
    const certToSave: any = {
      id: uuidId,
      cert_code: certCode,
      serial_number: newCert.serialNumber,
      title: newCert.title,
      collection: newCert.collection,
      model: newCert.model,
      manufacturer: newCert.manufacturer,
      manufacturer_logo_url: newCert.manufacturerLogoUrl,
      metal_purity: newCert.metalPurity,
      metal_color: newCert.metalColor,
      gross_weight_grams: newCert.grossWeightGrams || 0,
      width_cm: newCert.widthCm || 0,
      finish: newCert.finish,
      has_stones: newCert.hasStones,
      stones: newCert.stones,
      images: newCert.images,
      warranty_months: newCert.warrantyMonths,
      warranty_terms: newCert.warrantyTerms,
      warranty_status: newCert.warrantyStatus,
      estimated_value_brl: newCert.estimatedValueBRL || 0,
      internal_notes: newCert.internalNotes || '',
      current_owner_name: newCert.currentOwnerName,
      owner_cpf: newCert.ownerCpf,
      owner_email: newCert.ownerEmail,
      owner_id: newCert.ownerId,
      issue_date: newCert.issueDate,
      manufacturing_date: newCert.manufacturingDate,
      authenticity_hash: authHash,
      is_root: newCert.isRoot !== undefined ? newCert.isRoot : true,
      parent_cert_id: newCert.parentCertId || null,
      org_id: userOrgId
    };

    const result = await createCertificate(supabase, certToSave);

    console.log(`[POST /api/certificates] Created cert:`, {
      id: uuidId,
      title: newCert.title,
      org_id: userOrgId,
      is_root: certToSave.is_root,
      success: result.success,
      error: result.error
    });

    if (!result.success) {
      const errMsg = result.error || 'Erro ao salvar certificado';
      console.error(`[POST /api/certificates] ERROR:`, errMsg);
      return res.status(400).json({ success: false, message: errMsg });
    }

    // Return the certificate with the correct UUID from Supabase
    const savedCert = result.data || certToSave;
    const transformedData = transformCertificateFromDb(savedCert);
    const responseData = {
      ...newCert,
      id: transformedData.id // Use the UUID from Supabase, not the cert_code
    };

    res.status(201).json({ success: true, data: responseData, message: 'Certificado emitido com sucesso' });
  } catch (error: any) {
    const errorMsg = error?.message || error?.error || JSON.stringify(error) || 'Erro desconhecido';
    res.status(400).json({ success: false, message: errorMsg });
  }
});

// Update existing certificate (e.g., maintenance record or owner transfer)
app.put('/api/certificates/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userOrgId = (req as any).user?.org_id;

    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    // Get existing certificate from Supabase
    const getCertResult = await getCertificateById(supabase, id, userOrgId);
    if (!getCertResult.success || !getCertResult.data) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    const excessoDeFotos = conferirQuantidadeDeFotos(req.body.images);
    if (excessoDeFotos) {
      return res.status(400).json({ success: false, message: excessoDeFotos });
    }

    // Detectar se é uma transferência (mudança de proprietário)
    const isTransfer = req.body.currentOwnerName && req.body.currentOwnerName !== getCertResult.data.currentOwnerName;

    const updatedCert = {
      ...getCertResult.data,
      ...req.body,
      orgId: getCertResult.data.orgId || getCertResult.data.org_id || userOrgId,
      org_id: getCertResult.data.org_id || userOrgId,
      updatedAt: new Date().toISOString()
    };

    // Gerar código de segurança automaticamente se for transferência
    if (isTransfer && req.body.maintenanceHistory && req.body.maintenanceHistory.length > 0) {
      const transferRecord = req.body.maintenanceHistory[0];
      if (transferRecord.type === 'Transferência de Posse' && !transferRecord.verifiedByAppraiser) {
        transferRecord.verifiedByAppraiser = `TRANSFER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      }
    }

    // Update in Supabase
    const updateResult = await updateCertificate(supabase, id, updatedCert, userOrgId);

    if (!updateResult.success) {
      return res.status(400).json({ success: false, message: updateResult.error });
    }

    const transformedData = transformCertificateFromDb(updateResult.data || updatedCert);
    res.json({ success: true, data: transformedData, message: 'Certificado atualizado com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao atualizar certificado' });
  }
});

// Delete certificate
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }

    // Get certificate from Supabase
    const getCertResult = await getCertificateById(supabase, id, userOrgId);
    if (!getCertResult.success || !getCertResult.data) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    const cert = getCertResult.data;
    const isRoot = cert.is_root === true;
    const isChild = cert.is_root === false;

    // Child certificates can always be deleted
    if (isChild) {
      const deleteResult = await deleteCertificate(supabase, id, userOrgId);
      if (!deleteResult.success) {
        return res.status(400).json({ success: false, message: deleteResult.error });
      }
      return res.json({ success: true, message: 'Certificado removido com sucesso' });
    }

    // Check if this is a Root certificate with child certificates
    if (isRoot) {
      // Get all certificates to check for children
      const allCertsResult = await getCertificates(supabase, userOrgId);
      if (allCertsResult.success && allCertsResult.data) {
        const allCerts = allCertsResult.data;
        const childCerts = allCerts.filter(c => {
          if (c.parentCertId === id) return true;
          return c.title.trim().toLowerCase() === cert.title.trim().toLowerCase() && c.id !== id;
        });

        if (childCerts.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Exclusão Proibida: A peça "${cert.title}" possui ${childCerts.length} certificado(s) emitido(s). Remova os certificados filhos antes de deletar a peça.`
          });
        }
      }
    }

    // Delete from Supabase
    const deleteResult = await deleteCertificate(supabase, id, userOrgId);
    if (!deleteResult.success) {
      return res.status(400).json({ success: false, message: deleteResult.error });
    }

    res.json({ success: true, message: 'Certificado removido com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao remover certificado' });
  }
});

// AI Gemologist Assistant route (Gemini)
// --- Upload de fotos de certificado ---
// As fotos vao para o Storage do Supabase, nunca para o banco. Guardar base64
// em jewelry_certificates.images inchava a tabela (~1 MB por certificado),
// pesava no backup e deixava a listagem lenta. Aqui a coluna passa a guardar
// so a URL publica, ~100 caracteres.
const BUCKET_FOTOS = 'certificates-public';
const TIPOS_DE_FOTO: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

app.post('/api/uploads/certificate-image', async (req: any, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ success: false, message: 'Supabase nao configurado no servidor.' });
    }

    const orgId = req.user?.org_id;
    if (!orgId) {
      return res.status(401).json({ success: false, message: 'org_id do usuario nao encontrado. Faca login novamente.' });
    }

    const { dataUrl } = req.body || {};
    if (typeof dataUrl !== 'string' || !dataUrl) {
      return res.status(400).json({ success: false, message: 'Envie a imagem no campo dataUrl.' });
    }

    const partes = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
    if (!partes) {
      return res.status(400).json({ success: false, message: 'dataUrl invalida: esperado data:<tipo>;base64,<conteudo>.' });
    }

    const contentType = partes[1].toLowerCase();
    const extensao = TIPOS_DE_FOTO[contentType];
    if (!extensao) {
      return res.status(400).json({ success: false, message: 'Formato nao aceito. Use JPEG, PNG ou WEBP.' });
    }

    const arquivo = Buffer.from(partes[2], 'base64');
    if (arquivo.length === 0) {
      return res.status(400).json({ success: false, message: 'Imagem vazia.' });
    }
    if (arquivo.length > LIMITE_FOTO_BYTES) {
      return res.status(413).json({ success: false, message: `Imagem acima de ${LIMITE_FOTO_MB} MB.` });
    }

    // O caminho comeca pelo org_id: cada joalheria fica na sua pasta, o que
    // mantem a separacao multi-tenant tambem no Storage.
    const caminho = `${orgId}/${uuidv4()}.${extensao}`;

    const { error: erroUpload } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(caminho, arquivo, { contentType, upsert: false });

    if (erroUpload) {
      return res.status(400).json({ success: false, message: `Falha ao enviar a imagem: ${erroUpload.message}` });
    }

    const { data: publico } = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(caminho);

    res.json({ success: true, url: publico.publicUrl, path: caminho });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Erro ao enviar a imagem.', error: err.message });
  }
});

app.post('/api/gemini/analyze-jewel', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        success: false,
        fallback: true,
        message: 'Chave API do Gemini não configurada no ambiente. Usando sugestões padrão.'
      });
    }

    const { title, metalPurity, metalColor, stones, collection } = req.body;

    const ai = new GoogleGenAI({ apiKey });
    const stonesSummary = stones && stones.length > 0 
      ? stones.map((s: any) => `${s.quantity}x ${s.type} (${s.caratWeight}ct, lapidação ${s.cutShape})`).join(', ')
      : 'Sem gemas cravadas';

    const prompt = `Você é um mestre gemólogo e perito em alta joalheria.
Analise as seguintes especificações de uma joia de luxo e gere uma resposta em JSON estruturado com:
1. "description": Uma descrição elegante e técnica da joia para constar no certificado digital (em Português do Brasil, tom sofisticado de alta joalheria).
2. "careTips": Um array com 3 dicas de conservação e limpeza específicas para essa combinação de metal (${metalPurity} ${metalColor}) e pedras (${stonesSummary}).
3. "marketingHighlight": Um slogan ou destaque lírico para a coleção (${collection || 'Alta Joalheria'}).

Especificações da peça:
- Nome/Título: ${title}
- Metal: ${metalPurity} (${metalColor})
- Pedras: ${stonesSummary}

Responda APENAS um objeto JSON válido, sem marcadores de markdown adicionais se possível.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Sem resposta do modelo');
    }

    const parsedData = JSON.parse(text);
    res.json({ success: true, data: parsedData });

  } catch (err: any) {
    res.status(500).json({ 
      success: false, 
      message: 'Não foi possível consultar a IA no momento.',
      error: err.message 
    });
  }
});

async function migrateDatabase() {
  // Column creation is handled in Supabase dashboard
  // This function is a placeholder for future migrations
}

async function startServer() {
  // Run migrations
  await migrateDatabase();

  // Production build (Vite dev server runs separately)
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

// --- Organizations API ---

// Health check
app.get('/api/organizations/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all organizations
app.get('/api/organizations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, count: data?.length || 0, data: data || [] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get organization by ID
app.get('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase not initialized' });
    }

    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        error: `Failed to fetch organization: ${error.message}`,
        code: error.code
      });
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create organization
app.post('/api/organizations', async (req, res) => {
  try {
    const { name, displayName, website, country, internalNotes, responsibleName, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }

    if (displayName && displayName.length > 18) {
      return res.status(400).json({
        success: false,
        error: 'Nome de Exibição não pode ter mais de 18 caracteres'
      });
    }

    // Validate unique email if provided
    if (email) {
      const { data: existingOrg, error: checkError } = await supabase
        .from('organizations')
        .select('id')
        .eq('email', email)
        .single();

      if (existingOrg) {
        return res.status(400).json({
          success: false,
          error: 'Email já está registrado em outra organização'
        });
      }

      if (checkError && checkError.code !== 'PGRST116') {
      }
    }

    // Generate ID automatically (slug from name)
    const generatedId = `org-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

    const insertData: any = {
      id: generatedId,
      name,
      display_name: displayName || name.substring(0, 18)
    };
    if (website) insertData.website = website;
    if (responsibleName) insertData.responsible_name = responsibleName;
    if (phone) insertData.phone = phone;
    if (email) insertData.email = email;
    if (internalNotes) insertData.internal_notes = internalNotes;

    const { data, error } = await supabase
      .from('organizations')
      .insert([insertData])
      .select();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({
      success: true,
      data: data?.[0],
      message: 'Organização criada com sucesso'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update organization
app.put('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, displayName, website, country, internalNotes, responsibleName, phone, email, logoUrl } = req.body;

    if (displayName && displayName.length > 18) {
      return res.status(400).json({
        success: false,
        error: 'Nome de Exibição não pode ter mais de 18 caracteres'
      });
    }

    // Validate unique email if provided and changed
    if (email) {
      const { data: currentOrg } = await supabase
        .from('organizations')
        .select('email')
        .eq('id', id)
        .single();

      if (currentOrg && currentOrg.email !== email) {
        const { data: existingOrg, error: checkError } = await supabase
          .from('organizations')
          .select('id')
          .eq('email', email)
          .single();

        if (existingOrg) {
          return res.status(400).json({
            success: false,
            error: 'Email já está registrado em outra organização'
          });
        }

        if (checkError && checkError.code !== 'PGRST116') {
        }
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (displayName) updateData.display_name = displayName;
    if (website) updateData.website = website;
    if (responsibleName) updateData.responsible_name = responsibleName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (internalNotes) updateData.internal_notes = internalNotes;
    if (logoUrl) updateData.logo_url = logoUrl;

    const { data, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      data: data?.[0],
      message: 'Organização atualizada com sucesso'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete organization
app.delete('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (id === 'default') {
      return res.status(400).json({
        success: false,
        error: 'Não pode deletar a organização padrão'
      });
    }

    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Organização deletada com sucesso' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Attributes API (Generic CRUD for all attribute types) ---
const createAttributeEndpoints = (tableName: string, apiPath: string) => {
  // GET all
  app.get(`/api/${apiPath}`, async (req, res) => {
    try {
      const userOrgId = (req as any).user?.org_id;

      if (!userOrgId) {
        return res.status(401).json({
          success: false,
          error: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
        });
      }

      const data = await getAttributes(supabase, tableName, userOrgId);
      res.json({ success: true, data, count: data?.length || 0 });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET one
  app.get(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const userOrgId = (req as any).user?.org_id;

      if (!userOrgId) {
        return res.status(401).json({
          success: false,
          error: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
        });
      }

      const data = await getAttribute(supabase, tableName, req.params.id, userOrgId);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // POST
  app.post(`/api/${apiPath}`, async (req, res) => {
    try {
      const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }
      console.log(`[DEBUG POST ${apiPath}] userOrgId=${userOrgId}, DEFAULT_ORG_ID=${DEFAULT_ORG_ID}`);

      if (!userOrgId) {
        return res.status(401).json({
          success: false,
          error: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
        });
      }

      const { name, description, order } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

      const data = await createAttribute(supabase, tableName, userOrgId, { name, description, order });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      console.error(`[ERROR POST ${apiPath}]`, err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT
  app.put(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const userOrgId = (req as any).user?.org_id;

      if (!userOrgId) {
        return res.status(401).json({
          success: false,
          error: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
        });
      }

      const { name, description, order } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

      const data = await updateAttribute(supabase, tableName, req.params.id, userOrgId, { name, description, order });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const userOrgId = (req as any).user?.org_id;

      if (!userOrgId) {
        return res.status(401).json({
          success: false,
          error: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
        });
      }

      await deleteAttribute(supabase, tableName, req.params.id, userOrgId);
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

// --- Audit Logs API ---
app.get('/api/audit-logs', async (req, res) => {
  try {
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    const { data, error, count } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('org_id', userOrgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      count: count || 0,
      limit,
      offset,
      data: data || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET audit log de uma tabela específica
app.get('/api/audit-logs/:table', async (req, res) => {
  try {
    const userOrgId = (req as any).user?.org_id;
    if (!userOrgId) {
      return res.status(401).json({
        success: false,
        message: 'ERRO CRÍTICO: org_id do usuário não foi encontrado. Faça login novamente.'
      });
    }
    const tableName = req.params.table;
    const limit = parseInt(req.query.limit as string) || 50;

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('org_id', userOrgId)
      .eq('table_name', tableName)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({
      success: true,
      table: tableName,
      count: data?.length || 0,
      data: data || []
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Migration: Sync auth_users to Supabase Auth (auth.users table)
app.post('/api/migrate/users-to-auth', async (req, res) => {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_KEY && authKey !== 'admin-secret-key') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    if (!supabase) {
      return res.status(500).json({ success: false, error: 'Supabase not initialized' });
    }

    // Get all ADMIN users from auth_users table
    const { data: authUsers, error: fetchError } = await supabase
      .from('auth_users')
      .select('id, email, name, role')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return res.status(400).json({ success: false, error: fetchError.message });
    }

    const results = {
      total: authUsers?.length || 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as any[]
    };

    const password = '123456';

    // For each user, check if exists in Supabase Auth, if not create
    for (const user of authUsers || []) {
      try {
        console.log(`[MIGRATE] Processing user ${user.email}...`);

        // Check if user exists in auth.users
        const { data: existingAuthUser, error: checkError } = await supabase
          .auth.admin.getUserById(user.id);

        if (existingAuthUser) {
          console.log(`[MIGRATE] User ${user.email} already exists, updating password...`);

          // Update password
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password,
            user_metadata: {
              display_name: user.name,
              role: user.role
            }
          });

          if (updateError) {
            console.error(`[MIGRATE] Failed to update ${user.email}:`, updateError.message);
            results.errors.push({
              email: user.email,
              error: updateError.message
            });
            continue;
          }

          console.log(`[MIGRATE] Updated password for ${user.email}`);
          results.updated++;
          continue;
        }

        // User doesn't exist in Supabase Auth, create with password 123456
        const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
          email: user.email,
          password,
          user_metadata: {
            display_name: user.name,
            role: user.role
          },
          email_confirm: true
        });

        if (createError) {
          console.error(`[MIGRATE] Failed to create ${user.email}:`, createError.message);
          results.errors.push({
            email: user.email,
            error: createError.message
          });
          continue;
        }

        console.log(`[MIGRATE] Created user ${user.email} in Supabase Auth with password 123456`);
        results.created++;
      } catch (err: any) {
        console.error(`[MIGRATE] Exception for ${user.email}:`, err.message);
        results.errors.push({
          email: user.email,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Migration completed: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped, ${results.errors.length} errors`,
      results
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Migration endpoint to convert CPF to numeric
app.post('/api/migrate/cpf-numeric', async (req, res) => {
  const authKey = req.headers['x-admin-key'];
  if (authKey !== process.env.ADMIN_KEY && authKey !== 'admin-secret-key') {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const sql = `
      BEGIN;

      ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_cpf_unique;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS cpf_numeric BIGINT;
      UPDATE customers SET cpf_numeric = CAST(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') AS BIGINT) WHERE cpf IS NOT NULL AND cpf != '';
      ALTER TABLE customers DROP COLUMN cpf;
      ALTER TABLE customers RENAME COLUMN cpf_numeric TO cpf;

      COMMIT;
    `;

    // Use Supabase admin client
    const { error } = await supabase.rpc('run_sql', { query: sql });

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'CPF migration completed successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (!process.env.VERCEL) {
  startServer().then(() => {
    app.listen(PORT, () => {
    });
  });
}

export default app;
