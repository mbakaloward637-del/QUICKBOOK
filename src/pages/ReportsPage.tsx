import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../context/CompanyContext';
import { Sidebar } from '../components/Sidebar';

interface ReportData {
  revenue: number;
  expenses: number;
  profit: number;
  assets: number;
  liabilities: number;
  equity: number;
}

export const ReportsPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [reportData, setReportData] = useState<ReportData>({
    revenue: 0,
    expenses: 0,
    profit: 0,
    assets: 0,
    liabilities: 0,
    equity: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('income');

  useEffect(() => {
    if (!currentCompany) return;
    loadReportData();
  }, [currentCompany]);

  const loadReportData = async () => {
    if (!currentCompany) return;
    try {
      const [invoices, expenses, accounts] = await Promise.all([
        supabase
          .from('invoices')
          .select('total')
          .eq('company_id', currentCompany.id),
        supabase
          .from('expenses')
          .select('amount')
          .eq('company_id', currentCompany.id),
        supabase
          .from('accounts')
          .select('balance, account_type_id')
          .eq('company_id', currentCompany.id),
      ]);

      const revenue =
        invoices.data?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const expensesTotal =
        expenses.data?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

      let assets = 0;
      let liabilities = 0;
      let equity = 0;

      if (accounts.data) {
        accounts.data.forEach((acc: any) => {
          const balance = acc.balance || 0;
          if (acc.account_type_id === '1')
            assets += balance;
          else if (acc.account_type_id === '2')
            liabilities += balance;
          else if (acc.account_type_id === '3')
            equity += balance;
        });
      }

      setReportData({
        revenue,
        expenses: expensesTotal,
        profit: revenue - expensesTotal,
        assets,
        liabilities,
        equity,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const profitMargin = reportData.revenue > 0
    ? ((reportData.profit / reportData.revenue) * 100).toFixed(2)
    : '0.00';

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Financial Reports</h1>
            <p className="text-slate-600 mt-2">
              View financial summaries and analysis
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-600">Loading...</p>
            </div>
          ) : (
            <>
              <div className="mb-8 flex gap-4">
                <button
                  onClick={() => setReportType('income')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    reportType === 'income'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Income Statement
                </button>
                <button
                  onClick={() => setReportType('balance')}
                  className={`px-6 py-2 rounded-lg font-medium transition ${
                    reportType === 'balance'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-900 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Balance Sheet
                </button>
              </div>

              {reportType === 'income' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">
                      Income Statement
                    </h2>

                    <div className="space-y-6">
                      <div className="border-b-2 border-slate-200 pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-700 font-medium">
                            Revenue
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            {currentCompany?.currency}{' '}
                            {reportData.revenue.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="border-b-2 border-slate-200 pb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-slate-700 font-medium">
                            Expenses
                          </span>
                          <span className="text-xl font-bold text-red-600">
                            ({currentCompany?.currency}{' '}
                            {reportData.expenses.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })})
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-900 font-bold text-lg">
                            Net Profit
                          </span>
                          <span
                            className={`text-2xl font-bold ${
                              reportData.profit >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {currentCompany?.currency}{' '}
                            {reportData.profit.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-700">Profit Margin</span>
                          <span className="text-lg font-semibold text-slate-900">
                            {profitMargin}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'balance' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-8">
                      Balance Sheet
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Assets
                        </h3>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-700">Total Assets</span>
                            <span className="text-xl font-bold text-blue-600">
                              {currentCompany?.currency}{' '}
                              {reportData.assets.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                          Liabilities & Equity
                        </h3>
                        <div className="space-y-3">
                          <div className="bg-red-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-700">
                                Liabilities
                              </span>
                              <span className="text-lg font-bold text-red-600">
                                {currentCompany?.currency}{' '}
                                {reportData.liabilities.toLocaleString(
                                  'en-US',
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-4">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-700">Equity</span>
                              <span className="text-lg font-bold text-green-600">
                                {currentCompany?.currency}{' '}
                                {reportData.equity.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-200 bg-slate-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-900 font-bold">
                          Total Liabilities & Equity
                        </span>
                        <span className="text-xl font-bold text-slate-900">
                          {currentCompany?.currency}{' '}
                          {(
                            reportData.liabilities + reportData.equity
                          ).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
