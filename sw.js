// Nome do cache
const CACHE_NAME = 'snaptoon-v3';

// Arquivos para cache - corrigindo os caminhos
const urlsToCache = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './manifest.json',
    './images/home.png',
    './images/icons/icon-192x192.png',
    './images/icons/icon-512x512.png'
    // Recursos externos podem falhar, então vamos removê-los do cache inicial
    // e deixar que sejam cacheados sob demanda
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache aberto');
                // Usando addAll com tratamento de erro para cada item
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(error => {
                            console.error(`Falha ao adicionar ${url} ao cache:`, error);
                            // Continua mesmo se um item falhar
                            return Promise.resolve();
                        });
                    })
                );
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptando requisições
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Se o recurso estiver no cache, retorna ele
                if (response) {
                    return response;
                }
                
                // Se não, busca na rede
                return fetch(event.request)
                    .then((response) => {
                        // Verifica se recebemos uma resposta válida
                        if (!response || response.status !== 200) {
                            return response;
                        }
                        
                        // Só armazena em cache recursos da mesma origem ou CDNs confiáveis
                        const url = new URL(event.request.url);
                        const isSameOrigin = url.origin === self.location.origin;
                        const isTrustedCDN = 
                            url.hostname.includes('fonts.googleapis.com') || 
                            url.hostname.includes('fonts.gstatic.com') || 
                            url.hostname.includes('unpkg.com');
                        
                        if (isSameOrigin || isTrustedCDN) {
                            // Clone a resposta pois ela é um stream
                            // e só pode ser consumida uma vez
                            const responseToCache = response.clone();
                            
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache)
                                        .catch(error => {
                                            console.error('Erro ao armazenar em cache:', error);
                                        });
                                })
                                .catch(error => {
                                    console.error('Erro ao abrir cache:', error);
                                });
                        }
                            
                        return response;
                    })
                    .catch(error => {
                        console.error('Erro ao buscar recurso:', error);
                        
                        // Se falhar tudo, retorna uma página offline customizada
                        if (event.request.mode === 'navigate') {
                            return caches.match('./index.html');
                        }
                        
                        // Para outros recursos, retorna um erro
                        return new Response('Recurso não disponível offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Evento de atualização
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
}); 