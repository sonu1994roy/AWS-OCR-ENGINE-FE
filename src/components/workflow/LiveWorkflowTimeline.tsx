"use client";

import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  Loader2, 
  Clock, 
  AlertCircle, 
  FileCheck, 
  Download, 
  Play, 
  Pause, 
  RotateCw, 
  ArrowLeft,
  FileText
} from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';

interface WorkflowStage {
  step_number: number;
  id: string;
  label: string;
  status: 'WAITING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'NEEDS_REVIEW' | string;
  description?: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  lambda_name?: string;
  lambda_request_id?: string;
  output_s3_key?: string;
  error_code?: string;
}

interface WorkflowData {
  document_id: string;
  filename: string;
  overall_status: string;
  stages: WorkflowStage[];
  current_stage?: string;
  result_summary?: string;
  result_s3_key?: string;
  download_url?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

interface LiveWorkflowTimelineProps {
  documentId: string;
  onClose?: () => void;
  showBackButton?: boolean;
}

export function LiveWorkflowTimeline({ documentId, onClose, showBackButton = true }: LiveWorkflowTimelineProps) {
  const [data, setData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(true);
  const [lastPolledAt, setLastPolledAt] = useState<Date>(new Date());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const fetchWorkflow = async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const res = await api.get(`/documents/${documentId}/workflow`);
      if (isMountedRef.current) {
        setData(res.data);
        setError(null);
        setLastPolledAt(new Date());

        // Stop polling if terminal state reached
        const status = (res.data.overall_status || '').toUpperCase();
        if (['VALID', 'COMPLETED', 'NEEDS_REVIEW', 'REJECTED', 'FAILED'].includes(status)) {
          setIsPolling(false);
        }
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        setError(err.response?.data?.detail || 'Failed to load workflow state');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchWorkflow(true);

    return () => {
      isMountedRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [documentId]);

  // Polling loop (every 2.5 seconds while active)
  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    if (isPolling) {
      pollingRef.current = setInterval(() => {
        fetchWorkflow(false);
      }, 2500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isPolling, documentId]);

  const togglePolling = () => {
    setIsPolling((prev) => !prev);
  };

  const getOverallBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'VALID' || s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (s === 'NEEDS_REVIEW' || s === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
          Needs Review
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5 mr-1 text-red-600" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
        <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin text-orange-500" />
        Processing
      </span>
    );
  };

  const getStageBadge = (stageStatus: string) => {
    const s = (stageStatus || '').toUpperCase();
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          Completed
        </span>
      );
    }
    if (s === 'RUNNING') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin text-orange-500" />
          Running
        </span>
      );
    }
    if (s === 'NEEDS_REVIEW' || s === 'REJECTED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
          Needs Review
        </span>
      );
    }
    if (s === 'FAILED') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
        Waiting
      </span>
    );
  };

  const getCircleNumber = (stepNum: number, stageStatus: string) => {
    const s = (stageStatus || '').toUpperCase();
    if (s === 'COMPLETED') {
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
          ✓
        </div>
      );
    }
    if (s === 'RUNNING') {
      return (
        <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold animate-pulse shadow-sm">
          {stepNum}
        </div>
      );
    }
    if (s === 'FAILED' || s === 'NEEDS_REVIEW') {
      return (
        <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
          !
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
        {stepNum}
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-gray-600">Connecting to AWS pipeline status...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-6 shadow-sm">
        <div className="flex items-center text-red-700 mb-2">
          <AlertCircle className="w-5 h-5 mr-2" />
          <h4 className="font-semibold text-sm">Unable to load document status</h4>
        </div>
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={() => fetchWorkflow(true)}
          className="mt-4 px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const isTerminal = ['VALID', 'COMPLETED', 'NEEDS_REVIEW', 'REJECTED', 'FAILED'].includes(
    (data?.overall_status || '').toUpperCase()
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
      {/* Header matching exact layout of screenshot */}
      <div className="p-6 border-b border-gray-100 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {showBackButton && (
              <button 
                onClick={onClose || (() => window.history.back())}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Invoice processing</h3>
                {data && getOverallBadge(data.overall_status)}
              </div>
              <p className="text-sm text-gray-500 font-mono mt-1">
                {data?.filename || `${documentId}.pdf`}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            {!isTerminal && (
              <button
                onClick={togglePolling}
                title={isPolling ? "Pause live auto-refresh" : "Resume live auto-refresh"}
                className={`inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                  isPolling 
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' 
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {isPolling ? (
                  <>
                    <Pause className="w-3.5 h-3.5 mr-1" /> Pause Live
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1" /> Resume Live
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => fetchWorkflow(true)}
              title="Manual Refresh"
              className="p-1.5 text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Vertical Timeline Workflow */}
      <div className="p-6">
        <div className="relative pl-2">
          {data?.stages.map((stage, idx) => {
            const isLast = idx === data.stages.length - 1;
            const isCurrent = stage.status === 'RUNNING';

            return (
              <div key={stage.id} className="relative flex items-start group">
                {/* Connecting Line */}
                {!isLast && (
                  <div 
                    className={`absolute left-[13px] top-[28px] w-[2px] bottom-[-8px] transition-colors ${
                      stage.status === 'COMPLETED' ? 'bg-emerald-300' : 'bg-gray-200'
                    }`} 
                  />
                )}

                {/* Circle Number */}
                <div className="relative z-10 flex-shrink-0 mt-0.5">
                  {getCircleNumber(stage.step_number, stage.status)}
                </div>

                {/* Stage Content */}
                <div className="ml-4 flex-1 pb-7">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-gray-900">
                      {stage.label}
                    </span>
                    {getStageBadge(stage.status)}
                  </div>

                  {/* Informative Subtext matching screenshot */}
                  {stage.description && (
                    <p className={`text-sm mt-1 transition-colors ${
                      isCurrent ? 'text-orange-600 font-medium' : 'text-gray-500'
                    }`}>
                      {stage.description}
                    </p>
                  )}

                  {/* Terminal Final Result Action buttons */}
                  {stage.id === 'result' && (
                    <div className="mt-4 flex items-center space-x-3">
                      {data.download_url && (
                        <a
                          href={data.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 transition"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download Clean JSON
                        </a>
                      )}
                      
                      <Link
                        href={`/documents/${data.document_id}`}
                        className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 transition"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        View Document Review
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-6 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 font-mono">
        <div>Document ID: {data?.document_id}</div>
        <div>
          {isPolling ? 'Auto-refreshing every 2.5s · Live' : `Updated at ${lastPolledAt.toLocaleTimeString()}`}
        </div>
      </div>
    </div>
  );
}
