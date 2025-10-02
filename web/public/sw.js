// TaskFlow Service Worker
const CACHE_NAME = 'taskflow-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Fetch event - Network first, then cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'You have a new notification from TaskFlow',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'taskflow-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: data.actions || [
      {
        action: 'open',
        title: 'Open TaskFlow',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'TaskFlow', 
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;
  
  notification.close();

  if (action === 'open' || !action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        if (clients.openWindow) {
          const targetUrl = notification.data?.url || '/app/dashboard';
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncOfflineTasks());
  }
});

async function syncOfflineTasks() {
  try {
    // Get offline tasks from IndexedDB
    const offlineTasks = await getOfflineTasks();
    
    for (const task of offlineTasks) {
      try {
        // Attempt to sync task to server
        await syncTaskToServer(task);
        // Remove from offline storage if successful
        await removeOfflineTask(task.id);
      } catch (error) {
        console.error('Failed to sync task:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Placeholder functions for offline sync
async function getOfflineTasks() {
  // TODO: Implement IndexedDB retrieval
  return [];
}

async function syncTaskToServer(task) {
  // TODO: Implement server sync
  console.log('Syncing task:', task);
}

async function removeOfflineTask(taskId) {
  // TODO: Implement IndexedDB removal
  console.log('Removing offline task:', taskId);
}