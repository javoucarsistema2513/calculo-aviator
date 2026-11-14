import {
  BEST_HOURS,
  EXACT_TRIGGER_RULES,
  PAIRED_HOUSES,
  ROSE_PAIRS,
  SPECIAL_CANDLES,
  STRONG_MINUTE_SUFFIXES,
  TriggerRule,
} from '../data/aviatorRules';

export type CandleColor = 'azul' | 'roxo' | 'rosa';
export type EntryMode = 'antes' | 'exato';
export type PayoutMood = 'positivo' | 'negativo';
export type PaceMode = 'auto' | 'rapido' | 'padrao' | 'lento';

export interface RoundEntry {
  id: string;
  roundNumber: number;
  multiplier: number;
  timeStr: string; // HH:MM:SS
  houseName: string;
  createdAt: number;
}

export interface SearchLogItem {
  id: string;
  roundNumber: number;
  multiplier: number;
  timeStr: string;
  houseName: string;
  topTargets: string;
  result?: 'green' | 'loss' | 'pending';
  createdAt: number;
}

export interface RoundSignal {
  id: string;
  title: string;
  moduleSource: string;
  formula: string;
  targetTime: string;
  targetRounds: number[];
  casasLabel?: string;
  targetMultiplier: string;
  protection: string;
  execution: string;
  confidence: 'alta' | 'media' | 'cautela';
  category: 'rodada' | 'horario' | 'gatilho' | 'regra13' | 'sequencia';
  isStrongMinute: boolean;
}

export type ProjectedCandleColor = 'rosa' | 'roxo';

export interface ProjectedRound {
  offset: number; // +1 to +30
  roundNumber: number;
  estimatedTime: string;
  minuteStr: string;
  isStrongMinute: boolean;
  isOddRule13: boolean;
  isResetStrongHouse: boolean;
  matchingSignals: RoundSignal[];
  confluenceCount: number;
  precisionScore: number; // 0 to 99
  tier: 'confluencia' | 'entrada' | 'atencao' | 'neutro';
  expectedColor: ProjectedCandleColor | null;
  recommendedTarget: string | null;
}

export interface TopPrecisionEntry {
  roundNumber: number;
  offset: number;
  estimatedTime: string;
  precisionScore: number;
  confluenceCount: number;
  expectedColor: ProjectedCandleColor;
  signalTitles: string[];
  targetMultiplier: string;
  protection: string;
}

export type SuperCandleTier = 'alta' | 'super' | 'mega' | 'ultra';

export type SuperCandleHourValue = 7 | 12 | 24 | 34;

export interface SuperCandleHourCycle {
  hours: SuperCandleHourValue;
  label: string;
  dayOffsetLabel: string;
  exactDate: string; // DD/MM/YYYY
  exactShortDate: string; // DD/MM
  exactTime: string; // HH:MM:SS
  exactDateTimeLabel: string; // DD/MM/YYYY às HH:MM:SS
  exactTimestampMs: number;
  entryWindow: string;
  entryWindowWithDate: string;
  decimalAdjustedDate: string; // DD/MM/YYYY
  decimalAdjustedShortDate: string; // DD/MM
  decimalAdjustedTime: string; // HH:MM:SS
  decimalAdjustedDateTimeLabel: string; // DD/MM/YYYY às HH:MM:SS
  decimalTimestampMs: number;
  decimalOffsetMinutes: number;
  estimatedRound: number | null;
  estimatedRoundsDelta: number;
  isStrongMinute: boolean;
  isDecimalStrongMinute: boolean;
  isBestHour: boolean;
  bestHourLabel: string | null;
  expectedColor: 'rosa';
  targetMultiplier: string;
  protection: string;
  execution: string;
  confidenceScore: number;
  pdfBasis: string;
}

export interface SuperCandleShortWindow {
  id: string;
  label: string;
  offsetMinutes: number;
  targetDate: string;
  targetTime: string;
  estimatedRound: number | null;
  isStrongMinute: boolean;
  expectedColor: 'rosa' | 'roxo';
  targetMultiplier: string;
  note: string;
}

export interface SuperCandleAnalysis {
  valid: boolean;
  multiplier: number;
  dateStr: string; // YYYY-MM-DD
  formattedDateStr: string; // DD/MM/YYYY
  timeStr: string;
  roundNumber: number | null;
  houseName: string;
  paceSec: number;
  tier: SuperCandleTier;
  tierLabel: string;
  tierSummary: string;
  decimalOffsetMinutes: number;
  decimalFormula: string;
  roundDigitTime: string | null;
  roundDigitFormula: string | null;
  hourCycles: SuperCandleHourCycle[];
  shortWindows: SuperCandleShortWindow[];
}

export interface SequenceAlert {
  id: string;
  title: string;
  source: string;
  description: string;
  action: string;
  severity: 'positivo' | 'alerta' | 'perigo';
}

export interface CandleDiagnostic {
  color: CandleColor;
  formatted: string;
  isReset: boolean;
  isSpecial: boolean;
  isCasaDos90: boolean;
  finalDigit: number;
  finalDigitNote: string | null;
  exactTriggers: TriggerRule[];
  isBestHour: boolean;
  bestHourLabel: string | null;
  pairedHouse: string | null;
  predominantDecimal: { digit: number; count: number } | null;
}

export interface PaceInfo {
  secondsPerRound: number;
  roundsPerMinute: number;
  source: 'historico' | 'ao_vivo' | 'adaptativo' | 'manual';
  sampleCount: number;
  label: string;
}

export interface RadarVerdict {
  status: 'OPERAR' | 'PROTEGER' | 'CAUTELA' | 'PAUSAR';
  tone: 'positivo' | 'atencao' | 'perigo';
  graphPhase: 'Pague' | 'Neutro' | 'Recolhe';
  assertivityScore: number;
  headline: string;
  reasons: string[];
}

export interface AnalysisResult {
  valid: boolean;
  roundNumber: number;
  multiplier: number;
  timeStr: string;
  pace: PaceInfo;
  radarVerdict: RadarVerdict;
  diagnostic: CandleDiagnostic;
  signals: RoundSignal[];
  projectedRounds: ProjectedRound[];
  topConfluences: TopPrecisionEntry[];
  sequenceAlerts: SequenceAlert[];
  boardStats: {
    total: number;
    azulCount: number;
    roxoCount: number;
    rosaCount: number;
    azulPct: number;
    roxoPct: number;
    rosaPct: number;
    roxoAvg: number;
    isHealthyGraph: boolean;
  };
}

export function classifyCandle(multiplier: number): CandleColor {
  if (multiplier >= 10) return 'rosa';
  if (multiplier >= 2) return 'roxo';
  return 'azul';
}

export function parseMultiplier(raw: string): number {
  const cleaned = raw.replace(',', '.').replace(/[^\d.]/g, '');
  const val = parseFloat(cleaned);
  return Number.isFinite(val) ? Math.round(val * 100) / 100 : NaN;
}

export function formatMultiplier(val: number): string {
  return `${val.toFixed(2)}x`;
}

export function parseQuickCandlesText(raw: string): number[] {
  if (!raw.trim()) return [];
  const tokens = raw
    .replace(/x/gi, ' ')
    .split(/[\s,;|\n]+/)
    .map((t) => parseFloat(t.replace(',', '.')))
    .filter((n) => Number.isFinite(n) && n >= 1.0 && n <= 10000);
  return tokens.map((n) => Math.round(n * 100) / 100).slice(0, 30);
}

