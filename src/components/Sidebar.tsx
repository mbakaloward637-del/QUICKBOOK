import React from 'react';
import {
  Home,
  Users,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  Briefcase,
  Building2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../context/CompanyContext';
import { useNavigate } from '../hooks/useNavigate';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { companies, currentCompany, setCurrentCompany } = useCompany();
  const [showCompanyMenu, setShowCompanyMenu] = React.useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('auth');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: 'dashboard' },
    { icon: Users, label: 'Customers', path: 'customers' },
    { icon: Building2, label: 'Vendors', path: 'vendors' },
    { icon: FileText, label: 'Invoices', path: 'invoices' },
    { icon: DollarSign, label: 'Expenses', path: 'expenses' },
    { icon: Briefcase, label: 'Reports', path: 'reports' },
    { icon: Settings, label: 'Settings', path: 'settings' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen">
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold">AbanBooks</h2>
        <p className="text-slate-400 text-sm mt-1">v1.0</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {currentCompany && (
          <div className="mb-6">
            <button
              onClick={() => setShowCompanyMenu(!showCompanyMenu)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium text-sm">
                    {currentCompany.name}
                  </div>
                  <div className="text-xs text-slate-400">
                    {currentCompany.currency}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition ${
                  showCompanyMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showCompanyMenu && (
              <div className="mt-2 bg-slate-800 rounded-lg overflow-hidden">
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setCurrentCompany(company);
                      setShowCompanyMenu(false);
                      navigate('dashboard');
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition ${
                      currentCompany.id === company.id
                        ? 'bg-blue-600'
                        : ''
                    }`}
                  >
                    {company.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-800 transition text-left"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700 space-y-3">
        <div className="px-4 py-3 bg-slate-800 rounded-lg">
          <p className="text-xs text-slate-400">Signed in as</p>
          <p className="text-sm font-medium text-white truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition"
        >
          <LogOut className="w-5 h-5" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};
