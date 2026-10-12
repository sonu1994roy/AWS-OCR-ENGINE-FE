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
  Sparkles
} from 'lucide-react';

export default function ForecastPage() {
  const [loading, setLoading] = useState(false);
  const [workerTriggering, setWorkerTriggering] = useState(false);
  const [data, setData] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);

  // Filter States
  const [forecastType, setForecastType] = useState<'spending' | 'vendor' | 'product_demand'>('spending');
  const [horizonMonths, setHorizonMonths] = useState<number>(6);
  const [currencyMode, setCurrencyMode] = useState<'SPECIFIC' | 'CONVERTED'>('SPECIFIC');
  const [currency, setCurrency] = useState<string>('INR');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [modelName, setModelName] = useState<string>('auto');

  // Load available options on mount
  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const res = await api.get('/forecast/options');
      setOptions(res.data);
      if (res.data.currencies && res.data.currencies.length > 0 && !res.data.currencies.includes(currency)) {
        setCurrency(res.data.currencies[0]);
      }
      if (res.data.vendors && res.data.vendors.length > 0 && !selectedSupplier) {
        setSelectedSupplier(res.data.vendors[0]);
      }
      if (res.data.products && res.data.products.length > 0 && !selectedProduct) {
        setSelectedProduct(res.data.products[0]);
      }
    } catch (e) {
      console.error("Failed to load forecast options", e);
    }
  };

  const runForecast = async () => {
    setLoading(true);
    try {
      const payload: any = {
        forecast_type: forecastType,
        horizon_months: horizonMonths,
        currency_mode: currencyMode,
        currency: currency,
        supplier: selectedSupplier || undefined,
        sku: selectedProduct || undefined,
        model_name: modelName
      };

      const res = await api.post('/forecast/', payload);
      setData(res.data);
    } catch (error) {
      console.error("Forecast execution failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Run initial forecast when options are ready
  useEffect(() => {
    runForecast();
  }, [forecastType, horizonMonths, currencyMode, currency, selectedSupplier, selectedProduct]);

  const handleTriggerWorker = async () => {
    setWorkerTriggering(true);
    try {
      await api.post('/forecast/trigger-worker');
      await fetchOptions();
      await runForecast();
    } catch (e) {
      console.error("Worker trigger failed:", e);
    } finally {
      setWorkerTriggering(false);
    }
  };

  // Prepare Chart Data merging Actuals & Forecast with confidence bands
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
    const headers = ["Month", "Type", "Expected Value", "Lower Bound (80%)", "Upper Bound (80%)", "Currency"];
    const rows = data.timeline.map((pt: any) => [
      pt.month,
      pt.type.toUpperCase(),
      pt.value,
      pt.lower_bound ?? '',
      pt.upper_bound ?? '',
      data.currency || currency
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_${forecastType}_${horizonMonths}M.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Background Worker Status */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Financial Forecasting Engine</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
              <Cpu className="w-3 h-3 mr-1" /> StatsForecast · AutoETS / AutoARIMA
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Decoupled ML Worker processes cleaned S3 ledger documents into monthly historical actuals and future predictive horizons.
          </p>
        </div>

        {/* Worker Controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[11px] font-semibold text-slate-600 flex items-center justify-end">
              <span className={`w-2 h-2 rounded-full mr-1.5 ${options?.worker_status === 'RUNNING' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              Worker Status: {options?.worker_status === 'RUNNING' ? 'Executing ML Pipeline' : 'Background Daemon Active'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Last Run: {options?.last_run ? new Date(options.last_run).toLocaleTimeString() : 'Recently'}
            </span>
          </div>

          <button
            onClick={handleTriggerWorker}
            disabled={workerTriggering}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white text-slate-700 border border-slate-300 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition cursor-pointer"
            title="Trigger asynchronous forecast worker"
          >
            <RotateCw className={`w-3.5 h-3.5 mr-1.5 text-indigo-600 ${workerTriggering ? 'animate-spin' : ''}`} />
            {workerTriggering ? 'Running Worker...' : 'Trigger Forecast Worker'}
          </button>
        </div>
      </div>

      {/* Forecast Scenario Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setForecastType('spending')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center border-b-2 transition cursor-pointer ${
            forecastType === 'spending'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-1.5" />
          Overall Spending & Outflow
        </button>

        <button
          onClick={() => setForecastType('vendor')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center border-b-2 transition cursor-pointer ${
            forecastType === 'vendor'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 mr-1.5" />
          Vendor Spend Trends
        </button>

        <button
          onClick={() => setForecastType('product_demand')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center border-b-2 transition cursor-pointer ${
            forecastType === 'product_demand'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4 mr-1.5" />
          Material & Product Demand
        </button>
      </div>

      {/* Filter Control Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-end">
          {/* Horizon Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Forecast Horizon
            </label>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
              {[3, 6, 12].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizonMonths(h)}
                  className={`py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    horizonMonths === h
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {h}M
                </button>
              ))}
            </div>
          </div>

          {/* Currency Controls (Only for Spending & Vendor modes) */}
          {forecastType !== 'product_demand' && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Currency Mode
                </label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setCurrencyMode('SPECIFIC')}
                    className={`py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      currencyMode === 'SPECIFIC'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Exact
                  </button>
                  <button
                    onClick={() => setCurrencyMode('CONVERTED')}
                    className={`py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      currencyMode === 'CONVERTED'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    FX Converted
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  {options?.currencies?.map((curr: string) => (
                    <option key={curr} value={curr}>{curr}</option>
                  )) || (
                    <>
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </>
                  )}
                </select>
              </div>
            </>
          )}

          {/* Vendor Dropdown */}
          {forecastType === 'vendor' && (
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Select Supplier
              </label>
              <select
                value={selectedSupplier}
                onChange={(e) => setSelectedSupplier(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
              >
                {options?.vendors?.map((v: string) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          )}

          {/* Product Dropdown */}
          {forecastType === 'product_demand' && (
            <div className="lg:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                Select Product / SKU
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
              >
                {options?.products?.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}

          {/* Model Specification */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
              Model Selection
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="auto">Auto (Best Fit - StatsForecast)</option>
              <option value="auto_ets">AutoETS (Holt-Winters)</option>
              <option value="auto_arima">AutoARIMA</option>
              <option value="theta">Theta Extrapolation</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Summary Ribbon */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Historical Total</span>
            <div className="mt-1 text-xl font-bold text-slate-900 font-mono">
              {data.currency === 'Units (Quantity)' ? '' : (data.currency || currency) + ' '}
              {Number(data.total_historical || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {data.currency === 'Units (Quantity)' ? ' units' : ''}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Validated clean transactions only</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 shadow-xs">
            <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Projected Next {horizonMonths}M</span>
            <div className="mt-1 text-xl font-bold text-indigo-700 font-mono">
              {data.currency === 'Units (Quantity)' ? '' : (data.currency || currency) + ' '}
              {Number(data.total_forecast || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              {data.currency === 'Units (Quantity)' ? ' units' : ''}
            </div>
            <span className="text-[10px] text-indigo-500 mt-1 block">Point estimate sum over horizon</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Forecasting Model</span>
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

      {/* Main Actual vs Forecast Interactive Chart */}
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
              Calculating statistical time-series projections...
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

                {/* Upper and Lower Prediction Intervals Band */}
                <Area 
                  type="monotone" 
                  dataKey="upperBound" 
                  stroke="none" 
                  fill="#818cf8" 
                  fillOpacity={0.12} 
                  name="Confidence Upper (80%)"
                />
                
                {/* Historical Actual Line */}
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6 }}
                  name="actual"
                />

                {/* Forecast Line */}
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
              <p className="text-sm font-semibold text-slate-700">No Validated Historical Documents Found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Clean and approve documents in the Document Review pipeline to feed the open-source forecasting model.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Yearly Summary & Budget Planning Ledger */}
      {data?.yearly_summary && data.yearly_summary.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Annual Budget Planning Ledger</h3>
            <p className="text-xs text-slate-500">Year-over-year synthesis combining completed actuals and forecasted remainder</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase">Year</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase">Actual</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase">Forecast</th>
                  <th className="px-4 py-3 text-right text-[11px] font-bold text-slate-600 uppercase">Total Estimated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.yearly_summary.map((yr: any) => (
                  <tr key={yr.year} className="hover:bg-slate-50/50 transition">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{yr.year}</td>
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
