import React, { useState, useEffect } from 'react';
import { JewelryCertificate, Customer, ViewMode, MaintenanceRecord, AppUser } from './types';
import { INITIAL_CERTIFICATES } from './data/sampleCertificates';
import { INITIAL_CUSTOMERS } from './data/sampleCustomers';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CertificatePublicView } from './components/CertificatePublicView';
import { JewelerDashboard } from './components/JewelerDashboard';
import { CustomerManagementView } from './components/CustomerManagementView';
import { CertificateFormModal } from './components/CertificateFormModal';
import { CustomerFormModal } from './components/CustomerFormModal';
import { CustomerDeleteModal } from './components/CustomerDeleteModal';
import { PrintCertificateModal } from './components/PrintCertificateModal';
import { QRScannerModal } from './components/QRScannerModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { OwnershipTransferModal } from './components/OwnershipTransferModal';
import { AIGemologistAssistant } from './components/AIGemologistAssistant';
import { CompanyLogoModal } from './components/CompanyLogoModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { JewelryCustomerLinkModal } from './components/JewelryCustomerLinkModal';
import { JewelryCustomerQueryModal } from './components/JewelryCustomerQueryModal';
import { LoginView } from './components/LoginView';
import { UserManagementModal } from './components/UserManagementModal';
import { CustomerPortalView } from './components/CustomerPortalView';
import { extractCertIdFromInput, findCertificateByQuery } from './utils/certUtils';
import { isRootCert, getChildCertificatesForParent } from './utils/certHierarchy';
import { ShieldAlert, Search, QrCode } from 'lucide-react';

