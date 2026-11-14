/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SignalType = 'roxa' | 'rosa' | 'super';
export type ConfidenceLevel = 'alta' | 'maxima';

export interface FutureSignal {
  id: string;
  type: SignalType;
  badge: string; // e.g., "Roxa", "Rosa", "Super 100x+"
  targetTime: string; // HH:MM or HH:MM:SS
  window: string; // e.g. "±1 min" or "14:15 - 14:16"
  targetMultiplier: string; // "2.00x+", "10.00x+", "50.00x - 100x+"
  ruleName: string; // e.g. "Dígito da Rodada (Módulo 5, pág 2)"
  calculationDetails: string;
  recommendedHouses: string[];
  protection: string; // e.g. "1.49x Obrigatória"
  confidence: ConfidenceLevel;
  hotMinute?: boolean;
}

export interface InputState {
  roundNumber: string;
  multiplier: string;
  time: string;
  selectedHouse: string;
}

export interface CalculationResult {
  signals: FutureSignal[];
  isPeakHour: boolean;
  peakHourNote?: string;
  matchedTrigger?: TriggerCandle;
  specialNotes: string[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputs: InputState;
  signalsCount: number;
  topSignal: string;
}

export interface TriggerCandle {
  candle: number;
  description: string;
  payoutExpectation: string;
  houses: string;
  module: string;
}

export interface SpecialPair {
  name: string;
  rule: string;
  target: string;
}

export interface ExtractedCandle {
  multiplier: number;
  color: string;
  roundNumber?: string;
  time?: string;
  firstDecimal: number;
  decimals: string;
}

export interface ScreenshotAnalysisResult {
  latestMultiplier: number;
  latestRoundNumber?: string;
  detectedTime?: string;
  detectedPlatform?: string;
  decimalAnalysis?: string;
  patternsFound: string[];
  candles: ExtractedCandle[];
}
