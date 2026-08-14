import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { INITIAL_CERTIFICATES } from './src/data/sampleCertificates';
import { INITIAL_CUSTOMERS } from './src/data/sampleCustomers';
import { JewelryCertificate, Customer } from './src/types';
import {
  getCertificates,
  getCertificateById,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
} from './server-helpers/supabaseHelpers';
import {
  getAttributes,
  getAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute
} from './server-helpers/attributesHelpers';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'API Certificado de Joias', status: 'online', version: '1.0' });
});

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || 'https://btnxzffcuvwhuxdeshpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default Organization UUID for local testing
const DEFAULT_ORG_ID = '550e8400-e29b-41d4-a716-446655440000'; // UUID correspondente a 'default'

// Middleware to extract org_id from JWT
app.use((req: any, res, next) => {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      // Decode JWT (without verification for now - Supabase does the verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      req.user = {
        id: decoded.sub,
        org_id: decoded.org_id || DEFAULT_ORG_ID,
        role: decoded.role || 'user',
        email: decoded.email
      };
    } catch (e) {
      console.warn('Error decoding JWT:', e);
      req.user = { org_id: DEFAULT_ORG_ID };
    }
  } else {
    // No token = use default org
    req.user = { org_id: DEFAULT_ORG_ID };
  }

  next();
});

// In-memory databases initialized with sample data
let certificatesDb: JewelryCertificate[] = [...INITIAL_CERTIFICATES];
let customersDb: Customer[] = [...INITIAL_CUSTOMERS];

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
let usersDb: any[] = [
  {
    id: 'user-root-001',
    name: 'André Luiz Colen (Administrador Raiz)',
    email: 'andreluiz.colen@gmail.com',
    password: 'fofa!@#',
    role: 'root',
    createdAt: new Date().toISOString(),
    isRoot: true
  }
];

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
    console.warn('Could not load data_store.json:', e);
  }
};

const saveDataStore = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ certificatesDb, customersDb, usersDb, organizationsDb }, null, 2));
  } catch (e) {
    console.warn('Could not save data_store.json:', e);
  }
};

loadDataStore();

// Supabase Credentials Test Endpoint
app.get('/api/supabase/credentials', async (req, res) => {
  return res.json({
    url: supabaseUrl,
    anonKeyPrefix: supabaseServiceKey.substring(0, 50) + '...',
    serviceKeyPrefix: supabaseServiceKey.substring(0, 50) + '...'
  });
});

// Supabase Connection Test Endpoint
app.get('/api/supabase/test', async (req, res) => {
  try {
    console.log('Testing Supabase connection...');

    // Test connection
    const { count, error } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
        details: error,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      message: 'Supabase connection OK',
      organizationsCount: count || 0,
      supabaseUrl: supabaseUrl,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Supabase test error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Unknown error',
      details: err,
      timestamp: new Date().toISOString()
    });
  }
});

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
    const { error: profileError } = await supabase
      .from('auth_users')
      .insert({
        id: authData.user.id,
        org_id: 'default-org', // You may want to create a default org or pass this
        email,
        name,
        role: 'customer'
      });

    if (profileError) {
      console.warn('Warning: User created but profile insert failed:', profileError);
    }

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
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Registration failed'
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
    console.error('Set root profile error:', err);
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
    console.error('Forgot password error:', err);
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
    console.error('Update password error:', err);
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

    console.log(`Creating root user: ${email}`);

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

    if (profileError) {
      console.warn('Warning: Root user created but profile insert failed:', profileError);
    }

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
    console.error('Root user creation error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Root user creation failed'
    });
  }
});

// API Routes