export function getCurrentDateStr(): string {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getCurrentTimeStr(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function parseDateAndTimeToDate(dateInput: string | undefined, timeStr: string): Date {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();

  const cleanDate = (dateInput || '').trim();
  const isoMatch = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const brMatch = cleanDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else if (brMatch) {
    day = parseInt(brMatch[1], 10);
    month = parseInt(brMatch[2], 10);
    year = parseInt(brMatch[3], 10);
  }

  const timeParts = timeStr.split(':').map((p) => parseInt(p, 10));
  const hasValidTime = timeParts.length >= 2 && !timeParts.some(isNaN);
  const h = hasValidTime ? Math.max(0, Math.min(23, timeParts[0] || 0)) : now.getHours();
  const m = hasValidTime ? Math.max(0, Math.min(59, timeParts[1] || 0)) : now.getMinutes();
  const s = hasValidTime ? Math.max(0, Math.min(59, timeParts[2] || 0)) : now.getSeconds();

  return new Date(year, month - 1, day, h, m, s, 0);
}

function formatBrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}/${mm}/${yyyy}`;
}

function formatShortBrDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function formatIsoDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTimeClock(d: Date, keepSeconds = true): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return keepSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

export function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || parts.some(isNaN)) {
    const now = new Date();
    return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  }
  const h = Math.max(0, Math.min(23, parts[0] || 0));
  const m = Math.max(0, Math.min(59, parts[1] || 0));
  const s = Math.max(0, Math.min(59, parts[2] || 0));
  return h * 3600 + m * 60 + s;
}

export function addMinutesToTime(timeStr: string, addMinutes: number, keepSeconds = true): string {
  const baseSec = parseTimeToSeconds(timeStr);
  const totalSec = (baseSec + addMinutes * 60 + 86400) % 86400;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return keepSeconds ? `${hh}:${mm}:${ss}` : `${hh}:${mm}`;
}

export function addSecondsToTime(timeStr: string, addSec: number): string {
  const baseSec = parseTimeToSeconds(timeStr);
  const totalSec = (baseSec + addSec + 86400) % 86400;
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function isStrongMinuteStr(timeStr: string): boolean {
  const parts = timeStr.split(':');
  if (parts.length < 2) return false;
  const min = parts[1].padStart(2, '0');
  return STRONG_MINUTE_SUFFIXES.includes(min) || min.endsWith('0') || min.endsWith('5') || min.endsWith('9');
}

export function checkBestHour(timeStr: string): { active: boolean; label: string | null } {
  const baseMin = Math.floor(parseTimeToSeconds(timeStr) / 60);
  for (const h of BEST_HOURS) {
    const [sh, sm] = h.start.split(':').map(Number);
    const [eh, em] = h.end.split(':').map(Number);
    const sMin = sh * 60 + sm;
    const eMin = eh * 60 + em;
    if (baseMin >= sMin && baseMin <= eMin) {
      return { active: true, label: h.label };
    }
  }
  return { active: false, label: null };
}

function getPairedHouse(houseName: string): string | null {
  const lower = houseName.trim().toLowerCase();
  for (const p of PAIRED_HOUSES) {
    if (p.primary.toLowerCase() === lower) return p.paired;
    if (p.paired.toLowerCase() === lower) return p.primary;
  }
  return null;
}

function getDecimalParts(multiplier: number): { intDigits: number[]; decDigits: number[]; lastDec: number; firstDec: number } {
  const fixed = multiplier.toFixed(2);
  const [intStr, decStr] = fixed.split('.');
  const intDigits = intStr.split('').map(Number);
  const decDigits = decStr.split('').map(Number);
  return {
    intDigits,
    decDigits,
    firstDec: decDigits[0] ?? 0,
    lastDec: decDigits[1] ?? 0,
  };
}

function resolveRoundPace(params: {
  paceMode: PaceMode;
  history: RoundEntry[];
  currentMultiplier: number;
  azulPct: number;
  customPaceSec?: number | null;
  houseName: string;
}): PaceInfo {
  const { paceMode, history, currentMultiplier, azulPct, customPaceSec, houseName } = params;

  if (paceMode === 'rapido') {
    return {
      secondsPerRound: 19,
      roundsPerMinute: Number((60 / 19).toFixed(2)),
      source: 'manual',
      sampleCount: 0,
      label: 'Mesa Rápida (19s/rodada · ~3.2/min)',
    };
  }
  if (paceMode === 'padrao') {
    return {
      secondsPerRound: 25.5,
      roundsPerMinute: Number((60 / 25.5).toFixed(2)),
      source: 'manual',
      sampleCount: 0,
      label: 'Padrão Real PDF (25.5s/rodada · ~2.4/min)',
    };
  }
  if (paceMode === 'lento') {
    return {
      secondsPerRound: 30,
      roundsPerMinute: 2,
      source: 'manual',
      sampleCount: 0,
      label: 'Mesa Lenta (30s/rodada · ~2.0/min)',
    };
  }

  // Auto mode: prioritize adjacent recent history pairs (|dRound| <= 8 weighted 2x)
  const samples: number[] = [];
  const validRows = history
    .filter((h) => Number.isFinite(h.roundNumber) && h.roundNumber > 0 && /^\d{2}:\d{2}/.test(h.timeStr))
    .slice(0, 30);

  for (let i = 0; i < validRows.length; i++) {
    for (let j = i + 1; j < validRows.length; j++) {
      const a = validRows[i];
      const b = validRows[j];
      const dRound = a.roundNumber - b.roundNumber;
      const absDiff = Math.abs(dRound);
      if (absDiff < 1 || absDiff > 40) continue;

      const secA = parseTimeToSeconds(a.timeStr);
      const secB = parseTimeToSeconds(b.timeStr);
      let dSec = dRound > 0 ? secA - secB : secB - secA;
      if (dSec < -43200) dSec += 86400; // midnight rollover
      if (dSec <= 0) continue;

      const pace = dSec / absDiff;
      if (pace >= 12 && pace <= 38) {
        samples.push(pace);
        // Weight very recent adjacent rounds higher for instant responsiveness to table tempo
        if (i < 6 && absDiff <= 6) {
          samples.push(pace);
        }
      }
    }
  }

  const hasValidCustom =
    typeof customPaceSec === 'number' && Number.isFinite(customPaceSec) && customPaceSec >= 12 && customPaceSec <= 38;

  if (samples.length >= 1) {
    const sorted = [...samples].sort((x, y) => x - y);
    const median = sorted[Math.floor(sorted.length / 2)];
    const blended = hasValidCustom ? median * 0.65 + (customPaceSec as number) * 0.35 : median;
    const clamped = Math.round(blended * 10) / 10;
    return {
      secondsPerRound: clamped,
      roundsPerMinute: Number((60 / clamped).toFixed(2)),
      source: 'historico',
      sampleCount: samples.length,
      label: `Calibrado ${houseName} (${clamped}s/rodada · ~${(60 / clamped).toFixed(1)}/min)`,
    };
  }

  if (hasValidCustom) {
    const rounded = Math.round((customPaceSec as number) * 10) / 10;
    return {
      secondsPerRound: rounded,
      roundsPerMinute: Number((60 / rounded).toFixed(2)),
      source: 'ao_vivo',
      sampleCount: 1,
      label: `Calibrado ao vivo — ${houseName} (${rounded}s/rodada)`,
    };
  }

  // Adaptive fallback based on current board mood / candle height
  let adaptiveSec = 25.5;
  if (azulPct >= 65) {
    adaptiveSec = 21.0;
  } else if (currentMultiplier >= 10) {
    adaptiveSec = 26.5;
  }

  return {
    secondsPerRound: adaptiveSec,
    roundsPerMinute: Number((60 / adaptiveSec).toFixed(2)),
    source: 'adaptativo',
    sampleCount: 0,
    label: `Automático (${adaptiveSec}s/rodada · ~${(60 / adaptiveSec).toFixed(1)}/min)`,
  };
}

/**
 * Maps an exact second offset (e.g. +4 min from 16:21:23 -> deltaSec = 240)
 * onto the most accurate projected round offsets given paceSec and entryMode.
 */
function offsetsForExactTarget(deltaSec: number, paceSec: number, entryMode: EntryMode): number[] {
  const leadBefore = entryMode === 'antes' ? 28 : 12;
  const trailAfter = entryMode === 'antes' ? 18 : 28;
  const winStart = Math.max(10, deltaSec - leadBefore);
  const winEnd = deltaSec + trailAfter;

  const matched: number[] = [];
  for (let o = 1; o <= 90; o++) {
    const t = o * paceSec;
    if (t >= winStart && t <= winEnd) {
      matched.push(o);
    }
  }

  if (matched.length === 0) {
    const center = Math.max(1, Math.round((deltaSec - (entryMode === 'antes' ? 15 : 0)) / paceSec));
    return Array.from(new Set([Math.max(1, center - 1), center, center + 1]));
  }
  return matched.slice(0, 4);
}

/**
 * Maps a calendar minute window (e.g. "17:40" = 17:40:00..17:40:59) relative to baseTimeStr
 * so seconds inside baseTimeStr (like 17:33:37) are accounted for with zero drift!
 */
function offsetsForCalendarMinute(
  baseTimeStr: string,
  addMinutes: number,
  paceSec: number,
  entryMode: EntryMode,
  extraMinutes = 0
): number[] {
  const baseSec = parseTimeToSeconds(baseTimeStr);
  const baseMinFloor = Math.floor(baseSec / 60) * 60;
  const targetMinStart = baseMinFloor + addMinutes * 60;
  const targetMinEnd = targetMinStart + 59 + extraMinutes * 60;

  const winStart = targetMinStart - (entryMode === 'antes' ? 25 : 0) - baseSec;
  const winEnd = targetMinEnd - baseSec;

  const matched: number[] = [];
  for (let o = 1; o <= 90; o++) {
    const t = o * paceSec;
    if (t >= Math.max(5, winStart) && t <= winEnd) {
      matched.push(o);
    }
  }

  if (matched.length === 0) {
    const centerDelta = Math.max(paceSec, (winStart + winEnd) / 2);
    const center = Math.max(1, Math.round(centerDelta / paceSec));
    return Array.from(new Set([Math.max(1, center - 1), center, center + 1]));
  }
  return matched.slice(0, 5);
}

function getSignalWeight(sig: RoundSignal): number {
  if (sig.id === 'mod5-subtracao-vela') return 35;
  if (sig.id === 'mod5-digito-rodada') return 34;
  if (sig.id === 'mod4-reset-100') return 34;
  if (sig.id === 'mod4-soma-velas') return 32;
  if (sig.id === 'mod4-regra-13') return 30;
  if (sig.id.startsWith('mod4-vela-')) return 30;
  if (sig.id === 'mod5-primeiro-decimal') return 28;
  if (sig.id.startsWith('gatilho-')) return sig.confidence === 'alta' ? 28 : 22;
  if (sig.id === 'trein-minuto-segundos') return 24;
  if (sig.id === 'mod2-soma-decimais-casas') return 24;
  if (sig.id === 'mod2-pos-rosa-5-6') return 22;
  if (sig.id === 'trein-casas-rosa') return 18;
  return 24;
}

export function analyzeAviatorRound(params: {
  roundInput: string;
  multiplierInput: string;
  timeInput: string;
  entryMode: EntryMode;
  payoutMood: PayoutMood;
  paceMode?: PaceMode;
  customPaceSec?: number | null;
  recentCandlesText?: string;
  houseName: string;
  history: RoundEntry[];
}): AnalysisResult {
  const roundNumber = parseInt(params.roundInput.replace(/\D/g, ''), 10);
  const multiplier = parseMultiplier(params.multiplierInput);
  const timeStr = params.timeInput || getCurrentTimeStr();
  const paceMode = params.paceMode ?? 'auto';

  const valid = Number.isFinite(roundNumber) && roundNumber > 0 && Number.isFinite(multiplier) && multiplier >= 1.0;

  // Deduplicate history by roundNumber (newest-first)
  const seenRounds = new Set<number>();
  const dedupedHistory: RoundEntry[] = [];
  for (const h of params.history) {
    if (!seenRounds.has(h.roundNumber)) {
      seenRounds.add(h.roundNumber);
      dedupedHistory.push(h);
    }
  }

  // Merge quick recent candles entered in Buscador for live board health & sequence detection
  const quickCandles = parseQuickCandlesText(params.recentCandlesText || '');
  const boardCandlesHistory: RoundEntry[] =
    quickCandles.length > 0
      ? quickCandles.map((val, idx) => ({
          id: `quick-${idx}`,
          roundNumber: Math.max(1, (Number.isFinite(roundNumber) && roundNumber > 0 ? roundNumber : 100000) - idx),
          multiplier: val,
          timeStr,
          houseName: params.houseName,
          createdAt: Date.now() - idx * 1000,
        }))
      : dedupedHistory;

  const total = boardCandlesHistory.length;
  const azulCount = boardCandlesHistory.filter((h) => h.multiplier < 2).length;
  const roxoItems = boardCandlesHistory.filter((h) => h.multiplier >= 2 && h.multiplier < 10);
  const roxoCount = roxoItems.length;
  const rosaCount = boardCandlesHistory.filter((h) => h.multiplier >= 10).length;
  const azulPct = total > 0 ? Math.round((azulCount / total) * 100) : 0;
  const roxoPct = total > 0 ? Math.round((roxoCount / total) * 100) : 0;
  const rosaPct = total > 0 ? Math.round((rosaCount / total) * 100) : 0;
  const roxoAvg =
    roxoItems.length > 0
      ? Math.round((roxoItems.reduce((acc, item) => acc + item.multiplier, 0) / roxoItems.length) * 100) / 100
      : 0;
  const isHealthyGraph = total === 0 || roxoCount + rosaCount >= azulCount;

  const pace = resolveRoundPace({
    paceMode,
    history: dedupedHistory,
    currentMultiplier: valid ? multiplier : 2.0,
    azulPct,
    customPaceSec: params.customPaceSec,
    houseName: params.houseName,
  });

  const { sequenceAlerts, predominantDecimal } = detectSequenceAlerts(
    boardCandlesHistory,
    valid ? roundNumber : null,
    valid ? multiplier : null
  );

  if (!valid) {
    return {
      valid: false,
      roundNumber: 0,
      multiplier: 0,
      timeStr,
      pace,
      radarVerdict: {
        status: 'CAUTELA',
        tone: 'atencao',
        graphPhase: 'Neutro',
        assertivityScore: 0,
        headline: 'Aguardando rodada e última vela para calibrar o radar',
        reasons: ['Informe o nº da rodada e o multiplicador da última vela saída.'],
      },
      diagnostic: {
        color: 'azul',
        formatted: '0.00x',
        isReset: false,
        isSpecial: false,
        isCasaDos90: false,
        finalDigit: 0,
        finalDigitNote: null,
        exactTriggers: [],
        isBestHour: false,
        bestHourLabel: null,
        pairedHouse: getPairedHouse(params.houseName),
        predominantDecimal,
      },
      signals: [],
      projectedRounds: [],
      topConfluences: [],
      sequenceAlerts,
      boardStats: {
        total,
        azulCount,
        roxoCount,
        rosaCount,
        azulPct,
        roxoPct,
        rosaPct,
        roxoAvg,
        isHealthyGraph,
      },
    };
  }

  const color = classifyCandle(multiplier);
  const { intDigits, decDigits, firstDec, lastDec } = getDecimalParts(multiplier);
  const bestHour = checkBestHour(timeStr);
  const paceSec = pace.secondsPerRound;

  // Dica de Ouro 2 (Módulo 4 p.53)
  let finalDigitNote: string | null = null;
  if (color === 'roxo' && lastDec === 7) {
    finalDigitNote = 'Final 7 em vela roxa: 80% de chance de puxar REDS (azuis). Redobre a cautela.';
  } else if (color === 'roxo' && lastDec === 1) {
    finalDigitNote = 'Final 1 em vela roxa: 80% de chance de puxar 2x ou mais na sequência.';
  } else if ((color === 'roxo' || color === 'azul') && lastDec === 5) {
    finalDigitNote = 'Final 5 em vela azul/roxa: tendência de puxar Roxo 2x+.';
  }

  const exactTriggers = EXACT_TRIGGER_RULES.filter(
    (rule) => multiplier >= rule.minVal && multiplier <= rule.maxVal
  );

  const diagnostic: CandleDiagnostic = {
    color,
    formatted: formatMultiplier(multiplier),
    isReset: multiplier === 1.0,
    isSpecial: SPECIAL_CANDLES.some((s) => Math.abs(s - multiplier) < 0.001),
    isCasaDos90: multiplier >= 1.9 && multiplier <= 1.99,
    finalDigit: lastDec,
    finalDigitNote,
    exactTriggers,
    isBestHour: bestHour.active,
    bestHourLabel: bestHour.label,
    pairedHouse: getPairedHouse(params.houseName),
    predominantDecimal,
  };

  const signals: RoundSignal[] = [];

  // 1. MÓDULO 5 - Estratégia 1: Dígito da Rodada + Horário Completo (Pág. 1 / Mód. 2 p.5)
  const roundStr = String(roundNumber);
  const lastRoundDigit = parseInt(roundStr[roundStr.length - 1], 10);
  const penultimateDigit = roundStr.length >= 2 ? parseInt(roundStr[roundStr.length - 2], 10) : 0;
  const digitToAdd = lastRoundDigit === 0 ? (penultimateDigit > 0 ? penultimateDigit : 10) : lastRoundDigit;
  const digitTargetTime = addMinutesToTime(timeStr, digitToAdd, true);
  const digitOffsets = offsetsForExactTarget(digitToAdd * 60, paceSec, params.entryMode);
  signals.push({
    id: 'mod5-digito-rodada',
    title: `Dígito da Rodada (+${digitToAdd} min)`,
    moduleSource: 'Módulo 5 p.1 · Módulo 2 p.5',
    formula: `Rodada ${roundNumber} (final ${lastRoundDigit}${lastRoundDigit === 0 ? ` → usa ${digitToAdd}` : ''}) → ${timeStr} + ${digitToAdd} min = ${digitTargetTime}`,
    targetTime: digitTargetTime,
    targetRounds: digitOffsets.map((o) => roundNumber + o),
    targetMultiplier:
      color === 'azul'
        ? '2.00x+ (Roxo)'
        : color === 'roxo' && multiplier < 5
          ? '2x–5x (Roxo)'
          : '10x+ (Rosa)',
    protection: '1.49x',
    execution:
      params.entryMode === 'antes'
        ? `Entrar 15s–30s antes · ~${pace.roundsPerMinute} rodadas/min`
        : 'Entrar no minuto exato · até 2 entradas (G1)',
    confidence: 'alta',
    category: 'rodada',
    isStrongMinute: isStrongMinuteStr(digitTargetTime),
  });

  // 2. MÓDULO 5 - Estratégia 4 & p.33: 1º Dígito após o ponto da vela + Horário Completo
  if (firstDec > 0) {
    const firstDecTime = addMinutesToTime(timeStr, firstDec, true);
    const firstDecOffsets = offsetsForExactTarget(firstDec * 60, paceSec, params.entryMode);
    signals.push({
      id: 'mod5-primeiro-decimal',
      title: `1º Dígito Após o Ponto (+${firstDec} min)`,
      moduleSource: 'Módulo 5 p.4 e p.33',
      formula: `Vela ${multiplier.toFixed(2)}x (1º decimal ${firstDec}) → ${timeStr} + ${firstDec} min = ${firstDecTime}`,
      targetTime: firstDecTime,
      targetRounds: firstDecOffsets.map((o) => roundNumber + o),
      targetMultiplier: multiplier >= 10 ? 'Roxo / Rosa (10x+)' : '2.00x+ (Evitar Reds)',
      protection: '1.49x',
      execution: '3 entradas fixas na janela alvo com proteção em 1.49x',
      confidence: multiplier >= 7 ? 'alta' : 'media',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(firstDecTime),
    });
  }

  // 3. MÓDULO 4 - Soma de Velas: Minuto Final + Último Dígito Decimal (Pág. 44–47) & Mód. 2 p.6
  if (lastDec > 0 && ((multiplier >= 1.99 && multiplier <= 9.99) || (multiplier >= 10.0 && multiplier <= 20.0))) {
    const baseMinute = Math.floor((parseTimeToSeconds(timeStr) % 3600) / 60);
    const somaTime = addMinutesToTime(timeStr, lastDec, false);
    const somaOffsets = offsetsForCalendarMinute(timeStr, lastDec, paceSec, params.entryMode);
    const alvoSoma = multiplier >= 10 ? '5.00x+' : '2.00x+';
    signals.push({
      id: 'mod4-soma-velas',
      title: `Minuto + Último Decimal (+${lastDec} min)`,
      moduleSource: 'Módulo 4 p.44–47 · Módulo 2 p.6',
      formula: `Minuto ${String(baseMinute).padStart(2, '0')} + decimal ${lastDec} = ${baseMinute + lastDec} → Janela ${somaTime}:00–59`,
      targetTime: somaTime,
      targetRounds: somaOffsets.map((o) => roundNumber + o),
      targetMultiplier: alvoSoma,
      protection: '1.49x',
      execution:
        multiplier >= 10
          ? 'Entrar até 25s antes · cobrir o minuto cheio'
          : params.entryMode === 'antes'
            ? 'Entrar 15s–25s antes · até G2 no minuto'
            : 'Entrar no minuto exato · até G1',
      confidence: 'alta',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(somaTime),
    });
  }

  // 4. MÓDULO 5 - Estratégia 3: Subtração de Vela (Pág. 3) & Treinamento p.7 (para Rosa >= 10x)
  if (multiplier >= 10) {
    const intDiff =
      intDigits.length >= 2
        ? Math.abs(intDigits[intDigits.length - 1] - intDigits[intDigits.length - 2])
        : intDigits[0];
    const decDiff = Math.abs(decDigits[1] - decDigits[0]);
    const totalSubMin = intDiff + decDiff;
    if (totalSubMin > 0) {
      const subTimeExact = addMinutesToTime(timeStr, totalSubMin, true);
      const sec = parseTimeToSeconds(timeStr) % 60;
      const coversNextMinute = sec >= 40;
      const subTimeLabel = coversNextMinute
        ? `${subTimeExact} até ${addMinutesToTime(timeStr, totalSubMin + 1, true)}`
        : `${addMinutesToTime(timeStr, totalSubMin, false)} (${subTimeExact})`;

      const exactOffsets = offsetsForExactTarget(totalSubMin * 60, paceSec, params.entryMode);
      const calOffsets = offsetsForCalendarMinute(
        timeStr,
        totalSubMin,
        paceSec,
        params.entryMode,
        coversNextMinute ? 1 : 0
      );
      const mergedOffsets = Array.from(new Set([...exactOffsets, ...calOffsets])).sort((a, b) => a - b);

      signals.push({
        id: 'mod5-subtracao-vela',
        title: `Subtração de Vela (+${totalSubMin} min)`,
        moduleSource: 'Módulo 5 p.3 · Treinamento p.7',
        formula: `Inteiros |${intDigits.slice(-2).join('-')}|=${intDiff} + Decimais |${decDigits[1]}-${decDigits[0]}|=${decDiff} = +${totalSubMin} min`,
        targetTime: subTimeLabel,
        targetRounds: mergedOffsets.map((o) => roundNumber + o),
        targetMultiplier: 'Rosa (10x+)',
        protection: '1.49x / 2.00x',
        execution: coversNextMinute
          ? 'Segundos ≥ 40s: cobrir do minuto alvo até o minuto seguinte'
          : '3 a 4 entradas na janela calculada com proteção 1.49x',
        confidence: 'alta',
        category: 'horario',
        isStrongMinute: isStrongMinuteStr(subTimeExact),
      });
    }
  }

  // 5. TREINAMENTO III p.6: Minuto + Dígitos do Segundo (para Rosa >= 10x)
  if (multiplier >= 10) {
    const sec = parseTimeToSeconds(timeStr) % 60;
    const secTens = Math.floor(sec / 10);
    const secOnes = sec % 10;
    const secDigits = Array.from(new Set([secTens, secOnes].filter((d) => d >= 2 && d <= 9)));
    if (secDigits.length > 0) {
      const primaryAdd = secDigits[0];
      const secondaryAdd = secDigits[1];
      const t1 = addMinutesToTime(timeStr, primaryAdd, false);
      const t2 = secondaryAdd ? addMinutesToTime(timeStr, secondaryAdd, false) : null;
      const o1 = offsetsForCalendarMinute(timeStr, primaryAdd, paceSec, params.entryMode);
      const o2 = secondaryAdd ? offsetsForCalendarMinute(timeStr, secondaryAdd, paceSec, params.entryMode) : [];
      const merged = Array.from(new Set([...o1, ...o2])).sort((a, b) => a - b);

      signals.push({
        id: 'trein-minuto-segundos',
        title: `Minuto + Dígitos do Segundo (+${secDigits.join('/')} min)`,
        moduleSource: 'Treinamento III p.6',
        formula: `Segundos :${String(sec).padStart(2, '0')} → somar +${secDigits.join(' e +')} min = ${t1}${t2 ? ` ou ${t2}` : ''}`,
        targetTime: t2 ? `${t1} ou ${t2}` : t1,
        targetRounds: merged.map((o) => roundNumber + o),
        targetMultiplier: 'Rosa (10x+) / Roxo Alto',
        protection: '1.49x',
        execution: 'Cobrir o minuto alvo no ciclo pagante',
        confidence: 'media',
        category: 'horario',
        isStrongMinute: isStrongMinuteStr(t1) || (t2 ? isStrongMinuteStr(t2) : false),
      });
    }
  }

  // 6. MÓDULO 2 p.7: Soma das Decimais em Casas à Frente (Roxo / Rosa) + Trein. p.5 Casas da Rosa Anterior
  const decSum = decDigits[0] + decDigits[1];
  if (multiplier >= 2 && decSum >= 1 && decSum <= 18) {
    const targetRound = roundNumber + decSum;
    const estTime = addSecondsToTime(timeStr, Math.round(decSum * paceSec));
    signals.push({
      id: 'mod2-soma-decimais-casas',
      title: `Soma das Decimais (${decSum}ª Casa à Frente)`,
      moduleSource: 'Módulo 2 p.7 · Treinamento p.5',
      formula: `Decimais ${decDigits[0]} + ${decDigits[1]} = ${decSum} → Contar ${decSum} casas após #${roundNumber}`,
      targetTime: `~${estTime}`,
      targetRounds: [targetRound],
      casasLabel: `Casa +${decSum}`,
      targetMultiplier: multiplier >= 10 ? 'Rosa / Roxo Alto' : 'Roxo (2x+)',
      protection: '1.49x',
      execution: `Entrada principal na rodada #${targetRound} (cobertura #${targetRound - 1} e #${targetRound + 1})`,
      confidence: 'media',
      category: 'rodada',
      isStrongMinute: isStrongMinuteStr(estTime),
    });
  }

  if (multiplier >= 10) {
    // Treinamento p.5: Exemplo 10.75x -> 1ª, 5ª, 7ª e somas 15ª, 17ª casas
    const intLast = intDigits[intDigits.length - 1] ?? 0;
    const candidateHouses = new Set<number>();
    if (decDigits[0] >= 1) candidateHouses.add(decDigits[0]);
    if (decDigits[1] >= 1) candidateHouses.add(decDigits[1]);
    if (intLast >= 1 && decDigits[0] >= 0) {
      const comb1 = intLast * 10 + decDigits[0];
      if (comb1 >= 10 && comb1 <= 25) candidateHouses.add(comb1);
    }
    if (intLast >= 1 && decDigits[1] >= 0) {
      const comb2 = intLast * 10 + decDigits[1];
      if (comb2 >= 10 && comb2 <= 25) candidateHouses.add(comb2);
    }
    const houses = Array.from(candidateHouses).filter((h) => h >= 1 && h <= 25).sort((a, b) => a - b);
    if (houses.length > 0) {
      signals.push({
        id: 'trein-casas-rosa',
        title: `Indicação de Casas da Rosa (${houses.map((h) => `${h}ª`).join(', ')})`,
        moduleSource: 'Treinamento III p.5',
        formula: `Vela ${multiplier.toFixed(2)}x indica casas ${houses.map((h) => `+${h}`).join(', ')} à frente`,
        targetTime: `~${addSecondsToTime(timeStr, Math.round(houses[0] * paceSec))} – ${addSecondsToTime(timeStr, Math.round(houses[houses.length - 1] * paceSec))}`,
        targetRounds: houses.map((h) => roundNumber + h),
        casasLabel: `Casas ${houses.map((h) => `+${h}`).join(', ')}`,
        targetMultiplier: 'Rosa (10x+)',
        protection: '1.49x',
        execution: 'Fazer entrada nas casas indicadas quando houver confluência de minuto',
        confidence: 'media',
        category: 'rodada',
        isStrongMinute: false,
      });
    }
  }

  // 7. MÓDULO 4 - Faixas de Minutos Fixos (2x, 3x, 5x, 10x, 50x, 100x)
  if (multiplier >= 1.99 && multiplier <= 2.99) {
    const t2x = addMinutesToTime(timeStr, 3, false);
    const o2x = offsetsForCalendarMinute(timeStr, 3, paceSec, params.entryMode);
    signals.push({
      id: 'mod4-vela-2x',
      title: 'Base 2x (+3 Minutos)',
      moduleSource: 'Módulo 4 p.11–13',
      formula: `Vela base ${multiplier.toFixed(2)}x (1.99x–2.99x) → +3 min = janela ${t2x}`,
      targetTime: t2x,
      targetRounds: o2x.map((o) => roundNumber + o),
      targetMultiplier: '2.00x',
      protection: '1.49x',
      execution:
        params.entryMode === 'antes'
          ? 'Entrar até 15s antes · 3 entradas (até G2)'
          : 'Entrar no minuto exato · 2 entradas (até G1)',
      confidence: 'alta',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(t2x),
    });
  }

  if (multiplier >= 7.0 && multiplier < 10.0) {
    signals.push({
      id: 'mod5-velas-789',
      title: 'Vela 7x / 8x / 9x (5 Entradas Fixas)',
      moduleSource: 'Módulo 5 p.15',
      formula: `Vela ${multiplier.toFixed(2)}x detectada → próxima janela de 5 rodadas`,
      targetTime: `Imediato (${timeStr})`,
      targetRounds: [roundNumber + 1, roundNumber + 2, roundNumber + 3, roundNumber + 4, roundNumber + 5],
      casasLabel: 'Casas +1 a +5',
      targetMultiplier: '5x / 10x (Rosa)',
      protection: '1.49x',
      execution: 'Fazer 5 entradas de mão fixa com proteção em 1.49x',
      confidence: 'alta',
      category: 'gatilho',
      isStrongMinute: false,
    });
  }

  if (multiplier >= 7.0) {
    const t3x = addMinutesToTime(timeStr, 60, false);
    signals.push({
      id: 'mod4-vela-3x',
      title: 'Base 3x (+60 Minutos / Próxima Hora)',
      moduleSource: 'Módulo 4 p.15',
      formula: `Vela acima de 7x (${multiplier.toFixed(2)}x) → somar +1h = ${t3x}`,
      targetTime: t3x,
      targetRounds: [],
      targetMultiplier: '3.00x',
      protection: '1.49x / 2.00x',
      execution: 'Catalogação horária: entrar 15s antes (até G2) ou no minuto exato (G1)',
      confidence: 'media',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(t3x),
    });
  }

  if (multiplier >= 10.0 && multiplier < 20.0) {
    const t5x = addMinutesToTime(timeStr, 10, false);
    const o5x = offsetsForCalendarMinute(timeStr, 10, paceSec, params.entryMode);
    signals.push({
      id: 'mod4-vela-5x',
      title: 'Base 5x (+10 Minutos)',
      moduleSource: 'Módulo 4 p.18–20',
      formula: `Vela 10x+ (${multiplier.toFixed(2)}x) → somar +10 min = janela ${t5x}`,
      targetTime: t5x,
      targetRounds: o5x.map((o) => roundNumber + o),
      targetMultiplier: '5.00x',
      protection: '1.49x',
      execution: 'Entrar até 20s antes e realizar 3 entradas dentro do minuto',
      confidence: 'alta',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(t5x),
    });
  }

  if (multiplier >= 20.0) {
    const t10x = addMinutesToTime(timeStr, 20, false);
    const o10x = offsetsForCalendarMinute(timeStr, 20, paceSec, params.entryMode);
    signals.push({
      id: 'mod4-vela-10x',
      title: 'Base 10x (+20 Minutos)',
      moduleSource: 'Módulo 4 p.23–25',
      formula: `Vela +20x (${multiplier.toFixed(2)}x) → somar +20 min = janela ${t10x}`,
      targetTime: t10x,
      targetRounds: o10x.map((o) => roundNumber + o),
      targetMultiplier: '10.00x (Rosa)',
      protection: '1.49x / 2.00x',
      execution: 'Entrar até 30s antes e realizar 3 a 4 entradas no minuto',
      confidence: 'alta',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(t10x),
    });

    const t20xRosinha = addMinutesToTime(timeStr, 10, false);
    signals.push({
      id: 'mod4-obs-20x-rosinha',
      title: 'Vela +20x (Após 10 min → Rosinha)',
      moduleSource: 'Módulo 4 p.9',
      formula: `Vela ${multiplier.toFixed(2)}x > 20x → aguardar 10 min (${t20xRosinha}), 4 entradas de 2 em 2 min`,
      targetTime: `${t20xRosinha} (+2m / +4m / +6m)`,
      targetRounds: [],
      targetMultiplier: 'Rosinha (10x+)',
      protection: '1.49x',
      execution: 'Fazer 4 entradas de 2 em 2 min; 5ª casa busca Rosinha',
      confidence: 'media',
      category: 'horario',
      isStrongMinute: isStrongMinuteStr(t20xRosinha),
    });
  }

  if (multiplier >= 30.0) {
    const oddOffsets = [1, 3, 5, 7, 9, 11, 13];
    signals.push({
      id: 'mod4-regra-13',
      title: 'Regra dos 13 (Casas Ímpares)',
      moduleSource: 'Módulo 4 p.48–49',
      formula: `Vela +30x (${multiplier.toFixed(2)}x) paga outra vela alta em até 13 casas (95% nas ímpares)`,
      targetTime: `Próximos ~${Math.round((13 * paceSec) / 60)} min`,
      targetRounds: oddOffsets.map((o) => roundNumber + o),
      casasLabel: 'Casas ímpares: 1, 3, 5, 7, 9, 11, 13',
      targetMultiplier: '10x–18x ou Espelhada (30x+)',
      protection: '1.49x',
      execution: 'Priorizar entradas nas rodadas ímpares com mão controlada',
      confidence: 'alta',
      category: 'regra13',
      isStrongMinute: false,
    });
  }

  if (multiplier >= 60.0) {
    const mins = params.payoutMood === 'positivo' ? [30] : [32, 35];
    const targetTimes = mins.map((m) => addMinutesToTime(timeStr, m, false));
    const is100Base = multiplier >= 105;
    signals.push({
      id: 'mod4-vela-50-100x',
      title: is100Base ? 'Base 100x (+30 min)' : 'Base 50x (+30 min)',
      moduleSource: 'Módulo 4 p.31–41',
      formula:
        params.payoutMood === 'positivo'
          ? `Vela ${multiplier.toFixed(2)}x (Ciclo Positivo) → +30 min = ${targetTimes[0]} (se não pagar, +10m até 3x)`
          : `Vela ${multiplier.toFixed(2)}x (Ciclo Negativo) → +32 min (${targetTimes[0]}) e +35 min (${targetTimes[1]})`,
      targetTime: targetTimes.join(' ou '),
      targetRounds: mins.flatMap((m) => offsetsForCalendarMinute(timeStr, m, paceSec, params.entryMode)).map((o) => roundNumber + o),
      targetMultiplier: is100Base ? '100.00x (Rosa Alta)' : '50.00x+',
      protection: '1.49x / 2.00x',
      execution:
        params.payoutMood === 'positivo'
          ? 'Entrar 30s antes · 4 a 5 entradas no minuto'
          : 'Entrar 30s antes · 5 a 7 entradas cobrindo 2 minutos',
      confidence: 'alta',
      category: 'horario',
      isStrongMinute: targetTimes.some(isStrongMinuteStr),
    });
  }

  // 8. Módulo 4 p.29 & Módulo 5 p.12: Vela 1.00x Reset
  if (multiplier === 1.0) {
    const strongHouses = [1, 4, 5, 7, 10];
    signals.push({
      id: 'mod4-reset-100',
      title: 'Reset 1.00x (Casas Fortes 1/4/5/7/10)',
      moduleSource: 'Módulo 4 p.29 · Módulo 5 p.12',
      formula: `Vela 1.00x na rodada #${roundNumber} → casas mais fortes: 1ª, 4ª, 5ª (muito assertiva), 7ª e 10ª`,
      targetTime: `${addSecondsToTime(timeStr, Math.round(paceSec))} – ${addSecondsToTime(timeStr, Math.round(10 * paceSec))}`,
      targetRounds: strongHouses.map((o) => roundNumber + o),
      casasLabel: 'Foco: +1, +4, +5 (Forte), +7, +10',
      targetMultiplier: '10.00x (Rosa)',
      protection: '1.49x',
      execution: 'Entradas de valores fixos (sem aumentar valor) · Máx 5 entradas nas próximas rodadas',
      confidence: 'alta',
      category: 'gatilho',
      isStrongMinute: false,
    });
  }

  // 9. Gatilhos Exatos da Tabela (Módulo 4, 5, Treinamento)
  for (const rule of exactTriggers) {
    if (rule.minVal === 1.0 && rule.maxVal === 1.0) continue;
    signals.push({
      id: `gatilho-${rule.candle}`,
      title: `Gatilho Vela ${rule.candle}`,
      moduleSource: rule.source,
      formula: `${multiplier.toFixed(2)}x ativa o gatilho direto das próximas rodadas`,
      targetTime: `Imediato (#${roundNumber + 1} a #${roundNumber + 5})`,
      targetRounds: [roundNumber + 1, roundNumber + 2, roundNumber + 3, roundNumber + 4, roundNumber + 5],
      casasLabel: 'Próximas 1 a 5 casas',
      targetMultiplier: rule.target,
      protection: rule.protection,
      execution: rule.entries,
      confidence: rule.isSpecial ? 'alta' : 'media',
      category: 'gatilho',
      isStrongMinute: false,
    });
  }

  // 10. Módulo 2 p.4: Após vela Rosa, contar 5 a 6 casas para pegar Roxo
  if (multiplier >= 10) {
    signals.push({
      id: 'mod2-pos-rosa-5-6',
      title: 'Ciclo Pós-Rosa (5ª e 6ª Casa)',
      moduleSource: 'Módulo 2 p.4 · Treinamento p.5',
      formula: `Após vela Rosa (${multiplier.toFixed(2)}x), contar 5 a 6 casas (ou ciclo 2–8 casas)`,
      targetTime: `~${addSecondsToTime(timeStr, Math.round(5 * paceSec))} – ${addSecondsToTime(timeStr, Math.round(6 * paceSec))}`,
      targetRounds: [roundNumber + 5, roundNumber + 6],
      casasLabel: 'Casas +5 e +6',
      targetMultiplier: 'Roxo (2x–5x)',
      protection: '1.49x',
      execution: 'Entrar na 5ª e 6ª rodada após a Rosa com proteção em 1.49x',
      confidence: 'media',
      category: 'rodada',
      isStrongMinute: false,
    });
  }

  // Has positive sequence trigger or danger active on the current board?
  const hasPositiveSeq = sequenceAlerts.some((a) => a.severity === 'positivo');
  const hasDangerRecolhe = sequenceAlerts.some((a) => a.id === 'seq-mais-azul');
  const isFinal7Caution = color === 'roxo' && lastDec === 7;
  const isFinal1Boost = color === 'roxo' && lastDec === 1;
  const is109Caution = Math.abs(multiplier - 1.09) < 0.005;

  const graphPhase: RadarVerdict['graphPhase'] =
    hasDangerRecolhe || (total >= 5 && azulPct >= 62)
      ? 'Recolhe'
      : total >= 3 && (roxoPct + rosaPct >= 50 || roxoAvg >= 2.6 || hasPositiveSeq)
        ? 'Pague'
        : 'Neutro';

  // Compute ideal temporal center bonuses per offset from primary time signals
  const temporalProximityMap = new Map<number, number>();
  const registerIdealWindow = (idealSec: number) => {
    for (let o = 1; o <= 30; o++) {
      const dist = Math.abs(o * paceSec - idealSec);
      let bonus = 0;
      if (dist <= paceSec * 0.55) bonus = 9;
      else if (dist <= paceSec * 1.1) bonus = 4;
      if (bonus > (temporalProximityMap.get(o) ?? 0)) {
        temporalProximityMap.set(o, bonus);
      }
    }
  };
  const idealShift = params.entryMode === 'antes' ? -15 : 4;
  registerIdealWindow(Math.max(15, digitToAdd * 60 + idealShift));
  if (firstDec > 0) registerIdealWindow(Math.max(15, firstDec * 60 + idealShift));
  if (lastDec > 0) registerIdealWindow(Math.max(15, lastDec * 60 + idealShift));

  // Build next 30 projected rounds strip (~12.5 min coverage)
  const projectedRounds: ProjectedRound[] = [];
  for (let offset = 1; offset <= 30; offset++) {
    const rNum = roundNumber + offset;
    const estTime = addSecondsToTime(timeStr, Math.round(offset * paceSec));
    const minuteStr = estTime.slice(0, 5);
    const isStrongMin = isStrongMinuteStr(estTime);
    const isOdd = multiplier >= 30 && offset <= 13 && offset % 2 === 1;
    const isResetHouse = multiplier === 1.0 && [1, 4, 5, 7, 10].includes(offset);

    const matchingSignals = signals.filter((sig) => sig.targetRounds.includes(rNum));
    const confluenceCount = matchingSignals.length;

    // Weighted Precision Score (0-98%)
    let score = 14;
    if (confluenceCount >= 1) {
      const sortedWeights = matchingSignals
        .map(getSignalWeight)
        .sort((a, b) => b - a);
      // Top signal gives full base + extra weight, subsequent confluences stack smoothly
      score = 26 + sortedWeights[0] + sortedWeights.slice(1).reduce((acc, w) => acc + Math.round(w * 0.65), 0);
    } else if (isResetHouse || isOdd) {
      score = 48;
    }

    // Specific PDF accuracy boosters
    if (isResetHouse && offset === 5) score += 8; // Mód. 4 p.29: 5ª casa muito assertiva
    if (isOdd && [3, 5, 7, 9].includes(offset)) score += 5;
    score += temporalProximityMap.get(offset) ?? 0;

    if (isStrongMin) score += 8;
    if (bestHour.active) score += 7;
    if (graphPhase === 'Pague') score += 9;
    if (total > 0 && isHealthyGraph && roxoAvg >= 2.6) score += 5;
    if (hasPositiveSeq && offset <= 6) score += 9;
    if (isFinal1Boost && offset <= 3) score += 6;
    if (predominantDecimal && decDigits[0] + decDigits[1] === predominantDecimal.digit && offset <= 6) {
      score += 6;
    }

    // Risk penalties
    if (graphPhase === 'Recolhe') score -= 22;
    if (isFinal7Caution && offset <= 3) score -= 18;
    if (is109Caution && offset <= 5) score -= 12;

    const precisionScore = Math.max(5, Math.min(98, score));

    const hasEntry = confluenceCount > 0 || isResetHouse || isOdd;
    const tier: ProjectedRound['tier'] =
      (confluenceCount >= 2 && precisionScore >= 64) || (hasEntry && precisionScore >= 76)
        ? 'confluencia'
        : hasEntry
          ? 'entrada'
          : isStrongMin
            ? 'atencao'
            : 'neutro';

    let recommendedTarget: string | null = null;
    if (matchingSignals.length > 0) {
      const prioritized = [...matchingSignals].sort((a, b) => getSignalWeight(b) - getSignalWeight(a));
      recommendedTarget = prioritized[0].targetMultiplier;
    } else if (isResetHouse) {
      recommendedTarget = '10x (Reset · Rosa)';
    } else if (isOdd) {
      recommendedTarget = '10x–18x (Ímpar R13 · Rosa)';
    }

    const expectedColor = inferExpectedCandleColor(
      recommendedTarget,
      matchingSignals,
      isResetHouse,
      isOdd
    );

    projectedRounds.push({
      offset,
      roundNumber: rNum,
      estimatedTime: estTime,
      minuteStr,
      isStrongMinute: isStrongMin,
      isOddRule13: isOdd,
      isResetStrongHouse: isResetHouse,
      matchingSignals,
      confluenceCount,
      precisionScore,
      tier,
      expectedColor,
      recommendedTarget,
    });
  }

  // Rank Top 3 highest-precision upcoming windows
  const topConfluences: TopPrecisionEntry[] = projectedRounds
    .filter((p) => p.matchingSignals.length > 0 || p.isResetStrongHouse || p.isOddRule13)
    .sort((a, b) => {
      if (b.precisionScore !== a.precisionScore) return b.precisionScore - a.precisionScore;
      if (b.confluenceCount !== a.confluenceCount) return b.confluenceCount - a.confluenceCount;
      return a.offset - b.offset;
    })
    .slice(0, 3)
    .map((p) => ({
      roundNumber: p.roundNumber,
      offset: p.offset,
      estimatedTime: p.estimatedTime,
      precisionScore: p.precisionScore,
      confluenceCount: Math.max(1, p.confluenceCount),
      expectedColor: p.expectedColor ?? 'roxo',
      signalTitles:
        p.matchingSignals.length > 0
          ? p.matchingSignals.map((s) => s.title)
          : [p.isResetStrongHouse ? 'Reset 1.00x (Casa Forte)' : 'Regra dos 13 (Ímpar)'],
      targetMultiplier: p.recommendedTarget || '2.00x+',
      protection: p.matchingSignals[0]?.protection || '1.49x',
    }));

  // Build overall Radar Verdict
  const topScore = topConfluences[0]?.precisionScore ?? 45;
  const reasons: string[] = [];
  if (topConfluences[0]) {
    reasons.push(
      `Melhor janela: #${topConfluences[0].roundNumber} (+${topConfluences[0].offset} · ~${topConfluences[0].estimatedTime}) com ${topConfluences[0].precisionScore}%`
    );
  }
  if (graphPhase === 'Pague') {
    reasons.push(
      roxoAvg >= 2.6
        ? `Gráfico em Pague (média roxas ${roxoAvg.toFixed(2)}x ≥ 2.60x)`
        : 'Gráfico pagante favorável para buscar 2x–10x'
    );
  } else if (graphPhase === 'Recolhe') {
    reasons.push(`Gráfico em Recolhe (${azulPct}% azuis): evitar mão cheia até quebrar`);
  } else {
    reasons.push('Sem histórico suficiente da mesa: cole as últimas velas para leitura de Pague/Recolhe');
  }
  if (bestHour.active && bestHour.label) {
    reasons.push(`Dentro de melhor horário (${bestHour.label})`);
  }
  if (isFinal7Caution) {
    reasons.push('Dica de Ouro 2: Roxo final 7 (80% risco de puxar azuis imediatos)');
  }
  if (hasPositiveSeq) {
    const pos = sequenceAlerts.find((a) => a.severity === 'positivo');
    if (pos) reasons.push(pos.title);
  }

  const hasMajorRecolheBreak = sequenceAlerts.some((a) =>
    ['seq-duplo-reset', 'seq-100-137-100', 'seq-5-azuis-roxo-reset', 'seq-gatilho-surreal-5-azuis'].includes(a.id)
  );

  let radarStatus: RadarVerdict['status'] = 'PROTEGER';
  let radarTone: RadarVerdict['tone'] = 'atencao';
  let headline = 'Operar apenas nas casas com confluência e proteção em 1.49x';

  if (graphPhase === 'Recolhe' && !hasMajorRecolheBreak) {
    radarStatus = 'PAUSAR';
    radarTone = 'perigo';
    headline = 'Gráfico em Recolhe (predomínio de azuis) — aguarde quebra para roxa antes de entrar';
  } else if (isFinal7Caution || is109Caution) {
    radarStatus = 'CAUTELA';
    radarTone = 'atencao';
    headline = isFinal7Caution
      ? 'Vela roxa final 7 detectada: evite entradas imediatas, aguarde a janela principal'
      : 'Vela 1.09x pode puxar sequência azul: confirme quebra antes de entrar';
  } else if (topScore >= 76 && (graphPhase === 'Pague' || hasPositiveSeq || bestHour.active)) {
    radarStatus = 'OPERAR';
    radarTone = 'positivo';
    headline = `Radar favorável em ${params.houseName} — alta confluência nas casas destacadas`;
  } else if (topScore >= 65) {
    radarStatus = 'PROTEGER';
    radarTone = 'positivo';
    headline = `Entradas válidas em ${params.houseName} — use 1ª mão cobrindo em 1.49x`;
  }

  const radarVerdict: RadarVerdict = {
    status: radarStatus,
    tone: radarTone,
    graphPhase,
    assertivityScore: topScore,
    headline,
    reasons: reasons.slice(0, 4),
  };

  return {
    valid: true,
    roundNumber,
    multiplier,
    timeStr,
    pace,
    radarVerdict,
    diagnostic,
    signals,
    projectedRounds,
    topConfluences,
    sequenceAlerts,
    boardStats: {
      total,
      azulCount,
      roxoCount,
      rosaCount,
      azulPct,
      roxoPct,
      rosaPct,
      roxoAvg,
      isHealthyGraph,
    },
  };
}

