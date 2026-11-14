import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkOnly } from 'workbox-strategies';

interface SWNotificationAction {
  action: string;
  title: string;
}

interface SWNotificationOptions extends NotificationOptions {
  renotify?: boolean;
  vibrate?: number[];
  actions?: SWNotificationAction[];
}

interface SWExtendableEvent extends Event {
  waitUntil(f: Promise<unknown>): void;
}

interface SWPushEvent extends SWExtendableEvent {
  data?: {
    json(): unknown;
    text(): string;
  } | null;
}

interface SWNotificationEvent extends SWExtendableEvent {
  notification: Notification;
  action: string;
}

interface SWMessageEvent extends SWExtendableEvent {
  data?: {
    type?: string;
    payload?: {
      title?: string;
      body?: string;
      tag?: string;
      url?: string;
    };
  };
}

interface SWClient {
  url: string;
  focus(): Promise<SWClient>;
}

interface SWGlobalScope {
  __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
  skipWaiting(): Promise<void>;
  registration: ServiceWorkerRegistration;
  clients: {
    matchAll(options?: { type?: string; includeUncontrolled?: boolean }): Promise<SWClient[]>;
    openWindow(url: string): Promise<SWClient | null>;
  };
  addEventListener(type: 'push', listener: (event: SWPushEvent) => void): void;
  addEventListener(type: 'notificationclick', listener: (event: SWNotificationEvent) => void): void;
  addEventListener(type: 'message', listener: (event: SWMessageEvent) => void): void;
}

declare global {
  interface Window {
    __WB_MANIFEST: Array<{ url: string; revision: string | null } | string>;
  }
}

const sw = self as unknown as SWGlobalScope;

void sw.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly()
);

const wbManifest = self.__WB_MANIFEST || [];
precacheAndRoute(wbManifest);

const hasIndexPrecache = wbManifest.some((entry) => {
  const url = typeof entry === 'string' ? entry : entry.url;
  return url === 'index.html' || url === '/index.html';
});

if (hasIndexPrecache) {
  const navHandler = createHandlerBoundToURL('/index.html');
  const navRoute = new NavigationRoute(navHandler, {
    denylist: [/^\/api/],
  });
  registerRoute(navRoute);
}

registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'gstatic-fonts-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 365,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

sw.addEventListener('push', (event: SWPushEvent) => {
  let payload: {
    title?: string;
    body?: string;
    tag?: string;
    url?: string;
    houseName?: string;
    roundNumber?: string;
  } = {};

  if (event.data) {
    try {
      payload = event.data.json() as typeof payload;
    } catch {
      payload = { body: event.data.text() };
    }
  }

  const title = payload.title || 'Aviator Radar Pro — Alerta de Entrada';
  const body = payload.body || 'Horário alvo próximo. Confira a entrada no radar.';

  const options: SWNotificationOptions = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.tag || `aviator-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    vibrate: [220, 100, 220],
    data: {
      url: payload.url || '/',
      houseName: payload.houseName,
      roundNumber: payload.roundNumber,
    },
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

sw.addEventListener('message', (event: SWMessageEvent) => {
  if (event.data?.type === 'SHOW_NOTIFICATION' && event.data.payload) {
    const { title, body, tag, url } = event.data.payload;
    const options: SWNotificationOptions = {
      body: body || 'Entrada programada próxima.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: tag || `aviator-local-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: { url: url || '/' },
    };
    event.waitUntil(
      sw.registration.showNotification(title || 'Aviator Radar Pro', options)
    );
  }
});

sw.addEventListener('notificationclick', (event: SWNotificationEvent) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data as { url?: string } | undefined)?.url || '/';

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        return sw.clients.openWindow(targetUrl);
      })
  );
});
