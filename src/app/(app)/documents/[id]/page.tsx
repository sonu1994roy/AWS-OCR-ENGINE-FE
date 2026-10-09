"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle, Save, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

export default function DocumentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable state
  const [subtotal, setSubtotal] = useState<number>(0);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const fetchDoc = async () => {
    try {
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data);
      if (res.data.data) {
        setSubtotal(res.data.data.subtotal || 0);
        setItems(res.data.data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleReprocess = async () => {
    if (!doc) return;
    setSaving(true);
    
    // Create updated document payload
    const updatedDoc = {
      ...doc,
      data: {
        ...doc.data,
        subtotal: Number(subtotal),
        items: items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price),
          line_total: Number(item.line_total),
        }))
      }
    };
    
    try {
      await api.put(`/documents/${id}/reprocess`, updatedDoc);
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
      alert('Failed to reprocess');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading document...</div>;
  if (!doc) return <div className="p-8 text-center text-red-500">Document not found.</div>;

  const isRejected = doc.validation?.valid === false;

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h2 className="text-2xl font-bold leading-7 text-gray-900">Document Review: {doc.data?.document_number || id}</h2>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `${id}.json`);
              document.body.appendChild(downloadAnchorNode); // required for firefox
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Download JSON
          </button>

          {isRejected && (
            <button
              onClick={handleReprocess}
              disabled={saving}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              <Save className="-ml-0.5 mr-1.5 h-5 w-5" />
              {saving ? 'Processing...' : 'Save & Reprocess'}
            </button>
          )}
        </div>
      </div>

      {isRejected && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc space-y-1 pl-5">
                  {doc.validation.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isRejected && (
        <div className="rounded-xl bg-emerald-50/90 border border-emerald-200/90 p-4 mb-6 shadow-xs">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-semibold text-emerald-950">Document Validated & Passed</h3>
                {(doc.validation?.version_tag || doc.validation?.manually_reviewed) && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {doc.validation?.version_tag || 'Reviewed v2'}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                Deterministic mathematical cross-check passed (Subtotal + Tax = Grand Total).
              </p>
              {(doc.validation?.manually_reviewed || doc.validation?.version_tag) && (
                <div className="mt-2 text-[11px] font-mono text-indigo-700 bg-white/70 rounded-lg p-2 border border-indigo-100">
                  <span className="font-semibold">Compliance & Audit Trail:</span> Corrected and approved via manual review. Raw initial rejection snapshot is preserved in AWS S3 <code className="bg-indigo-50 px-1 py-0.5 rounded text-indigo-900">rejected/</code> for version audit tracking.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Invoice Details</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Supplier</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{doc.data?.supplier?.name}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{doc.data?.document_date}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {isRejected ? (
                  <input
                    type="number"
                    value={subtotal}
                    onChange={(e) => setSubtotal(Number(e.target.value))}
                    className="block w-full max-w-xs rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                ) : (
                  doc.data?.subtotal
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden mt-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Line Items</h3>
          {isRejected && <span className="text-sm text-gray-500">Edit values to fix calculation mismatches</span>}
        </div>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">SKU</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Qty</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Unit Price</th>
                <th className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">{item.sku}</td>
                  <td className="px-3 py-4 text-sm text-gray-500 max-w-xs truncate">{item.description}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    {isRejected ? (
                      <input type="number" value={item.quantity} onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)} className="w-20 text-right rounded-md border-gray-300 shadow-sm sm:text-sm" />
                    ) : item.quantity}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                    {isRejected ? (
                      <input type="number" value={item.unit_price} onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)} className="w-24 text-right rounded-md border-gray-300 shadow-sm sm:text-sm" />
                    ) : item.unit_price}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-right font-medium">
                    {isRejected ? (
                      <input type="number" value={item.line_total} onChange={(e) => handleItemChange(idx, 'line_total', e.target.value)} className="w-24 text-right rounded-md border-gray-300 shadow-sm sm:text-sm border-indigo-200 bg-indigo-50" />
                    ) : item.line_total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg overflow-hidden mt-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-base font-semibold leading-6 text-gray-900">Source Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Source Bucket</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 break-all font-mono">{doc.source?.bucket || 'N/A'}</dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Source Key</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 break-all font-mono">{doc.source?.key || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
