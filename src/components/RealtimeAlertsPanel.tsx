import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ScheduledAlertItem } from '../hooks/useRealtimeNotifications';

interface RealtimeAlertsPanelProps {
  houseName: string;
  roundNumber?: string;
  permission: NotificationPermission | 'unsupported';
  isPushSubscribed: boolean;
  sseConnected: boolean;
  statusNote: string | null;
  isEnabling: boolean;
  soundEnabled: boolean;
  onToggleSound: (val: boolean) => void;
  autoMonitor: boolean;
  onToggleAutoMonitor: (val: boolean) => void;
  leadSeconds: number;
  onLeadSecondsChange: (sec: number) => void;
  scheduledAlerts: ScheduledAlertItem[];
  onEnableBackground: () => void;
  onTestNotification: () => void;
  onCancelAlert: (id: string) => void;
}

function formatCountdown(triggerAtMs: number, nowMs: number): string {
  const diffSec = Math.max(0, Math.ceil((triggerAtMs - nowMs) / 1000));
  const min = Math.floor(diffSec / 60);
  const sec = diffSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const RealtimeAlertsPanel: React.FC<RealtimeAlertsPanelProps> = ({
  houseName,
  permission,
  isPushSubscribed,
  sseConnected,
  statusNote,
  isEnabling,
  soundEnabled,
  onToggleSound,
  autoMonitor,
  onToggleAutoMonitor,
  leadSeconds,
  onLeadSecondsChange,
  scheduledAlerts,
  onEnableBackground,
  onTestNotification,
  onCancelAlert,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (scheduledAlerts.length === 0) return;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [scheduledAlerts.length]);

  const isBackgroundReady = permission === 'granted' && (isPushSubscribed || sseConnected);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#131A26] p-4 sm:p-6">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium">
            <BellRing className={`h-4 w-4 ${isBackgroundReady ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={isBackgroundReady ? 'text-emerald-400' : 'text-amber-300'}>
              {isPushSubscribed
                ? 'Notificações em 2º Plano Ativas (Web Push + Tempo Real)'
                : permission === 'granted'
                  ? 'Alertas em Tempo Real Ativos'
                  : 'Ative para receber alertas mesmo com o app em 2º plano'}
            </span>
          </div>
          <h2 className="mt-1 text-base font-semibold text-slate-100">
            Notificações em Segundo Plano & Tempo Real — {houseName}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {permission !== 'granted' && (
            <button
              type="button"
              onClick={onEnableBackground}
              disabled={isEnabling}
              className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60 transition-colors cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              <span>{isEnabling ? 'Ativando...' : 'Ativar em 2º Plano'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onTestNotification}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-white/15 bg-[#192231] px-3.5 text-xs font-medium text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <BellRing className="h-4 w-4 text-emerald-400" />
            <span>Testar Alerta Agora</span>
          </button>
        </div>
      </div>

      {statusNote && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-[#0B0F17] px-3 py-2 text-xs text-slate-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{statusNote}</span>
        </div>
      )}

      {/* Controls Row */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Auto Monitor Toggle */}
        <button
          type="button"
          onClick={() => onToggleAutoMonitor(!autoMonitor)}
          className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
            autoMonitor
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-white/10 bg-[#0B0F17] text-slate-300 hover:border-white/20'
          }`}
        >
          <div>
            <div className="font-semibold">Monitor Automático</div>
            <div className="text-[11px] opacity-75">
              {autoMonitor ? 'Agendando entradas do Buscador' : 'Clique para agendar automaticamente'}
            </div>
          </div>
          <span className={`font-mono text-xs font-bold ${autoMonitor ? 'text-emerald-400' : 'text-slate-500'}`}>
            {autoMonitor ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => onToggleSound(!soundEnabled)}
          className={`flex min-h-[46px] items-center justify-between rounded-xl border px-3.5 py-2 text-left text-xs transition-colors cursor-pointer ${
            soundEnabled
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              : 'border-white/10 bg-[#0B0F17] text-slate-300 hover:border-white/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {soundEnabled ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
            <div>
              <div className="font-semibold">Aviso Sonoro</div>
              <div className="text-[11px] opacity-75">Toque de radar em tempo real</div>
            </div>
          </div>
          <span className={`font-mono text-xs font-bold ${soundEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
            {soundEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Lead Time Selector */}
        <div className="flex min-h-[46px] items-center justify-between rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2 text-xs">
          <div>
            <div className="font-semibold text-slate-200">Antecedência</div>
            <div className="text-[11px] text-slate-400">Disparar antes do horário</div>
          </div>
          <select
            aria-label="Antecedência da notificação"
            value={leadSeconds}
            onChange={(e) => onLeadSecondsChange(Number(e.target.value))}
            className="rounded-lg border border-white/15 bg-[#131A26] px-2.5 py-1.5 font-mono text-xs font-semibold text-emerald-300 focus:outline-none cursor-pointer"
          >
            <option value={0}>Exato (0s)</option>
            <option value={15}>15s antes</option>
            <option value={20}>20s antes</option>
            <option value={30}>30s antes</option>
            <option value={45}>45s antes</option>
          </select>
        </div>
      </div>

      {/* Scheduled Queue */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Alertas Agendados em Tempo Real ({scheduledAlerts.length})</span>
          <span className="font-mono text-[11px]">
            {sseConnected ? 'Canal em tempo real conectado' : 'Reconectando canal...'}
          </span>
        </div>

        {scheduledAlerts.length === 0 ? (
          <div className="rounded-xl bg-[#0B0F17] p-3.5 text-xs text-slate-400">
            Nenhum alerta pendente. Clique em <strong className="text-slate-200">Alertar</strong> em qualquer rodada calculada ou ative o <strong className="text-slate-200">Monitor Automático</strong>.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {scheduledAlerts.slice(0, 6).map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0B0F17] px-3 py-2.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-100 truncate">{alert.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400 truncate">
                    {alert.targetTime || 'Agora'} · Alvo {alert.targetMultiplier} (Prot. {alert.protection})
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-emerald-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatCountdown(alert.triggerAtMs, nowMs)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCancelAlert(alert.id)}
                    aria-label="Cancelar alerta"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

interface RealtimeToastProps {
  alert: ScheduledAlertItem | null;
  onDismiss: () => void;
}

export const RealtimeAlertToast: React.FC<RealtimeToastProps> = ({ alert, onDismiss }) => {
  if (!alert) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-16 right-4 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-emerald-500/50 bg-[#0F1724] p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <BellRing className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-semibold text-emerald-400">
              ALERTA EM TEMPO REAL · {alert.houseName}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-slate-100">
              {alert.title}
            </div>
            <p className="mt-1 text-xs text-slate-300">{alert.body}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar alerta"
          className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-slate-100 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
