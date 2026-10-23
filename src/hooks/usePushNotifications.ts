import { useState, useEffect, useCallback } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      alert('Seu navegador não suporta notificações de sistema.');
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        new Notification('Aviator AI Pro Ativado!', {
          body: 'Notificações push em tempo real ativadas com sucesso para sinais assertivos.',
          icon: '/pwa-192x192.png',
        });
        return true;
      }
    } catch (e) {
      console.warn('Erro ao pedir permissão de notificação:', e);
    }
    return false;
  }, []);

  const sendPushNotification = useCallback((title: string, body: string, isCritical: boolean = false) => {
    if (typeof window === 'undefined') return;

    // Haptic vibration on mobile
    if ('vibrate' in navigator) {
      try {
        if (isCritical) {
          navigator.vibrate([250, 100, 250, 100, 300]);
        } else {
          navigator.vibrate([150, 80, 150]);
        }
      } catch {}
    }

    // System Notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: 'aviator-signal',
        });
      } catch (err) {
        console.warn('Falha ao disparar notification:', err);
      }
    }
  }, []);

  return {
    isSupported,
    permission,
    isGranted: permission === 'granted',
    requestPermission,
    sendPushNotification,
  };
}
