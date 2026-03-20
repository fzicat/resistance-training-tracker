'use client';

import { useEffect } from 'react';

function promptSkipWaiting(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    let hasRefreshed = false;

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        promptSkipWaiting(registration);

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              promptSkipWaiting(registration);
            }
          });
        });

        // Keep SW updates reasonably fresh for long-lived sessions.
        window.setInterval(() => {
          registration.update().catch(() => undefined);
        }, 60 * 60 * 1000);
      })
      .catch((err) => {
        console.error('Service worker registration failed:', err);
      });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hasRefreshed) return;
      hasRefreshed = true;
      window.location.reload();
    });
  }, []);

  return null;
}
