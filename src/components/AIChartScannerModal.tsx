import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Zap, 
  ShieldCheck,
  Calculator,
  Hash,
  Activity,
  Layers,
  Clock,
  Flame,
  Check
} from 'lucide-react';
import { AIChartAnalysis, CandleRoundDetail } from '../types/aviator';

interface AIChartScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCandles: (multipliers: number[], roundDetails?: CandleRoundDetail[]) => void;
  onApplyAIPrediction: (analysis: AIChartAnalysis) => void;
}

export const AIChartScannerModal: React.FC<AIChartScannerModalProps> = ({
  isOpen,
  onClose,
  onImportCandles,
  onApplyAIPrediction,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIChartAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasImported, setHasImported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Allow paste from clipboard (Ctrl+V) when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
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
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPEG, WebP).');
      return;
    }

    setErrorMessage(null);
    setAnalysisResult(null);
    setHasImported(false);
    setMimeType(file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasImported(false);

    try {
      const response = await fetch('/api/ai/analyze-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao processar a imagem do gráfico.');
      }

      setAnalysisResult(data.analysis);
    } catch (err: unknown) {
      console.error('Erro na análise do gráfico por IA:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao analisar a imagem. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportCandlesOnly = () => {
    if (!analysisResult) return;
    if (analysisResult.extractedCandles && analysisResult.extractedCandles.length > 0) {
      onImportCandles(analysisResult.extractedCandles, analysisResult.roundDetails);
      setHasImported(true);
    }
  };

  const handleApply = () => {
    if (!analysisResult) return;
    if (analysisResult.extractedCandles && analysisResult.extractedCandles.length > 0) {
      onImportCandles(analysisResult.extractedCandles, analysisResult.roundDetails);
    }
    onApplyAIPrediction(analysisResult);
    onClose();
  };

  const getPillColor = (m: number) => {
    if (m >= 10.0) return 'bg-pink-600 text-white border-pink-400 font-bold';
    if (m >= 2.0) return 'bg-purple-600 text-white border-purple-400 font-semibold';
    return 'bg-slate-800 text-sky-300 border-slate-700';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[94vh] overflow-y-auto rounded-2xl bg-[#110724] border border-rose-500/40 p-4 sm:p-6 shadow-2xl relative text-white scrollbar-thin scrollbar-thumb-rose-950">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-rose-950/80">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 via-rose-600 to-amber-500 p-0.5 shadow-lg flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-[#120824] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-pink-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wide text-white">
                Leitor de Gráfico com Verificação de Rodadas & Decimais
              </h3>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-mono font-bold">
                82B Visão Computacional
              </span>
            </div>
            <p className="text-xs text-rose-300">
              Analisa a imagem, identifica os IDs de rodadas, checa os decimais com centésimos exatos e aplica a Subtração Decimal
            </p>
          </div>
        </div>

        {/* Upload & Dropzone Area */}
        <div className="mt-4 space-y-4">
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-purple-500/40 hover:border-rose-500/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#0c051a] hover:bg-[#15082a] transition duration-200"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center mb-3 text-purple-400">
                <Upload className="w-7 h-7" />
              </div>

              <h4 className="text-sm font-bold text-white mb-1">
                Selecione o print do gráfico da 82b ou cole com Ctrl + V
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                Tire um print da tela com o histórico de rodadas (números, ID das rodadas e multiplicadores) para verificação rigorosa de decimais.
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 shadow"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Escolher Imagem / Print</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border border-purple-500/50 max-h-52 bg-black flex items-center justify-center">
                <img
                  src={selectedImage}
                  alt="Print do gráfico do Aviator"
                  className="max-h-52 w-auto object-contain"
                />
                <button
                  onClick={() => {
                    setSelectedImage(null);
                    setAnalysisResult(null);
                    setHasImported(false);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 hover:bg-black text-white text-xs border border-white/20 transition cursor-pointer"
                  title="Trocar imagem"
                >
                  Trocar Imagem
                </button>
              </div>

              {!analysisResult && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-[#0e0620] border border-purple-900/50">
                  <span className="text-xs text-slate-300">
                    Imagem carregada. Clique para executar a varredura e checar rodadas + decimais.
                  </span>
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shrink-0"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Auditando Rodadas & Decimais com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-pink-300" />
                        <span>Verificar Rodada & Decimais do Gráfico</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Results Display */}
          {analysisResult && (
            <div className="space-y-4 pt-2 border-t border-purple-950 animate-in fade-in duration-200 text-xs">
              
              {/* 1. Header Bar: Round & Decimal Verification Audit */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-[#170a2c] via-[#1f0d38] to-[#120824] border border-emerald-500/40 shadow flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs uppercase tracking-wide">
                        Auditoria de Rodadas & Decimais
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        {analysisResult.roundVerification?.decimalsValidated !== false ? '100% VALIDADO' : 'AUDITADO'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {analysisResult.roundVerification?.auditVerdict || 'Rodadas e centésimos verificados rigorosamente pelos Módulos 82B.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {analysisResult.roundVerification?.latestRoundId && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-purple-900/60 font-mono text-[11px]">
                      <Hash className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-slate-400">Última Rodada:</span>
                      <span className="text-purple-300 font-bold">{analysisResult.roundVerification.latestRoundId}</span>
                    </div>
                  )}

                  {analysisResult.roundVerification?.roundParity && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold ${
                      analysisResult.roundVerification.roundParity === 'ÍMPAR'
                        ? 'bg-amber-950/50 border-amber-500/50 text-amber-300'
                        : 'bg-indigo-950/50 border-indigo-500/50 text-indigo-300'
                    }`}>
                      <span>Casa/Rodada: {analysisResult.roundVerification.roundParity}</span>
                      {analysisResult.roundVerification.roundParity === 'ÍMPAR' && (
                        <span className="text-[9px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-black">95% ACERTO</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Subtraction Decimal Formula Card (Módulo 5 pág. 3) */}
              {analysisResult.decimalFormula && (
                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1b0b2e] to-[#0c0418] border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="font-bold text-amber-300 text-xs uppercase tracking-wide">
                        Cálculo da Subtração Decimal (Módulo 5, pág. 3)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Vela Base: <strong className="text-white">{analysisResult.decimalFormula.sourceCandle}x</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-black/40 p-2.5 rounded-lg border border-purple-950/80">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">Decomposição da Vela</span>
                      <span className="text-xs font-mono font-bold text-white">
                        Inteiro: <span className="text-purple-300">{analysisResult.decimalFormula.integerPart}</span> | Decimal: <span className="text-pink-300">{analysisResult.decimalFormula.decimalPart}</span>
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">Fórmula Matemática</span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {analysisResult.decimalFormula.subtractionMath}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-mono">Minuto Projetado de Entrada</span>
                      <span className="text-xs font-mono font-black text-emerald-400">
                        {analysisResult.decimalFormula.projectedMinute}
                      </span>
                    </div>
                  </div>

                  {analysisResult.decimalFormula.explanation && (
                    <p className="text-[11px] text-slate-300 italic">
                      "{analysisResult.decimalFormula.explanation}"
                    </p>
                  )}
                </div>
              )}

              {/* 3. Detailed Round & Decimal Table Breakdown */}
              {analysisResult.roundDetails && analysisResult.roundDetails.length > 0 ? (
                <div className="p-3 rounded-xl bg-[#0c051a] border border-purple-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span className="font-bold text-slate-200 text-xs uppercase tracking-wide">
                        Rodadas & Decimais Auditados ({analysisResult.roundDetails.length} detectadas)
                      </span>
                    </div>

                    <button
                      onClick={handleImportCandlesOnly}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {hasImported ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Importado com Sucesso!</span>
                        </>
                      ) : (
                        <span>+ Importar para o Histórico</span>
                      )}
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin scrollbar-thumb-purple-900">
                    {analysisResult.roundDetails.map((item, idx) => {
                      const isRedDanger = item.finalDigit === 7;
                      const isRoxoPull = item.finalDigit === 1 || item.finalDigit === 5;
                      const isPink = item.multiplier >= 10;

                      return (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-[#140b29] hover:bg-[#1c0f38] border border-purple-950 transition"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono text-slate-400 w-16 truncate">
                              {item.roundNumber || `#${idx + 1}`}
                            </span>

                            {/* Multiplier with integer and decimal highlight */}
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${
                              isPink
                                ? 'bg-pink-950/80 text-pink-300 border-pink-500/50'
                                : item.multiplier >= 2
                                ? 'bg-purple-950/80 text-purple-300 border-purple-500/50'
                                : 'bg-slate-900 text-sky-300 border-slate-700'
                            }`}>
                              <span>{item.integerPart}</span>
                              <span className="text-white">.{String(item.decimalPart).padStart(2, '0')}x</span>
                            </span>

                            {/* Centésimo badge */}
                            <span className="text-[10px] font-mono text-slate-400">
                              Centésimo: <strong className={isRedDanger ? 'text-red-400 font-bold' : isRoxoPull ? 'text-emerald-400 font-bold' : 'text-slate-300'}>{item.finalDigit}</strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Decimal Ending Analysis Tag */}
                            {isRedDanger && (
                              <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-500/50 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-400" />
                                <span>Final 7: 80% CHANCE DE RED</span>
                              </span>
                            )}

                            {item.finalDigit === 1 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold">
                                Final 1: 80% Puxa Roxo 2x+
                              </span>
                            )}

                            {item.finalDigit === 5 && (
                              <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-500/50 text-[10px] font-bold">
                                Final 5: Puxa Roxo 2x+
                              </span>
                            )}

                            {isPink && (
                              <span className="px-2 py-0.5 rounded bg-pink-950 text-pink-300 border border-pink-500/50 text-[10px] font-bold">
                                Vela Rosa Especial
                              </span>
                            )}

                            {item.parity && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                                item.parity === 'ÍMPAR' ? 'bg-amber-950/70 text-amber-300 border border-amber-600/40' : 'bg-slate-900 text-slate-400'
                              }`}>
                                {item.parity}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Fallback Ribbon if roundDetails is empty */
                analysisResult.extractedCandles && analysisResult.extractedCandles.length > 0 && (
                  <div className="p-3 rounded-xl bg-[#0c051a] border border-purple-900/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-300 text-[11px] uppercase tracking-wide">
                        Velas Lidas na Imagem ({analysisResult.extractedCandles.length} detectadas):
                      </span>
                      <button
                        onClick={handleImportCandlesOnly}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                      >
                        {hasImported ? '✓ Importado com Sucesso!' : '+ Importar para o Histórico do Radar'}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-purple-900">
                      {analysisResult.extractedCandles.map((mult, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono border whitespace-nowrap ${getPillColor(mult)}`}
                        >
                          {mult.toFixed(2)}x
                        </span>
                      ))}
                    </div>
                  </div>
                )
              )}

              {/* 4. Main AI Prediction Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#1a082e] via-[#120524] to-[#0a0314] border border-emerald-500/50 shadow-xl space-y-3">
                
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-900/60">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
                      Estado: {analysisResult.tableState}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold text-rose-300">
                      Padrão: {analysisResult.dominantPattern}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/50">
                    Assertividade IA: {analysisResult.confidence}%
                  </span>
                </div>

                {/* Grid Target & Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-center">
                  
                  <div className="p-3 rounded-lg bg-[#0e051c] border border-purple-900/60">
                    <span className="text-[10px] text-slate-400 font-mono block">Vela Alvo Prevista</span>
                    <span className={`text-2xl font-black font-mono ${
                      analysisResult.targetCandle === 'SUPER_ROSA'
                        ? 'text-amber-300'
                        : analysisResult.targetCandle === 'ROSA'
                        ? 'text-pink-400'
                        : 'text-purple-300'
                    }`}>
                      {analysisResult.targetCandle === 'SUPER_ROSA' ? 'SUPER ROSA' : analysisResult.targetCandle === 'ROSA' ? 'VELA ROSA' : 'VELA ROXA'}
                    </span>
                    <span className="text-xs font-bold text-white block mt-0.5">
                      Alvo: {analysisResult.targetMultiplier}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e051c] border border-purple-900/60">
                    <span className="text-[10px] text-slate-400 font-mono block">Horário Previsto de Entrada</span>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      {analysisResult.projectedTime}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Proteção: <strong className="text-white">{analysisResult.protectionAdvice}</strong>
                    </span>
                  </div>

                </div>

                {/* Key Findings */}
                <div className="p-2.5 rounded-lg bg-[#0c0418] border border-purple-950 text-[11px] text-slate-300 space-y-1">
                  <span className="font-bold text-white block">Diagnóstico Técnico da Imagem:</span>
                  {analysisResult.keyFindings.map((finding, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400">•</span>
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>

                {/* Warning if any */}
                {analysisResult.warningAlert && (
                  <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-500/40 text-red-200 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{analysisResult.warningAlert}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Estratégia: {analysisResult.entryStrategy}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleImportCandlesOnly}
                      className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-purple-600/40"
                    >
                      <Layers className="w-3.5 h-3.5 text-purple-300" />
                      <span>{hasImported ? 'Velas Importadas ✓' : 'Importar Rodadas'}</span>
                    </button>

                    <button
                      onClick={handleApply}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow"
                    >
                      <span>Aplicar no Radar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
