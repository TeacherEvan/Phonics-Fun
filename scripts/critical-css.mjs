/**
 * Critical CSS extraction plugin.
 *
 * The stylesheet was inlined into index.html by hand: 43 rules copied out of
 * css/styles.css and kept in sync by eye. That is the same duplication
 * class that produced three broken class-name contracts (the controller
 * emitted `letter-button current` while the stylesheet styled
 * `.letter-button.playable`, and neither the letter tiles nor 25 of 26
 * target planets had any styling at all).
 *
 * This plugin extracts the critical rules FROM the stylesheet at build time
 * and injects them into the HTML, so the inline copy is generated and can
 * never drift. It works in dev and in build alike.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * The selectors that must be available before the stylesheet arrives.
 * Each one is a rule that affects the first paint.
 */
const CRITICAL_SELECTORS = [
    '*',
    'html',
    'body',
    '.screen',
    '.screen.active',
    '#welcome-screen',
    '.welcome-background',
    '.welcome-stars',
    '.welcome-planets',
    '.welcome-asteroids',
    '.welcome-container',
    '.pulsating-text',
    '.welcome-to',
    '.fun-with',
    '.teacher-name',
    '.primary-button',
    '.settings-container',
    '.settings-button',
];

const MARKER = '<!-- CRITICAL_CSS -->';

/**
 * Split a stylesheet into its top-level rules, keeping @media blocks whole.
 * @param {string} css
 * @returns {string[]} rule strings
 */
function splitRules(css) {
    const rules = [];
    let depth = 0;
    let current = '';
    let inComment = false;

    for (let i = 0; i < css.length; i++) {
        const char = css[i];
        const next = css[i + 1];

        if (inComment) {
            current += char;
            if (char === '*' && next === '/') {
                current += next;
                i++;
                inComment = false;
            }
            continue;
        }

        if (char === '/' && next === '*') {
            current += char + next;
            i++;
            inComment = true;
            continue;
        }

        current += char;

        if (char === '{') depth++;
        else if (char === '}') {
            depth--;
            if (depth === 0) {
                rules.push(current.trim());
                current = '';
            }
        }
    }

    if (current.trim()) rules.push(current.trim());
    return rules;
}

/**
 * The selector list a rule applies to.
 * @param {string} rule
 * @returns {string}
 */
function selectorOf(rule) {
    const brace = rule.indexOf('{');
    if (brace === -1) return '';
    return rule
        .slice(0, brace)
        .trim()
        .replace(/\s*\{[\s\S]*$/, '')
        .trim();
}

/**
 * The name of the keyframes an @keyframes block defines.
 * @param {string} rule
 * @returns {string|null}
 */
function keyframesName(rule) {
    const m = rule.match(/^@keyframes\s+([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
}

/**
 * The keyframes names referenced by a rule's animation declarations.
 * @param {string} rule
 * @returns {string[]}
 */
function referencedKeyframes(rule) {
    const names = [];
    for (const m of rule.matchAll(/animation(?:-name)?\s*:\s*([^;]+)/g)) {
        for (const token of m[1].split(',')) {
            const name = token.trim().split(/\s+/)[0];
            if (name && !name.startsWith('none') && !/^[\d.]+m?s$/.test(name)) {
                names.push(name);
            }
        }
    }
    return names;
}

/**
 * Extract the critical rules from a stylesheet.
 *
 * The @keyframes blocks a critical rule animates with are carried along:
 * dropping them would leave the first paint without the intended animation.
 *
 * @param {string} css
 * @param {string[]} selectors
 * @returns {string}
 */
export function extractCriticalCss(css, selectors) {
    const wanted = new Set(selectors);
    const rules = splitRules(css);
    const picked = [];
    const neededKeyframes = new Set();

    for (const rule of rules) {
        const name = keyframesName(rule);
        if (name !== null) continue; // handled in the second pass

        if (rule.startsWith('@')) {
            // A media block is kept only if it contains a wanted selector.
            const inner = rule.slice(
                rule.indexOf('{') + 1,
                rule.lastIndexOf('}'),
            );
            const hasWanted = splitRules(inner).some((r) =>
                wanted.has(selectorOf(r)),
            );
            if (hasWanted) {
                picked.push(rule);
                for (const innerRule of splitRules(inner)) {
                    for (const kf of referencedKeyframes(innerRule)) {
                        neededKeyframes.add(kf);
                    }
                }
            }
            continue;
        }

        if (wanted.has(selectorOf(rule))) {
            picked.push(rule);
            for (const kf of referencedKeyframes(rule)) neededKeyframes.add(kf);
        }
    }

    // Second pass: carry the referenced @keyframes blocks along.
    // The stylesheet defines some keyframes twice; in CSS the LAST
    // definition wins, so only that one may be carried, otherwise the
    // animation would switch definition once the full stylesheet arrives.
    const keyframeRules = new Map();
    for (const rule of rules) {
        const name = keyframesName(rule);
        if (name !== null && neededKeyframes.has(name)) {
            keyframeRules.set(name, rule);
        }
    }
    for (const rule of keyframeRules.values()) picked.push(rule);

    return picked.join('\n');
}

/**
 * Vite plugin: replace the marker in index.html with the generated CSS.
 * @param {{root: string, marker?: string, selectors?: string[]}} options
 */
export function criticalCssPlugin(options) {
    const marker = options.marker ?? MARKER;

    return {
        name: 'critical-css',
        transformIndexHtml: {
            order: 'pre',
            handler(html, ctx) {
                const root = ctx?.server?.config?.root ?? options.root;
                const sheetPath = path.join(root, 'css', 'styles.css');
                if (!fs.existsSync(sheetPath)) return html;

                const css = fs.readFileSync(sheetPath, 'utf8');
                const critical = extractCriticalCss(
                    css,
                    options.selectors ?? CRITICAL_SELECTORS,
                );
                const block = `<style>${critical}</style>`;

                if (html.includes(marker)) {
                    return html.replace(marker, block);
                }

                // Replace an existing inline <style> block, if any.
                return html.replace(/<style>[\s\S]*?<\/style>/, block);
            },
        },
    };
}

export { CRITICAL_SELECTORS, MARKER };
