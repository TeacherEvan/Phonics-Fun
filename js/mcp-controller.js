/**
 * MCP Diagnostic Controller
 * This controller integrates all MCP diagnostic tools for Android compatibility testing
 * Author: GitHub Copilot
 * Date: July 16, 2025
 */

class MCPDiagnosticController {
    constructor() {
        this.tools = {
            audio: null,
            performance: null,
            touch: null
        };
        
        this.results = {
            audio: null,
            performance: null,
            touch: null,
            overall: null,
            timestamp: null,
            deviceInfo: null
        };
        
        this.initialized = false;
    }

    /**
     * Initialize the MCP diagnostic controller
     * @returns {boolean} Success status
     */
    initialize() {
        console.log('[MCP Controller] Initializing MCP diagnostic controller...');
        
        try {
            // Initialize audio diagnostic
            if (window.MCPAudioDiagnostic) {
                this.tools.audio = new MCPAudioDiagnostic();
                console.log('[MCP Controller] Audio diagnostic initialized');
            } else {
                console.warn('[MCP Controller] MCPAudioDiagnostic not found');
            }
            
            // Initialize performance diagnostic
            if (window.MCPPerformanceDiagnostic) {
                this.tools.performance = new MCPPerformanceDiagnostic();
                console.log('[MCP Controller] Performance diagnostic initialized');
            } else {
                console.warn('[MCP Controller] MCPPerformanceDiagnostic not found');
            }
            
            // Initialize touch diagnostic
            if (window.MCPTouchDiagnostic) {
                this.tools.touch = new MCPTouchDiagnostic();
                console.log('[MCP Controller] Touch diagnostic initialized');
            } else {
                console.warn('[MCP Controller] MCPTouchDiagnostic not found');
            }
            
            this.initialized = true;
            console.log('[MCP Controller] Initialization complete');
            
            // Collect device information
            this.collectDeviceInfo();
            
            return true;
        } catch (error) {
            console.error('[MCP Controller] Initialization failed:', error);
            return false;
        }
    }

    /**
     * Collect device and browser information
     */
    collectDeviceInfo() {
        this.results.deviceInfo = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            screenWidth: screen.width,
            screenHeight: screen.height,
            pixelRatio: window.devicePixelRatio || 1,
            touchPoints: navigator.maxTouchPoints || 0,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            online: navigator.onLine,
            connectionType: navigator.connection ? navigator.connection.effectiveType : 'unknown',
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown'
        };
        
