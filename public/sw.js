// Service Worker for NutriFlow PWA
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'nutriflow-v1.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const API_CACHE = `${CACHE_NAME}-api`;

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/clients',
  '/dashboard/messages',
  '/dashboard/calendar',
  '/dashboard/analytics',
  '/manifest.json',
  '/favicon.png',
  // Add other critical assets
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/clients',
  '/api/appointments',
  '/api/messages',
  '/api/meal-plans'
];

// Background sync tags
const SYNC_TAGS = {
  SEND_MESSAGE: 'send-message',
  UPDATE_CLIENT: 'update-client',
  CREATE_APPOINTMENT: 'create-appointment',
  UPLOAD_WEIGHT: 'upload-weight'
};

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('nutriflow-') && 
                     !cacheName.includes(CACHE_NAME);
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'You are currently offline. Some data may not be up to date.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests with cache-first strategy for shell
async function handleNavigationRequest(request) {
  const cache = await caches.open(STATIC_CACHE);
  
  try {
    // Try cache first for app shell
    const cachedResponse = await cache.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline page
    return cache.match('/') || new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>NutriFlow - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              text-align: center; 
              padding: 2rem; 
              background: #f9fafb;
              color: #374151;
            }
            .container { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            h1 { color: #22c55e; margin-bottom: 1rem; }
            .retry-btn {
              background: #22c55e;
              color: white;
              border: none;
              padding: 0.75rem 1.5rem;
              border-radius: 0.5rem;
              font-size: 1rem;
              cursor: pointer;
              margin-top: 1rem;
            }
            .retry-btn:hover { background: #16a34a; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">🥗</div>
            <h1>NutriFlow</h1>
            <h2>Vous êtes hors ligne</h2>
            <p>Vérifiez votre connexion internet et réessayez.</p>
            <button class="retry-btn" onclick="location.reload()">Réessayer</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Static request failed:', error);
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.SEND_MESSAGE:
      event.waitUntil(syncMessages());
      break;
    case SYNC_TAGS.UPDATE_CLIENT:
      event.waitUntil(syncClientUpdates());
      break;
    case SYNC_TAGS.CREATE_APPOINTMENT:
      event.waitUntil(syncAppointments());
      break;
    case SYNC_TAGS.UPLOAD_WEIGHT:
      event.waitUntil(syncWeightData());
      break;
  }
});

// Sync offline messages
async function syncMessages() {
  try {
    const db = await openIndexedDB();
    const pendingMessages = await getStoredData(db, 'pending-messages');
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        });
        
        if (response.ok) {
          await removeStoredData(db, 'pending-messages', message.id);
          
          // Notify client of successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                action: 'MESSAGE_SENT',
                data: message.data
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync messages:', error);
  }
}

// Sync client updates
async function syncClientUpdates() {
  try {
    const db = await openIndexedDB();
    const pendingUpdates = await getStoredData(db, 'pending-client-updates');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(`/api/clients/${update.clientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removeStoredData(db, 'pending-client-updates', update.id);
          
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                action: 'CLIENT_UPDATED',
                data: update.data
              });
            });
          });
        }
      } catch (error) {
        console.error('Failed to sync client update:', error);
      }
    }
  } catch (error) {
    console.error('Failed to sync client updates:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  if (!event.data) return;
  
  const data = event.data.json();
  const title = data.title || 'NutriFlow';
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    vibrate: data.vibrate || [200, 100, 200]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let url = '/dashboard';
  
  // Determine URL based on notification type
  switch (data.type) {
    case 'message':
      url = `/dashboard/messages?conversation=${data.conversationId}`;
      break;
    case 'appointment':
      url = `/dashboard/appointments?id=${data.appointmentId}`;
      break;
    case 'client':
      url = `/dashboard/clients/${data.clientId}`;
      break;
    case 'reminder':
      url = `/dashboard/reminders?id=${data.reminderId}`;
      break;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// IndexedDB utilities for offline storage
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('nutriflow-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending-client-updates')) {
        db.createObjectStore('pending-client-updates', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending-appointments')) {
        db.createObjectStore('pending-appointments', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pending-weight-data')) {
        db.createObjectStore('pending-weight-data', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getStoredData(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeStoredData(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      Promise.all([
        syncMessages(),
        syncClientUpdates(),
        syncAppointments(),
        syncWeightData()
      ])
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'STORE_OFFLINE_DATA':
      storeOfflineData(data.storeName, data.data);
      break;
    case 'GET_OFFLINE_DATA':
      getOfflineData(data.storeName).then(result => {
        event.ports[0].postMessage({ type: 'OFFLINE_DATA', data: result });
      });
      break;
  }
});

async function storeOfflineData(storeName, data) {
  try {
    const db = await openIndexedDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    await store.add(data);
  } catch (error) {
    console.error('Failed to store offline data:', error);
  }
}

async function getOfflineData(storeName) {
  try {
    const db = await openIndexedDB();
    return await getStoredData(db, storeName);
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return [];
  }
}
