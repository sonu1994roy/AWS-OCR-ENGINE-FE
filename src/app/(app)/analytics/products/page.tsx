"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProductsAnalyticsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [sku, setSku] = useState('');
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);

  useEffect(() => {
    api.get('/analytics/filters').then(res => {
      if (res.data?.suppliers) setAvailableSuppliers(res.data.suppliers);
    }).catch(console.error);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (year) params.year = year;
      if (month) params.month = month;
      if (supplierName) params.supplier = supplierName;
      if (sku) params.sku = sku;

      const res = await api.get('/analytics/products', { params });
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [year, month, supplierName, sku]);

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900">Product Analytics</h2>
      </div>

      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Year</label>
            <input type="number" placeholder="e.g. 2026" value={year} onChange={e => setYear(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Month</label>
            <input type="number" placeholder="1-12" value={month} onChange={e => setMonth(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white" />
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
            <label className="block text-xs font-medium text-gray-700">SKU</label>
            <input type="text" placeholder="e.g. GX-77" value={sku} onChange={e => setSku(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white" />
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Product</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Supplier</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Cur</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Qty</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Avg Unit Price</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Total Spend</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Invoices</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-4 text-sm text-gray-500">Loading...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-4 text-sm text-gray-500">No data found for the selected filters</td></tr>
              ) : products.map((p, idx) => (
                <tr key={idx}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">{p.sku}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{p.product}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{p.supplier}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{p.currency}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{p.quantity}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{p.average_unit_price?.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-indigo-600 text-right">{p.total_spend?.toFixed(2)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-right">{p.invoice_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
