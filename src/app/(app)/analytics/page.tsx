"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const [fxMode, setFxMode] = useState<'MATCHED' | 'CONVERTED'>('MATCHED');

  useEffect(() => {
    api.get('/analytics/filters').then(res => {
      if (res.data?.suppliers) setAvailableSuppliers(res.data.suppliers);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [month, year, supplierName, currency]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const params: any = { currency };
      if (month) params.month = month;
      if (year) params.year = year;
      if (supplierName) params.supplier = supplierName;
      
      const res = await api.get('/analytics/summary', { params });
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const primaryData = fxMode === 'MATCHED'
    ? (summary.matched || { invoice_count: 0, subtotal: 0, tax: 0, grand_total: 0 })
    : (summary.converted || { invoice_count: 0, subtotal: 0, tax: 0, grand_total: 0 });
  
  const chartData = [
    { name: 'Subtotal', amount: primaryData?.subtotal || 0 },
    { name: 'Tax', amount: primaryData?.tax || 0 },
    { name: 'Grand Total', amount: primaryData?.grand_total || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">Financial Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Aggregated expenditure and tax breakdown across verified documents</p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6 mb-6 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Analytics Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Year</label>
            <select 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
            >
              <option value="">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Month</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
            >
              <option value="">All Months</option>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <option key={m} value={m}>Month {m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Supplier / Vendor</label>
            <select
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
            >
              <option value="">All Suppliers</option>
              {availableSuppliers.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-xs font-medium text-gray-700">Currency</label>
              <button
                type="button"
                onClick={() => setFxMode(prev => prev === 'MATCHED' ? 'CONVERTED' : 'MATCHED')}
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
              >
                {fxMode === 'MATCHED' ? '⇄ Show FX Total' : '⇄ Show Exact Only'}
              </button>
            </div>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white">
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-gray-200">
          <dt className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Invoices</dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{loading ? '...' : (primaryData?.invoice_count || 0)}</dd>
          <p className="mt-1 text-xs text-gray-500">{fxMode === 'MATCHED' ? `Matching ${currency}` : 'All converted'}</p>
        </div>
        <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-gray-200">
          <dt className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal ({currency})</dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{loading ? '...' : (primaryData?.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
          <p className="mt-1 text-xs text-gray-500">Before tax</p>
        </div>
        <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-gray-200">
          <dt className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Tax ({currency})</dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{loading ? '...' : (primaryData?.tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
          <p className="mt-1 text-xs text-gray-500">VAT / Sales Tax</p>
        </div>
        <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-gray-200">
          <dt className="truncate text-xs font-medium text-gray-500 uppercase tracking-wider">Grand Total ({currency})</dt>
          <dd className="mt-1 text-3xl font-bold tracking-tight text-indigo-600">{loading ? '...' : (primaryData?.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</dd>
          <p className="mt-1 text-xs text-gray-500">{fxMode === 'MATCHED' ? 'Strict currency match' : 'Consolidated at live FX'}</p>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-xl p-6 border border-gray-200">
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Spend Breakdown ({currency})</h3>
        {primaryData?.grand_total === 0 && !loading ? (
           <div className="h-80 flex items-center justify-center text-gray-500">No invoice data available for the selected filters.</div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(val: any) => [`${currency} ${Number(val).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
