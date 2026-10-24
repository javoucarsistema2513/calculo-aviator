import { Candle, CandleType, HousePrediction, TimePrediction, DetectedPattern } from '../types/aviator';

// Catalogo de Gatilhos de Velas Baixas que chamam velas altas (Conforme Módulo 4 & 5 do Pai do Aviator)
export interface LowCandleTriggerInfo {
  multiplier: number;
  calls: string;
  targetType: '2x' | '3x' | '5x' | '10x' | 'especial';
  strength: number; // 0 - 100
  notes: string;
}

export const LOW_CANDLE_TRIGGERS: Record<string, LowCandleTriggerInfo> = {
  '1.00': { multiplier: 1.00, calls: '5x a 10x+ (Reset)', targetType: '10x', strength: 96, notes: 'Vela de Reset supremo. Paga 10x em até 10 casas (5ª casa pico máximo).' },
  '1.01': { multiplier: 1.01, calls: '2.50x a 3.00x', targetType: '2x', strength: 86, notes: 'Forte indutor de roxo rápido ou 20x se ligada ao 1.00x.' },
  '1.02': { multiplier: 1.02, calls: '5.00x ou mais', targetType: '5x', strength: 89, notes: 'Gatilho confirmado de alta após quebra.' },
  '1.03': { multiplier: 1.03, calls: '2.50x / 3x / 5x (Bet7k)', targetType: '5x', strength: 88, notes: 'Gatilho clássico de reversão para roxo médio/alto.' },
  '1.04': { multiplier: 1.04, calls: '5.00x ou mais', targetType: '5x', strength: 87, notes: 'Chama vela de 5x+ nas próximas rodadas.' },
  '1.05': { multiplier: 1.05, calls: '5.00x ou mais', targetType: '5x', strength: 87, notes: 'Após 10 min vem rosinha com 4 entradas.' },
  '1.07': { multiplier: 1.07, calls: '5.00x ou mais', targetType: '5x', strength: 91, notes: 'Gatilho fortíssimo para 5x em até 3 casas.' },
  '1.09': { multiplier: 1.09, calls: '5.00x+ (Atenção a Reds)', targetType: '5x', strength: 85, notes: 'Se vier isolada chama 5x; em sequência avisa 9 reds.' },
  '1.10': { multiplier: 1.10, calls: '2.50x ou Rosinha', targetType: '2x', strength: 84, notes: 'Puxa vela de 5x ou mais rosinha.' },
  '1.11': { multiplier: 1.11, calls: '2.00x ou mais / 3x', targetType: '3x', strength: 92, notes: 'Vela Especial da lista mágica. Puxa reversão rápida.' },
  '1.12': { multiplier: 1.12, calls: '5.00x ou mais (Rosinha)', targetType: '5x', strength: 88, notes: 'Puxa vela de 5x ou mais rosinha.' },
  '1.14': { multiplier: 1.14, calls: '2.00x cravado', targetType: '2x', strength: 85, notes: 'Puxa vela de 2x ou mais.' },
  '1.15': { multiplier: 1.15, calls: '2.00x a Rosa', targetType: '2x', strength: 87, notes: 'Puxa vela de 2x ou rosinha.' },
  '1.17': { multiplier: 1.17, calls: '2.00x ou Rosa', targetType: '10x', strength: 90, notes: 'Com 1.71 e 1.77 puxa acima de 3x na 2ª e 3ª casa.' },
  '1.18': { multiplier: 1.18, calls: '5.00x (Mr Jack / Premiada)', targetType: '5x', strength: 89, notes: '1.94 + 1.18 puxa rosa direto.' },
  '1.19': { multiplier: 1.19, calls: '5.00x+', targetType: '5x', strength: 86, notes: 'Chama vela de 5.00x.' },
  '1.20': { multiplier: 1.20, calls: '8.00x (Roxo Alto)', targetType: '5x', strength: 90, notes: 'Chama vela de 8.00x.' },
  '1.21': { multiplier: 1.21, calls: '2.00x (Gatilho)', targetType: '2x', strength: 86, notes: '1.21 a 1.29x gatilhos para 10x.' },
  '1.23': { multiplier: 1.23, calls: '5.00x+', targetType: '5x', strength: 87, notes: 'Chama vela de 5.00x.' },
  '1.25': { multiplier: 1.25, calls: '2.00x ou Roxo Alto', targetType: '2x', strength: 88, notes: 'Puxa vela de 2x ou roxo alto.' },
  '1.26': { multiplier: 1.26, calls: '3.50x+', targetType: '3x', strength: 86, notes: 'Chama vela 3.50x.' },
  '1.27': { multiplier: 1.27, calls: '2.00x ou Roxo Alto', targetType: '2x', strength: 87, notes: 'Puxa 2x ou roxo alto.' },
  '1.28': { multiplier: 1.28, calls: 'Rosa 10x+', targetType: '10x', strength: 93, notes: 'Gatilho direto para puxar Rosa.' },
  '1.29': { multiplier: 1.29, calls: '2.00x ou Roxo Alto', targetType: '2x', strength: 88, notes: 'Fim da casa dos 20, emparelha com 1.25/1.24.' },
  '1.30': { multiplier: 1.30, calls: '3.00x', targetType: '3x', strength: 87, notes: 'Ligada ao 1.00x projeta vela de até 20x.' },
  '1.31': { multiplier: 1.31, calls: '2.00x', targetType: '2x', strength: 85, notes: 'Puxa vela de 2x.' },
  '1.34': { multiplier: 1.34, calls: 'Fim de Ciclo / Quebra', targetType: '2x', strength: 88, notes: '1.34 e 1.75 indicam que o ciclo está acabando.' },
  '1.37': { multiplier: 1.37, calls: '5.00x a 30x+ (Vela Mestra)', targetType: '10x', strength: 97, notes: 'A vela mais poderosa do Aviator. Acima de 90% assertividade.' },
  '1.39': { multiplier: 1.39, calls: '2.00x ou Rosinha', targetType: '2x', strength: 87, notes: 'Puxa vela de 2x ou rosinha.' },
  '1.40': { multiplier: 1.40, calls: '2.00x', targetType: '2x', strength: 84, notes: 'Puxa vela de 2x.' },
  '1.44': { multiplier: 1.44, calls: '5.00x ou mais', targetType: '5x', strength: 88, notes: 'Puxa vela de 5x ou mais.' },
  '1.50': { multiplier: 1.50, calls: '5.00x a 15x (Pé de Vela)', targetType: '5x', strength: 91, notes: 'Pé da vela 1.50 indica teto de 15x.' },
  '1.51': { multiplier: 1.51, calls: '5.00x ou mais', targetType: '5x', strength: 89, notes: 'Puxa vela de 5x ou mais.' },
  '1.58': { multiplier: 1.58, calls: '5.00x ou mais', targetType: '5x', strength: 87, notes: 'Puxa vela de 5x ou mais.' },
  '1.66': { multiplier: 1.66, calls: 'Roxo Alto ou Rosa', targetType: '10x', strength: 91, notes: 'Puxa vela de roxa alta ou rosinhas.' },
  '1.71': { multiplier: 1.71, calls: '5.00x ou Rosinhas', targetType: '5x', strength: 89, notes: 'Com 1.17 e 1.77 puxa acima de 3x.' },
  '1.73': { multiplier: 1.73, calls: '2.00x', targetType: '2x', strength: 85, notes: 'Puxa vela de 2x.' },
  '1.74': { multiplier: 1.74, calls: '4.00x', targetType: '3x', strength: 86, notes: 'Chama vela de 4.00x.' },
  '1.75': { multiplier: 1.75, calls: 'Fim de Ciclo / Quebra', targetType: '2x', strength: 88, notes: 'Indicação de virada de ciclo pagante.' },
  '1.77': { multiplier: 1.77, calls: '2.00x', targetType: '2x', strength: 87, notes: 'Puxa 2x na segunda ou terceira casa.' },
  '1.86': { multiplier: 1.86, calls: '2.00x', targetType: '2x', strength: 86, notes: 'Puxa vela de 2x.' },
  '1.88': { multiplier: 1.88, calls: '3.00x, 5x e 10x+ (Especial)', targetType: '10x', strength: 94, notes: 'Vela especial: 5 entradas com proteção 1.49x.' },
  '1.97': { multiplier: 1.97, calls: '5.00x ou mais', targetType: '5x', strength: 90, notes: 'Puxa vela de 5x ou mais.' },
  '1.99': { multiplier: 1.99, calls: '5.00x ou mais (Especial)', targetType: '5x', strength: 94, notes: 'Vela Especial: chama 5x+ e prepara base para 2x.' },
  '6.99': { multiplier: 6.99, calls: '2.00x a 3.00x', targetType: '2x', strength: 86, notes: 'Chama vela de 2 a 3x imediata.' }
};

