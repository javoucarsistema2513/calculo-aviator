import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  ClipboardPaste,
  ImagePlus,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { ALL_HOUSES } from '../data/aviatorRules';

export interface ExtractedCandleItem {
  vela: number;
  horario?: string;
  rodada?: string;
}

export interface AviatorAIAnalysis {
  casaDetectada?: string;
  leituraDoGrafico?: string;
  resumoExecutivo?: string;
  ultimaRodada?: {
    numeroRodada?: string;
    vela?: number;
    horario?: string;
  };
  velasExtraidas?: ExtractedCandleItem[];
  decimaisPredominantes?: Array<{
    decimal: string;
    quantidade: number;
    significado: string;
  }>;
  padroesDetectados?: Array<{
    nome: string;
    fontePdf: string;
    explicacao: string;
  }>;
  entradasRecomendadas?: Array<{
    rodadaAlvo: string;
    horarioAlvo: string;
    alvo: string;
    protecao: string;
    execucao: string;
    estrategiaPdf: string;
    confianca: string;
  }>;
  alertasDeRisco?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
}

interface AssistenteIAViewProps {
  selectedHouse: string;
  customHouses: string[];
  onSelectHouse: (house: string) => void;
  onAddCustomHouse: (house: string) => void;
  roundInput: string;
  multiplierInput: string;
  timeInput: string;
  onApplyExtractedData: (payload: {
    house?: string;
    roundNumber?: string;
    multiplier?: string;
    timeStr?: string;
    candles?: ExtractedCandleItem[];
    goToBuscador?: boolean;
  }) => void;
  onScheduleAlert: (params: {
    key?: string;
    title: string;
    body: string;
    houseName: string;
    roundNumber?: string;
    targetTime: string;
    targetMultiplier: string;
    protection: string;
  }) => Promise<void>;
  prefilledHistory?: string | null;
  onConsumePrefilledHistory?: () => void;
}

const QUICK_ASK_SUGGESTIONS = [
  'Vale entrar após vela 1.37x na 82B?',
  'Como fazer o casamento de decimais hoje?',
  'Como identificar gráfico em Pague vs Recolhe?',
  'Qual proteção usar na 1ª e 2ª mão?',
];

const QUICK_PROMPTS = [
  'Ler print das rodadas e calcular próximas entradas',
  'Identificar decimais predominantes e casamento de velas',
  'Avaliar se o gráfico na 82B está Pagante ou Recolhe',
  'Checar gatilhos de Rosa (10x+) e proteção 1.49x',
];

function getCandleStyle(vela: number) {
  if (vela >= 10) {
    return 'border-pink-500/40 bg-pink-500/15 text-pink-300';
  }
  if (vela >= 2) {
    return 'border-violet-500/40 bg-violet-500/15 text-violet-300';
  }
  return 'border-sky-500/40 bg-sky-500/15 text-sky-300';
}

