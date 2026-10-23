import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, Sparkles, Check, AlertCircle, ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { AviatorCandle, getCandleColor } from '../services/aviatorEngine';

interface ScreenshotUploaderProps {
  onImportCandles: (candles: AviatorCandle[]) => void;
  onPlaySignal: () => void;
}

interface AnalysisResult {
  candles?: Array<{ value: number; color: 'blue' | 'purple' | 'pink'; timestamp?: string; roundId?: string }>;
  detectedCycle?: 'PAGUE' | 'RECOLHE' | 'FALSO_PAGUE';
  cycleDescription?: string;
  summary?: string;
  immediateSignals?: Array<{
    title: string;
    reason: string;
    targetMultiplier: string;
    confidence: number;
    recommendation: string;
    protectionAdvice: string;
  }>;
  mentorTip?: string;
}

export const ScreenshotUploader: React.FC<ScreenshotUploaderProps> = ({
  onImportCandles,
  onPlaySignal,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor envie um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }
    setErrorMsg(null);
    setImported(false);
    setResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setImagePreview(base64);
      analyzeWithGemini(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const analyzeWithGemini = async (base64Image: string, mimeType: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/gemini/analyze-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image, mimeType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setResult(data);

      if (data.immediateSignals && data.immediateSignals.length > 0) {
        onPlaySignal();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Não foi possível analisar a imagem. Verifique se sua chave GEMINI_API_KEY está configurada ou envie um print mais nítido do histórico de velas.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToBoard = () => {
    if (!result?.candles || result.candles.length === 0) return;
    const mapped: AviatorCandle[] = result.candles.map((c, i) => ({
      id: `ocr-${Date.now()}-${i}`,
      value: Number(c.value),
      color: c.color || getCandleColor(Number(c.value)),
      timestamp: c.timestamp,
      roundId: c.roundId,
    }));
    onImportCandles(mapped);
    setImported(true);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Visão Multimodal Gemini 3.8 Flash
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Análise Inteligente de Print de Velas
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mt-1">
              Envie um print do histórico de velas do Aviator, Tipminer ou da sua plataforma de aposta. O assistente de IA lê os multiplicadores, calcula a proporção do ciclo e aponta os gatilhos assertivos na hora!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-rose-950/50 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Enviar Print
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
              title="Tirar foto com câmera"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />
          </div>
        </div>

        {/* Dropzone / Paste Area */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              processFile(e.dataTransfer.files[0]);
            }
          }}
          className={`mt-5 border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition cursor-pointer ${
            imagePreview
              ? 'border-zinc-700 bg-zinc-950/40'
              : 'border-zinc-700 hover:border-rose-500/80 bg-zinc-950/60 hover:bg-zinc-900/40'
          }`}
        >
          {imagePreview ? (
            <div className="relative inline-block max-w-full">
              <img
                src={imagePreview}
                alt="Print do Aviator"
                className="max-h-64 sm:max-h-80 mx-auto rounded-xl border border-zinc-700 shadow-xl object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-4">
                  <div className="relative w-16 h-16 mb-3">
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping"></div>
                    <div className="w-16 h-16 rounded-full border-4 border-t-rose-500 border-r-rose-500 border-b-transparent border-l-transparent animate-spin"></div>
                    <Sparkles className="w-6 h-6 text-rose-400 absolute inset-0 m-auto" />
                  </div>
                  <p className="text-sm font-bold text-white">IA Analisando Velas e Gatilhos...</p>
                  <p className="text-xs text-zinc-400 mt-1">Extraindo multiplicadores e calculando ciclos da mentoria</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-zinc-400 space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-rose-500 mb-1">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-white">
                Arraste seu print aqui ou clique para selecionar
              </p>
              <p className="text-xs text-zinc-400">
                Você também pode simplesmente apertar <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono">Ctrl + V</kbd> para colar direto!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800 text-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="block font-bold">Aviso na análise:</strong>
            {errorMsg}
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Diagnóstico IA da Imagem Concluído
                </h3>
                <p className="text-xs text-zinc-400">
                  {result.candles?.length || 0} velas identificadas com sucesso
                </p>
              </div>
            </div>

            <button
              onClick={handleApplyToBoard}
              disabled={imported}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                imported
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/50'
              }`}
            >
              {imported ? (
                <>
                  <Check className="w-4 h-4" /> Velas Importadas para o Gráfico!
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" /> Importar para o Gráfico Principal
                </>
              )}
            </button>
          </div>

          {/* Cycle & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs text-zinc-500 font-medium block mb-1">Ciclo Identificado:</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-black uppercase px-2.5 py-0.5 rounded-md ${
                    result.detectedCycle === 'PAGUE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : result.detectedCycle === 'RECOLHE'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {result.detectedCycle || 'INDEFINIDO'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                {result.cycleDescription || 'Leitura de dispersão dos multiplicadores.'}
              </p>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs text-zinc-500 font-medium block mb-1">Resumo do Histórico:</span>
              <p className="text-sm text-zinc-200">
                {result.summary || 'Análise visual detalhada concluída.'}
              </p>
              {result.mentorTip && (
                <div className="mt-2 text-xs text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  💡 Conselho do Pai do Aviator: {result.mentorTip}
                </div>
              )}
            </div>
          </div>

          {/* Candles grid recognized */}
          {result.candles && result.candles.length > 0 && (
            <div>
              <span className="text-xs text-zinc-400 font-semibold mb-2 block">
                Velas Extraídas do Print (Cronologia: mais antiga → mais recente):
              </span>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-zinc-950/70 rounded-2xl border border-zinc-800">
                {result.candles.map((c, i) => (
                  <span
                    key={i}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                      c.color === 'blue'
                        ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                        : c.color === 'purple'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                        : 'bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white border border-rose-400/50'
                    }`}
                  >
                    {Number(c.value).toFixed(2)}x
                    {c.timestamp && <span className="ml-1 text-[10px] opacity-75">({c.timestamp})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Immediate signals detected by AI */}
          {result.immediateSignals && result.immediateSignals.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" /> Sinais Imediatos Calculados pela IA:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.immediateSignals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{sig.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {sig.confidence}% Assertivo
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300">{sig.reason}</p>
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <span className="text-zinc-400">
                        Alvo Sugerido: <strong className="text-rose-400">{sig.targetMultiplier}</strong>
                      </span>
                      <span className="text-zinc-400 text-right">
                        {sig.recommendation}
                      </span>
                    </div>
                    {sig.protectionAdvice && (
                      <div className="text-[11px] text-emerald-400/90 bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/30">
                        🛡️ {sig.protectionAdvice}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