function detectSequenceAlerts(
  history: RoundEntry[],
  currentRound: number | null,
  currentMult: number | null
): { sequenceAlerts: SequenceAlert[]; predominantDecimal: { digit: number; count: number } | null } {
  const alerts: SequenceAlert[] = [];

  // Build deduplicated newest-first candle list
  const candles = history.map((h) => h.multiplier);
  if (currentMult !== null) {
    const alreadyTop =
      history.length > 0 &&
      (history[0].roundNumber === currentRound ||
        (Math.abs(history[0].multiplier - currentMult) < 0.001 && currentRound === null));
    if (!alreadyTop) {
      candles.unshift(currentMult);
    }
  }

  // Predominant last decimal across recent candles (Treinamento III p.10)
  let predominantDecimal: { digit: number; count: number } | null = null;
  if (candles.length >= 4) {
    const sample = candles.slice(0, 18);
    const counts = new Map<number, number>();
    for (const c of sample) {
      const last = Number(c.toFixed(2).slice(-1));
      counts.set(last, (counts.get(last) ?? 0) + 1);
    }
    let bestDigit = -1;
    let bestCount = 0;
    for (const [d, cnt] of counts.entries()) {
      if (cnt > bestCount) {
        bestCount = cnt;
        bestDigit = d;
      }
    }
    if (bestCount >= 3 && bestDigit >= 0) {
      predominantDecimal = { digit: bestDigit, count: bestCount };
      const latestDecs = candles[0].toFixed(2).split('.')[1].split('').map(Number);
      const latestDecSum = latestDecs[0] + latestDecs[1];
      const matchesSum = latestDecSum === bestDigit;
      alerts.push({
        id: 'seq-decimal-predominante',
        title: `Decimal Predominante .x${bestDigit} (${bestCount}x no ciclo)`,
        source: 'Treinamento III p.10',
        description: matchesSum
          ? `A decimal ${bestDigit} repetiu ${bestCount}x nas últimas ${sample.length} rodadas e a vela atual (${candles[0].toFixed(2)}x) soma exatamente ${latestDecs[0]}+${latestDecs[1]}=${bestDigit}.`
          : `A decimal final ${bestDigit} apareceu ${bestCount}x nas últimas ${sample.length} rodadas, indicando o ritmo do ciclo atual.`,
        action: matchesSum
          ? 'Sinal forte de ciclo de Rosa próximo: entrar com proteção em 1.49x.'
          : 'Aguardar vela cuja soma decimal feche na predominante para buscar Rosa.',
        severity: matchesSum ? 'positivo' : 'alerta',
      });
    }
  }

  if (candles.length === 0) return { sequenceAlerts: alerts, predominantDecimal };

  // 1. Check gráfico com mais azul do que roxo (Módulo 5 p.6)
  if (candles.length >= 6) {
    const sample = candles.slice(0, 12);
    const blues = sample.filter((c) => c < 2).length;
    const purplesOrPink = sample.length - blues;
    if (blues > purplesOrPink + 2) {
      alerts.push({
        id: 'seq-mais-azul',
        title: 'Gráfico em Recolhe (Mais Azul que Roxo)',
        source: 'Módulo 5 p.6 · Módulo 1 p.6',
        description: `${blues} azuis contra ${purplesOrPink} roxas/rosas nas últimas ${sample.length} velas. Regra do PDF: evitar operar em gráfico predominante azul.`,
        action: 'Aguardar quebra para sequência de roxas ou pausar.',
        severity: 'perigo',
      });
    }
  }

  // 2. Check Pares Gatilhos de Rosa (Módulo 4 p.52)
  if (candles.length >= 2) {
    const [latest, prev] = candles;
    for (const pair of ROSE_PAIRS) {
      if (
        (Math.abs(prev - pair.a) < 0.005 && Math.abs(latest - pair.b) < 0.005) ||
        (Math.abs(prev - pair.b) < 0.005 && Math.abs(latest - pair.a) < 0.005)
      ) {
        alerts.push({
          id: `pair-${pair.label}`,
          title: `Par Gatilho de Rosa Detectado (${pair.label})`,
          source: 'Módulo 4 p.17 e p.52',
          description: `As duas últimas velas (${prev.toFixed(2)}x e ${latest.toFixed(2)}x) formam um par gatilho oficial para Rosa.`,
          action: 'Iniciar 5 entradas fixas com proteção em 1.49x buscando 10x+.',
          severity: 'positivo',
        });
        break;
      }
    }
  }

  // 3. Casamento de Decimais (Treinamento III p.11): 9-1, 2-5, 8-4, 3-7, 2-9, 8-1
  if (candles.length >= 2) {
    const d0 = Number(candles[0].toFixed(2).slice(-1));
    const d1 = Number(candles[1].toFixed(2).slice(-1));
    const validPairs: Array<[number, number]> = [
      [9, 1],
      [2, 5],
      [8, 4],
      [3, 7],
      [2, 9],
      [8, 1],
    ];
    const matchedPair = validPairs.find(
      ([a, b]) => (d0 === a && d1 === b) || (d0 === b && d1 === a)
    );
    if (matchedPair) {
      alerts.push({
        id: 'seq-casamento-decimais',
        title: `Casamento de Decimais (${matchedPair[0]}-${matchedPair[1]})`,
        source: 'Treinamento III p.11',
        description: `Finais decimais emparelhados nas duas últimas velas (${candles[1].toFixed(2)}x e ${candles[0].toFixed(2)}x).`,
        action: 'Indicação de janela para buscar Rosa com proteção em 1.49x.',
        severity: 'positivo',
      });
    }
  }

  // 4. Padrão 1.00x + 1.37x + 1.00x juntas (Módulo 5 p.18)
  if (candles.length >= 3) {
    const top3 = candles.slice(0, 3);
    const has100Count = top3.filter((c) => c === 1.0).length;
    const has137 = top3.some((c) => c === 1.37);
    if (has100Count === 2 && has137) {
      alerts.push({
        id: 'seq-100-137-100',
        title: 'Combinação 1.00x + 1.37x + 1.00x (+95% Assertividade)',
        source: 'Módulo 5 p.18',
        description: 'Trinca lendária de reset 1.00x com vela especial 1.37x detectada nas 3 últimas rodadas.',
        action: 'Fazer 5 entradas fixas, proteção em 1.49x e buscar 5x ou 10x.',
        severity: 'positivo',
      });
    }
  }

  // 5. Duas velas 1.00x cravadas (Módulo 5 p.13, 15)
  if (candles.length >= 2 && candles[0] === 1.0 && candles[1] === 1.0) {
    alerts.push({
      id: 'seq-duplo-reset',
      title: 'Duplo Reset 1.00x Cravado (~100% Chance 5x/10x)',
      source: 'Módulo 5 p.13 e p.15',
      description: 'Duas velas 1.00x seguidas detectadas.',
      action: 'Fazer até 5 entradas fixas buscando 5x e 10x (proteção 1.49x).',
      severity: 'positivo',
    });
  }

  // 6. Casa 1.30x ligada a 1.00x (Módulo 5 p.23)
  if (
    candles.length >= 2 &&
    ((candles[0] === 1.0 && candles[1] >= 1.3 && candles[1] <= 1.39) ||
      (candles[1] === 1.0 && candles[0] >= 1.3 && candles[0] <= 1.39))
  ) {
    alerts.push({
      id: 'seq-130-100',
      title: 'Combinação Casa 1.30x + Reset 1.00x',
      source: 'Módulo 5 p.23',
      description: 'Vela na casa de 1.30x ligada diretamente à vela resetando 1.00x.',
      action: '5 entradas fixas · proteção 1.49x · alvo 2x, 3x com tendência de 5x/10x.',
      severity: 'positivo',
    });
  }

  // 7. 5+ velas abaixo de 1.49x + Vela Especial (Módulo 5 p.31)
  if (candles.length >= 6) {
    const specialList = [1.11, 1.37, 1.66, 1.88, 1.99];
    const latestIsSpecial = specialList.some((s) => Math.abs(candles[0] - s) < 0.005);
    const prevFiveBelow149 = candles.slice(1, 6).every((c) => c < 1.49);
    if (latestIsSpecial && prevFiveBelow149) {
      alerts.push({
        id: 'seq-gatilho-surreal-5-azuis',
        title: 'Gatilho Surreal: 5+ Azuis < 1.49x + Vela Especial',
        source: 'Módulo 5 p.31',
        description: `5 velas seguidas abaixo de 1.49x cravando na vela especial ${candles[0].toFixed(2)}x.`,
        action: '5 entradas fixas, proteção em 1.49x, alvo 3x com alta probabilidade de 5x–100x.',
        severity: 'positivo',
      });
    }
  }

  // 8. Sequência de 4 Roxos + quebra em 1 Azul (Módulo 5 p.6)
  if (candles.length >= 5) {
    const latestIsBlue = candles[0] < 2.0;
    const prev4Purple = candles.slice(1, 5).every((c) => c >= 2.0);
    if (latestIsBlue && prev4Purple) {
      alerts.push({
        id: 'seq-4-roxos-1-azul',
        title: 'Sequência de 4 Roxos + Quebra em 1 Azul',
        source: 'Módulo 5 p.6',
        description: 'Gatilho clássico de retorno ao roxo após 4 roxas/rosas quebradas por 1 azul.',
        action: 'Fazer entrada imediata buscando 2.00x+ (proteção 1.49x).',
        severity: 'positivo',
      });
    }
  }

  // 9. 5 Azuis + 1 Roxo + 1.00x Reset (Módulo 5 p.16)
  if (candles.length >= 7) {
    const isResetNow = candles[0] === 1.0;
    const prevIsPurple = candles[1] >= 2.0 && candles[1] < 10.0;
    const prev5Blue = candles.slice(2, 7).every((c) => c < 2.0);
    if (isResetNow && prevIsPurple && prev5Blue) {
      alerts.push({
        id: 'seq-5-azuis-roxo-reset',
        title: 'Padrão Perfeito: 5 Azuis + 1 Roxo + 1.00x',
        source: 'Módulo 5 p.16',
        description: 'Sequência de 5 azuis, quebra em 1 roxa e reset em 1.00x (+90% assertividade).',
        action: 'Entrar imediatamente após o 1.00x · até 5 entradas fixas buscando 5x ou 10x.',
        severity: 'positivo',
      });
    }
  }

  // 10. Média do Roxo (Módulo 2 p.8)
  const recentPurples = candles.filter((c) => c >= 2 && c < 10).slice(0, 5);
  if (recentPurples.length >= 3) {
    const avg = recentPurples.reduce((a, b) => a + b, 0) / recentPurples.length;
    if (avg >= 2.6) {
      alerts.push({
        id: 'seq-media-roxo-alta',
        title: `Média do Roxo Forte (${avg.toFixed(2)}x ≥ 2.60x)`,
        source: 'Módulo 2 p.8',
        description: 'A média das últimas velas roxas está acima de 2.60x, indicando continuidade pagante.',
        action: 'Gráfico favorável para continuar buscando roxos (2x+).',
        severity: 'positivo',
      });
    } else if (avg <= 2.15) {
      alerts.push({
        id: 'seq-media-roxo-queda',
        title: `Média do Roxo em Queda (${avg.toFixed(2)}x)`,
        source: 'Módulo 2 p.8',
        description: 'Velas roxas saindo muito baixas (próximas de 2.02x), indicando risco de entrada de azuis.',
        action: 'Não arrisque capital na dúvida; aguarde confirmação.',
        severity: 'alerta',
      });
    }
  }

  // 11. Fechamento / Casamento de Velas & Crescente/Decrescente (Módulo 5 p.5, 34, 35 & Treinamento p.12)
  if (candles.length >= 2) {
    const digitSum = (val: number) =>
      val
        .toFixed(2)
        .replace('.', '')
        .split('')
        .reduce((a, b) => a + Number(b), 0);
    const s0 = digitSum(candles[0]);
    const s1 = digitSum(candles[1]);
    if (Math.abs(s0 - s1) <= 2 && candles[0] < 10 && candles[1] < 10) {
      const relation =
        s0 === s1 ? 'Igual' : s0 < s1 ? `Decrescente (${s1}→${s0})` : `Crescente (${s1}→${s0})`;
      alerts.push({
        id: 'seq-fechamento-velas',
        title: `Fechamento de Velas · ${relation}`,
        source: 'Módulo 5 p.5,34 · Trein. p.12',
        description: `Soma dos dígitos das duas últimas velas (${candles[1].toFixed(2)}→${s1} e ${candles[0].toFixed(2)}→${s0}) em casamento (=, +1 ou -1/+2).`,
        action: 'Janela de atenção aberta para buscar Rosa se o gráfico estiver em Pague.',
        severity: 'alerta',
      });
    }
  }

  return { sequenceAlerts: alerts, predominantDecimal };
}

