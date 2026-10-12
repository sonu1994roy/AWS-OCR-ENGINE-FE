"use client";

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  AlertTriangle, 
  CheckCircle, 
  Save, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Building2, 
  User, 
  Calculator, 
  Sparkles, 
  Calendar, 
  Coins, 
  FileText, 
  RotateCw,
  Download,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';

const ALLOWED_CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD", "AUD", "CAD", "JPY", "CHF"];
const DOCUMENT_TYPES = ["PURCHASE_ORDER", "INVOICE", "RECEIPT", "CREDIT_NOTE"];

export default function DocumentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Editable Document Header States
  const [docNumber, setDocNumber] = useState<string>('');
  const [docType, setDocType] = useState<string>('PURCHASE_ORDER');
  const [docDate, setDocDate] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [currency, setCurrency] = useState<string>('INR');

  // Editable Supplier Information
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierTaxId, setSupplierTaxId] = useState<string>('');
  const [supplierAddress, setSupplierAddress] = useState<string>('');

  // Editable Buyer Information (Required by validater.py)
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerTaxId, setBuyerTaxId] = useState<string>('');
  const [buyerAddress, setBuyerAddress] = useState<string>('');

  // Editable Financial Amounts
  const [subtotal, setSubtotal] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);
  const [shipping, setShipping] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);

  // Editable Line Items
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const fetchDoc = async () => {
    setLoading(true);
    setSaveErrors([]);
    try {
      const res = await api.get(`/documents/${id}`);
      const data = res.data;
      setDoc(data);

      const d = data.data || {};
      setDocNumber(d.document_number || '');
      setDocType(d.document_type || 'PURCHASE_ORDER');
      setDocDate(d.document_date || '');
      setDeliveryDate(d.delivery_date || '');
      setCurrency(d.currency || 'INR');

      setSupplierName(d.supplier?.name || '');
      setSupplierTaxId(d.supplier?.tax_id || '');
      setSupplierAddress(d.supplier?.address || '');

      setBuyerName(d.buyer?.name || '');
      setBuyerTaxId(d.buyer?.tax_id || '');
      setBuyerAddress(d.buyer?.address || '');

      const initialItems = Array.isArray(d.items) ? d.items : [];
      setItems(initialItems);

      const itemsSum = initialItems.reduce((acc: number, it: any) => acc + (Number(it.line_total) || 0), 0);
      const initialSubtotal = d.subtotal !== null && d.subtotal !== undefined ? Number(d.subtotal) : Math.round(itemsSum * 100) / 100;
      setSubtotal(initialSubtotal);

      const initialTax = d.tax !== null && d.tax !== undefined ? Number(d.tax) : 0;
      const initialShipping = d.shipping !== null && d.shipping !== undefined ? Number(d.shipping) : 0;
      const initialDiscount = d.discount !== null && d.discount !== undefined ? Number(d.discount) : 0;
      setTax(initialTax);
      setShipping(initialShipping);
      setDiscount(initialDiscount);

      // Grand total initialization
      if (d.grand_total !== null && d.grand_total !== undefined) {
        setGrandTotal(Number(d.grand_total));
      } else {
        // Automatically derive expected grand total if missing
        const derived = Math.round((initialSubtotal + initialTax + initialShipping - initialDiscount) * 100) / 100;
        setGrandTotal(derived);
      }
    } catch (e) {
      console.error("Failed to load document:", e);
    } finally {
      setLoading(false);
    }
  };

  // Line item arithmetic
  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    const updatedItem = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const q = Number(field === 'quantity' ? value : updatedItem.quantity) || 0;
      const p = Number(field === 'unit_price' ? value : updatedItem.unit_price) || 0;
      updatedItem.line_total = Math.round(q * p * 100) / 100;
    }

    newItems[index] = updatedItem;
    setItems(newItems);

    // Auto-update subtotal
    const newSub = Math.round(newItems.reduce((acc, curr) => acc + (Number(curr.line_total) || 0), 0) * 100) / 100;
    setSubtotal(newSub);
  };

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, idx) => idx !== index);
    setItems(newItems);
    const newSub = Math.round(newItems.reduce((acc, curr) => acc + (Number(curr.line_total) || 0), 0) * 100) / 100;
    setSubtotal(newSub);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        sku: '',
        description: 'New Line Item',
        quantity: 1,
        unit: 'pcs',
        unit_price: 0,
        line_total: 0
      }
    ]);
  };

  // Derived financial computations
  const calculatedItemsSum = useMemo(() => {
    return Math.round(items.reduce((acc, it) => acc + (Number(it.line_total) || 0), 0) * 100) / 100;
  }, [items]);

  const expectedGrandTotal = useMemo(() => {
    return Math.round((Number(subtotal || 0) + Number(tax || 0) + Number(shipping || 0) - Number(discount || 0)) * 100) / 100;
  }, [subtotal, tax, shipping, discount]);

  const isFinancialBalanced = useMemo(() => {
    return Math.abs(Number(grandTotal || 0) - expectedGrandTotal) <= 0.01;
  }, [grandTotal, expectedGrandTotal]);

  const delta = useMemo(() => {
    return Math.round(Math.abs(Number(grandTotal || 0) - expectedGrandTotal) * 100) / 100;
  }, [grandTotal, expectedGrandTotal]);

  // Validation error detection
  const allValidationErrors = useMemo(() => {
    const initialErrs: string[] = doc?.validation?.errors || [];
    return Array.from(new Set([...saveErrors, ...initialErrs]));
  }, [doc, saveErrors]);

  const hasBuyerError = useMemo(() => {
    return allValidationErrors.some(e => e.toLowerCase().includes('buyer'));
  }, [allValidationErrors]);

  const hasGrandTotalError = useMemo(() => {
    return allValidationErrors.some(e => e.toLowerCase().includes('grand_total') || e.toLowerCase().includes('incomplete'));
  }, [allValidationErrors]);

  const hasSupplierError = useMemo(() => {
    return allValidationErrors.some(e => e.toLowerCase().includes('supplier'));
  }, [allValidationErrors]);

  const hasSubtotalError = useMemo(() => {
    return allValidationErrors.some(e => e.toLowerCase().includes('subtotal'));
  }, [allValidationErrors]);

  // Suggestion detection for NW/2026/0771 email style PO
  const suggestedBuyerName = useMemo(() => {
    const docNum = (doc?.data?.document_number || '').toUpperCase();
    const key = (doc?.source?.key || '').toLowerCase();
    if (docNum.includes('NW') || key.includes('email') || key.includes('raw_a')) {
      return 'Northwind India Pvt Ltd';
    }
    return '';
  }, [doc]);

  const handleReprocess = async () => {
    if (!doc) return;
    setSaving(true);
    setSaveErrors([]);
    setSaveSuccess(null);

    // Client-side quick checks
    const clientErrors: string[] = [];
    if (!buyerName.trim()) {
      clientErrors.push("Buyer Entity Name is required by the financial validator.");
    }
    if (!supplierName.trim()) {
      clientErrors.push("Supplier Name is required.");
    }
    if (!docNumber.trim()) {
      clientErrors.push("Document Number is required.");
    }
    if (!docDate.trim()) {
      clientErrors.push("Document Date is required.");
    }
    if (items.length === 0) {
      clientErrors.push("At least one line item is required.");
    }

    if (clientErrors.length > 0) {
      setSaveErrors(clientErrors);
      setSaving(false);
      return;
    }

    // Deduplicate items
    const itemsMap = new Map<string, any>();
    items.forEach((item, idx) => {
      const sku = (item.sku || '').trim().toUpperCase();
      const desc = (item.description || '').trim().toUpperCase();
      const key = (sku || desc) ? `${sku}_${desc}` : `item_${idx}`;

      const qty = Number(item.quantity) || 0;
      const price = Number(item.unit_price) || 0;
      const lt = Number(item.line_total) || Math.round(qty * price * 100) / 100;
      const isMatch = Math.abs(lt - (qty * price)) <= 0.01;

      const payloadItem = {
        ...item,
        quantity: qty,
        unit_price: price,
        line_total: lt,
      };

      if (itemsMap.has(key)) {
        const existing = itemsMap.get(key);
        const exMatch = Math.abs(existing.line_total - (existing.quantity * existing.unit_price)) <= 0.01;
        if (isMatch || !exMatch) {
          itemsMap.set(key, payloadItem);
        }
      } else {
        itemsMap.set(key, payloadItem);
      }
    });

    const deduplicatedItems = Array.from(itemsMap.values());
    const finalSubtotal = Math.round(deduplicatedItems.reduce((acc, it) => acc + (Number(it.line_total) || 0), 0) * 100) / 100;

    // Full comprehensive payload
    const updatedDoc = {
      ...doc,
      data: {
        ...doc.data,
        document_number: docNumber.trim(),
        document_type: docType,
        document_date: docDate.trim(),
        delivery_date: deliveryDate ? deliveryDate.trim() : null,
        currency: currency.trim().toUpperCase(),
        supplier: {
          ...(doc.data?.supplier || {}),
          name: supplierName.trim(),
          tax_id: supplierTaxId.trim() || null,
          address: supplierAddress.trim() || null,
        },
        buyer: {
          ...(doc.data?.buyer || {}),
          name: buyerName.trim(),
          tax_id: buyerTaxId.trim() || null,
          address: buyerAddress.trim() || null,
        },
        subtotal: finalSubtotal,
        tax: Number(tax) || 0,
        shipping: Number(shipping) || 0,
        discount: Number(discount) || 0,
        grand_total: Number(grandTotal),
        items: deduplicatedItems
      }
    };

    try {
      const res = await api.put(`/documents/${id}/reprocess`, updatedDoc);
      setSaveSuccess("Document certified VALID and saved to clean/json/!");
      // Reload updated document state
      await fetchDoc();
    } catch (err: any) {
      console.error("Save & Reprocess failed:", err);
      const detail = err.response?.data?.detail;
      if (detail && Array.isArray(detail.errors)) {
        setSaveErrors(detail.errors);
      } else if (typeof detail === 'string') {
        setSaveErrors([detail]);
      } else {
        setSaveErrors(["Failed to save and reprocess document. Please review entered fields."]);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-500 font-medium">Loading document metadata...</div>;
  if (!doc) return <div className="p-12 text-center text-red-500 font-medium">Document not found.</div>;

  const isRejected = doc.validation?.valid === false;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Actions */}
      <div className="sm:flex sm:items-center sm:justify-between bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                Document Review: {docNumber || doc.data?.document_number || id}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isRejected 
                  ? 'bg-red-50 text-red-700 border border-red-200' 
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isRejected ? 'REJECTED · NEEDS REVIEW' : 'VALID · CERTIFIED'}
              </span>
              {(doc.validation?.version_tag || doc.validation?.manually_reviewed) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {doc.validation?.version_tag || 'Reviewed v2'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Document ID: {doc.document_id || id} · Type: {docType}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doc, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", `${doc.document_id || id}.json`);
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="inline-flex items-center rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
            Download JSON
          </button>

          <button
            onClick={handleReprocess}
            disabled={saving}
            className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer"
          >
            {saving ? (
              <>
                <RotateCw className="h-4 w-4 mr-1.5 animate-spin" />
                Validating & Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1.5" />
                Save & Reprocess
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-emerald-900">{saveSuccess}</h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                All deterministic arithmetic, buyer info, and financial totals have verified successfully and transferred to AWS S3 <code className="bg-emerald-100/80 px-1 py-0.5 rounded font-mono">clean/json/</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Validation Errors Card */}
      {allValidationErrors.length > 0 && (
        <div className="rounded-2xl bg-red-50/90 border border-red-200 p-4 shadow-xs">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-red-900">
                  Validation Errors ({allValidationErrors.length})
                </h3>
                <span className="text-xs text-red-700 font-medium">
                  Update missing or mismatched input fields below to certify
                </span>
              </div>
              <ul className="mt-2 text-xs text-red-800 space-y-1 list-disc pl-4 font-mono">
                {allValidationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Valid Document Notice */}
      {!isRejected && allValidationErrors.length === 0 && (
        <div className="rounded-2xl bg-emerald-50/90 border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="ml-3 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-emerald-950">Document Certified & Validated</h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Ready for Forecasting & Analytics
                </span>
              </div>
              <p className="mt-1 text-xs text-emerald-800">
                Deterministic mathematical checks verified: Subtotal ({currency} {subtotal.toLocaleString()}) + Tax + Shipping = Grand Total ({currency} {grandTotal.toLocaleString()}).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Document Classification & Header Information */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <FileText className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Document Header & Classification</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500"
            >
              {DOCUMENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. NW/2026/0771"
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-medium focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Document Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={docDate}
              onChange={(e) => setDocDate(e.target.value)}
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Delivery Date (Optional)
            </label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-bold font-mono focus:border-indigo-500 focus:ring-indigo-500"
            >
              {ALLOWED_CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Parties Information (Buyer & Supplier Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buyer Details (Target of missing buyer.name issue) */}
        <div className={`bg-white rounded-2xl border ${
          hasBuyerError && !buyerName.trim()
            ? 'border-red-300 ring-2 ring-red-100 bg-red-50/20' 
            : 'border-slate-200/90'
        } shadow-xs p-6 transition`}>
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <User className={`w-4 h-4 ${hasBuyerError && !buyerName.trim() ? 'text-red-600' : 'text-indigo-600'}`} />
              <h3 className="text-sm font-bold text-slate-900">Buyer Information</h3>
            </div>
            {hasBuyerError && !buyerName.trim() && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                ⚠️ Required by Validator
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Buyer Entity Name <span className="text-red-500">*</span>
                </label>
                {suggestedBuyerName && !buyerName.trim() && (
                  <button
                    type="button"
                    onClick={() => setBuyerName(suggestedBuyerName)}
                    className="inline-flex items-center text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 mr-1 text-indigo-500" />
                    Quick-fill: &quot;{suggestedBuyerName}&quot;
                  </button>
                )}
              </div>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Northwind India Pvt Ltd"
                className={`w-full rounded-xl text-xs font-medium shadow-xs focus:ring-indigo-500 ${
                  hasBuyerError && !buyerName.trim()
                    ? 'border-red-400 bg-red-50/40 text-red-900 placeholder:text-red-300'
                    : 'border-slate-300'
                }`}
              />
              {hasBuyerError && !buyerName.trim() && (
                <p className="text-[11px] text-red-600 mt-1">
                  Validator requires a non-empty buyer name to certify this purchase order.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Tax ID / GSTIN
              </label>
              <input
                type="text"
                value={buyerTaxId}
                onChange={(e) => setBuyerTaxId(e.target.value)}
                placeholder="e.g. GSTIN27AABCN1234F1Z5"
                className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-medium focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Billing Address
              </label>
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => setBuyerAddress(e.target.value)}
                placeholder="e.g. 402 Business Tower, Bandra Kurla Complex, Mumbai"
                className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Supplier Details */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Supplier / Vendor Information</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. Sunrise Traders Pvt Ltd"
                className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Tax ID / GSTIN
              </label>
              <input
                type="text"
                value={supplierTaxId}
                onChange={(e) => setSupplierTaxId(e.target.value)}
                placeholder="e.g. GSTIN07AABCS9876Q1Z2"
                className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-medium focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Address
              </label>
              <input
                type="text"
                value={supplierAddress}
                onChange={(e) => setSupplierAddress(e.target.value)}
                placeholder="e.g. Plot 12, Industrial Area Phase II, New Delhi"
                className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-medium focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Financial Reconciliation & Summary Breakdown */}
      <div className={`bg-white rounded-2xl border ${
        hasGrandTotalError || !isFinancialBalanced
          ? 'border-amber-300 ring-2 ring-amber-100'
          : 'border-slate-200/90'
      } shadow-xs p-6 transition`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Financial Reconciliation & Settlement</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isFinancialBalanced ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ✓ Formula Balanced (Delta: 0.00)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                ⚠️ Delta Mismatch: {currency} {delta.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* 5 Financial Column Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Subtotal */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Subtotal ({currency}) <span className="text-red-500">*</span>
              </label>
              {calculatedItemsSum !== subtotal && (
                <button
                  type="button"
                  onClick={() => setSubtotal(calculatedItemsSum)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                  title="Sync with sum of line items"
                >
                  Sync ({calculatedItemsSum.toLocaleString()})
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={subtotal}
              onChange={(e) => setSubtotal(Number(e.target.value))}
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-bold focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Items sum: {currency} {calculatedItemsSum.toLocaleString()}
            </p>
          </div>

          {/* Tax */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tax Amount ({currency})
            </label>
            <input
              type="number"
              step="any"
              value={tax}
              onChange={(e) => setTax(Number(e.target.value))}
              placeholder="0.00"
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-medium focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              GST / VAT amount
            </p>
          </div>

          {/* Shipping */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shipping / Freight ({currency})
            </label>
            <input
              type="number"
              step="any"
              value={shipping}
              onChange={(e) => setShipping(Number(e.target.value))}
              placeholder="0.00"
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-medium focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Courier & handling charges
            </p>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Discount ({currency})
            </label>
            <input
              type="number"
              step="any"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0.00"
              className="w-full rounded-xl border-slate-300 shadow-xs text-xs font-mono font-medium focus:border-indigo-500 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Deducted promo/discount
            </p>
          </div>

          {/* Grand Total */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Grand Total ({currency}) <span className="text-red-500">*</span>
              </label>
              {!isFinancialBalanced && (
                <button
                  type="button"
                  onClick={() => setGrandTotal(expectedGrandTotal)}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                >
                  Auto-fill ({expectedGrandTotal.toLocaleString()})
                </button>
              )}
            </div>
            <input
              type="number"
              step="any"
              value={grandTotal}
              onChange={(e) => setGrandTotal(Number(e.target.value))}
              className={`w-full rounded-xl shadow-xs text-xs font-mono font-black focus:ring-indigo-500 ${
                !isFinancialBalanced
                  ? 'border-amber-400 bg-amber-50/30 text-amber-900'
                  : 'border-indigo-300 bg-indigo-50/20 text-indigo-900'
              }`}
            />
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Expected: {currency} {expectedGrandTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Financial Formula Quick Action Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-mono">
            <span className="font-semibold text-slate-900">Validator Formula:</span>
            <span>Subtotal ({subtotal.toLocaleString()})</span>
            <span>+ Tax ({tax.toLocaleString()})</span>
            <span>+ Shipping ({shipping.toLocaleString()})</span>
            <span>- Discount ({discount.toLocaleString()})</span>
            <span className="font-bold text-slate-900">= {expectedGrandTotal.toLocaleString()} {currency}</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setGrandTotal(expectedGrandTotal)}
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Apply Derived Grand Total ({currency} {expectedGrandTotal.toLocaleString()})
            </button>
            <button
              type="button"
              onClick={() => setGrandTotal(subtotal)}
              className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              Match Subtotal
            </button>
          </div>
        </div>
      </div>

      {/* Section 4: Line Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/40">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-slate-900">Line Items ({items.length})</h3>
              <span className="text-xs text-slate-500">
                · Sum of Line Totals: <span className="font-mono font-bold text-slate-900">{currency} {calculatedItemsSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Edit quantities, unit prices, or descriptions to correct OCR misalignments.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Line Item
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/60">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 w-32">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">Product Description</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 w-24">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 w-20">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 w-32">Unit Price ({currency})</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-700 w-36">Line Total ({currency})</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-700 w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition">
                  {/* SKU */}
                  <td className="px-4 py-3 text-xs font-mono">
                    <input
                      type="text"
                      value={item.sku || ''}
                      onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                      placeholder="SKU"
                      className="w-full rounded-lg border-slate-200 text-xs font-mono py-1 px-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 text-xs">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full rounded-lg border-slate-200 text-xs py-1 px-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Quantity */}
                  <td className="px-4 py-3 text-xs text-right">
                    <input
                      type="number"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-full text-right rounded-lg border-slate-200 text-xs py-1 px-2 font-mono focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Unit */}
                  <td className="px-4 py-3 text-xs">
                    <input
                      type="text"
                      value={item.unit || ''}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      placeholder="pcs"
                      className="w-full rounded-lg border-slate-200 text-xs py-1 px-2 text-slate-500 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Unit Price */}
                  <td className="px-4 py-3 text-xs text-right">
                    <input
                      type="number"
                      step="any"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      className="w-full text-right rounded-lg border-slate-200 text-xs py-1 px-2 font-mono focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Line Total */}
                  <td className="px-4 py-3 text-xs text-right font-medium">
                    <input
                      type="number"
                      step="any"
                      value={item.line_total}
                      onChange={(e) => handleItemChange(idx, 'line_total', e.target.value)}
                      className="w-full text-right rounded-lg border-indigo-200 bg-indigo-50/40 text-indigo-900 font-bold font-mono text-xs py-1 px-2 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </td>

                  {/* Delete Item Action */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer"
                      title="Delete line item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 5: Source Information & Provenance */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3 mb-4">
          <Coins className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Source Information & S3 Provenance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-[11px] font-sans font-semibold text-slate-500 mb-0.5">Source AWS S3 Bucket</span>
            <span className="text-slate-900 font-bold break-all">{doc.source?.bucket || 'N/A'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="block text-[11px] font-sans font-semibold text-slate-500 mb-0.5">Source AWS S3 Object Key</span>
            <span className="text-slate-900 font-bold break-all">{doc.source?.key || 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
