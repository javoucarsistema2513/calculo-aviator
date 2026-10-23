/**
 * Aviator Engine - Regras, Cálculos e Padrões da Mentoria "Pai do Aviator"
 * Baseado nos Módulos I a V e Treinamento Avançado.
 */

export type CandleColor = 'blue' | 'purple' | 'pink';

export interface AviatorCandle {
  id: string;
  value: number;
  color: CandleColor;
  timestamp?: string; // HH:MM:SS ou HH:MM
  roundId?: string; // e.g. "1809347"
  note?: string;
}

export interface PatternSignal {
  id: string;
  title: string;
  description: string;
  targetMultiplier: string; // e.g. "2.00x+", "5.00x+", "10.00x+ (Rosa)"
  assertiveness: number; // 75 a 98%
  level: 'CRITICAL_ALERT' | 'HIGH' | 'MEDIUM';
  strategyName: string;
  actionRecommendation: string;
  protectionAdvice: string;
  maxEntries: number; // e.g. 1, 2, 3, ou 5 entradas fixas
  upcomingTargetHouses?: number[]; // Casas pós-gatilho (ex: [1, 4, 5, 7, 10])
  estimatedMinutes?: number;
}

export interface CycleStatus {
  type: 'PAGUE' | 'RECOLHE' | 'FALSO_PAGUE';
  label: string;
  description: string;
  bluePercent: number;
  purplePercent: number;
  pinkPercent: number;
  isSafeToTrade: boolean;
  recommendation: string;
}

export function getCandleColor(val: number): CandleColor {
  if (val < 2.00) return 'blue';
  if (val < 10.00) return 'purple';
  return 'pink';
}

/**
 * Analisa os ciclos do gráfico:
 * Pague: Mais roxas e rosas, apenas 1 a 2 azuis na coluna. (Ideal!)
 * Recolhe: Sequências longas de azuis, > 60% azuis. (Perigo, ficar de fora!)
 * Falso Pague: Padrão indefinido/aleatório.
 */
export function analyzeCycle(candles: AviatorCandle[]): CycleStatus {
  if (candles.length === 0) {
    return {
      type: 'FALSO_PAGUE',
      label: 'Sem Dados',
      description: 'Insira velas para calibrar a leitura de ciclo.',
      bluePercent: 0,
      purplePercent: 0,
      pinkPercent: 0,
      isSafeToTrade: false,
      recommendation: 'Aguarde ou carregue histórico.'
    };
  }

  const sample = candles.slice(-24); // Últimas 24 velas
  const total = sample.length;
  const blues = sample.filter(c => c.color === 'blue').length;
  const purples = sample.filter(c => c.color === 'purple').length;
  const pinks = sample.filter(c => c.color === 'pink').length;

  const bluePercent = Math.round((blues / total) * 100);
  const purplePercent = Math.round((purples / total) * 100);
  const pinkPercent = Math.round((pinks / total) * 100);

  // Check recent streak
  const last5 = candles.slice(-5);
  const recentBlueCount = last5.filter(c => c.color === 'blue').length;

  if (bluePercent <= 45 && (purplePercent + pinkPercent >= 55)) {
    return {
      type: 'PAGUE',
      label: 'Ciclo Pague (Excelente)',
      description: 'Predomínio de velas roxas e rosas. Plataforma respeitando padrões e liberando multiplicadores.',
      bluePercent,
      purplePercent,
      pinkPercent,
      isSafeToTrade: true,
      recommendation: 'Momento excelente para entradas com proteção no 1.49x e alvo no 2x/5x/10x.'
    };
  } else if (bluePercent >= 65 || recentBlueCount >= 4) {
    return {
      type: 'RECOLHE',
      label: 'Ciclo Recolhe (Cuidado)',
      description: 'Plataforma em retenção/recuperação de capital com excesso de velas azuis. Quem comanda é o azul.',
      bluePercent,
      purplePercent,
      pinkPercent,
      isSafeToTrade: false,
      recommendation: 'NÃO arrisque seu capital agora. Espere a quebra da sequência ou o gráfico voltar a pagar.'
    };
  } else {
    return {
      type: 'FALSO_PAGUE',
      label: 'Ciclo Falso Pague (Neutro)',
      description: 'Gráfico oscilando sem tendência consistente. Padrões podem falhar com maior frequência.',
      bluePercent,
      purplePercent,
      pinkPercent,
      isSafeToTrade: false,
      recommendation: 'Entre apenas em gatilhos de ouro confirmados (1.00x reset, 1.37x ou 1.88x) com mão baixa.'
    };
  }
}

