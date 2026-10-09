"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';

export default function ForecastPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [sku, setSku] = useState('');

  const runForecast = async () => {
    setLoading(true);
    try {
      const payload: any = { currency: 'EUR' };
      if (fromDate) payload.from_date = fromDate;
      if (toDate) payload.to_date = toDate;
      if (supplierName) payload.supplier = supplierName;
      if (sku) payload.sku = sku;

      const res = await api.post('/forecast/', payload);
      setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold leading-7 text-gray-900">Forecasting Model</h2>
        <button
          onClick={runForecast}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Activity className="-ml-0.5 mr-1.5 h-5 w-5" />
          {loading ? 'Running...' : 'Run Forecast Integration'}
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-lg px-4 py-5 sm:p-6 mb-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Forecast Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">Supplier Name</label>
            <input type="text" placeholder="e.g. GLOBEX" value={supplierName} onChange={e => setSupplierName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">SKU</label>
            <input type="text" placeholder="e.g. GX-77" value={sku} onChange={e => setSku(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Historical Data Feed (Sent to Model)</h3>
        {data ? (
          data.historical_data && data.historical_data.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.historical_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <p className="text-gray-500 text-sm">No historical data available for selected filters.</p>
          )
        ) : (
          <div className="h-80 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
             <p className="text-gray-500 text-sm">Select filters and click Run Forecast to pull clean data and feed the existing model.</p>
          </div>
        )}
      </div>

      {data && data.status === "success" && (
        <div className="bg-white shadow sm:rounded-lg p-6 border-l-4 border-indigo-600 mt-6">
           <h3 className="text-base font-semibold leading-6 text-gray-900 mb-2">Forecasting Model Output</h3>
           <p className="text-gray-600 font-mono text-sm">{data.forecast}</p>
        </div>
      )}
      
      {data && data.status === "error" && (
        <div className="bg-white shadow sm:rounded-lg p-6 border-l-4 border-red-600 mt-6">
           <h3 className="text-base font-semibold leading-6 text-red-900 mb-2">Error</h3>
           <p className="text-red-600 font-mono text-sm">{data.message}</p>
        </div>
      )}
    </div>
  );
}
