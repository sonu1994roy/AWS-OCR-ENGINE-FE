"use client";

import { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Coins, 
  Cpu, 
  RotateCw, 
  Building2, 
  Package, 
  Download, 
  ShieldCheck, 
  AlertCircle,
  Clock,
  Sparkles,
  Settings2,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  DollarSign,
  ArrowRight
} from 'lucide-react';

export default function ForecastPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // Configuration Panel Visibility
  const [showConfig, setShowConfig] = useState(true);

  // Guided Configuration States
  const [metric, setMetric] = useState<string>('spending');
  const [dataSource, setDataSource] = useState<string>('all');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [fyType, setFyType] = useState<string>('APRIL_MARCH');
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  const [currencyMode, setCurrencyMode] = useState<'SPECIFIC' | 'CONVERTED'>('CONVERTED');
  const [currency, setCurrency] = useState<string>('INR');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [modelName, setModelName] = useState<string>('auto');

  useEffect(() => {
    fetchOptionsAndProfile();
  }, []);

  const fetchOptionsAndProfile = async () => {
    try {
      const [optRes, profRes] = await Promise.all([
        api.get('/forecast/options'),
        api.get('/forecast/profile')
      ]);
      setOptions(optRes.data);
      setProfile(profRes.data);

      if (profRes.data.detected_currencies) {
        const currs = Object.keys(profRes.data.detected_currencies);
        if (currs.length > 0 && !currs.includes(currency)) {
          setCurrency(currs[0]);
        }
      }
      if (profRes.data.detected_vendors && profRes.data.detected_vendors.length > 0) {
        setSelectedSupplier(profRes.data.detected_vendors[0]);
      }
      if (profRes.data.detected_products && profRes.data.detected_products.length > 0) {
        setSelectedSku(profRes.data.detected_products[0]);
      }

      // Run initial forecast in Consolidated Local Currency (INR) mode
      runForecast({
        metric: 'spending',
        dataSource: 'all',
        horizon: 6,
        currencyMode: 'CONVERTED',
        curr: 'INR'
      });
    } catch (e) {
      console.error("Failed to load options or profile", e);
    }
  };

  const runForecast = async (overrideParams?: any) => {
    setLoading(true);
    try {
      const payload: any = {
        metric: overrideParams?.metric ?? metric,
        data_source: overrideParams?.dataSource ?? dataSource,
        frequency: overrideParams?.frequency ?? frequency,
        fy_type: fyType,
        horizon_months: overrideParams?.horizon ?? horizonMonths,
        currency_mode: overrideParams?.currencyMode ?? currencyMode,
        currency: overrideParams?.curr ?? currency,
        supplier: selectedSupplier || undefined,
        sku: selectedSku || undefined,
        model_name: modelName,
        use_sample_if_empty: true
      };

      const res = await api.post('/forecast/', payload);
      setData(res.data);
    } catch (error) {
      console.error("Forecast execution failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyConfig = () => {
    setShowConfig(false);
    runForecast();
  };

  // Recharts Chart Data
  const chartData = useMemo(() => {
    if (!data || !data.timeline) return [];
    
    return data.timeline.map((pt: any) => {
      const isActual = pt.type === 'actual';
      return {
        month: pt.month,
        actual: isActual ? pt.value : null,
        forecast: !isActual ? pt.value : null,
        lowerBound: pt.lower_bound,
        upperBound: pt.upper_bound,
        type: pt.type
      };
    });
  }, [data]);

  // Export Forecast CSV
  const exportCsv = () => {
    if (!data || !data.timeline) return;
    const headers = ["Month", "Type", "Expected Value", "Lower Bound (80%)", "Upper Bound (80%)", "Metric", "Reporting Currency", "Consolidation Mode"];
    const rows = data.timeline.map((pt: any) => [
      pt.month,
      pt.type.toUpperCase(),
      pt.value,
      pt.lower_bound ?? '',
      pt.upper_bound ?? '',
      data.metric,
      data.currency || currency,
      data.all_currencies_consolidated ? "CONSOLIDATED_FX (100% Transactions)" : "STRICT_FILTER"
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: any[]) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_${data.metric}_${data.horizon_months}M.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Reconfigure Trigger */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Financial Forecasting Engine</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Cpu className="w-3 h-3 mr-1" /> StatsForecast · AutoETS / AutoARIMA
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Configure target metrics, data sources, and time horizons before running open-source time-series algorithms on cleaned ledger data.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs hover:bg-indigo-100 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            {showConfig ? 'Hide Configuration' : 'Configure Before Run'}
          </button>
        </div>
      </div>

      {/* STEP 1: CONFIGURE BEFORE RUN (GUIDED WIZARD) */}
      {showConfig && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                1
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Step 1: Forecasting Setup & Data Profiler</h3>
                <p className="text-xs text-slate-500">Configure your target financial metric, data source, and historical period settings.</p>
              </div>
            </div>
            
            {profile && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                Data Profile: {profile.data_volume_label}
              </span>
            )}
          </div>

          {/* Data Profile Diagnostics Box */}
          {profile && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    S3 Clean Data Health Check
                  </span>
                  <p className="text-xs text-slate-700 font-medium mt-1">
                    {profile.recommendation_note}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                  Recommended: {profile.recommended_model}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. Target Metric Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Target Metric
              </label>
              <div className="space-y-2">
                {[
                  { id: 'spending', label: 'Purchase / Invoice Spend', desc: 'Accounts Payable Outflow' },
                  { id: 'revenue', label: 'Revenue and Sales', desc: 'Accounts Receivable Inflow' },
                  { id: 'cash_flow', label: 'Cash Inflow / Outflow', desc: 'Net Cash Flow Planning' },
                  { id: 'product_demand', label: 'Product / Material Demand', desc: 'Unit Quantity Inventory' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMetric(item.id)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                      metric === item.id 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.label}</span>
                      {metric === item.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Clean Data Source Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Clean Data Source
              </label>
              <div className="space-y-2">
                {[
                  { id: 'invoices_only', label: 'Invoices Only', desc: 'Actual historical billed spend' },
                  { id: 'pos_only', label: 'Purchase Orders Only', desc: 'Planned procurement commitments' },
                  { id: 'all', label: 'Invoices + Purchase Orders', desc: 'Consolidated financial baseline' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDataSource(item.id)}
                    className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                      dataSource === item.id 
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{item.label}</span>
                      {dataSource === item.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Frequency & Financial Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                3. Frequency & Calendar
              </label>
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold mb-1 block">Forecast Horizon</span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
                    {[3, 6, 12].map((h) => (
                      <button
                        key={h}
                        onClick={() => setHorizonMonths(h)}
                        className={`py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                          horizonMonths === h ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                        }`}
                      >
                        {h}M
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold mb-1 block">Fiscal Year Structure</span>
                  <select
                    value={fyType}
                    onChange={(e) => setFyType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="APRIL_MARCH">April – March (Indian FY)</option>
                    <option value="CALENDAR">January – December (Calendar Year)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Currency & Algorithmic Strategy */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                4. Currency & Model Engine
              </label>
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold mb-1 block">Local Reporting Currency</span>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="INR">INR (₹) - Indian Rupee (Default Entity Currency)</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold mb-1 block">Currency Handling Mode</span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setCurrencyMode('CONVERTED')}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        currencyMode === 'CONVERTED'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 font-bold text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Consolidated Local FX (Recommended)</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Zero Skipped</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                        Converts USD, EUR, GBP into {currency}. Captures 100% of multi-currency invoices.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrencyMode('SPECIFIC')}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer ${
                        currencyMode === 'SPECIFIC'
                          ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 font-bold text-slate-900'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>Single Currency Only</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">Filter</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-normal block mt-0.5">
                        Only transactions originally in {currency}. Excludes foreign currency documents.
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 font-semibold mb-1 block">Forecasting Algorithm</span>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-indigo-500"
                  >
                    <option value="auto">Auto (Best Fit - StatsForecast)</option>
                    <option value="auto_ets">AutoETS (Holt-Winters Seasonality)</option>
                    <option value="auto_arima">AutoARIMA (Auto-Regressive)</option>
                    <option value="theta">Theta Extrapolation</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleApplyConfig}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-sm hover:bg-indigo-700 transition cursor-pointer"
            >
              Apply Configuration & Run Forecast
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE FORECAST PARAMETER RIBBON */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="text-slate-400 uppercase text-[11px] tracking-wider">Active Run:</span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
            Metric: {metric.toUpperCase().replace('_', ' ')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            Source: {dataSource.toUpperCase().replace('_', ' ')}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
            Horizon: {horizonMonths}M
          </span>
          <span className={`px-2.5 py-1 rounded-lg border ${
            currencyMode === 'CONVERTED'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            Currency: {currencyMode === 'CONVERTED' ? `Consolidated ${currency} (100% Transactions)` : `${currency} (Strict Filter)`}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {metric === 'vendor' && options?.vendors && (
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                runForecast({ supplier: e.target.value });
              }}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-medium"
            >
              {options.vendors.map((v: string) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => runForecast()}
            disabled={loading}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-indigo-600 transition cursor-pointer"
            title="Refresh Forecast"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* AUDIT & CURRENCY CONSOLIDATION BANNER */}
      {data && (
        <div className={`p-4 rounded-2xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
          data.all_currencies_consolidated
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}>
          <div className="flex items-start md:items-center space-x-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              data.all_currencies_consolidated ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}>
              {data.all_currencies_consolidated ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            </div>
            <div>
              <div className="font-bold text-slate-900 flex flex-wrap items-center gap-2">
                <span>
                  {data.all_currencies_consolidated 
                    ? `Consolidated Local Reporting Currency: ${data.currency} · 100% of Transactions Included`
                    : `Strict Currency Filter Active: Only ${data.currency} Transactions`}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  data.all_currencies_consolidated ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {data.total_documents_included} Documents Included ({data.skipped_documents_count ?? 0} Skipped)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {data.consolidation_note}
                {data.source_currencies_detected && Object.keys(data.source_currencies_detected).length > 0 && (
                  <span className="ml-1 font-mono font-medium text-slate-800">
                    — Ingested Source Currencies: {Object.entries(data.source_currencies_detected).map(([c, n]) => `${n} ${c}`).join(' + ')}
                  </span>
                )}
              </p>
            </div>
          </div>

          {data.all_currencies_consolidated && data.currency === 'INR' && (
            <div className="text-[11px] font-mono bg-white/90 border border-emerald-200/80 rounded-xl px-3 py-2 text-slate-700 shrink-0 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">FX Reference Rates</span>
              1 USD ≈ ₹86.21 · 1 EUR ≈ ₹93.10 · 1 GBP ≈ ₹110.34
            </div>
          )}
        </div>
      )}

      {/* KPI METRIC CARDS */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Historical Total</span>
            <div className="mt-1 text-xl font-bold text-slate-900 font-mono">
              {data.currency === 'Units (Quantity)' ? '' : (data.currency || currency) + ' '}
              {Number(data.total_historical || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {data.currency === 'Units (Quantity)' ? ' units' : ''}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {data.all_currencies_consolidated ? `100% Consolidated in ${data.currency || currency}` : `Filtered ${data.currency} only`}
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Projected Next {horizonMonths}M</span>
            <div className="mt-1 text-xl font-bold text-indigo-700 font-mono">
              {data.currency === 'Units (Quantity)' ? '' : (data.currency || currency) + ' '}
              {Number(data.total_forecast || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {data.currency === 'Units (Quantity)' ? ' units' : ''}
            </div>
            <span className="text-[10px] text-indigo-500 mt-1 block">Point estimate in {data.currency || currency}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Model Engine</span>
            <div className="mt-1 text-base font-bold text-slate-800 truncate" title={data.model_name}>
              {data.model_name || 'StatsForecast · AutoETS'}
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center">
              <Sparkles className="w-3 h-3 mr-1" /> Open-Source Engine
            </span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Confidence</span>
            <div className="mt-1 flex items-center space-x-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                data.confidence_level === 'HIGH' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : data.confidence_level === 'MEDIUM' 
                    ? 'bg-indigo-100 text-indigo-800' 
                    : 'bg-amber-100 text-amber-800'
              }`}>
                {data.confidence_level || 'MEDIUM'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block truncate" title={data.confidence_reason}>
              {data.confidence_reason || 'Evaluating seasonal variance'}
            </span>
          </div>
        </div>
      )}

      {/* MAIN ACTUAL VS FORECAST RECHARTS CHART */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Actual vs Forecast Trajectory ({data?.currency || currency})
            </h3>
            <p className="text-xs text-slate-500">
              Solid line represents validated past actuals · Dashed line shows predictive forecast with 80% confidence interval
            </p>
          </div>

          <button
            onClick={exportCsv}
            disabled={!data || !data.timeline || data.timeline.length === 0}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer self-start sm:self-center"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-slate-600" />
            Export CSV
          </button>
        </div>

        <div className="h-96 mt-4">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Training model and evaluating time-series projections...
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  tickLine={false}
                  tickFormatter={(val) => Number(val).toLocaleString()}
                />
                <Tooltip 
                  formatter={(value: any, name: any) => [
                    `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${data?.currency || currency}`,
                    name === 'actual' ? 'Actual (Historical)' : (name === 'forecast' ? 'Forecast (Predicted)' : name)
                  ]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '10px' }}
                  formatter={(value) => value === 'actual' ? 'Actual Historical Spend' : (value === 'forecast' ? 'Projected Forecast' : value)}
                />

                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="none" 
                  fill="#818cf8" 
                  fillOpacity={0.12} 
                  name="Confidence Upper (80%)"
                />
                
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="actual"
                />

                <Line 
                  type="monotone" 
                  dataKey="forecast" 
                  stroke="#6366f1" 
                  strokeWidth={2.5} 
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#6366f1', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="forecast"
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-center p-6">
              <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Historical Records Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Clean and approve documents in the Document Review pipeline to feed the forecasting engine.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ANNUAL BUDGET PLANNING LEDGER */}
      {data?.yearly_summary && data.yearly_summary.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Annual Budget Planning Ledger</h3>
            <p className="text-xs text-slate-500">
              {fyType === 'APRIL_MARCH' ? 'Indian Fiscal Year (April–March)' : 'Calendar Year (January–December)'} Synthesis
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase">Fiscal Period</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase">Actual Billed</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase">Projected Remaining</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase">Total Estimated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.yearly_summary.map((yr: any) => (
                  <tr key={yr.year} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {fyType === 'APRIL_MARCH' ? `FY ${yr.year}–${String(yr.year + 1).slice(-2)}` : yr.year}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        yr.status === 'actual' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : yr.status === 'forecast' 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {yr.status === 'actual' ? 'Completed Actuals' : (yr.status === 'forecast' ? '100% Projected' : 'Actuals + Projected')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {Number(yr.actual || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-600 font-semibold">
                      {Number(yr.forecast || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {Number(yr.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