/**
 * Motor de detecção de padrões e sinais assertivos
 */
export function detectPatterns(candles: AviatorCandle[]): PatternSignal[] {
  const signals: PatternSignal[] = [];
  if (candles.length < 2) return signals;

  const last = candles[candles.length - 1];
  const last2 = candles.slice(-2);
  const last3 = candles.slice(-3);
  const last5 = candles.slice(-5);
  const last6 = candles.slice(-6);

  // 1. Padrão Super Gatilho 1.00x Reset (Módulo I, IV, V)
  if (last.value === 1.00) {
    // Checar se são 2 velas 1.00x consecutivas
    const isDoubleReset = last2.length === 2 && last2[0].value === 1.00 && last2[1].value === 1.00;
    if (isDoubleReset) {
      signals.push({
        id: 'double-reset-100',
        title: 'DOIS 1.00X CONSECUTIVOS (GATILHO SUPREMO)',
        description: 'Duas velas 1.00x resetando juntas! Conforme ensinado no Módulo IV, padrão de quase 100% de probabilidade de vela rosa (+10x) em até 5 tiros.',
        targetMultiplier: '5.00x a 10.00x+ (Rosa)',
        assertiveness: 98,
        level: 'CRITICAL_ALERT',
        strategyName: 'Reset Duplo 1.00x',
        actionRecommendation: 'Realizar 5 entradas de mão fixa imediatamente.',
        protectionAdvice: 'Sempre com 1ª aposta de proteção em 1.49x e 2ª aposta buscando 5x a 10x.',
        maxEntries: 5,
        upcomingTargetHouses: [1, 2, 3, 4, 5]
      });
    } else {
      signals.push({
        id: 'reset-100',
        title: 'RESET 1.00X DETECTADO',
        description: 'Vela 1.00x pura! No Aviator, o 1.00x é o reset da plataforma e puxa vela de 5x a 10x nas próximas 10 casas.',
        targetMultiplier: '5.00x ou 10.00x',
        assertiveness: 92,
        level: 'HIGH',
        strategyName: 'Gatilho de Reset 1.00x',
        actionRecommendation: 'Atenção redobrada nas casas 1ª, 4ª, 5ª, 7ª e 10ª (5ª casa é a mais forte!).',
        protectionAdvice: 'Proteção obrigatória em 1.49x na primeira caixa.',
        maxEntries: 5,
        upcomingTargetHouses: [1, 4, 5, 7, 10]
      });
    }
  }

  // 2. Padrão 1.37x (Gatilho de 90%+ Assertividade - Módulo IV, V)
  if (last.value === 1.37 || last.value === 1.38) {
    signals.push({
      id: 'golden-137',
      title: 'GATILHO DE OURO 1.37X (>90% ASSERTIVIDADE)',
      description: 'Sempre que sai o multiplicador 1.37x, a tendência de vela 5x a 30x+ nas próximas rodadas é altíssima.',
      targetMultiplier: '5.00x a 30.00x+ (Rosa)',
      assertiveness: 95,
      level: 'CRITICAL_ALERT',
      strategyName: 'Gatilho Especial 1.37x',
      actionRecommendation: 'Executar até 5 entradas de mão fixa.',
      protectionAdvice: 'Primeira entrada 1.49x para cobrir, segunda solta no alvo.',
      maxEntries: 5,
      upcomingTargetHouses: [1, 2, 3, 4, 5]
    });
  }

  // 3. Padrão Combinação 1.00x + 1.37x + 1.00x (Módulo V, pág 18)
  if (last3.length === 3) {
    const v = last3.map(c => c.value);
    if ((v[0] === 1.00 && v[1] === 1.37 && v[2] === 1.00) || (v[0] === 1.37 && v[1] === 1.00)) {
      signals.push({
        id: 'combo-100-137-100',
        title: 'COMBINAÇÃO PERFEITA 1.00x + 1.37x (95%+)',
        description: 'Velas resetando 1.00x ligadas a 1.37x! Ensinamento direto da mentoria: altíssima chance de rosa de 10x ou mais.',
        targetMultiplier: '10.00x+ (Rosa)',
        assertiveness: 96,
        level: 'CRITICAL_ALERT',
        strategyName: 'Combinação 1.00x - 1.37x',
        actionRecommendation: 'Fazer 5 entradas com mão fixa.',
        protectionAdvice: 'Proteção 1.49x na aposta 1 e alvo 10x na aposta 2.',
        maxEntries: 5,
        upcomingTargetHouses: [1, 2, 3, 4, 5]
      });
    }
  }

  // 4. Gatilho Especial 1.88x (Módulo IV & V)
  if (last.value === 1.88 || (last.value >= 1.87 && last.value <= 1.89)) {
    signals.push({
      id: 'special-188',
      title: 'VELA ESPECIAL 1.88X',
      description: 'Sempre que a vela 1.88x aparecer, faça 5 entradas fixas com proteção em 1.49x. Para maior assertividade, busque 2x a 3x.',
      targetMultiplier: '2.00x a 3.00x (Conservador) / 5x (Agressivo)',
      assertiveness: 91,
      level: 'HIGH',
      strategyName: 'Gatilho 1.88x',
      actionRecommendation: 'Entrar nas próximas rodadas (máximo 5 tiros).',
      protectionAdvice: 'Saque automático em 1.49x para garantir capital.',
      maxEntries: 5,
      upcomingTargetHouses: [1, 2, 3]
    });
  }

  // 5. Padrão "Casa dos 90" (1.90x a 1.99x) (Módulo V, pág 13)
  if (last.value >= 1.90 && last.value <= 1.99) {
    signals.push({
      id: 'casa-90',
      title: 'PADRÃO CASA DOS 90 (1.90X A 1.99X)',
      description: 'Sempre que vem vela de 1.90 a 1.99x, a probabilidade de bater 2x (e muito forte 1.5x) em até Gale 2 é altíssima.',
      targetMultiplier: '2.00x (ou 1.50x no mínimo)',
      assertiveness: 89,
      level: 'HIGH',
      strategyName: 'Padrão Casa dos 90',
      actionRecommendation: 'Fazer entrada buscando 2x com até 2 Gales (G1 / G2).',
      protectionAdvice: 'Garantir proteção em 1.49x ou 1.50x.',
      maxEntries: 3,
      upcomingTargetHouses: [1, 2, 3]
    });
  }

  // 6. Final de Vela Roxa com dígito 7 -> ALERTA DE PERIGO / RED (Módulo IV pág 53)
  if (last.color === 'purple') {
    const centsStr = (last.value % 1).toFixed(2).slice(2);
    const lastDigit = centsStr.slice(-1);
    if (lastDigit === '7') {
      signals.push({
        id: 'final-7-danger',
        title: 'ALERTA: VELA ROXA FINAL 7 (80% PUXA RED)',
        description: `Vela atual ${last.value.toFixed(2)}x termina em 7. A mentoria aponta que 80% das velas roxas com final 7 puxam vela azul (red)!`,
        targetMultiplier: 'EVITAR ENTRADA (Risco de Azul)',
        assertiveness: 80,
        level: 'CRITICAL_ALERT',
        strategyName: 'Dica de Ouro 2 - Final 7',
        actionRecommendation: 'FIQUE DE FORA da próxima rodada! Não arrisque seu capital.',
        protectionAdvice: 'Se insistir em entrar, use apenas mão mínima com proteção em 1.30x.',
        maxEntries: 0
      });
    } else if (lastDigit === '1') {
      signals.push({
        id: 'final-1-boost',
        title: 'VELA ROXA FINAL 1 (80% PUXA 2X+)',
        description: `Vela atual ${last.value.toFixed(2)}x termina com dígito 1. Conforme a Dica de Ouro 2, 80% das vezes puxa outra vela 2x+.`,
        targetMultiplier: '2.00x+',
        assertiveness: 84,
        level: 'HIGH',
        strategyName: 'Dica de Ouro 2 - Final 1',
        actionRecommendation: 'Entrar na próxima rodada buscando 2x.',
        protectionAdvice: 'Proteção em 1.49x.',
        maxEntries: 2,
        upcomingTargetHouses: [1, 2]
      });
    }
  }

  // 7. Sequência de 4 Roxos quebrando em 1 Azul (Módulo V, pág 6)
  if (candles.length >= 5) {
    const s5 = candles.slice(-5);
    const prev4 = s5.slice(0, 4);
    const current = s5[4];
    const prevAllPurple = prev4.every(c => c.color === 'purple' || c.color === 'pink');
    if (prevAllPurple && current.color === 'blue') {
      signals.push({
        id: 'seq-4-purple-break-1-blue',
        title: '4 ROXOS QUEBRANDO EM 1 AZUL (GATILHO DE 1ª ENTRADA)',
        description: 'Um dos gatilhos favoritos do Pai do Aviator! 4 roxos seguidos que quebraram em 1 azul. A próxima vela costuma pagar de primeira vela alta (5x a 9x+).',
        targetMultiplier: '2.00x a 9.00x+',
        assertiveness: 93,
        level: 'CRITICAL_ALERT',
        strategyName: 'Quebra de 4 Roxos',
        actionRecommendation: 'Entrada imediata na próxima rodada!',
        protectionAdvice: 'Proteção 1.49x na caixa 1, buscar 5x+ na caixa 2.',
        maxEntries: 2,
        upcomingTargetHouses: [1]
      });
    }
  }

  // 8. Regra dos 13 (Vela +30x recente) (Módulo IV, pág 48-49)
  const lastPink30 = [...candles].reverse().find(c => c.value >= 30.00);
  if (lastPink30) {
    const indexFromLast = candles.length - 1 - candles.indexOf(lastPink30);
    if (indexFromLast >= 1 && indexFromLast <= 13) {
      const oddHouses = [1, 3, 5, 7, 9, 11, 13];
      const nextHouse = indexFromLast + 1;
      const isOdd = oddHouses.includes(nextHouse);

      signals.push({
        id: `regra-13-${lastPink30.id}`,
        title: `REGRA DOS 13 (CASA ${nextHouse} DE 13)`,
        description: `Após vela de ${lastPink30.value.toFixed(2)}x, a plataforma costuma pagar nova vela alta em até 13 casas. Cerca de 95% das vezes pagam em casas ÍMPARES (1, 3, 5, 7, 9, 11, 13).`,
        targetMultiplier: '10.00x a 18.00x+',
        assertiveness: isOdd ? 91 : 75,
        level: isOdd ? 'HIGH' : 'MEDIUM',
        strategyName: 'Regra dos 13',
        actionRecommendation: isOdd
          ? `A próxima rodada é a Casa ${nextHouse} (ÍMPAR): ENTRADA FORTE!`
          : `Próxima rodada é Casa ${nextHouse} (PAR): Opere com cautela ou espere a próxima ímpar.`,
        protectionAdvice: 'Proteção no 1.49x para não arriscar a banca.',
        maxEntries: 1,
        upcomingTargetHouses: oddHouses.filter(h => h >= nextHouse)
      });
    }
  }

  // 9. Torre Azul Quebrando (4+ azuis consecutivos) (Módulo V, pág 29-30)
  const streak = [];
  for (let i = candles.length - 1; i >= 0; i--) {
    if (candles[i].color === 'blue') {
      streak.push(candles[i]);
    } else {
      break;
    }
  }
  if (streak.length >= 4) {
    signals.push({
      id: `torre-azul-${streak.length}`,
      title: `TORRE AZUL EM ANDAMENTO (${streak.length} AZUIS)`,
      description: 'Coluna com 4 ou mais azuis consecutivos. Conforme a mentoria: aguarde a primeira vela roxa ou rosa aparecer para confirmar a quebra da torre.',
      targetMultiplier: 'AGUARDAR QUEBRA',
      assertiveness: 88,
      level: 'HIGH',
      strategyName: 'Torre Azul',
      actionRecommendation: 'Não entre ainda contra a sequência de red! Espere 1 roxo sair, e após ele faça até 5 entradas com proteção no 1.49x.',
      protectionAdvice: 'Preserve sua banca. Esperar a virada de ciclo é a chave do sucesso.',
      maxEntries: 0
    });
  }

  // 10. Vela Baixa Especial que Chama Alta (Módulo IV, pág 51-54)
  const lowCandleRules: Record<number, { target: string; prob: number }> = {
    1.01: { target: '2.50x+', prob: 88 },
    1.03: { target: '2.50x a 3.00x', prob: 87 },
    1.09: { target: '5.00x+', prob: 89 },
    1.10: { target: '2.50x+', prob: 85 },
    1.11: { target: '3.00x+', prob: 90 },
    1.19: { target: '5.00x+', prob: 86 },
    1.20: { target: '8.00x+', prob: 85 },
    1.23: { target: '5.00x+', prob: 86 },
    1.26: { target: '3.50x+', prob: 84 },
    1.30: { target: '3.00x+', prob: 88 },
    1.74: { target: '4.00x+', prob: 85 }
  };

  const roundedLastVal = Math.round(last.value * 100) / 100;
  if (lowCandleRules[roundedLastVal]) {
    const rule = lowCandleRules[roundedLastVal];
    signals.push({
      id: `low-candle-${roundedLastVal}`,
      title: `VELA DE GATILHO BAIXA: ${roundedLastVal.toFixed(2)}x`,
      description: `No estudo das Velas Baixas do Módulo IV, a vela ${roundedLastVal.toFixed(2)}x possui padrão estatístico comprovado de puxar vela ${rule.target}.`,
      targetMultiplier: rule.target,
      assertiveness: rule.prob,
      level: 'HIGH',
      strategyName: 'Segredo das Velas Baixas',
      actionRecommendation: 'Entrar nas próximas 2 a 3 rodadas.',
      protectionAdvice: 'Garantir a 1ª aposta no 1.49x.',
      maxEntries: 3,
      upcomingTargetHouses: [1, 2, 3]
    });
  }

  return signals;
}