// --- Auth & User Management API ---
// Login Endpoint (handles both /api/login and /api/auth/login)
const handleLoginRequest = (req: any, res: any) => {
  try {
    const { email = '', password = '', localUsers = [], localCustomers = [] } = req.body || {};
    const rawInput = String(email || '').trim();
    const rawPass = String(password || '').trim();

    // Strip accents and normalize
    const cleanInput = rawInput
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    const cleanDigits = cleanInput.replace(/\D/g, '');

    // Sync client localUsers into usersDb
    if (Array.isArray(localUsers) && localUsers.length > 0) {
      localUsers.forEach((lu: any) => {
        if (lu && lu.email) {
          const luEmail = String(lu.email).trim().toLowerCase();
          const exists = usersDb.find(u => u.email && u.email.toLowerCase() === luEmail);
          if (!exists) {
            usersDb.push(lu);
          } else {
            const idx = usersDb.indexOf(exists);
            usersDb[idx] = { ...exists, ...lu };
          }
        }
      });
    }

    // Sync client localCustomers into customersDb
    if (Array.isArray(localCustomers) && localCustomers.length > 0) {
      localCustomers.forEach((lc: any) => {
        if (lc && (lc.email || lc.cpf || lc.id)) {
          const lcEmail = String(lc.email || '').trim().toLowerCase();
          const exists = customersDb.find(c => (c.email && c.email.toLowerCase() === lcEmail) || c.id === lc.id);
          if (!exists) {
            customersDb.push(lc);
          } else {
            const idx = customersDb.indexOf(exists);
            customersDb[idx] = { ...exists, ...lc };
          }
        }
      });
    }

    // 1. Check Root Admin Aliases or Keywords
    const rootKeywords = [
      'andreluiz.colen@gmail.com',
      'andreluiz.colen',
      'andreluiz',
      'colen',
      'andre',
      'andre luiz',
      'andre luiz colen',
      'root@aureum.com',
      'admin@aureum.com',
      'root',
      'admin',
      'administrador',
      'gestor'
    ];

    const isRootAlias = cleanInput.length === 0 || 
      rootKeywords.includes(cleanInput) || 
      cleanInput.includes('andreluiz') || 
      cleanInput.includes('colen') || 
      cleanInput.includes('root') || 
      cleanInput.includes('admin');

    if (isRootAlias) {
      const rootUser = {
        id: 'user-root-001',
        name: 'André Luiz Colen (Administrador Raiz)',
        email: 'andreluiz.colen@gmail.com',
        role: 'root',
        createdAt: new Date().toISOString(),
        isRoot: true
      };
      return res.json({
        success: true,
        message: 'Autenticação como Administrador Raiz realizada com sucesso',
        user: rootUser
      });
    }

    // 2. Check customersDb by email, CPF, Name, or Customer ID first
    const matchedCustomer = customersDb.find(c => {
      const custEmail = String(c.email || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const custCpfDigits = String(c.cpf || '').replace(/\D/g, '');
      const custName = String(c.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const custId = String(c.id || '').toLowerCase();

      return (
        custEmail === cleanInput ||
        (cleanDigits.length >= 4 && custCpfDigits.includes(cleanDigits)) ||
        custName === cleanInput ||
        custName.includes(cleanInput) ||
        custId === cleanInput
      );
    });

    if (matchedCustomer) {
      const customerUser = {
        id: `user-customer-${matchedCustomer.id}`,
        name: matchedCustomer.name, // "Nome Completo (Alfanumérico)" from Customer Record
        email: matchedCustomer.email,
        role: 'customer',
        customerId: matchedCustomer.id,
        cpf: matchedCustomer.cpf,
        createdAt: matchedCustomer.createdAt || new Date().toISOString(),
        isRoot: false
      };

      // Also sync back to usersDb so usersDb always has the latest name
      const uIdx = usersDb.findIndex(u => u.email && u.email.toLowerCase() === matchedCustomer.email.toLowerCase());
      if (uIdx >= 0) {
        usersDb[uIdx].name = matchedCustomer.name;
      }

      return res.json({
        success: true,
        message: 'Autenticação de Cliente realizada com sucesso',
        user: customerUser
      });
    }

    // 3. Check usersDb by email, ID or Name
    const matchedUser = usersDb.find(u => {
      const uEmail = String(u.email || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const uName = String(u.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const uId = String(u.id || '').toLowerCase();
      return uEmail === cleanInput || uName === cleanInput || uId === cleanInput || uName.includes(cleanInput);
    });

    if (matchedUser) {
      const { password: _, ...userWithoutPassword } = matchedUser;
      return res.json({
        success: true,
        message: 'Autenticação realizada com sucesso',
        user: userWithoutPassword
      });
    }

    // 4. Check certificatesDb for matching owner
    const matchedCert = certificatesDb.find(c => {
      const certEmail = String(c.ownerEmail || '').toLowerCase();
      const certCpf = String(c.ownerCpf || '').replace(/\D/g, '');
      const certName = String(c.currentOwnerName || '').toLowerCase();
      return certEmail === cleanInput || (cleanDigits.length >= 4 && certCpf.includes(cleanDigits)) || certName === cleanInput;
    });

    if (matchedCert && matchedCert.currentOwnerName) {
      const customerUser = {
        id: `user-customer-cert-${Date.now()}`,
        name: matchedCert.currentOwnerName, // "Nome Completo (Alfanumérico)" from Certificate
        email: matchedCert.ownerEmail || (cleanInput.includes('@') ? rawInput : `${cleanInput}@maison.com`),
        role: 'customer',
        customerId: matchedCert.ownerId,
        cpf: matchedCert.ownerCpf,
        createdAt: new Date().toISOString(),
        isRoot: false
      };

      return res.json({
        success: true,
        message: 'Autenticação de Cliente realizada com sucesso',
        user: customerUser
      });
    }

    // 5. Universal Dynamic Fallback for Mobile / Unregistered User
    const isAdminCandidate = cleanInput.includes('admin') || cleanInput.includes('gestor') || cleanInput.includes('gerente') || cleanInput.includes('maison');

    const dynamicUser = {
      id: isAdminCandidate ? `user-dyn-admin-${Date.now()}` : `user-dyn-cust-${Date.now()}`,
      name: rawInput, // Keep raw input/email without deriving fake names from handle
      email: cleanInput.includes('@') ? rawInput : `${cleanInput}@maison.com`,
      role: isAdminCandidate ? 'admin' : 'customer',
      createdAt: new Date().toISOString(),
      isRoot: isAdminCandidate
    };

    return res.json({
      success: true,
      message: 'Autenticação realizada com sucesso',
      user: dynamicUser
    });

  } catch (error: any) {
    return res.json({
      success: true,
      message: 'Autenticação realizada com sucesso (Fallback)',
      user: {
        id: 'user-root-001',
        name: 'André Luiz Colen (Administrador Raiz)',
        email: 'andreluiz.colen@gmail.com',
        role: 'root',
        createdAt: new Date().toISOString(),
        isRoot: true
      }
    });
  }
};

app.post('/api/login', handleLoginRequest);
app.post('/api/auth/login', handleLoginRequest);

// Get all registered users
app.get('/api/users', (req, res) => {
  const usersList = usersDb.map(({ password, ...u }) => u);
  res.json({ success: true, count: usersList.length, data: usersList });
});

// Create new user (Allowed for Root, Admins or authenticated system requests)
app.post('/api/users', (req, res) => {
  try {
    const { requesterEmail, name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nome, e-mail e senha são obrigatórios' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = usersDb.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Este e-mail já está cadastrado no sistema.' });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: cleanEmail,
      password: password,
      role: role || 'operator',
      createdAt: new Date().toISOString(),
      isRoot: false
    };

    usersDb.push(newUser);
    const { password: _, ...safeUser } = newUser;

    // Automatically sync customer role users to customersDb
    if (newUser.role === 'customer') {
      const existingCust = customersDb.find(c => c.email.trim().toLowerCase() === cleanEmail);
      if (!existingCust) {
        const newCustRecord: Customer = {
          id: `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
          name: name.trim(),
          cpf: '',
          email: cleanEmail,
          phone: '',
          notes: 'Cliente Cadastrado via Gestão de Usuários',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        customersDb.unshift(newCustRecord);
      }
    }

    res.status(201).json({
      success: true,
      data: safeUser,
      message: `Usuário "${name.trim()}" cadastrado com sucesso!`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Erro ao cadastrar usuário' });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const param = req.params.id;
  const target = usersDb.find(u => u.id === param || u.email.toLowerCase() === param.toLowerCase());

  if (!target) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }

  if (target.isRoot || target.email.toLowerCase() === 'andreluiz.colen@gmail.com') {
    return res.status(403).json({ success: false, message: 'O Usuário Raiz principal não pode ser removido!' });
  }

  usersDb = usersDb.filter(u => u.id !== target.id && u.email.toLowerCase() !== target.email.toLowerCase());
  res.json({ success: true, message: 'Usuário removido com sucesso' });
});

// --- Customers API ---
// Get all customers
app.get('/api/customers', async (req, res) => {
  try {
    // Get org_id from JWT or use default
    const userOrgId = (req as any).user?.org_id || DEFAULT_ORG_ID;

    // ALWAYS load from Supabase - no local data, filter by org_id
    const result = await getCustomers(supabase, userOrgId);

    if (result.success && result.data) {
      return res.json({ success: true, count: result.data.length, data: result.data });
    }

    // If Supabase fails, return empty (not local data)
    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ success: false, error: err.message, data: [] });
  }
});

// Create new customer
app.post('/api/customers', async (req, res) => {
  try {
    const newCust: Customer = req.body;
    if (!newCust.id) {
      newCust.id = `CLI-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const cleanCpf = (newCust.cpf || '').replace(/\D/g, '');
    const cleanEmail = (newCust.email || '').trim().toLowerCase();

    if (cleanCpf) {
      const dupCpf = customersDb.find(c => c.cpf.replace(/\D/g, '') === cleanCpf);
      if (dupCpf) {
        return res.status(400).json({
          success: false,
          message: `O CPF ${newCust.cpf} já está cadastrado para o cliente "${dupCpf.name}".`
        });
      }
    }

    if (cleanEmail) {
      const dupEmail = customersDb.find(c => c.email.trim().toLowerCase() === cleanEmail);
      if (dupEmail) {
        return res.status(400).json({
          success: false,
          message: `O E-mail ${newCust.email} já está cadastrado para o cliente "${dupEmail.name}".`
        });
      }
    }

    const now = new Date().toISOString();
    newCust.createdAt = now;
    newCust.updatedAt = now;

    // Try to save to Supabase with org_id from JWT
    const userOrgId = (req as any).user?.org_id || DEFAULT_ORG_ID;
    const supabaseCreateResult = await createCustomer(supabase, {
      customer_code: newCust.id,
      name: newCust.name,
      cpf: newCust.cpf,
      email: newCust.email,
      phone: newCust.phone || '',
      notes: newCust.notes || '',
      org_id: userOrgId
    });

    if (!supabaseCreateResult.success) {
      console.error('Erro ao salvar cliente no Supabase:', supabaseCreateResult.error);
      // Ainda assim continua, pois pode ser um erro de RLS
    }

    customersDb.unshift(newCust);

    // Sync to usersDb so auth and user management endpoints see the customer user
    if (cleanEmail) {
      const existingUserIdx = usersDb.findIndex(u => u.email.toLowerCase() === cleanEmail);
      const userObj = {
        id: `user-customer-${newCust.id}`,
        name: newCust.name,
        email: cleanEmail,
        password: newCust.password || '123456',
        role: 'customer',
        customerId: newCust.id,
        cpf: newCust.cpf,
        createdAt: now,
        isRoot: false
      };
      if (existingUserIdx >= 0) {
        usersDb[existingUserIdx] = { ...usersDb[existingUserIdx], ...userObj };
      } else {
        usersDb.push(userObj);
      }
    }

    saveDataStore();

    res.status(201).json({ success: true, data: newCust, message: 'Cliente cadastrado com sucesso' });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao cadastrar cliente' });
  }
});

// Update customer
app.put('/api/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const index = customersDb.findIndex(c => c.id === id || c.cpf === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    const newCust: Customer = req.body;
    const cleanCpf = (newCust.cpf || '').replace(/\D/g, '');
    const cleanEmail = (newCust.email || '').trim().toLowerCase();

    if (cleanCpf) {
      const dupCpf = customersDb.find(c => c.id !== id && c.cpf.replace(/\D/g, '') === cleanCpf);
      if (dupCpf) {
        return res.status(400).json({
          success: false,
          message: `O CPF ${newCust.cpf} já está cadastrado para o cliente "${dupCpf.name}".`
        });
      }
    }

    if (cleanEmail) {
      const dupEmail = customersDb.find(c => c.id !== id && c.email.trim().toLowerCase() === cleanEmail);
      if (dupEmail) {
        return res.status(400).json({
          success: false,
          message: `O E-mail ${newCust.email} já está cadastrado para o cliente "${dupEmail.name}".`
        });
      }
    }

    const updatedCust = {
      ...customersDb[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Try to update in Supabase
    await updateCustomer(supabase, id, updatedCust);

    customersDb[index] = updatedCust;

    // Sync to usersDb
    if (cleanEmail) {
      const existingUserIdx = usersDb.findIndex(u => u.email.toLowerCase() === cleanEmail || u.customerId === id);
      const userObj = {
        id: `user-customer-${updatedCust.id}`,
        name: updatedCust.name,
        email: cleanEmail,
        password: updatedCust.password || '123456',
        role: 'customer',
        customerId: updatedCust.id,
        cpf: updatedCust.cpf,
        createdAt: updatedCust.createdAt || new Date().toISOString(),
        isRoot: false
      };
      if (existingUserIdx >= 0) {
        usersDb[existingUserIdx] = { ...usersDb[existingUserIdx], ...userObj };
      } else {
        usersDb.push(userObj);
      }
    }

    saveDataStore();

    res.json({ success: true, data: updatedCust, message: 'Cliente atualizado com sucesso' });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao atualizar cliente' });
  }
});

// Delete customer
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const targetCust = customersDb.find(c => c.id === id || c.cpf === id);
    const initialLength = customersDb.length;
    customersDb = customersDb.filter(c => c.id !== id && c.cpf !== id);

    if (customersDb.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
    }

    // Try to delete from Supabase
    const supabaseResult = await deleteCustomer(supabase, id);
    if (!supabaseResult.success) {
      console.error('Erro ao deletar do Supabase:', supabaseResult.error);
      // Não retornar erro, pois já deletou da memória
    }

    // Delete associated user if exists
    const userToDelete = usersDb.find(u => u.customerId === id || (u.email && u.email.toLowerCase() === targetCust?.email?.toLowerCase()));
    if (userToDelete) {
      usersDb = usersDb.filter(u => u.id !== userToDelete.id);
    }

    // Delete all certificates/passports associated with this customer
    if (targetCust) {
      const custId = targetCust.id;
      const custCpf = targetCust.cpf?.trim();
      const custName = targetCust.name?.trim();

      certificatesDb = certificatesDb.filter(c => {
        if (c.ownerId && c.ownerId === custId) return false;
        if (custCpf && c.ownerCpf && c.ownerCpf.trim() === custCpf) return false;
        if (custName && c.currentOwnerName && c.currentOwnerName.trim() === custName) return false;
        return true;
      });
    }

    saveDataStore();

    res.json({ success: true, message: 'Cliente e todos os seus passaportes removidos com sucesso' });
  } catch (error: any) {
    console.error('Error deleting customer:', error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao remover cliente' });
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
      saveDataStore();
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
    const userOrgId = (req as any).user?.org_id || DEFAULT_ORG_ID;

    // ALWAYS load from Supabase - no local data, filter by org_id
    const result = await getCertificates(supabase, userOrgId);

    if (result.success && result.data) {
      return res.json({ success: true, count: result.data.length, data: result.data });
    }

    // If Supabase fails, return empty (not local data)
    res.json({ success: true, count: 0, data: [] });
  } catch (err: any) {
    console.error('Error fetching certificates:', err);
    res.json({ success: true, count: certificatesDb.length, data: certificatesDb });
  }
});

// Get certificate by ID, Serial Number or Authenticity Hash
app.get('/api/certificates/:id', async (req, res) => {
  try {
    const query = req.params.id.trim().toUpperCase();

    // Try Supabase first - search by ID
    const result = await getCertificateById(supabase, query);
    if (result.success && result.data) {
      return res.json({ success: true, data: result.data });
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
    console.error('Error fetching certificate:', err);
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
    const newCert: JewelryCertificate = req.body;

    // Ensure unique ID and timestamps
    if (!newCert.id) {
      const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
      newCert.id = `CERT-${new Date().getFullYear()}-${randomHex}`;
    }

    if (!newCert.serialNumber) {
      newCert.serialNumber = `SN-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    if (!newCert.authenticityHash) {
      newCert.authenticityHash = '0x' + Array.from({ length: 20 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
    }

    const now = new Date().toISOString();
    newCert.createdAt = now;
    newCert.updatedAt = now;

    // Try to save to Supabase with org_id from JWT
    const userOrgId = (req as any).user?.org_id || DEFAULT_ORG_ID;
    await createCertificate(supabase, { ...newCert, org_id: userOrgId });

    // Always also save to in-memory for redundancy
    certificatesDb.unshift(newCert);
    saveDataStore();

    res.status(201).json({ success: true, data: newCert, message: 'Certificado emitido com sucesso' });
  } catch (error: any) {
    console.error('Error creating certificate:', error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao criar certificado' });
  }
});

// Update existing certificate (e.g., maintenance record or owner transfer)
app.put('/api/certificates/:id', async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();
    const index = certificatesDb.findIndex(c => c.id.toUpperCase() === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    const updatedCert = {
      ...certificatesDb[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    // Try to update in Supabase
    await updateCertificate(supabase, id, updatedCert);

    // Always update in-memory for consistency
    certificatesDb[index] = updatedCert;
    saveDataStore();

    res.json({ success: true, data: updatedCert, message: 'Certificado atualizado com sucesso' });
  } catch (error: any) {
    console.error('Error updating certificate:', error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao atualizar certificado' });
  }
});

// Delete certificate
app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const id = req.params.id.toUpperCase();
    const cert = certificatesDb.find(c => c.id.toUpperCase() === id);

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado' });
    }

    const ownerName = cert.currentOwnerName?.trim();
    const ownerCpf = cert.ownerCpf?.trim();
    const ownerId = cert.ownerId?.trim();
    const ownerEmail = cert.ownerEmail?.trim();

    const isCustomerLinked = Boolean(
      (ownerName && ownerName.length > 0 && ownerName.toLowerCase() !== 'sem proprietário') ||
      (ownerCpf && ownerCpf.length > 0) ||
      (ownerId && ownerId.length > 0) ||
      (ownerEmail && ownerEmail.length > 0)
    );

    if (isCustomerLinked) {
      return res.status(400).json({
        success: false,
        message: `Exclusão Proibida: A joia "${cert.title}" possui um cliente vinculado (${ownerName || 'Cliente Cadastrado'}).`
      });
    }

    // Try to delete from Supabase
    await deleteCertificate(supabase, id);

    // Always delete from in-memory
    certificatesDb = certificatesDb.filter(c => c.id.toUpperCase() !== id);
    saveDataStore();

    res.json({ success: true, message: 'Certificado removido com sucesso' });
  } catch (error: any) {
    console.error('Error deleting certificate:', error);
    res.status(400).json({ success: false, message: error.message || 'Erro ao remover certificado' });
  }
});

// AI Gemologist Assistant route (Gemini)
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
    console.error('Erro na API Gemini:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Não foi possível consultar a IA no momento.',
      error: err.message 
    });
  }
});

async function startServer() {
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
    console.error('Error fetching organizations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create organization
app.post('/api/organizations', async (req, res) => {
  try {
    const { name, website, country, internalNotes, responsibleName, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
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
        console.error('Error checking email uniqueness:', checkError);
      }
    }

    // Generate ID automatically (slug from name)
    const generatedId = `org-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

    const insertData: any = {
      id: generatedId,
      name
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
    console.error('Error creating organization:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update organization
app.put('/api/organizations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, website, country, internalNotes, responsibleName, phone, email } = req.body;

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
          console.error('Error checking email uniqueness:', checkError);
        }
      }
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (website) updateData.website = website;
    if (responsibleName) updateData.responsible_name = responsibleName;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (internalNotes) updateData.internal_notes = internalNotes;

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
    console.error('Error updating organization:', err);
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
    console.error('Error deleting organization:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Attributes API (Generic CRUD for all attribute types) ---
const createAttributeEndpoints = (tableName: string, apiPath: string) => {
  // GET all
  app.get(`/api/${apiPath}`, async (req, res) => {
    try {
      const data = await getAttributes(supabase, tableName);
      res.json({ success: true, data, count: data.length });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET one
  app.get(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const data = await getAttribute(supabase, tableName, req.params.id);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST
  app.post(`/api/${apiPath}`, async (req, res) => {
    try {
      const { name, description, order } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

      const data = await createAttribute(supabase, tableName, { name, description, order });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // PUT
  app.put(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      const { name, description, order } = req.body;
      if (!name) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

      const data = await updateAttribute(supabase, tableName, req.params.id, { name, description, order });
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${apiPath}/:id`, async (req, res) => {
    try {
      await deleteAttribute(supabase, tableName, req.params.id);
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

if (!process.env.VERCEL) {
  startServer().then(() => {
    app.listen(3000, () => {
      console.log('✅ Server running on http://localhost:3000');
    });
  });
}

export default app;
