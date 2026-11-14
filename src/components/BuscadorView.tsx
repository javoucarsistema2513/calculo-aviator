import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookmarkCheck,
  Bot,
  CheckCircle2,
  Clock,
  Crosshair,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { ALL_HOUSES } from '../data/aviatorRules';
import { ScheduledAlertItem } from '../hooks/useRealtimeNotifications';
import {
  AnalysisResult,
  CandleColor,
  EntryMode,
  PaceMode,
  PayoutMood,
  ProjectedRound,
  RoundEntry,
  SearchLogItem,
  getCurrentTimeStr,
  parseQuickCandlesText,
} from '../utils/aviatorEngine';
import { EstatisticasHorariosPanel } from './EstatisticasHorariosPanel';
import { RealtimeAlertsPanel } from './RealtimeAlertsPanel';
import { ShareRoundsModal } from './ShareRoundsModal';

interface BuscadorViewProps {
  selectedHouse: string;
  customHouses: string[];
  onSelectHouse: (house: string) => void;
  onAddCustomHouse: (house: string) => void;
  roundInput: string;
  onRoundInputChange: (val: string) => void;
  multiplierInput: string;
  onMultiplierInputChange: (val: string) => void;
  timeInput: string;
  onTimeInputChange: (val: string) => void;
  entryMode: EntryMode;
  onEntryModeChange: (mode: EntryMode) => void;
  payoutMood: PayoutMood;
  onPayoutMoodChange: (mood: PayoutMood) => void;
  paceMode: PaceMode;
  onPaceModeChange: (mode: PaceMode) => void;
  customPaceSec: number | null;
  onSetCustomPaceSec: (sec: number | null) => void;
  onSyncLiveRound: () => string;
  recentCandlesText: string;
  onRecentCandlesTextChange: (val: string) => void;
  analysis: AnalysisResult;
  houseHistory: RoundEntry[];
  searchLog: SearchLogItem[];
  onRegisterRound: () => void;
  onSaveToLog: () => void;
  onJumpToTab: (tab: 'buscador' | 'supervelas' | 'assistente' | 'historico' | 'gatilhos' | 'banca') => void;
  notifications: {
    permission: NotificationPermission | 'unsupported';
    isPushSubscribed: boolean;
    sseConnected: boolean;
    statusNote: string | null;
    isEnabling: boolean;
    soundEnabled: boolean;
    onToggleSound: (val: boolean) => void;
    autoMonitor: boolean;
    onToggleAutoMonitor: (val: boolean) => void;
    leadSeconds: number;
    onLeadSecondsChange: (sec: number) => void;
    scheduledAlerts: ScheduledAlertItem[];
    onEnableBackground: () => void;
    onTestNotification: () => void;
    onCancelAlert: (id: string) => void;
    onScheduleSignalAlert: (params: {
      key: string;
      title: string;
      body: string;
      houseName: string;
      roundNumber?: string;
      targetTime: string;
      targetMultiplier: string;
      protection: string;
    }) => Promise<void>;
  };
}

const CANDLE_STYLES: Record<CandleColor, { text: string; bg: string; border: string; label: string }> = {
  azul: {
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/35',
    label: 'Azul (< 2.00x)',
  },
  roxo: {
    text: 'text-violet-300',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/35',
    label: 'Roxo (2.00x–9.99x)',
  },
  rosa: {
    text: 'text-pink-300',
    bg: 'bg-pink-500/15',
    border: 'border-pink-500/35',
    label: 'Rosa (10.00x+)',
  },
};

const QUICK_EXAMPLES = [
  { label: 'Mód. 5 · 12.56x', round: '4310524', mult: '12.56', time: '16:21:23' },
  { label: 'Mód. 5 · 37.89x', round: '4310619', mult: '37.89', time: '17:02:55' },
  { label: 'Mód. 2 · 5.52x', round: '1809347', mult: '5.52', time: '17:33:37' },
  { label: 'Trein. p.7 · 15.36x', round: '212509', mult: '15.36', time: '01:05:25' },
  { label: 'Especial · 1.37x', round: '411738', mult: '1.37', time: '23:12:54' },
  { label: 'Reset · 1.00x', round: '212509', mult: '1.00', time: '01:05:25' },
];

const QUICK_CANDLES = ['1.00', '1.37', '1.88', '1.99', '2.08', '5.52', '12.56', '37.89'];

