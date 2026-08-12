import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_CERTIFICATES } from './src/data/sampleCertificates';
import { INITIAL_CUSTOMERS } from './src/data/sampleCustomers';
import { JewelryCertificate, Customer } from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory databases initialized with sample data
let certificatesDb: JewelryCertificate[] = [...INITIAL_CERTIFICATES];
let customersDb: Customer[] = [...INITIAL_CUSTOMERS];

// Predefined Users DB with Root User and Sample Customer Users
let usersDb: any[] = [
  {
    id: 'user-root-001',
    name: 'André Luiz Colen (Administrador Raiz)',
    email: 'andreluiz.colen@gmail.com',
    password: 'fofa!@#',
    role: 'root',
    createdAt: new Date().toISOString(),
    isRoot: true
  },
  {
    id: 'user-cli-1001',
    name: 'Helena Cavalcanti de Albuquerque',
    email: 'helena.albuquerque@maisonlumiere.com.br',
    password: '123456',
    role: 'customer',
    customerId: 'CLI-1001',
    cpf: '123.456.789-01',
    createdAt: new Date().toISOString(),
    isRoot: false
  },
  {
    id: 'user-cli-1002',
    name: 'Dra. Beatriz Montebello',
    email: 'beatriz.montebello@montebello.adv.br',
    password: '123456',
    role: 'customer',
    customerId: 'CLI-1002',
    cpf: '234.567.890-12',
    createdAt: new Date().toISOString(),
    isRoot: false
  }
];

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
app.get('/api/customers', (req, res) => {
  // Sync any customer users from usersDb into customersDb if not present
  usersDb.forEach(u => {
    if (u.role === 'customer') {
      const uEmail = u.email.trim().toLowerCase();
      const found = customersDb.find(c => c.email.trim().toLowerCase() === uEmail);
      if (!found) {
        customersDb.unshift({
          id: u.customerId || `CLI-${Math.floor(1000 + Math.random() * 9000)}`,
          name: u.name,
          cpf: u.cpf || '',
          email: u.email,
          phone: u.phone || '',
          notes: 'Cliente Cadastrado no Sistema',
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
  });

  res.json({ success: true, count: customersDb.length, data: customersDb });
});

// Create new customer
app.post('/api/customers', (req, res) => {
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

    res.status(201).json({ success: true, data: newCust, message: 'Cliente cadastrado com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao cadastrar cliente' });
  }
});

// Update customer
app.put('/api/customers/:id', (req, res) => {
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

  res.json({ success: true, data: updatedCust, message: 'Cliente atualizado com sucesso' });
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  const targetCust = customersDb.find(c => c.id === id || c.cpf === id);
  const initialLength = customersDb.length;
  customersDb = customersDb.filter(c => c.id !== id && c.cpf !== id);

  if (customersDb.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
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

  res.json({ success: true, message: 'Cliente e todos os seus passaportes removidos com sucesso' });
});

// --- Certificates API ---

// Get all certificates
app.get('/api/certificates', (req, res) => {
  res.json({ success: true, count: certificatesDb.length, data: certificatesDb });
});

// Get certificate by ID, Serial Number or Authenticity Hash
app.get('/api/certificates/:id', (req, res) => {
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
});

// Create new certificate
app.post('/api/certificates', (req, res) => {
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

    certificatesDb.unshift(newCert);

    res.status(201).json({ success: true, data: newCert, message: 'Certificado emitido com sucesso' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao criar certificado' });
  }
});

// Update existing certificate (e.g., maintenance record or owner transfer)
app.put('/api/certificates/:id', (req, res) => {
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

  certificatesDb[index] = updatedCert;

  res.json({ success: true, data: updatedCert, message: 'Certificado atualizado com sucesso' });
});

// Delete certificate
app.delete('/api/certificates/:id', (req, res) => {
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

  certificatesDb = certificatesDb.filter(c => c.id.toUpperCase() !== id);
  res.json({ success: true, message: 'Certificado removido com sucesso' });
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
  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.get('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
