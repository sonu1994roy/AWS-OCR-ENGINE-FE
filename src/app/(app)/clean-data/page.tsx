"use client";

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { 
  Download, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Database, 
  Layers, 
  Calendar,
  Building2,
  Coins,
  ShieldCheck,
  TrendingUp,
  RotateCw
} from 'lucide-react';

// FX conversion rates to USD (matching backend)
const FX_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  INR: 0.0116,
};

export default function CleanDataPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [targetCurrency, setTargetCurrency] = useState('ALL');
  const [fxMode, setFxMode] = useState<'MATCHED' | 'CONVERTED'>('MATCHED');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  const fetchCleanData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/clean-data');
      setItems(res.data);
    } catch (e) {
      console.error("Failed to load clean data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCleanData();
  }, []);

  // Extract unique suppliers, years, and currencies dynamically from data
  const { availableSuppliers, availableYears, availableCurrencies } = useMemo(() => {
    const suppliersSet = new Set<string>();
    const yearsSet = new Set<string>();
    const currenciesSet = new Set<string>();

    items.forEach((item) => {
      if (item.Supplier) suppliersSet.add(item.Supplier.trim());
      if (item.Currency) currenciesSet.add(item.Currency.trim().toUpperCase());
      if (item.Date) {
        const y = item.Date.slice(0, 4);
        if (y && !isNaN(Number(y))) yearsSet.add(y);
      }
    });

    return {
      availableSuppliers: Array.from(suppliersSet).sort(),
      availableYears: Array.from(yearsSet).sort().reverse(),
      availableCurrencies: Array.from(currenciesSet).sort()
    };
  }, [items]);

  // Filter items based on user criteria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemDateStr = item.Date || '';
      const itemSupplier = (item.Supplier || '').trim().toLowerCase();
      const itemCurr = (item.Currency || 'USD').trim().toUpperCase();

      // Currency filter if exact mode and targetCurrency is not ALL
      if (fxMode === 'MATCHED' && targetCurrency && targetCurrency !== 'ALL') {
        if (itemCurr !== targetCurrency.toUpperCase()) return false;
      }

      // Supplier filter
      if (selectedSupplier && itemSupplier !== selectedSupplier.trim().toLowerCase()) {
        return false;
      }

      // From date filter (itemDateStr format: YYYY-MM-DD)
      if (fromDate && itemDateStr && itemDateStr < fromDate) {
        return false;
      }

      // To date filter
      if (toDate && itemDateStr && itemDateStr > toDate) {
        return false;
      }

      // Year filter
      if (selectedYear && itemDateStr) {
        if (!itemDateStr.startsWith(selectedYear)) return false;
      }

      // Month filter (01 to 12)
      if (selectedMonth && itemDateStr) {
        const m = itemDateStr.slice(5, 7);
        if (m !== selectedMonth) return false;
      }

      // Search query (SKU, Product, Supplier, Invoice)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          (item.Product || '').toLowerCase().includes(q) ||
          (item.SKU || '').toLowerCase().includes(q) ||
          (item.Supplier || '').toLowerCase().includes(q) ||
          (item.Invoice || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [items, fxMode, targetCurrency, selectedSupplier, fromDate, toDate, selectedYear, selectedMonth, searchQuery]);

  // Calculate Spend Totals for the filtered dataset
  const { totalSpend, uniqueInvoices, spendByCurrency } = useMemo(() => {
    let spend = 0;
    const invoices = new Set<string>();
    const byCurr: Record<string, number> = {};

    filteredItems.forEach((item) => {
      if (item.Invoice) invoices.add(item.Invoice);
      const lineTotal = Number(item['Line Total'] || 0);
      const itemCurr = (item.Currency || 'USD').toUpperCase();
      byCurr[itemCurr] = (byCurr[itemCurr] || 0) + lineTotal;

      if (fxMode === 'CONVERTED') {
        const convTarget = targetCurrency === 'ALL' ? 'USD' : targetCurrency;
        const itemRate = FX_TO_USD[itemCurr] || 1.0;
        const targetRate = FX_TO_USD[convTarget.toUpperCase()] || 1.0;
        const totalInUSD = lineTotal * itemRate;
        const converted = totalInUSD / targetRate;
        spend += converted;
      } else {
        spend += lineTotal;
      }
    });

    return { totalSpend: spend, uniqueInvoices: invoices.size, spendByCurrency: byCurr };
  }, [filteredItems, fxMode, targetCurrency]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleExportCSV = () => {
    if (filteredItems.length === 0) return;
    
    const headers = Object.keys(filteredItems[0]).join(',');
    const rows = filteredItems.map(item => {
      return Object.values(item).map(val => {
        const strVal = String(val ?? '');
        return strVal.includes(',') ? `"${strVal}"` : strVal;
      }).join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clean_financial_data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCurrencyBadge = (curr: string) => {
    const c = (curr || 'USD').toUpperCase();
    if (c === 'EUR') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">EUR (€)</span>;
    if (c === 'USD') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">USD ($)</span>;
    if (c === 'GBP') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">GBP (£)</span>;
    if (c === 'INR') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200">INR (₹)</span>;
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-gray-50 text-gray-700 border border-gray-200">{c}</span>;
  };

  const currencySymbol = targetCurrency === 'EUR' ? '€' : targetCurrency === 'USD' ? '$' : targetCurrency === 'GBP' ? '£' : '₹';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Verified Clean Data Ledger</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
              S3 clean/json/
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Normalized financial line items verified by Validator Lambda with deterministic zero-error reconciliation
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={fetchCleanData}
            title="Reload from S3 clean storage"
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredItems.length === 0}
            className="inline-flex items-center rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer"
          >
            <Download className="mr-1.5 h-4 w-4 text-slate-500" />
            Export Clean CSV ({filteredItems.length})
          </button>
        </div>
      </div>

      {/* Global Filter Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Global Filter Control
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setFxMode(prev => prev === 'MATCHED' ? 'CONVERTED' : 'MATCHED');
              setPage(1);
            }}
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition cursor-pointer"
          >
            {fxMode === 'MATCHED' ? '⇄ Switch to FX Consolidated' : '⇄ Switch to Exact Currency'}
          </button>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* From Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">
              From Date
            </label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => { setFromDate(e.target.value); setPage(1); }} 
              placeholder="dd-mm-yyyy"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs" 
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">
              To Date
            </label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => { setToDate(e.target.value); setPage(1); }} 
              placeholder="dd-mm-yyyy"
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs" 
            />
          </div>

          {/* Month & Year Selectors */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">
              Month & Year
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedMonth}
                onChange={e => { setSelectedMonth(e.target.value); setPage(1); }}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs cursor-pointer"
              >
                <option value="">Month</option>
                <option value="01">Jan</option>
                <option value="02">Feb</option>
                <option value="03">Mar</option>
                <option value="04">Apr</option>
                <option value="05">May</option>
                <option value="06">Jun</option>
                <option value="07">Jul</option>
                <option value="08">Aug</option>
                <option value="09">Sep</option>
                <option value="10">Oct</option>
                <option value="11">Nov</option>
                <option value="12">Dec</option>
              </select>

              <select
                value={selectedYear}
                onChange={e => { setSelectedYear(e.target.value); setPage(1); }}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs cursor-pointer"
              >
                <option value="">Year</option>
                {availableYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Supplier / Vendor */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">
              Supplier / Vendor
            </label>
            <select
              value={selectedSupplier}
              onChange={e => { setSelectedSupplier(e.target.value); setPage(1); }}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs cursor-pointer"
            >
              <option value="">All Suppliers / Vendors</option>
              {availableSuppliers.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Target Currency */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">
              Target Currency
            </label>
            <select 
              value={targetCurrency} 
              onChange={e => { setTargetCurrency(e.target.value); setPage(1); }} 
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs cursor-pointer"
            >
              <option value="ALL">All Currencies (By Data)</option>
              {availableCurrencies.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              {!availableCurrencies.includes('INR') && <option value="INR">INR (₹) Indian Rupee</option>}
              {!availableCurrencies.includes('USD') && <option value="USD">USD ($) US Dollar</option>}
              {!availableCurrencies.includes('EUR') && <option value="EUR">EUR (€) Euro</option>}
              {!availableCurrencies.includes('GBP') && <option value="GBP">GBP (£) British Pound</option>}
            </select>
          </div>
        </div>

        {/* Quick Reset Filters Link */}
        {(fromDate || toDate || selectedMonth || selectedYear || selectedSupplier || searchQuery) && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setFromDate('');
                setToDate('');
                setSelectedMonth('');
                setSelectedYear('');
                setSelectedSupplier('');
                setSearchQuery('');
                setPage(1);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Filtered Scope KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Spend */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 font-mono uppercase">
            <span>Filtered Spend {targetCurrency === 'ALL' ? '(Original By Data)' : `(${targetCurrency})`}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${fxMode === 'CONVERTED' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
              {fxMode === 'CONVERTED' ? 'FX Consolidated' : 'By Data Currency'}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {targetCurrency === 'ALL' && fxMode === 'MATCHED' ? (
              Object.keys(spendByCurrency).length === 1 ? (
                `${Object.keys(spendByCurrency)[0] === 'INR' ? '₹' : Object.keys(spendByCurrency)[0] === 'EUR' ? '€' : Object.keys(spendByCurrency)[0] === 'USD' ? '$' : Object.keys(spendByCurrency)[0] === 'GBP' ? '£' : ''}${spendByCurrency[Object.keys(spendByCurrency)[0]].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              ) : Object.keys(spendByCurrency).length > 1 ? (
                <div className="text-sm font-semibold flex flex-wrap gap-1.5 py-1">
                  {Object.entries(spendByCurrency).map(([curr, val]) => (
                    <span key={curr} className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs">
                      {curr}: {val.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  ))}
                </div>
              ) : (
                '0.00'
              )
            ) : (
              `${currencySymbol}${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {fxMode === 'CONVERTED' 
              ? `All filtered items converted to ${targetCurrency === 'ALL' ? 'USD' : targetCurrency}` 
              : targetCurrency === 'ALL' 
                ? 'Showing amounts in original document currencies' 
                : `Only documents in ${targetCurrency}`}
          </div>
        </div>

        {/* Filtered Line Items */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 font-mono uppercase">
            Filtered Line Items
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {filteredItems.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Normalized product records in ledger
          </div>
        </div>

        {/* Invoices Count */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 font-mono uppercase">
            Distinct Invoices / Documents
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
            {uniqueInvoices}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Verified master documents
          </div>
        </div>
      </div>

      {/* Clean Ledger Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search SKU, product, supplier, invoice..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            Showing {filteredItems.length} matching rows
          </div>
        </div>

        {/* Tabular Ledger */}
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/90">
              <tr>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Doc # / Invoice</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Product Description</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Qty</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Unit Price</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Line Total</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">Currency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-slate-400">
                    Loading clean line items from AWS S3...
                  </td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-slate-500">
                    No items match the active filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 font-mono">{item.Date}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold text-indigo-600 font-mono">{item.Invoice}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-800 font-medium max-w-[160px] truncate">{item.Supplier}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 font-mono">{item.SKU}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-900 max-w-xs truncate font-medium">{item.Product}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 text-right font-mono">{item.Quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 text-right font-mono">
                      {Number(item["Unit Price"]).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-slate-900 text-right font-mono">
                      {Number(item["Line Total"]).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-center">
                      {getCurrencyBadge(item.Currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modern Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{((page - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(page * itemsPerPage, filteredItems.length)}</span> of <span className="font-semibold text-slate-800">{filteredItems.length}</span> line items
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (pageNum === 1 || pageNum === totalPages || Math.abs(pageNum - page) <= 1) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} className="px-1 text-slate-400 text-xs">...</span>;
                }
                return null;
              })}

              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
