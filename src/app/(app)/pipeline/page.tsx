"use client";

import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { PipelineTable } from '@/components/pipeline/PipelineTable';
import { LiveWorkflowModal } from '@/components/workflow/LiveWorkflowModal';

export default function PipelinePage() {
  const [activeWorkflowDocId, setActiveWorkflowDocId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard" 
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Live Processing Pipeline</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                AWS us-east-1
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic 5-stage tracking of documents streaming through Textract, Bedrock DeepSeek, and Validator
            </p>
          </div>
        </div>
      </div>

      {/* Reusable Tabular Pipeline Component with Full Toolbar & Pagination */}
      <PipelineTable 
        showToolbar={true} 
        showPagination={true} 
        onSelectWorkflow={(docId) => setActiveWorkflowDocId(docId)} 
      />

      {/* Reusable Live Workflow Modal */}
      <LiveWorkflowModal 
        documentId={activeWorkflowDocId} 
        onClose={() => setActiveWorkflowDocId(null)} 
      />
    </div>
  );
}
