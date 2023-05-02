'use strict'; // detectará errores de programación

var cacheVersion = 1; // variables que vamos a necesitar
var currentCache = {
    offline: 'offline-cache' + cacheVersion
};
const offlineUrl = 'juego-offline.html'; // pagina que queremos cachear

function createCacheBustedRequest(url){
    let request= new Request(url, {cache:'reload'});

    if ('cache' in request){
        return request;
    }

    let bustedURL= new URL(url, self.location.href);
    bustedURL.search += (bustedURL.search ? '&' : '') + 'cachebust=' + Date.now();
    return request;
}

this.addEventListener('install', event => { // el evento “install” lo lanza el SW
    event.waitUntil( // bloqueamos la la instalacion hasta terminar de cachear elementos, si falla la instalacion fallara tambien
        caches.open(currentCache.offline).then(function(cache) {
            return cache.addAll([
                offlineUrl
            ]);
        })
    );
});

this.addEventListener('fetch', event => {
    // request.mode = navigate isn't supported in all browsers
    // so include a check for Accept: text/html header.
    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith(
            fetch(createCacheBustedRequest(event.request.url)).catch(error => {
                // Return the offline page
                return caches.match(offlineUrl);
            })
        );
    }
    else{
        // Respond with everything else if we can
        event.respondWith(caches.match(event.request)
            .then(function (response) {
                return response || fetch(event.request);
            })
        );
    }
});