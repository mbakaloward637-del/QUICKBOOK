import React, { useMemo } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider, useCompany } from './context/CompanyContext';
import { AuthPage } from './pages/AuthPage';
import { SetupPage } from './pages/SetupPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { VendorsPage } from './pages/VendorsPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { BankingPage } from './pages/BankingPage';
import { ReportsPage } from './pages/ReportsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import {
  Building2,
  Briefcase,
  Settings,
  BarChart3,
  FileText,
} from 'lucide-react';

const Router: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentCompany, companies } = useCompany();
  const [route, setRoute] = React.useState('dashboard');

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(2);
      setRoute(hash || 'dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (companies.length === 0) {
    return <SetupPage />;
  }

  switch (route) {
    case 'dashboard':
      return <DashboardPage />;
    case 'customers':
      return <CustomersPage />;
    case 'vendors':
      return <VendorsPage />;
    case 'invoices':
      return <InvoicesPage />;
    case 'expenses':
      return <ExpensesPage />;
    case 'banking':
      return <BankingPage />;
    case 'reports':
      return <ReportsPage />;
    case 'settings':
      return (
        <PlaceholderPage
          title="Settings"
          description="Coming soon - Configure your accounting preferences"
          icon={<Settings className="w-12 h-12 mx-auto" />}
        />
      );
    default:
      return <DashboardPage />;
  }
};

const AppContent: React.FC = () => {
  return (
    <CompanyProvider>
      <Router />
    </CompanyProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
