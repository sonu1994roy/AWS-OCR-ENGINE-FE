"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  BarChart3, 
  TrendingUp, 
  Cloud,
  LogOut,
  GitBranch,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import api from '@/lib/api';
import { BrandLogo } from '@/components/common/BrandLogo';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Live Pipeline Tracker', href: '/pipeline', icon: GitBranch },
  { name: 'Master Documents', href: '/documents', icon: FileText },
  { name: 'Clean Data Ledger', href: '/clean-data', icon: Database },
];

const analyticsNavigation = [
  { name: 'Financial Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Spend Forecasting', href: '/forecast', icon: TrendingUp },
];

const systemNavigation = [
  { name: 'AWS Cloud Status', href: '/aws', icon: Cloud },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Continue anyway
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      router.push('/login');
    }
  };

  const renderNavGroup = (title: string, items: typeof mainNavigation) => (
    <div className="space-y-1 mb-5">
      <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
        {title}
      </div>
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              isActive
                ? 'bg-indigo-600/15 text-indigo-300 border-l-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-white border-l-2 border-transparent',
              'group flex items-center justify-between rounded-r-xl px-3 py-2.5 text-xs tracking-wide transition-all duration-150'
            )}
          >
            <div className="flex items-center space-x-3">
              <item.icon
                className={cn(
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300',
                  'h-4 w-4 shrink-0 transition-colors'
                )}
                aria-hidden="true"
              />
              <span>{item.name}</span>
            </div>
            {isActive && (
              <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 border-r border-slate-800/90 select-none">
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-slate-800/80">
        <BrandLogo size="sm" variant="dark" subtitleText="AWS OCR ENGINE" />
      </div>

      {/* Navigation Links Grouped by Domain */}
      <div className="flex flex-1 flex-col overflow-y-auto px-2 py-4">
        {renderNavGroup('Execution & Pipeline', mainNavigation)}
        {renderNavGroup('Financial Intelligence', analyticsNavigation)}
        {renderNavGroup('Cloud Infrastructure', systemNavigation)}
      </div>

      {/* AWS Cloud Badge */}
      <div className="mx-3 mb-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono text-slate-300">AWS us-east-1</span>
        </div>
        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
          Bedrock AI
        </span>
      </div>

      {/* User Session Footer with Logout */}
      <div className="p-3.5 border-t border-slate-800/80 bg-slate-950/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              AL
            </div>
            <div className="text-left">
              <div className="text-xs font-semibold text-slate-200">Admin Lead</div>
              <div className="text-[10px] text-slate-500 font-mono">admin@nexusfin.ai</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out of Session"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