export const getCertIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  return extractCertIdFromInput(window.location.href);
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const stored = localStorage.getItem('aureum_logged_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { return null; }
    }
    return null;
  });
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);

  const getInitialCertificates = (): JewelryCertificate[] => {
    const stored = localStorage.getItem('aureum_certificates');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge initial sample certificates with stored ones (avoid duplicates by ID)
          const storedIds = new Set(parsed.map(c => c.id));
          const missingSamples = INITIAL_CERTIFICATES.filter(c => !storedIds.has(c.id));
          return [...parsed, ...missingSamples];
        }
      } catch (e) {}
    }
    return INITIAL_CERTIFICATES;
  };

  const getInitialCustomers = (): Customer[] => {
    const stored = localStorage.getItem('aureum_customers');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storedIds = new Set(parsed.map(c => c.id));
          const missingSamples = INITIAL_CUSTOMERS.filter(c => !storedIds.has(c.id));
          return [...parsed, ...missingSamples];
        }
      } catch (e) {}
    }
    return INITIAL_CUSTOMERS;
  };

  const [certificates, setCertificates] = useState<JewelryCertificate[]>(getInitialCertificates);
  const [customers, setCustomers] = useState<Customer[]>(getInitialCustomers);

  const [notFoundQuery, setNotFoundQuery] = useState<string | null>(() => {
    const urlCertId = getCertIdFromUrl();
    if (urlCertId) {
      const initialList = getInitialCertificates();
      const found = findCertificateByQuery(initialList, urlCertId);
      if (!found) return urlCertId;
    }
    return null;
  });
  const [selectedCert, setSelectedCert] = useState<JewelryCertificate>(() => {
    const urlCertId = getCertIdFromUrl();
    const initialList = getInitialCertificates();
    if (urlCertId) {
      const found = findCertificateByQuery(initialList, urlCertId);
      if (found) return found;
    }
    return initialList[0];
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const urlCertId = getCertIdFromUrl();
    if (urlCertId) return 'public-passport';
    const storedUser = localStorage.getItem('aureum_logged_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'customer') return 'customer-portal';
      } catch (e) {}
    }
    return 'public-passport';
  });

  const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);

  const navigateToView = (newMode: ViewMode) => {
    if (newMode !== viewMode) {
      setViewHistory(prev => [...prev, viewMode]);
      setViewMode(newMode);
    }
  };

  const handleGoBack = () => {
    if (viewHistory.length > 0) {
      const lastView = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setViewMode(lastView);
    } else {
      if (viewMode === 'public-passport' || viewMode === 'customers') {
        setViewMode(currentUser?.role === 'customer' ? 'customer-portal' : 'jeweler-dashboard');
      } else {
        setViewMode(currentUser?.role === 'customer' ? 'customer-portal' : 'jeweler-dashboard');
      }
    }
  };

  const defaultMainView = currentUser?.role === 'customer' ? 'customer-portal' : 'jeweler-dashboard';
  const canGoBack = viewHistory.length > 0 || viewMode !== defaultMainView;

  const handleLoginSuccess = (user: AppUser) => {
    setCurrentUser(user);
    localStorage.setItem('aureum_logged_user', JSON.stringify(user));
    if (user.role === 'customer') {
      setViewMode('customer-portal');
    } else {
      setViewMode('jeweler-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('aureum_logged_user');
  };

  // Company Brand State
  const [companyName, setCompanyName] = useState<string>(() => {
    return localStorage.getItem('aureum_company_name') || 'Maison Lumière Joias';
  });
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>(() => {
    return localStorage.getItem('aureum_company_logo_url') || 'https://drive.google.com/file/d/1EzDvqFIdNjWtIU4KIxYQtZ3RYQI6BnrR/view?usp=sharing';
  });

  // Certificate Modals state
  const [isCompanyLogoOpen, setIsCompanyLogoOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<JewelryCertificate | null>(null);
  const [selectedCustomerForNewCert, setSelectedCustomerForNewCert] = useState<Customer | null>(null);

  // Customer Modals state
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isCustomerDeleteOpen, setIsCustomerDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetCert, setPrintTargetCert] = useState<JewelryCertificate | null>(null);

  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceTargetCert, setMaintenanceTargetCert] = useState<JewelryCertificate | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetCert, setTransferTargetCert] = useState<JewelryCertificate | null>(null);

  const [isAIGemologistOpen, setIsAIGemologistOpen] = useState(false);
  const [aiTargetCert, setAiTargetCert] = useState<JewelryCertificate | null>(null);

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState<JewelryCertificate | null>(null);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Link Customer Modal State
  const [isLinkCustomerModalOpen, setIsLinkCustomerModalOpen] = useState(false);
  const [linkModalPreSelectedCert, setLinkModalPreSelectedCert] = useState<JewelryCertificate | null>(null);
  const [linkModalPreSelectedCustomer, setLinkModalPreSelectedCustomer] = useState<Customer | null>(null);
  const [selectedCustomerIdInManagement, setSelectedCustomerIdInManagement] = useState<string>('');

  // Query Jewelry Customers Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryTargetCertId, setQueryTargetCertId] = useState<string | null>(null);

  // Theme Switcher State
  const [theme, setTheme] = useState<'luxury-dark' | 'classic-light'>(() => {
    return (localStorage.getItem('aureum_theme') as 'luxury-dark' | 'classic-light') || 'luxury-dark';
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'luxury-dark' ? 'classic-light' : 'luxury-dark';
    setTheme(nextTheme);
    localStorage.setItem('aureum_theme', nextTheme);
  };

  // Load certificates and customers from backend API on mount
  useEffect(() => {
    fetchCertificates();
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (certificates.length > 0) {
      try {
        localStorage.setItem('aureum_certificates', JSON.stringify(certificates));
      } catch (e) {
        console.warn('Could not save certificates to localStorage', e);
      }
    }
  }, [certificates]);

  useEffect(() => {
    if (customers.length > 0) {
      try {
        localStorage.setItem('aureum_customers', JSON.stringify(customers));
      } catch (e) {
        console.warn('Could not save customers to localStorage', e);
      }
    }
  }, [customers]);

  // Sync selected certificate when URL changes via popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const urlCertId = getCertIdFromUrl();
      if (urlCertId && certificates.length > 0) {
        const found = certificates.find(
          c => c.id.toUpperCase() === urlCertId.toUpperCase() ||
               c.serialNumber.toUpperCase() === urlCertId.toUpperCase() ||
               c.authenticityHash?.toUpperCase() === urlCertId.toUpperCase()
        );
        if (found) {
          setSelectedCert(found);
          if (viewMode === 'public-passport') {
            setViewMode('public-passport');
          }
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [certificates, viewMode]);

  // Keep URL path synchronized when viewing public passport or other views
  useEffect(() => {
    if (viewMode === 'public-passport' && selectedCert) {
      const targetPath = `/cert/${selectedCert.id}`;
      if (window.location.pathname !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    } else if (viewMode !== 'public-passport') {
      if (window.location.pathname.startsWith('/cert/') || window.location.pathname.startsWith('/passport/')) {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [selectedCert, viewMode]);

  const fetchCertificates = async () => {
    try {
      const res = await fetch('/api/certificates');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCertificates(data.data);
        localStorage.setItem('aureum_certificates', JSON.stringify(data.data));
        const urlCertId = getCertIdFromUrl();
        if (urlCertId) {
          const matchFromUrl = findCertificateByQuery(data.data, urlCertId);
          if (matchFromUrl) {
            setSelectedCert(matchFromUrl);
            setNotFoundQuery(null);
            return;
          } else {
            try {
              const singleRes = await fetch(`/api/certificates/${encodeURIComponent(urlCertId)}`);
              if (singleRes.ok) {
                const singleData = await singleRes.json();
                if (singleData.success && singleData.data) {
                  setCertificates(prev => {
                    const newList = [singleData.data, ...prev.filter(c => c.id !== singleData.data.id)];
                    localStorage.setItem('aureum_certificates', JSON.stringify(newList));
                    return newList;
                  });
                  setSelectedCert(singleData.data);
                  setNotFoundQuery(null);
                  return;
                }
              }
            } catch (err) {}

            setNotFoundQuery(urlCertId);
            return;
          }
        }
        if (!selectedCert || !data.data.find((c: any) => c.id === selectedCert.id)) {
          setSelectedCert(data.data[0]);
        }
      }
    } catch (e) {
      console.warn('Backend API offline or loading fallback sample data for certificates:', e);
      // Fallback check against local certificates for URL cert ID
      const urlCertId = getCertIdFromUrl();
      if (urlCertId) {
        const match = findCertificateByQuery(certificates, urlCertId);
        if (match) {
          setSelectedCert(match);
          setNotFoundQuery(null);
        } else {
          setNotFoundQuery(urlCertId);
        }
      }
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setCustomers(data.data);
        localStorage.setItem('aureum_customers', JSON.stringify(data.data));
      }
    } catch (e) {
      console.warn('Backend API offline or loading fallback sample data for customers:', e);
    }
  };

  // Customer CRUD Operations
  const handleSaveCustomer = async (custToSave: Customer) => {
    try {
      const existing = customers.find(c => c.id === custToSave.id);
      let updatedList: Customer[];

      if (existing) {
        await fetch(`/api/customers/${custToSave.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(custToSave)
        });
        updatedList = customers.map(c => c.id === custToSave.id ? custToSave : c);
      } else {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(custToSave)
        });
        updatedList = [custToSave, ...customers];
      }

      setCustomers(updatedList);
      setIsCustomerFormOpen(false);
      setEditingCustomer(null);
    } catch (e) {
      console.error('Error saving customer:', e);
    }
  };

  const handleConfirmDeleteCustomer = async (id: string) => {
    const targetCust = customers.find(c => c.id === id);
    const custCpf = targetCust?.cpf?.trim();
    const custName = targetCust?.name?.trim();

    // Identify linked certificates
    const linkedCertIds = new Set(
      certificates
        .filter(c => 
          (c.ownerId && c.ownerId === id) ||
          (custCpf && c.ownerCpf && c.ownerCpf.trim() === custCpf) ||
          (custName && c.currentOwnerName && c.currentOwnerName.trim() === custName)
        )
        .map(c => c.id.toUpperCase())
    );

    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error('Error deleting customer from API:', e);
    }

    const updatedCustomers = customers.filter(c => c.id !== id);
    setCustomers(updatedCustomers);
    localStorage.setItem('aureum_customers', JSON.stringify(updatedCustomers));

    if (linkedCertIds.size > 0) {
      const updatedCerts = certificates.filter(c => !linkedCertIds.has(c.id.toUpperCase()));
      setCertificates(updatedCerts);
      localStorage.setItem('aureum_certificates', JSON.stringify(updatedCerts));

      if (selectedCert && linkedCertIds.has(selectedCert.id.toUpperCase())) {
        if (updatedCerts.length > 0) {
          setSelectedCert(updatedCerts[0]);
        }
      }
    }
  };

  // Handle Mode Change
  const handleSelectMode = (mode: ViewMode) => {
    if (mode === 'create-new') {
      setEditingCert(null);
      setSelectedCustomerForNewCert(null);
      setIsFormModalOpen(true);
    } else if (mode === 'scanner') {
      setIsScannerModalOpen(true);
    } else {
      navigateToView(mode);
    }
  };

  // Search Cert by ID, serial, URL, or customer
  const handleSearchCert = (query: string) => {
    const found = findCertificateByQuery(certificates, query);

    if (found) {
      setSelectedCert(found);
      setNotFoundQuery(null);
      navigateToView('public-passport');
    } else {
      // Check if it matches a customer name/CPF/email
      const q = query.trim().toUpperCase();
      const matchingCust = customers.find(c => 
        c.name.toUpperCase().includes(q) || 
        c.cpf.includes(query) || 
        c.email.toUpperCase().includes(q)
      );
      if (matchingCust) {
        setNotFoundQuery(null);
        navigateToView('customers');
      } else {
        const cleanCode = extractCertIdFromInput(query) || query;
        setNotFoundQuery(cleanCode);
        navigateToView('public-passport');
      }
    }
  };

  // Save Certificate (Create or Update)
  const handleSaveCertificate = async (certToSave: JewelryCertificate) => {
    try {
      const existing = certificates.find(c => c.id === certToSave.id);
      let updatedList: JewelryCertificate[];

      if (existing) {
        // Update API
        await fetch(`/api/certificates/${certToSave.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certToSave)
        });
        updatedList = certificates.map(c => c.id === certToSave.id ? certToSave : c);
      } else {
        // Create API
        await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certToSave)
        });
        updatedList = [certToSave, ...certificates];
      }

      setCertificates(updatedList);
      setSelectedCert(certToSave);
      setIsFormModalOpen(false);
      setSelectedCustomerForNewCert(null);
      setViewMode('public-passport');
    } catch (e) {
      console.error('Error saving cert:', e);
    }
  };

  // Delete Certificate trigger & confirm
  const onRequestDeleteCertificate = (cert: JewelryCertificate) => {
    setCertToDelete(cert);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (id: string) => {
    const target = certificates.find(c => c.id.toUpperCase() === id.toUpperCase());
    if (target) {
      const ownerName = target.currentOwnerName?.trim();
      const ownerCpf = target.ownerCpf?.trim();
      const ownerId = target.ownerId?.trim();
      const ownerEmail = target.ownerEmail?.trim();

      const isLinked = Boolean(
        (ownerName && ownerName.length > 0 && ownerName.toLowerCase() !== 'sem proprietário') ||
        (ownerCpf && ownerCpf.length > 0) ||
        (ownerId && ownerId.length > 0) ||
        (ownerEmail && ownerEmail.length > 0)
      );

      if (isLinked) {
        alert(`A exclusão foi bloqueada: A joia "${target.title}" possui um cliente vinculado (${ownerName || 'Cliente Cadastrado'}).`);
        return;
      }
    }

    try {
      const res = await fetch(`/api/certificates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || 'Não foi possível excluir esta joia.');
        return;
      }
    } catch (e) {
      console.error('Error deleting cert from API:', e);
    }
    const updated = certificates.filter(c => c.id.toUpperCase() !== id.toUpperCase());
    setCertificates(updated);
    if (selectedCert?.id.toUpperCase() === id.toUpperCase()) {
      setSelectedCert(null as any);
    }
    // Do not redirect user to another page after deletion
    if (viewMode === 'public-passport') {
      setViewMode('jeweler-dashboard');
    }
  };

  // Add Maintenance Record
  const handleAddMaintenance = async (certId: string, newRecord: any) => {
    const target = certificates.find(c => c.id === certId);
    if (!target) return;

    const updatedCert = {
      ...target,
      maintenanceHistory: [newRecord, ...target.maintenanceHistory]
    };

    setCertificates(prev => prev.map(c => c.id === certId ? updatedCert : c));
    if (selectedCert?.id === certId) {
      setSelectedCert(updatedCert);
    }

    try {
      await fetch(`/api/certificates/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCert)
      });
    } catch (e) {
      console.error('Error adding maintenance:', e);
    }
  };

  // Transfer Ownership
  const handleTransferOwner = async (
    certId: string, 
    newOwnerName: string, 
    ownerCpf?: string, 
    ownerEmail?: string, 
    ownerId?: string
  ) => {
    const target = certificates.find(c => c.id === certId);
    if (!target) return;

    const transferRecord: MaintenanceRecord = {
      id: `m-tr-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Transferência de Posse' as const,
      performer: companyName || 'Maison Lumière',
      notes: `Transferência de titularidade registrada de "${target.currentOwnerName || 'Estoque/Anônimo'}" para "${newOwnerName}".`,
      customerId: ownerId,
      customerName: newOwnerName,
      customerCpf: ownerCpf,
      customerEmail: ownerEmail
    };

    const updatedCert: JewelryCertificate = {
      ...target,
      currentOwnerName: newOwnerName,
      ownerCpf: ownerCpf || target.ownerCpf,
      ownerEmail: ownerEmail || target.ownerEmail,
      ownerId: ownerId || target.ownerId,
      maintenanceHistory: [transferRecord, ...target.maintenanceHistory]
    };

    setCertificates(prev => prev.map(c => c.id === certId ? updatedCert : c));
    if (selectedCert?.id === certId) {
      setSelectedCert(updatedCert);
    }

    try {
      await fetch(`/api/certificates/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCert)
      });
    } catch (e) {
      console.error('Error transferring owner:', e);
    }
  };

  // Unlink Jewelry from Customer
  const handleUnlinkCertificate = async (certId: string, customerId?: string) => {
    const target = certificates.find(c => c.id === certId);
    if (!target) return;

    if (customerId) {
      setSelectedCustomerIdInManagement(customerId);
    } else if (target.ownerId) {
      setSelectedCustomerIdInManagement(target.ownerId);
    }
    setViewMode('customers');

    const previousOwner = target.currentOwnerName || 'Titular';

    const unlinkRecord: MaintenanceRecord = {
      id: `m-un-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Transferência de Posse' as const,
      performer: companyName || 'Maison Lumière',
      notes: `Desvinculação de posse registrada: a joia "${target.title}" foi desvinculada do cliente "${previousOwner}" e retornou ao acervo da joalheria.`,
    };

    const updatedCert: JewelryCertificate = {
      ...target,
      currentOwnerName: '',
      ownerCpf: '',
      ownerEmail: '',
      ownerId: '',
      maintenanceHistory: [unlinkRecord, ...(target.maintenanceHistory || [])]
    };

    setCertificates(prev => prev.map(c => c.id === certId ? updatedCert : c));
    if (selectedCert?.id === certId) {
      setSelectedCert(updatedCert);
    }

    try {
      await fetch(`/api/certificates/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCert)
      });
    } catch (e) {
      console.error('Error unlinking certificate:', e);
    }
  };

  // Confirm Link Jewelry to Customer
  const handleConfirmLinkCustomer = async (
    certId: string, 
    customer: Customer, 
    notes?: string, 
    customIssueDate?: string
  ) => {
    const target = certificates.find(c => c.id === certId);
    if (!target) return;

    // Direct user to customers page and select this customer
    setSelectedCustomerIdInManagement(customer.id);
    setViewMode('customers');

    const issueDateStr = customIssueDate || new Date().toISOString().split('T')[0];

    const targetIsRoot = isRootCert(target);

    // If target is ROOT/PAI or ALREADY owned by another customer, create a NEW CHILD Certificate!
    if (targetIsRoot || (target.currentOwnerName && target.currentOwnerName.trim().length > 0 && target.ownerId !== customer.id)) {
      const parentRootId = targetIsRoot ? target.id : (target.parentCertId || target.id);
      const existingChildren = certificates.filter(c => c.parentCertId === parentRootId || c.title.trim().toLowerCase() === target.title.trim().toLowerCase());
      const newSuffix = existingChildren.length + 1;
      const newCertId = `CERT-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const baseSerial = target.serialNumber.replace(/-\d+$/, '');
      const newSerialNumber = `${baseSerial}-${newSuffix}`;

      const linkRecord: MaintenanceRecord = {
        id: `m-link-${Date.now()}`,
        date: issueDateStr,
        type: 'Emissão de Certificado' as const,
        performer: companyName || 'Maison Lumière',
        notes: notes || `Emissão de passaporte digital (Joia Filha) para "${target.title}" adquirida por "${customer.name}".`,
        customerId: customer.id,
        customerName: customer.name,
        customerCpf: customer.cpf,
        customerEmail: customer.email
      };

      const childCert: JewelryCertificate = {
        ...target,
        id: newCertId,
        isRoot: false,
        parentCertId: parentRootId,
        serialNumber: newSerialNumber,
        issueDate: issueDateStr,
        currentOwnerName: customer.name,
        ownerCpf: customer.cpf,
        ownerEmail: customer.email,
        ownerId: customer.id,
        authenticityHash: `0x${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
        maintenanceHistory: [linkRecord],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCertificates(prev => [childCert, ...prev]);

      try {
        await fetch('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childCert)
        });
      } catch (e) {
        console.error('Error creating child certificate for customer:', e);
      }
    } else {
      // It's already a child certificate in stock or owned by same customer - update directly
      const linkRecord: MaintenanceRecord = {
        id: `m-link-${Date.now()}`,
        date: issueDateStr,
        type: 'Emissão de Certificado' as const,
        performer: companyName || 'Maison Lumière',
        notes: notes || `Vínculo de aquisição/titularidade registrado com sucesso para o cliente "${customer.name}".`,
        customerId: customer.id,
        customerName: customer.name,
        customerCpf: customer.cpf,
        customerEmail: customer.email
      };

      const updatedCert: JewelryCertificate = {
        ...target,
        issueDate: issueDateStr,
        currentOwnerName: customer.name,
        ownerCpf: customer.cpf,
        ownerEmail: customer.email,
        ownerId: customer.id,
        maintenanceHistory: [linkRecord, ...target.maintenanceHistory],
        updatedAt: new Date().toISOString()
      };

      setCertificates(prev => prev.map(c => c.id === certId ? updatedCert : c));
      if (selectedCert?.id === certId) {
        setSelectedCert(updatedCert);
      }

      try {
        await fetch(`/api/certificates/${certId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCert)
        });
      } catch (e) {
        console.error('Error linking customer to cert:', e);
      }
    }
  };

  // Save Company Brand Configuration
  const handleSaveCompanyConfig = async (newName: string, newLogoUrl: string) => {
    setCompanyName(newName);
    setCompanyLogoUrl(newLogoUrl);

    try {
      localStorage.setItem('aureum_company_name', newName);
      localStorage.setItem('aureum_company_logo_url', newLogoUrl);
    } catch (err) {
      console.warn('Não foi possível salvar no localStorage:', err);
    }

    // Update existing certificates with the new brand name & logo
    const updatedCertificates = certificates.map(cert => ({
      ...cert,
      manufacturer: newName,
      manufacturerLogoUrl: newLogoUrl
    }));

    setCertificates(updatedCertificates);
    if (selectedCert) {
      setSelectedCert({
        ...selectedCert,
        manufacturer: newName,
        manufacturerLogoUrl: newLogoUrl
      });
    }

    // Persist updates to API
    for (const cert of updatedCertificates) {
      try {
        await fetch(`/api/certificates/${cert.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cert)
        });
      } catch (e) {
        // quiet catch
      }
    }
  };

  // Render Login Screen or Public Passport if user is not authenticated
  if (!currentUser) {
    const urlCertId = getCertIdFromUrl();
    const publicCertToView = urlCertId 
      ? certificates.find(c => 
          c.id.toUpperCase() === urlCertId.toUpperCase() || 
          c.serialNumber.toUpperCase() === urlCertId.toUpperCase() ||
          c.authenticityHash?.toUpperCase() === urlCertId.toUpperCase()
        )
      : null;

    if (publicCertToView) {
      return (
        <div className={`min-h-screen font-sans ${
          theme === 'classic-light' 
            ? 'theme-classic-light bg-stone-50 text-stone-900' 
            : 'theme-luxury-dark bg-zinc-950 text-amber-50'
        }`}>
          <div className="bg-zinc-950 border-b border-amber-500/30 py-3 px-4 sm:px-8 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-amber-200 font-bold uppercase tracking-wider text-xs sm:text-sm">
                Passaporte Digital Autêntico da Joia • Emissão e Consulta por QR Code
              </span>
            </div>
            <div className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Visualização de Segurança Somente Leitura
            </div>
          </div>

          <main className="max-w-7xl mx-auto p-3 sm:p-6">
            <CertificatePublicView
              cert={{
                ...publicCertToView,
                manufacturer: publicCertToView.manufacturer || companyName,
                manufacturerLogoUrl: publicCertToView.manufacturerLogoUrl || companyLogoUrl
              }}
              currentUser={null}
            />
          </main>
        </div>
      );
    }

    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        theme={theme}
      />
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${
      theme === 'classic-light' 
        ? 'theme-classic-light bg-stone-50 text-stone-900 selection:bg-amber-600 selection:text-white' 
        : 'theme-luxury-dark bg-zinc-950 text-amber-50 selection:bg-amber-500 selection:text-zinc-950'
    }`}>
      
      {/* Top Header Navbar */}
      <Header
        currentMode={viewMode}
        onSelectMode={handleSelectMode}
        onSearchCert={handleSearchCert}
        activeCertId={selectedCert?.id || null}
        totalCertificatesCount={certificates.length}
        totalCustomersCount={customers.length}
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        onOpenCompanyLogoModal={() => setIsCompanyLogoOpen(true)}
        onOpenQueryCustomersModal={() => {
          setQueryTargetCertId(null);
          setIsQueryModalOpen(true);
        }}
        isQueryModalOpen={isQueryModalOpen}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        currentUser={currentUser}
        onOpenUsersModal={() => setIsUsersModalOpen(true)}
        onLogout={handleLogout}
        onGoBack={handleGoBack}
        canGoBack={canGoBack}
      />

      {/* Main Layout with Left Sidebar + Content Area */}
      <div className="flex min-h-[calc(100vh-80px)]">
        <Sidebar
          currentMode={viewMode}
          onSelectMode={handleSelectMode}
          totalCertificatesCount={certificates.length}
          totalCustomersCount={customers.length}
          onOpenQueryCustomersModal={() => {
            setQueryTargetCertId(null);
            setIsQueryModalOpen(true);
          }}
          onOpenLinkCustomerModal={() => setIsLinkCustomerModalOpen(true)}
          onOpenCompanyLogoModal={() => setIsCompanyLogoOpen(true)}
          isQueryModalOpen={isQueryModalOpen}
          theme={theme}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onToggleTheme={handleToggleTheme}
          currentUser={currentUser}
          onOpenUsersModal={() => setIsUsersModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Main View Content Area */}
        <main className="flex-1 min-w-0 pb-16 px-3 sm:px-6 lg:px-8 pt-6 max-w-7xl mx-auto w-full">
        {viewMode === 'public-passport' && notFoundQuery && (
          <div className="max-w-2xl mx-auto my-12 p-8 bg-zinc-950 border border-amber-900/50 rounded-3xl shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif font-bold text-amber-100">
                Passaporte de Joia Não Encontrado
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Não foi possível localizar nenhum certificado registrado no acervo para o código, N° de série ou link consultado:
              </p>
              <div className="inline-block px-4 py-2 bg-zinc-900 border border-amber-500/30 rounded-xl font-mono text-xs text-amber-300 font-bold shadow-sm">
                "{notFoundQuery}"
              </div>
            </div>

            {/* Search & Recovery Actions */}
            <div className="pt-4 border-t border-zinc-900/80 max-w-md mx-auto space-y-4">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const input = (form.elements.namedItem('retrySearch') as HTMLInputElement).value;
                  if (input && input.trim()) {
                    handleSearchCert(input.trim());
                  }
                }} 
                className="flex gap-2"
              >
                <input
                  name="retrySearch"
                  type="text"
                  placeholder="Cole o link ou digite o ID / N° de Série..."
                  className="flex-1 p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-amber-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
              </form>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setNotFoundQuery(null);
                    if (certificates.length > 0) setSelectedCert(certificates[0]);
                    setViewMode(currentUser?.role === 'customer' ? 'customer-portal' : 'jeweler-dashboard');
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-amber-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Voltar ao Início
                </button>
                <button
                  onClick={() => setIsScannerModalOpen(true)}
                  className="px-4 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>Escanear Outro QR Code</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'public-passport' && !notFoundQuery && selectedCert && (
          <CertificatePublicView
            cert={{
              ...selectedCert,
              manufacturer: selectedCert.manufacturer || companyName,
              manufacturerLogoUrl: selectedCert.manufacturerLogoUrl || companyLogoUrl
            }}
            currentUser={currentUser}
            onBackToCustomerPortal={handleGoBack}
            onOpenPrintModal={(c) => {
              setPrintTargetCert(c);
              setIsPrintModalOpen(true);
            }}
            onOpenMaintenanceModal={(c) => {
              setMaintenanceTargetCert(c);
              setIsMaintenanceModalOpen(true);
            }}
            onOpenTransferModal={(c) => {
              setTransferTargetCert(c);
              setIsTransferModalOpen(true);
            }}
            onOpenAIGemologist={(c) => {
              setAiTargetCert(c);
              setIsAIGemologistOpen(true);
            }}
            onDeleteCertificate={onRequestDeleteCertificate}
            onEditCertificate={(c) => {
              setEditingCert(c);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {(viewMode === 'customer-portal' || (currentUser?.role === 'customer' && viewMode !== 'public-passport' && viewMode !== 'scanner')) && currentUser && (
          <CustomerPortalView
            currentUser={currentUser}
            certificates={certificates}
            onSelectCertificate={(c) => {
              setSelectedCert(c);
              navigateToView('public-passport');
            }}
            onOpenPrintModal={(c) => {
              setPrintTargetCert(c);
              setIsPrintModalOpen(true);
            }}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
          />
        )}

        {viewMode === 'jeweler-dashboard' && currentUser?.role !== 'customer' && (
          <JewelerDashboard
            certificates={certificates}
            onSelectCertificate={(c) => {
              setSelectedCert(c);
              navigateToView('public-passport');
            }}
            onOpenCreateModal={() => {
              setEditingCert(null);
              setSelectedCustomerForNewCert(null);
              setIsFormModalOpen(true);
            }}
            onOpenPrintModal={(c) => {
              setPrintTargetCert(c);
              setIsPrintModalOpen(true);
            }}
            onDeleteCertificate={onRequestDeleteCertificate}
            onEditCertificate={(c) => {
              setEditingCert(c);
              setIsFormModalOpen(true);
            }}
            onOpenCompanyLogoModal={() => setIsCompanyLogoOpen(true)}
            onOpenLinkCustomerModal={(cert) => {
              setLinkModalPreSelectedCert(cert || null);
              setLinkModalPreSelectedCustomer(null);
              setIsLinkCustomerModalOpen(true);
            }}
            onOpenQueryCustomersModal={(cert) => {
              setQueryTargetCertId(cert?.id || null);
              setIsQueryModalOpen(true);
            }}
          />
        )}

        {viewMode === 'customers' && currentUser?.role !== 'customer' && (
          <CustomerManagementView
            customers={customers}
            certificates={certificates}
            initialCustomerId={selectedCustomerIdInManagement}
            onOpenCreateCustomer={() => {
              setEditingCustomer(null);
              setIsCustomerFormOpen(true);
            }}
            onEditCustomer={(cust) => {
              setEditingCustomer(cust);
              setIsCustomerFormOpen(true);
            }}
            onDeleteCustomer={(cust) => {
              setCustomerToDelete(cust);
              setIsCustomerDeleteOpen(true);
            }}
            onSelectCertificate={(c) => {
              setSelectedCert(c);
              navigateToView('public-passport');
            }}
            onEditCertificate={(c) => {
              setEditingCert(c);
              setIsFormModalOpen(true);
            }}
            onTransferCertificate={(c) => {
              setTransferTargetCert(c);
              setIsTransferModalOpen(true);
            }}
            onUnlinkCertificate={(c, custId) => {
              if (custId) {
                setSelectedCustomerIdInManagement(custId);
              }
              setViewMode('customers');
              handleUnlinkCertificate(c.id, custId);
            }}
            onCreateCertForCustomer={(cust) => {
              setSelectedCustomerIdInManagement(cust.id);
              setEditingCert(null);
              setSelectedCustomerForNewCert(cust);
              setIsFormModalOpen(true);
            }}
            onOpenLinkCustomerModal={(cust) => {
              if (cust) {
                setSelectedCustomerIdInManagement(cust.id);
              }
              setLinkModalPreSelectedCustomer(cust || null);
              setLinkModalPreSelectedCert(null);
              setIsLinkCustomerModalOpen(true);
            }}
            onOpenPrintModal={(c) => {
              setPrintTargetCert(c);
              setIsPrintModalOpen(true);
            }}
          />
        )}
      </main>
      </div>

      {/* Modals */}
      <CompanyLogoModal
        isOpen={isCompanyLogoOpen}
        onClose={() => setIsCompanyLogoOpen(false)}
        companyName={companyName}
        companyLogoUrl={companyLogoUrl}
        onSaveCompanyConfig={handleSaveCompanyConfig}
      />

      <CustomerFormModal
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        onSave={handleSaveCustomer}
        initialCustomer={editingCustomer}
        existingCustomers={customers}
      />

      <CustomerDeleteModal
        isOpen={isCustomerDeleteOpen}
        onClose={() => setIsCustomerDeleteOpen(false)}
        customerToDelete={customerToDelete}
        onConfirmDelete={handleConfirmDeleteCustomer}
        piecesCount={
          customerToDelete 
            ? certificates.filter(c => c.ownerCpf === customerToDelete.cpf || c.currentOwnerName === customerToDelete.name).length 
            : 0
        }
      />

      <CertificateFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedCustomerForNewCert(null);
        }}
        onSave={handleSaveCertificate}
        initialCert={editingCert}
        onDelete={onRequestDeleteCertificate}
        customers={customers}
        selectedCustomerForNewCert={selectedCustomerForNewCert}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        certToDelete={certToDelete}
        onConfirmDelete={handleConfirmDelete}
      />

      <PrintCertificateModal
        isOpen={isPrintModalOpen}
        onClose={() => {
          setIsPrintModalOpen(false);
          setPrintTargetCert(null);
        }}
        cert={printTargetCert || selectedCert || (certificates.length > 0 ? certificates[0] : null)}
      />

      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        certificates={certificates}
        onSelectCert={(c) => {
          setSelectedCert(c);
          setViewMode('public-passport');
        }}
      />

      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        cert={maintenanceTargetCert || selectedCert}
        onAddMaintenance={handleAddMaintenance}
      />

      <OwnershipTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        cert={transferTargetCert || selectedCert}
        customers={customers}
        onTransferOwner={handleTransferOwner}
      />

      <AIGemologistAssistant
        isOpen={isAIGemologistOpen}
        onClose={() => setIsAIGemologistOpen(false)}
        cert={aiTargetCert || selectedCert}
      />

      <JewelryCustomerLinkModal
        isOpen={isLinkCustomerModalOpen}
        onClose={() => {
          setIsLinkCustomerModalOpen(false);
          setLinkModalPreSelectedCert(null);
          setLinkModalPreSelectedCustomer(null);
        }}
        customers={customers}
        certificates={certificates}
        preSelectedCustomer={linkModalPreSelectedCustomer}
        preSelectedCert={linkModalPreSelectedCert}
        onConfirmLink={handleConfirmLinkCustomer}
      />

      <JewelryCustomerQueryModal
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
        certificates={certificates}
        customers={customers}
        initialCertId={queryTargetCertId}
        onOpenLinkModal={(cert) => {
          setIsQueryModalOpen(false);
          setLinkModalPreSelectedCert(cert);
          setLinkModalPreSelectedCustomer(null);
          setIsLinkCustomerModalOpen(true);
        }}
        onSelectCustomer={(cust) => {
          setIsQueryModalOpen(false);
          setViewMode('customers');
        }}
        onSelectCertForView={(cert) => {
          setIsQueryModalOpen(false);
          setSelectedCert(cert);
          setViewMode('public-passport');
        }}
      />

      <UserManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => setIsUsersModalOpen(false)}
        currentUser={currentUser}
      />

    </div>
  );
}