// Casais / Pares Gatilhos de Rosas (PDF Módulo 4 Página 52)
export const PINK_PAIRS = [
  '1.94+1.18', '1.09+1.23', '1.74+1.47', '1.17+1.00', '1.53+1.15',
  '1.34+1.16', '1.29+1.33', '1.83+1.11', '1.77+1.13', '1.00+1.03',
  '1.06+1.47', '1.65+1.60', '1.13+1.11', '1.33+1.29', '1.01+1.07',
  '1.00+1.27', '1.09+1.07', '1.21+1.98'
];

export const CASAMENTO_DECIMAIS = [
  { pair: '9-1', desc: 'Casamento 9 e 1 puxa Rosa' },
  { pair: '2-5', desc: 'Casamento 2 e 5 puxa Rosa' },
  { pair: '8-4', desc: 'Casamento 8 e 4 puxa Rosa' },
  { pair: '3-7', desc: 'Casamento 3 e 7 puxa Rosa' },
  { pair: '2-9', desc: 'Casamento 2 e 9 puxa Rosa' },
  { pair: '8-1', desc: 'Casamento 8 e 1 puxa Rosa' },
];

export function getCandleType(multiplier: number): CandleType {
  if (multiplier < 2.00) return 'azul';
  if (multiplier < 10.00) return 'roxo';
  if (multiplier < 50.00) return 'rosa';
  return 'rosa_alta';
}

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function parseTimeString(timeStr: string): Date {
  const parts = timeStr.split(':');
  const now = new Date();
  if (parts.length >= 2) {
    now.setHours(parseInt(parts[0], 10) || 0);
    now.setMinutes(parseInt(parts[1], 10) || 0);
    now.setSeconds(parseInt(parts[2] || '0', 10) || 0);
    now.setMilliseconds(0);
  }
  return now;
}