function isRosaTargetLabel(label: string): boolean {
  return /(rosa|rosinha|espelhada|\b10\.?0*x|\b1[0-9](?:\.\d+)?x|\b[2-9][0-9](?:\.\d+)?x|\b[1-9][0-9]{2,}(?:\.\d+)?x)/i.test(
    label
  );
}

function inferExpectedCandleColor(
  recommendedTarget: string | null,
  matchingSignals: RoundSignal[],
  isResetStrongHouse: boolean,
  isOddRule13: boolean
): ProjectedCandleColor | null {
  if (isResetStrongHouse || isOddRule13) return 'rosa';
  if (recommendedTarget && isRosaTargetLabel(recommendedTarget)) return 'rosa';
  if (matchingSignals.some((s) => isRosaTargetLabel(s.targetMultiplier))) return 'rosa';
  if (recommendedTarget || matchingSignals.length > 0) return 'roxo';
  return null;
}

export function analyzeSuperCandleCycles(params: {
  candleInput: string;
  timeInput: string;
  dateInput?: string;
  roundInput?: string;
  payoutMood: PayoutMood;
  houseName: string;
  paceSec?: number;
}): SuperCandleAnalysis {
  const multiplier = parseMultiplier(params.candleInput);
  const timeStr = params.timeInput.trim() || getCurrentTimeStr();
  const baseDateObj = parseDateAndTimeToDate(params.dateInput, timeStr);
  const dateStr = formatIsoDate(baseDateObj);
  const formattedDateStr = formatBrDate(baseDateObj);
  const parsedRound = params.roundInput ? parseInt(params.roundInput.replace(/\D/g, ''), 10) : NaN;
  const roundNumber = Number.isFinite(parsedRound) && parsedRound > 0 ? parsedRound : null;
  const paceSec =
    typeof params.paceSec === 'number' && Number.isFinite(params.paceSec) && params.paceSec >= 12 && params.paceSec <= 38
      ? params.paceSec
      : 25.5;

  const valid = Number.isFinite(multiplier) && multiplier >= 10.0;

  if (!valid) {
    return {
      valid: false,
      multiplier: Number.isFinite(multiplier) ? multiplier : 0,
      dateStr,
      formattedDateStr,
      timeStr,
      roundNumber,
      houseName: params.houseName,
      paceSec,
      tier: 'alta',
      tierLabel: 'Vela Alta (≥ 10.00x)',
      tierSummary: 'Informe a rodada, hora e uma vela alta (10x, 50x, 100x, 500x, 1000x+) para calcular os padrões separados de 7h, 12h, 24h e 34h.',
      decimalOffsetMinutes: 0,
      decimalFormula: 'Aguardando multiplicador ≥ 10.00x',
      roundDigitTime: null,
      roundDigitFormula: null,
      hourCycles: [],
      shortWindows: [],
    };
  }

  const { intDigits, decDigits, firstDec, lastDec } = getDecimalParts(multiplier);
  const intDiff =
    intDigits.length >= 2
      ? Math.abs(intDigits[intDigits.length - 1] - intDigits[intDigits.length - 2])
      : intDigits[0] ?? 0;
  const decDiff = Math.abs(decDigits[1] - decDigits[0]);
  const rawSubMin = intDiff + decDiff;
  const decimalOffsetMinutes = rawSubMin > 0 ? rawSubMin : firstDec > 0 ? firstDec : lastDec > 0 ? lastDec : 2;
  const moodShiftMin = params.payoutMood === 'negativo' ? 2 : 0;

  const decimalFormula =
    rawSubMin > 0
      ? `Subtração |${intDigits.slice(-2).join('-')}|=${intDiff} + |${decDigits[1]}-${decDigits[0]}|=${decDiff} → +${decimalOffsetMinutes} min${moodShiftMin ? ` (+${moodShiftMin}m ciclo negativo)` : ''}`
      : `Decimal da vela (${multiplier.toFixed(2)}x) → ajuste +${decimalOffsetMinutes} min${moodShiftMin ? ` (+${moodShiftMin}m ciclo negativo)` : ''}`;

  let roundDigitTime: string | null = null;
  let roundDigitFormula: string | null = null;
  if (roundNumber !== null) {
    const rStr = String(roundNumber);
    const lastD = parseInt(rStr[rStr.length - 1], 10);
    const penD = rStr.length >= 2 ? parseInt(rStr[rStr.length - 2], 10) : 0;
    const addM = lastD === 0 ? (penD > 0 ? penD : 10) : lastD;
    roundDigitTime = addMinutesToTime(timeStr, addM, true);
    roundDigitFormula = `Rodada #${roundNumber} (final ${lastD}${lastD === 0 ? ` → ${addM}` : ''}) + ${timeStr} = ${roundDigitTime} (+${addM} min)`;
  }

  let tier: SuperCandleTier = 'alta';
  let tierLabel = 'Vela Alta (10x–49.99x)';
  let tierSummary = 'Ciclo de vela Rosa padrão com projeções de 7h, 12h, 24h e 34h.';
  let cycleTarget = 'Rosa (10x–30x+)';

  if (multiplier >= 500) {
    tier = 'ultra';
    tierLabel = 'Ultra Super Vela (500x–1000x+)';
    tierSummary = 'Vela extrema de longo alcance; forte espelhamento nos ciclos de 7h, 12h, 24h e 34h.';
    cycleTarget = 'Super / Mega Vela (50x–500x+)';
  } else if (multiplier >= 100) {
    tier = 'mega';
    tierLabel = 'Mega Vela (100x–499.99x)';
    tierSummary = 'Base 100x do Módulo 4: repetição horária (+30/+32/+35m) e espelhamento nos ciclos de 7h, 12h, 24h e 34h.';
    cycleTarget = 'Rosa Alta / 100x+ (Alvo 20x–100x+)';
  } else if (multiplier >= 50) {
    tier = 'super';
    tierLabel = 'Super Vela (50x–99.99x)';
    tierSummary = 'Base 50x do Módulo 4: janela curta +30/+35m e macro-retornos de Rosa em 7h, 12h, 24h e 34h.';
    cycleTarget = 'Rosa / Super Vela (15x–50x+)';
  }

  const baseMidnightMs = new Date(
    baseDateObj.getFullYear(),
    baseDateObj.getMonth(),
    baseDateObj.getDate()
  ).getTime();

  const hourDefs: Array<{ hours: SuperCandleHourValue; label: string; pdfBasis: string; baseBoost: number }> = [
    {
      hours: 7,
      label: 'Ciclo de 7 Horas (+7h)',
      pdfBasis: 'Macro-ciclo de 7h após Super Vela Alta (reabertura de pagamento)',
      baseBoost: 76,
    },
    {
      hours: 12,
      label: 'Ciclo de 12 Horas (+12h)',
      pdfBasis: 'Espelhamento de meio-dia (12h) · troca de turno pagante',
      baseBoost: 81,
    },
    {
      hours: 24,
      label: 'Ciclo de 24 Horas (+24h)',
      pdfBasis: 'Módulo 4 p.43 (Catalogação Dia Anterior) · mesmo horário no dia seguinte',
      baseBoost: 86,
    },
    {
      hours: 34,
      label: 'Ciclo de 34 Horas (+34h)',
      pdfBasis: 'Macro-ciclo estendido de 34h (virada de segundo dia pagante)',
      baseBoost: 79,
    },
  ];

  const hourCycles: SuperCandleHourCycle[] = hourDefs.map((def) => {
    const exactDateObj = new Date(baseDateObj.getTime() + def.hours * 3600_000);
    const exactMidnightMs = new Date(
      exactDateObj.getFullYear(),
      exactDateObj.getMonth(),
      exactDateObj.getDate()
    ).getTime();
    const daySpan = Math.round((exactMidnightMs - baseMidnightMs) / 86400_000);
    const dayOffsetLabel =
      def.hours === 24
        ? 'Dia seguinte (+24h exatas)'
        : daySpan >= 2
          ? `+${daySpan} dias (${def.hours}h à frente)`
          : daySpan === 1
            ? 'Dia seguinte (+1 dia)'
            : 'Mesmo dia';

    const exactDate = formatBrDate(exactDateObj);
    const exactShortDate = formatShortBrDate(exactDateObj);
    const exactTime = formatDateTimeClock(exactDateObj, true);
    const exactDateTimeLabel = `${exactDate} às ${exactTime}`;

    const winStartObj = new Date(exactDateObj.getTime() - 30_000);
    const winEndObj = new Date(
      exactDateObj.getTime() + (params.payoutMood === 'negativo' ? 2 : 1) * 60_000
    );
    const winStartStr = formatDateTimeClock(winStartObj, false);
    const winEndStr = formatDateTimeClock(winEndObj, false);
    const winStartShortDate = formatShortBrDate(winStartObj);
    const winEndShortDate = formatShortBrDate(winEndObj);
    const entryWindow = `${winStartStr} (-30s) até ${winEndStr}`;
    const entryWindowWithDate =
      winStartShortDate === winEndShortDate
        ? `${winStartShortDate} · ${winStartStr} (-30s) até ${winEndStr}`
        : `${winStartShortDate} ${winStartStr} (-30s) até ${winEndShortDate} ${winEndStr}`;

    const totalAdjustMin = decimalOffsetMinutes + moodShiftMin;
    const decimalDateObj = new Date(exactDateObj.getTime() + totalAdjustMin * 60_000);
    const decimalAdjustedDate = formatBrDate(decimalDateObj);
    const decimalAdjustedShortDate = formatShortBrDate(decimalDateObj);
    const decimalAdjustedTime = formatDateTimeClock(decimalDateObj, true);
    const decimalAdjustedDateTimeLabel = `${decimalAdjustedDate} às ${decimalAdjustedTime}`;

    const estimatedRoundsDelta = Math.round((def.hours * 3600) / paceSec);
    const estimatedRound = roundNumber !== null ? roundNumber + estimatedRoundsDelta : null;

    const isStrongMin = isStrongMinuteStr(exactTime);
    const isDecStrongMin = isStrongMinuteStr(decimalAdjustedTime);
    const bestHourExact = checkBestHour(exactTime);
    const bestHourDec = checkBestHour(decimalAdjustedTime);
    const isBestHour = bestHourExact.active || bestHourDec.active;
    const bestHourLabel = bestHourExact.label || bestHourDec.label;

    let score = def.baseBoost;
    if (multiplier >= 100) score += 4;
    if (multiplier >= 500) score += 3;
    if (isStrongMin) score += 5;
    if (isDecStrongMin) score += 3;
    if (isBestHour) score += 5;
    const confidenceScore = Math.min(98, score);

    return {
      hours: def.hours,
      label: def.label,
      dayOffsetLabel,
      exactDate,
      exactShortDate,
      exactTime,
      exactDateTimeLabel,
      exactTimestampMs: exactDateObj.getTime(),
      entryWindow,
      entryWindowWithDate,
      decimalAdjustedDate,
      decimalAdjustedShortDate,
      decimalAdjustedTime,
      decimalAdjustedDateTimeLabel,
      decimalTimestampMs: decimalDateObj.getTime(),
      decimalOffsetMinutes: totalAdjustMin,
      estimatedRound,
      estimatedRoundsDelta,
      isStrongMinute: isStrongMin,
      isDecimalStrongMinute: isDecStrongMin,
      isBestHour,
      bestHourLabel,
      expectedColor: 'rosa',
      targetMultiplier: cycleTarget,
      protection: '1.49x / 2.00x',
      execution: 'Entrar 30s antes do horário alvo · 4 a 5 entradas fixas cobrindo o minuto e o ajuste decimal',
      confidenceScore,
      pdfBasis: def.pdfBasis,
    };
  });

  // Short-term Super Candle windows (Módulo 4 p.15, 23, 31-41)
  const shortOffsets =
    multiplier >= 50
      ? params.payoutMood === 'positivo'
        ? [
            { min: 20, label: 'Base 10x (+20m)', target: '10.00x+ (Rosa)', note: 'Mód. 4 p.23 · 1ª busca de Rosa' },
            { min: 30, label: 'Super Vela (+30m)', target: multiplier >= 100 ? '50x–100x+ (Rosa)' : '50.00x+ (Rosa)', note: 'Mód. 4 p.31 · Ciclo positivo (30s antes)' },
            { min: 40, label: '1º Acréscimo (+40m)', target: '50x–100x (Rosa)', note: 'Mód. 4 p.34 · +10 min se não pagar nos 30m' },
            { min: 50, label: '2º Acréscimo (+50m)', target: '20x–100x (Rosa)', note: 'Mód. 4 p.35 · Máx 3 acréscimos de +10 min' },
            { min: 60, label: 'Base 3x (+1h / +60m)', target: '3.00x–10x+ (Roxo/Rosa)', note: 'Mód. 4 p.15 · Virada da hora + 3º acréscimo' },
          ]
        : [
            { min: 32, label: 'Ciclo Negativo (+32m)', target: multiplier >= 100 ? '50x–100x+ (Rosa)' : '50.00x+ (Rosa)', note: 'Mód. 4 p.38 · +2 min de atraso no ciclo negativo' },
            { min: 35, label: 'Ciclo Negativo (+35m)', target: multiplier >= 100 ? '50x–100x+ (Rosa)' : '50.00x+ (Rosa)', note: 'Mód. 4 p.38 · +5 min cobrindo 5 a 7 entradas' },
            { min: 45, label: '1º Acréscimo (+45m)', target: '20x–100x (Rosa)', note: 'Mód. 4 p.39 · Extensão +10 min pós +35m' },
            { min: 60, label: 'Base +1h (+60m)', target: '3.00x–10x+ (Roxo/Rosa)', note: 'Mód. 4 p.15 · Próxima hora exata' },
          ]
      : [
          { min: 10, label: 'Base 5x (+10m)', target: '5.00x–10x (Roxo/Rosa)', note: 'Mód. 4 p.18 · 3 entradas no minuto' },
          { min: decimalOffsetMinutes, label: `Subtração Decimal (+${decimalOffsetMinutes}m)`, target: '10.00x+ (Rosa)', note: 'Mód. 5 p.3 · Cruzamento exato dos dígitos' },
          { min: 20, label: 'Base 10x (+20m)', target: '10.00x+ (Rosa)', note: 'Mód. 4 p.23 · Busca principal de Rosa' },
          { min: 60, label: 'Base 3x (+1h / +60m)', target: '3.00x+ (Roxo)', note: 'Mód. 4 p.15 · Catalogação de +1 hora' },
        ];

  const shortWindows: SuperCandleShortWindow[] = shortOffsets.map((item) => {
    const winDate = new Date(baseDateObj.getTime() + item.min * 60_000);
    const t = formatDateTimeClock(winDate, true);
    const estRound = roundNumber !== null ? roundNumber + Math.round((item.min * 60) / paceSec) : null;
    return {
      id: `short-${item.min}`,
      label: item.label,
      offsetMinutes: item.min,
      targetDate: formatShortBrDate(winDate),
      targetTime: t,
      estimatedRound: estRound,
      isStrongMinute: isStrongMinuteStr(t),
      expectedColor: item.target.includes('Rosa') && !item.target.startsWith('3.00x') && !item.target.startsWith('5.00x') ? 'rosa' : 'roxo',
      targetMultiplier: item.target,
      note: item.note,
    };
  });

  return {
    valid: true,
    multiplier,
    dateStr,
    formattedDateStr,
    timeStr,
    roundNumber,
    houseName: params.houseName,
    paceSec,
    tier,
    tierLabel,
    tierSummary,
    decimalOffsetMinutes,
    decimalFormula,
    roundDigitTime,
    roundDigitFormula,
    hourCycles,
    shortWindows,
  };
}

