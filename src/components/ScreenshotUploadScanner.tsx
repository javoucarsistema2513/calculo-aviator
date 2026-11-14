import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  ClipboardPaste,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Target,
  Zap,
  ArrowRight,
  Calculator,
  Layers,
  Flame,
} from 'lucide-react';
import { ExtractedCandle, ScreenshotAnalysisResult } from '../types';

interface ScreenshotUploadScannerProps {
  onApplyExtractedData: (data: {
    multiplier: number;
    roundNumber?: string;
    time?: string;
    house?: string;
  }) => void;
  playFeedbackSound?: (freq?: number, duration?: number) => void;
}

export const ScreenshotUploadScanner: React.FC<ScreenshotUploadScannerProps> = ({
  onApplyExtractedData,
  playFeedbackSound,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/png');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ScreenshotAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Decimal Calculator states
  const [showManualDecimal, setShowManualDecimal] = useState(false);
  const [manualVelaA, setManualVelaA] = useState('2.37');
  const [manualVelaB, setManualVelaB] = useState('1.84');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global paste listener for pasting screenshots (Ctrl+V) anywhere on page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione ou cole um arquivo de imagem (PNG, JPG, WebP).');
      return;
    }

    setErrorMsg(null);
    setImageMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImagePreview(base64);
      setAnalysisResult(null);
      if (playFeedbackSound) playFeedbackSound(750, 0.1);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Call server-side Gemini 3.8 Flash analysis endpoint
  const handleAnalyzeScreenshot = async () => {
    if (!imagePreview) return;

    setIsLoading(true);
    setErrorMsg(null);
    if (playFeedbackSound) playFeedbackSound(880, 0.12);

    try {
      const response = await fetch('/api/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageMimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Falha ao analisar a imagem.');
      }

      setAnalysisResult(data);
      if (playFeedbackSound) playFeedbackSound(1050, 0.2);

      // Auto-apply the latest extracted candle to the calculator
      if (data.latestMultiplier) {
        onApplyExtractedData({
          multiplier: data.latestMultiplier,
          roundNumber: data.latestRoundNumber,
          time: data.detectedTime,
          house: data.detectedPlatform,
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : 'Erro ao processar imagem com IA.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setAnalysisResult(null);
    setErrorMsg(null);
  };

  // Helper for color styles of extracted candles
  const getPillColor = (color: string, multiplier: number) => {
    if (multiplier >= 50 || color === 'super') {
      return 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-300 font-black shadow-amber-500/30';
    }
    if (multiplier >= 10 || color === 'pink') {
      return 'bg-pink-600 text-white border-pink-400 font-extrabold shadow-pink-600/30';
    }
    if (multiplier >= 2 || color === 'purple') {
      return 'bg-purple-600 text-white border-purple-400 font-bold';
    }
    return 'bg-blue-600/80 text-blue-100 border-blue-400 font-medium';
  };

  // Manual calculation of decimal subtraction |B-A| + |D-C|
  const computeManualDecimals = () => {
    const partsA = manualVelaA.replace(',', '.').split('.');
    const partsB = manualVelaB.replace(',', '.').split('.');

    const intA = parseInt(partsA[0] || '1', 10);
    const decA = (partsA[1] || '00').padEnd(2, '0');
    const intB = parseInt(partsB[0] || '1', 10);
    const decB = (partsB[1] || '00').padEnd(2, '0');

    // Differences
    const d1A = parseInt(decA[0], 10) || 0;
    const d2A = parseInt(decA[1], 10) || 0;
    const d1B = parseInt(decB[0], 10) || 0;
    const d2B = parseInt(decB[1], 10) || 0;

    const diff1 = Math.abs(d1B - d1A);
    const diff2 = Math.abs(d2B - d2A);
    const totalMin = diff1 + diff2 || 2;

    const firstDecA = d1A || 5;
    const firstDecB = d1B || 5;

    return {
      diff1,
      diff2,
      totalMin,
      firstDecA,
      firstDecB,
    };
  };

  const manualCalc = computeManualDecimals();

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20">
            <ClipboardPaste className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              Scanner de Print & Decimais das Rodadas
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                IA Multimodal
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Cole um print da tela com <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 font-mono text-[10px] border border-slate-700">Ctrl + V</kbd> ou envie a foto das rodadas para extrair os decimais e calcular automaticamente.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowManualDecimal(!showManualDecimal)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
            showManualDecimal
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-400" />
          <span>{showManualDecimal ? 'Ocultar Calculadora de Decimais' : 'Calculadora de Decimais'}</span>
        </button>
      </div>

      {/* MANUAL DECIMAL CALCULATOR ACCORDION */}
      {showManualDecimal && (
        <div className="mb-4 p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Calculadora Manual de Decimais (Módulo 5 pág 4 & pág 34)
            </span>
            <span className="text-[11px] text-slate-400">Fórmula: |B - A| + |D - C|</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
            <div>
              <label className="text-slate-400 block mb-1">Vela Anterior (ex: 2.37x)</label>
              <input
                type="text"
                value={manualVelaA}
                onChange={(e) => setManualVelaA(e.target.value)}
                placeholder="2.37"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Vela Atual (ex: 1.84x)</label>
              <input
                type="text"
                value={manualVelaB}
                onChange={(e) => setManualVelaB(e.target.value)}
                placeholder="1.84"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-slate-300 font-semibold">
                Resultado Subtração de Decimais: <strong className="text-pink-400">+{manualCalc.totalMin} Minutos</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                |{manualVelaB.split('.')[1]?.[0] || '8'} - {manualVelaA.split('.')[1]?.[0] || '3'}| = {manualCalc.diff1}m &nbsp;+&nbsp; |{manualVelaB.split('.')[1]?.[1] || '4'} - {manualVelaA.split('.')[1]?.[1] || '7'}| = {manualCalc.diff2}m ➔ {manualCalc.diff1} + {manualCalc.diff2} = {manualCalc.totalMin}m para Vela Rosa
              </div>
            </div>

            <button
              onClick={() => {
                const multVal = parseFloat(manualVelaB) || 2.0;
                onApplyExtractedData({ multiplier: multVal });
                if (playFeedbackSound) playFeedbackSound(900, 0.1);
              }}
              className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1 active:scale-95 transition"
            >
              <span>Aplicar {manualVelaB}x ao Radar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* DROP / PASTE ZONE */}
      {!imagePreview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
              : 'border-slate-700/80 bg-slate-950/60 hover:border-pink-500/50 hover:bg-slate-900/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 mb-1">
              <Upload className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-white">
                Cole o Print aqui com <kbd className="px-2 py-0.5 bg-slate-800 text-pink-300 rounded font-mono text-xs border border-slate-700">Ctrl + V</kbd> ou Clique para Enviar
              </p>
              <p className="text-xs text-slate-400">
                Suporta prints de celular ou computador de qualquer casa (Bet7k, Betano, Blaze, etc.)
              </p>
            </div>

            <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-medium">
              <span>✓ Lê multiplicadores</span>
              <span>•</span>
              <span>✓ Extrai rodadas</span>
              <span>•</span>
              <span>✓ Identifica decimais</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Image preview & action buttons */}
          <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 p-2 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative max-h-48 max-w-full sm:max-w-xs overflow-hidden rounded-lg border border-slate-700">
              <img
                src={imagePreview}
                alt="Print das Rodadas do Aviator"
                className="w-full h-auto object-contain max-h-44"
              />
              <button
                onClick={clearImage}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-900 transition"
                title="Remover imagem"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <ImageIcon className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-bold text-slate-200">
                  Print Carregado com Sucesso!
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clique abaixo para analisar a imagem com a IA e extrair todas as velas, números de rodada, horários e cálculos de decimais.
              </p>

              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                <button
                  onClick={handleAnalyzeScreenshot}
                  disabled={isLoading}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-600/30 flex items-center gap-2 active:scale-95 transition disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Analisando Imagem com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Escanear Rodadas e Decimais</span>
                    </>
                  )}
                </button>

                <button
                  onClick={clearImage}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                >
                  Trocar Imagem
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ANALYSIS RESULTS DISPLAY */}
          {analysisResult && (
            <div className="p-4 rounded-xl bg-slate-950/90 border border-pink-500/30 space-y-3 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    {analysisResult.candles.length} Velas Extraídas da Imagem
                  </span>
                  {analysisResult.detectedPlatform && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-pink-300 border border-slate-700">
                      Casa: {analysisResult.detectedPlatform}
                    </span>
                  )}
                </div>

                {analysisResult.detectedTime && (
                  <span className="text-xs text-amber-300 font-mono font-bold">
                    Horário Lido: {analysisResult.detectedTime}
                  </span>
                )}
              </div>

              {/* Extracted Candles Strip */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Histórico de Velas Reconhecido (Clique em qualquer vela para preencher no Radar):
                </span>

                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {analysisResult.candles.map((c: ExtractedCandle, idx: number) => {
                    const isLatest = idx === 0;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          onApplyExtractedData({
                            multiplier: c.multiplier,
                            roundNumber: c.roundNumber || analysisResult.latestRoundNumber,
                            time: c.time || analysisResult.detectedTime,
                            house: analysisResult.detectedPlatform,
                          });
                          if (playFeedbackSound) playFeedbackSound(800, 0.09);
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs flex flex-col items-center transition cursor-pointer hover:scale-105 active:scale-95 ${getPillColor(
                          c.color,
                          c.multiplier
                        )} ${isLatest ? 'ring-2 ring-pink-400 ring-offset-1 ring-offset-slate-950' : ''}`}
                        title={`Vela: ${c.multiplier}x | Decimais: .${c.decimals} | 1º Decimal: ${c.firstDecimal}`}
                      >
                        <div className="flex items-center gap-1 font-bold">
                          <span>{c.multiplier.toFixed(2)}x</span>
                          {isLatest && (
                            <span className="text-[9px] bg-black/40 px-1 py-0.2 rounded uppercase">
                              Mais recente
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] opacity-80 font-mono">
                          dec: .{c.decimals} (1º: {c.firstDecimal})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Decimal Analysis Breakdown */}
              {analysisResult.decimalAnalysis && (
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                  <span className="text-pink-400 font-bold block mb-0.5 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Cálculo Automático de Decimais:
                  </span>
                  <p className="text-slate-300">{analysisResult.decimalAnalysis}</p>
                </div>
              )}

              {/* Patterns / Triggers Found in Print */}
              {analysisResult.patternsFound && analysisResult.patternsFound.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Padrões & Gatilhos Detectados no Print:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {analysisResult.patternsFound.map((pat: string, idx: number) => (
                      <div
                        key={idx}
                        className="text-[11px] p-2 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-200 font-medium flex items-center gap-1.5"
                      >
                        <Zap className="w-3 h-3 text-amber-400 flex-shrink-0" />
                        <span>{pat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Quick-apply notification */}
              <div className="text-right pt-1">
                <span className="text-[11px] text-emerald-400 font-semibold inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Os dados da última vela ({analysisResult.latestMultiplier.toFixed(2)}x) já foram calculados no Radar abaixo!
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
