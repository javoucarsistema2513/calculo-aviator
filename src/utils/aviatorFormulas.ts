import { AviatorCandle, CandleColor, MinutagemProjection, MinutagemStats } from '../types/aviator';

export function getCandleColor(multiplier: number): CandleColor {
  if (multiplier >= 100.0) return 'gold';
  if (multiplier >= 10.0) return 'pink';
  if (multiplier >= 2.0) return 'purple';
  return 'blue';
}

export function formatTime24(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatMinuteOnly(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function analyzeMinutagem(candles: AviatorCandle[], currentTime: Date = new Date()): {
  stats: MinutagemStats;
  projections: MinutagemProjection[];
} {
  const total = candles.length;
  let blues = 0;
  let purples = 0;
  let pinks = 0;

  candles.forEach((c) => {
    if (c.multiplier >= 10.0) pinks++;
    else if (c.multiplier >= 2.0) purples++;
    else blues++;
  });

  // Pink candles sorted by timestamp ascending
  const pinkCandles = candles
    .filter((c) => c.multiplier >= 10.0)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Intervals between consecutive pinks in minutes
  const intervals: number[] = [];
  const endingsFreq: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) endingsFreq[i] = 0;

  for (let i = 0; i < pinkCandles.length; i++) {
    const minDigit = pinkCandles[i].timestamp.getMinutes() % 10;
    endingsFreq[minDigit] = (endingsFreq[minDigit] || 0) + 1;

    if (i > 0) {
      const diffMs = pinkCandles[i].timestamp.getTime() - pinkCandles[i - 1].timestamp.getTime();
      const diffMins = Math.max(1, Math.round((diffMs / 60000) * 10) / 10);
      intervals.push(diffMins);
    }
  }

  const avgInterval =
    intervals.length > 0
      ? Math.round((intervals.reduce((a, b) => a + b, 0) / intervals.length) * 10) / 10
      : 5.0; // fallback standard 5 mins
  const minInterval = intervals.length > 0 ? Math.min(...intervals) : 3.0;
  const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 10.0;

  // Last pink info
  const lastPink = pinkCandles.length > 0 ? pinkCandles[pinkCandles.length - 1] : null;

  // Consecutive blues currently (from latest backwards)
  let consecutiveBlues = 0;
  for (let i = candles.length - 1; i >= 0; i--) {
    if (candles[i].multiplier < 2.0) {
      consecutiveBlues++;
    } else {
      break;
    }
  }

  // Market state analysis
  let marketState: 'Pagador' | 'Neutro' | 'Recolhedor / Frio' = 'Neutro';
  if (candles.length >= 10) {
    const recent = candles.slice(-10);
    const recentPinks = recent.filter((c) => c.multiplier >= 10).length;
    const recentBlues = recent.filter((c) => c.multiplier < 2.0).length;
    if (recentPinks >= 2 || recentBlues <= 3) {
      marketState = 'Pagador';
    } else if (recentBlues >= 7) {
      marketState = 'Recolhedor / Frio';
    }
  }

  const stats: MinutagemStats = {
    totalCandles: total,
    pinkCandlesCount: pinks,
    purpleCandlesCount: purples,
    blueCandlesCount: blues,
    lastPinkMinute: lastPink ? lastPink.minuteString : null,
    lastPinkTime: lastPink ? lastPink.timeString : null,
    lastPinkMultiplier: lastPink ? lastPink.multiplier : null,
    averagePinkIntervalMin: avgInterval,
    minIntervalMin: minInterval,
    maxIntervalMin: maxInterval,
    pinkEndingsFrequency: endingsFreq,
    currentConsecutiveBlues: consecutiveBlues,
    marketState,
  };

  // Generate projections based on the last pink and current time dynamically
  const projections: MinutagemProjection[] = [];
  const nowMs = currentTime.getTime();
  const currentMinuteStr = formatMinuteOnly(currentTime);

  // Frequency of pink endings to find hot minutes
  const topEndings = Object.entries(endingsFreq)
    .map(([digit, count]) => ({ digit: parseInt(digit, 10), count }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  const avgDelta = Math.max(3, Math.round(avgInterval));
  const minDelta = Math.max(2, Math.round(minInterval));

  // Collect candidate target dates
  const candidates: {
    date: Date;
    reason: string;
    priority: number;
  } = [] as any;

  const candidateList: Array<{
    date: Date;
    reason: string;
    priority: number;
  }> = [];

  if (lastPink) {
    const lastPinkMs = lastPink.timestamp.getTime();

    // 1. Check initial standard cycle from last pink
    const standardDeltas = [
      { d: minDelta, reason: `Ciclo Rápido (+${minDelta} min da última rosa)`, p: 1 },
      { d: avgDelta, reason: `Média Histórica (+${avgDelta} min)`, p: 1 },
      { d: avgDelta + 3, reason: `Gatilho de Espelhamento (+${avgDelta + 3} min)`, p: 2 },
      { d: avgDelta + 6, reason: `Ciclo Longo / Proteção (+${avgDelta + 6} min)`, p: 3 },
    ];

    standardDeltas.forEach(({ d, reason, p }) => {
      const targetDate = new Date(lastPinkMs + d * 60000);
      targetDate.setSeconds(0, 0);
      // Valid if still in the future or active in current minute
      if (targetDate.getTime() + 59999 >= nowMs) {
        candidateList.push({ date: targetDate, reason, priority: p });
      }
    });

    // 2. If standard deltas have passed (e.g. rosa atrasada), project upcoming multiples of avgInterval
    let k = 1;
    while (candidateList.length < 5 && k <= 15) {
      k++;
      const targetDate = new Date(lastPinkMs + k * avgDelta * 60000);
      targetDate.setSeconds(0, 0);
      if (targetDate.getTime() + 59999 >= nowMs) {
        const deltaFromPink = Math.round((targetDate.getTime() - lastPinkMs) / 60000);
        candidateList.push({
          date: targetDate,
          reason: `Novo Ciclo Calculado (+${deltaFromPink} min da última rosa)`,
          priority: 2,
        });
      }
    }
  } else {
    // No pink candle in history yet: project forward from current time
    [2, 5, 8, 12].forEach((m, idx) => {
      const targetDate = new Date(nowMs + m * 60000);
      targetDate.setSeconds(0, 0);
      candidateList.push({
        date: targetDate,
        reason: idx === 0 ? 'Ciclo Imediato de Entrada' : `Ciclo Padrão (+${m} min)`,
        priority: idx === 0 ? 1 : 2,
      });
    });
  }

  // 3. Add Hot Ending Digit candidate if available
  if (topEndings.length > 0) {
    const hotDigit = topEndings[0].digit;
    // Find next minute with this ending digit
    for (let offsetMin = 0; offsetMin <= 12; offsetMin++) {
      const testDate = new Date(nowMs + offsetMin * 60000);
      if (testDate.getMinutes() % 10 === hotDigit) {
        testDate.setSeconds(0, 0);
        if (testDate.getTime() + 59999 >= nowMs) {
          candidateList.push({
            date: testDate,
            reason: `Final Quente :X${hotDigit} (${topEndings[0].count}x histórico)`,
            priority: 1,
          });
          break;
        }
      }
    }
  }

  // 4. Consecutive blue recovery trigger: if 4+ blues in a row, next minute is high alert
  if (consecutiveBlues >= 4) {
    const triggerDate = new Date(nowMs + 60000); // next minute
    triggerDate.setSeconds(0, 0);
    if (triggerDate.getTime() + 59999 >= nowMs) {
      candidateList.push({
        date: triggerDate,
        reason: `Alerta de Quebra (${consecutiveBlues} azuis seguidas)`,
        priority: 1,
      });
    }
  }

  // Deduplicate by target minute string and filter out expired targets
  const seenMinutes = new Set<string>();
  const validCandidates: Array<{ date: Date; reason: string; priority: number }> = [];

  // Sort candidates chronologically
  candidateList.sort((a, b) => a.date.getTime() - b.date.getTime());

  candidateList.forEach((cand) => {
    const minStr = formatMinuteOnly(cand.date);
    if (!seenMinutes.has(minStr) && cand.date.getTime() + 59999 >= nowMs) {
      seenMinutes.add(minStr);
      validCandidates.push(cand);
    }
  });

  // Guarantee at least 4 future projections by extrapolating from the last candidate
  while (validCandidates.length < 4) {
    const lastDate = validCandidates.length > 0
      ? validCandidates[validCandidates.length - 1].date
      : new Date(nowMs);
    const nextDate = new Date(lastDate.getTime() + avgDelta * 60000);
    nextDate.setSeconds(0, 0);
    const minStr = formatMinuteOnly(nextDate);
    if (!seenMinutes.has(minStr)) {
      seenMinutes.add(minStr);
      validCandidates.push({
        date: nextDate,
        reason: `Próximo Ciclo (+${avgDelta} min)`,
        priority: 2,
      });
    }
  }

  // Take top 4 projections and format
  validCandidates.slice(0, 4).forEach((item, index) => {
    const targetMinute = formatMinuteOnly(item.date);
    const isActiveNow = targetMinute === currentMinuteStr;
    const diffSecs = Math.round((item.date.getTime() - nowMs) / 1000);

    const secondsRemaining = isActiveNow ? 0 : Math.max(0, diffSecs);

    let confidence: 'Alta' | 'Média' | 'Normal' = 'Normal';
    if (isActiveNow || item.priority === 1 || (index === 0 && consecutiveBlues >= 3)) {
      confidence = 'Alta';
    } else if (index <= 1 || item.priority === 2) {
      confidence = 'Média';
    }

    const deltaMinutes = lastPink
      ? Math.max(1, Math.round((item.date.getTime() - lastPink.timestamp.getTime()) / 60000))
      : Math.max(1, Math.round((item.date.getTime() - nowMs) / 60000));

    projections.push({
      targetMinute,
      deltaMinutes,
      secondsRemaining,
      confidence,
      reason: item.reason,
    });
  });

  return { stats, projections };
}

// Initial realistic dataset for instant testing
export function getInitialDemoCandles(): AviatorCandle[] {
  const now = new Date();
  const list: AviatorCandle[] = [];

  // Multipliers array with simulated past rounds
  const presets = [
    { mult: 1.22, minAgo: 24, sec: 10 },
    { mult: 2.45, minAgo: 23, sec: 40 },
    { mult: 1.15, minAgo: 22, sec: 15 },
    { mult: 14.80, minAgo: 21, sec: 0 }, // PINK (21 min ago)
    { mult: 1.05, minAgo: 20, sec: 20 },
    { mult: 3.10, minAgo: 19, sec: 35 },
    { mult: 1.88, minAgo: 18, sec: 50 },
    { mult: 1.34, minAgo: 17, sec: 25 },
    { mult: 26.50, minAgo: 16, sec: 0 }, // PINK (16 min ago, delta 5 min)
    { mult: 4.20, minAgo: 15, sec: 15 },
    { mult: 1.95, minAgo: 14, sec: 40 },
    { mult: 2.12, minAgo: 13, sec: 10 },
    { mult: 1.40, minAgo: 12, sec: 35 },
    { mult: 18.25, minAgo: 11, sec: 0 }, // PINK (11 min ago, delta 5 min)
    { mult: 1.10, minAgo: 10, sec: 18 },
    { mult: 1.72, minAgo: 9, sec: 45 },
    { mult: 3.80, minAgo: 8, sec: 20 },
    { mult: 1.25, minAgo: 7, sec: 50 },
    { mult: 42.10, minAgo: 6, sec: 0 }, // PINK (6 min ago, delta 5 min)
    { mult: 1.30, minAgo: 4, sec: 30 },
    { mult: 2.05, minAgo: 3, sec: 15 },
    { mult: 1.48, minAgo: 1, sec: 45 },
  ];

  presets.forEach((p, idx) => {
    const d = new Date(now.getTime() - p.minAgo * 60000 + p.sec * 1000);
    list.push({
      id: `candle-${idx}-${d.getTime()}`,
      multiplier: p.mult,
      timestamp: d,
      minuteString: formatMinuteOnly(d),
      timeString: formatTime24(d),
      isPink: p.mult >= 10.0,
    });
  });

  return list;
}