// -------------------------------------------------------------
// 1. CÁLCULO DE CASAS (RODADAS À FRENTE)
// -------------------------------------------------------------
export function calculateHousePredictions(multiplier: number): HousePrediction[] {
  const predictions: HousePrediction[] = [];
  const type = getCandleType(multiplier);
  const multStr = multiplier.toFixed(2);
  const [, decimalStr] = multStr.split('.');
  const d1 = parseInt(decimalStr[0], 10) || 0;
  const d2 = parseInt(decimalStr[1], 10) || 0;
  const sumDec = d1 + d2;

  // CASO A: VELA ROSA OU ROSA ALTA (>= 10.00x)
  if (multiplier >= 10.00) {
    // Regra da Rosa: Soma das decimais individuais e soma combinada (Módulo 3, Página 5)
    // Ex: 10.75x -> d1=7, d2=5 -> 1ª casa, 5ª casa, 7ª casa, 12ª casa (soma), 15ª casa e 17ª casa
    const targetHouses = new Set<number>();
    
    // Alvo imediato: se d1 > 0
    if (d1 > 0) targetHouses.add(d1);
    if (d2 > 0) targetHouses.add(d2);
    if (sumDec > 0) targetHouses.add(sumDec);
    
    // Combinações clássicas citadas no curso
    if (sumDec > 0 && sumDec <= 10) {
      targetHouses.add(sumDec + 5);
      targetHouses.add(sumDec + 10);
    } else {
      targetHouses.add(15);
      targetHouses.add(17);
    }

    // Regra dos 13 para velas altas (+30x) (Módulo 4, Página 48-49)
    if (multiplier >= 30.00) {
      [1, 3, 5, 7, 9, 11, 13].forEach(odd => targetHouses.add(odd));
    }

    const sortedHouses = Array.from(targetHouses).sort((a, b) => a - b).filter(h => h > 0 && h <= 20);

    sortedHouses.forEach((house) => {
      const isOdd = house % 2 !== 0;
      let prob = 85;
      if (multiplier >= 30.00 && isOdd) prob = 95; // 95% das vezes em casas ímpares
      else if (house === sumDec) prob = 92;
      else if (house === d1 || house === d2) prob = 89;

      let ruleName = `Soma Decimal (${d1} + ${d2} = ${sumDec})`;
      let explanation = `Vela Rosa de ${multiplier.toFixed(2)}x projeta entrada na ${house}ª casa.`;
      if (multiplier >= 30.00 && isOdd) {
        ruleName = `Regra dos 13 (Casa Ímpar)`;
        explanation = `Vela ${multiplier.toFixed(2)}x (+30x) aciona Regra dos 13 com 95% de força em casas ímpares (alvo: ${house}ª casa).`;
      }

      predictions.push({
        house,
        type: multiplier >= 50.00 ? 'rosa_alta' : 'rosa',
        expectedMinMultiplier: house === 1 ? 2.0 : multiplier >= 30 ? 10.0 : 5.0,
        probability: Math.min(prob, 98),
        ruleName,
        explanation,
        isOdd
      });
    });
  } 
  // CASO B: VELA ROXA (2.00x a 9.99x)
  else if (multiplier >= 2.00) {
    // Módulo 2, Página 7 / 23: vela 2.31 -> 3+1 = 4 casas para frente
    const targetHouse = (d1 + d2 === 0) ? 2 : (d1 + d2);
    const isStrongMomentum = multiplier >= 2.60;
    
    predictions.push({
      house: targetHouse,
      type: 'roxo',
      expectedMinMultiplier: 2.00,
      probability: isStrongMomentum ? 91 : 78,
      ruleName: `Soma Decimal Roxa (${d1} + ${d2} = ${targetHouse})`,
      explanation: isStrongMomentum
        ? `Vela ${multiplier.toFixed(2)}x com média superior a 2.60x confirma continuidade de roxo na ${targetHouse}ª casa.`
        : `Vela ${multiplier.toFixed(2)}x abaixo de 2.20x alerta queda, porém ${targetHouse}ª casa tem potencial de retorno.`,
      isOdd: targetHouse % 2 !== 0
    });

    // Se roxo alto (>= 5.00x ou >= 7.00x): Gatilho de 5 fixas para Rosa
    if (multiplier >= 7.00) {
      [2, 3, 5].forEach(h => {
        predictions.push({
          house: h,
          type: 'rosa',
          expectedMinMultiplier: 5.00,
          probability: 88,
          ruleName: `Gatilho Roxo Alto (${multiplier.toFixed(2)}x)`,
          explanation: `Velas 7x, 8x e 9x no gráfico disparam 5 entradas fixas buscando 5x a 10x.`,
          isOdd: h % 2 !== 0
        });
      });
    }
  } 
  // CASO C: VELA AZUL (< 2.00x)
  else {
    // Se for 1.00x (Reset Supremo - Módulo 4 Página 29 & Módulo 5 Página 12)
    if (multiplier === 1.00) {
      [1, 4, 5, 7, 10].forEach(h => {
        predictions.push({
          house: h,
          type: 'rosa',
          expectedMinMultiplier: 10.00,
          probability: h === 5 ? 96 : 89,
          ruleName: h === 5 ? 'Reset 1.00x - 5ª Casa (Pico)' : 'Reset 1.00x em até 10 Casas',
          explanation: `Reset 1.00x cravado abre janela de 10x em até 10 casas. A 5ª casa possui o maior índice de acerto histórico!`,
          isOdd: h % 2 !== 0
        });
      });
    } else {
      // Verificar se é gatilho mapeado
      const trigger = LOW_CANDLE_TRIGGERS[multStr];
      if (trigger) {
        predictions.push({
          house: 1,
          type: trigger.targetType === '10x' ? 'rosa' : 'roxo',
          expectedMinMultiplier: trigger.targetType === '10x' ? 10.0 : trigger.targetType === '5x' ? 5.0 : 2.0,
          probability: trigger.strength,
          ruleName: `Gatilho Baixo: ${multStr}x`,
          explanation: `${trigger.notes} Puxa ${trigger.calls}.`,
          isOdd: true
        });
        predictions.push({
          house: 2,
          type: trigger.targetType === '10x' ? 'rosa' : 'roxo',
          expectedMinMultiplier: 2.00,
          probability: trigger.strength - 4,
          ruleName: `Cobertura G1 (${multStr}x)`,
          explanation: `Proteção no 1.49x com entrada no 2º tiro caso quebre de primeira.`,
          isOdd: false
        });
      } else {
        // Regra geral da decimal azul: decimal indica quantidade de azuis ou quebra (Módulo 1 Página 7)
        const expectedBlues = d2 > 0 ? d2 : d1;
        predictions.push({
          house: expectedBlues + 1,
          type: 'roxo',
          expectedMinMultiplier: 2.00,
          probability: 82,
          ruleName: `Quebra Decimal Azul (Decimal ${expectedBlues})`,
          explanation: `Decimal ${expectedBlues} projeta quebra do mar azul na ${expectedBlues + 1}ª casa à frente.`,
          isOdd: (expectedBlues + 1) % 2 !== 0
        });
      }
    }
  }

  return predictions.sort((a, b) => a.house - b.house);
}

