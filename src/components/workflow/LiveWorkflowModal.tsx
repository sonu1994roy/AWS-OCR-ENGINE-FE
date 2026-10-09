"use client";

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { LiveWorkflowTimeline } from './LiveWorkflowTimeline';

interface LiveWorkflowModalProps {
  documentId: string | null;
  onClose: () => void;
}

export function LiveWorkflowModal({ documentId, onClose }: LiveWorkflowModalProps) {
  // Close on ESC key press & prevent background scroll
  useEffect(() => {
    if (!documentId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [documentId, onClose]);

  if (!documentId) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      aria-labelledby="live-workflow-modal"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-200 z-10 my-auto">
        {/* Floating Top-Right Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Reusable Core Workflow Timeline Component */}
        <LiveWorkflowTimeline 
          documentId={documentId} 
          onClose={onClose} 
          showBackButton={false}
        />
      </div>
    </div>
  );
}
