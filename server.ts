import express from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type * as WebPushTypes from 'web-push';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof WebPushTypes;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VapidKeyPair {
  publicKey: string;
  privateKey: string;
}

function loadOrCreateVapidKeys(): VapidKeyPair {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }
  const keyFile = path.join(__dirname, '.vapid-keys.json');
  try {
    if (fs.existsSync(keyFile)) {
      const raw = fs.readFileSync(keyFile, 'utf-8');
      const parsed = JSON.parse(raw) as VapidKeyPair;
      if (parsed.publicKey && parsed.privateKey) {
        return parsed;
      }
    }
  } catch {
    // ignore read error and regenerate
  }
  const generated = webpush.generateVAPIDKeys();
  try {
    fs.writeFileSync(keyFile, JSON.stringify(generated, null, 2));
  } catch {
    // ignore write error on read-only fs
  }
  return generated;
}

const vapidKeys = loadOrCreateVapidKeys();
webpush.setVapidDetails(
  'mailto:suporte@aviatorradar.app',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

interface StoredSubscription {
  clientId: string;
  subscription: WebPushTypes.PushSubscription;
  createdAt: number;
}

interface ScheduledAlert {
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

const pushSubscriptions = new Map<string, StoredSubscription>();
const scheduledAlerts = new Map<string, ScheduledAlert>();
const sseClients = new Map<string, Set<express.Response>>();

function sendSseEvent(clientId: string, eventName: string, data: unknown) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  const targets = sseClients.get(clientId);
  if (targets) {
    for (const res of targets) {
      res.write(payload);
    }
  }
}

async function dispatchBackgroundAlert(alert: ScheduledAlert) {
  // 1. Real-time SSE broadcast to active client(s)
  sendSseEvent(alert.clientId, 'alert_triggered', alert);

  // 2. Web Push background notification to registered Service Worker(s)
  const pushPayload = JSON.stringify({
    title: alert.title,
    body: alert.body,
    tag: alert.key || alert.id,
    url: '/',
    houseName: alert.houseName,
    roundNumber: alert.roundNumber,
    targetMultiplier: alert.targetMultiplier,
    protection: alert.protection,
    triggeredAt: Date.now(),
  });

  const clientSubs = Array.from(pushSubscriptions.entries()).filter(
    ([, item]) => item.clientId === alert.clientId
  );

  await Promise.all(
    clientSubs.map(async ([endpoint, item]) => {
      try {
        await webpush.sendNotification(item.subscription, pushPayload);
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          pushSubscriptions.delete(endpoint);
        }
      }
    })
  );
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // --- Real-time Background Notifications & Web Push API ---

  app.get('/api/notifications/vapid-public-key', (_req, res) => {
    res.json({ publicKey: vapidKeys.publicKey });
  });

  app.post('/api/notifications/subscribe', (req, res) => {
    const { clientId, subscription } = req.body as {
      clientId?: string;
      subscription?: WebPushTypes.PushSubscription;
    };
    if (!clientId || !subscription?.endpoint) {
      return res.status(400).json({ error: 'Dados de inscrição push inválidos.' });
    }
    pushSubscriptions.set(subscription.endpoint, {
      clientId,
      subscription,
      createdAt: Date.now(),
    });
    return res.json({ ok: true });
  });

  app.post('/api/notifications/unsubscribe', (req, res) => {
    const { endpoint } = req.body as { endpoint?: string };
    if (endpoint) {
      pushSubscriptions.delete(endpoint);
    }
    return res.json({ ok: true });
  });

  app.get('/api/notifications/events', (req, res) => {
    const clientId = String(req.query.clientId || 'default');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let set = sseClients.get(clientId);
    if (!set) {
      set = new Set();
      sseClients.set(clientId, set);
    }
    set.add(res);

    const activeAlerts = Array.from(scheduledAlerts.values()).filter(
      (a) => a.clientId === clientId && a.status === 'pending'
    );
    res.write(
      `event: connected\ndata: ${JSON.stringify({ ok: true, alerts: activeAlerts, serverTimeMs: Date.now() })}\n\n`
    );

    const keepAlive = setInterval(() => {
      res.write(`: heartbeat ${Date.now()}\n\n`);
    }, 20000);

    req.on('close', () => {
      clearInterval(keepAlive);
      const clientSet = sseClients.get(clientId);
      if (clientSet) {
        clientSet.delete(res);
        if (clientSet.size === 0) {
          sseClients.delete(clientId);
        }
      }
    });
  });

  app.get('/api/notifications/scheduled', (req, res) => {
    const clientId = String(req.query.clientId || 'default');
    const alerts = Array.from(scheduledAlerts.values())
      .filter((a) => a.clientId === clientId && a.status === 'pending')
      .sort((a, b) => a.triggerAtMs - b.triggerAtMs);
    return res.json({ alerts });
  });

  app.post('/api/notifications/schedule', (req, res) => {
    const {
      clientId,
      key,
      title,
      body,
      houseName,
      roundNumber,
      targetTime,
      targetMultiplier,
      protection,
      triggerAtMs,
      delaySeconds,
    } = req.body as {
      clientId?: string;
      key?: string;
      title?: string;
      body?: string;
      houseName?: string;
      roundNumber?: string;
      targetTime?: string;
      targetMultiplier?: string;
      protection?: string;
      triggerAtMs?: number;
      delaySeconds?: number;
    };

    const resolvedClient = clientId || 'default';
    const now = Date.now();
    const resolvedTrigger =
      typeof triggerAtMs === 'number' && Number.isFinite(triggerAtMs)
        ? triggerAtMs
        : now + Math.max(2, Number(delaySeconds) || 15) * 1000;

    if (key) {
      for (const [existingId, item] of scheduledAlerts.entries()) {
        if (item.clientId === resolvedClient && item.key === key && item.status === 'pending') {
          scheduledAlerts.delete(existingId);
        }
      }
    }

    const alert: ScheduledAlert = {
      id: crypto.randomUUID(),
      clientId: resolvedClient,
      key,
      title: title || `Entrada ${houseName || '82B'}`,
      body: body || `Alvo ${targetMultiplier || '2.00x+'} às ${targetTime || 'agora'}`,
      houseName: houseName || '82B',
      roundNumber,
      targetTime: targetTime || '',
      targetMultiplier: targetMultiplier || '2.00x+',
      protection: protection || '1.49x',
      triggerAtMs: resolvedTrigger,
      createdAt: now,
      status: 'pending',
    };

    scheduledAlerts.set(alert.id, alert);
    const activeAlerts = Array.from(scheduledAlerts.values())
      .filter((a) => a.clientId === resolvedClient && a.status === 'pending')
      .sort((a, b) => a.triggerAtMs - b.triggerAtMs);
    sendSseEvent(resolvedClient, 'alerts_updated', activeAlerts);

    return res.json({ ok: true, alert, alerts: activeAlerts });
  });

  app.post('/api/notifications/sync-batch', (req, res) => {
    const { clientId, houseName, items } = req.body as {
      clientId?: string;
      houseName?: string;
      items?: Array<{
        key: string;
        title: string;
        body: string;
        roundNumber?: string;
        targetTime: string;
        targetMultiplier: string;
        protection: string;
        triggerAtMs: number;
      }>;
    };

    const resolvedClient = clientId || 'default';
    const now = Date.now();

    // Remove previous auto-synced pending alerts for this client
    for (const [id, existing] of scheduledAlerts.entries()) {
      if (existing.clientId === resolvedClient && existing.key?.startsWith('auto:') && existing.status === 'pending') {
        scheduledAlerts.delete(id);
      }
    }

    if (Array.isArray(items)) {
      for (const item of items.slice(0, 12)) {
        if (item.triggerAtMs <= now - 5000) continue;
        const alert: ScheduledAlert = {
          id: crypto.randomUUID(),
          clientId: resolvedClient,
          key: item.key,
          title: item.title,
          body: item.body,
          houseName: houseName || '82B',
          roundNumber: item.roundNumber,
          targetTime: item.targetTime,
          targetMultiplier: item.targetMultiplier,
          protection: item.protection,
          triggerAtMs: Math.max(now + 2000, item.triggerAtMs),
          createdAt: now,
          status: 'pending',
        };
        scheduledAlerts.set(alert.id, alert);
      }
    }

    const activeAlerts = Array.from(scheduledAlerts.values())
      .filter((a) => a.clientId === resolvedClient && a.status === 'pending')
      .sort((a, b) => a.triggerAtMs - b.triggerAtMs);
    sendSseEvent(resolvedClient, 'alerts_updated', activeAlerts);

    return res.json({ ok: true, alerts: activeAlerts });
  });

  app.delete('/api/notifications/schedule/:id', (req, res) => {
    const { id } = req.params;
    const existing = scheduledAlerts.get(id);
    if (existing) {
      scheduledAlerts.delete(id);
      const activeAlerts = Array.from(scheduledAlerts.values())
        .filter((a) => a.clientId === existing.clientId && a.status === 'pending')
        .sort((a, b) => a.triggerAtMs - b.triggerAtMs);
      sendSseEvent(existing.clientId, 'alerts_updated', activeAlerts);
    }
    return res.json({ ok: true });
  });

  app.post('/api/notifications/test', async (req, res) => {
    const { clientId, houseName, roundNumber } = req.body as {
      clientId?: string;
      houseName?: string;
      roundNumber?: string;
    };
    const resolvedClient = clientId || 'default';
    const testAlert: ScheduledAlert = {
      id: crypto.randomUUID(),
      clientId: resolvedClient,
      title: `Radar ${houseName || '82B'} — Alerta em Tempo Real`,
      body: `Notificações em 2º plano ativas! ${roundNumber ? `Rodada #${roundNumber} monitorada · ` : ''}Proteção 1.49x.`,
      houseName: houseName || '82B',
      roundNumber,
      targetTime: new Date().toLocaleTimeString('pt-BR', { hour12: false }),
      targetMultiplier: '5.00x',
      protection: '1.49x',
      triggerAtMs: Date.now(),
      createdAt: Date.now(),
      status: 'sent',
    };

    await dispatchBackgroundAlert(testAlert);
    return res.json({ ok: true, alert: testAlert });
  });

  // 1-second precision server scheduler for background Web Push + SSE alerts
  setInterval(() => {
    const now = Date.now();
    const affectedClients = new Set<string>();

    for (const [id, alert] of scheduledAlerts.entries()) {
      if (alert.status === 'pending' && now >= alert.triggerAtMs) {
        alert.status = 'sent';
        affectedClients.add(alert.clientId);
        void dispatchBackgroundAlert(alert);
      } else if (alert.status === 'sent' && now - alert.triggerAtMs > 30 * 60 * 1000) {
        scheduledAlerts.delete(id);
      }
    }

    for (const clientId of affectedClients) {
      const remaining = Array.from(scheduledAlerts.values())
        .filter((a) => a.clientId === clientId && a.status === 'pending')
        .sort((a, b) => a.triggerAtMs - b.triggerAtMs);
      sendSseEvent(clientId, 'alerts_updated', remaining);
    }
  }, 1000);

  // Ensure unknown /api/* routes always return JSON 404 (never fall through to SPA HTML)
  app.all('/api/*', (_req, res) => {
    res.status(404).json({ error: 'Rota de API não encontrada.' });
  });

  // Ensure body-parser & Express errors on /api/* always return JSON instead of HTML error pages
  app.use(
    (
      err: { status?: number; type?: string; message?: string },
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (res.headersSent) {
        return next(err);
      }
      const status = err.status || (err.type === 'entity.too.large' ? 413 : 500);
      if (req.path.startsWith('/api')) {
        const message =
          status === 413
            ? 'Os dados enviados excederam o tamanho máximo permitido.'
            : err.message || 'Erro interno ao processar requisição na API.';
        return res.status(status).json({ error: message });
      }
      return next(err);
    }
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aviator Radar Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