        console.log('[MCP Controller] Device info collected:', this.results.deviceInfo);
    }

    /**
     * Start a diagnostic scan with selected tools
     * @param {Object} options - Options for the scan
     * @returns {Promise} Promise that resolves with scan results
     */
    async startScan(options = { audio: true, performance: true, touch: true }) {
        if (!this.initialized) {
            console.warn('[MCP Controller] Controller not initialized. Please call initialize() first.');
            return null;
        }
        
        console.log('[MCP Controller] Starting MCP diagnostic scan...');
        this.results.timestamp = new Date().toISOString();
        
        try {
            // Run audio diagnostic
            if (options.audio && this.tools.audio) {
                console.log('[MCP Controller] Running audio diagnostic...');
                this.results.audio = await this.tools.audio.runDiagnostic();
            }
            
            // Run performance diagnostic
            if (options.performance && this.tools.performance) {
                console.log('[MCP Controller] Running performance diagnostic...');
                this.results.performance = await this.tools.performance.runDiagnostic();
            }
            
            // Run touch diagnostic
            if (options.touch && this.tools.touch) {
                console.log('[MCP Controller] Running touch diagnostic...');
                this.results.touch = await this.tools.touch.runDiagnostic();
            }
            
            // Calculate overall results
            this.calculateOverallResults();
            
            console.log('[MCP Controller] Diagnostic scan complete, results:', this.results);
            return this.results;
        } catch (error) {
            console.error('[MCP Controller] Diagnostic scan failed:', error);
            return null;
        }
    }

    /**
     * Calculate overall results and scores
     */
    calculateOverallResults() {
        this.results.overall = {
            scores: {},
            recommendations: [],
            compatibilityScore: 0,
            compatibilityRating: '',
            timestamp: new Date().toISOString()
        };
        
        // Calculate scores
        if (this.results.audio && this.tools.audio) {
            this.results.overall.scores.audio = this.tools.audio.getAudioScore();
            this.results.overall.recommendations = this.results.overall.recommendations.concat(
                this.tools.audio.getRecommendations()
            );
        }
        
        if (this.results.performance && this.tools.performance) {
            this.results.overall.scores.performance = this.tools.performance.getPerformanceScore();
            this.results.overall.recommendations = this.results.overall.recommendations.concat(
                this.tools.performance.getRecommendations()
            );
        }
        
        if (this.results.touch && this.tools.touch) {
            this.results.overall.scores.touch = this.tools.touch.getTouchScore();
            this.results.overall.recommendations = this.results.overall.recommendations.concat(
                this.tools.touch.getRecommendations()
            );
        }
        
        // Calculate overall compatibility score
        let totalScore = 0;
        let totalWeight = 0;
        
        if (this.results.overall.scores.audio !== undefined) {
            totalScore += this.results.overall.scores.audio * 0.3;
            totalWeight += 0.3;
        }
        
        if (this.results.overall.scores.performance !== undefined) {
            totalScore += this.results.overall.scores.performance * 0.3;
            totalWeight += 0.3;
        }
        
        if (this.results.overall.scores.touch !== undefined) {
            totalScore += this.results.overall.scores.touch * 0.4;
            totalWeight += 0.4;
        }
        
        if (totalWeight > 0) {
            this.results.overall.compatibilityScore = Math.round(totalScore / totalWeight);
        }
        
        // Determine compatibility rating
        if (this.results.overall.compatibilityScore >= 90) {
            this.results.overall.compatibilityRating = 'Excellent';
        } else if (this.results.overall.compatibilityScore >= 75) {
            this.results.overall.compatibilityRating = 'Good';
        } else if (this.results.overall.compatibilityScore >= 60) {
            this.results.overall.compatibilityRating = 'Fair';
        } else if (this.results.overall.compatibilityScore >= 40) {
            this.results.overall.compatibilityRating = 'Poor';
        } else {
            this.results.overall.compatibilityRating = 'Critical';
        }
        
        console.log(`[MCP Controller] Overall compatibility score: ${this.results.overall.compatibilityScore} (${this.results.overall.compatibilityRating})`);
    }

    /**
     * Generate a report of all diagnostic results
     * @returns {Object} Report object
     */
    generateReport() {
        if (!this.results.overall) {
            console.warn('[MCP Controller] No diagnostic results available. Run startScan() first.');
            return null;
        }
        
        return {
            summary: {
                timestamp: this.results.timestamp,
                compatibilityScore: this.results.overall.compatibilityScore,
                compatibilityRating: this.results.overall.compatibilityRating,
                scores: this.results.overall.scores
            },
            deviceInfo: this.results.deviceInfo,
            recommendations: this.results.overall.recommendations,
            details: {
                audio: this.results.audio,
                performance: this.results.performance,
                touch: this.results.touch
            }
        };
    }

    /**
     * Export diagnostic results as a JSON file
     */
    exportResults() {
        if (!this.results.overall) {
            console.warn('[MCP Controller] No diagnostic results available. Run startScan() first.');
            return;
        }
        
        const report = this.generateReport();
        const reportJson = JSON.stringify(report, null, 2);
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `mcp-diagnostic-${new Date().toISOString().replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('[MCP Controller] Diagnostic results exported as JSON');
    }

    /**
     * Apply recommended fixes based on diagnostic results
     * @returns {boolean} Success status
     */
    applyRecommendedFixes() {
        if (!this.results.overall) {
            console.warn('[MCP Controller] No diagnostic results available. Run startScan() first.');
            return false;
        }
        
        console.log('[MCP Controller] Applying recommended fixes...');
        
        try {
            // Apply audio fixes
            if (this.tools.audio) {
                this.tools.audio.unlockAudio();
                console.log('[MCP Controller] Applied audio fixes');
            }
            
            // Apply touch fixes
            if (this.tools.touch) {
                this.tools.touch.applyTouchFixes();
                console.log('[MCP Controller] Applied touch fixes');
            }
            
            console.log('[MCP Controller] All recommended fixes applied');
            return true;
        } catch (error) {
            console.error('[MCP Controller] Failed to apply fixes:', error);
            return false;
        }
    }

    /**
     * Create a visual report UI on the page
     * @param {HTMLElement} container - Container element for the report
     */
    createVisualReport(container) {
        if (!this.results.overall) {
            console.warn('[MCP Controller] No diagnostic results available. Run startScan() first.');
            return null;
        }
        
        const report = this.generateReport();
        
        // Create report container
        const reportDiv = document.createElement('div');
        reportDiv.style.fontFamily = 'Arial, sans-serif';
        reportDiv.style.padding = '20px';
        reportDiv.style.backgroundColor = '#f5f5f5';
        reportDiv.style.borderRadius = '10px';
        reportDiv.style.marginTop = '20px';
        
        // Create header
        const header = document.createElement('div');
        header.innerHTML = `
            <h2>MCP Diagnostic Report</h2>
            <p><strong>Date:</strong> ${new Date(report.summary.timestamp).toLocaleString()}</p>
            <p><strong>Overall Compatibility:</strong> ${report.summary.compatibilityScore}/100 (${report.summary.compatibilityRating})</p>
        `;
        reportDiv.appendChild(header);
        
        // Create score section
        const scoreDiv = document.createElement('div');
        scoreDiv.style.display = 'flex';
        scoreDiv.style.justifyContent = 'space-around';
        scoreDiv.style.margin = '20px 0';
        
        for (const [key, score] of Object.entries(report.summary.scores)) {
            const scoreItem = document.createElement('div');
            scoreItem.style.textAlign = 'center';
            
            // Determine color based on score
            let color = '#ff0000'; // Red
            if (score >= 90) color = '#00cc00'; // Green
            else if (score >= 75) color = '#99cc00'; // Yellow-green
            else if (score >= 60) color = '#ffcc00'; // Yellow
            else if (score >= 40) color = '#ff9900'; // Orange
            
            scoreItem.innerHTML = `
                <div style="font-size: 40px; font-weight: bold; color: ${color};">${score}</div>
                <div style="font-size: 16px; text-transform: capitalize;">${key}</div>
            `;
            
            scoreDiv.appendChild(scoreItem);
        }
        
        reportDiv.appendChild(scoreDiv);
        
        // Create recommendations section
        const recsDiv = document.createElement('div');
        recsDiv.innerHTML = '<h3>Recommendations</h3>';
        
        const recsList = document.createElement('ul');
        recsList.style.paddingLeft = '20px';
        
        report.recommendations.forEach(rec => {
            const recItem = document.createElement('li');
            recItem.style.margin = '10px 0';
            
            let severityColor = '#999';
            if (rec.severity === 'critical') severityColor = '#ff0000';
            else if (rec.severity === 'high') severityColor = '#ff9900';
            else if (rec.severity === 'medium') severityColor = '#ffcc00';
            
            recItem.innerHTML = `
                <div><strong style="color: ${severityColor};">${rec.severity.toUpperCase()}</strong>: ${rec.message}</div>
                <div style="margin-top: 5px; color: #666;">Solution: ${rec.solution}</div>
            `;
            
            recsList.appendChild(recItem);
        });
        
        recsDiv.appendChild(recsList);
        reportDiv.appendChild(recsDiv);
        
        // Create device info section
        const deviceDiv = document.createElement('div');
        deviceDiv.innerHTML = '<h3>Device Information</h3>';
        
        const deviceTable = document.createElement('table');
        deviceTable.style.width = '100%';
        deviceTable.style.borderCollapse = 'collapse';
        
        for (const [key, value] of Object.entries(report.deviceInfo)) {
            if (key === 'userAgent') continue; // Skip full user agent
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; text-transform: capitalize;">${key.replace(/([A-Z])/g, ' $1')}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${value}</td>
            `;
            
            deviceTable.appendChild(row);
        }
        
        deviceDiv.appendChild(deviceTable);
        reportDiv.appendChild(deviceDiv);
        
        // Add export button
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Full Report (JSON)';
        exportBtn.style.padding = '10px 20px';
        exportBtn.style.backgroundColor = '#4CAF50';
        exportBtn.style.color = 'white';
        exportBtn.style.border = 'none';
        exportBtn.style.borderRadius = '5px';
        exportBtn.style.cursor = 'pointer';
        exportBtn.style.marginTop = '20px';
        exportBtn.style.fontSize = '14px';
        
        exportBtn.addEventListener('click', () => {
            this.exportResults();
        });
        
        reportDiv.appendChild(exportBtn);
        
        // Add to container
        (container || document.body).appendChild(reportDiv);
        
        return reportDiv;
    }
}

// Export for module systems or attach to window
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MCPDiagnosticController;
} else {
    window.MCPDiagnosticController = MCPDiagnosticController;
}
