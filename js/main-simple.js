/**
 * Phonics Fun - Letter G Game - Minimal Version
 * Educational game for learning phonics
 */

// Simple game state that avoids modern JS syntax
function PhonicsGame() {
    this.currentScreen = 'welcome';
    this.correctHits = 0;
    this.totalHits = 5;
    this.gameActive = false;
    
    console.log('Initializing Phonics Fun game...');
    this.setupEventListeners();
    this.showScreen('welcome');
}

PhonicsGame.prototype.setupEventListeners = function() {
    var self = this;
    
    // Welcome screen
    document.getElementById('start-game-btn').addEventListener('click', function() {
        console.log('Start game clicked');
        self.createLetterGrid(); // Create the letter grid before showing
        self.showScreen('level-select');
    });

    // Settings
    document.getElementById('settings-btn').addEventListener('click', function() {
        self.toggleSettings();
    });

    document.getElementById('close-settings').addEventListener('click', function() {
        self.toggleSettings();
    });
};

PhonicsGame.prototype.createLetterGrid = function() {
    var letterGrid = document.getElementById('letter-grid');
    letterGrid.innerHTML = ''; // Clear existing content
    
    // Create A-Z buttons
    for (var i = 0; i < 26; i++) {
        var letter = String.fromCharCode(65 + i); // Convert to A-Z
        var button = document.createElement('button');
        button.className = 'letter';
        button.setAttribute('data-letter', letter);
        button.textContent = letter;
        
        // Only G is playable for now
        if (letter === 'G') {
            button.classList.add('playable');
            button.addEventListener('click', this.createClickHandler(letter));
        } else {
            button.addEventListener('click', this.createComingSoonHandler(letter));
        }
        
        letterGrid.appendChild(button);
    }
};

PhonicsGame.prototype.createClickHandler = function(letter) {
    var self = this;
    return function() {
        console.log('Letter ' + letter + ' clicked');
        // TODO: Start the actual game
        alert('Game functionality for letter ' + letter + ' coming soon!');
    };
};

PhonicsGame.prototype.createComingSoonHandler = function(letter) {
    return function() {
        console.log('Letter ' + letter + ' clicked - coming soon');
        alert('COMING SOON!\n\nLetter ' + letter + ' will be available in a future update.');
    };
};

PhonicsGame.prototype.showScreen = function(screenId) {
    console.log('Showing screen: ' + screenId);
    
    // Hide all screens
    var screens = document.querySelectorAll('.screen');
    for (var i = 0; i < screens.length; i++) {
        screens[i].classList.remove('active');
    }
    
    // Show target screen
    document.getElementById(screenId + '-screen').classList.add('active');
    this.currentScreen = screenId;
};

PhonicsGame.prototype.toggleSettings = function() {
    var settingsPanel = document.getElementById('settings-panel');
    if (settingsPanel.classList.contains('hidden')) {
        settingsPanel.classList.remove('hidden');
    } else {
        settingsPanel.classList.add('hidden');
    }
};

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting minimal game...');
    window.game = new PhonicsGame();
});

// Export for compatibility
window.PhonicsGame = PhonicsGame;