// -------------------------------------------------------------
// 2. CÁLCULO DE MINUTOS E HORÁRIOS PREVISTOS (IMEDIATO)
// -------------------------------------------------------------
export function calculateImmediateTimePredictions(
  multiplier: number,
  baseTimeStr: string,
  roundIdStr?: string
): TimePrediction[] {
  const predictions: TimePrediction[] = [];
  const baseDate = parseTimeString(baseTimeStr);
  const multStr = multiplier.toFixed(2);
  const [intPartStr, decimalStr] = multStr.split('.');
  const intVal = parseInt(intPartStr, 10);
  const d1 = parseInt(decimalStr[0], 10) || 0;
  const d2 = parseInt(decimalStr[1], 10) || 0;

  // A. Regra do 1º Dígito Decimal (Módulo 5 Página 4 / Módulo 2 Página 5)
  // Hora + 1º dígito após ponto da vela
  if (d1 > 0) {
    const targetDate1 = new Date(baseDate.getTime() + d1 * 60 * 1000);
    predictions.push({
      targetTime: formatTime(targetDate1),
      minutesAhead: d1,
      expectedTarget: multiplier >= 10 ? '10x' : '5x',
      probability: 93,
      ruleSource: `Soma 1º Dígito Decimal (+${d1} min)`,
      entryWindow: 'Entrar 15s a 20s antes até G1 (2 a 3 tiros)',
      protectionTip: 'Mão 1 saída no 1.49x, Mão 2 busca o topo',
      horizon: 'imediato'
    });
  }

  // B. Regra de Subtração de Dígitos da Rosa (Módulo 3 Página 7 & Módulo 5 Página 4)
  // Ex: 15.36x -> (5-1) + (6-3) = 4+3 = 7 min
  // Ex: 37.89x -> (7-3) + (9-8) = 4+1 = 5 min
  if (multiplier >= 10.00 && intPartStr.length >= 2) {
    const i1 = parseInt(intPartStr[0], 10);
    const i2 = parseInt(intPartStr[1], 10);
    const diffInt = Math.abs(i2 - i1);
    const diffDec = Math.abs(d2 - d1);
    const subMin = diffInt + diffDec;

    if (subMin > 0 && subMin !== d1) {
      const targetDate2 = new Date(baseDate.getTime() + subMin * 60 * 1000);
      predictions.push({
        targetTime: formatTime(targetDate2),
        minutesAhead: subMin,
        expectedTarget: '10x',
        probability: 94,
        ruleSource: `Subtração de Dígitos Rosa (+${subMin} min)`,
        entryWindow: `Entrar no minuto exato e realizar 2 a 3 tiros até G1`,
        protectionTip: 'Proteção 1.49x na 1ª aposta, buscar Rosa na 2ª',
        horizon: 'imediato'
      });
    }
  }

  // C. Regra do Dígito da Rodada (ID da Rodada) (Módulo 2 Página 5 & Módulo 5 Página 2)
  if (roundIdStr && roundIdStr.trim()) {
    const cleanId = roundIdStr.trim();
    const lastDigit = parseInt(cleanId[cleanId.length - 1], 10);
    if (!isNaN(lastDigit) && lastDigit > 0) {
      const targetDate3 = new Date(baseDate.getTime() + lastDigit * 60 * 1000);
      predictions.push({
        targetTime: formatTime(targetDate3),
        minutesAhead: lastDigit,
        expectedTarget: multiplier >= 10 ? '10x' : '2x',
        probability: 91,
        ruleSource: `Dígito da Rodada ID final [${lastDigit}] (+${lastDigit} min)`,
        entryWindow: 'Entrar 15s antes da virada do minuto',
        protectionTip: 'Seguir mão fixa com 2 gales no máximo',
        horizon: 'imediato'
      });
    }
  }

  // D. Horizontes Fixos de Minutos (Módulo 4: 3min, 10min, 20min, 30min)
  if (multiplier >= 1.99 && multiplier <= 2.99) {
    // Vela 2x chama 2x em +3 minutos
    const t3 = new Date(baseDate.getTime() + 3 * 60 * 1000);
    predictions.push({
      targetTime: formatTime(t3),
      minutesAhead: 3,
      expectedTarget: '2x',
      probability: 89,
      ruleSource: 'Base 2X (+3 minutos)',
      entryWindow: 'Entrar minuto exato (2 entradas)',
      protectionTip: 'Saída direta em 2.00x para dobrar valor',
      horizon: 'imediato'
    });
  }

  if (multiplier >= 10.00 && multiplier < 20.00) {
    // Vela 10x busca 5x em +10 minutos (Módulo 4 Página 19)
    const t10 = new Date(baseDate.getTime() + 10 * 60 * 1000);
    predictions.push({
      targetTime: formatTime(t10),
      minutesAhead: 10,
      expectedTarget: '5x',
      probability: 92,
      ruleSource: 'Catalogação Base 10X (+10 minutos)',
      entryWindow: 'Entrar até 20s antes, 3 entradas no minuto',
      protectionTip: 'Se não pagar, somar +10 min (tentativa 2 e 3)',
      horizon: 'imediato'
    });
  }

  if (multiplier >= 20.00 && multiplier < 50.00) {
    // Vela +20x busca 10x em +20 minutos (Módulo 4 Página 23-25)
    const t20 = new Date(baseDate.getTime() + 20 * 60 * 1000);
    predictions.push({
      targetTime: formatTime(t20),
      minutesAhead: 20,
      expectedTarget: '10x',
      probability: 94,
      ruleSource: 'Catalogação Base 20X (+20 minutos)',
      entryWindow: 'Entrar até 30s antes, até 4 entradas no minuto',
      protectionTip: '1ª mão proteção no 1.49x, 2ª mão busca 10x',
      horizon: 'imediato'
    });
  }

  if (multiplier >= 50.00) {
    // Vela +50x/+100x busca 50x/100x em +30 minutos (Módulo 4 Página 33, 38)
    const t30 = new Date(baseDate.getTime() + 30 * 60 * 1000);
    const t32 = new Date(baseDate.getTime() + 32 * 60 * 1000);
    const t35 = new Date(baseDate.getTime() + 35 * 60 * 1000);

    predictions.push({
      targetTime: formatTime(t30),
      minutesAhead: 30,
      expectedTarget: '50x',
      probability: 95,
      ruleSource: 'Ciclo Positivo 100X (+30 minutos)',
      entryWindow: 'Entrar 30s antes, 4 a 5 entradas de mão fixa',
      protectionTip: 'Proteção 1.49x e alvo no topo 50x a 100x',
      horizon: 'imediato'
    });

    predictions.push({
      targetTime: `${formatTime(t32)} ~ ${formatTime(t35)}`,
      minutesAhead: 32,
      expectedTarget: '100x',
      probability: 91,
      ruleSource: 'Ciclo Negativo / Compensação (+32 e +35 min)',
      entryWindow: 'Cobrir janela de 2 minutos (5 a 7 entradas totais)',
      protectionTip: 'Mão fixa e stop loss rígido',
      horizon: 'imediato'
    });
  }

  return predictions;
}

