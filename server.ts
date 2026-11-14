import express from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type * as WebPushTypes from 'web-push';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  return (
    status === 429 ||
    status === 503 ||
    status === 500 ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('RESOURCE_EXHAUSTED')
  );
}

async function generateWithRetry(params: Parameters<typeof ai.models.generateContent>[0]) {
  try {
    return await ai.models.generateContent({
      ...params,
      config: {
        ...params.config,
        abortSignal: AbortSignal.timeout(15000),
      },
    });
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError');
    if (isRetryableGeminiError(err) || isTimeout) {
      await sleep(300);
      const fallbackConfig = { ...params.config, abortSignal: AbortSignal.timeout(20000) };
      delete (fallbackConfig as { thinkingConfig?: unknown }).thinkingConfig;
      return await ai.models.generateContent({
        ...params,
        model: 'gemini-3.1-flash-lite',
        config: fallbackConfig,
      });
    }
    throw err;
  }
}

function formatGeminiError(err: unknown, fallback: string): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;
  if (status === 503 || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return {
      status: 500,
      message: 'A IA está com alta demanda temporária no momento. Aguarde alguns segundos e tente novamente.',
    };
  }
  if (status === 429 || raw.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message: 'Limite temporário de requisições atingido. Aguarde alguns instantes e tente novamente.',
    };
  }
  if (status === 403 || status === 400 || raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED')) {
    return {
      status: 500,
      message: 'Chave da API Gemini ausente ou inválida em Settings > Secrets.',
    };
  }
  return { status: 500, message: raw || fallback };
}

