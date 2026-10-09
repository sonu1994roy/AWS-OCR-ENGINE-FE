"use client";

import { Cloud, RefreshCw, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

export function TopBar() {
  const [awsStatus, setAwsStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkAwsStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/aws/health');
      setAwsStatus(data.connected);
    } catch (err) {
      setAwsStatus(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAwsStatus();
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/90 bg-white px-4 sm:px-6 lg:px-8 select-none">
      {/* Left side: Context Badges */}
      <div className="flex items-center space-x-3">
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/70 text-[11px] font-mono text-indigo-700">
          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
          <span>Model: Bedrock DeepSeek V3.2</span>
        </div>
      </div>

      {/* Right side: AWS Health Beacon & Refresh */}
      <div className="flex items-center space-x-4 ml-auto">
        {/* Live Status Beacon */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          {awsStatus === null ? (
            <div className="flex items-center space-x-1.5 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              <span className="font-medium font-mono text-[11px]">Connecting AWS...</span>
            </div>
          ) : awsStatus ? (
            <div className="flex items-center space-x-1.5 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-0.5" />
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold font-mono text-[11px]">AWS Connected (us-east-1)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-red-700">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="font-semibold font-mono text-[11px]">AWS Offline</span>
            </div>
          )}
        </div>

        {/* Refresh Action */}
        <button
          onClick={checkAwsStatus}
          disabled={loading}
          title="Verify AWS Connection & Sync Telemetry"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition shadow-xs disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          <span className="hidden sm:inline">Sync Status</span>
        </button>
      </div>
    </header>
  );
}