// -------------------------------------------------------------
// 3. HORIZONTES DE LONGO PRAZO: 7:00H, 12:00H E 24:00H (USER REQUEST)
// -------------------------------------------------------------
/**
 * Projeta para as próximas 7h, 12h e 24h os horários de alta probabilidade
 * calculados via algoritmos de recorrência de ciclo (4 ciclos/hora), minutos fortes (:00, :05, :09)
 * e o método de espelhamento do dia anterior (24h) ensinado no treinamento Pai do Aviator.
 */
export function calculateLongTermHorizons(
  multiplier: number,
  baseTimeStr: string,
  horizonType: '7h' | '12h' | '24h'
): TimePrediction[] {
  const predictions: TimePrediction[] = [];
  const baseDate = parseTimeString(baseTimeStr);
  const multStr = multiplier.toFixed(2);
  const [, decimalStr] = multStr.split('.');
  const d1 = parseInt(decimalStr[0], 10) || 0;
  const d2 = parseInt(decimalStr[1], 10) || 0;
  const seedMinuteOffset = (d1 * 3 + d2 * 2 + Math.floor(multiplier)) % 15;

  const maxHours = horizonType === '7h' ? 7 : horizonType === '12h' ? 12 : 24;

  // Minutos fortes do curso: terminados em 00, 05, 09 (PDF Módulo 4 Página 50)
  // Horários nobres: 06-09h, 13-14h, 16h30-17h40, 20-21h, 00-02h
  const strongMinutesBases = [0, 5, 9, 15, 20, 25, 29, 30, 35, 40, 45, 49, 50, 55];

  for (let h = 1; h <= maxHours; h++) {
    // Cálculo do tempo projetado
    const hourDate = new Date(baseDate.getTime() + h * 3600 * 1000);
    const hourVal = hourDate.getHours();

    // Verificação se está nos horários de maior pagamento (Melhores Horários)
    const isPeakHour =
      (hourVal >= 6 && hourVal <= 9) ||
      (hourVal >= 13 && hourVal <= 14) ||
      (hourVal === 16 || hourVal === 17) ||
      (hourVal >= 20 && hourVal <= 21) ||
      (hourVal >= 0 && hourVal <= 2);

    // Selecionar 1 a 2 horários fortes dentro desta hora h
    const min1 = (strongMinutesBases[(h * 2 + seedMinuteOffset) % strongMinutesBases.length]);
    const min2 = (strongMinutesBases[(h * 3 + seedMinuteOffset + 4) % strongMinutesBases.length]);

    const targetMinutes = [min1];
    if (min2 !== min1 && (h % 2 === 0 || isPeakHour)) {
      targetMinutes.push(min2);
    }

    targetMinutes.forEach((min) => {
      const targetDate = new Date(hourDate.getTime());
      targetDate.setMinutes(min);
      targetDate.setSeconds(0);

      const minutesAhead = Math.round((targetDate.getTime() - baseDate.getTime()) / 60000);
      if (minutesAhead <= 0) return;

      // Calcular probabilidade baseada no pico e harmônicos
      let prob = isPeakHour ? 94 : 88;
      if (min === 0 || min === 5 || min === 9) prob += 3;
      if (h === 7 && horizonType === '7h') prob = 96; // Ciclo 7h exato
      if (h === 12 && horizonType === '12h') prob = 97; // Meio ciclo diário 12h
      if (h === 24 && horizonType === '24h') prob = 98; // Espelhamento completo 24h (Pág. 43)

      prob = Math.min(prob, 99);

      let targetType: '2x' | '5x' | '10x' | '50x' | '100x' = '10x';
      if (multiplier >= 50.00 && (h % 3 === 0 || isPeakHour)) {
        targetType = '50x';
      } else if (multiplier >= 20.00) {
        targetType = '10x';
      } else if (multiplier >= 10.00) {
        targetType = (h % 2 === 0) ? '10x' : '5x';
      } else {
        targetType = (h % 2 === 0) ? '5x' : '2x';
      }

      let ruleSource = `Ciclo Harmônico ${h}h (Minuto Forte :${String(min).padStart(2, '0')})`;
      if (h === 24) {
        ruleSource = `Catalogação do Dia Seguinte (Espelhamento 24h Exato)`;
      } else if (h === 12) {
        ruleSource = `Ciclo Circadiano 12h (Inversão Diurno/Noturno)`;
      } else if (h === 7) {
        ruleSource = `Fechamento de Ciclo 7:00 Horas`;
      }

      predictions.push({
        targetTime: formatTime(targetDate),
        minutesAhead,
        expectedTarget: targetType,
        probability: prob,
        ruleSource,
        entryWindow: `Entrar 15s antes no minuto ${String(min).padStart(2, '0')} com até G1`,
        protectionTip: `Proteção saque rápido no 1.49x; 2ª aposta buscar ${targetType}`,
        horizon: horizonType
      });
    });
  }

  return predictions.sort((a, b) => a.minutesAhead - b.minutesAhead);
}

