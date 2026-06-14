module.exports = [
  {
    ignores: ["js/asteroid.js"]
  },
  {
    files: ["js/**/*.js", "Tests/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        Image: "readonly",
        Audio: "readonly",
        fetch: "readonly",
        Promise: "readonly",
        Map: "readonly",
        Set: "readonly",
        Object: "readonly",
        Array: "readonly",
        localStorage: "readonly",
        PerformanceUtils: "readonly",
        PHONICS_FUN_LETTER_DATA: "readonly",
        navigator: "readonly",
        screen: "readonly",
        performance: "readonly",
        IntersectionObserver: "readonly",
        PerformanceObserver: "readonly",
        SpeechSynthesisUtterance: "readonly",
        EventTarget: "readonly",
        CustomEvent: "readonly",
        MouseEvent: "readonly",
        Blob: "readonly",
        URL: "readonly",
        webkitAudioContext: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        devicePixelRatio: "readonly",
        require: "readonly",
        module: "readonly",
        vi: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        AudioManager: "readonly",
        EventManager: "readonly",
        CollisionManager: "readonly",
        UIUtils: "readonly",
        DisplayManager: "readonly",
        EventBus: "readonly",
        ParticleSystem: "readonly",
        MCPAudioDiagnostic: "readonly",
        MCPPerformanceDiagnostic: "readonly",
        MCPTouchDiagnostic: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "warn"
    }
  }
];