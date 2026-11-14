/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FutureSignal, CalculationResult, TriggerCandle } from '../types';
import { TRIGGER_CANDLES_DATABASE } from './triggerList';

// Helper to pad single digits
export function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

// Parse HH:MM or HH:MM:SS
export function parseTime(timeStr: string): { h: number; m: number; s: number } {
  const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10) || 0);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts.length > 2 ? parts[2] : 0;
  return { h: h % 24, m: m % 60, s: s % 60 };
}

// Add minutes to time string, returning HH:MM and window
export function addMinutes(
  timeStr: string,
  minsToAdd: number,
  keepSeconds = false
): { time: string; window: string; minuteVal: number } {
  const { h, m, s } = parseTime(timeStr);
  const totalSeconds = h * 3600 + (m + minsToAdd) * 60 + (keepSeconds ? s : 0);
  const newH = Math.floor(totalSeconds / 3600) % 24;
  const newM = Math.floor((totalSeconds % 3600) / 60) % 60;
  const newS = totalSeconds % 60;

  const targetTime = keepSeconds
    ? `${pad(newH)}:${pad(newM)}:${pad(newS)}`
    : `${pad(newH)}:${pad(newM)}`;

  const windowTime = `±1 min (${pad(newH)}:${pad(newM)})`;

  return { time: targetTime, window: windowTime, minuteVal: newM };
}

// Check if minute ends in strong digits (0, 5, 9) - Módulo 4 pág 50
export function isStrongMinute(min: number): boolean {
  const s = pad(min);
  return s.endsWith('0') || s.endsWith('5') || s.endsWith('9');
}

// Check peak hours (06-09, 13-14, 16:30-17:40, 20-21, 00-02) - Módulo 4 pág 50
export function checkPeakHour(h: number, m: number): boolean {
  const val = h + m / 60;
  return (
    (val >= 6 && val <= 9) ||
    (val >= 13 && val <= 14) ||
    (val >= 16.5 && val <= 17.67) ||
    (val >= 20 && val <= 21) ||
    (val >= 0 && val <= 2)
  );
}

/**
 * Main calculation engine generating all predictions from the 5 PDF modules
 */
