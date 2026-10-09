"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SuppliersAnalyticsPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [currency, setCurrency] = useState('');
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);

  useEffect(() => {
    api.get('/analytics/filters').then(res => {
      if (res.data?.suppliers) setAvailableSuppliers(res.data.suppliers);
    }).catch(console.error);
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (supplierName) params.supplier = supplierName;
      if (currency) params.currency = currency;
      
      const res = await api.get('/analytics/suppliers', { params });
      setSuppliers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [fromDate, toDate, supplierName, currency]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900">Supplier Analytics</h2>
      </div>

      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Supplier / Vendor</label>
            <select
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
            >
              <option value="">All Suppliers / Vendors</option>
              {availableSuppliers.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white">
              <option value="">All Currencies</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Supplier</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Currency</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Invoice Count</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Subtotal</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Tax</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Grand Total</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Avg Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-4 text-sm text-gray-500">Loading...</td></tr>
              ) : suppliers.map((s, idx) => (
                <tr key={idx}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{s.supplier}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{s.currency}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{s.invoice_count}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{s.subtotal?.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{s.tax?.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-indigo-600 text-right">{s.grand_total?.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{s.average_invoice?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
