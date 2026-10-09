"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { LiveWorkflowTimeline } from '@/components/workflow/LiveWorkflowTimeline';

export default function DocumentPipelinePage() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div className="p-8 text-center text-gray-500">Document ID missing</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-6">
      <LiveWorkflowTimeline documentId={id} showBackButton={true} />
    </div>
  );
}
