import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  Flame,
  Import,
  Plus,
  RefreshCw,
  Share2,
  Sparkles,
} from 'lucide-react';
import { ALL_HOUSES } from '../data/aviatorRules';
import {
  PayoutMood,
  SuperCandleHourValue,
  analyzeSuperCandleCycles,
  getCurrentDateStr,
  getCurrentTimeStr,
  parseMultiplier,
} from '../utils/aviatorEngine';
import { ShareSuperVelasModal } from './ShareSuperVelasModal';

interface SuperVelasPanelProps {
  defaultHouse: string;
  customHouses: string[];
  onAddCustomHouse: (house: string) => void;
  defaultPayoutMood: PayoutMood;
  paceSec: number;
  mainRoundInput: string;
  mainMultiplierInput: string;
  mainTimeInput: string;
  initialSharedParams?: {
    house?: string;
    round?: string;
    mult?: string;
    date?: string;
    time?: string;
    mood?: PayoutMood;
  };
  onBackToBuscador: () => void;
  onScheduleAlert: (params: {
    key: string;
    title: string;
    body: string;
    houseName: string;
    roundNumber?: string;
    targetTime: string;
    targetTimestampMs?: number;
    targetMultiplier: string;
    protection: string;
  }) => Promise<void>;
}

const SUPER_PRESETS = ['15.36', '52.40', '105.80', '250.00', '520.00', '1000.00'];
const ALL_CYCLE_HOURS: SuperCandleHourValue[] = [7, 12, 24, 34];

const SUPER_STORAGE_KEY = 'aviator_radar_super_velas_inputs_v1';

interface StoredSuperInputs {
  house?: string;
  round?: string;
  candle?: string;
  date?: string;
  time?: string;
  mood?: PayoutMood;
  cycles?: SuperCandleHourValue[];
}

function readStoredSuper(): StoredSuperInputs {
  try {
    const raw = localStorage.getItem(SUPER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSuperInputs) : {};
  } catch {
    return {};
  }
}

