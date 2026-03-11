import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, AlertCircle, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCompany } from '../context/CompanyContext';
import { BankAccount, BankTransaction } from '../lib/types';
import { Sidebar } from '../components/Sidebar';

export const BankingPage: React.FC = () => {
  const { currentCompany } = useCompany();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<(BankTransaction & { account_name?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [accountForm, setAccountForm] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    account_type: 'checking',
    currency: 'USD',
  });
  const [transactionForm, setTransactionForm] = useState({
    bank_account_id: '',
    transaction_type: 'deposit',
    amount: 0,
    reference: '',
    description: '',
    transaction_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentCompany) return;
    loadAccounts();
    loadTransactions();
  }, [currentCompany]);

  const loadAccounts = async () => {
    if (!currentCompany) return;
    try {
      const { data, error: err } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setAccounts(data || []);
      if (data && data.length > 0) {
        setSelectedAccount(data[0].id);
        setTransactionForm({
          ...transactionForm,
          bank_account_id: data[0].id,
        });
      }
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    if (!currentCompany) return;
    try {
      const { data, error: err } = await supabase
        .from('bank_transactions')
        .select(
          `
          *,
          bank_accounts (account_name)
        `
        )
        .in('bank_account_id',
          (await supabase
            .from('bank_accounts')
            .select('id')
            .eq('company_id', currentCompany.id)).data?.map((a: any) => a.id) || []
        )
        .order('transaction_date', { ascending: false });

      if (err) throw err;
      const transWithNames = (data || []).map((trans: any) => ({
        ...trans,
        account_name: trans.bank_accounts?.account_name,
      }));
      setTransactions(transWithNames);
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    try {
      setError('');
      const { error: err } = await supabase
        .from('bank_accounts')
        .insert([
          {
            ...accountForm,
            company_id: currentCompany.id,
            balance: 0,
            status: 'active',
          },
        ]);

      if (err) throw err;
      setAccountForm({
        bank_name: '',
        account_number: '',
        account_name: '',
        account_type: 'checking',
        currency: 'USD',
      });
      setShowAccountForm(false);
      loadAccounts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create bank account'
      );
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionForm.bank_account_id) return;

    try {
      setError('');
      const { error: err } = await supabase
        .from('bank_transactions')
        .insert([
          {
            ...transactionForm,
            is_reconciled: false,
          },
        ]);

      if (err) throw err;
      setTransactionForm({
        bank_account_id: selectedAccount,
        transaction_type: 'deposit',
        amount: 0,
        reference: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
      });
      setShowTransactionForm(false);
      loadTransactions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to record transaction'
      );
    }
  };

  const getTotalBalance = () => {
    return accounts.reduce((sum, acc) => sum + acc.balance, 0);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Banking</h1>
              <p className="text-slate-600 mt-2">
                Manage bank accounts and transactions
              </p>
            </div>
            <button
              onClick={() => setShowAccountForm(!showAccountForm)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <Plus className="w-5 h-5" />
              Add Account
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {showAccountForm && (
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">
                Add Bank Account
              </h2>
              <form onSubmit={handleAddAccount} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountForm.bank_name}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          bank_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountForm.account_name}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          account_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={accountForm.account_number}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          account_number: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Account Type
                    </label>
                    <select
                      value={accountForm.account_type}
                      onChange={(e) =>
                        setAccountForm({
                          ...accountForm,
                          account_type: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                      <option value="money_market">Money Market</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAccountForm(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-slate-600">Loading...</p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">
                    Accounts
                  </h2>
                  {accounts.length === 0 ? (
                    <p className="text-slate-600">No bank accounts yet</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {accounts.map((account) => (
                        <div
                          key={account.id}
                          onClick={() => {
                            setSelectedAccount(account.id);
                            setTransactionForm({
                              ...transactionForm,
                              bank_account_id: account.id,
                            });
                          }}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                            selectedAccount === account.id
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-medium text-slate-900">
                                {account.account_name}
                              </p>
                              <p className="text-sm text-slate-600">
                                {account.bank_name}
                              </p>
                            </div>
                            <CreditCard className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Balance</p>
                            <p className="text-lg font-semibold text-slate-900">
                              {account.currency} {account.balance.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedAccount && (
                  <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Transactions
                      </h2>
                      <button
                        onClick={() => setShowTransactionForm(!showTransactionForm)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                      >
                        <Plus className="w-5 h-5" />
                        Add Transaction
                      </button>
                    </div>

                    {showTransactionForm && (
                      <form onSubmit={handleAddTransaction} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-lg">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Type *
                            </label>
                            <select
                              required
                              value={transactionForm.transaction_type}
                              onChange={(e) =>
                                setTransactionForm({
                                  ...transactionForm,
                                  transaction_type: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                              <option value="deposit">Deposit</option>
                              <option value="withdrawal">Withdrawal</option>
                              <option value="transfer">Transfer</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Amount *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={transactionForm.amount}
                              onChange={(e) =>
                                setTransactionForm({
                                  ...transactionForm,
                                  amount: parseFloat(e.target.value),
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={transactionForm.transaction_date}
                              onChange={(e) =>
                                setTransactionForm({
                                  ...transactionForm,
                                  transaction_date: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Reference
                            </label>
                            <input
                              type="text"
                              value={transactionForm.reference}
                              onChange={(e) =>
                                setTransactionForm({
                                  ...transactionForm,
                                  reference: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Description
                            </label>
                            <input
                              type="text"
                              value={transactionForm.description}
                              onChange={(e) =>
                                setTransactionForm({
                                  ...transactionForm,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <button
                            type="submit"
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
                          >
                            Record Transaction
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowTransactionForm(false)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-4 py-2 rounded-lg transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}

                    {transactions.filter((t) => t.bank_account_id === selectedAccount).length === 0 ? (
                      <p className="text-slate-600">No transactions yet</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                                Date
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                                Type
                              </th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                                Description
                              </th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions
                              .filter((t) => t.bank_account_id === selectedAccount)
                              .map((transaction) => (
                                <tr
                                  key={transaction.id}
                                  className="border-b border-slate-200 hover:bg-slate-50 transition"
                                >
                                  <td className="px-4 py-3 text-sm text-slate-600">
                                    {new Date(
                                      transaction.transaction_date
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm capitalize">
                                    <span
                                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                        transaction.transaction_type === 'deposit'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}
                                    >
                                      {transaction.transaction_type}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-slate-900">
                                    {transaction.description}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                                    {transaction.transaction_type === 'deposit'
                                      ? '+'
                                      : '-'}
                                    {transaction.amount.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};