export function calculateFutureSignals(
  roundNumber: string,
  multiplier: number,
  timeStr: string,
  selectedHouse = 'Qualquer Casa (Universal)'
): CalculationResult {
  const signals: FutureSignal[] = [];
  const specialNotes: string[] = [];

  const cleanRound = roundNumber.trim().replace(/\D/g, '');
  const cleanTime = timeStr.trim() || '14:00';
  const { h, m } = parseTime(cleanTime);
  const isPeak = checkPeakHour(h, m);

  // Check matching trigger candle
  const matched = TRIGGER_CANDLES_DATABASE.find(
    (t) => Math.abs(t.candle - multiplier) < 0.005
  );

  if (matched) {
    specialNotes.push(`🔥 Gatilho Detectado: ${matched.candle.toFixed(2)}x -> ${matched.description}`);
  }

  // Detect 1.00x Reset Candle (Módulo 4 pág 29 & Módulo 5 pág 13)
  if (multiplier === 1.0) {
    specialNotes.push(
      '⚡ VELA 1.00X (RESET): O algoritmo reiniciou o ciclo. Paga rosa em até 10 casas (5ª casa é a mais forte).'
    );
  }

  // Detect +30x high candle for Regra dos 13 (Módulo 4 pág 48)
  if (multiplier >= 30.0) {
    specialNotes.push(
      '👑 REGRA DOS 13 ATIVA (+30x): 95% de chance de pagar vela alta nas casas ÍMPARES (1, 3, 5, 7, 9, 11, 13).'
    );
  }

  // Multiplier string parts
  const multStr = multiplier.toFixed(2);
  const [intPart, decPart] = multStr.split('.');
  const dec1 = parseInt(decPart[0], 10) || 0;
  const dec2 = parseInt(decPart[1], 10) || 0;

  // 1. REGRA DO DÍGITO DA RODADA (Módulo 5 pág 2 & Módulo 2 pág 21)
  if (cleanRound.length > 0) {
    const lastDigit = parseInt(cleanRound.slice(-1), 10);
    const addedMin = lastDigit === 0 ? 10 : lastDigit;
    const calc = addMinutes(cleanTime, addedMin);

    signals.push({
      id: 'round-digit',
      type: multiplier >= 10 ? 'rosa' : 'roxa',
      badge: multiplier >= 10 ? '🌸 Rosa' : '🟣 Roxa',
      targetTime: calc.time,
      window: calc.window,
      targetMultiplier: multiplier >= 10 ? '10.00x+ (Rosa)' : '2.00x+ (Roxa)',
      ruleName: 'Dígito da Rodada (Módulo 5 pág 2)',
      calculationDetails: `Final da rodada #${cleanRound.slice(-1)} ➔ Somar +${addedMin} min à hora ${cleanTime}`,
      recommendedHouses: ['1ª casa', '2ª casa', '3ª casa'],
      protection: '1.49x Obrigatória',
      confidence: 'maxima',
      hotMinute: isStrongMinute(calc.minuteVal),
    });
  }

  // 2. REGRA DA SUBTRAÇÃO DE VELA (Módulo 5 pág 4)
  // |B - A| + |D - C|
  let intDiff = 0;
  if (intPart.length >= 2) {
    const d1 = parseInt(intPart[intPart.length - 2], 10);
    const d2 = parseInt(intPart[intPart.length - 1], 10);
    intDiff = Math.abs(d2 - d1);
  } else {
    intDiff = parseInt(intPart[0], 10) || 1;
  }
  const decDiff = Math.abs(dec2 - dec1);
  let subTotalMin = intDiff + decDiff;
  if (subTotalMin <= 0) subTotalMin = 3;
  if (subTotalMin > 25) subTotalMin = subTotalMin % 15 || 5;

  const calcSub = addMinutes(cleanTime, subTotalMin);
  signals.push({
    id: 'subtraction-rule',
    type: 'rosa',
    badge: '🌸 Rosa',
    targetTime: calcSub.time,
    window: calcSub.window,
    targetMultiplier: '10.00x a 30.00x (Rosa)',
    ruleName: 'Subtração de Vela (Módulo 5 pág 4)',
    calculationDetails: `Diferença dos dígitos (${intDiff} + ${decDiff}) = +${subTotalMin} min à frente`,
    recommendedHouses: ['Casas 1 a 5 no minuto'],
    protection: '1.49x Obrigatória',
    confidence: 'maxima',
    hotMinute: isStrongMinute(calcSub.minuteVal),
  });

  // 3. REGRA DO 1º DÍGITO APÓS O PONTO (Módulo 5 pág 5 & pág 34)
  const firstDecMin = dec1 === 0 ? 5 : dec1;
  const calcDec = addMinutes(cleanTime, firstDecMin);
  const isSuperFromDec = multiplier >= 7.0 && (dec1 === 3 || dec1 === 7 || dec1 === 9);

  signals.push({
    id: 'first-decimal-rule',
    type: isSuperFromDec ? 'super' : multiplier >= 10 ? 'rosa' : 'roxa',
    badge: isSuperFromDec ? '👑 Super 100x+' : multiplier >= 10 ? '🌸 Rosa' : '🟣 Roxa',
    targetTime: calcDec.time,
    window: calcDec.window,
    targetMultiplier: isSuperFromDec ? '50.00x a 100x+' : multiplier >= 10 ? '10.00x+' : '2.00x a 5.00x',
    ruleName: '1º Dígito Após Ponto (Módulo 5 pág 5/34)',
    calculationDetails: `1º dígito decimal é [${dec1}]. Somar +${firstDecMin} min na hora atual`,
    recommendedHouses: isSuperFromDec ? ['1ª, 3ª, 5ª casa'] : ['1ª e 2ª casa'],
    protection: '1.49x Obrigatória',
    confidence: isSuperFromDec ? 'maxima' : 'alta',
    hotMinute: isStrongMinute(calcDec.minuteVal),
  });

  // 4. SUBTRAÇÃO ROSA + MINUTO (Módulo 3 pág 7)
  const rosaSubMin = Math.abs((parseInt(intPart.slice(-1), 10) || 1) - (parseInt(intPart[0], 10) || 1)) + decDiff;
  if (rosaSubMin > 0) {
    const calcRosaSub = addMinutes(cleanTime, rosaSubMin + 2);
    signals.push({
      id: 'rosa-sub-min',
      type: 'rosa',
      badge: '🌸 Rosa',
      targetTime: calcRosaSub.time,
      window: calcRosaSub.window,
      targetMultiplier: '10.00x a 25.00x',
      ruleName: 'Subtração da Rosa + Minuto (Módulo 3 pág 7)',
      calculationDetails: `Soma dos fatores decimais (+${rosaSubMin + 2} min) para o próximo ciclo de Rosa`,
      recommendedHouses: ['2ª a 4ª casa no minuto'],
      protection: '1.49x Obrigatória',
      confidence: 'alta',
      hotMinute: isStrongMinute(calcRosaSub.minuteVal),
    });
  }

  // 5. REGRA DOS 3 MINUTOS PARA 2X (Módulo 4 pág 12)
  if (multiplier >= 1.9 && multiplier <= 3.2) {
    const calc3m = addMinutes(cleanTime, 3);
    signals.push({
      id: 'regra-3min-2x',
      type: 'roxa',
      badge: '🟣 Roxa 2X',
      targetTime: calc3m.time,
      window: calc3m.window,
      targetMultiplier: '2.00x+ (Garantida)',
      ruleName: 'Regra dos 3 Minutos para 2X (Módulo 4 pág 12)',
      calculationDetails: `Vela base ${multiplier.toFixed(2)}x ➔ somar exatos +3 min para puxar 2.00x+`,
      recommendedHouses: ['Entrar no minuto exato', 'Até G1'],
      protection: '1.49x Obrigatória',
      confidence: 'maxima',
      hotMinute: isStrongMinute(calc3m.minuteVal),
    });
  }

  // 6. REGRA DOS 10 MINUTOS PARA 5X (Módulo 4 pág 19)
  if (multiplier >= 9.5) {
    const calc10m = addMinutes(cleanTime, 10);
    signals.push({
      id: 'regra-10min-5x',
      type: 'rosa',
      badge: '🌸 Rosa 5x/10x',
      targetTime: calc10m.time,
      window: calc10m.window,
      targetMultiplier: '5.00x a 10.00x',
      ruleName: 'Regra dos 10 Minutos para 5X (Módulo 4 pág 19)',
      calculationDetails: `Após vela ${multiplier.toFixed(2)}x (+10x) ➔ Somar +10 min para buscar 5x a 10x`,
      recommendedHouses: ['Entrar 20s antes', '3 entradas no minuto'],
      protection: '1.49x Obrigatória',
      confidence: 'alta',
      hotMinute: isStrongMinute(calc10m.minuteVal),
    });
  }

  // 7. REGRA DOS 20 MINUTOS PARA 10X (Módulo 4 pág 23)
  if (multiplier >= 20.0) {
    const calc20m = addMinutes(cleanTime, 20);
    signals.push({
      id: 'regra-20min-10x',
      type: 'rosa',
      badge: '🌸 Rosa Forte 10x+',
      targetTime: calc20m.time,
      window: calc20m.window,
      targetMultiplier: '10.00x a 25.00x',
      ruleName: 'Regra dos 20 Minutos para 10X (Módulo 4 pág 23)',
      calculationDetails: `Após vela ${multiplier.toFixed(2)}x (+20x) ➔ Somar +20 min para ciclo de Rosa Alta`,
      recommendedHouses: ['Entrar 30s antes', '3 a 4 entradas'],
      protection: '1.49x Obrigatória',
      confidence: 'maxima',
      hotMinute: isStrongMinute(calc20m.minuteVal),
    });
  }

  // 8. REGRA DOS 30 MINUTOS PARA 50X / 100X+ SUPER ALTAS (Módulo 4 pág 33-41)
  if (multiplier >= 40.0) {
    // Padrão Positivo: +30 min
    const calc30m = addMinutes(cleanTime, 30);
    signals.push({
      id: 'super-30min-padrao-positivo',
      type: 'super',
      badge: '👑 Super 100x+ (Positiva)',
      targetTime: calc30m.time,
      window: calc30m.window,
      targetMultiplier: '50.00x a 100.00x+ (Super Alta)',
      ruleName: 'Ciclo Positivo 100x+ (+30 min) (Módulo 4 pág 33)',
      calculationDetails: `Vela de pico ${multiplier.toFixed(2)}x ➔ Ciclo de repetição principal em exatos +30 min`,
      recommendedHouses: ['Casas 1, 3 e 5 no minuto', 'Mão 2 livre até 100x'],
      protection: '1.49x Obrigatória na Mão 1',
      confidence: 'maxima',
      hotMinute: isStrongMinute(calc30m.minuteVal),
    });

    // Padrão Negativo / Delay: +32 min e +35 min
    const calc32m = addMinutes(cleanTime, 32);
    signals.push({
      id: 'super-delay-32m',
      type: 'super',
      badge: '👑 Super 100x+ (Delay)',
      targetTime: calc32m.time,
      window: '±1 min (32m a 35m)',
      targetMultiplier: '50.00x a 100.00x+',
      ruleName: 'Delay Negativo Super Alta (+32m/+35m) (Módulo 4 pág 35)',
      calculationDetails: 'Caso a plataforma atrase a entrega de 30m, ela busca o ciclo em +32 a +35 minutos',
      recommendedHouses: ['Casas ímpares', '4 a 5 tiros protegidos'],
      protection: '1.49x Obrigatória',
      confidence: 'alta',
      hotMinute: isStrongMinute(calc32m.minuteVal),
    });
  } else {
    // Se a vela atual for normal (< 40x), calcula a próxima Super Alta teórica baseada no ciclo de 30 min
    const calcSuper = addMinutes(cleanTime, 30);
    signals.push({
      id: 'super-future-cycle',
      type: 'super',
      badge: '👑 Super Alta 50x/100x',
      targetTime: calcSuper.time,
      window: calcSuper.window,
      targetMultiplier: '50.00x a 100.00x+',
      ruleName: 'Ciclo Regular de Super Altas (+30m)',
      calculationDetails: 'Janela algorítmica para repetição de velas de 3 dígitos (50x - 100x+)',
      recommendedHouses: ['Casas 1, 3, 5, 7'],
      protection: '1.49x Obrigatória',
      confidence: 'alta',
      hotMinute: isStrongMinute(calcSuper.minuteVal),
    });
  }

  // Ordenar sinais cronologicamente pelo horário
  signals.sort((a, b) => a.targetTime.localeCompare(b.targetTime));

  return {
    signals,
    isPeakHour: isPeak,
    peakHourNote: isPeak
      ? 'Mercado Quente / Pagador (Pico Estatístico)'
      : 'Mercado Normal (Siga a Proteção 1.49x)',
    matchedTrigger: matched,
    specialNotes,
  };
}