export const SuperVelasPanel: React.FC<SuperVelasPanelProps> = ({
  defaultHouse,
  customHouses,
  onAddCustomHouse,
  defaultPayoutMood,
  paceSec,
  mainRoundInput,
  mainMultiplierInput,
  mainTimeInput,
  initialSharedParams,
  onBackToBuscador,
  onScheduleAlert,
}) => {
  const [savedInit] = useState(() => readStoredSuper());

  const [superHouse, setSuperHouse] = useState<string>(
    () => initialSharedParams?.house || savedInit.house || defaultHouse
  );
  const [superRoundInput, setSuperRoundInput] = useState<string>(
    () => initialSharedParams?.round || savedInit.round || '4310524'
  );
  const [superCandleInput, setSuperCandleInput] = useState<string>(
    () => initialSharedParams?.mult || savedInit.candle || '105.80'
  );
  const [superDateInput, setSuperDateInput] = useState<string>(
    () => initialSharedParams?.date || savedInit.date || getCurrentDateStr()
  );
  const [superTimeInput, setSuperTimeInput] = useState<string>(
    () => initialSharedParams?.time || savedInit.time || getCurrentTimeStr()
  );
  const [superMood, setSuperMood] = useState<PayoutMood>(
    () => initialSharedParams?.mood || savedInit.mood || defaultPayoutMood
  );
  const [activeCycleHours, setActiveCycleHours] = useState<SuperCandleHourValue[]>(
    () => (savedInit.cycles && savedInit.cycles.length > 0 ? savedInit.cycles : ALL_CYCLE_HOURS)
  );

  const [showAddHouse, setShowAddHouse] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const [scheduledMap, setScheduledMap] = useState<Record<string, boolean>>({});
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [focusedShareHour, setFocusedShareHour] = useState<SuperCandleHourValue | null>(null);

  useEffect(() => {
    try {
      const payload: StoredSuperInputs = {
        house: superHouse,
        round: superRoundInput,
        candle: superCandleInput,
        date: superDateInput,
        time: superTimeInput,
        mood: superMood,
        cycles: activeCycleHours,
      };
      localStorage.setItem(SUPER_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [superHouse, superRoundInput, superCandleInput, superDateInput, superTimeInput, superMood, activeCycleHours]);

  const allHousesList = useMemo(
    () => Array.from(new Set([superHouse, ...customHouses, ...ALL_HOUSES])),
    [superHouse, customHouses]
  );

  const mainMultValue = parseMultiplier(mainMultiplierInput);
  const canImportFromMain = Number.isFinite(mainMultValue) && mainMultValue >= 10;

  const superAnalysis = useMemo(
    () =>
      analyzeSuperCandleCycles({
        candleInput: superCandleInput,
        dateInput: superDateInput,
        timeInput: superTimeInput,
        roundInput: superRoundInput,
        payoutMood: superMood,
        houseName: superHouse,
        paceSec,
      }),
    [superCandleInput, superDateInput, superTimeInput, superRoundInput, superMood, superHouse, paceSec]
  );

  const visibleCycles = useMemo(
    () => superAnalysis.hourCycles.filter((c) => activeCycleHours.includes(c.hours)),
    [superAnalysis.hourCycles, activeCycleHours]
  );

  const handleToggleCycleHour = (h: SuperCandleHourValue) => {
    setActiveCycleHours((prev) => {
      if (prev.includes(h)) {
        return prev.length === 1 ? prev : prev.filter((x) => x !== h);
      }
      return [...prev, h].sort((a, b) => a - b);
    });
  };

  const handleStepRound = (delta: number) => {
    const current = parseInt(superRoundInput.replace(/\D/g, ''), 10) || 0;
    const next = Math.max(1, current + delta);
    setSuperRoundInput(String(next));
  };

  const handleImportFromMain = () => {
    if (!canImportFromMain) return;
    setSuperHouse(defaultHouse);
    setSuperCandleInput(mainMultValue.toFixed(2));
    setSuperDateInput(getCurrentDateStr());
    if (mainTimeInput.trim()) setSuperTimeInput(mainTimeInput.trim());
    if (mainRoundInput.trim()) setSuperRoundInput(mainRoundInput.trim());
  };

  const handleAddHouseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newHouseName.trim();
    if (!trimmed) return;
    onAddCustomHouse(trimmed);
    setSuperHouse(trimmed);
    setNewHouseName('');
    setShowAddHouse(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-pink-500/35 bg-[#131A26] p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Flame className="h-5 w-5 text-pink-400 shrink-0" />
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-50">
                Padrões de Super Velas Altas — 7h, 12h, 24h e 34h
              </h1>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
              Cálculo 100% independente do Buscador e do Top Confluências. Informe a <strong className="text-slate-200">rodada</strong>, a <strong className="text-slate-200">hora</strong> e o <strong className="text-slate-200">valor da vela</strong> para calcular e compartilhar os ciclos de 7h, 12h, 24h e 34h.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToBuscador}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Voltar ao Buscador</span>
            </button>
            {canImportFromMain && (
              <button
                type="button"
                onClick={handleImportFromMain}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-500/15 px-3 text-xs font-semibold text-pink-200 hover:bg-pink-500/25 transition-colors cursor-pointer"
              >
                <Import className="h-3.5 w-3.5" />
                <span>Puxar {mainMultValue.toFixed(2)}x do Buscador</span>
              </button>
            )}
            {superAnalysis.valid && (
              <button
                type="button"
                onClick={() => {
                  setFocusedShareHour(null);
                  setShareModalOpen(true);
                }}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-pink-600 px-3.5 text-xs font-semibold text-white hover:bg-pink-500 transition-colors cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Compartilhar Padrões (7h/12h/24h/34h)</span>
              </button>
            )}
          </div>
        </div>

        {/* Dedicated Independent Inputs: Casa, Rodada, Valor da Vela, Data, Hora */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Casa */}
          <div>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label htmlFor="super-house-select" className="text-xs font-medium text-slate-300">
                Casa (Separada)
              </label>
              <div className="flex items-center gap-2">
                {superHouse !== '82B' && (
                  <button
                    type="button"
                    onClick={() => setSuperHouse('82B')}
                    className="text-xs font-semibold text-pink-300 hover:text-pink-200 cursor-pointer"
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
                  <span>Digitar</span>
                </button>
              </div>
            </div>

            {showAddHouse ? (
              <form onSubmit={handleAddHouseSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={newHouseName}
                  onChange={(e) => setNewHouseName(e.target.value)}
                  placeholder="Nome da casa..."
                  className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-pink-400 focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-pink-600 px-3 text-xs font-semibold text-white hover:bg-pink-500 cursor-pointer shrink-0"
                >
                  Usar
                </button>
              </form>
            ) : (
              <select
                id="super-house-select"
                value={superHouse}
                onChange={(e) => setSuperHouse(e.target.value)}
                className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 text-sm font-medium text-slate-100 focus:border-pink-400 focus:outline-none cursor-pointer"
              >
                {allHousesList.map((house) => (
                  <option key={house} value={house} className="bg-[#0B0F17] text-slate-100">
                    {house}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Número da Rodada */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="super-round-input" className="text-xs font-medium text-slate-300">
                Nº da Rodada
              </label>
              <span className="text-[11px] text-slate-500">Rodada alvo</span>
            </div>
            <div className="flex items-center rounded-xl border border-white/15 bg-[#0B0F17] focus-within:border-pink-400">
              <button
                type="button"
                onClick={() => handleStepRound(-1)}
                className="min-h-[44px] min-w-[38px] px-2 text-sm font-semibold text-slate-400 hover:text-slate-100 cursor-pointer"
                aria-label="Rodada anterior"
              >
                -1
              </button>
              <input
                id="super-round-input"
                type="text"
                inputMode="numeric"
                value={superRoundInput}
                onChange={(e) => setSuperRoundInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 4310524"
                className="min-h-[44px] w-full bg-transparent px-1 text-center font-mono text-base font-semibold text-slate-100 placeholder:text-slate-600 focus:outline-none tabular-nums"
              />
              <button
                type="button"
                onClick={() => handleStepRound(1)}
                className="min-h-[44px] min-w-[38px] px-2 text-sm font-semibold text-pink-300 hover:text-pink-200 cursor-pointer"
                aria-label="Próxima rodada"
              >
                +1
              </button>
            </div>
          </div>

          {/* Valor da Vela Alta */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="super-candle-input" className="text-xs font-medium text-slate-300">
                Valor da Vela (x)
              </label>
              {superAnalysis.valid && (
                <span className="font-mono text-[11px] font-semibold text-pink-300 truncate">
                  {superAnalysis.tierLabel.split('(')[0].trim()}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                id="super-candle-input"
                type="text"
                inputMode="decimal"
                value={superCandleInput}
                onChange={(e) => setSuperCandleInput(e.target.value)}
                placeholder="Ex: 105.80"
                className="min-h-[44px] w-full rounded-xl border border-pink-500/40 bg-[#0B0F17] pl-3.5 pr-9 font-mono text-base font-semibold text-pink-200 placeholder:text-slate-600 focus:border-pink-400 focus:outline-none tabular-nums"
              />
              <span className="pointer-events-none absolute right-3.5 font-mono text-sm text-pink-400">x</span>
            </div>
          </div>

          {/* Data da Vela */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="super-date-input" className="text-xs font-medium text-slate-300">
                Data da Vela
              </label>
              <button
                type="button"
                onClick={() => setSuperDateInput(getCurrentDateStr())}
                className="inline-flex items-center gap-1 text-xs font-medium text-pink-300 hover:text-pink-200 cursor-pointer"
              >
                <Calendar className="h-3 w-3" />
                <span>Hoje</span>
              </button>
            </div>
            <input
              id="super-date-input"
              type="date"
              value={superDateInput}
              onChange={(e) => setSuperDateInput(e.target.value)}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3 font-mono text-sm font-semibold text-slate-100 focus:border-pink-400 focus:outline-none tabular-nums"
            />
          </div>

          {/* Hora da Vela */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="super-time-input" className="text-xs font-medium text-slate-300">
                Hora (HH:MM:SS)
              </label>
              <button
                type="button"
                onClick={() => {
                  setSuperDateInput(getCurrentDateStr());
                  setSuperTimeInput(getCurrentTimeStr());
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-pink-300 hover:text-pink-200 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Agora</span>
              </button>
            </div>
            <input
              id="super-time-input"
              type="text"
              value={superTimeInput}
              onChange={(e) => setSuperTimeInput(e.target.value)}
              placeholder="14:30:15"
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#0B0F17] px-3.5 font-mono text-base font-semibold text-slate-100 placeholder:text-slate-600 focus:border-pink-400 focus:outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Presets + Cycle Filter + Mood */}
        <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 mr-1">Atalhos Super Velas:</span>
            {SUPER_PRESETS.map((preset) => {
              const active = superCandleInput === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSuperCandleInput(preset)}
                  className={`min-h-[36px] rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer tabular-nums ${
                    active
                      ? 'border-pink-400 bg-pink-500/25 text-pink-100'
                      : 'border-pink-500/30 bg-[#0B0F17] text-pink-300 hover:bg-pink-500/15'
                  }`}
                >
                  {preset}x
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Seleção de Ciclos (7h, 12h, 24h, 34h) */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0B0F17] p-1">
              {ALL_CYCLE_HOURS.map((h) => {
                const active = activeCycleHours.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleToggleCycleHour(h)}
                    className={`min-h-[34px] rounded-md px-2.5 font-mono text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      active ? 'bg-pink-600/30 text-pink-200' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    +{h}h
                  </button>
                );
              })}
            </div>

            {/* Ciclo Positivo / Negativo */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#0B0F17] p-1">
              <button
                type="button"
                onClick={() => setSuperMood('positivo')}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  superMood === 'positivo' ? 'bg-emerald-600/25 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ciclo Positivo
              </button>
              <button
                type="button"
                onClick={() => setSuperMood('negativo')}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  superMood === 'negativo' ? 'bg-amber-600/25 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ciclo Negativo (+2m)
              </button>
            </div>
          </div>
        </div>

        {!superAnalysis.valid ? (
          <div className="mt-5 rounded-xl border border-white/10 bg-[#0B0F17] p-6 text-center text-sm text-slate-400">
            {superAnalysis.tierSummary}
          </div>
        ) : (
          <>
            {/* Formula Summary Bar */}
            <div className="mt-5 rounded-xl border border-pink-500/25 bg-[#0B0F17] p-4 space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs sm:text-sm text-slate-200">
                  <strong className="text-pink-300">{superAnalysis.tierLabel}:</strong> {superAnalysis.tierSummary}
                </div>
                <div className="font-mono text-xs text-amber-300 shrink-0 tabular-nums">
                  {superAnalysis.decimalFormula}
                </div>
              </div>
              {superAnalysis.roundDigitFormula && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
                  <span className="font-mono text-emerald-300">
                    {superAnalysis.roundDigitFormula}
                  </span>
                  <span className="text-slate-400">
                    Estimativa de rodadas futuras usando cadência de <strong className="font-mono text-slate-200">{superAnalysis.paceSec}s/rodada</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 7h / 12h / 24h / 34h Cycle Cards */}
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {visibleCycles.map((cycle) => {
                const alertKey = `super:${superHouse}:${cycle.hours}h:${cycle.exactDate}:${cycle.exactTime}:${superAnalysis.multiplier}`;
                const isScheduled = scheduledMap[alertKey];
                return (
                  <article
                    key={cycle.hours}
                    className="flex flex-col justify-between rounded-xl border border-pink-400/55 bg-pink-500/10 p-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-mono text-xs font-bold uppercase tracking-wider text-pink-300">
                            {cycle.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-slate-400">
                            {cycle.dayOffsetLabel}
                          </div>
                        </div>
                        <span className="font-mono text-sm font-bold text-emerald-300 tabular-nums">
                          {cycle.confidenceScore}%
                        </span>
                      </div>

                      {/* Data e Hora Seguinte da Entrada */}
                      <div className="mt-3 rounded-lg border border-pink-500/25 bg-[#0B0F17] px-3 py-2.5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                            <Calendar className="h-3 w-3 text-pink-400" />
                            <span>Data e Hora da Entrada</span>
                          </span>
                          <span className="font-mono text-[11px] font-semibold text-emerald-300 tabular-nums">
                            {cycle.exactDate}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between gap-2">
                          <div className="font-mono text-xl font-bold text-pink-200 tabular-nums">
                            {cycle.exactTime}
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">
                              Decimal (+{cycle.decimalOffsetMinutes}m)
                            </div>
                            <div className="font-mono text-xs font-semibold text-violet-300 tabular-nums">
                              {cycle.decimalAdjustedShortDate} · {cycle.decimalAdjustedTime}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs">
                        {cycle.estimatedRound !== null && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400">Rodada estimada:</span>
                            <span className="font-mono font-bold text-emerald-300 tabular-nums">
                              #{cycle.estimatedRound} (+{cycle.estimatedRoundsDelta})
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Janela entrada:</span>
                          <span className="font-mono font-semibold text-slate-100 tabular-nums text-right">
                            {cycle.entryWindowWithDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Alvo esperado:</span>
                          <span className="font-mono font-semibold text-pink-300">
                            {cycle.targetMultiplier}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Proteção:</span>
                          <span className="font-mono text-slate-200">{cycle.protection}</span>
                        </div>
                      </div>

                      {(cycle.isStrongMinute || cycle.isDecimalStrongMinute || cycle.isBestHour) && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                          {(cycle.isStrongMinute || cycle.isDecimalStrongMinute) && (
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              <Sparkles className="h-3 w-3" />
                              Minuto Forte (00/05/09)
                            </span>
                          )}
                          {cycle.isBestHour && cycle.bestHourLabel && (
                            <span className="inline-flex items-center gap-1 text-emerald-300">
                              <Clock className="h-3 w-3" />
                              Pico ({cycle.bestHourLabel})
                            </span>
                          )}
                        </div>
                      )}

                      <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                        {cycle.pdfBasis}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await onScheduleAlert({
                            key: alertKey,
                            title: `${superHouse} · Super Vela ${superAnalysis.multiplier.toFixed(2)}x (+${cycle.hours}h)`,
                            body: `Data/Hora ${cycle.exactDate} às ${cycle.exactTime} (${cycle.entryWindowWithDate}) | Alvo ${cycle.targetMultiplier} | Prot. ${cycle.protection}`,
                            houseName: superHouse,
                            roundNumber: cycle.estimatedRound ? String(cycle.estimatedRound) : undefined,
                            targetTime: `${cycle.exactDate} ${cycle.exactTime}`,
                            targetTimestampMs: cycle.exactTimestampMs,
                            targetMultiplier: cycle.targetMultiplier,
                            protection: cycle.protection,
                          });
                          setScheduledMap((prev) => ({ ...prev, [alertKey]: true }));
                        }}
                        className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                          isScheduled
                            ? 'border-emerald-500/45 bg-emerald-500/20 text-emerald-200'
                            : 'border-pink-400/45 bg-[#0B0F17] text-pink-200 hover:bg-pink-500/20'
                        }`}
                      >
                        <Bell className="h-3.5 w-3.5 shrink-0" />
                        <span>{isScheduled ? 'Agendado' : `Alertar +${cycle.hours}h`}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFocusedShareHour(cycle.hours);
                          setShareModalOpen(true);
                        }}
                        aria-label={`Compartilhar ciclo de ${cycle.hours} horas`}
                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/15 px-3 text-sky-200 hover:bg-sky-500/25 transition-colors cursor-pointer"
                      >
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Short-term PDF windows (+30m/+32m/+35m/+1h) */}
            {superAnalysis.shortWindows.length > 0 && (
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Janelas Intermediárias da Super Vela (Módulo 4 & 5)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Padrões imediatos vinculados à vela {superAnalysis.multiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {superAnalysis.shortWindows.map((w) => {
                    const isRosa = w.expectedColor === 'rosa';
                    const shortKey = `super-short:${superHouse}:${w.id}:${w.targetTime}`;
                    const isScheduled = scheduledMap[shortKey];
                    return (
                      <div
                        key={w.id}
                        className={`rounded-xl border p-3 ${
                          isRosa
                            ? 'border-pink-400/50 bg-pink-500/10'
                            : 'border-violet-400/50 bg-violet-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-semibold ${isRosa ? 'text-pink-200' : 'text-violet-200'}`}>
                            {w.label}
                          </span>
                          <span className={`font-mono text-[10px] font-bold uppercase ${isRosa ? 'text-pink-300' : 'text-violet-300'}`}>
                            {isRosa ? 'ROSA' : 'ROXA'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-baseline justify-between gap-2">
                          <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
                            {w.targetDate} · {w.targetTime}
                          </span>
                          {w.estimatedRound !== null && (
                            <span className="font-mono text-[11px] text-slate-300 tabular-nums">
                              ~#{w.estimatedRound}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className={`font-mono text-xs font-medium ${isRosa ? 'text-pink-300' : 'text-violet-300'}`}>
                            {w.targetMultiplier}
                          </span>
                          {w.isStrongMinute && (
                            <span className="text-[10px] font-semibold text-amber-300">MIN FORTE</span>
                          )}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">{w.note}</div>
                        <button
                          type="button"
                          onClick={async () => {
                            await onScheduleAlert({
                              key: shortKey,
                              title: `${superHouse} · ${w.label} (${superAnalysis.multiplier.toFixed(2)}x)`,
                              body: `Horário ${w.targetTime} | Alvo ${w.targetMultiplier} | ${w.note}`,
                              houseName: superHouse,
                              roundNumber: w.estimatedRound ? String(w.estimatedRound) : undefined,
                              targetTime: w.targetTime,
                              targetMultiplier: w.targetMultiplier,
                              protection: '1.49x',
                            });
                            setScheduledMap((prev) => ({ ...prev, [shortKey]: true }));
                          }}
                          className={`mt-2 inline-flex min-h-[34px] w-full items-center justify-center gap-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            isScheduled
                              ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                              : 'border-white/15 bg-[#0B0F17] text-slate-200 hover:bg-white/10'
                          }`}
                        >
                          <Bell className="h-3 w-3" />
                          <span>{isScheduled ? 'Agendado' : 'Alertar'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <ShareSuperVelasModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        houseName={superHouse}
        analysis={superAnalysis}
        payoutMood={superMood}
        selectedCycleHours={activeCycleHours}
        focusedHour={focusedShareHour}
      />
    </div>
  );
};
