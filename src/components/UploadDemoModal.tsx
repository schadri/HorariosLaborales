'use client';

import React, { useState } from 'react';
import { X, Sparkles, Upload, Bot, CheckCircle2, ArrowRight, FileText, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UploadDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentEmployeeName: string;
}

export const UploadDemoModal: React.FC<UploadDemoModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentEmployeeName
}) => {
  const [targetEmployee, setTargetEmployee] = useState(currentEmployeeName || 'SCHUSTER ADRIAN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrStep, setOcrStep] = useState<number>(0);
  const [extractedJson, setExtractedJson] = useState<any>(null);

  const handleRunSimulation = async () => {
    setIsProcessing(true);
    setOcrStep(1); // Receiving image
    setExtractedJson(null);

    try {
      await new Promise(r => setTimeout(r, 600));
      setOcrStep(2); // AI Vision analyzing row for target employee

      await new Promise(r => setTimeout(r, 900));
      setOcrStep(3); // Parsing JSON schema

      const res = await fetch('/api/vision/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeName: targetEmployee })
      });

      const data = await res.json();
      setExtractedJson(data);
      setOcrStep(4); // Saved to PostgreSQL

      await new Promise(r => setTimeout(r, 600));
      onSuccess();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl rounded-2xl glass-panel bg-slate-900/95 border border-white/15 p-6 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Simulador de Visión OCR & WhatsApp
                </h2>
                <p className="text-xs text-slate-400">
                  Prueba el pipeline de extracción de la planilla en tiempo real
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-5 space-y-5">
            
            {/* Target Employee Input */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Empleado a Filtrar en la Planilla:
              </label>
              <input
                type="text"
                value={targetEmployee}
                onChange={(e) => setTargetEmployee(e.target.value.toUpperCase())}
                placeholder="ej: SCHUSTER ADRIAN o ANDRADE WALTER DANIEL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-white/10 text-white font-bold text-sm focus:outline-none focus:border-brand-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                💡 El modelo de visión ignorará todas las demás filas y solo extraerá a esta persona.
              </span>
            </div>

            {/* Visual Representation of Schedule Sheet Image */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <FileText className="w-4 h-4 text-brand-400" />
                  Muestra de Planilla de Horarios Detectada
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                  IMG_WHATSAPP_7384.JPG
                </span>
              </div>

              {/* Table preview mockup */}
              <div className="text-[11px] font-mono rounded-lg bg-slate-900/90 p-3 border border-white/5 overflow-x-auto space-y-1.5">
                <div className="text-slate-500 font-bold border-b border-white/10 pb-1">
                  NOMBRE | LUN | MAR | MIE | JUE | VIE | SAB | DOM
                </div>
                <div className={`p-1 rounded transition-colors ${
                  targetEmployee.includes('SCHUSTER') ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/40' : 'text-slate-400'
                }`}>
                  SCHUSTER ADRIAN | 10:30-18:30 | 14-22 | 14-22 | 14-22 | 10-18 | 10-18 | LIBRE
                </div>
                <div className={`p-1 rounded transition-colors ${
                  targetEmployee.includes('ANDRADE') ? 'bg-brand-500/20 text-brand-300 font-bold border border-brand-500/40' : 'text-slate-500'
                }`}>
                  ANDRADE WALTER  | 06:00-14:00 | 06-14 | 06-14 | LIBRE | 06-14 | 06-14 | 06-14
                </div>
              </div>
            </div>

            {/* Progress Pipeline Steps */}
            {ocrStep > 0 && (
              <div className="p-4 rounded-xl bg-slate-800/60 border border-white/10 space-y-2">
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  Estado del Pipeline n8n:
                </span>
                
                <div className={`flex items-center gap-2 text-xs ${ocrStep >= 1 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>1. Imagen recibida vía Webhook de WhatsApp</span>
                </div>

                <div className={`flex items-center gap-2 text-xs ${ocrStep >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>2. GPT-4o Vision OCR analizando fila de &quot;{targetEmployee}&quot;</span>
                </div>

                <div className={`flex items-center gap-2 text-xs ${ocrStep >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>3. Normalización a JSON Schema (7 días de la semana)</span>
                </div>

                <div className={`flex items-center gap-2 text-xs ${ocrStep >= 4 ? 'text-emerald-400' : 'text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>4. UPSERT exitoso en base de datos PostgreSQL</span>
                </div>
              </div>
            )}

            {/* Action Trigger */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Cerrar
              </button>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isProcessing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>Ejecutar Extracción OCR</span>
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
