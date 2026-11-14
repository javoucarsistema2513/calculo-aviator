import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Flame, History, Search, Wallet } from 'lucide-react';
import { BancaMetasView } from './components/BancaMetasView';
import { BuscadorView } from './components/BuscadorView';
import { GatilhosCatalogoView } from './components/GatilhosCatalogoView';
import { HistoricoPadroesView } from './components/HistoricoPadroesView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { RealtimeAlertToast } from './components/RealtimeAlertsPanel';
import { SuperVelasPanel } from './components/SuperVelasPanel';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import {
  EntryMode,
  PaceMode,
  PayoutMood,
  RoundEntry,
  SearchLogItem,
  analyzeAviatorRound,
  getCurrentTimeStr,
} from './utils/aviatorEngine';

type ActiveTab = 'buscador' | 'supervelas' | 'historico' | 'gatilhos' | 'banca';

const STORAGE_KEYS = {
  house: 'aviator_radar_selected_house',
  customHouses: 'aviator_radar_custom_houses',
  historyMap: 'aviator_radar_history_by_house',
  searchLog: 'aviator_radar_search_log',
  paceMode: 'aviator_radar_pace_mode',
  paceByHouse: 'aviator_radar_pace_by_house',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function readSharedQueryParams(): {
  tab?: ActiveTab;
  house?: string;
  round?: string;
  mult?: string;
  time?: string;
  mode?: EntryMode;
  mood?: PayoutMood;
  pace?: PaceMode;
  sround?: string;
  smult?: string;
  sdate?: string;
  stime?: string;
  smood?: PayoutMood;
} {
  if (typeof window === 'undefined') return {};
  try {
    const sp = new URLSearchParams(window.location.search);
    const rawTab = sp.get('tab');
    const tab: ActiveTab | undefined = rawTab === 'supervelas' ? 'supervelas' : undefined;
    const house = sp.get('house')?.trim() || undefined;
    const round = sp.get('round')?.replace(/\D/g, '') || undefined;
    const mult = sp.get('mult')?.trim() || undefined;
    const time = sp.get('time')?.trim() || undefined;
    const rawMode = sp.get('mode');
    const mode: EntryMode | undefined =
      rawMode === 'antes' || rawMode === 'exato' ? rawMode : undefined;
    const rawMood = sp.get('mood');
    const mood: PayoutMood | undefined =
      rawMood === 'positivo' || rawMood === 'negativo' ? rawMood : undefined;
    const rawPace = sp.get('pace');
    const pace: PaceMode | undefined =
      rawPace === 'auto' || rawPace === 'rapido' || rawPace === 'padrao' || rawPace === 'lento'
        ? rawPace
        : undefined;
    const sround = sp.get('sround')?.replace(/\D/g, '') || undefined;
    const smult = sp.get('smult')?.trim() || undefined;
    const sdate = sp.get('sdate')?.trim() || undefined;
    const stime = sp.get('stime')?.trim() || undefined;
    const rawSmood = sp.get('smood');
    const smood: PayoutMood | undefined =
      rawSmood === 'positivo' || rawSmood === 'negativo' ? rawSmood : undefined;
    return { tab, house, round, mult, time, mode, mood, pace, sround, smult, sdate, stime, smood };
  } catch {
    return {};
  }
}

export default function App() {
  const [sharedInit] = useState(() => readSharedQueryParams());
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => sharedInit.tab || 'buscador');

  const [selectedHouse, setSelectedHouse] = useState<string>(
    () => sharedInit.house || readStorage(STORAGE_KEYS.house, 'Qualquer Casa (Universal)')
  );
  const [customHouses, setCustomHouses] = useState<string[]>(() => {
    const saved = readStorage<string[]>(STORAGE_KEYS.customHouses, []);
    if (sharedInit.house && !saved.includes(sharedInit.house)) {
      return [sharedInit.house, ...saved];
    }
    return saved;
  });
  const [historyByHouse, setHistoryByHouse] = useState<Record<string, RoundEntry[]>>(() =>
    readStorage(STORAGE_KEYS.historyMap, {})
  );
  const [searchLog, setSearchLog] = useState<SearchLogItem[]>(() =>
    readStorage(STORAGE_KEYS.searchLog, [])
  );
  const [customPaceByHouse, setCustomPaceByHouse] = useState<Record<string, number>>(() =>
    readStorage(STORAGE_KEYS.paceByHouse, {})
  );
  const [recentCandlesText, setRecentCandlesText] = useState('');
  const lastLiveSyncRef = useRef<{ house: string; tsMs: number; roundNum: number } | null>(null);

  // Main search inputs (supports shared URL params or Módulo 5 p.1 default)
  const [roundInput, setRoundInput] = useState(() => sharedInit.round || '4310524');
  const [multiplierInput, setMultiplierInput] = useState(() => sharedInit.mult || '12.56');
  const [timeInput, setTimeInput] = useState(() => sharedInit.time || getCurrentTimeStr());
  const [entryMode, setEntryMode] = useState<EntryMode>(() => sharedInit.mode || 'antes');
  const [payoutMood, setPayoutMood] = useState<PayoutMood>(() => sharedInit.mood || 'positivo');
  const [paceMode, setPaceMode] = useState<PaceMode>(
    () => sharedInit.pace || readStorage<PaceMode>(STORAGE_KEYS.paceMode, 'auto')
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.paceMode, JSON.stringify(paceMode));
    } catch {
      // ignore
    }
  }, [paceMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.paceByHouse, JSON.stringify(customPaceByHouse));
    } catch {
      // ignore
    }
  }, [customPaceByHouse]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.house, JSON.stringify(selectedHouse));
    } catch {
      // ignore storage quota errors
    }
  }, [selectedHouse]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customHouses, JSON.stringify(customHouses));
    } catch {
      // ignore
    }
  }, [customHouses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.historyMap, JSON.stringify(historyByHouse));
    } catch {
      // ignore
    }
  }, [historyByHouse]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.searchLog, JSON.stringify(searchLog));
    } catch {
      // ignore
    }
  }, [searchLog]);

  const houseHistory = useMemo(() => {
    return historyByHouse[selectedHouse] ?? [];
  }, [historyByHouse, selectedHouse]);

  const currentHouseCustomPace = customPaceByHouse[selectedHouse] ?? null;

  const analysis = useMemo(
    () =>
      analyzeAviatorRound({
        roundInput,
        multiplierInput,
        timeInput,
        entryMode,
        payoutMood,
        paceMode,
        customPaceSec: currentHouseCustomPace,
        recentCandlesText,
        houseName: selectedHouse,
        history: houseHistory,
      }),
    [
      roundInput,
      multiplierInput,
      timeInput,
      entryMode,
      payoutMood,
      paceMode,
      currentHouseCustomPace,
      recentCandlesText,
      selectedHouse,
      houseHistory,
    ]
  );

  const notif = useRealtimeNotifications();

  useEffect(() => {
    void notif.syncAutoSignals(selectedHouse, analysis.valid ? analysis.signals : []);
  }, [notif.autoMonitor, notif.leadSeconds, notif.syncAutoSignals, selectedHouse, analysis]);

  const handleAddCustomHouse = (name: string) => {
    setCustomHouses((prev) => (prev.includes(name) ? prev : [name, ...prev]));
  };

  const handleSetCustomPaceSec = (sec: number | null) => {
    setCustomPaceByHouse((prev) => {
      const next = { ...prev };
      if (sec === null) {
        delete next[selectedHouse];
      } else {
        next[selectedHouse] = Math.round(Math.max(12, Math.min(38, sec)) * 10) / 10;
      }
      return next;
    });
  };

  const handleSyncLiveRound = (): string => {
    const nowMs = Date.now();
    const curRound = parseInt(roundInput.replace(/\D/g, ''), 10) || 1;
    const nextRound = curRound + 1;
    const nowTime = getCurrentTimeStr();
    setRoundInput(String(nextRound));
    setTimeInput(nowTime);

    const prev = lastLiveSyncRef.current;
    lastLiveSyncRef.current = { house: selectedHouse, tsMs: nowMs, roundNum: nextRound };

    if (prev && prev.house === selectedHouse && nextRound > prev.roundNum) {
      const elapsedSec = (nowMs - prev.tsMs) / 1000;
      const roundsDiff = nextRound - prev.roundNum;
      const measuredPace = elapsedSec / roundsDiff;
      if (measuredPace >= 12 && measuredPace <= 38) {
        const existing = customPaceByHouse[selectedHouse];
        const nextPace = existing
          ? Math.round((existing * 0.55 + measuredPace * 0.45) * 10) / 10
          : Math.round(measuredPace * 10) / 10;
        handleSetCustomPaceSec(nextPace);
        if (paceMode !== 'auto') setPaceMode('auto');
        return `Rodada #${nextRound} sincronizada · Cadência de ${selectedHouse} calibrada para ${nextPace}s/rodada`;
      }
    }
    return `Rodada #${nextRound} sincronizada (${nowTime}). Toque novamente quando a próxima vela fechar para auto-calibrar ${selectedHouse}.`;
  };

  const handleRegisterRound = () => {
    if (!analysis.valid) return;
    const entry: RoundEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roundNumber: analysis.roundNumber,
      multiplier: analysis.multiplier,
      timeStr: analysis.timeStr,
      houseName: selectedHouse,
      createdAt: Date.now(),
    };
    setHistoryByHouse((prev) => ({
      ...prev,
      [selectedHouse]: [entry, ...(prev[selectedHouse] ?? [])].slice(0, 60),
    }));
  };

  const handleBatchAdd = (entries: RoundEntry[]) => {
    setHistoryByHouse((prev) => ({
      ...prev,
      [selectedHouse]: [...entries, ...(prev[selectedHouse] ?? [])].slice(0, 60),
    }));
  };

  const handleRemoveEntry = (id: string) => {
    setHistoryByHouse((prev) => ({
      ...prev,
      [selectedHouse]: (prev[selectedHouse] ?? []).filter((e) => e.id !== id),
    }));
  };

  const handleClearHouseHistory = () => {
    setHistoryByHouse((prev) => ({
      ...prev,
      [selectedHouse]: [],
    }));
  };

  const handleSaveToLog = () => {
    if (!analysis.valid) return;
    const summary = analysis.signals
      .slice(0, 2)
      .map((s) => `${s.title} (${s.targetTime})`)
      .join(' · ');
    const item: SearchLogItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      roundNumber: analysis.roundNumber,
      multiplier: analysis.multiplier,
      timeStr: analysis.timeStr,
      houseName: selectedHouse,
      topTargets: summary || 'Entrada direta',
      result: 'pending',
      createdAt: Date.now(),
    };
    setSearchLog((prev) => [item, ...prev].slice(0, 50));
  };

  const handleUpdateLogResult = (id: string, result: 'green' | 'loss' | 'pending') => {
    setSearchLog((prev) => prev.map((item) => (item.id === id ? { ...item, result } : item)));
  };

  const handleDeleteLogItem = (id: string) => {
    setSearchLog((prev) => prev.filter((item) => item.id !== id));
  };

  const navItems: { id: ActiveTab; label: string; mobileLabel: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'buscador', label: 'Buscador', mobileLabel: 'Buscador', icon: Search },
    { id: 'supervelas', label: 'Super Velas', mobileLabel: 'Super 7/34', icon: Flame },
    { id: 'historico', label: 'Histórico', mobileLabel: 'Histórico', icon: History },
    { id: 'gatilhos', label: 'Gatilhos PDF', mobileLabel: 'Gatilhos', icon: BookOpen },
    { id: 'banca', label: 'Banca & Metas', mobileLabel: 'Banca', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('buscador')}
            className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Aviator Radar Pro
          </button>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium" aria-label="Navegação principal">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    active
                      ? 'border-emerald-400 text-slate-50'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 md:px-6 md:pb-10">
        {activeTab === 'buscador' && (
          <BuscadorView
            selectedHouse={selectedHouse}
            customHouses={customHouses}
            onSelectHouse={setSelectedHouse}
            onAddCustomHouse={handleAddCustomHouse}
            roundInput={roundInput}
            onRoundInputChange={setRoundInput}
            multiplierInput={multiplierInput}
            onMultiplierInputChange={setMultiplierInput}
            timeInput={timeInput}
            onTimeInputChange={setTimeInput}
            entryMode={entryMode}
            onEntryModeChange={setEntryMode}
            payoutMood={payoutMood}
            onPayoutMoodChange={setPayoutMood}
            paceMode={paceMode}
            onPaceModeChange={setPaceMode}
            customPaceSec={currentHouseCustomPace}
            onSetCustomPaceSec={handleSetCustomPaceSec}
            onSyncLiveRound={handleSyncLiveRound}
            recentCandlesText={recentCandlesText}
            onRecentCandlesTextChange={setRecentCandlesText}
            analysis={analysis}
            houseHistory={houseHistory}
            searchLog={searchLog}
            onRegisterRound={handleRegisterRound}
            onSaveToLog={handleSaveToLog}
            onJumpToTab={setActiveTab}
            notifications={{
              permission: notif.permission,
              isPushSubscribed: notif.isPushSubscribed,
              sseConnected: notif.sseConnected,
              statusNote: notif.statusNote,
              isEnabling: notif.isEnabling,
              soundEnabled: notif.soundEnabled,
              onToggleSound: notif.setSoundEnabled,
              autoMonitor: notif.autoMonitor,
              onToggleAutoMonitor: notif.setAutoMonitor,
              leadSeconds: notif.leadSeconds,
              onLeadSecondsChange: notif.setLeadSeconds,
              scheduledAlerts: notif.scheduledAlerts,
              onEnableBackground: notif.enableBackgroundNotifications,
              onTestNotification: () => void notif.sendTestNotification(selectedHouse, roundInput),
              onCancelAlert: (id) => void notif.cancelAlert(id),
              onScheduleSignalAlert: notif.scheduleAlert,
            }}
          />
        )}

        {activeTab === 'supervelas' && (
          <SuperVelasPanel
            defaultHouse={selectedHouse}
            customHouses={customHouses}
            onAddCustomHouse={handleAddCustomHouse}
            defaultPayoutMood={payoutMood}
            paceSec={analysis.pace.secondsPerRound}
            mainRoundInput={roundInput}
            mainMultiplierInput={multiplierInput}
            mainTimeInput={timeInput}
            initialSharedParams={
              sharedInit.tab === 'supervelas'
                ? {
                    house: sharedInit.house,
                    round: sharedInit.sround,
                    mult: sharedInit.smult,
                    date: sharedInit.sdate,
                    time: sharedInit.stime,
                    mood: sharedInit.smood,
                  }
                : undefined
            }
            onBackToBuscador={() => setActiveTab('buscador')}
            onScheduleAlert={notif.scheduleAlert}
          />
        )}

        {activeTab === 'historico' && (
          <HistoricoPadroesView
            selectedHouse={selectedHouse}
            history={houseHistory}
            searchLog={searchLog}
            analysis={analysis}
            onBatchAdd={handleBatchAdd}
            onRemoveEntry={handleRemoveEntry}
            onClearHouseHistory={handleClearHouseHistory}
            onSelectEntryForSearch={(entry) => {
              setRoundInput(String(entry.roundNumber));
              setMultiplierInput(entry.multiplier.toFixed(2));
              setTimeInput(entry.timeStr);
              setActiveTab('buscador');
            }}
            onUpdateLogResult={handleUpdateLogResult}
            onDeleteLogItem={handleDeleteLogItem}
          />
        )}

        {activeTab === 'gatilhos' && (
          <GatilhosCatalogoView
            onSelectHouse={(house) => {
              setSelectedHouse(house);
              setActiveTab('buscador');
            }}
            onApplyCandle={(candleStr) => {
              setMultiplierInput(candleStr);
              setActiveTab('buscador');
            }}
          />
        )}

        {activeTab === 'banca' && <BancaMetasView />}
      </main>

      {/* Desktop Footer */}
      <footer className="hidden md:block border-t border-white/10 py-4 text-center text-xs text-slate-500">
        Aviator Radar Pro · Gerencie sua banca com responsabilidade · Nenhuma estratégia garante 100% de acerto.
      </footer>

      {/* Mobile Bottom Thumb-Zone Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-5 border-t border-white/10 bg-[#0B0F17]/95 backdrop-blur-md pb-safe md:hidden"
        aria-label="Navegação inferior"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex min-h-[56px] flex-col items-center justify-center gap-1 py-1.5 transition-colors cursor-pointer ${
                active ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                {item.mobileLabel}
              </span>
            </button>
          );
        })}
      </nav>

      <OfflineIndicator />
      <RealtimeAlertToast alert={notif.activeToast} onDismiss={notif.dismissToast} />
    </div>
  );
}