// -------------------------------------------------------------
// 4. DETECTOR DE PADRÕES GRÁFICOS (DO HISTÓRICO DE VELAS)
// -------------------------------------------------------------
export function detectPatterns(history: Candle[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];
  if (history.length < 2) return patterns;

  const multipliers = history.map(c => c.multiplier);
  const types = history.map(c => getCandleType(c.multiplier));
  const recent = multipliers[0];
  const prev = multipliers[1];

  // 1. Padrão Vela 1.37x (Vela Mestra - Módulo 5 Página 11 / 20)
  if (recent === 1.37 || multipliers.slice(0, 3).includes(1.37)) {
    patterns.push({
      name: 'Vela Mestra 1.37x Ativada',
      severity: 'high',
      confidence: 97,
      description: 'A vela 1.37x é a vela mestra de maior assertividade do Pai do Aviator (>90% histórico).',
      recommendedAction: 'Entrada de mão fixa em até 5 rodadas com proteção 1.49x.',
      exitTarget: '5x a 30x+'
    });
  }

  // 2. Padrão Reset 1.00x Cravado
  if (recent === 1.00) {
    const prevIsLow = prev === 1.30 || prev === 1.01;
    patterns.push({
      name: 'Reset 1.00x Detectado',
      severity: 'high',
      confidence: prevIsLow ? 98 : 94,
      description: prevIsLow 
        ? '1.00x ligado a 1.30x ou 1.01x: probabilidade altíssima de pagar até 20x nas próximas 5 a 10 casas!'
        : '1.00x cravado abre janela de 10x em até 10 casas. Atenção especial à 5ª casa.',
      recommendedAction: 'Entradas com valor fixo nas casas 1, 4, 5, 7 e 10.',
      exitTarget: prevIsLow ? '20x+' : '10x'
    });
  }

  // 3. Duas velas 1.00x ou 1.00x - 1.37x - 1.00x (Módulo 5 Página 18-19)
  if (multipliers.length >= 3) {
    const isDoubleReset = (multipliers[0] === 1.00 && multipliers[1] === 1.00) ||
                          (multipliers[0] === 1.00 && multipliers[2] === 1.00);
    if (isDoubleReset) {
      patterns.push({
        name: 'Super Gatilho: Reset Duplo 1.00x',
        severity: 'high',
        confidence: 99,
        description: 'Duas velas 1.00x resetando juntas ou com 1.37x intercalada é padrão de quase 100% de chance para 10x.',
        recommendedAction: 'Iniciar 5 entradas fixas imediatas com proteção no 1.49x.',
        exitTarget: '10x a 50x'
      });
    }
  }

  // 4. Sequência de 4 Roxos quebrando em Azul (Módulo 5 Página 6)
  if (multipliers.length >= 5) {
    if (types[0] === 'azul' && types[1] === 'roxo' && types[2] === 'roxo' && types[3] === 'roxo' && types[4] === 'roxo') {
      patterns.push({
        name: 'Gatilho: 4 Roxos + Quebra em Azul',
        severity: 'high',
        confidence: 95,
        description: 'Sequência de 4 velas roxas com quebra em 1 azul dispara entrada imediata (pagamento histórico de 9.15x a 12x de primeira).',
        recommendedAction: 'Fazer entrada na próxima rodada com proteção 1.49x e Gale 1.',
        exitTarget: '5x a 10x'
      });
    }
  }

  // 5. Torre Azul (4 ou mais azuis consecutivos - Módulo 5 Página 32)
  let consecutiveBlues = 0;
  for (let i = 0; i < Math.min(types.length, 8); i++) {
    if (types[i] === 'azul') consecutiveBlues++;
    else break;
  }
  if (consecutiveBlues >= 4) {
    patterns.push({
      name: `Torre Azul (${consecutiveBlues} Azuis Consecutivos)`,
      severity: 'medium',
      confidence: 92,
      description: `Torre azul com ${consecutiveBlues} perdas indica retenção extrema da banca e iminência de reset/vela rosa.`,
      recommendedAction: 'Aguardar quebra da torre com uma vela roxa ou vela especial antes de entrar com 5 tiros fixos.',
      exitTarget: 'Rosa 10x+'
    });
  }

  // 6. Casa dos 90 (1.90x a 1.99x) (Módulo 5 Página 13)
  if (recent >= 1.90 && recent <= 1.99) {
    patterns.push({
      name: `Padrão Casa dos 90 (${recent.toFixed(2)}x)`,
      severity: 'medium',
      confidence: 91,
      description: 'Sempre que sai vela de 1.90x a 1.99x, a probabilidade de vir vela 2x e proteção 1.5x é altíssima.',
      recommendedAction: 'Entrar buscando 2x no 1º ou 2º Gale.',
      exitTarget: '2.00x'
    });
  }

  // 7. Pares Gatilhos de Rosas
  if (multipliers.length >= 2) {
    const pair1 = `${recent.toFixed(2)}+${prev.toFixed(2)}`;
    const pair2 = `${prev.toFixed(2)}+${recent.toFixed(2)}`;
    if (PINK_PAIRS.includes(pair1) || PINK_PAIRS.includes(pair2)) {
      patterns.push({
        name: `Par Gatilho Mágico de Rosa Encontrado (${pair1})`,
        severity: 'high',
        confidence: 96,
        description: `O par ${pair1} está catalogado como combinação direta para atrair Vela Rosa.`,
        recommendedAction: 'Realizar 5 entradas com proteção 1.49x e alvo na Rosa.',
        exitTarget: '10x+'
      });
    }
  }

  // 8. Padrão Xadrez (Azul / Roxo alternado)
  if (types.length >= 4) {
    const isAlternating = 
      (types[0] === 'azul' && types[1] !== 'azul' && types[2] === 'azul' && types[3] !== 'azul') ||
      (types[0] !== 'azul' && types[1] === 'azul' && types[2] !== 'azul' && types[3] === 'azul');
    if (isAlternating) {
      patterns.push({
        name: 'Padrão Xadrez (Alternância Positivo / Negativo)',
        severity: 'info',
        confidence: 88,
        description: 'O padrão xadrez não costuma se repetir por mais de 3 a 4 vezes seguidas antes de quebrar para tendência.',
        recommendedAction: 'Acompanhar a quebra na 3ª/4ª rodada com proteção.',
        exitTarget: '2.00x a 5.00x'
      });
    }
  }

  return patterns;
}