export interface OperatingWindowStatus {
  label: string;
  start: string;
  end: string;
  periodName: string;
  strategyNote: string;
  status: 'ativo' | 'proximo' | 'aguardando';
  minutesRemaining?: number;
  minutesUntilStart?: number;
}

export interface UpcomingStrongMinute {
  minuteLabel: string; // HH:MM
  targetTime: string; // HH:MM:00
  suffix: string;
  tier: 'ouro' | 'forte';
  secondsUntil: number;
  isInsideBestHour: boolean;
}

export interface OperatingScheduleSnapshot {
  nowTimeStr: string;
  currentHour: number;
  currentMinute: number;
  activeWindow: OperatingWindowStatus | null;
  nextWindow: OperatingWindowStatus;
  windows: OperatingWindowStatus[];
  upcomingStrongMinutes: UpcomingStrongMinute[];
  hourMinuteMap: Array<{
    minute: number;
    label: string;
    tier: 'ouro' | 'forte' | 'normal';
    isCurrent: boolean;
  }>;
}

const WINDOW_DESCRIPTIONS: Record<string, { periodName: string; strategyNote: string }> = {
  '06:00 às 09:00': {
    periodName: 'Manhã (Abertura Pagante)',
    strategyNote: 'Fluxo limpo de roxas 2x–5x e boas rosas nos finais 00, 05 e 09.',
  },
  '13:00 às 14:00': {
    periodName: 'Tarde (Pico Pós-Almoço)',
    strategyNote: 'Janela curta de alta liquidez · ideal para base 2x (+3m) e 5x (+10m).',
  },
  '16:30 às 17:40': {
    periodName: 'Fim de Tarde (Pico Principal)',
    strategyNote: 'Maior concentração de gatilhos decimais e repetição de rosas (Mód. 4).',
  },
  '20:00 às 21:00': {
    periodName: 'Noite (Alto Volume)',
    strategyNote: 'Ótima para ciclos de 10x (+20m) e sequências de 4+ roxas com quebra.',
  },
  '00:00 às 02:00': {
    periodName: 'Madrugada (Super Velas)',
    strategyNote: 'Tendência forte de velas altas (30x/50x/100x+) e Regra dos 13.',
  },
};

