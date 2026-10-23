import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CandleHistoryBar } from './components/CandleHistoryBar';
import { LiveSignalsTab } from './components/LiveSignalsTab';
import { ScreenshotUploader } from './components/ScreenshotUploader';
import { CalculatorsTab } from './components/CalculatorsTab';
import { BankrollManagerTab } from './components/BankrollManagerTab';
import { AIMentorTab } from './components/AIMentorTab';
import { StudyGuideTab } from './components/StudyGuideTab';
import { useSoundAlerts } from './hooks/useSoundAlerts';
import { usePushNotifications } from './hooks/usePushNotifications';
import {
  AviatorCandle,
  analyzeCycle,
  detectPatterns,
  getCandleColor,
} from './services/aviatorEngine';
import { WifiOff, Shield } from 'lucide-react';

export default function App() {
  // Sound alerts hook
  const { isMuted, toggleMute, playSignalSound, playPinkAlert, playDangerAlert } =
    useSoundAlerts();

  // Push notifications hook
  const { isGranted, requestPermission, sendPushNotification } =
    usePushNotifications();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('signals');

  // Network online state for PWA compliance
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial candles demonstrating live pattern recognition from the PDF
  const [candles, setCandles] = useState<AviatorCandle[]>([
    { id: 'c1', value: 2.18, color: 'purple', timestamp: '14:20:10', roundId: '4310501' },
    { id: 'c2', value: 1.45, color: 'blue', timestamp: '14:20:35', roundId: '4310502' },
    { id: 'c3', value: 3.42, color: 'purple', timestamp: '14:21:05', roundId: '4310503' },
    { id: 'c4', value: 6.80, color: 'purple', timestamp: '14:21:40', roundId: '4310504' },
    { id: 'c5', value: 1.15, color: 'blue', timestamp: '14:22:00', roundId: '4310505' },
    { id: 'c6', value: 1.37, color: 'blue', timestamp: '14:22:25', roundId: '4310506' },
  ]);

  // Derived cycle state
  const cycle = useMemo(() => analyzeCycle(candles), [candles]);

  // Derived signals
  const signals = useMemo(() => detectPatterns(candles), [candles]);

  // Handlers for candle updates
  const handleAddCandle = (val: number) => {
    const d = new Date();
    const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
    const newCandle: AviatorCandle = {
      id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      value: val,
      color: getCandleColor(val),
      timestamp: timeStr,
    };
    setCandles((prev) => [...prev.slice(-35), newCandle]); // maintain last 36
  };

  const handleRemoveCandle = (id: string) => {
    setCandles((prev) => prev.filter((c) => c.id !== id));
  };

  const handleClearCandles = () => {
    setCandles([]);
  };

  const handleLoadPreset = (presetCandles: AviatorCandle[]) => {
    setCandles(presetCandles);
    playSignalSound();
  };

  const handleImportFromOCR = (importedCandles: AviatorCandle[]) => {
    setCandles((prev) => [...prev, ...importedCandles].slice(-40));
    setActiveTab('signals');
    playSignalSound();
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-zinc-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isMuted={isMuted}
        toggleMute={toggleMute}
        isPushGranted={isGranted}
        requestPush={requestPermission}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSignalsCount={signals.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Offline notification badge */}
        {!isOnline && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>Modo Offline Ativo — O PWA e todas as calculadoras continuam operando normalmente sem internet.</span>
          </div>
        )}

        {/* Global Candle History Bar */}
        <CandleHistoryBar
          candles={candles}
          cycle={cycle}
          onAddCandle={handleAddCandle}
          onRemoveCandle={handleRemoveCandle}
          onClearCandles={handleClearCandles}
          onLoadPreset={handleLoadPreset}
        />

        {/* Dynamic Tab Views */}
        {activeTab === 'signals' && (
          <LiveSignalsTab
            signals={signals}
            cycle={cycle}
            candles={candles}
            onPlaySignal={playSignalSound}
            onPlayPink={playPinkAlert}
            onPlayDanger={playDangerAlert}
            sendPush={sendPushNotification}
            onAddCandle={handleAddCandle}
          />
        )}

        {activeTab === 'screenshot' && (
          <ScreenshotUploader
            onImportCandles={handleImportFromOCR}
            onPlaySignal={playSignalSound}
          />
        )}

        {activeTab === 'calculators' && <CalculatorsTab />}

        {activeTab === 'bankroll' && <BankrollManagerTab />}

        {activeTab === 'mentor' && (
          <AIMentorTab candles={candles} cycle={cycle} />
        )}

        {activeTab === 'studies' && <StudyGuideTab />}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800 bg-zinc-950 py-5 text-center text-xs text-zinc-400 space-y-2">
        <div className="flex items-center justify-center gap-2 text-zinc-400">
          <Shield className="w-4 h-4 text-rose-500" />
          <span>Aviator AI Pro • Baseado nos estudos e mentoria oficial Pai do Aviator</span>
        </div>
        <p className="text-[11px] text-zinc-400 max-w-xl mx-auto px-4">
          Aviso de responsabilidade: Apostas envolvem risco financeiro. Os cálculos matemáticos e padrões estatísticos não garantem lucros futuros. Nunca arrisque capital essencial. +18.
        </p>
      </footer>
    </div>
  );
}
