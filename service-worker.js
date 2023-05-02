'use strict'; // Detectara errores de programación

var cacheVersion = 1; // Variables que vamos a necesitar
var currentCache = {
    offline: 'offline-cache' + cacheVersion
};
const offlineUrl = 'juego-offline.html'; // Página que queremos cachear

/*
 * Función que genera una petición sin pasar por la caché del navegador (evita que tengamos que estar borrándola)
 */
function createCacheBustedRequest(url){
    let request= new Request(url, {cache:'reload'});

    if ('cache' in request) { // Si el navegador fuese moderno, con esto sería suficiente
        return request;
    }

    // Para navegadores no-modernos, añadimos un parámetro 'cachebust' con la fecha actual como valor
    let bustedURL= new URL(url, self.location.href);
    bustedURL.search += (bustedURL.search ? '&' : '') + 'cachebust=' + Date.now();
    return request;
}


this.addEventListener('install', event => { // El evento “install” lo lanza el SW
    event.waitUntil( // Bloqueamos la instalación hasta terminar de cachear elementos, si falla la instalación fallará también
        caches.open(currentCache.offline).then(function(cache) {
            return cache.addAll([
                './juego.js',
                offlineUrl
            ]);
        })
    );
});


/*
 * Si el usuario lanzar un método GET, el navegador elevará un evento FETCH
 * El service-worker lo captura (gestor de evento) y...
 *      - HAY CONEXIÓN --> Devolver lo pedido del servidor
 *      - NO HAY CONEXIÓN --> Puede devolver algo de la caché o generar algo dinámicamente
 */

this.addEventListener('fetch', event => {
    // 'request.mode = navigate' no está soportado por todos los navegadores, incluimos una segunda opción tras el '||'
    if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
        event.respondWith( // Respuesta que daremos
            // Petición al servidor, si hay conexión irá bien, si no (no hay conexion) devolvemos lo que tengamos cacheado
            // fetch(event.request.url).catch(error => {
            fetch(createCacheBustedRequest(event.request.url)).catch(error => {
                return caches.match(offlineUrl); // Devolvemos lo cacheado
            })
        );
    }
    else { // Si no es una petición de una página HTML
        // Si está en caché (response) la devolvemos, si no usamos fetch (vamos a pedirlo online)
        event.respondWith(caches.match(event.request).then(function (response) {
            return response || fetch(event.request);
        }));
    }
});