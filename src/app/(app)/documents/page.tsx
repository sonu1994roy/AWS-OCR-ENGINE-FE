"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Link from 'next/link';
import { 
  FileText, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  GitBranch,
  Filter
} from 'lucide-react';
import { LiveWorkflowModal } from '@/components/workflow/LiveWorkflowModal';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REJECTED'>('ALL');
  const [currencyFilter, setCurrencyFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [activeWorkflowDocId, setActiveWorkflowDocId] = useState<string | null>(null);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = (doc: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${doc.document_id}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  // Deduplicate and filter documents
  const deduplicatedDocs = (() => {
    const seen = new Set<string>();
    const result: any[] = [];
    // Valid records take precedence
    const sorted = [...documents].sort((a, b) => {
      const aVal = a.validation?.valid ? 1 : 0;
      const bVal = b.validation?.valid ? 1 : 0;
      return bVal - aVal;
    });

    for (const doc of sorted) {
      const docNum = doc.data?.document_number || '';
      const docId = doc.document_id || '';
      const cleanNum = docNum.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanId = docId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      
      const key = cleanNum || cleanId;
      if (key && seen.has(key)) {
        continue;
      }
      if (key) seen.add(key);
      result.push(doc);
    }
    return result;
  })();

  const filteredDocs = deduplicatedDocs.filter((doc) => {
    const d = doc.data || {};
    const isValid = doc.validation?.valid;
    
    // Status filter
    if (statusFilter === 'VALID' && !isValid) return false;
    if (statusFilter === 'REJECTED' && isValid) return false;

    // Currency filter
    if (currencyFilter !== 'ALL' && (d.currency || '').toUpperCase() !== currencyFilter) return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (doc.document_id || '').toLowerCase().includes(q) ||
      (d.document_number || '').toLowerCase().includes(q) ||
      (d.supplier?.name || '').toLowerCase().includes(q) ||
      (d.buyer?.name || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getCurrencyBadge = (curr: string) => {
    const c = (curr || 'USD').toUpperCase();
    if (c === 'EUR') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">EUR (€)</span>;
    if (c === 'USD') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">USD ($)</span>;
    if (c === 'GBP') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-purple-50 text-purple-700 border border-purple-200">GBP (£)</span>;
    if (c === 'INR') return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-orange-50 text-orange-700 border border-orange-200">INR (₹)</span>;
    return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-gray-50 text-gray-700 border border-gray-200">{c}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Document Master Ledger</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Master Register
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Complete archive of ingested financial documents with deterministic validation results
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar with Search and Filters */}
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-slate-50/40">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search invoice, vendor, buyer..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
              {(['ALL', 'VALID', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s === 'ALL' ? 'All Status' : s}
                </button>
              ))}
            </div>

            {/* Currency Filter */}
            <select
              value={currencyFilter}
              onChange={(e) => {
                setCurrencyFilter(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="ALL">All Currencies</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 font-medium self-end lg:self-center">
            {filteredDocs.length} matching documents
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/90">
              <tr>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Document / Invoice #</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Supplier</th>
                <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">Buyer</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">Currency</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Subtotal</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tax</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Grand Total</th>
                <th className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-sm text-slate-400">
                    Loading master documents from AWS S3...
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-sm text-slate-500">
                    No documents match the active filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => {
                  const d = doc.data || {};
                  const isValid = doc.validation?.valid;
                  return (
                    <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 font-mono">
                        {d.document_date || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                        <div className="font-semibold text-indigo-600 font-mono">
                          {d.document_number || doc.document_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                          {doc.document_id}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-800 font-medium max-w-[160px] truncate">
                        {d.supplier?.name || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-500 max-w-[140px] truncate">
                        {d.buyer?.name || '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        {getCurrencyBadge(d.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 text-right font-mono">
                        {d.subtotal ? Number(d.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-slate-600 text-right font-mono">
                        {d.tax ? Number(d.tax).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-bold text-slate-900 text-right font-mono">
                        {d.grand_total ? Number(d.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isValid 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {isValid ? 'VALID' : 'REJECTED'}
                          </span>
                          {(doc.validation?.version_tag || doc.validation?.manually_reviewed) && (
                            <span 
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title="Reviewed & corrected from initial rejection (audit snapshot preserved in S3 rejected/ archive)"
                            >
                              {doc.validation?.version_tag || 'Reviewed v2'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-medium space-x-2">
                        {/* Live Workflow Modal Trigger */}
                        <button
                          onClick={() => setActiveWorkflowDocId(doc.document_id)}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition font-mono text-[11px] cursor-pointer"
                        >
                          <GitBranch className="w-3 h-3 mr-1" />
                          Workflow
                        </button>
                        
                        <Link 
                          href={`/documents/${doc.document_id}`} 
                          className="text-slate-600 hover:text-indigo-600 transition"
                        >
                          Review
                        </Link>
                        
                        <button 
                          onClick={() => handleDownloadJSON(doc)} 
                          title="Download Raw Validated JSON"
                          className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modern Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{((page - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(page * itemsPerPage, filteredDocs.length)}</span> of <span className="font-semibold text-slate-800">{filteredDocs.length}</span> documents
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

      {/* Reusable Live Workflow Modal */}
      <LiveWorkflowModal 
        documentId={activeWorkflowDocId} 
        onClose={() => setActiveWorkflowDocId(null)} 
      />
    </div>
  );
}
