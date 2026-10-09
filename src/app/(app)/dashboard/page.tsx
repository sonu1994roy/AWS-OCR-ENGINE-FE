"use client";

import { useEffect, useState, useRef } from 'react';
import { 
  UploadCloud, 
  Activity, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  Calendar,
  Building2,
  Coins,
  Cpu,
  Layers,
  FileText,
  GitBranch,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import { LiveWorkflowModal } from '@/components/workflow/LiveWorkflowModal';
import { PipelineTable } from '@/components/pipeline/PipelineTable';

export default function Dashboard() {
  const [stats, setStats] = useState({
    total_spend: 0,
    total_tax: 0,
    invoice_count: 0,
    converted_spend: 0,
    converted_tax: 0,
    total_all_invoices: 0
  });
  
  const [uploading, setUploading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{file: File | null, show: boolean}>({ file: null, show: false });
  const [activeWorkflowDocId, setActiveWorkflowDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [supplierName, setSupplierName] = useState('');
  const [availableSuppliers, setAvailableSuppliers] = useState<string[]>([]);
  const [fxMode, setFxMode] = useState<'MATCHED' | 'CONVERTED'>('MATCHED');

  useEffect(() => {
    // Fetch dynamic filters
    api.get('/analytics/filters').then(res => {
      if (res.data?.suppliers) setAvailableSuppliers(res.data.suppliers);
    }).catch(console.error);
  }, []);

  const fetchSummary = async () => {
    try {
      const params: any = { currency };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      if (supplierName) params.supplier = supplierName;
      
      const res = await api.get('/analytics/summary', { params });
      const data = res.data;
      if (data && data.matched) {
        setStats({
          total_spend: data.matched.grand_total || 0,
          total_tax: data.matched.tax || 0,
          invoice_count: data.matched.invoice_count || 0,
          converted_spend: data.converted?.grand_total || 0,
          converted_tax: data.converted?.tax || 0,
          total_all_invoices: data.converted?.invoice_count || 0
        });
      } else if (Object.keys(data).length > 0) {
        const primary = data[currency] || { grand_total: 0, tax: 0, invoice_count: 0 };
        setStats({
          total_spend: primary.grand_total || 0,
          total_tax: primary.tax || 0,
          invoice_count: primary.invoice_count || 0,
          converted_spend: primary.grand_total || 0,
          converted_tax: primary.tax || 0,
          total_all_invoices: primary.invoice_count || 0
        });
      } else {
        setStats({ total_spend: 0, total_tax: 0, invoice_count: 0, converted_spend: 0, converted_tax: 0, total_all_invoices: 0 });
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [fromDate, toDate, currency, supplierName]);

  const executeUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setDuplicateWarning({ file: null, show: false });
    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.document_id) {
        // Pop up the live workflow modal immediately!
        setActiveWorkflowDocId(res.data.document_id);
      }
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check for duplicates first
    try {
      const checkRes = await api.get(`/documents/check?filename=${encodeURIComponent(file.name)}`);
      if (checkRes.data.exists) {
        setDuplicateWarning({ file, show: true });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    } catch (error) {
      console.error("Failed to check document existence", error);
    }
    
    // Proceed if no duplicate
    executeUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard & Pipeline</h2>
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>us-east-1 Live</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time financial document ingestion telemetry, OCR validation, and expenditure metrics
          </p>
        </div>

        {/* Upload Action */}
        <div className="mt-4 flex sm:ml-4 sm:mt-0 space-x-4">
          <input 
            type="file" 
            accept="application/pdf" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/25 transition disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Ingesting Document...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>Upload Financial Document</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Filters Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-mono">
              Global Filter Control
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setFxMode(prev => prev === 'MATCHED' ? 'CONVERTED' : 'MATCHED')}
            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 transition cursor-pointer"
          >
            {fxMode === 'MATCHED' ? '⇄ Switch to FX Consolidated' : '⇄ Switch to Exact Currency'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">From Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">To Date</label>
            <div className="relative">
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">Supplier / Vendor</label>
            <select
              value={supplierName}
              onChange={e => setSupplierName(e.target.value)}
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs cursor-pointer"
            >
              <option value="">All Suppliers / Vendors</option>
              {availableSuppliers.map((s, idx) => (
                <option key={idx} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5 uppercase font-mono">Target Currency</label>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value)} 
              className="w-full bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white shadow-xs cursor-pointer"
            >
              <option value="EUR">EUR (€) Euro</option>
              <option value="USD">USD ($) US Dollar</option>
              <option value="GBP">GBP (£) British Pound</option>
              <option value="INR">INR (₹) Indian Rupee</option>
            </select>
          </div>
        </div>
      </div>

      {/* Spend Analytics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Total Spend */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {fxMode === 'MATCHED' ? `Spend (${currency} Exact)` : `Total Spend (${currency} · FX Converted)`}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              fxMode === 'MATCHED' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {fxMode === 'MATCHED' ? 'Filtered Currency' : 'Consolidated FX'}
            </span>
          </div>
          <div className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '₹'}
            {(fxMode === 'MATCHED' ? stats.total_spend : stats.converted_spend).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {fxMode === 'MATCHED'
              ? `${stats.invoice_count} document${stats.invoice_count === 1 ? '' : 's'} matching ${currency}`
              : `All ${stats.total_all_invoices} documents converted to ${currency} at standard FX`}
          </p>
        </div>

        {/* Total Tax */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              {fxMode === 'MATCHED' ? `Tax (${currency} Exact)` : `Total Tax (${currency} · FX Converted)`}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
              {fxMode === 'MATCHED' ? 'Filtered' : 'FX'}
            </span>
          </div>
          <div className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency === 'GBP' ? '£' : '₹'}
            {(fxMode === 'MATCHED' ? stats.total_tax : stats.converted_tax).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Tax volume verified by deterministic validator
          </p>
        </div>

        {/* Total Valid Invoices */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-slate-200/90 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Total Valid Documents
            </span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2.5 text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
            {fxMode === 'MATCHED' ? stats.invoice_count : stats.total_all_invoices}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {fxMode === 'MATCHED' ? `Strictly matching ${currency}` : 'Across all supported currencies in S3'}
          </p>
        </div>
      </div>

      {/* Live Processing Pipeline Section (Top 5 Recent Documents) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden mt-8">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Live Processing Pipeline</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time progression of latest documents running through AWS Textract, Bedrock DeepSeek, and Validator
            </p>
          </div>
          <Link 
            href="/pipeline" 
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center transition"
          >
            <span>View Full Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <PipelineTable 
          limit={5} 
          showToolbar={false} 
          showPagination={false} 
          onSelectWorkflow={(docId) => setActiveWorkflowDocId(docId)} 
        />
      </div>

      {/* Duplicate Warning Modal */}
      {duplicateWarning.show && (
        <div className="relative z-50" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" />
          <div className="fixed inset-0 z-50 w-screen overflow-y-auto p-4 flex items-center justify-center">
            <div className="relative transform overflow-hidden rounded-2xl bg-white p-6 text-left shadow-2xl transition-all max-w-lg w-full border border-slate-200">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-base font-bold text-slate-900" id="modal-title">
                    Duplicate Document Detected
                  </h3>
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-slate-600">
                      The file <span className="font-semibold text-slate-900 font-mono">{duplicateWarning.file?.name}</span> has already been ingested into the AWS pipeline.
                    </p>
                    <p className="text-xs text-slate-500">
                      Reprocessing duplicate files triggers paid Amazon Bedrock calls and overwrites previously validated data. Are you sure you wish to proceed?
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:flex sm:justify-end sm:space-x-3">
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-red-600 rounded-xl hover:bg-red-500 transition cursor-pointer"
                  onClick={() => {
                    if (duplicateWarning.file) {
                      executeUpload(duplicateWarning.file);
                    }
                  }}
                >
                  Yes, Process Again
                </button>
                <button
                  type="button"
                  className="mt-2 sm:mt-0 w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => setDuplicateWarning({ file: null, show: false })}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Live Workflow Real-time Modal */}
      <LiveWorkflowModal 
        documentId={activeWorkflowDocId} 
        onClose={() => setActiveWorkflowDocId(null)} 
      />
    </div>
  );
}
