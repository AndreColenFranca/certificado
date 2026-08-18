import { useState, useEffect } from 'react';
import { JewelryCertificate, Customer, ViewMode, MaintenanceRecord, AppUser } from './types';
import logoImage from '../assets/logo.jpg';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CertificatePublicView } from './components/CertificatePublicView';
import { CertificateOnlyView } from './components/CertificateOnlyView';
import { JewelerDashboard } from './components/JewelerDashboard';
import { CustomerManagementView } from './components/CustomerManagementView';
import { CertificateFormModal } from './components/CertificateFormModal';
import { CustomerFormModal } from './components/CustomerFormModal';
import { CustomerDeleteModal } from './components/CustomerDeleteModal';
import { PrintCertificateModal } from './components/PrintCertificateModal';
import { MaintenanceModal } from './components/MaintenanceModal';
import { OwnershipTransferModal } from './components/OwnershipTransferModal';
import { CompanyLogoModal } from './components/CompanyLogoModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { JewelryCustomerLinkModal } from './components/JewelryCustomerLinkModal';
import { JewelryCustomerQueryModal } from './components/JewelryCustomerQueryModal';
import { CertificateSearchResultsModal } from './components/CertificateSearchResultsModal';
import { SupabaseLoginView } from './components/SupabaseLoginView';
import { UserManagementModal } from './components/UserManagementModal';
import { CustomerPortalView } from './components/CustomerPortalView';
import { OrganizationsView } from './components/OrganizationsView';
import { AttributesView } from './components/AttributesView';
import { supabaseAuth } from './utils/supabaseAuth';
import { extractCertIdFromInput, findCertificateByQuery, findCertificatesByQuery } from './utils/certUtils';
import { isRootCert } from './utils/certHierarchy';
import { fetchWithAuth } from './utils/fetchWithAuth';
import { ShieldAlert, Search } from 'lucide-react';