/**
 * Calculadora 1: Subtração de Velas para Vela Rosa (Módulo V, pág 3-4)
 * Ex: Vela 15.36x -> 5-1=4, 6-3=3 -> 4+3=7 minutos para frente
 * Ex: Vela 37.89x -> 7-3=4, 9-8=1 -> 4+1=5 minutos para frente
 */
export function calculatePinkSubtraction(candleMultiplier: number, baseTimeStr?: string): {
  minDiff1: number;
  minDiff2: number;
  totalMinutesAhead: number;
  targetTime: string;
  toleranceTime: string;
  explanation: string;
} {
  const parts = candleMultiplier.toFixed(2).split('.');
  const intStr = parts[0];
  const decStr = parts[1];

  // Dígitos inteiros (ex: 15 -> d1=1, d2=5)
  const d1 = parseInt(intStr[intStr.length - 2] || '0', 10);
  const d2 = parseInt(intStr[intStr.length - 1] || '0', 10);
  const diffInt = Math.abs(d2 - d1);

  // Dígitos decimais (ex: 36 -> d3=3, d4=6)
  const d3 = parseInt(decStr[0] || '0', 10);
  const d4 = parseInt(decStr[1] || '0', 10);
  const diffDec = Math.abs(d4 - d3);

  let totalMinutesAhead = diffInt + diffDec;
  if (totalMinutesAhead === 0) totalMinutesAhead = 5; // fallback se for igual

  const now = new Date();
  let baseHour = now.getHours();
  let baseMin = now.getMinutes();
  let baseSec = now.getSeconds();

  if (baseTimeStr) {
    const timeMatch = baseTimeStr.split(':');
    if (timeMatch.length >= 2) {
      baseHour = parseInt(timeMatch[0], 10);
      baseMin = parseInt(timeMatch[1], 10);
      baseSec = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    }
  }

  const targetDate = new Date();
  targetDate.setHours(baseHour, baseMin + totalMinutesAhead, baseSec);

  const toleranceDate = new Date(targetDate.getTime() + 60 * 1000); // +1 min tolerância

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

  return {
    minDiff1: diffInt,
    minDiff2: diffDec,
    totalMinutesAhead,
    targetTime: formatTime(targetDate),
    toleranceTime: formatTime(toleranceDate),
    explanation: `Cálculo da mentoria: |${d2} - ${d1}| = ${diffInt} min e |${d4} - ${d3}| = ${diffDec} min. Soma: ${diffInt} + ${diffDec} = ${totalMinutesAhead} minutos à frente.`
  };
}

