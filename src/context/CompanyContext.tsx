import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Company } from '../lib/types';
import { useAuth } from './AuthContext';

interface CompanyContextType {
  companies: Company[];
  currentCompany: Company | null;
  setCurrentCompany: (company: Company | null) => void;
  loadingCompanies: boolean;
  createCompany: (company: Omit<Company, 'id' | 'owner_id' | 'created_at' | 'updated_at'>) => Promise<Company>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      setCurrentCompany(null);
      setLoadingCompanies(false);
      return;
    }

    const loadCompanies = async () => {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .or(`owner_id.eq.${user.id},and(id.in(select company_id from user_roles where user_id='${user.id}'))`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCompanies(data || []);

        if (data && data.length > 0) {
          const savedCompanyId = localStorage.getItem('selectedCompanyId');
          const selected =
            data.find((c) => c.id === savedCompanyId) || data[0];
          setCurrentCompany(selected);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [user]);

  const handleSetCurrentCompany = (company: Company | null) => {
    setCurrentCompany(company);
    if (company) {
      localStorage.setItem('selectedCompanyId', company.id);
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  };

  const createCompany = async (
    company: Omit<
      Company,
      'id' | 'owner_id' | 'created_at' | 'updated_at'
    >
  ): Promise<Company> => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('companies')
      .insert([{ ...company, owner_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create company');

    setCompanies([data, ...companies]);
    return data;
  };

  const updateCompany = async (
    id: string,
    updates: Partial<Company>
  ): Promise<void> => {
    const { error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    setCompanies(
      companies.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        currentCompany,
        setCurrentCompany: handleSetCurrentCompany,
        loadingCompanies,
        createCompany,
        updateCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};
