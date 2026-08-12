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
// Login Endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Informe e-mail e senha' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = usersDb.find(u => u.email.toLowerCase() === cleanEmail);

    if (user) {
      if (user.password !== password) {
        return res.status(401).json({ success: false, message: 'Senha incorreta para o e-mail informado' });
      }
      const { password: _, ...userWithoutPassword } = user;
      return res.json({
        success: true,
        message: 'Autenticação realizada com sucesso',
        user: userWithoutPassword
      });
    }

    // Fallback: Check if email exists in customersDb
    const matchedCustomer = customersDb.find(c => c.email.toLowerCase() === cleanEmail);
    if (matchedCustomer) {
      const customerUser = {
        id: `user-customer-${matchedCustomer.id}`,
        name: matchedCustomer.name,
        email: matchedCustomer.email,
        role: 'customer',
        customerId: matchedCustomer.id,
        cpf: matchedCustomer.cpf,
        createdAt: matchedCustomer.createdAt || new Date().toISOString(),
        isRoot: false
      };
      return res.json({
        success: true,
        message: 'Autenticação de Cliente realizada com sucesso',
        user: customerUser
      });
    }

    return res.status(401).json({ success: false, message: 'E-mail ou senha incorretos' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Erro ao autenticar usuário' });
  }
});

// Get all registered users
app.get('/api/users', (req, res) => {
  const usersList = usersDb.map(({ password, ...u }) => u);
  res.json({ success: true, count: usersList.length, data: usersList });
});

// Create new user (Only allowed if performed by Root or master request)
app.post('/api/users', (req, res) => {
  try {
    const { requesterEmail, name, email, password, role } = req.body;

    // Verify if requester is Root
    const isRequesterRoot = requesterEmail && requesterEmail.trim().toLowerCase() === 'andreluiz.colen@gmail.com';
    if (!isRequesterRoot) {
      return res.status(403).json({
        success: false,
        message: 'Apenas o Usuário Raiz (andreluiz.colen@gmail.com) possui permissão para cadastrar novos usuários.'
      });
    }

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

    res.status(201).json({
      success: true,
      data: safeUser,
      message: `Usuário ${name} cadastrado com sucesso por permissão Raiz`
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Erro ao cadastrar usuário' });
  }
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const id = req.params.id;
  const target = usersDb.find(u => u.id === id);

  if (!target) {
    return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
  }

  if (target.isRoot || target.email.toLowerCase() === 'andreluiz.colen@gmail.com') {
    return res.status(403).json({ success: false, message: 'O Usuário Raiz principal não pode ser removido!' });
  }

  usersDb = usersDb.filter(u => u.id !== id);
  res.json({ success: true, message: 'Usuário removido com sucesso' });
});

// --- Customers API ---
// Get all customers
app.get('/api/customers', (req, res) => {
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
  res.json({ success: true, data: updatedCust, message: 'Cliente atualizado com sucesso' });
});

// Delete customer
app.delete('/api/customers/:id', (req, res) => {
  const id = req.params.id;
  const initialLength = customersDb.length;
  customersDb = customersDb.filter(c => c.id !== id && c.cpf !== id);

  if (customersDb.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
  }

  res.json({ success: true, message: 'Cliente removido com sucesso' });
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

startServer();
