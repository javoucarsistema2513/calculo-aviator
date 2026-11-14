import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJson } from '../utils/apiClient';
import { RoundSignal } from '../utils/aviatorEngine';

export interface ScheduledAlertItem {
  id: string;
  clientId: string;
  key?: string;
  title: string;
  body: string;
  houseName: string;
  roundNumber?: string;
  targetTime: string;
  targetMultiplier: string;
  protection: string;
  triggerAtMs: number;
  createdAt: number;
  status: 'pending' | 'sent';
}

const STORAGE_CLIENT_ID = 'aviator_radar_client_id';
const STORAGE_AUTO_MONITOR = 'aviator_radar_auto_monitor';
const STORAGE_SOUND_ENABLED = 'aviator_radar_sound_enabled';
const STORAGE_LEAD_SECONDS = 'aviator_radar_lead_seconds';

function getOrCreateClientId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_CLIENT_ID);
    if (existing) return existing;
    const generated =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `cli-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STORAGE_CLIENT_ID, generated);
    return generated;
  } catch {
    return `cli-${Date.now()}`;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function parseTargetTimeToFutureMs(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
  const m = Math.min(59, Math.max(0, parseInt(match[2], 10)));
  const s = match[3] ? Math.min(59, Math.max(0, parseInt(match[3], 10))) : 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(h, m, s, 0);

  // If time already passed by more than 2 minutes today, treat as tomorrow
  if (target.getTime() < now.getTime() - 120_000) {
    target.setDate(target.getDate() + 1);
  }
  return target.getTime();
}

function playRadarChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.001, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.25);
    });
  } catch {
    // ignore audio autoplay restrictions
  }
}

export function useRealtimeNotifications() {
  const [clientId] = useState<string>(() => getOrCreateClientId());

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);
  const [isEnabling, setIsEnabling] = useState(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_SOUND_ENABLED);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  });

  const [autoMonitor, setAutoMonitor] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem(STORAGE_AUTO_MONITOR);
      return val === null ? false : val === 'true';
    } catch {
      return false;
    }
  });

  const [leadSeconds, setLeadSeconds] = useState<number>(() => {
    try {
      const val = localStorage.getItem(STORAGE_LEAD_SECONDS);
      const parsed = val ? parseInt(val, 10) : 20;
      return Number.isFinite(parsed) ? parsed : 20;
    } catch {
      return 20;
    }
  });

  const [scheduledAlerts, setScheduledAlerts] = useState<ScheduledAlertItem[]>([]);
  const [recentTriggered, setRecentTriggered] = useState<ScheduledAlertItem[]>([]);
  const [activeToast, setActiveToast] = useState<ScheduledAlertItem | null>(null);

  const soundRef = useRef(soundEnabled);
  const pushSubscribedRef = useRef(isPushSubscribed);
  soundRef.current = soundEnabled;
  pushSubscribedRef.current = isPushSubscribed;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SOUND_ENABLED, String(soundEnabled));
    } catch {
      // ignore
    }
  }, [soundEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AUTO_MONITOR, String(autoMonitor));
    } catch {
      // ignore
    }
  }, [autoMonitor]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LEAD_SECONDS, String(leadSeconds));
    } catch {
      // ignore
    }
  }, [leadSeconds]);

  // Check existing Service Worker push subscription on mount
  useEffect(() => {
    let active = true;
    async function checkExistingSub() {
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
      try {
        const reg = await navigator.serviceWorker.ready;
        if (!('pushManager' in reg)) return;
        const existing = await reg.pushManager.getSubscription();
        if (existing && active) {
          setIsPushSubscribed(true);
          await fetchJson('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, subscription: existing.toJSON() }),
          });
        }
      } catch {
        // ignore if SW not ready yet
      }
    }
    void checkExistingSub();
    return () => {
      active = false;
    };
  }, [clientId]);

  // Real-time Server-Sent Events (SSE) subscription
  useEffect(() => {
    const es = new EventSource(`/api/notifications/events?clientId=${encodeURIComponent(clientId)}`);

    es.addEventListener('connected', (event) => {
      setSseConnected(true);
      try {
        const data = JSON.parse((event as MessageEvent).data) as { alerts?: ScheduledAlertItem[] };
        if (Array.isArray(data.alerts)) {
          setScheduledAlerts(data.alerts);
        }
      } catch {
        // ignore
      }
    });

    es.addEventListener('alerts_updated', (event) => {
      try {
        const alerts = JSON.parse((event as MessageEvent).data) as ScheduledAlertItem[];
        if (Array.isArray(alerts)) {
          setScheduledAlerts(alerts);
        }
      } catch {
        // ignore
      }
    });

    es.addEventListener('alert_triggered', async (event) => {
      try {
        const alert = JSON.parse((event as MessageEvent).data) as ScheduledAlertItem;
        setActiveToast(alert);
        setRecentTriggered((prev) => [alert, ...prev].slice(0, 12));

        if (soundRef.current) {
          playRadarChime();
        }

        // Fallback local Service Worker notification when Web Push isn't subscribed
        if (
          !pushSubscribedRef.current &&
          typeof Notification !== 'undefined' &&
          Notification.permission === 'granted' &&
          'serviceWorker' in navigator
        ) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg.active) {
              reg.active.postMessage({
                type: 'SHOW_NOTIFICATION',
                payload: {
                  title: alert.title,
                  body: alert.body,
                  tag: alert.key || alert.id,
                  url: '/',
                },
              });
            } else {
              await reg.showNotification(alert.title, {
                body: alert.body,
                icon: '/pwa-192x192.png',
                tag: alert.key || alert.id,
              });
            }
          } catch {
            // fallback to standard Notification API if permitted
            try {
              new Notification(alert.title, { body: alert.body, icon: '/pwa-192x192.png' });
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    });

    es.onerror = () => {
      setSseConnected(false);
    };

    return () => {
      es.close();
    };
  }, [clientId]);

  const enableBackgroundNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      setStatusNote('Este navegador não suporta notificações do sistema. Os alertas em tempo real continuarão ativos dentro do aplicativo.');
      return false;
    }

    setIsEnabling(true);
    setStatusNote(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setStatusNote(
          window.self !== window.top
            ? 'Permissão bloqueada na prévia incorporada. Instale o PWA ou abra em nova aba para liberar notificações em 2º plano.'
            : 'Permissão negada no navegador. Libere as notificações nas configurações do site para receber em 2º plano.'
        );
        return false;
      }

      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if ('pushManager' in reg) {
          try {
            const { publicKey } = await fetchJson<{ publicKey: string }>(
              '/api/notifications/vapid-public-key'
            );
            let sub = await reg.pushManager.getSubscription();
            if (!sub && publicKey) {
              const convertedKey = urlBase64ToUint8Array(publicKey);
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey.buffer as ArrayBuffer,
              });
            }
            if (sub) {
              await fetchJson('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, subscription: sub.toJSON() }),
              });
              setIsPushSubscribed(true);
              setStatusNote('Web Push + Service Worker ativos em 2º plano em tempo real.');
              return true;
            }
          } catch {
            setStatusNote('Permissão concedida (modo Service Worker local + tempo real ativo).');
            return true;
          }
        }
      }

      setStatusNote('Notificações do navegador ativadas em tempo real.');
      return true;
    } catch {
      setStatusNote('Abra o app fora do iframe ou instale como PWA para ativar notificações em 2º plano.');
      return false;
    } finally {
      setIsEnabling(false);
    }
  }, [clientId]);

  const scheduleAlert = useCallback(
    async (params: {
      key?: string;
      title: string;
      body: string;
      houseName: string;
      roundNumber?: string;
      targetTime: string;
      targetMultiplier: string;
      protection: string;
      customLeadSeconds?: number;
      delaySeconds?: number;
    }) => {
      const lead = params.customLeadSeconds ?? leadSeconds;
      let triggerAtMs = Date.now() + (params.delaySeconds ?? 10) * 1000;

      if (params.delaySeconds === undefined) {
        const parsedMs = parseTargetTimeToFutureMs(params.targetTime);
        if (parsedMs) {
          const withLead = parsedMs - lead * 1000;
          triggerAtMs = Math.max(Date.now() + 2000, withLead);
        }
      }

      try {
        const data = await fetchJson<{ alerts?: ScheduledAlertItem[] }>('/api/notifications/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId,
            key: params.key,
            title: params.title,
            body: params.body,
            houseName: params.houseName,
            roundNumber: params.roundNumber,
            targetTime: params.targetTime,
            targetMultiplier: params.targetMultiplier,
            protection: params.protection,
            triggerAtMs,
          }),
        });

        if (Array.isArray(data.alerts)) {
          setScheduledAlerts(data.alerts);
        }
      } catch {
        // silent fallback if server is temporarily unavailable
      }
    },
    [clientId, leadSeconds]
  );

  const syncAutoSignals = useCallback(
    async (houseName: string, signals: RoundSignal[]) => {
      try {
        if (!autoMonitor) {
          await fetchJson('/api/notifications/sync-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, houseName, items: [] }),
          });
          return;
        }

        const now = Date.now();
        const maxWindow = now + 90 * 60 * 1000;
        const items = signals
          .map((sig) => {
            const targetMs = parseTargetTimeToFutureMs(sig.targetTime);
            if (!targetMs || targetMs > maxWindow) return null;
            const triggerAtMs = targetMs - leadSeconds * 1000;
            if (triggerAtMs < now - 10_000) return null;
            const roundsLabel =
              sig.targetRounds.length > 0
                ? sig.targetRounds.map((r) => `#${r}`).join(', ')
                : sig.casasLabel || 'Por minuto';
            return {
              key: `auto:${sig.id}`,
              title: `${houseName} · ${sig.title}`,
              body: `Entrada ${sig.targetTime} | Rodadas: ${roundsLabel} | Alvo ${sig.targetMultiplier} (Proteção ${sig.protection})`,
              roundNumber: sig.targetRounds[0] ? String(sig.targetRounds[0]) : undefined,
              targetTime: sig.targetTime,
              targetMultiplier: sig.targetMultiplier,
              protection: sig.protection,
              triggerAtMs: Math.max(now + 3000, triggerAtMs),
            };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null);

        const data = await fetchJson<{ alerts?: ScheduledAlertItem[] }>('/api/notifications/sync-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, houseName, items }),
        });

        if (Array.isArray(data.alerts)) {
          setScheduledAlerts(data.alerts);
        }
      } catch {
        // ignore transient background sync failures
      }
    },
    [autoMonitor, clientId, leadSeconds]
  );

  const cancelAlert = useCallback(async (id: string) => {
    try {
      await fetchJson(`/api/notifications/schedule/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
    } catch {
      // ignore if already removed
    }
    setScheduledAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const sendTestNotification = useCallback(
    async (houseName: string, roundNumber?: string) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        await enableBackgroundNotifications();
      }
      try {
        await fetchJson('/api/notifications/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clientId, houseName, roundNumber }),
        });
      } catch (err) {
        setStatusNote(err instanceof Error ? err.message : 'Falha ao enviar alerta de teste.');
      }
    },
    [clientId, enableBackgroundNotifications]
  );

  const dismissToast = useCallback(() => setActiveToast(null), []);

  return {
    permission,
    isPushSubscribed,
    sseConnected,
    statusNote,
    isEnabling,
    soundEnabled,
    setSoundEnabled,
    autoMonitor,
    setAutoMonitor,
    leadSeconds,
    setLeadSeconds,
    scheduledAlerts,
    recentTriggered,
    activeToast,
    dismissToast,
    enableBackgroundNotifications,
    scheduleAlert,
    syncAutoSignals,
    cancelAlert,
    sendTestNotification,
  };
}
