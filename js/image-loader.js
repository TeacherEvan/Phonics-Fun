/**
 * Image loading with candidate fallback.
 *
 * A word's picture can live under several names — a generated word card
 * (`.svg`), a raster original (`.png`), or a decorated raster name. Two
 * consumers need to resolve the same list (the gameplay display and the
 * preload), and when they each build their own URL they drift: the display
 * was fixed to try the candidates in order while the preload still
 * hard-coded a single `.png` path, which 404'd for every word in the
 * curriculum and left the cache permanently empty.
 *
 * @module image-loader
 */

/**
 * Probe a list of candidate URLs and resolve with the first that loads.
 *
 * @param {string[]} candidates - URLs to try, most preferred first
 * @returns {Promise<{url: string, image: HTMLImageElement}|null>}
 *   null when every candidate failed
 */
export function loadFirstAvailableImage(candidates) {
    return new Promise((resolve) => {
        if (!candidates || candidates.length === 0) {
            resolve(null);
            return;
        }

        const attempt = (index) => {
            if (index >= candidates.length) {
                resolve(null);
                return;
            }

            const url = candidates[index];
            const image = new Image();
            image.onload = () => resolve({ url, image });
            image.onerror = () => attempt(index + 1);
            image.src = url;
        };

        attempt(0);
    });
}