export const BuscadorView: React.FC<BuscadorViewProps> = ({
  selectedHouse,
  customHouses,
  onSelectHouse,
  onAddCustomHouse,
  roundInput,
  onRoundInputChange,
  multiplierInput,
  onMultiplierInputChange,
  timeInput,
  onTimeInputChange,
  entryMode,
  onEntryModeChange,
  payoutMood,
  onPayoutMoodChange,
  paceMode,
  onPaceModeChange,
  customPaceSec,
  onSetCustomPaceSec,
  onSyncLiveRound,
  recentCandlesText,
  onRecentCandlesTextChange,
  analysis,
  houseHistory,
  searchLog,
  onRegisterRound,
  onSaveToLog,
  onJumpToTab,
  notifications,
}) => {
  const [newHouseName, setNewHouseName] = useState('');
  const [showAddHouse, setShowAddHouse] = useState(false);
  const [registerFeedback, setRegisterFeedback] = useState<string | null>(null);
  const [liveSyncFeedback, setLiveSyncFeedback] = useState<string | null>(null);
  const [selectedOffset, setSelectedOffset] = useState<number | null>(null);
  const [mapRange, setMapRange] = useState<15 | 30>(30);
  const [colorFilter, setColorFilter] = useState<'todas' | 'rosa' | 'roxo'>('todas');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareFocusedProjected, setShareFocusedProjected] = useState<ProjectedRound | null>(null);

  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isAskingQuick, setIsAskingQuick] = useState(false);
  const [scheduledSignalMap, setScheduledSignalMap] = useState<Record<string, boolean>>({});

  const handleAskQuickAI = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickQuestion.trim();
    if (!trimmed || isAskingQuick) return;
    setIsAskingQuick(true);
    setQuickError(null);

    try {
      const response = await fetch('/api/aviator/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          houseName: selectedHouse,
          roundNumber: roundInput,
          lastCandle: multiplierInput,
          timeStr: timeInput,
          messages: [{ role: 'user', text: trimmed }],
        }),
      });
      const data = (await response.json()) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Erro ao consultar o Assistente IA.');
      }
      setQuickAnswer(data.reply);
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Erro ao perguntar para a IA.');
    } finally {
      setIsAskingQuick(false);
    }
  };

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

  const handleRegister = () => {
    if (!analysis.valid) return;
    onRegisterRound();
    setRegisterFeedback(`Rodada #${analysis.roundNumber} registrada`);
    setTimeout(() => setRegisterFeedback(null), 2200);
  };

  const handleSaveLog = () => {
    if (!analysis.valid) return;
    onSaveToLog();
    setRegisterFeedback('Busca salva no log');
    setTimeout(() => setRegisterFeedback(null), 2200);
  };

  const handleStepRound = (delta: number) => {
    const current = parseInt(roundInput.replace(/\D/g, ''), 10) || 0;
    const next = Math.max(1, current + delta);
    onRoundInputChange(String(next));
  };

  const selectedProjected = selectedOffset
    ? analysis.projectedRounds.find((p) => p.offset === selectedOffset)
    : null;

  return (
    <div className="space-y-6">
      {/* Primary Search & Input Workspace */}
      <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between border-b border-white/10 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-50 text-balance">
              Radar Universal de Rodadas & Entradas
            </h1>
            <p className="mt-1.5 text-sm text-slate-400 max-w-2xl">
              Compatível com qualquer casa de Aviator (82B, Betano, Bet7k, EstrelaBet, Blaze ou personalizada). Calibre a velocidade ao vivo ou cole as últimas velas para precisão máxima.
            </p>
          </div>

          {/* Quick PDF Examples */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Exemplos PDF:</span>
            {QUICK_EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => {
                  onRoundInputChange(ex.round);
                  onMultiplierInputChange(ex.mult);
                  onTimeInputChange(ex.time);
                  setSelectedOffset(null);
                }}
                className="min-h-[36px] rounded-lg border border-white/10 bg-[#192231] px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Controls Grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
          {/* Casa de Apostas Universal */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label htmlFor="house-select" className="text-xs font-medium text-slate-300">
                Casa (Universal)
              </label>
              <div className="flex items-center gap-2">
                {selectedHouse !== 'Qualquer Casa (Universal)' && (
                  <button
                    type="button"
                    onClick={() => onSelectHouse('Qualquer Casa (Universal)')}
                    className="text-xs font-medium text-sky-300 hover:text-sky-200 cursor-pointer"
                  >
                    Universal
                  </button>
                )}
                {selectedHouse !== '82B' && (
                  <button
                    type="button"
                    onClick={() => onSelectHouse('82B')}
                    className="text-xs font-semibold text-emerald-300 hover:text-emerald-200 cursor-pointer"
                  >
                    82B
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddHouse((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Digitar Casa</span>
                </button>
              </div>
            </div>

            {showAddHouse ? (
              <form onSubmit={handleAddHouseSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                  placeholder="Qualquer casa ou plataforma..."
                  className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer shrink-0"
                >
                  Usar
                </button>
              </form>
            ) : (
              <select
                id="house-select"
                value={selectedHouse}
                onChange={(e) => onSelectHouse(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm font-medium text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {allHousesList.map((house) => (
                  <option key={house} value={house} className="bg-[#0B0F17] text-slate-100">
                    {house}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Número da Rodada + Sync Ao Vivo */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="round-input" className="text-xs font-medium text-slate-300">
                Nº da Rodada Atual
              </label>
              <button
                type="button"
                onClick={() => {
                  const msg = onSyncLiveRound();
                  setLiveSyncFeedback(msg);
                  setSelectedOffset(null);
                  setTimeout(() => setLiveSyncFeedback(null), 5000);
                }}
                title="Avança +1 rodada com a hora exata agora e calibra automaticamente o ritmo desta casa"
                className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                <Zap className="h-3 w-3" />
                <span>+1 Ao Vivo</span>
              </button>
            </div>
            <div className="flex items-center rounded-xl border border-white/15 bg-[#0B0F17] focus-within:border-emerald-500">
              <button
                type="button"
                onClick={() => handleStepRound(-1)}
                className="min-h-[44px] min-w-[40px] px-2.5 text-sm font-semibold text-slate-400 hover:text-slate-100 cursor-pointer"
                aria-label="Rodada anterior"
              >
                -1
              </button>
              <input
                id="round-input"
                type="text"
                inputMode="numeric"
                value={roundInput}
                onChange={(e) => {
                  onRoundInputChange(e.target.value.replace(/\D/g, ''));
                  setSelectedOffset(null);
                }}
                placeholder="Ex: 4310524"
                className="min-h-[44px] w-full bg-transparent px-1 text-center font-mono text-base font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleStepRound(1)}
                className="min-h-[44px] min-w-[40px] px-2.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                aria-label="Próxima rodada"
              >
                +1
              </button>
            </div>
          </div>

          {/* Última Vela Saída */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="candle-input" className="text-xs font-medium text-slate-300">
                Última Vela Saída (x)
              </label>
              {analysis.valid && (
                <span className={`text-xs font-medium ${CANDLE_STYLES[analysis.diagnostic.color].text}`}>
                  {CANDLE_STYLES[analysis.diagnostic.color].label}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="candle-input"
                type="text"
                inputMode="decimal"
                value={multiplierInput}
                onChange={(e) => {
                  onMultiplierInputChange(e.target.value);
                  setSelectedOffset(null);
                }}
                placeholder="Ex: 12.56 ou 1.37"
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] pl-3.5 pr-9 font-mono text-base font-semibold text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
              />
              <span className="pointer-events-none absolute right-3.5 font-mono text-sm text-slate-400">x</span>
            </div>
          </div>

          {/* Horário da Vela */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="time-input" className="text-xs font-medium text-slate-300">
                Horário da Rodada (HH:MM:SS)
              </label>
              <button
                type="button"
                onClick={() => onTimeInputChange(getCurrentTimeStr())}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Agora</span>
              </button>
            </div>
            <input
              id="time-input"
              type="text"
              value={timeInput}
              onChange={(e) => onTimeInputChange(e.target.value)}
              placeholder="16:21:23"
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 font-mono text-base font-semibold text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Candles & Strategy Options Toolbar */}
        <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-white/10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Atalho velas:</span>
            {QUICK_CANDLES.map((c) => {
              const num = parseFloat(c);
              const color = num >= 10 ? 'pink' : num >= 2 ? 'violet' : 'sky';
              const active = multiplierInput === c;
              const style =
                color === 'pink'
                  ? 'border-pink-500/30 text-pink-300 hover:bg-pink-500/15'
                  : color === 'violet'
                    ? 'border-violet-500/30 text-violet-300 hover:bg-violet-500/15'
                    : 'border-sky-500/30 text-sky-300 hover:bg-sky-500/15';
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => onMultiplierInputChange(c)}
                  className={`min-h-[36px] rounded-lg border px-2.5 py-1 font-mono text-xs font-medium transition-colors cursor-pointer ${
                    active ? 'bg-white/15 border-white/40 text-white' : `bg-[#0B0F17] ${style}`
                  }`}
                >
                  {c}x
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Modo Entrada */}
            <div className="flex items-center gap-1 rounded-lg bg-[#0B0F17] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => onEntryModeChange('antes')}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  entryMode === 'antes' ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                15–30s Antes (G2)
              </button>
              <button
                type="button"
                onClick={() => onEntryModeChange('exato')}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  entryMode === 'exato' ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Minuto Exato (G1)
              </button>
            </div>

            {/* Ciclo Positivo / Negativo */}
            <div className="flex items-center gap-1 rounded-lg bg-[#0B0F17] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => onPayoutMoodChange('positivo')}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  payoutMood === 'positivo' ? 'bg-emerald-600/25 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ciclo Positivo
              </button>
              <button
                type="button"
                onClick={() => onPayoutMoodChange('negativo')}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  payoutMood === 'negativo' ? 'bg-amber-600/25 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ciclo Negativo (+2/+5m)
              </button>
            </div>
          </div>
        </div>

        {/* Live Sync Feedback */}
        {liveSyncFeedback && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            <Zap className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{liveSyncFeedback}</span>
          </div>
        )}

        {/* Recent Table Candles Quick Feed (Universal Precision Booster) */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label htmlFor="recent-candles-input" className="text-xs font-medium text-slate-300">
              Últimas Velas da Mesa (opcional · aumenta a precisão de Pague/Recolhe e Decimais)
            </label>
            {recentCandlesText.trim() && (
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-emerald-300">
                  {parseQuickCandlesText(recentCandlesText).length} velas lidas
                </span>
                <button
                  type="button"
                  onClick={() => onRecentCandlesTextChange('')}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Limpar
                </button>
              </div>
            )}
          </div>
          <input
            id="recent-candles-input"
            type="text"
            value={recentCandlesText}
            onChange={(e) => onRecentCandlesTextChange(e.target.value)}
            placeholder="Cole da mais recente para a mais antiga (ex: 12.56 1.00 2.34 1.37 1.18 3.45)"
            className="min-h-[42px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        {/* Quick AI Question Bar inside Buscador */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <form onSubmit={handleAskQuickAI} className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="buscador-ai-question" className="sr-only">
              Pergunta rápida para o Assistente de IA
            </label>
            <div className="relative flex-1">
              <Bot className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
              <input
                id="buscador-ai-question"
                type="text"
                value={quickQuestion}
                onChange={(e) => setQuickQuestion(e.target.value)}
                placeholder={`Pergunte ao Assistente de IA sobre a ${selectedHouse} ou rodada #${roundInput || '—'}...`}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] pl-10 pr-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                disabled={isAskingQuick || !quickQuestion.trim()}
                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isAskingQuick ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Perguntar à IA</span>
              </button>
              <button
                type="button"
                onClick={() => onJumpToTab('assistente')}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Abrir IA & Print</span>
              </button>
            </div>
          </form>

          {quickError && (
            <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{quickError}</span>
            </div>
          )}

          {quickAnswer && (
            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-[#0B0F17] p-3.5 text-xs sm:text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
              <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-emerald-400">
                <span>RESPOSTA DO ASSISTENTE IA ({selectedHouse})</span>
                <button
                  type="button"
                  onClick={() => setQuickAnswer(null)}
                  className="text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Fechar
                </button>
              </div>
              {quickAnswer}
            </div>
          )}
        </div>
      </section>

      {/* Real-Time Background Notifications Monitor */}
      <RealtimeAlertsPanel
        houseName={selectedHouse}
        roundNumber={roundInput}
        permission={notifications.permission}
        isPushSubscribed={notifications.isPushSubscribed}
        sseConnected={notifications.sseConnected}
        statusNote={notifications.statusNote}
        isEnabling={notifications.isEnabling}
        soundEnabled={notifications.soundEnabled}
        onToggleSound={notifications.onToggleSound}
        autoMonitor={notifications.autoMonitor}
        onToggleAutoMonitor={notifications.onToggleAutoMonitor}
        leadSeconds={notifications.leadSeconds}
        onLeadSecondsChange={notifications.onLeadSecondsChange}
        scheduledAlerts={notifications.scheduledAlerts}
        onEnableBackground={notifications.onEnableBackground}
        onTestNotification={notifications.onTestNotification}
        onCancelAlert={notifications.onCancelAlert}
      />

      {!analysis.valid ? (
        <div className="rounded-2xl border border-white/10 bg-[#131A26] p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-500" />
          <h2 className="mt-3 text-lg font-semibold text-slate-200">
            Informe a rodada e a última vela saída
          </h2>
          <p className="mt-1 text-sm text-slate-400 max-w-md mx-auto">
            Digite um número de rodada válido (ex: 4310524) e um multiplicador a partir de 1.00x para gerar todas as entradas previstas.
          </p>
        </div>
      ) : (
        <>
          {/* Next 15 / 30 Projected Rounds Map */}
          <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-100">
                  Mapa das Próximas {mapRange} Rodadas — {selectedHouse}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Base <span className="font-mono text-slate-200">#{analysis.roundNumber}</span> ({analysis.timeStr}) ·{' '}
                  <span className="text-emerald-300 font-medium">{analysis.pace.label}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegister}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Registrar no Histórico</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveLog}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <BookmarkCheck className="h-4 w-4 text-emerald-400" />
                  <span>Salvar Busca</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShareFocusedProjected(null);
                    setShareModalOpen(true);
                  }}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Compartilhar</span>
                </button>
                <button
                  type="button"
                  onClick={() => onJumpToTab('assistente')}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3.5 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Bot className="h-4 w-4" />
                  <span>Ler Print na IA</span>
                </button>
              </div>
            </div>

            {/* Calibration & Range Controls */}
            <div className="mt-3 flex flex-col gap-2.5 border-y border-white/10 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="pace-mode-select" className="text-xs font-medium text-slate-400">
                  Cadência da Mesa:
                </label>
                <select
                  id="pace-mode-select"
                  value={paceMode}
                  onChange={(e) => {
                    onPaceModeChange(e.target.value as PaceMode);
                    setSelectedOffset(null);
                  }}
                  className="min-h-[38px] rounded-lg border border-white/15 bg-[#0B0F17] px-2.5 text-xs font-medium text-slate-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="auto" className="bg-[#0B0F17]">
                    Auto ({customPaceSec ? `Calibrado ${customPaceSec}s` : 'Histórico / ~25.5s PDF'})
                  </option>
                  <option value="rapido" className="bg-[#0B0F17]">
                    Mesa Rápida (19s/rodada · muitas azuis)
                  </option>
                  <option value="padrao" className="bg-[#0B0F17]">
                    Mesa Padrão PDF (25.5s/rodada)
                  </option>
                  <option value="lento" className="bg-[#0B0F17]">
                    Mesa Lenta / Pagante (30s/rodada)
                  </option>
                </select>

                <div className="flex items-center gap-1.5">
                  <label htmlFor="fine-pace-input" className="text-[11px] text-slate-400">
                    Ajuste fino (s/rod):
                  </label>
                  <input
                    id="fine-pace-input"
                    type="number"
                    min={12}
                    max={38}
                    step={0.5}
                    value={customPaceSec ?? analysis.pace.secondsPerRound}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (Number.isFinite(v)) {
                        onSetCustomPaceSec(v);
                        if (paceMode !== 'auto') onPaceModeChange('auto');
                      }
                    }}
                    className="min-h-[34px] w-16 rounded-lg border border-white/15 bg-[#0B0F17] px-2 text-center font-mono text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                  {customPaceSec !== null && (
                    <button
                      type="button"
                      onClick={() => onSetCustomPaceSec(null)}
                      className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start">
                {/* Filtro por Cor da Vela */}
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0B0F17] p-1">
                  <button
                    type="button"
                    onClick={() => setColorFilter('todas')}
                    className={`min-h-[32px] rounded-md px-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      colorFilter === 'todas' ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorFilter('rosa')}
                    className={`min-h-[32px] rounded-md px-2.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      colorFilter === 'rosa' ? 'bg-pink-500/25 text-pink-200' : 'text-pink-300/80 hover:text-pink-200'
                    }`}
                  >
                    Rosas (10x+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorFilter('roxo')}
                    className={`min-h-[32px] rounded-md px-2.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      colorFilter === 'roxo' ? 'bg-violet-500/25 text-violet-200' : 'text-violet-300/80 hover:text-violet-200'
                    }`}
                  >
                    Roxas (2x–9x)
                  </button>
                </div>

                {/* Alcance 15/30 */}
                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0B0F17] p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMapRange(15);
                      if (selectedOffset && selectedOffset > 15) setSelectedOffset(null);
                    }}
                    className={`min-h-[32px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      mapRange === 15 ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    15 Rodadas
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapRange(30)}
                    className={`min-h-[32px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      mapRange === 30 ? 'bg-[#1E293B] text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    30 Rodadas
                  </button>
                </div>
              </div>
            </div>

            {/* Legenda de Cores das Velas do Mapa */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-pink-400 bg-pink-500/40" aria-hidden="true" />
                <span>
                  <strong className="text-pink-300">Rosa (10x+ / Super Vela)</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-violet-400 bg-violet-500/40" aria-hidden="true" />
                <span>
                  <strong className="text-violet-300">Roxa (2x–9.99x)</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-amber-400/70 bg-amber-500/20" aria-hidden="true" />
                <span className="text-slate-400">Minuto Forte (00/05/09)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm border border-white/15 bg-[#0B0F17]" aria-hidden="true" />
                <span className="text-slate-500">Neutra / Aguardar</span>
              </div>
            </div>

            {/* Radar Precision Verdict Banner */}
            <div
              className={`mt-4 rounded-xl border p-3.5 ${
                analysis.radarVerdict.tone === 'positivo'
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : analysis.radarVerdict.tone === 'perigo'
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-amber-500/40 bg-amber-500/10'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`font-mono text-xs font-bold uppercase tracking-wider ${
                      analysis.radarVerdict.tone === 'positivo'
                        ? 'text-emerald-300'
                        : analysis.radarVerdict.tone === 'perigo'
                          ? 'text-red-300'
                          : 'text-amber-300'
                    }`}
                  >
                    VEREDITO DO RADAR: {analysis.radarVerdict.status}
                  </span>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-300">
                    Fase do Gráfico: <strong className="text-slate-100">{analysis.radarVerdict.graphPhase}</strong>
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-100 tabular-nums">
                  Precisão de Pico: {analysis.radarVerdict.assertivityScore}%
                </div>
              </div>
              <p className="mt-1 text-xs sm:text-sm font-medium text-slate-100">
                {analysis.radarVerdict.headline}
              </p>
              {analysis.radarVerdict.reasons.length > 0 && (
                <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 text-[11px] text-slate-300">
                  {analysis.radarVerdict.reasons.map((r, i) => (
                    <li key={i} className="truncate">
                      • {r}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {registerFeedback && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{registerFeedback}</span>
              </div>
            )}

            {/* Top Confluences Strip */}
            {analysis.topConfluences.length > 0 && (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                    Top Confluências (Maior Precisão)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Cruzamento entre dígito da rodada, minuto exato, decimal e gatilhos do PDF
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
                  {analysis.topConfluences.map((item) => {
                    const topKey = `top:${item.roundNumber}:${item.estimatedTime}`;
                    const isScheduled = scheduledSignalMap[topKey];
                    const isRosa = item.expectedColor === 'rosa';
                    return (
                      <div
                        key={item.roundNumber}
                        className={`flex items-center justify-between gap-2 rounded-xl border p-3 ${
                          isRosa
                            ? 'border-pink-400/55 bg-pink-500/12'
                            : 'border-violet-400/55 bg-violet-500/12'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (item.offset > 15 && mapRange === 15) setMapRange(30);
                            setSelectedOffset(item.offset);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-2 font-mono text-xs">
                            <span className={`font-bold ${isRosa ? 'text-pink-300' : 'text-violet-300'}`}>
                              {isRosa ? 'ROSA' : 'ROXA'}
                            </span>
                            <span className="font-bold text-slate-200">+{item.offset}</span>
                            <span className="font-semibold text-slate-100">#{item.roundNumber}</span>
                            <span className="text-slate-400">~{item.estimatedTime}</span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-emerald-300 tabular-nums">
                              {item.precisionScore}% ({item.confluenceCount}x)
                            </span>
                            <span className={`${isRosa ? 'text-pink-200' : 'text-violet-200'} truncate`}>
                              Alvo {item.targetMultiplier}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                            {item.signalTitles.join(' + ')}
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await notifications.onScheduleSignalAlert({
                              key: topKey,
                              title: `${selectedHouse} · Confluência ${isRosa ? 'ROSA' : 'ROXA'} #${item.roundNumber} (${item.precisionScore}%)`,
                              body: `Casa +${item.offset} (~${item.estimatedTime}) | ${item.signalTitles.join(' + ')} | Alvo ${item.targetMultiplier} (Prot. ${item.protection})`,
                              houseName: selectedHouse,
                              roundNumber: String(item.roundNumber),
                              targetTime: item.estimatedTime,
                              targetMultiplier: item.targetMultiplier,
                              protection: item.protection,
                            });
                            setScheduledSignalMap((prev) => ({ ...prev, [topKey]: true }));
                          }}
                          className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                            isScheduled
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : isRosa
                                ? 'border-pink-400/45 bg-[#0B0F17] text-pink-200 hover:bg-pink-500/20'
                                : 'border-violet-400/45 bg-[#0B0F17] text-violet-200 hover:bg-violet-500/20'
                          }`}
                        >
                          <Bell className="h-3.5 w-3.5" />
                          <span>{isScheduled ? 'Agendado' : 'Alertar'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
              {analysis.projectedRounds
                .slice(0, mapRange)
                .filter((proj) => colorFilter === 'todas' || proj.expectedColor === colorFilter)
                .map((proj) => {
                  const isSelected = selectedOffset === proj.offset;
                  const isRosa = proj.expectedColor === 'rosa';
                  const isRoxo = proj.expectedColor === 'roxo';
                  const isConfluencia = proj.tier === 'confluencia';

                  const cardStyle = isSelected
                    ? isRosa
                      ? 'border-pink-300 bg-pink-500/30 ring-2 ring-pink-300/70'
                      : isRoxo
                        ? 'border-violet-300 bg-violet-500/30 ring-2 ring-violet-300/70'
                        : 'border-emerald-400 bg-emerald-500/20'
                    : isRosa
                      ? isConfluencia
                        ? 'border-pink-400 bg-pink-500/20 ring-1 ring-pink-400/50 hover:border-pink-300'
                        : 'border-pink-500/60 bg-pink-500/12 hover:border-pink-400'
                      : isRoxo
                        ? isConfluencia
                          ? 'border-violet-400 bg-violet-500/20 ring-1 ring-violet-400/50 hover:border-violet-300'
                          : 'border-violet-500/60 bg-violet-500/12 hover:border-violet-400'
                        : proj.tier === 'atencao'
                          ? 'border-amber-500/35 bg-amber-500/5 hover:border-amber-400/60'
                          : 'border-white/10 bg-[#0B0F17] hover:border-white/25';

                  return (
                    <button
                      key={proj.roundNumber}
                      type="button"
                      onClick={() => setSelectedOffset(isSelected ? null : proj.offset)}
                      className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer min-h-[86px] ${cardStyle}`}
                    >
                      <div className="flex w-full items-center justify-between gap-1">
                        <span className="font-mono text-xs font-semibold text-slate-100">
                          +{proj.offset}
                        </span>
                        {isRosa ? (
                          <span className="font-mono text-[10px] font-bold text-pink-300 tabular-nums">
                            ROSA · {proj.precisionScore}%
                          </span>
                        ) : isRoxo ? (
                          <span className="font-mono text-[10px] font-bold text-violet-300 tabular-nums">
                            ROXA · {proj.precisionScore}%
                          </span>
                        ) : proj.tier === 'atencao' ? (
                          <span className="text-[10px] font-medium text-amber-400">
                            MIN
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-200 truncate w-full">
                        #{proj.roundNumber}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-400">
                        {proj.estimatedTime}
                      </div>
                      {proj.recommendedTarget && (
                        <div
                          className={`mt-1 text-[11px] font-semibold truncate w-full ${
                            isRosa ? 'text-pink-200' : isRoxo ? 'text-violet-200' : 'text-emerald-300'
                          }`}
                        >
                          {isConfluencia ? `★ ${proj.recommendedTarget}` : proj.recommendedTarget}
                        </div>
                      )}
                    </button>
                  );
                })}
            </div>

            {colorFilter !== 'todas' &&
              analysis.projectedRounds
                .slice(0, mapRange)
                .filter((p) => p.expectedColor === colorFilter).length === 0 && (
                <div className="mt-3 rounded-xl border border-white/10 bg-[#0B0F17] p-4 text-center text-xs text-slate-400">
                  Nenhuma rodada filtrada como <strong className={colorFilter === 'rosa' ? 'text-pink-300' : 'text-violet-300'}>{colorFilter === 'rosa' ? 'Rosa (10x+)' : 'Roxa (2x–9x)'}</strong> nas próximas {mapRange} rodadas. Clique em <strong>Todas</strong> para ver o mapa completo.
                </div>
              )}

            {selectedProjected && (
              <div
                className={`mt-4 rounded-xl border bg-[#0B0F17] p-4 ${
                  selectedProjected.expectedColor === 'rosa'
                    ? 'border-pink-400/55'
                    : selectedProjected.expectedColor === 'roxo'
                      ? 'border-violet-400/55'
                      : 'border-emerald-500/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {selectedProjected.expectedColor && (
                        <span
                          className={`mr-2 font-mono text-xs font-bold uppercase ${
                            selectedProjected.expectedColor === 'rosa' ? 'text-pink-300' : 'text-violet-300'
                          }`}
                        >
                          [{selectedProjected.expectedColor === 'rosa' ? 'VELA ROSA 10x+' : 'VELA ROXA 2x–9x'}]
                        </span>
                      )}
                      Rodada <span className="font-mono text-emerald-400">#{selectedProjected.roundNumber}</span> · Casa +{selectedProjected.offset} · Horário estimado{' '}
                      <span className="font-mono">{selectedProjected.estimatedTime}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      Precisão estimada:{' '}
                      <span className="font-mono font-semibold text-amber-300 tabular-nums">
                        {selectedProjected.precisionScore}%
                      </span>{' '}
                      ({selectedProjected.confluenceCount}{' '}
                      {selectedProjected.confluenceCount === 1 ? 'confluência direta' : 'confluências diretas'})
                      {selectedProjected.isStrongMinute ? ' · Minuto forte (00/05/09)' : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const projKey = `proj:${selectedProjected.roundNumber}:${selectedProjected.estimatedTime}`;
                        const primary = selectedProjected.matchingSignals[0];
                        const targetMult = selectedProjected.recommendedTarget || primary?.targetMultiplier || '2.00x+';
                        const prot = primary?.protection || '1.49x';
                        const reasonText =
                          selectedProjected.matchingSignals.length > 0
                            ? selectedProjected.matchingSignals.map((s) => s.title).join(' + ')
                            : selectedProjected.isResetStrongHouse
                              ? 'Casa forte pós-reset 1.00x'
                              : selectedProjected.isOddRule13
                                ? 'Regra dos 13 (casa ímpar)'
                                : 'Janela monitorada';
                        await notifications.onScheduleSignalAlert({
                          key: projKey,
                          title: `${selectedHouse} · Rodada #${selectedProjected.roundNumber} (+${selectedProjected.offset})`,
                          body: `Horário ~${selectedProjected.estimatedTime} | ${reasonText} | Alvo ${targetMult} (Prot. ${prot})`,
                          houseName: selectedHouse,
                          roundNumber: String(selectedProjected.roundNumber),
                          targetTime: selectedProjected.estimatedTime,
                          targetMultiplier: targetMult,
                          protection: prot,
                        });
                        setScheduledSignalMap((prev) => ({ ...prev, [projKey]: true }));
                      }}
                      className={`inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                        scheduledSignalMap[`proj:${selectedProjected.roundNumber}:${selectedProjected.estimatedTime}`]
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-white/15 bg-[#131A26] text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300'
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5" />
                      <span>
                        {scheduledSignalMap[`proj:${selectedProjected.roundNumber}:${selectedProjected.estimatedTime}`]
                          ? 'Alerta Agendado'
                          : 'Alertar Rodada'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareFocusedProjected(selectedProjected);
                        setShareModalOpen(true);
                      }}
                      className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-sky-500/40 bg-sky-500/15 px-2.5 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 transition-colors cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Compartilhar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRoundInputChange(String(selectedProjected.roundNumber));
                        onTimeInputChange(selectedProjected.estimatedTime);
                        setSelectedOffset(null);
                      }}
                      className="inline-flex min-h-[36px] items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                    >
                      <span>Simular a partir desta rodada</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {selectedProjected.matchingSignals.length > 0 ? (
                  <ul className="mt-2.5 space-y-1.5 text-xs text-slate-300">
                    {selectedProjected.matchingSignals.map((sig) => (
                      <li key={sig.id}>
                        <span className="font-semibold text-white">{sig.title}</span> — Alvo {sig.targetMultiplier} (Proteção {sig.protection}) · {sig.execution}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    {selectedProjected.isResetStrongHouse
                      ? 'Casa forte pós-reset 1.00x (Módulo 4 p.29): entrada fixa com proteção em 1.49x.'
                      : selectedProjected.isOddRule13
                        ? 'Casa ímpar dentro da Regra dos 13 pós-vela +30x (Módulo 4 p.49).'
                        : 'Sem gatilho direto nesta casa específica; acompanhe os minutos alvo listados abaixo.'}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* 2-Column Results Workspace */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Calculated Rounds & Entry Signals */}
            <section className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    Rodadas e Horários com Entrada
                  </h2>
                  <p className="text-xs text-slate-400">
                    {analysis.signals.length} {analysis.signals.length === 1 ? 'estratégia ativa' : 'estratégias ativas'} para #{analysis.roundNumber} · {analysis.diagnostic.formatted}
                  </p>
                </div>
                <Crosshair className="h-5 w-5 text-emerald-400 shrink-0" />
              </div>

              <div className="divide-y divide-white/10">
                {analysis.signals.map((sig) => (
                  <article key={sig.id} className="py-4 first:pt-4 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-medium text-emerald-400">
                            {sig.confidence === 'alta' ? 'Alta Assertividade' : 'Sinal Complementar'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{sig.moduleSource}</span>
                          {sig.isStrongMinute && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-300 font-medium">Minuto Forte (00/05/09)</span>
                            </>
                          )}
                        </div>
                        <h3 className="mt-1 text-base font-semibold text-slate-100">
                          {sig.title}
                        </h3>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-sm font-bold text-emerald-300">
                          Alvo {sig.targetMultiplier}
                        </div>
                        <div className="font-mono text-xs text-slate-400">
                          Proteção {sig.protection}
                        </div>
                      </div>
                    </div>

                    <p className="mt-2 font-mono text-xs text-slate-300">
                      {sig.formula}
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 text-xs">
                      <div className="rounded-lg bg-[#0B0F17] px-3 py-2">
                        <div className="text-slate-500">Horário de Entrada</div>
                        <div className="mt-0.5 font-mono font-semibold text-slate-100">
                          {sig.targetTime}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#0B0F17] px-3 py-2">
                        <div className="text-slate-500">Rodadas Alvo</div>
                        <div className="mt-0.5 font-mono font-semibold text-emerald-300 truncate">
                          {sig.targetRounds.length > 0
                            ? sig.targetRounds.map((r) => `#${r}`).join(', ')
                            : sig.casasLabel || 'Por minuto exato'}
                        </div>
                      </div>

                      <div className="rounded-lg bg-[#0B0F17] px-3 py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-slate-500">Execução</div>
                          <div className="mt-0.5 font-medium text-slate-200 truncate">
                            {sig.execution}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const alertKey = `manual:${sig.id}:${sig.targetTime}`;
                            const roundsText =
                              sig.targetRounds.length > 0
                                ? sig.targetRounds.map((r) => `#${r}`).join(', ')
                                : sig.casasLabel || 'Por minuto';
                            await notifications.onScheduleSignalAlert({
                              key: alertKey,
                              title: `${selectedHouse} · ${sig.title}`,
                              body: `Entrada ${sig.targetTime} | Rodadas: ${roundsText} | Alvo ${sig.targetMultiplier} (Prot. ${sig.protection})`,
                              houseName: selectedHouse,
                              roundNumber: sig.targetRounds[0] ? String(sig.targetRounds[0]) : roundInput,
                              targetTime: sig.targetTime,
                              targetMultiplier: sig.targetMultiplier,
                              protection: sig.protection,
                            });
                            setScheduledSignalMap((prev) => ({ ...prev, [sig.id]: true }));
                          }}
                          className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2.5 text-[11px] font-semibold transition-colors cursor-pointer shrink-0 ${
                            scheduledSignalMap[sig.id]
                              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                              : 'border-white/15 bg-[#131A26] text-slate-200 hover:border-emerald-500/40 hover:text-emerald-300'
                          }`}
                        >
                          <Bell className="h-3.5 w-3.5" />
                          <span>{scheduledSignalMap[sig.id] ? 'Agendado' : 'Alertar'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Right Column: Candle Diagnostic, Alerts & Live Board */}
            <div className="lg:col-span-5 space-y-6">
              {/* Diagnostic Card */}
              <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
                <h2 className="text-base font-semibold text-slate-100">
                  Diagnóstico da Vela & Casa
                </h2>

                <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#0B0F17] p-4">
                  <div>
                    <div className="text-xs text-slate-400">Última vela analisada</div>
                    <div className={`mt-1 font-mono text-2xl font-bold ${CANDLE_STYLES[analysis.diagnostic.color].text}`}>
                      {analysis.diagnostic.formatted}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {CANDLE_STYLES[analysis.diagnostic.color].label}
                      {analysis.diagnostic.isSpecial && ' · Vela Especial'}
                      {analysis.diagnostic.isCasaDos90 && ' · Casa dos 90'}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">Casa selecionada</div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">{selectedHouse}</div>
                    {analysis.diagnostic.pairedHouse && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        Espelho: <span className="text-slate-200">{analysis.diagnostic.pairedHouse}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Time & Final Digit Diagnostics */}
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 rounded-xl bg-[#0B0F17] p-3">
                    <Clock className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-200">
                        {analysis.diagnostic.isBestHour
                          ? `Dentro de Melhor Horário (${analysis.diagnostic.bestHourLabel})`
                          : 'Fora dos 5 horários de pico clássicos (opere apenas se o gráfico pagar)'}
                      </div>
                      <div className="mt-0.5 text-slate-400">
                        Melhores horários (Mód. 4 p.50): 06–09h · 13–14h · 16h30–17h40 · 20–21h · 00–02h
                      </div>
                    </div>
                  </div>

                  {analysis.diagnostic.finalDigitNote && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-[#0B0F17] p-3">
                      <AlertTriangle
                        className={`h-4 w-4 shrink-0 mt-0.5 ${
                          analysis.diagnostic.finalDigit === 7 ? 'text-red-400' : 'text-emerald-400'
                        }`}
                      />
                      <div>
                        <div className="font-medium text-slate-200">
                          Dica de Ouro 2 — Final {analysis.diagnostic.finalDigit}
                        </div>
                        <div className="mt-0.5 text-slate-300">
                          {analysis.diagnostic.finalDigitNote}
                        </div>
                      </div>
                    </div>
                  )}

                  {analysis.diagnostic.predominantDecimal && (
                    <div className="flex items-start gap-2.5 rounded-xl bg-[#0B0F17] p-3">
                      <Crosshair className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-slate-200">
                          Decimal Predominante: <span className="font-mono text-amber-300">.x{analysis.diagnostic.predominantDecimal.digit}</span> ({analysis.diagnostic.predominantDecimal.count}x no ciclo)
                        </div>
                        <div className="mt-0.5 text-slate-400">
                          Treinamento III p.10: observe quando a soma decimal da vela fechar em {analysis.diagnostic.predominantDecimal.digit}.
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2.5 rounded-xl bg-[#0B0F17] p-3">
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-slate-200">
                        Proteção Recomendada (Módulo 5 p.17)
                      </div>
                      <div className="mt-0.5 text-slate-400">
                        1ª mão cobrindo em <span className="font-mono text-slate-200">1.49x</span> (ou 2.00x mão igual) e 2ª mão no alvo <span className="font-mono text-slate-200">5x / 10x</span>.
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Sequence Alerts & Live House Board Preview */}
              <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-slate-100">
                      Padrões do Gráfico ({selectedHouse})
                    </h2>
                    <p className="text-xs text-slate-400">
                      {houseHistory.length === 0
                        ? 'Registre rodadas para detectar pares e sequências'
                        : `${houseHistory.length} rodadas registradas nesta casa`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onJumpToTab('historico')}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <span>Ver tudo</span>
                    <TrendingUp className="h-3.5 w-3.5" />
                  </button>
                </div>

                {analysis.sequenceAlerts.length > 0 && (
                  <div className="mt-4 space-y-2.5">
                    {analysis.sequenceAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`rounded-xl border p-3 text-xs ${
                          alert.severity === 'perigo'
                            ? 'border-red-500/35 bg-red-500/10 text-red-200'
                            : alert.severity === 'alerta'
                              ? 'border-amber-500/35 bg-amber-500/10 text-amber-200'
                              : 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 font-semibold">
                          <span>{alert.title}</span>
                          <span className="text-[11px] opacity-80">{alert.source}</span>
                        </div>
                        <p className="mt-1 opacity-90">{alert.description}</p>
                        <p className="mt-1 font-medium">Ação: {alert.action}</p>
                      </div>
                    ))}
                  </div>
                )}

                {houseHistory.length > 0 ? (
                  <>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono text-xs">
                      <div className="rounded-lg bg-[#0B0F17] p-2">
                        <div className="text-sky-400 font-semibold">{analysis.boardStats.azulPct}%</div>
                        <div className="text-[11px] text-slate-500">Azuis ({analysis.boardStats.azulCount})</div>
                      </div>
                      <div className="rounded-lg bg-[#0B0F17] p-2">
                        <div className="text-violet-400 font-semibold">{analysis.boardStats.roxoPct}%</div>
                        <div className="text-[11px] text-slate-500">Roxos ({analysis.boardStats.roxoCount})</div>
                      </div>
                      <div className="rounded-lg bg-[#0B0F17] p-2">
                        <div className="text-pink-400 font-semibold">{analysis.boardStats.rosaPct}%</div>
                        <div className="text-[11px] text-slate-500">Rosas ({analysis.boardStats.rosaCount})</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-6 gap-1.5">
                      {houseHistory.slice(0, 18).map((item) => {
                        const c = item.multiplier >= 10 ? 'rosa' : item.multiplier >= 2 ? 'roxo' : 'azul';
                        const st = CANDLE_STYLES[c];
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onRoundInputChange(String(item.roundNumber));
                              onMultiplierInputChange(item.multiplier.toFixed(2));
                              onTimeInputChange(item.timeStr);
                            }}
                            title={`Rodada #${item.roundNumber} · ${item.timeStr}`}
                            className={`rounded-lg border py-1.5 px-1 text-center font-mono text-[11px] font-semibold cursor-pointer ${st.bg} ${st.border} ${st.text}`}
                          >
                            {item.multiplier.toFixed(2)}x
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="mt-4 rounded-xl bg-[#0B0F17] p-4 text-center text-xs text-slate-400">
                    Clique em <strong className="text-slate-200">Registrar no Histórico</strong> para montar o painel de velas de <strong className="text-slate-200">{selectedHouse}</strong> e ativar o detector de pares e sequências.
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      {/* Melhores Horários, Minutos Fortes & Estatística do Jogo */}
      <EstatisticasHorariosPanel
        houseName={selectedHouse}
        history={houseHistory}
        recentCandlesText={recentCandlesText}
        searchLog={searchLog}
        analysis={analysis}
        onScheduleAlert={notifications.onScheduleSignalAlert}
      />

      <ShareRoundsModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        houseName={selectedHouse}
        analysis={analysis}
        mapRange={mapRange}
        entryMode={entryMode}
        payoutMood={payoutMood}
        paceMode={paceMode}
        focusedProjected={shareFocusedProjected}
      />
    </div>
  );
};