/**
 * Calculadora 2: Horário por Rodada e Horário Base (Módulo II pág 5, Módulo V pág 1)
 * Ex: Horário 17:33 + Rodada 1809347 (final 7) = 17:40
 */
export function calculateRoundTime(candleTimeStr: string, roundId: string): {
  roundDigit: number;
  targetTime: string;
  explanation: string;
} {
  const roundDigit = parseInt(roundId.trim().slice(-1), 10) || 0;
  const parts = candleTimeStr.split(':');
  const now = new Date();
  let hour = now.getHours();
  let min = now.getMinutes();
  let sec = 0;

  if (parts.length >= 2) {
    hour = parseInt(parts[0], 10);
    min = parseInt(parts[1], 10);
    sec = parts[2] ? parseInt(parts[2], 10) : 0;
  }

  const targetDate = new Date();
  targetDate.setHours(hour, min + roundDigit, sec);

  const targetTime = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}:${String(targetDate.getSeconds()).padStart(2, '0')}`;

  return {
    roundDigit,
    targetTime,
    explanation: `Horário ${hour}:${String(min).padStart(2, '0')} + Dígito final da rodada (${roundDigit}) = ${targetTime} (Buscar 2x ou mais)`.trim()
  };
}

/**
 * Calculadora 3: Entradas por Vela Alta Base (Módulo IV pág 12, 19, 23, 33, 38)
 * - Vela 2x: Base 1.99x - 2.99x + 3 minutos
 * - Vela 5x: Base 10x+ + 10 minutos (até 3 tentativas)
 * - Vela 10x: Base 20x+ + 20 minutos
 * - Vela 50x/100x: Base 100x+ + 30 minutos (ou +32m / +35m em ciclo negativo)
 */
export function calculateHighMultiplierTime(
  baseTimeStr: string,
  targetType: '2x' | '5x' | '10x' | '50x' | '100x',
  isNegativeCycle: boolean = false
): {
  minutesAhead: number[];
  targetTimes: string[];
  entryWindowText: string;
  ruleExplanation: string;
} {
  const parts = baseTimeStr.split(':');
  const now = new Date();
  let h = now.getHours();
  let m = now.getMinutes();

  if (parts.length >= 2) {
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10);
  }

  let minutesAhead: number[] = [];
  let ruleExplanation = '';
  let entryWindowText = '';

  switch (targetType) {
    case '2x':
      minutesAhead = [3];
      ruleExplanation = 'Para buscar vela 2x: Vela base 1.99x a 2.99x somando 3 minutos exatos à frente.';
      entryWindowText = 'Entrar até 15 segundos antes e realizar 2 a 3 entradas dentro do minuto.';
      break;
    case '5x':
      minutesAhead = [10, 20, 30]; // até 3 tentativas de +10m
      ruleExplanation = 'Para buscar 5x: Vela base 10x+ somando 10 minutos à frente. Se não respeitar, acrescentar +10m até 3 vezes.';
      entryWindowText = 'Entrar até 20 a 30 segundos antes e realizar 3 entradas dentro do minuto.';
      break;
    case '10x':
      minutesAhead = [20];
      ruleExplanation = 'Para buscar 10x: Vela base 20x+ somando 20 minutos à frente.';
      entryWindowText = 'Entrar até 30 segundos antes e realizar até 4 entradas dentro do minuto.';
      break;
    case '50x':
    case '100x':
      minutesAhead = isNegativeCycle ? [32, 35] : [30];
      ruleExplanation = isNegativeCycle
        ? 'Em ciclo negativo (plataforma atrasando): somar +32 e +35 minutos da vela base de 100x+.'
        : 'Em ciclo positivo (plataforma pagando): somar exatos +30 minutos da vela base de 100x+.';
      entryWindowText = 'Entrar até 30 segundos antes, realizar 4 a 5 entradas no minuto.';
      break;
  }

  const targetTimes = minutesAhead.map(minOffset => {
    const d = new Date();
    d.setHours(h, m + minOffset, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  return {
    minutesAhead,
    targetTimes,
    entryWindowText,
    ruleExplanation
  };
}

/**
 * Calculadora 4: Gestão de Banca & Proteção 1.49x
 * Estratégia de Aposta Dupla ensinada no Módulo IV pág 18 e Módulo V pág 16-17:
 * Aposta 1: Proteção com cashout em 1.49x
 * Aposta 2: Alvo (ex: 2.00x, 3.00x, 5.00x, 10.00x)
 */
export function calculateDualBetProtection(
  totalStakeBrl: number,
  targetMultiplier: number = 2.00
): {
  protectionBet: number;
  targetBet: number;
  protectionPayout: number;
  protectionNetProfitWhenAlone: number; // Quando apenas a proteção paga
  totalProfitWhenBothHit: number; // Quando ambas pagam
  protectionMultiplier: number;
  strategySummary: string;
} {
  // Para que o cashout em 1.49x cubra ambas as apostas:
  // protectionBet * 1.49 >= protectionBet + targetBet
  // 0.49 * protectionBet >= targetBet
  // Logo: protectionBet >= targetBet / 0.49 ~= 2.04 * targetBet
  // Tipicamente, a mentoria recomenda dividir a banca em 2/3 na proteção e 1/3 no alvo.
  const targetBet = Math.max(1, Math.round((totalStakeBrl / 3.04) * 100) / 100);
  const protectionBet = Math.round((totalStakeBrl - targetBet) * 100) / 100;

  const protectionMultiplier = 1.49;
  const protectionPayout = Math.round(protectionBet * protectionMultiplier * 100) / 100;
  const protectionNetProfitWhenAlone = Math.round((protectionPayout - totalStakeBrl) * 100) / 100;

  const targetPayout = Math.round(targetBet * targetMultiplier * 100) / 100;
  const totalProfitWhenBothHit = Math.round((protectionPayout + targetPayout - totalStakeBrl) * 100) / 100;

  return {
    protectionBet,
    targetBet,
    protectionPayout,
    protectionNetProfitWhenAlone,
    totalProfitWhenBothHit,
    protectionMultiplier,
    strategySummary: `Aposte R$ ${protectionBet.toFixed(2)} com auto-retirada em 1.49x (Proteção) e R$ ${targetBet.toFixed(2)} no alvo ${targetMultiplier.toFixed(2)}x. Se o avião cair antes do alvo mas passar de 1.49x, seu retorno será R$ ${protectionPayout.toFixed(2)}, garantindo lucro/empate e RISCO ZERO!`
  };
}

/**
 * Exemplos prontos de sequências de velas dos PDFs para testes e demonstração imediata
 */
export const SAMPLE_PRESETS: { name: string; description: string; candles: AviatorCandle[] }[] = [
  {
    name: 'Gatilho Reset 1.00x + 1.37x (Módulo V)',
    description: 'Sequência com vela 1.37x seguida de reset 1.00x preparando vela rosa',
    candles: [
      { id: 'p1', value: 2.18, color: 'purple' },
      { id: 'p2', value: 1.49, color: 'blue' },
      { id: 'p3', value: 3.42, color: 'purple' },
      { id: 'p4', value: 1.37, color: 'blue' },
      { id: 'p5', value: 1.00, color: 'blue' },
    ]
  },
  {
    name: 'Quebra de 4 Roxos (Módulo V)',
    description: '4 velas roxas consecutivas quebrando em 1 vela azul, gatilho para entrada de 1ª',
    candles: [
      { id: 'p6', value: 3.19, color: 'purple' },
      { id: 'p7', value: 6.80, color: 'purple' },
      { id: 'p8', value: 5.04, color: 'purple' },
      { id: 'p9', value: 2.99, color: 'purple' },
      { id: 'p10', value: 1.15, color: 'blue' },
    ]
  },
  {
    name: 'Casa dos 90 & Gatilho 1.88x (Módulo IV)',
    description: 'Velas de alta probabilidade na casa dos 90 e gatilho de ouro 1.88x',
    candles: [
      { id: 'p11', value: 1.25, color: 'blue' },
      { id: 'p12', value: 2.45, color: 'purple' },
      { id: 'p13', value: 1.94, color: 'blue' },
      { id: 'p14', value: 1.88, color: 'blue' },
    ]
  },
  {
    name: 'Torre Azul de 5 Velas (Módulo V)',
    description: 'Sequência de retenção extrema da plataforma, requer cautela até quebrar',
    candles: [
      { id: 'p15', value: 1.08, color: 'blue' },
      { id: 'p16', value: 1.07, color: 'blue' },
      { id: 'p17', value: 1.13, color: 'blue' },
      { id: 'p18', value: 1.58, color: 'blue' },
      { id: 'p19', value: 1.02, color: 'blue' },
    ]
  }
];