/**
 * Format full signals as Telegram / WhatsApp VIP group broadcast
 */
export function formatSignalsForClipboard(results: CalculationResult): string {
  const supers = results.signals.filter((s) => s.type === 'super');
  const pinks = results.signals.filter((s) => s.type === 'rosa');
  const purples = results.signals.filter((s) => s.type === 'roxa');

  let text = `✈️ ══════ 【 RADAR AVIATOR VIP 】 ══════ ✈️\n\n`;
  text += `🛡️ GESTÃO OBRIGATÓRIA: Proteção em 1.49x / 1.50x\n`;
  text += `🎯 PLATAFORMA: Universal (Qualquer Casa)\n`;
  text += `⚡ MERCADO: ${results.isPeakHour ? '🔥 Horário Pagador Quente' : 'Normal'}\n`;
  text += `════════════════════════════════\n\n`;

  if (supers.length > 0) {
    text += `👑 🚀 【 SUPER ALTAS 50X A 100X+ 】\n`;
    supers.forEach((s) => {
      text += `➜ ⏰ ${s.targetTime} (${s.window})\n`;
      text += `   Alvo: ${s.targetMultiplier} | Regra: ${s.ruleName}\n`;
      text += `   Casas: ${s.recommendedHouses.join(', ')}\n\n`;
    });
  }

  if (pinks.length > 0) {
    text += `🌸 💎 【 VELAS ROSAS 10X A 49X 】\n`;
    pinks.forEach((s) => {
      text += `➜ ⏰ ${s.targetTime} (${s.window})\n`;
      text += `   Alvo: ${s.targetMultiplier} | Regra: ${s.ruleName}\n\n`;
    });
  }

  if (purples.length > 0) {
    text += `🟣 ⚡ 【 VELAS ROXAS 2.00X A 5.00X 】\n`;
    purples.forEach((s) => {
      text += `➜ ⏰ ${s.targetTime} -> ${s.targetMultiplier} (${s.ruleName})\n`;
    });
    text += `\n`;
  }

  text += `📌 REGRAS DE OURO DO PAI DO AVIATOR:\n`;
  text += `1. Saída 1: 1.49x (Cobre a aposta total)\n`;
  text += `2. Saída 2: Deixe buscar a vela Rosa ou 100x sem risco!\n`;
  text += `3. Regra dos 13: Jogue nas casas ímpares (1, 3, 5, 7, 9, 11, 13)\n`;
  text += `4. Bateu a meta, saque seu lucro!\n`;
  text += `════════════════════════════════\n`;
  text += `Gerado por Radar Aviator Pro PWA`;

  return text;
}

/**
 * Format just plain minutes/hours list for rapid reference
 */
export function formatMinutesOnly(results: CalculationResult): string {
  const times = results.signals.map((s) => `${s.targetTime} (${s.badge})`);
  return `⏰ Horários Previstos:\n${times.join(' | ')}`;
}
