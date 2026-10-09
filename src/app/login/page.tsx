"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  Loader2, 
  ArrowRight,
  ShieldCheck, 
  Sparkles, 
  KeyRound,
  CheckCircle2
} from 'lucide-react';
import api from '@/lib/api';
import { BrandLogo } from '@/components/common/BrandLogo';
import { LiveScannerVisual } from '@/components/login/LiveScannerVisual';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@nexusfin.ai');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('user_info', JSON.stringify(res.data.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCreds = () => {
    setEmail('admin@nexusfin.ai');
    setPassword('admin123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center relative overflow-hidden font-sans">
      {/* Background Glowing Tech Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[650px] h-[650px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[650px] h-[650px] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Product Showcase, High-Tech Brand Logo & Live Scanner Visual */}
          <div className="lg:col-span-7 space-y-6 text-white">
            {/* Brand Logo Header */}
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider backdrop-blur-md mb-4">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Next-Gen Autonomous Financial Intelligence</span>
              </div>

              <BrandLogo 
                size="lg" 
                variant="dark" 
                subtitleText="AUTONOMOUS AWS DOCUMENT OCR & AUDIT PLATFORM"
              />

              <p className="text-base text-slate-300 font-normal leading-relaxed mt-4 max-w-xl">
                Serverless financial document extraction powered by Amazon Bedrock DeepSeek V3.2, AWS Textract geometry layout, and deterministic zero-error reconciliation.
              </p>
            </div>

            {/* Live Holographic Scanner Product Preview Visual */}
            <LiveScannerVisual />

            {/* Architecture Highlights Pill List */}
            <div className="grid grid-cols-3 gap-3 pt-1 text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>AWS S3 Event Driven</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Bedrock DeepSeek V3.2</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Deterministic Math Audit</span>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Enterprise Login Card */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/85 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              {/* Subtle card top glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-500" />

              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Access</h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20">
                    <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
                    JWT Secure
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">Sign in to access your production pipeline ledger</p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2">
                  <span className="font-bold">Error:</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@nexusfin.ai"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider font-mono">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition font-sans"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials Helper Pill */}
              <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col items-center">
                <span className="text-[11px] text-slate-500 mb-2 font-mono flex items-center">
                  <KeyRound className="w-3 h-3 mr-1 text-slate-400" />
                  Preconfigured Demo Credentials
                </span>
                <button
                  type="button"
                  onClick={fillDemoCreds}
                  className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-950/90 hover:bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs font-mono transition shadow-sm cursor-pointer"
                >
                  <span className="text-white font-medium">admin@nexusfin.ai</span>
                  <span className="text-slate-500">/</span>
                  <span className="text-indigo-400 font-semibold">admin123</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
