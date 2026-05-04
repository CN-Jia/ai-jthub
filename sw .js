// Service Worker placeholder — 已移除第三方广告脚本
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
