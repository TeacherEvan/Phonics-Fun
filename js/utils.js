/**
 * Debounce utility - delays function execution until after wait ms have elapsed
 * since the last invocation.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { debounce };
}