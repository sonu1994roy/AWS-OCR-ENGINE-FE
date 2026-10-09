import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  CheckCircle2, 
  ShieldCheck, 
  Cloud, 
  FileText, 
  Activity,
  ArrowRight
} from 'lucide-react';

export function LiveScannerVisual() {
  return (
    <div className="relative w-full rounded-2xl bg-slate-900/90 border border-slate-800/90 p-5 sm:p-6 shadow-2xl backdrop-blur-xl overflow-hidden group">
      {/* Ambient background glow behind visual */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Visual Window Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="flex space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-400 font-mono text-[11px] flex items-center">
            <FileText className="w-3.5 h-3.5 mr-1 text-indigo-400" />
            INV_SUN-26-27-0098_SunriseTraders.pdf
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
            AWS us-east-1 Live
          </span>
        </div>
      </div>

      {/* Simulated Document Scanning Window */}
      <div className="relative mt-4 rounded-xl bg-slate-950/90 border border-slate-800/80 p-4 overflow-hidden min-h-[220px]">
        {/* Animated Laser Scanline */}
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] pointer-events-none z-20 animate-scanline" />

        {/* Invoice Layout Mock Wireframe with OCR Bounding Boxes */}
        <div className="space-y-3 font-mono text-[11px] relative z-10">
          {/* Header Bounding Box */}
          <div className="p-2.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 relative">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold text-white">VENDOR: SUNRISE TRADERS LTD.</span>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                Textract Layout · 99.8%
              </span>
            </div>
            <div className="text-slate-400 text-[10px] mt-0.5">
              TAX ID: GB998234102 · DATE: 2026-04-12 · CURRENCY: EUR (€)
            </div>
          </div>

          {/* Line Items Bounding Box */}
          <div className="p-2.5 rounded-lg border border-slate-800 bg-slate-900/60">
            <div className="flex justify-between text-slate-400 text-[10px] pb-1 border-b border-slate-800">
              <span>SKU / PRODUCT</span>
              <span>QTY</span>
              <span>TOTAL</span>
            </div>
            <div className="pt-1.5 space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-white">ELE-902 Microcontrollers</span>
                <span className="text-slate-400">40</span>
                <span className="font-medium text-slate-200">€1,840.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">SEN-411 Temp Sensors</span>
                <span className="text-slate-400">120</span>
                <span className="font-medium text-slate-200">€1,374.40</span>
              </div>
            </div>
          </div>

          {/* Totals & Validation Result */}
          <div className="p-2.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-300">SUBTOTAL: €3,214.40 · TAX (7.88%): €253.55</div>
              <div className="text-xs font-bold text-emerald-300">GRAND TOTAL: €3,467.95</div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center text-[10px] font-semibold text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Math Delta: 0.00
              </span>
              <div className="text-[9px] text-slate-400 font-mono">S3 clean/json/ validated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Processing Architecture Timeline */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Serverless Execution Pipeline</span>
          <span className="text-cyan-400">Avg Latency 1.38s</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Stage 1 */}
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] font-mono">
            <div className="text-slate-400 text-[9px]">STAGE 1: EXTRACT</div>
            <div className="text-white font-semibold truncate mt-0.5">pdf-data-cleaner</div>
            <div className="text-emerald-400 text-[9px] mt-0.5">✓ 0.42s [Textract]</div>
          </div>

          {/* Stage 2 */}
          <div className="p-2 rounded-lg bg-indigo-950/30 border border-indigo-500/30 text-[10px] font-mono">
            <div className="text-indigo-400 text-[9px]">STAGE 2: NORMALIZE</div>
            <div className="text-white font-semibold truncate mt-0.5">DeepSeek V3.2</div>
            <div className="text-cyan-400 text-[9px] mt-0.5">✓ 0.84s [Bedrock]</div>
          </div>

          {/* Stage 3 */}
          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] font-mono">
            <div className="text-slate-400 text-[9px]">STAGE 3: VALIDATE</div>
            <div className="text-white font-semibold truncate mt-0.5">Validator Lambda</div>
            <div className="text-emerald-400 text-[9px] mt-0.5">✓ 0.12s [Verified]</div>
          </div>
        </div>
      </div>

      {/* Bottom Live Metrics */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-800/40 text-[11px] text-slate-400">
        <span className="flex items-center text-slate-300">
          <Activity className="w-3.5 h-3.5 mr-1 text-cyan-400" />
          Extraction Accuracy: <span className="text-white font-bold ml-1 font-mono">99.98%</span>
        </span>
        <span className="flex items-center text-emerald-400 font-mono text-[10px]">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Deterministic Zero Error
        </span>
      </div>
    </div>
  );
}