export const getCertIdFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  return extractCertIdFromInput(window.location.href);
};

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const stored = sessionStorage.getItem('aureum_logged_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { return null; }
    }
    return null;
  });
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isOrganizationsViewOpen, setIsOrganizationsViewOpen] = useState(false);
  const [orgDisplayName, setOrgDisplayName] = useState<string>('');
  const [customerFormError, setCustomerFormError] = useState<string>('');

  const getInitialCertificates = (): JewelryCertificate[] => [];

  const getInitialCustomers = (): Customer[] => [];

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
    if (urlCertId) {
      if (typeof window !== 'undefined' && (window.location.search.includes('type=certificate') || window.location.search.includes('doc=certificate') || window.location.pathname.startsWith('/certificate/'))) {
        return 'public-certificate';
      }
      return 'public-passport';
    }
    // Tenta recuperar o viewMode salvo
    const storedViewMode = sessionStorage.getItem('aureum_view_mode');
    if (storedViewMode && ['jeweler-dashboard', 'customers', 'customer-portal', 'attributes', 'public-passport', 'public-certificate', 'create-new'].includes(storedViewMode)) {
      return storedViewMode as ViewMode;
    }
    const storedUser = sessionStorage.getItem('aureum_logged_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'customer') return 'customer-portal';
        return 'jeweler-dashboard';
      } catch (e) {}
    }
    return 'jeweler-dashboard';
  });

  const [publicViewTab, setPublicViewTab] = useState<'photo-inspector' | 'specs' | 'history' | 'care'>(() => {
    return 'photo-inspector';
  });

  const [viewHistory, setViewHistory] = useState<ViewMode[]>([]);
  const [searchResults, setSearchResults] = useState<JewelryCertificate[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchResultsModalOpen, setIsSearchResultsModalOpen] = useState(false);

  const handleSelectCert = (cert: JewelryCertificate, tab: 'photo-inspector' | 'specs' | 'history' | 'care' = 'photo-inspector') => {
    setSelectedCert(cert);
    setPublicViewTab(tab);
    navigateToView('public-passport');
  };

  const handlePassportSearch = (query: string) => {
    if (!query.trim()) return;

    const results = findCertificatesByQuery(certificates, query);

    if (results.length === 0) {
      setNotFoundQuery(query);
      setSearchResults([]);
      setIsSearchResultsModalOpen(false);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/cert/${encodeURIComponent(query)}`);
      }
    } else if (results.length === 1) {
      const cert = results[0];
      setSelectedCert(cert);
      setNotFoundQuery(null);
      setSearchResults([]);
      setIsSearchResultsModalOpen(false);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/cert/${encodeURIComponent(cert.id)}`);
      }
    } else {
      setSearchResults(results);
      setSearchQuery(query);
      setIsSearchResultsModalOpen(true);
      setNotFoundQuery(null);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', `/cert/${encodeURIComponent(query)}`);
      }
    }
  };

  const navigateToView = (newMode: ViewMode) => {
    if (newMode !== viewMode) {
      setViewHistory(prev => [...prev, viewMode]);
      setViewMode(newMode);
      if (typeof window !== 'undefined' && newMode !== 'public-passport' && newMode !== 'public-certificate') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handleGoBack = () => {
    let nextMode: ViewMode;
    if (viewHistory.length > 0) {
      nextMode = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
    } else {
      nextMode = currentUser?.role === 'customer' ? 'customer-portal' : 'jeweler-dashboard';
    }
    setViewMode(nextMode);
    if (typeof window !== 'undefined' && nextMode !== 'public-passport' && nextMode !== 'public-certificate') {
      window.history.pushState(null, '', '/');
    }
  };

  const defaultMainView = currentUser?.role === 'customer' ? 'customer-portal' : 'jeweler-dashboard';
  const canGoBack = viewHistory.length > 0 || viewMode !== defaultMainView;

  const handleLoginSuccess = async (user: AppUser) => {
    try {
      // Buscar dados completos do usuário (incluindo org_id, orgName, role)
      const res = await fetchWithAuth('/api/auth/me', {
        method: 'POST',
        body: JSON.stringify({ email: user.email })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const completeUser: AppUser = {
            ...user,
            role: data.data.role || user.role,
            orgId: data.data.orgId,
            orgName: data.data.orgName
          };
          setCurrentUser(completeUser);
        } else {
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(user);
      }
    } catch (e) {
      setCurrentUser(user);
    }

    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch (e) {}
    }
    if (user.role === 'customer') {
      setViewMode('customer-portal');
    } else {
      setViewMode('jeweler-dashboard');
    }

    // Forçar refresh dos dados do novo usuário (sem cache localStorage)
    setTimeout(() => {
      fetchCertificates();
      fetchCustomers();
    }, 100);
  };

  const handleLogout = async () => {
    try {
      await supabaseAuth.signOut();
    } catch (e) {
      console.error('Erro ao fazer logout:', e);
    }

    setCurrentUser(null);
    try {
      sessionStorage.removeItem('aureum_logged_user');
      sessionStorage.removeItem('aureum_certificates');
      sessionStorage.removeItem('aureum_customers');
      sessionStorage.removeItem('aureum_users_db');
    } catch (e) {}
    setViewHistory([]);
    if (typeof window !== 'undefined') {
      try {
        window.history.replaceState(null, '', '/');
      } catch (e) {}
    }
    setViewMode('jeweler-dashboard');
  };

  // Company Brand State
  const [companyName, setCompanyName] = useState<string>('Estilo Raro Joias');
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string>(logoImage);

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

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceTargetCert, setMaintenanceTargetCert] = useState<JewelryCertificate | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferTargetCert, setTransferTargetCert] = useState<JewelryCertificate | null>(null);

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
    return (sessionStorage.getItem('aureum_theme') as 'luxury-dark' | 'classic-light') || 'classic-light';
  });

  const handleToggleTheme = () => {
    const nextTheme = theme === 'luxury-dark' ? 'classic-light' : 'luxury-dark';
    setTheme(nextTheme);
    // sessionStorage.setItem('aureum_theme', nextTheme); // Supabase only
  };

  // Load certificates and customers from backend API on mount
  useEffect(() => {
    fetchCertificates();
    fetchCustomers();
  }, []);

  // Salvar viewMode no localStorage
  useEffect(() => {
    sessionStorage.setItem('aureum_view_mode', viewMode);
  }, [viewMode]);


  // Sync selected certificate and tab when URL changes via popstate
  useEffect(() => {
    const handleLocationChange = () => {
      const urlCertId = getCertIdFromUrl();
      const isCertType = typeof window !== 'undefined' && (window.location.search.includes('type=certificate') || window.location.search.includes('doc=certificate') || window.location.pathname.startsWith('/certificate/'));
      if (isCertType) {
        setPublicViewTab('photo-inspector');
      }
      if (urlCertId && certificates.length > 0) {
        const found = certificates.find(
          c => c.id.toUpperCase() === urlCertId.toUpperCase() ||
               c.serialNumber.toUpperCase() === urlCertId.toUpperCase() ||
               c.authenticityHash?.toUpperCase() === urlCertId.toUpperCase()
        );
        if (found) {
          setSelectedCert(found);
          setNotFoundQuery(null);
          if (isCertType) {
            setViewMode('public-certificate');
          } else if (viewMode === 'public-passport' || viewMode === 'public-certificate') {
            setViewMode('public-passport');
          }
        } else {
          setNotFoundQuery(urlCertId);
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, [certificates, viewMode]);

  // Keep URL path synchronized when viewing public passport or public certificate
  useEffect(() => {
    if ((viewMode === 'public-passport' || viewMode === 'public-certificate') && selectedCert) {
      const isCertType = viewMode === 'public-certificate' || window.location.search.includes('type=certificate');
      const targetPath = `/cert/${encodeURIComponent(selectedCert.id)}${isCertType ? '?type=certificate' : ''}`;
      if (window.location.pathname + window.location.search !== targetPath) {
        window.history.replaceState(null, '', targetPath);
      }
    } else if (viewMode !== 'public-passport' && viewMode !== 'public-certificate') {
      if (window.location.pathname.startsWith('/cert/') || window.location.pathname.startsWith('/passport/')) {
        window.history.replaceState(null, '', '/');
      }
    }
  }, [selectedCert, viewMode, publicViewTab]);

  // Reset notFoundQuery when certificates are loaded and cert exists
  useEffect(() => {
    if (notFoundQuery && certificates.length > 0) {
      const found = findCertificateByQuery(certificates, notFoundQuery);
      if (found) {
        setSelectedCert(found);
        setNotFoundQuery(null);
        if (viewMode !== 'public-passport' && viewMode !== 'public-certificate') {
          navigateToView('public-passport');
        }
      }
    }
  }, [certificates, notFoundQuery, viewMode]);

  // Ensure public certificate view is active when requested via URL parameter
  useEffect(() => {
    if (selectedCert && (window.location.search.includes('type=certificate') || window.location.search.includes('doc=certificate'))) {
      if (viewMode !== 'public-certificate') {
        setViewMode('public-certificate');
      }
    }
  }, [selectedCert]);

  // Fetch organization display name
  useEffect(() => {
    if (currentUser) {
      const orgId = currentUser.orgId || '550e8400-e29b-41d4-a716-446655440000';
      fetchWithAuth(`/api/organizations/${orgId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setOrgDisplayName(data.data.display_name || data.data.name);
          }
        })
        .catch(err => {});
    }
  }, [currentUser]);

  const fetchCertificates = async (forceRefresh = false) => {
    try {
      const res = await fetchWithAuth('/api/certificates');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          setCertificates(data.data);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar certificados:', e);
    }
  };

  const fetchCustomers = async (forceRefresh = false) => {
    try {
      const res = await fetchWithAuth('/api/customers');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCustomers(data.data);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    }
  };

  // Customer CRUD Operations
  const handleSaveCustomer = async (custToSave: Customer) => {
    try {
      const existing = customers.find(c => c.id === custToSave.id);
      let updatedList: Customer[];

      if (existing) {
        await fetchWithAuth(`/api/customers/${custToSave.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(custToSave)
        });
        updatedList = customers.map(c => c.id === custToSave.id ? custToSave : c);
      } else {
        const response = await fetchWithAuth('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(custToSave)
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || data.message || response.statusText);
        }
        updatedList = [custToSave, ...customers];
      }

      setCustomers(updatedList);

      setIsCustomerFormOpen(false);
      setEditingCustomer(null);

      // Invalidate cache and refetch
      setTimeout(() => fetchCustomers(true), 500);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Erro ao salvar cliente';
      setCustomerFormError(errorMsg);
    }
  };

  const handleConfirmDeleteCustomer = async (id: string) => {
    const targetCust = customers.find(c => c.id === id);
    const custCpf = String(targetCust?.cpf || '').trim();
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
      const res = await fetchWithAuth(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        alert('Erro ao deletar no servidor: ' + (data.message || data.error || 'Desconhecido'));
        return;
      }
    } catch (e) {
      console.error('Error deleting customer from API:', e);
      alert('Erro ao deletar: ' + e);
      return;
    }

    const updatedCustomers = customers.filter(c => c.id !== id);
    setCustomers(updatedCustomers);

    // Limpar cliente selecionado se for o deletado
    if (selectedCustomerIdInManagement === id) {
      setSelectedCustomerIdInManagement('');
    }

    if (linkedCertIds.size > 0) {
      const updatedCerts = certificates.filter(c => !linkedCertIds.has(c.id.toUpperCase()));
      setCertificates(updatedCerts);

      if (selectedCert && linkedCertIds.has(selectedCert.id.toUpperCase())) {
        if (updatedCerts.length > 0) {
          setSelectedCert(updatedCerts[0]);
        }
      }
    }

    // Manter na tela de clientes após deletar
    setViewMode('customers');

    // Invalidate cache and refetch
    setTimeout(() => fetchCustomers(true), 500);
  };

  // Handle Mode Change
  const handleSelectMode = (mode: ViewMode) => {
    if (mode === 'create-new') {
      setEditingCert(null);
      setSelectedCustomerForNewCert(null);
      setIsFormModalOpen(true);
    } else if (mode === 'public-passport') {
      // Mostrar tela de busca ao clicar em Passaporte Público
      setSelectedCert(null as any);
      setNotFoundQuery(null);
      navigateToView(mode);
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
        String(c.cpf || '').includes(query) ||
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
      let apiResponse: any;

      if (existing) {
        // Update API
        const res = await fetchWithAuth(`/api/certificates/${certToSave.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certToSave)
        });
        apiResponse = await res.json();
        if (!res.ok) {
          alert('Erro ao atualizar certificado: ' + (apiResponse.error || 'Desconhecido'));
          return;
        }
      } else {
        // Create API
        const res = await fetchWithAuth('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(certToSave)
        });
        apiResponse = await res.json();
        if (!res.ok) {
          alert('Erro ao criar certificado: ' + (apiResponse.error || 'Desconhecido'));
          return;
        }
      }

      // Recarregar certificados do servidor para garantir sincronização
      await fetchCertificates(true);

      setNotFoundQuery(null);
      setIsFormModalOpen(false);
      setSelectedCustomerForNewCert(null);
      setViewMode('jeweler-dashboard');
    } catch (e) {
      alert('Erro ao salvar certificado: ' + e);
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
      const isRoot = target.isRoot === true;
      const isChild = target.isRoot === false;

      // Child certificates can always be deleted
      if (isChild) {
        // Proceed to delete
      } else if (isRoot) {
        // Root certificates can't have linked customers
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
    }

    try {
      const res = await fetchWithAuth(`/api/certificates/${id}`, { method: 'DELETE' });
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
      setNotFoundQuery(null);
      // Redirect to dashboard if viewing deleted certificate
      if (viewMode === 'public-passport' || viewMode === 'public-certificate') {
        window.history.replaceState({}, '', '/');
        setViewMode('jeweler-dashboard');
      }
    }

    // Invalidate cache and refetch
    setTimeout(() => fetchCertificates(true), 500);
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
      await fetchWithAuth(`/api/certificates/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCert)
      });
      // Invalidate cache and refetch
      setTimeout(() => fetchCertificates(true), 500);
    } catch (e) {
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
      performer: companyName || 'Estilo Raro',
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
      await fetchWithAuth(`/api/certificates/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCert)
      });
      // Invalidate cache and refetch
      setTimeout(() => fetchCertificates(true), 500);
    } catch (e) {
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
      performer: companyName || 'Estilo Raro',
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
      await fetchWithAuth(`/api/certificates/${certId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCert)
      });
      // Invalidate cache and refetch
      setTimeout(() => fetchCertificates(true), 500);
    } catch (e) {
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
        performer: companyName || 'Estilo Raro',
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
        ownerId: (customer as any)._uuid || customer.id,
        authenticityHash: `0x${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
        maintenanceHistory: [linkRecord],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCertificates(prev => [childCert, ...prev]);

      try {
        const postRes = await fetchWithAuth('/api/certificates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childCert)
        });

        const postData = await postRes.json();
        const actualCertId = postData.data?.id || childCert.id;

        // Criar registro de manutenção com o UUID correto retornado pelo servidor
        await fetchWithAuth('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certId: actualCertId,
            maintenanceDate: issueDateStr,
            maintenanceType: 'Emissão de Certificado',
            performer: companyName || 'Estilo Raro',
            notes: notes || `Emissão de passaporte digital (Joia Filha) para "${childCert.title}" adquirida por "${customer.name}".`,
            customerName: customer.name,
            customerCpf: String(customer.cpf),
            customerEmail: customer.email
          })
        });

        // Invalidate cache and refetch
        setTimeout(() => fetchCertificates(true), 500);
      } catch (e) {
      }
    } else {
      // It's already a child certificate in stock or owned by same customer - update directly
      const linkRecord: MaintenanceRecord = {
        id: `m-link-${Date.now()}`,
        date: issueDateStr,
        type: 'Emissão de Certificado' as const,
        performer: companyName || 'Estilo Raro',
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
        ownerId: (customer as any)._uuid || customer.id,
        maintenanceHistory: [linkRecord, ...target.maintenanceHistory],
        updatedAt: new Date().toISOString()
      };

      setCertificates(prev => prev.map(c => c.id === certId ? updatedCert : c));
      if (selectedCert?.id === certId) {
        setSelectedCert(updatedCert);
      }

      try {
        await fetchWithAuth(`/api/certificates/${certId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedCert)
        });

        // Criar registro de manutenção
        await fetchWithAuth('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            certId: certId,
            maintenanceDate: issueDateStr,
            maintenanceType: 'Emissão de Certificado',
            performer: companyName || 'Estilo Raro',
            notes: notes || `Vínculo de aquisição/titularidade registrado com sucesso para o cliente "${customer.name}".`,
            customerName: customer.name,
            customerCpf: String(customer.cpf),
            customerEmail: customer.email
          })
        });

        // Invalidate cache and refetch
        setTimeout(() => fetchCertificates(true), 500);
      } catch (e) {
      }
    }
  };

  // Save Company Brand Configuration
  const handleSaveCompanyConfig = async (newName: string, newLogoUrl: string) => {
    setCompanyName(newName);
    setCompanyLogoUrl(newLogoUrl);

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

  // STRICT AUTHENTICATION GUARD: Zero system access without active login session
  if (!currentUser) {
    return (
      <SupabaseLoginView
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
          onOpenOrganizationsView={() => setIsOrganizationsViewOpen(true)}
          onLogout={handleLogout}
        />

        {isOrganizationsViewOpen && currentUser?.isRoot ? (
          <OrganizationsView
            onClose={() => setIsOrganizationsViewOpen(false)}
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
          />
        ) : (
        <>
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
              </div>
            </div>
          </div>
        )}

        {viewMode === 'public-certificate' && !notFoundQuery && selectedCert && (
          <CertificateOnlyView
            cert={{
              ...selectedCert,
              manufacturer: selectedCert.manufacturer || companyName,
              manufacturerLogoUrl: selectedCert.manufacturerLogoUrl || companyLogoUrl
            }}
            currentUser={currentUser}
            onOpenPrintModal={(c) => {
              setPrintTargetCert(c);
              setIsPrintModalOpen(true);
            }}
            onBackToPreviousView={canGoBack ? handleGoBack : undefined}
            onOpenFullPassport={(c) => {
              setSelectedCert(c);
              setPublicViewTab('photo-inspector');
              navigateToView('public-passport');
            }}
          />
        )}

        {viewMode === 'public-passport' && !selectedCert && !notFoundQuery && (
          <div className={`min-h-screen flex items-center justify-center p-6 transition-colors ${theme === 'classic-light' ? 'bg-white text-stone-900' : 'bg-gradient-to-b from-zinc-900 to-zinc-950 text-amber-50'}`}>
            <div className="text-center max-w-md w-full">
              <div className="mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent mb-2">
                  Passaporte Digital
                </h1>
                <p className="text-zinc-400">Consulte o passaporte único de sua joia</p>
              </div>

              <div className="bg-zinc-900/80 border border-amber-900/50 rounded-2xl p-8 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-amber-200 mb-3">
                    Digite o ID, Número de Série ou Cole o Link:
                  </label>
                  <input
                    type="text"
                    id="passport-search"
                    placeholder="ex: cert-2026-001 ou https://domain.com/cert/..."
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-1 ${theme === 'classic-light' ? 'bg-stone-100 border-amber-200 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:ring-amber-500' : 'bg-zinc-800 border-amber-900/40 text-amber-50 placeholder-zinc-500 focus:border-amber-500 focus:ring-amber-500'}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const value = (e.target as HTMLInputElement).value.trim();
                        if (value) {
                          handlePassportSearch(value);
                        }
                      }
                    }}
                  />
                </div>

                <button
                  onClick={() => {
                    const input = document.getElementById('passport-search') as HTMLInputElement;
                    const value = input?.value.trim();
                    if (value) {
                      handlePassportSearch(value);
                    }
                  }}
                  className={`w-full px-6 py-3 font-semibold rounded-lg transition-all shadow-lg ${theme === 'classic-light' ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-900' : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950'} shadow-amber-950/40`}
                >
                  Buscar Passaporte
                </button>
              </div>

              {currentUser?.role !== 'customer' && (
                <button
                  onClick={() => setViewMode('jeweler-dashboard')}
                  className="mt-6 px-6 py-2 text-amber-400 hover:text-amber-300 text-sm font-semibold transition"
                >
                  ← Voltar ao Dashboard
                </button>
              )}
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
            initialTab={publicViewTab}
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
            onDeleteCertificate={onRequestDeleteCertificate}
            onEditCertificate={(c) => {
              setEditingCert(c);
              setIsFormModalOpen(true);
            }}
          />
        )}

        {(viewMode === 'customer-portal' || (currentUser?.role === 'customer' && viewMode !== 'public-passport' && viewMode !== 'public-certificate')) && currentUser && (
          <CustomerPortalView
            currentUser={currentUser}
            certificates={certificates}
            onSelectCertificate={handleSelectCert}
            onOpenPrintModal={(c) => {
              setPrintTargetCert(c);
              setIsPrintModalOpen(true);
            }}
            companyName={companyName}
            companyLogoUrl={companyLogoUrl}
          />
        )}

        {viewMode === 'jeweler-dashboard' && currentUser?.role !== 'customer' && (
          <JewelerDashboard
            certificates={certificates}
            onSelectCertificate={handleSelectCert}
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
            orgDisplayName={orgDisplayName}
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
            onSelectCertificate={handleSelectCert}
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

        {viewMode === 'attributes' && currentUser?.role !== 'customer' && (
          <AttributesView />
        )}
      </main>
        </>
        )}
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
        onClose={() => {
          setIsCustomerFormOpen(false);
          setCustomerFormError('');
        }}
        onSave={handleSaveCustomer}
        serverErrorMessage={customerFormError}
        onClearError={() => setCustomerFormError('')}
        initialCustomer={editingCustomer}
        existingCustomers={customers}
        currentUser={currentUser}
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

      <CertificateSearchResultsModal
        isOpen={isSearchResultsModalOpen}
        results={searchResults}
        query={searchQuery}
        onClose={() => {
          setIsSearchResultsModalOpen(false);
          setSearchResults([]);
          setSearchQuery('');
        }}
        onSelectCertificate={(cert) => {
          handleSelectCert(cert);
        }}
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
          setSelectedCustomerIdInManagement(cust.id);
          setViewMode('customers');
        }}
        onSelectCertForView={(cert, tab) => {
          setIsQueryModalOpen(false);
          handleSelectCert(cert, tab);
        }}
        onOpenPrintModal={(cert) => {
          setIsPrintModalOpen(true);
          setPrintTargetCert(cert);
          setIsQueryModalOpen(false);
        }}
      />

      <UserManagementModal
        isOpen={isUsersModalOpen}
        onClose={() => {
          setIsUsersModalOpen(false);
          fetchCustomers();
        }}
        onCustomerCreated={fetchCustomers}
        currentUser={currentUser}
      />

    </div>
  );
}
