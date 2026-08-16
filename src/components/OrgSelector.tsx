import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { AppUser } from '../types';
import { ROOT_USER_EMAIL } from '../config/constants';
import { fetchWithAuth } from '../utils/fetchWithAuth';

interface Organization {
  id: string;
  name: string;
}

interface OrgSelectorProps {
  selectedOrgId: string;
  onOrgChange: (orgId: string) => void;
  currentUser: AppUser | null;
  disabled?: boolean;
  label?: string;
}

export const OrgSelector: React.FC<OrgSelectorProps> = ({
  selectedOrgId,
  onOrgChange,
  currentUser,
  disabled = false,
  label = 'Organização'
}) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/organizations');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setOrganizations(data.data);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  // Root, Raiz e Admin conseguem selecionar org
  const isAdmin = currentUser?.isRoot || currentUser?.role === 'admin' || currentUser?.role === 'root' || currentUser?.email?.toLowerCase() === ROOT_USER_EMAIL.toLowerCase();
  const isDisabledForUser = disabled || !isAdmin;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        <Building2 className="inline w-4 h-4 mr-2" />
        {label}
      </label>
      <select
        value={selectedOrgId}
        onChange={(e) => onOrgChange(e.target.value)}
        disabled={isDisabledForUser || loading}
        className={`w-full px-4 py-2 border rounded-lg transition-colors ${
          isDisabledForUser
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400'
            : 'bg-white text-gray-900 border-gray-300 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white dark:border-gray-700'
        }`}
      >
        {organizations.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      {!isAdmin && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          ℹ️ Apenas administradores podem alterar a organização
        </p>
      )}
    </div>
  );
};
