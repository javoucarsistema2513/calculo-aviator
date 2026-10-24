import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { CandleInput } from './components/CandleInput';
import { PredictionResults } from './components/PredictionResults';
import { HistoricFeed } from './components/HistoricFeed';
import { TriggersCheatsheet } from './components/TriggersCheatsheet';
import { RiskManagementModal } from './components/RiskManagementModal';
import { Candle, RiskProfile } from './types/aviator';
import {
  calculateHousePredictions,
  calculateImmediateTimePredictions,
  calculateLongTermHorizons,
  detectPatterns,
  formatTime,
  PDF_EXAMPLES,
} from './utils/aviatorCalculations';
import {
  Calculator,
  BookOpen,
  ShieldCheck,
  Flame,
  Info,
  Layers,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

const INITIAL_DEMO_CANDLES: Candle[] = [
  { id: '1', multiplier: 10.75, time: '12:15:00', roundId: '4310619', timestamp: Date.now() - 60000 },
  { id: '2', multiplier: 2.31, time: '12:14:40', roundId: '4310618', timestamp: Date.now() - 80000 },
  { id: '3', multiplier: 1.37, time: '12:14:15', roundId: '4310617', timestamp: Date.now() - 105000 },
  { id: '4', multiplier: 1.00, time: '12:13:50', roundId: '4310616', timestamp: Date.now() - 130000 },
  { id: '5', multiplier: 3.42, time: '12:13:20', roundId: '4310615', timestamp: Date.now() - 160000 },
  { id: '6', multiplier: 1.88, time: '12:12:55', roundId: '4310614', timestamp: Date.now() - 185000 },
  { id: '7', multiplier: 15.36, time: '12:12:30', roundId: '4310613', timestamp: Date.now() - 210000 },
  { id: '8', multiplier: 1.24, time: '12:12:05', roundId: '4310612', timestamp: Date.now() - 235000 },
  { id: '9', multiplier: 2.82, time: '12:11:40', roundId: '4310611', timestamp: Date.now() - 260000 },
  { id: '10', multiplier: 37.89, time: '12:11:10', roundId: '4310610', timestamp: Date.now() - 290000 },
  { id: '11', multiplier: 1.08, time: '12:10:45', roundId: '4310609', timestamp: Date.now() - 315000 },
  { id: '12', multiplier: 1.15, time: '12:10:20', roundId: '4310608', timestamp: Date.now() - 340000 },
];

export default function App() {
  // Application State
  const [selectedHouse, setSelectedHouse] = useState<string>('universal');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeMainTab, setActiveMainTab] = useState<'calculadora' | 'catalogo' | 'gestao'>('calculadora');
  const [isRiskModalOpen, setIsRiskModalOpen] = useState<boolean>(false);

  // Active Multiplier & Calculation inputs
  const [currentMultiplier, setCurrentMultiplier] = useState<number>(10.75);
  const [baseTime, setBaseTime] = useState<string>(formatTime(new Date()));
  const [currentRoundId, setCurrentRoundId] = useState<string>('4310619');

  // Candle History (Persisted to localStorage for offline persistence)
  const [candles, setCandles] = useState<Candle[]>(() => {
    try {
      const saved = localStorage.getItem('aviator_predictor_candles');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_DEMO_CANDLES;
  });

  // Risk profile (Bankroll & goals)
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(() => {
    try {
      const saved = localStorage.getItem('aviator_risk_profile');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {
      bankroll: 200,
      dailyGoal: 30, // R$ 30/dia preset
      baseBet: 2.00,
      stopLoss: 40,
      stopWin: 30,
      protectionMultiplier: 1.49,
      maxGales: 2,
    };
  });

  // Save candles to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('aviator_predictor_candles', JSON.stringify(candles));
    } catch {
      // Ignore
    }
  }, [candles]);

  // Save risk profile to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('aviator_risk_profile', JSON.stringify(riskProfile));
    } catch {
      // Ignore
    }
  }, [riskProfile]);

  // Audio Chime synthesizer via pure Web Audio (works 100% offline, no network asset needed)
  const playSignalSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore audio failure
    }
  }, [soundEnabled]);

  // Mathematical Predictions Calculations
  const housePredictions = useMemo(() => {
    return calculateHousePredictions(currentMultiplier);
  }, [currentMultiplier]);

  const immediateTimePredictions = useMemo(() => {
    return calculateImmediateTimePredictions(currentMultiplier, baseTime, currentRoundId);
  }, [currentMultiplier, baseTime, currentRoundId]);

  const sevenHoursPredictions = useMemo(() => {
    return calculateLongTermHorizons(currentMultiplier, baseTime, '7h');
  }, [currentMultiplier, baseTime]);

  const twelveHoursPredictions = useMemo(() => {
    return calculateLongTermHorizons(currentMultiplier, baseTime, '12h');
  }, [currentMultiplier, baseTime]);

  const twentyFourHoursPredictions = useMemo(() => {
    return calculateLongTermHorizons(currentMultiplier, baseTime, '24h');
  }, [currentMultiplier, baseTime]);

  // Pattern detection across candle history
  const detectedPatterns = useMemo(() => {
    return detectPatterns(candles);
  }, [candles]);

  // Handlers
  const handleCalculate = (multiplier: number, time: string, roundId?: string) => {
    setCurrentMultiplier(multiplier);
    setBaseTime(time || formatTime(new Date()));
    if (roundId) setCurrentRoundId(roundId);
    playSignalSound();
  };

  const handleClear = () => {
    setCurrentMultiplier(10.00);
    setBaseTime(formatTime(new Date()));
    setCurrentRoundId('');
  };

  const handleSelectCandleFromHistory = (candle: Candle) => {
    setCurrentMultiplier(candle.multiplier);
    setBaseTime(candle.time);
    if (candle.roundId) setCurrentRoundId(candle.roundId);
    setActiveMainTab('calculadora');
    playSignalSound();
  };

  const handleAddCandleToHistory = (multiplier: number, time?: string) => {
    const newCandle: Candle = {
      id: Date.now().toString(),
      multiplier,
      time: time || formatTime(new Date()),
      roundId: String(Math.floor(1000000 + Math.random() * 9000000)),
      timestamp: Date.now(),
    };
    setCandles([newCandle, ...candles]);
    setCurrentMultiplier(multiplier);
    setBaseTime(newCandle.time);
    playSignalSound();
  };

  const handleResetToDemo = () => {
    setCandles(INITIAL_DEMO_CANDLES);
  };

  const handleClearHistory = () => {
    setCandles([]);
  };

  const handleLoadPdfPreset = (idx: number) => {
    const ex = PDF_EXAMPLES[idx];
    if (ex) {
      setCurrentMultiplier(ex.multiplier);
      setBaseTime(ex.time);
      setCurrentRoundId(ex.roundId);
      setActiveMainTab('calculadora');
      playSignalSound();
    }
  };

  return (
    <div className="min-h-screen bg-[#090a10] text-gray-100 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        selectedHouse={selectedHouse}
        onSelectHouse={setSelectedHouse}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenRiskModal={() => setIsRiskModalOpen(true)}
        onLoadExample={handleLoadPdfPreset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-4">
        
        {/* Navigation Tabs (Calculadora, Catálogo, Gestão) */}
        <div className="flex items-center justify-between border-b border-gray-800/80 pb-2.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveMainTab('calculadora')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeMainTab === 'calculadora'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Calculator className="w-4 h-4 text-pink-300" />
              <span>Calculadora & Horizontes (7h / 12h / 24h)</span>
            </button>

            <button
              onClick={() => setActiveMainTab('catalogo')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                activeMainTab === 'catalogo'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/20'
                  : 'bg-gray-900/60 text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <BookOpen className="w-4 h-4 text-pink-300" />
              <span>Gatilhos & Segredos</span>
            </button>

            <button
              onClick={() => setIsRiskModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gray-900/60 text-yellow-300 hover:bg-yellow-950/40 border border-yellow-500/20 transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-yellow-400" />
              <span>Meta: R$ {riskProfile.dailyGoal}/dia</span>
            </button>
          </div>

          <div className="text-[11px] text-gray-400 hidden lg:block">
            Universal para Spribe Aviator & Crash
          </div>
        </div>

        {/* Tab 1: Calculadora & Horizontes */}
        {activeMainTab === 'calculadora' && (
          <div className="space-y-4">
            
            {/* Round History Feed Bar */}
            <HistoricFeed
              candles={candles}
              detectedPatterns={detectedPatterns}
              onSelectCandle={handleSelectCandleFromHistory}
              onAddCandle={handleAddCandleToHistory}
              onClearHistory={handleClearHistory}
              onResetToDemoHistory={handleResetToDemo}
            />

            {/* Input Form */}
            <CandleInput
              currentMultiplier={currentMultiplier}
              currentTime={baseTime}
              currentRoundId={currentRoundId}
              onCalculate={handleCalculate}
              onClear={handleClear}
            />

            {/* Prediction Results Display (7h, 12h, 24h, Houses) */}
            <PredictionResults
              currentMultiplier={currentMultiplier}
              baseTime={baseTime}
              housePredictions={housePredictions}
              immediateTimePredictions={immediateTimePredictions}
              sevenHoursPredictions={sevenHoursPredictions}
              twelveHoursPredictions={twelveHoursPredictions}
              twentyFourHoursPredictions={twentyFourHoursPredictions}
            />

          </div>
        )}

        {/* Tab 2: Catálogo de Gatilhos & Segredos */}
        {activeMainTab === 'catalogo' && (
          <div className="space-y-4">
            <TriggersCheatsheet
              onSelectTrigger={(val) => {
                setCurrentMultiplier(val);
                setActiveMainTab('calculadora');
                playSignalSound();
              }}
            />

            {/* Additional Reference from PDFs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5 mb-2">
                  <Flame className="w-4 h-4 text-pink-400" />
                  Estatística Geral do Gráfico
                </h4>
                <ul className="text-xs text-gray-300 space-y-1.5">
                  <li className="flex justify-between">
                    <span>Azuis (&lt; 2.00x):</span>
                    <span className="font-mono font-bold text-cyan-400">~60%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Roxos (2.00x - 9.99x):</span>
                    <span className="font-mono font-bold text-purple-400">~30%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Rosas (&ge; 10.00x):</span>
                    <span className="font-mono font-bold text-pink-400">~10%</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Velocidade de jogo:</span>
                    <span className="font-mono text-gray-400">~3 rodadas / min</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Minutos Fortes do Aviator
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  Minutos terminados com os números <strong className="text-pink-400">00, 05 e 09</strong> são estatisticamente os mais propensos a puxar velas altas (Módulo 4 pág. 50).
                </p>
                <div className="flex flex-wrap gap-1 font-mono text-[11px] text-emerald-300">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:00</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:05</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:09</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:10</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:15</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:19</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">:20</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
                <h4 className="font-bold text-white text-sm flex items-center gap-1.5 mb-2">
                  <Award className="w-4 h-4 text-yellow-400" />
                  Melhores Horários de Operação
                </h4>
                <div className="text-xs text-gray-300 space-y-1 font-mono">
                  <p>☀️ 06:00 às 09:00</p>
                  <p>🍲 13:00 às 14:00</p>
                  <p>🌆 16:30 às 17:40</p>
                  <p>🌙 20:00 às 21:00</p>
                  <p>🌌 00:00 às 02:00</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Risk Profile & Bankroll Modal */}
      <RiskManagementModal
        isOpen={isRiskModalOpen}
        onClose={() => setIsRiskModalOpen(false)}
        profile={riskProfile}
        onSaveProfile={setRiskProfile}
      />

      {/* Footer */}
      <footer className="border-t border-gray-800/80 py-4 px-6 text-center text-xs text-gray-500 bg-[#07080d]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Aviator Predictor Pro • 100% Offline & PWA • Algoritmo Universal Baseado nas Mentorias 1 a 5</span>
          <span className="text-gray-600">Jogue com responsabilidade • Sempre respeite seu stop loss e stop win</span>
        </div>
      </footer>

    </div>
  );
}
