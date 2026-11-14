import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Zap,
  Clock,
  Target,
  Hash,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  TrendingUp,
  Share2,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Volume2,
  VolumeX,
  Layers,
  History as HistoryIcon,
  Flame
} from 'lucide-react';

import { InputState, CalculationResult, HistoryEntry } from './types';
import { calculateFutureSignals, formatSignalsForClipboard, formatMinutesOnly } from './utils/engine';
import { SUPPORTED_HOUSES } from './utils/triggerList';
import { PredictionCard } from './components/PredictionCard';
import { OddsCasasTrack } from './components/OddsCasasTrack';
import { TriggerCatalogModal } from './components/TriggerCatalogModal';
import { BankrollManagerModal } from './components/BankrollManagerModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ScreenshotUploadScanner } from './components/ScreenshotUploadScanner';

export default function App() {
  // Current time helper
  const getNowTimeString = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };

  // Form inputs
  const [inputs, setInputs] = useState<InputState>({
    roundNumber: '948275',
    multiplier: '12.45',
    time: getNowTimeString(),
    selectedHouse: 'Qualquer Casa (Universal)',
  });

  const [activeTab, setActiveTab] = useState<'todos' | 'roxa' | 'rosa' | 'super'>('todos');
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedMinutes, setCopiedMinutes] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showBankroll, setShowBankroll] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play subtle audio beep on calculation or copy
  const playFeedbackSound = (freq = 880, duration = 0.1) => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {
      // AudioContext unavailable or blocked
    }
  };

  // Calculate whenever inputs change
  const results: CalculationResult = useMemo(() => {
    const m = parseFloat(inputs.multiplier) || 2.0;
    return calculateFutureSignals(
      inputs.roundNumber,
      m,
      inputs.time,
      inputs.selectedHouse
    );
  }, [inputs]);

  // Filter signals
  const filteredSignals = useMemo(() => {
    if (activeTab === 'todos') return results.signals;
    return results.signals.filter((s) => s.type === activeTab);
  }, [results, activeTab]);

  // Add to history when user calculates a new valid round
  const handleSaveToHistory = () => {
    if (!inputs.multiplier || !inputs.time) return;
    const newEntry: HistoryEntry = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      inputs: { ...inputs },
      signalsCount: results.signals.length,
      topSignal: results.signals[0] ? `${results.signals[0].targetMultiplier} às ${results.signals[0].targetTime}` : '---'
    };
    setHistory((prev) => [newEntry, ...prev.slice(0, 9)]);
  };

  // Auto-fill current system time
  const handleSetCurrentTime = () => {
    const t = getNowTimeString();
    setInputs((prev) => ({ ...prev, time: t }));
    playFeedbackSound(660, 0.08);
  };

  // Quick preset loader
  const handleLoadPreset = (multiplier: number, roundNum?: string) => {
    setInputs((prev) => ({
      ...prev,
      multiplier: multiplier.toString(),
      roundNumber: roundNum || prev.roundNumber,
      time: getNowTimeString()
    }));
    playFeedbackSound(750, 0.1);
  };

  // Copy entire VIP signal card
  const handleCopyAll = () => {
    const text = formatSignalsForClipboard(results);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    playFeedbackSound(980, 0.15);

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#ec4899', '#a855f7', '#f59e0b', '#3b82f6']
    });

    handleSaveToHistory();
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // Copy plain minutes list (e.g., "14:15 | 14:18 | 14:24 | 14:40")
  const handleCopyMinutes = () => {
    const text = formatMinutesOnly(results);
    navigator.clipboard.writeText(text);
    setCopiedMinutes(true);
    playFeedbackSound(980, 0.12);
    setTimeout(() => setCopiedMinutes(false), 2000);
  };

  // Copy single signal card handler
  const handleCopySingle = (text: string) => {
    navigator.clipboard.writeText(text);
    playFeedbackSound(920, 0.1);
  };

  // Apply data extracted from screenshot
  const handleApplyExtractedData = (data: {
    multiplier: number;
    roundNumber?: string;
    time?: string;
    house?: string;
  }) => {
    setInputs((prev) => {
      let matchedHouse = prev.selectedHouse;
      if (data.house) {
        const found = SUPPORTED_HOUSES.find((h) =>
          h.toLowerCase().includes(data.house!.toLowerCase())
        );
        if (found) matchedHouse = found;
      }

      return {
        ...prev,
        multiplier: data.multiplier.toString(),
        roundNumber: data.roundNumber || prev.roundNumber,
        time: data.time || prev.time,
        selectedHouse: matchedHouse,
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pink-500 selection:text-white pb-12">
      <OfflineIndicator />

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-pink-600 via-purple-600 to-amber-500 flex items-center justify-center shadow-lg shadow-pink-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  RADAR AVIATOR <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300">PRO</span>
                </h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Baseado nos 5 Módulos Oficiais do &quot;Pai do Aviator&quot;
              </p>
            </div>
          </div>

          {/* Quick Actions & PWA Install */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition"
              title={soundEnabled ? 'Silenciar Sons' : 'Ativar Sons'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-pink-400" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowBankroll(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gestão 1.49x</span>
            </button>

            <button
              onClick={() => setShowCatalog(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:bg-purple-500/20 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Catálogo</span>
              <span className="sm:hidden">Regras</span>
            </button>

            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* SUB-BANNER: Peak Hours Indicator */}
      <div className="border-b border-slate-800/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 py-2 px-4 text-xs">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className={`w-2 h-2 rounded-full ${results.isPeakHour ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="font-semibold">
              Mercado Atual: {results.isPeakHour ? '🔥 Horário Quente / Pagador' : '⚡ Horário Regular'}
            </span>
            <span className="text-slate-500 hidden md:inline">|</span>
            <span className="text-slate-400 hidden md:inline">
              Horários de Ouro: 06-09h • 13-14h • 16:30-17:40h • 20-21h • 00-02h
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-pink-400 font-medium">
            <Target className="w-3.5 h-3.5" />
            <span>Funciona em qualquer Casa (Algoritmo Spribe)</span>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* SCREENSHOT & DECIMAL SCANNER (NOVO CAMPO PARA COLAR PRINT) */}
        <ScreenshotUploadScanner
          onApplyExtractedData={handleApplyExtractedData}
          playFeedbackSound={playFeedbackSound}
        />

        {/* INPUT FORM CARD */}
        <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Leitor & Calculadora de Velas Futuras
              </h2>
              <p className="text-xs text-slate-400">
                Digite a <strong>Rodada</strong>, a <strong>Vela</strong> atual e a <strong>Hora</strong> exata para projetar as próximas Roxas, Rosas e Super 100x+.
              </p>
            </div>

            {/* Selected House Indicator */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
              <span className="text-slate-500">Casa:</span>
              <select
                value={inputs.selectedHouse}
                onChange={(e) => setInputs((prev) => ({ ...prev, selectedHouse: e.target.value }))}
                className="bg-transparent font-bold text-white focus:outline-none cursor-pointer"
              >
                {SUPPORTED_HOUSES.map((h) => (
                  <option key={h} value={h} className="bg-slate-900 text-white">
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Inputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            {/* Input 1: Rodada */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-pink-400" />
                  Número da Rodada (ID)
                </span>
                <span className="text-[10px] text-slate-500">Módulo 5: Último dígito</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputs.roundNumber}
                  onChange={(e) => setInputs((prev) => ({ ...prev, roundNumber: e.target.value }))}
                  placeholder="Ex: 948275 ou 875"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition"
                />
                {inputs.roundNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                    Final: {inputs.roundNumber.trim().slice(-1)}
                  </span>
                )}
              </div>
            </div>

            {/* Input 2: Vela */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Target className="w-3.5 h-3.5 text-purple-400" />
                  Vela Atual (Multiplicador)
                </span>
                <span className="text-[10px] text-slate-500">Ex: 12.45x, 1.37x</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputs.multiplier}
                  onChange={(e) => setInputs((prev) => ({ ...prev, multiplier: e.target.value }))}
                  placeholder="Ex: 12.45"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                  X
                </span>
              </div>
            </div>

            {/* Input 3: Hora */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Hora da Vela (HH:MM)
                </span>
                <button
                  type="button"
                  onClick={handleSetCurrentTime}
                  className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                >
                  <RotateCcw className="w-3 h-3" /> Usar Agora
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputs.time}
                  onChange={(e) => setInputs((prev) => ({ ...prev, time: e.target.value }))}
                  placeholder="Ex: 14:10 ou 14:10:25"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-bold text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets / Test Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              Gatilhos Rápidos dos PDFs:
            </span>

            <button
              onClick={() => handleLoadPreset(1.37, '841293')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              1.37x (Módulo 4)
            </button>
            <button
              onClick={() => handleLoadPreset(1.88, '592305')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
            >
              1.88x (Puxa Rosa)
            </button>
            <button
              onClick={() => handleLoadPreset(1.00, '310920')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 transition"
            >
              1.00x (Reset 10 Casas)
            </button>
            <button
              onClick={() => handleLoadPreset(37.89, '774128')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-pink-950/40 hover:bg-pink-900/40 text-pink-300 border border-pink-800/40 transition"
            >
              37.89x (Regra dos 13)
            </button>
            <button
              onClick={() => handleLoadPreset(102.45, '994820')}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border border-amber-800/40 transition"
            >
              102.45x (Super 100x+)
            </button>
          </div>
        </div>

        {/* SUMMARY / COPY CONTROLS BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1.5">
              <span className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-300">
                🟣
              </span>
              <span className="w-7 h-7 rounded-full bg-pink-600/30 border border-pink-500/50 flex items-center justify-center text-xs font-bold text-pink-300">
                🌸
              </span>
              <span className="w-7 h-7 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-xs font-bold text-amber-300">
                👑
              </span>
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {results.signals.length} Projeções Calculadas
              </div>
              <div className="text-xs text-slate-400">
                Gatilho: <strong className="text-pink-400">{inputs.multiplier}x</strong> às{' '}
                <strong className="text-amber-300">{inputs.time}</strong>
              </div>
            </div>
          </div>

          {/* Action Copy Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyMinutes}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
              title="Copiar lista simples de horários/minutos"
            >
              {copiedMinutes ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Horários Copiados!</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copiar Apenas Minutos</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-600/25 active:scale-95 transition cursor-pointer"
              title="Copiar todos os sinais formatados para Telegram / WhatsApp"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Sinais Copiados p/ Grupo VIP!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Todos os Sinais (VIP)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ODD CASAS TRACKER (Regra dos 13 & 1.00x Reset) */}
        <OddsCasasTrack lastMultiplier={parseFloat(inputs.multiplier) || 0} />

        {/* SIGNALS SECTION */}
        <div className="space-y-4">
          {/* Filter Tabs */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'todos'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todas ({results.signals.length})
              </button>
              <button
                onClick={() => setActiveTab('super')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'super'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-amber-400 hover:text-amber-300'
                }`}
              >
                👑 Super Altas (100x+)
              </button>
              <button
                onClick={() => setActiveTab('rosa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'rosa'
                    ? 'bg-pink-600 text-white shadow-md shadow-pink-600/20'
                    : 'text-pink-400 hover:text-pink-300'
                }`}
              >
                🌸 Rosas (10x - 30x)
              </button>
              <button
                onClick={() => setActiveTab('roxa')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  activeTab === 'roxa'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-purple-400 hover:text-purple-300'
                }`}
              >
                🟣 Roxas (2x - 5x)
              </button>
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Proteção Obrigatória: <strong className="text-emerald-400">1.49x / 1.50x</strong>
            </span>
          </div>

          {/* Prediction Cards Grid */}
          {filteredSignals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSignals.map((sig) => (
                <PredictionCard
                  key={sig.id}
                  signal={sig}
                  onCopyText={handleCopySingle}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400">
              <p className="text-sm">Nenhum sinal encontrado para esta categoria.</p>
              <button
                onClick={() => setActiveTab('todos')}
                className="mt-2 text-xs text-pink-400 hover:underline"
              >
                Mostrar todos os sinais
              </button>
            </div>
          )}
        </div>

        {/* HISTORIC SAVED SIGNALS */}
        {history.length > 0 && (
          <div className="rounded-2xl p-4 bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-3">
              <HistoryIcon className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Histórico de Rodadas Analisadas
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setInputs(item.inputs);
                    playFeedbackSound(700, 0.08);
                  }}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 cursor-pointer transition text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-white">{item.inputs.multiplier}x</span>
                    <span className="text-slate-500 ml-1.5">({item.inputs.time})</span>
                  </div>
                  <span className="text-[11px] text-pink-400 font-semibold">{item.topSignal}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM QUICK GUIDE ACCORDION */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/50 border border-slate-800/70 text-xs text-slate-400 space-y-2">
          <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-pink-400" />
            Como aplicar os sinais em qualquer casa de aposta:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-300">
            <li>
              <strong>Entrada Dupla:</strong> Mão 1 configurada em cashout automático <strong>1.50x</strong> (cobre o valor de ambas as apostas). Mão 2 busca a vela <strong>Rosa (10x)</strong> ou <strong>Super 100x+</strong> sem risco.
            </li>
            <li>
              <strong>Janela de Horário:</strong> Entre 1 minuto antes ou no minuto exato indicado no card. O algoritmo Spribe oscila em ciclos de tolerância de ±1 min.
            </li>
            <li>
              <strong>Regra das Casas Ímpares:</strong> Após velas altas (+30x), dê prioridade para apostar nas rodadas <strong>1, 3, 5, 7, 9, 11 e 13</strong>.
            </li>
            <li>
              <strong>Gestão Rígida:</strong> Se houver 3 perdas seguidas, respeite o Stop Loss e retorne no próximo horário de pico.
            </li>
          </ol>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <p>
          Radar Aviator PWA • Baseado nos métodos matemáticos dos 5 Módulos Oficiais • Jogue com responsabilidade (+18)
        </p>
      </footer>

      {/* MODALS */}
      <TriggerCatalogModal
        isOpen={showCatalog}
        onClose={() => setShowCatalog(false)}
        onSelectTrigger={(c) => handleLoadPreset(c)}
      />

      <BankrollManagerModal
        isOpen={showBankroll}
        onClose={() => setShowBankroll(false)}
      />
    </div>
  );
}