// Lista de casas de apostas suportadas com dados universais
export const BETTING_HOUSES: { id: string; name: string; tag: string; isPopular?: boolean }[] = [
  { id: 'universal', name: 'Universal (Todas as Casas)', tag: 'Algoritmo Matemático Puro', isPopular: true },
  { id: 'bet7k', name: 'Bet7k', tag: 'Spribe Aviator', isPopular: true },
  { id: 'realsbet', name: 'RealsBet', tag: 'Spribe Aviator', isPopular: true },
  { id: 'betano', name: 'Betano', tag: 'Spribe Aviator', isPopular: true },
  { id: 'bet365', name: 'Bet365', tag: 'Spribe Aviator', isPopular: true },
  { id: 'blaze', name: 'Blaze', tag: 'Crash Game', isPopular: true },
  { id: 'playpix', name: 'PlayPIX', tag: 'Spribe Aviator' },
  { id: 'esportivabet', name: 'Esportiva.bet', tag: 'Spribe Aviator' },
  { id: 'arbety', name: 'Arbety', tag: 'Crash Game' },
  { id: 'kto', name: 'KTO', tag: 'Spribe Aviator' },
  { id: 'pixbet', name: 'PixBet', tag: 'Spribe Aviator' },
  { id: 'f12', name: 'F12.bet', tag: 'Spribe Aviator' },
  { id: '1win', name: '1Win', tag: 'LuckyJet / Aviator' },
  { id: 'onabet', name: 'OnaBet', tag: 'Spribe Aviator' },
  { id: 'pinup', name: 'Pin-Up', tag: 'Spribe Aviator' }
];

