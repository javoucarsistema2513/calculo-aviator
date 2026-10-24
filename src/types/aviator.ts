export type CandleType = 'azul' | 'roxo' | 'rosa' | 'rosa_alta';

export interface Candle {
  id: string;
  multiplier: number;
  time: string; // HH:mm:ss
  roundId?: string;
  timestamp: number;
}

export interface HousePrediction {
  house: number; // e.g. 4 houses ahead
  type: CandleType;
  expectedMinMultiplier: number;
  probability: number; // 0 - 100
  ruleName: string;
  explanation: string;
  isOdd: boolean;
}

export interface TimePrediction {
  targetTime: string; // HH:mm:ss
  minutesAhead: number;
  expectedTarget: '2x' | '5x' | '10x' | '50x' | '100x';
  probability: number;
  ruleSource: string;
  entryWindow: string; // e.g., "Entrar 15s antes até G1 (2 tiros)"
  protectionTip: string; // e.g., "Mão 1 saída em 1.49x, Mão 2 alvo 10x"
  horizon: 'imediato' | '7h' | '12h' | '24h';
}

export interface DetectedPattern {
  name: string;
  severity: 'high' | 'medium' | 'info';
  confidence: number;
  description: string;
  recommendedAction: string;
  exitTarget: string;
}

export interface BettingHouse {
  id: string;
  name: string;
  tag: string;
  isPopular?: boolean;
}

export interface RiskProfile {
  bankroll: number;
  dailyGoal: number;
  baseBet: number;
  stopLoss: number;
  stopWin: number;
  protectionMultiplier: number; // usually 1.49 or 2.0
  maxGales: number; // 1 or 2
}