export function getOperatingScheduleSnapshot(nowTimeStr?: string): OperatingScheduleSnapshot {
  const timeStr = nowTimeStr || getCurrentTimeStr();
  const totalSec = parseTimeToSeconds(timeStr);
  const nowMinOfDay = Math.floor(totalSec / 60);
  const currentHour = Math.floor(nowMinOfDay / 60);
  const currentMinute = nowMinOfDay % 60;

  let activeWindow: OperatingWindowStatus | null = null;
  let bestNext: OperatingWindowStatus | null = null;
  let minWait = Infinity;

  const rawWindows = BEST_HOURS.map((h) => {
    const [sh, sm] = h.start.split(':').map(Number);
    const [eh, em] = h.end.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const isActive = nowMinOfDay >= startMin && nowMinOfDay <= endMin;
    const waitMin = isActive ? 0 : startMin > nowMinOfDay ? startMin - nowMinOfDay : 1440 - nowMinOfDay + startMin;
    const meta = WINDOW_DESCRIPTIONS[h.label] ?? {
      periodName: 'Janela de Pico',
      strategyNote: 'Operar nos minutos fortes 00 / 05 / 09.',
    };

    const item: OperatingWindowStatus = {
      label: h.label,
      start: h.start,
      end: h.end,
      periodName: meta.periodName,
      strategyNote: meta.strategyNote,
      status: isActive ? 'ativo' : 'aguardando',
      minutesRemaining: isActive ? Math.max(1, endMin - nowMinOfDay) : undefined,
      minutesUntilStart: isActive ? 0 : waitMin,
    };

    if (isActive) {
      activeWindow = item;
    } else if (waitMin < minWait) {
      minWait = waitMin;
      bestNext = item;
    }
    return item;
  });

  const windows = rawWindows.map((w) =>
    bestNext && w.label === bestNext.label && w.status !== 'ativo'
      ? { ...w, status: 'proximo' as const }
      : w
  );

  const nextWindow =
    windows.find((w) => w.status === 'proximo') ||
    windows[0];

  // Upcoming 6 strong minutes starting from next minute
  const upcomingStrongMinutes: UpcomingStrongMinute[] = [];
  for (let delta = 1; delta <= 60 && upcomingStrongMinutes.length < 6; delta++) {
    const candSec = (Math.floor(totalSec / 60) * 60 + delta * 60) % 86400;
    const h = Math.floor(candSec / 3600);
    const m = Math.floor((candSec % 3600) / 60);
    const mm = String(m).padStart(2, '0');
    const hh = String(h).padStart(2, '0');
    const isGold = STRONG_MINUTE_SUFFIXES.includes(mm);
    const isStrong = isGold || mm.endsWith('0') || mm.endsWith('5') || mm.endsWith('9');
    if (!isStrong) continue;

    const minLabel = `${hh}:${mm}`;
    const targetTime = `${minLabel}:00`;
    const secondsUntil = delta * 60 - (totalSec % 60);
    upcomingStrongMinutes.push({
      minuteLabel: minLabel,
      targetTime,
      suffix: mm,
      tier: isGold ? 'ouro' : 'forte',
      secondsUntil: Math.max(1, secondsUntil),
      isInsideBestHour: checkBestHour(targetTime).active,
    });
  }

  // 60-minute grid for the current hour
  const hourMinuteMap = Array.from({ length: 60 }, (_, minute) => {
    const mm = String(minute).padStart(2, '0');
    const isGold = STRONG_MINUTE_SUFFIXES.includes(mm);
    const isStrong = isGold || mm.endsWith('0') || mm.endsWith('5') || mm.endsWith('9');
    return {
      minute,
      label: mm,
      tier: isGold ? ('ouro' as const) : isStrong ? ('forte' as const) : ('normal' as const),
      isCurrent: minute === currentMinute,
    };
  });

  return {
    nowTimeStr: timeStr,
    currentHour,
    currentMinute,
    activeWindow,
    nextWindow,
    windows,
    upcomingStrongMinutes,
    hourMinuteMap,
  };
}