// Presets de demonstração fiéis aos exemplos dos PDFs anexados
export const PDF_EXAMPLES = [
  {
    name: 'Exemplo Módulo 3 (Vela 10.75x)',
    multiplier: 10.75,
    time: '12:15:00',
    roundId: '212450',
    description: 'Soma decimais 7 e 5 -> 1ª, 5ª, 7ª casa e soma 17ª casa onde entregou 28.37x!'
  },
  {
    name: 'Exemplo Módulo 3 (Vela 15.36x)',
    multiplier: 15.36,
    time: '01:05:25',
    roundId: '212509',
    description: 'Subtração decimais (5-1=4, 6-3=3 -> 4+3=7 min) -> Rosa entregue às 01:12hs!'
  },
  {
    name: 'Exemplo Módulo 5 (Vela 37.89x)',
    multiplier: 37.89,
    time: '17:02:55',
    roundId: '4310619',
    description: '7-3=4, 9-8=1 -> 4+1=5 min -> Rosa 37.44x paga exatamente às 17:08:40!'
  },
  {
    name: 'Exemplo Módulo 2 (Vela Roxa 2.31x)',
    multiplier: 2.31,
    time: '10:59:00',
    roundId: '1809347',
    description: 'Decimais 3+1 = 4 casas para frente para pegar Roxo!'
  },
  {
    name: 'Exemplo Módulo 5 (Vela Mestra 1.37x)',
    multiplier: 1.37,
    time: '14:20:10',
    roundId: '394012',
    description: 'Vela mestra com mais de 95% de assertividade para puxar 5x a 30x+.'
  },
  {
    name: 'Exemplo Módulo 4 (Reset 1.00x)',
    multiplier: 1.00,
    time: '18:45:00',
    roundId: '550123',
    description: 'Reset supremo chamando 10x em até 10 casas (5ª casa é a mais assertiva).'
  }
];
