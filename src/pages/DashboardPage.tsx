import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  FileText,
  Users,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../context/CompanyContext';
import { Sidebar } from '../components/Sidebar';
import { StatCard } from '../components/StatCard';

export const DashboardPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    outstanding: 0,
    customers: 0,
    invoices: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentCompany) return;

    const loadStats = async () => {
      try {
        const [invoices, expenses, customers] = await Promise.all([
          supabase
            .from('invoices')
            .select('total, paid_amount, status')
            .eq('company_id', currentCompany.id),
          supabase
            .from('expenses')
            .select('amount, status')
            .eq('company_id', currentCompany.id),
          supabase
            .from('customers')
            .select('id')
            .eq('company_id', currentCompany.id),
        ]);

        const totalRevenue =
          invoices.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
        const totalExpenses =
          expenses.data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
        const outstanding =
          invoices.data?.reduce(
            (sum, inv) =>
              inv.status !== 'paid' ? sum + ((inv.total || 0) - (inv.paid_amount || 0)) : sum,
            0
          ) || 0;

        setStats({
          totalRevenue,
          totalExpenses,
          netProfit: totalRevenue - totalExpenses,
          outstanding,
          customers: customers.data?.length || 0,
          invoices: invoices.data?.length || 0,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [currentCompany]);

  if (!currentCompany) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">Please select a company to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-600 mt-2">{currentCompany.name}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-slate-600">Loading...</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <StatCard
                  title="Total Revenue"
                  value={`${currentCompany.currency} ${stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  icon={<TrendingUp className="w-6 h-6 text-green-600" />}
                  bgColor="bg-green-50"
                />
                <StatCard
                  title="Total Expenses"
                  value={`${currentCompany.currency} ${stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  icon={<Wallet className="w-6 h-6 text-red-600" />}
                  bgColor="bg-red-50"
                />
                <StatCard
                  title="Net Profit"
                  value={`${currentCompany.currency} ${stats.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  icon={<BarChart3 className="w-6 h-6 text-blue-600" />}
                  bgColor="bg-blue-50"
                />
                <StatCard
                  title="Outstanding"
                  value={`${currentCompany.currency} ${stats.outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                  icon={<FileText className="w-6 h-6 text-amber-600" />}
                  bgColor="bg-amber-50"
                />
                <StatCard
                  title="Total Customers"
                  value={stats.customers.toString()}
                  icon={<Users className="w-6 h-6 text-purple-600" />}
                  bgColor="bg-purple-50"
                />
                <StatCard
                  title="Total Invoices"
                  value={stats.invoices.toString()}
                  icon={<FileText className="w-6 h-6 text-indigo-600" />}
                  bgColor="bg-indigo-50"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                      Create Invoice
                    </button>
                    <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
                      Record Expense
                    </button>
                    <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
                      Add Customer
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Recent Activity
                  </h2>
                  <p className="text-slate-600 text-sm">
                    No recent activity yet
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