export interface GameStatistics {
  sampleCount: number;
  sourceLabel: string;
  azulCount: number;
  roxoCount: number;
  rosaCount: number;
  azulPct: number;
  roxoPct: number;
  rosaPct: number;
  payRatePct: number; // % >= 2.00x
  avgMultiplier: number;
  roxoAvg: number;
  maxMultiplier: number;
  roundsSinceLastRosa: number | null;
  topDecimals: Array<{ digit: number; count: number; pct: number }>;
  hourlyBreakdown: Array<{ hourLabel: string; total: number; payCount: number; rosaCount: number; payRatePct: number }>;
  logStats: {
    total: number;
    green: number;
    loss: number;
    pending: number;
    winRatePct: number;
  };
}

export function computeGameStatistics(params: {
  houseName: string;
  history: RoundEntry[];
  recentCandlesText: string;
  searchLog: SearchLogItem[];
}): GameStatistics {
  const quickVals = parseQuickCandlesText(params.recentCandlesText || '');
  const useQuick = quickVals.length > 0;
  const multipliers = useQuick
    ? quickVals
    : params.history.map((h) => h.multiplier);

  const sampleCount = multipliers.length;
  const azulCount = multipliers.filter((v) => v < 2.0).length;
  const roxoVals = multipliers.filter((v) => v >= 2.0 && v < 10.0);
  const roxoCount = roxoVals.length;
  const rosaCount = multipliers.filter((v) => v >= 10.0).length;

  const azulPct = sampleCount > 0 ? Math.round((azulCount / sampleCount) * 100) : 0;
  const roxoPct = sampleCount > 0 ? Math.round((roxoCount / sampleCount) * 100) : 0;
  const rosaPct = sampleCount > 0 ? Math.round((rosaCount / sampleCount) * 100) : 0;
  const payRatePct = sampleCount > 0 ? Math.round(((roxoCount + rosaCount) / sampleCount) * 100) : 0;

  const avgMultiplier =
    sampleCount > 0
      ? Math.round((multipliers.reduce((a, b) => a + b, 0) / sampleCount) * 100) / 100
      : 0;
  const roxoAvg =
    roxoVals.length > 0
      ? Math.round((roxoVals.reduce((a, b) => a + b, 0) / roxoVals.length) * 100) / 100
      : 0;
  const maxMultiplier = sampleCount > 0 ? Math.max(...multipliers) : 0;

  const firstRosaIdx = multipliers.findIndex((v) => v >= 10.0);
  const roundsSinceLastRosa =
    sampleCount === 0 ? null : firstRosaIdx >= 0 ? firstRosaIdx : sampleCount;

  const decCounts = new Map<number, number>();
  for (const val of multipliers) {
    const d = Number(val.toFixed(2).slice(-1));
    decCounts.set(d, (decCounts.get(d) ?? 0) + 1);
  }
  const topDecimals = Array.from(decCounts.entries())
    .map(([digit, count]) => ({
      digit,
      count,
      pct: sampleCount > 0 ? Math.round((count / sampleCount) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.digit - b.digit)
    .slice(0, 4);

  // Hourly breakdown from saved timestamped history
  const hourMap = new Map<string, { total: number; payCount: number; rosaCount: number }>();
  for (const entry of params.history) {
    const hh = entry.timeStr.slice(0, 2);
    if (!/^\d{2}$/.test(hh)) continue;
    const key = `${hh}h`;
    const cur = hourMap.get(key) ?? { total: 0, payCount: 0, rosaCount: 0 };
    cur.total += 1;
    if (entry.multiplier >= 2.0) cur.payCount += 1;
    if (entry.multiplier >= 10.0) cur.rosaCount += 1;
    hourMap.set(key, cur);
  }
  const hourlyBreakdown = Array.from(hourMap.entries())
    .map(([hourLabel, stats]) => ({
      hourLabel,
      total: stats.total,
      payCount: stats.payCount,
      rosaCount: stats.rosaCount,
      payRatePct: stats.total > 0 ? Math.round((stats.payCount / stats.total) * 100) : 0,
    }))
    .sort((a, b) => b.payRatePct - a.payRatePct || b.total - a.total)
    .slice(0, 6);

  const green = params.searchLog.filter((l) => l.result === 'green').length;
  const loss = params.searchLog.filter((l) => l.result === 'loss').length;
  const pending = params.searchLog.filter((l) => !l.result || l.result === 'pending').length;
  const resolved = green + loss;
  const winRatePct = resolved > 0 ? Math.round((green / resolved) * 100) : 0;

  return {
    sampleCount,
    sourceLabel: useQuick
      ? `Velas da Mesa ao Vivo (${sampleCount})`
      : `Histórico Salvo de ${params.houseName} (${sampleCount})`,
    azulCount,
    roxoCount,
    rosaCount,
    azulPct,
    roxoPct,
    rosaPct,
    payRatePct,
    avgMultiplier,
    roxoAvg,
    maxMultiplier,
    roundsSinceLastRosa,
    topDecimals,
    hourlyBreakdown,
    logStats: {
      total: params.searchLog.length,
      green,
      loss,
      pending,
      winRatePct,
    },
  };
}

