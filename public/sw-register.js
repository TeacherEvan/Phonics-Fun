/**
 * Service worker registration.
 *
 * This used to be an inline <script> in index.html. Moving it to an
 * external file keeps the inline surface of the document down to the
 * Vite legacy plugin's own loader scripts, and lets the Content-Security-
 * Policy stay as tight as the bundler allows.
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((reg) =>
                console.log(
                    'Service Worker registered successfully with scope:',
                    reg.scope
                )
            )
            .catch((err) =>
                console.error('Service Worker registration failed:', err)
            );
    });
}