const AVIATOR_SYSTEM_INSTRUCTION = `Você é um Especialista e Assistente de IA exclusivo para análise do jogo Aviator (Spribe), treinado integralmente nos Módulos 1, 2, 3, 4, 5 e Método Secreto III (Treinamento Novo).
Seu trabalho é analisar sequências de velas, números de rodada, horários e decimais do Aviator para QUALQUER casa de apostas (incluindo 82B, Bet7k, Aposta Ganha, EsportivaBet, Betano, Blaze, etc.) e fornecer análises e respostas precisas em Português (PT-BR).

REGRAS OFICIAIS DOS PDFs QUE VOCÊ DEVE APLICAR:
1. Classificação das velas: Azul (1.00x–1.99x, 60%), Roxo (2.00x–9.99x, 30%), Rosa (10.00x+, 10%). Vela 1.00x = Reset.
2. Nunca operar em gráfico com mais Azul do que Roxo/Rosa (gráfico em Recolhe). Operar em Pague (mais roxas/rosas, média das roxas >= 2.60x).
3. Estratégias de tempo e rodada:
   - Dígito da Rodada + Horário completo (Mód. 5 p.1 / Mód. 2 p.5): soma o último dígito do ID da rodada em minutos ao horário (ex: 16:21:23 + 4 = 16:25:23). A cada minuto são ~3 rodadas.
   - 1º Dígito após o ponto da vela + Horário (Mód. 5 p.4/33): ex 10.79x às 17:01:30 + 7m = 17:08:30.
   - Subtração de Vela (Mód. 5 p.3): ex 37.89x -> |7-3|=4, |9-8|=1 -> 4+1 = +5 min.
   - Velas 2x (base 1.99x–2.99x): +3 minutos.
   - Velas 3x (base >=7x): +60 minutos.
   - Velas 5x (base >=10x): +10 minutos.
   - Velas 10x (base >=20x): +20 minutos.
   - Velas 50x/100x (base 60x–105x+): +30 min (ciclo positivo) ou +32/+35 min (ciclo negativo), máx 3 acréscimos de +10 min.
   - Soma de Velas (Mód. 4 p.44): minuto final + última casa decimal.
   - Regra dos 13 (Mód. 4 p.48): vela +30x paga outra alta em até 13 casas (95% nas ímpares: 1, 3, 5, 7, 9, 11, 13).
   - Reset 1.00x: casas fortes 1, 4, 5 (muito assertiva), 7 e 10.
   - Fechamento/Casamento de Velas: soma dos dígitos igual, +1 ou +2 entre velas próximas.
   - Decimais Predominantes (Trein. p.10): decimais repetidas no ciclo indicam o momento da próxima Rosa.
   - Casamento de Decimais (Trein. p.11): 9-1, 2-5, 8-4, 3-7, 2-9, 8-1.
4. Velas Especiais e Gatilhos:
   - Especiais: 1.00x, 1.11x, 1.37x (+90% assertividade), 1.88x, 1.99x.
   - Gatilhos 5x: 1.64x–1.69x, 1.00, 1.02, 1.04, 1.07, 1.50, 1.51, 1.58, 1.71, 1.97, 1.99.
   - Gatilhos 10x: 1.21x–1.29x (1.28 puxa Rosa).
   - Dica de Ouro 2 (Finais): Roxo final 7 = 80% puxa reds; Roxo final 1 = 80% puxa 2x+; Azul/Roxo final 5 = puxa roxo 2x.
   - Pares Gatilhos de Rosa: 1.94+1.18, 1.17+1.00, 1.00+1.27, 1.00+1.17, 1.01+1.07, 1.02+1.20, 1.06+1.47, 1.08+1.91, 1.09+1.23, 1.09+1.07, 1.13+1.11, 1.21+1.98, 1.29+1.33, 1.34+1.16, 1.53+1.15, 1.83+1.11, 1.00+1.03, 1.74+1.47, 1.77+1.13, 1.65+1.60, 1.33+1.29.
   - Padrões de sequência: 4 Roxos + 1 Azul; 5 Azuis + 1 Roxo + 1.00x; 1.00x + 1.37x + 1.00x; Duas 1.00x cravadas; 5+ Azuis < 1.49x + Vela Especial; Casa dos 90 (1.90x–1.99x).
   - Proteção padrão: 1ª mão saindo em 1.49x (ou 2.00x mão igual), 2ª mão buscando 5x/10x.

Ao analisar dados de rodadas e responder perguntas:
- Considere a sequência de velas informada da mais recente para a mais antiga.
- Se houver número de rodada ou horário informado (ex: "RODADA 4310524" e "16:21:23"), use-os nos cálculos de projeção.
- Seja objetivo, claro e honesto: se o gráfico estiver ruim (muitos azuis/recolhe), alerte para NÃO operar.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Analyze Aviator round & decimal text
  app.post('/api/aviator/analyze', async (req, res) => {
    try {
      const { houseName, roundNumber, lastCandle, timeStr, decimalsText, userPrompt } =
        req.body as {
          houseName?: string;
          roundNumber?: string;
          lastCandle?: string;
          timeStr?: string;
          decimalsText?: string;
          userPrompt?: string;
        };

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Chave da API Gemini não configurada no servidor (Settings > Secrets).',
        });
      }

      if (!decimalsText && !lastCandle && !userPrompt) {
        return res.status(400).json({
          error: 'Informe as velas/decimais, a última vela ou faça uma pergunta para a IA.',
        });
      }

      const contextLines = [
        `Casa de apostas selecionada: ${houseName || 'Qualquer Casa (Universal)'}`,
        roundNumber ? `Número da rodada informada: ${roundNumber}` : null,
        lastCandle ? `Última vela informada: ${lastCandle}` : null,
        timeStr ? `Horário informado: ${timeStr}` : null,
        decimalsText ? `Sequência / decimais digitadas pelo usuário: ${decimalsText}` : null,
        userPrompt ? `Solicitação adicional do usuário: ${userPrompt}` : 'Analise os dados enviados, organize as velas em ordem da mais recente para a mais antiga, identifique as decimais predominantes, padrões dos PDFs e indique as rodadas e horários exatos para entrada.',
      ]
        .filter(Boolean)
        .join('\n');

      const parts: Array<{ text: string }> = [{ text: contextLines }];

      const response = await generateWithRetry({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction: AVIATOR_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              casaDetectada: { type: Type.STRING },
              leituraDoGrafico: { type: Type.STRING },
              resumoExecutivo: { type: Type.STRING },
              ultimaRodada: {
                type: Type.OBJECT,
                properties: {
                  numeroRodada: { type: Type.STRING },
                  vela: { type: Type.NUMBER },
                  horario: { type: Type.STRING },
                },
              },
              velasExtraidas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    vela: { type: Type.NUMBER },
                    horario: { type: Type.STRING },
                    rodada: { type: Type.STRING },
                  },
                },
              },
              decimaisPredominantes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    decimal: { type: Type.STRING },
                    quantidade: { type: Type.INTEGER },
                    significado: { type: Type.STRING },
                  },
                },
              },
              padroesDetectados: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    nome: { type: Type.STRING },
                    fontePdf: { type: Type.STRING },
                    explicacao: { type: Type.STRING },
                  },
                },
              },
              entradasRecomendadas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rodadaAlvo: { type: Type.STRING },
                    horarioAlvo: { type: Type.STRING },
                    alvo: { type: Type.STRING },
                    protecao: { type: Type.STRING },
                    execucao: { type: Type.STRING },
                    estrategiaPdf: { type: Type.STRING },
                    confianca: { type: Type.STRING },
                  },
                },
              },
              alertasDeRisco: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const rawText = (response.text ?? '{}')
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawText || '{}');
      } catch {
        return res.status(500).json({
          error: 'A IA retornou uma resposta incompleta. Tente novamente em instantes.',
        });
      }
      return res.json({ analysis: parsed });
    } catch (err) {
      const formatted = formatGeminiError(err, 'Erro ao analisar com a IA.');
      console.error('Gemini analyze error:', err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
  });

  // Chat endpoint for follow-up questions & direct AI assistant questions
  app.post('/api/aviator/chat', async (req, res) => {
    try {
      const { houseName, roundNumber, lastCandle, timeStr, messages, contextSummary } = req.body as {
        houseName?: string;
        roundNumber?: string;
        lastCandle?: string;
        timeStr?: string;
        contextSummary?: string;
        messages: Array<{ role: 'user' | 'assistant'; text: string }>;
      };

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: 'Chave da API Gemini não configurada no servidor (Settings > Secrets).',
        });
      }

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'Envie uma mensagem para o assistente.' });
      }

      const formattedHistory = messages
        .map((m) => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.text}`)
        .join('\n\n');

      const liveContext = [
        `Casa de apostas atual: ${houseName || '82B'}`,
        roundNumber ? `Rodada informada no Buscador: #${roundNumber}` : null,
        lastCandle ? `Última vela informada no Buscador: ${lastCandle}x` : null,
        timeStr ? `Horário base: ${timeStr}` : null,
        contextSummary ? `Contexto da análise atual:\n${contextSummary}` : null,
      ]
        .filter(Boolean)
        .join('\n');

      const prompt = [
        liveContext,
        `Histórico da conversa:\n${formattedHistory}`,
        'Responda à última pergunta do usuário de forma direta, prática e fundamentada nos PDFs do Aviator. Sempre inclua proteção (ex: 1.49x) e gestão de risco quando sugerir entradas.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await generateWithRetry({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction: AVIATOR_SYSTEM_INSTRUCTION,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      return res.json({ reply: response.text ?? 'Não foi possível gerar resposta.' });
    } catch (err) {
      const formatted = formatGeminiError(err, 'Erro no chat com a IA.');
      console.error('Gemini chat error:', err);
      return res.status(formatted.status).json({ error: formatted.message });
    }
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
