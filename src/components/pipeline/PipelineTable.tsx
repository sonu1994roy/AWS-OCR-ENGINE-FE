"use client";

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  GitBranch, 
  FileText, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  RotateCw 
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

export interface PipelineTableProps {
  limit?: number;
  showToolbar?: boolean;
  showPagination?: boolean;
  onSelectWorkflow: (docId: string) => void;
  className?: string;
}

export function PipelineTable({
  limit,
  showToolbar = true,
  showPagination = true,
  onSelectWorkflow,
  className = '',
}: PipelineTableProps) {
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'REJECTED' | 'PROCESSING'>('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = limit || 10;

  const fetchPipelines = async () => {
    try {
      const res = await api.get('/pipeline/recent');
      setPipelines(res.data);
    } catch (e) {
      console.error("Failed to load pipelines", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
    const interval = setInterval(fetchPipelines, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'VALID') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          VALID
        </span>
      );
    }
    if (s === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
          REJECTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-amber-500" />
        PROCESSING
      </span>
    );
  };

  const getCurrentStageLabel = (p: any) => {
    const stages = p.stages || [];
    const running = stages.find((s: any) => s.status === 'RUNNING');
    if (running) return running.name;
    const completed = [...stages].reverse().find((s: any) => s.status === 'COMPLETED');
    if (completed) return completed.name;
    return 'Uploaded';
  };

  const renderPipelineTrack = (p: any) => {
    const stages = p.stages || [];
    const stageNames = ['upload', 'extraction', 'normalization', 'validation', 'clean'];

    return (
      <div className="flex items-center space-x-1">
        {stageNames.map((stName, idx) => {
          const stageObj = stages.find((s: any) => (s.name || '').toLowerCase() === stName) || {};
          const isDone = stageObj.status === 'COMPLETED';
          const isRunning = stageObj.status === 'RUNNING';
          const isFailed = stageObj.status === 'FAILED' || (p.status === 'REJECTED' && idx === 4);

          let badgeClass = "bg-slate-100 text-slate-400 border-slate-200";
          const label = stName.charAt(0).toUpperCase() + stName.slice(1, 4);

          if (isDone) {
            badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
          } else if (isRunning) {
            badgeClass = "bg-amber-50 text-amber-700 border-amber-300 font-semibold animate-pulse";
          } else if (isFailed) {
            badgeClass = "bg-red-50 text-red-700 border-red-200 font-semibold";
          }

          return (
            <div key={idx} className="flex items-center">
              <span 
                title={`${stName}: ${stageObj.status || 'WAITING'}`}
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono border ${badgeClass}`}
              >
                {isDone && <Check className="w-2.5 h-2.5 mr-0.5 text-emerald-600" />}
                {isRunning && <Loader2 className="w-2.5 h-2.5 mr-0.5 animate-spin text-amber-600" />}
                {isFailed && <span className="mr-0.5 text-red-600 font-bold">!</span>}
                {label}
              </span>
              {idx < stageNames.length - 1 && (
                <span className="text-slate-300 text-[10px] mx-0.5">›</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Filter pipeline records
  const filtered = pipelines.filter(p => {
    if (p.status === 'NOT_FOUND') return false;

    if (statusFilter === 'VALID' && p.status !== 'VALID') return false;
    if (statusFilter === 'REJECTED' && p.status !== 'REJECTED') return false;
    if (statusFilter === 'PROCESSING' && (p.status === 'VALID' || p.status === 'REJECTED')) return false;

    if (!searchQuery) return true;
    return (p.document_id || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Apply limit if specified (e.g. for dashboard)
  const displayedItems = limit 
    ? filtered.slice(0, limit)
    : (showPagination ? filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage) : filtered);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col ${className}`}>
      {/* Optional Toolbar for Search & Filters */}
      {showToolbar && (
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by document ID..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs"
              />
            </div>

            <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
              {(['ALL', 'PROCESSING', 'VALID', 'REJECTED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer text-xs ${
                    statusFilter === s
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {s === 'ALL' ? 'All' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium self-end sm:self-center">
            {filtered.length} total documents
          </div>
        </div>
      )}

      {/* Tabular Table */}
      <div className="overflow-x-auto flex-1">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/90">
            <tr>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Document ID / File
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Current Stage
              </th>
              <th className="px-4 py-3.5 text-left text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                5-Stage Pipeline Progression
              </th>
              <th className="px-4 py-3.5 text-center text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Overall Status
              </th>
              <th className="px-4 py-3.5 text-right text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading && pipelines.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                  Connecting to AWS Lambda & S3 telemetry...
                </td>
              </tr>
            ) : displayedItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-sm text-slate-500">
                  No documents found in pipeline.
                </td>
              </tr>
            ) : (
              displayedItems.map((p) => (
                <tr key={p.document_id} className="hover:bg-indigo-50/20 transition-colors">
                  {/* Document ID */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 font-mono">
                          {p.document_id}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          S3: raw/pdf/
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Current Stage */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-700 capitalize">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                      {getCurrentStageLabel(p)}
                    </span>
                  </td>

                  {/* 5-Stage Stepper Progression */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-xs">
                    {renderPipelineTrack(p)}
                  </td>

                  {/* Status Badge */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-center">
                    {getStatusBadge(p.status)}
                  </td>

                  {/* Actions */}
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-xs font-medium space-x-2">
                    <button
                      onClick={() => onSelectWorkflow(p.document_id)}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition font-semibold text-xs cursor-pointer shadow-2xs"
                    >
                      <GitBranch className="w-3.5 h-3.5 mr-1" />
                      Live Workflow
                    </button>

                    {(p.status === 'REJECTED' || p.status === 'VALID') && (
                      <Link
                        href={`/documents/${p.document_id}`}
                        className="inline-flex items-center text-slate-500 hover:text-slate-800 text-xs transition"
                      >
                        <span>Review Data</span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (when enabled and not limited) */}
      {!limit && showPagination && !loading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6">
          <div className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-800">{((page - 1) * itemsPerPage) + 1}</span> to <span className="font-semibold text-slate-800">{Math.min(page * itemsPerPage, filtered.length)}</span> of <span className="font-semibold text-slate-800">{filtered.length}</span> documents
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
  );
}