async function prepareImagePayload(file: File): Promise<{ base64: string; mimeType: string; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler a imagem selecionada.'));
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => {
        const [, rawBase64 = ''] = dataUrl.split(',');
        resolve({ base64: rawBase64, mimeType: file.type || 'image/png', previewUrl: dataUrl });
      };
      img.onload = () => {
        const maxDim = 1600;
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size <= 3 * 1024 * 1024) {
          const [, rawBase64 = ''] = dataUrl.split(',');
          resolve({ base64: rawBase64, mimeType: file.type || 'image/png', previewUrl: dataUrl });
          return;
        }
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.max(1, Math.round(width * scale));
        height = Math.max(1, Math.round(height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const [, rawBase64 = ''] = dataUrl.split(',');
          resolve({ base64: rawBase64, mimeType: file.type || 'image/png', previewUrl: dataUrl });
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedUrl = canvas.toDataURL('image/jpeg', 0.88);
        const [, compressedBase64 = ''] = compressedUrl.split(',');
        resolve({ base64: compressedBase64, mimeType: 'image/jpeg', previewUrl: compressedUrl });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const AssistenteIAView: React.FC<AssistenteIAViewProps> = ({
  selectedHouse,
  customHouses,
  onSelectHouse,
  onAddCustomHouse,
  roundInput,
  multiplierInput,
  timeInput,
  onApplyExtractedData,
  onScheduleAlert,
  prefilledHistory,
  onConsumePrefilledHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [showAddHouse, setShowAddHouse] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [decimalsText, setDecimalsText] = useState('');

  useEffect(() => {
    if (prefilledHistory) {
      setDecimalsText(prefilledHistory);
      onConsumePrefilledHistory?.();
    }
  }, [prefilledHistory, onConsumePrefilledHistory]);
  const [localRound, setLocalRound] = useState('');
  const [localCandle, setLocalCandle] = useState('');
  const [localTime, setLocalTime] = useState('');
  const [promptText, setPromptText] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AviatorAIAnalysis | null>(null);
  const [applyFeedback, setApplyFeedback] = useState<string | null>(null);
  const [scheduledKeys, setScheduledKeys] = useState<Record<string, boolean>>({});

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const allHousesList = useMemo(() => {
    return Array.from(new Set([...customHouses, ...ALL_HOUSES]));
  }, [customHouses]);

  const handleAddHouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHouseName.trim();
    if (!trimmed) return;
    onAddCustomHouse(trimmed);
    onSelectHouse(trimmed);
    setNewHouseName('');
    setShowAddHouse(false);
  };

  const handleFileSelected = async (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAnalyzeError('Selecione um arquivo de imagem válido (PNG, JPG ou WebP).');
      return;
    }
    try {
      setAnalyzeError(null);
      const prepared = await prepareImagePayload(file);
      setImagePreview(prepared.previewUrl);
      setImageBase64(prepared.base64);
      setImageMimeType(prepared.mimeType);
      setImageName(file.name || 'print-rodadas.png');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erro ao processar a imagem.');
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleFileSelected(file);
          return;
        }
      }
    }
  };

  const handleClearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    setImageName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePullFromBuscador = () => {
    setLocalRound(roundInput);
    setLocalCandle(multiplierInput);
    setLocalTime(timeInput);
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageBase64 && !decimalsText.trim() && !localCandle.trim() && !promptText.trim()) {
      setAnalyzeError('Envie um print das rodadas, informe os decimais/velas ou escreva uma instrução para a IA.');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setApplyFeedback(null);

    try {
      const response = await fetch('/api/aviator/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseName: selectedHouse,
          roundNumber: localRound.trim() || undefined,
          lastCandle: localCandle.trim() || undefined,
          timeStr: localTime.trim() || undefined,
          decimalsText: decimalsText.trim() || undefined,
          userPrompt: promptText.trim() || undefined,
          imageBase64: imageBase64 || undefined,
          imageMimeType: imageMimeType || undefined,
        }),
      });

      const data = (await response.json()) as { analysis?: AviatorAIAnalysis; error?: string };
      if (!response.ok || !data.analysis) {
        throw new Error(data.error || 'Não foi possível concluir a análise da IA.');
      }

      setAnalysisResult(data.analysis);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Erro ao conectar com o assistente de IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const buildAnalysisContextSummary = (): string => {
    const parts: string[] = [`Casa: ${selectedHouse}`];
    if (decimalsText.trim()) parts.push(`Decimais/Sequência digitada: ${decimalsText.trim()}`);
    if (analysisResult) {
      if (analysisResult.leituraDoGrafico) parts.push(`Gráfico: ${analysisResult.leituraDoGrafico}`);
      if (analysisResult.resumoExecutivo) parts.push(`Resumo: ${analysisResult.resumoExecutivo}`);
      if (analysisResult.ultimaRodada?.vela) {
        parts.push(
          `Última rodada: #${analysisResult.ultimaRodada.numeroRodada || '-'} | ${analysisResult.ultimaRodada.vela}x | ${analysisResult.ultimaRodada.horario || '-'}`
        );
      }
      if (analysisResult.velasExtraidas && analysisResult.velasExtraidas.length > 0) {
        parts.push(
          `Velas extraídas: ${analysisResult.velasExtraidas.map((v) => `${Number(v.vela).toFixed(2)}x`).join(', ')}`
        );
      }
      if (analysisResult.decimaisPredominantes && analysisResult.decimaisPredominantes.length > 0) {
        parts.push(
          `Decimais predominantes: ${analysisResult.decimaisPredominantes
            .map((d) => `${d.decimal} (${d.quantidade}x - ${d.significado})`)
            .join('; ')}`
        );
      }
    }
    return parts.join('\n');
  };

  const submitQuestion = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || isChatting) return;

    const userMsg: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput('');
    setChatError(null);
    setIsChatting(true);

    try {
      const response = await fetch('/api/aviator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseName: selectedHouse,
          roundNumber: localRound || roundInput,
          lastCandle: localCandle || multiplierInput,
          timeStr: localTime || timeInput,
          contextSummary: buildAnalysisContextSummary(),
          messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Falha ao obter resposta do assistente.');
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: 'assistant',
          text: data.reply as string,
        },
      ]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Erro no chat com o assistente.');
    } finally {
      setIsChatting(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuestion(chatInput);
  };

  const handleApplyToBuscador = (goToBuscador: boolean) => {
    if (!analysisResult) return;
    const firstCandle = analysisResult.velasExtraidas?.[0];
    const resolvedRound =
      analysisResult.ultimaRodada?.numeroRodada || firstCandle?.rodada || localRound || undefined;
    const resolvedMult =
      analysisResult.ultimaRodada?.vela !== undefined
        ? Number(analysisResult.ultimaRodada.vela).toFixed(2)
        : firstCandle?.vela !== undefined
          ? Number(firstCandle.vela).toFixed(2)
          : localCandle || undefined;
    const resolvedTime =
      analysisResult.ultimaRodada?.horario || firstCandle?.horario || localTime || undefined;

    onApplyExtractedData({
      house: selectedHouse,
      roundNumber: resolvedRound,
      multiplier: resolvedMult,
      timeStr: resolvedTime,
      candles: analysisResult.velasExtraidas,
      goToBuscador,
    });

    if (!goToBuscador) {
      setApplyFeedback(`Velas aplicadas ao histórico de ${selectedHouse} e carregadas no Buscador.`);
      setTimeout(() => setApplyFeedback(null), 3000);
    }
  };

  return (
    <div className="space-y-6" onPaste={handlePaste}>
      {/* Dedicated Top AI Question Field */}
      <section className="rounded-2xl border border-emerald-500/30 bg-[#131A26] p-4 sm:p-6">
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <MessageSquare className="h-4 w-4" />
              <span>Assistente IA Exclusivo Aviator · Casa {selectedHouse}</span>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50 text-balance">
              Pergunte ao Assistente de IA
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Tire qualquer dúvida sobre estratégias dos PDFs, decimais, horários fortes, gestão de banca ou leitura da rodada atual (<span className="font-mono text-slate-200">#{roundInput || '—'} · {multiplierInput || '—'}x</span>).
            </p>
          </div>

          {selectedHouse !== '82B' && (
            <button
              type="button"
              onClick={() => onSelectHouse('82B')}
              className="min-h-[40px] self-start rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer shrink-0"
            >
              Selecionar Casa 82B
            </button>
          )}
        </div>

        <form onSubmit={handleSendChat} className="mt-4 space-y-3">
          <div>
            <label htmlFor="ai-question-field" className="block text-xs font-medium text-slate-300 mb-1.5">
              Campo de Perguntas para o Assistente de IA
            </label>
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <textarea
                id="ai-question-field"
                rows={2}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void submitQuestion(chatInput);
                  }
                }}
                placeholder={`Digite sua pergunta para o Assistente de IA sobre a ${selectedHouse} (ex: "Saiu 1.37x depois de 3 azuis, qual a próxima entrada?")...`}
                className="w-full flex-1 rounded-xl border border-white/15 bg-[#0B0F17] p-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isChatting || !chatInput.trim()}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
              >
                {isChatting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Respondendo...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Perguntar à IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Perguntas rápidas:</span>
            {QUICK_ASK_SUGGESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => void submitQuestion(q)}
                disabled={isChatting}
                className="min-h-[34px] rounded-lg border border-white/10 bg-[#192231] px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 disabled:opacity-50 transition-colors cursor-pointer text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </form>

        {chatError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{chatError}</span>
          </div>
        )}

        {chatMessages.length > 0 && (
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto border-t border-white/10 pt-4 pr-1">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-xl p-3.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-auto max-w-2xl bg-emerald-600/20 border border-emerald-500/30 text-slate-100'
                    : 'mr-auto max-w-3xl bg-[#0B0F17] border border-white/10 text-slate-200'
                }`}
              >
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {msg.role === 'user' ? 'Você' : 'Assistente Aviator'}
                </div>
                {msg.text}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Print & Decimals Analysis Workspace */}
      <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
              <Bot className="h-4 w-4" />
              <span>Leitura Multimodal · PDFs Módulos 1 a 5 & Treinamento III</span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-50">
              Analisar Print das Rodadas & Decimais
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Envie ou cole (<span className="font-mono text-slate-300">Ctrl+V</span>) o print do histórico de rodadas e os decimais da <span className="font-semibold text-emerald-300">{selectedHouse}</span> para extração automática e agendamento de alertas.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePullFromBuscador}
            className="min-h-[40px] self-start rounded-xl border border-white/15 bg-[#192231] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            Puxar rodada do Buscador (#{roundInput || '—'})
          </button>
        </div>

        <form onSubmit={handleAnalyze} className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Print Dropzone + House Selector */}
          <div className="lg:col-span-5 space-y-4">
            {/* Casa Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="ai-house-select" className="text-xs font-medium text-slate-300">
                  Casa de Apostas
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddHouse((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Outra casa</span>
                </button>
              </div>

              {showAddHouse ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHouseName}
                    onChange={(e) => setNewHouseName(e.target.value)}
                    placeholder="Ex: 82B, Betano..."
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddHouseSubmit}
                    className="min-h-[44px] rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer shrink-0"
                  >
                    Usar
                  </button>
                </div>
              ) : (
                <select
                  id="ai-house-select"
                  value={selectedHouse}
                  onChange={(e) => onSelectHouse(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm font-semibold text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {allHousesList.map((house) => (
                    <option key={house} value={house} className="bg-[#0B0F17] text-slate-100">
                      {house}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Print Upload / Paste Zone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-slate-300">
                  Print das Rodadas (Imagem / Ctrl+V)
                </span>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-400 hover:text-red-300 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remover print</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelected(e.target.files?.[0])}
              />

              {imagePreview ? (
                <div className="relative overflow-hidden rounded-xl border border-emerald-500/35 bg-[#0B0F17]">
                  <img
                    src={imagePreview}
                    alt="Print das rodadas do Aviator"
                    className="max-h-64 w-full object-contain bg-black/40"
                  />
                  <div className="flex items-center justify-between border-t border-white/10 px-3 py-2 text-xs text-slate-400">
                    <span className="truncate">{imageName || 'print-anexado.png'}</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer shrink-0 ml-2"
                    >
                      Trocar print
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    await handleFileSelected(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex min-h-[190px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-emerald-400 bg-emerald-500/10'
                      : 'border-white/15 bg-[#0B0F17] hover:border-emerald-500/50'
                  }`}
                >
                  <ImagePlus className="h-8 w-8 text-emerald-400" />
                  <p className="mt-2.5 text-sm font-medium text-slate-200">
                    Toque para enviar o print das rodadas
                  </p>
                  <p className="mt-1 text-xs text-slate-400 max-w-xs">
                    Arraste a captura de tela do histórico da <span className="text-slate-200 font-medium">{selectedHouse}</span> ou pressione <span className="font-mono text-slate-200">Ctrl+V</span> aqui.
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Upload className="h-3.5 w-3.5" /> PNG / JPG / WebP
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ClipboardPaste className="h-3.5 w-3.5" /> Colar print
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Decimals + Round/Time + Prompt */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="ai-decimals-input" className="text-xs font-medium text-slate-300">
                    Campo de Decimais e Sequência de Velas
                  </label>
                  <span className="text-[11px] text-slate-500">Opcional se enviar print</span>
                </div>
                <textarea
                  id="ai-decimals-input"
                  rows={3}
                  value={decimalsText}
                  onChange={(e) => setDecimalsText(e.target.value)}
                  placeholder="Ex: 1.37 1.00 2.45 12.56 1.88 1.11 ou digite os decimais predominantes (.37, .00, .89)..."
                  className="w-full rounded-xl border border-white/15 bg-[#0B0F17] p-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label htmlFor="ai-round-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Rodada Atual (opcional)
                  </label>
                  <input
                    id="ai-round-input"
                    type="text"
                    inputMode="numeric"
                    value={localRound}
                    onChange={(e) => setLocalRound(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 4310524"
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ai-candle-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Última Vela (opcional)
                  </label>
                  <input
                    id="ai-candle-input"
                    type="text"
                    inputMode="decimal"
                    value={localCandle}
                    onChange={(e) => setLocalCandle(e.target.value)}
                    placeholder="Ex: 12.56"
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="ai-time-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                    Horário (opcional)
                  </label>
                  <input
                    id="ai-time-input"
                    type="text"
                    value={localTime}
                    onChange={(e) => setLocalTime(e.target.value)}
                    placeholder="16:21:23"
                    className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ai-prompt-input" className="block text-xs font-medium text-slate-300 mb-1.5">
                  Instrução para análise do print / decimais
                </label>
                <input
                  id="ai-prompt-input"
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ex: Analise as decimais na 82B e me diga as rodadas exatas para entrar..."
                  className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPromptText(q)}
                      className="min-h-[34px] rounded-lg border border-white/10 bg-[#192231] px-2.5 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors cursor-pointer text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {analyzeError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/35 bg-red-500/10 p-3 text-xs text-red-200">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                <span>{analyzeError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-400">
                Casa ativa: <span className="font-semibold text-slate-100">{selectedHouse}</span>
              </div>
              <button
                type="submit"
                disabled={isAnalyzing}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Lendo print & decimais...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Analisar Print & Decimais</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </section>

      {/* AI Structured Analysis Results */}
      {analysisResult && (
        <section className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
            <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-emerald-400">
                    {analysisResult.casaDetectada || selectedHouse}
                  </span>
                  {analysisResult.leituraDoGrafico && (
                    <>
                      <span aria-hidden="true" className="text-slate-500">·</span>
                      <span className="font-medium text-amber-300">
                        {analysisResult.leituraDoGrafico}
                      </span>
                    </>
                  )}
                </div>
                <h2 className="mt-1 text-lg font-semibold text-slate-100">
                  Leitura do Gráfico & Velas Extraídas
                </h2>
              </div>

              {(analysisResult.velasExtraidas?.length || analysisResult.ultimaRodada?.vela) && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyToBuscador(false)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Aplicar no Histórico ({selectedHouse})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyToBuscador(true)}
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                  >
                    <span>Aplicar e Abrir Buscador</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {applyFeedback && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{applyFeedback}</span>
              </div>
            )}

            {analysisResult.resumoExecutivo && (
              <p className="mt-4 text-sm leading-relaxed text-slate-200">
                {analysisResult.resumoExecutivo}
              </p>
            )}

            {analysisResult.ultimaRodada && (analysisResult.ultimaRodada.vela || analysisResult.ultimaRodada.numeroRodada) && (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-xl border border-white/10 bg-[#0B0F17] p-3.5 text-xs">
                <div>
                  <div className="text-slate-500">Última Rodada Lida</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">
                    {analysisResult.ultimaRodada.numeroRodada ? `#${analysisResult.ultimaRodada.numeroRodada}` : 'Não visível'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Última Vela</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-emerald-300">
                    {analysisResult.ultimaRodada.vela !== undefined
                      ? `${Number(analysisResult.ultimaRodada.vela).toFixed(2)}x`
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Horário Detectado</div>
                  <div className="mt-0.5 font-mono text-sm font-semibold text-slate-100">
                    {analysisResult.ultimaRodada.horario || 'Atual'}
                  </div>
                </div>
              </div>
            )}

            {analysisResult.velasExtraidas && analysisResult.velasExtraidas.length > 0 && (
              <div className="mt-4">
                <div className="text-xs font-medium text-slate-400 mb-2">
                  Velas extraídas em ordem (da mais recente para a mais antiga):
                </div>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-10">
                  {analysisResult.velasExtraidas.map((item, idx) => (
                    <div
                      key={`${item.vela}-${idx}`}
                      className={`rounded-lg border px-2 py-1.5 text-center font-mono text-xs font-semibold ${getCandleStyle(
                        Number(item.vela)
                      )}`}
                    >
                      <div>{Number(item.vela).toFixed(2)}x</div>
                      {item.horario && (
                        <div className="mt-0.5 text-[10px] opacity-75">{item.horario}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Entradas Recomendadas */}
            <section className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
              <h2 className="text-base font-semibold text-slate-100 border-b border-white/10 pb-3">
                Entradas Recomendadas pela IA
              </h2>

              {analysisResult.entradasRecomendadas && analysisResult.entradasRecomendadas.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {analysisResult.entradasRecomendadas.map((entry, idx) => {
                    const key = `ai-${entry.rodadaAlvo}-${entry.horarioAlvo}-${idx}`;
                    const isScheduled = Boolean(scheduledKeys[key]);
                    return (
                      <article key={key} className="py-4 first:pt-4 last:pb-0">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="text-xs text-emerald-400 font-medium">
                              {entry.confianca || 'Entrada PDF'} · {entry.estrategiaPdf}
                            </div>
                            <h3 className="mt-1 font-mono text-sm font-semibold text-slate-100">
                              Rodada {entry.rodadaAlvo} · {entry.horarioAlvo}
                            </h3>
                          </div>
                          <div className="text-right font-mono">
                            <div className="text-sm font-bold text-emerald-300">Alvo {entry.alvo}</div>
                            <div className="text-xs text-slate-400">Proteção {entry.protecao}</div>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs text-slate-300">{entry.execucao}</p>
                          <button
                            type="button"
                            onClick={async () => {
                              await onScheduleAlert({
                                key,
                                title: `${selectedHouse} · IA ${entry.estrategiaPdf}`,
                                body: `Rodada ${entry.rodadaAlvo} às ${entry.horarioAlvo} | Alvo ${entry.alvo} (Prot. ${entry.protecao})`,
                                houseName: selectedHouse,
                                roundNumber: entry.rodadaAlvo,
                                targetTime: entry.horarioAlvo,
                                targetMultiplier: entry.alvo,
                                protection: entry.protecao,
                              });
                              setScheduledKeys((prev) => ({ ...prev, [key]: true }));
                            }}
                            className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                              isScheduled
                                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                                : 'border-white/15 bg-[#0B0F17] text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300'
                            }`}
                          >
                            <Bell className="h-3.5 w-3.5" />
                            <span>{isScheduled ? 'Alerta Agendado' : 'Alertar em 2º Plano'}</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-400">
                  Nenhuma entrada direta sugerida para este ciclo; observe os alertas de risco ao lado.
                </p>
              )}
            </section>

            {/* Decimals, Patterns & Risk Alerts */}
            <section className="lg:col-span-5 space-y-6">
              {analysisResult.decimaisPredominantes && analysisResult.decimaisPredominantes.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
                  <h2 className="text-base font-semibold text-slate-100 mb-3">
                    Decimais Predominantes
                  </h2>
                  <div className="space-y-2.5">
                    {analysisResult.decimaisPredominantes.map((dec, idx) => (
                      <div key={`${dec.decimal}-${idx}`} className="rounded-xl bg-[#0B0F17] p-3 text-xs">
                        <div className="flex items-center justify-between font-mono font-semibold">
                          <span className="text-emerald-300">Decimal {dec.decimal}</span>
                          <span className="text-slate-300">{dec.quantidade}x no ciclo</span>
                        </div>
                        <p className="mt-1 text-slate-400">{dec.significado}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.padroesDetectados && analysisResult.padroesDetectados.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
                  <h2 className="text-base font-semibold text-slate-100 mb-3">
                    Padrões dos PDFs Identificados
                  </h2>
                  <div className="space-y-2.5">
                    {analysisResult.padroesDetectados.map((pad, idx) => (
                      <div key={`${pad.nome}-${idx}`} className="rounded-xl bg-[#0B0F17] p-3 text-xs">
                        <div className="flex items-center justify-between gap-2 font-semibold text-slate-100">
                          <span>{pad.nome}</span>
                          <span className="text-[11px] font-normal text-emerald-400 shrink-0">{pad.fontePdf}</span>
                        </div>
                        <p className="mt-1 text-slate-400">{pad.explicacao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.alertasDeRisco && analysisResult.alertasDeRisco.length > 0 && (
                <div className="rounded-2xl border border-amber-500/30 bg-[#131A26] p-4 sm:p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-amber-300 mb-2.5">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Alertas de Risco & Gestão</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                    {analysisResult.alertasDeRisco.map((alerta, idx) => (
                      <li key={idx}>{alerta}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        </section>
      )}
    </div>
  );
};
