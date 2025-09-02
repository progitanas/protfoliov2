// Joke Generator App
class JokeGenerator {
    constructor() {
        this.currentJoke = null;
        this.history = JSON.parse(localStorage.getItem('jokeHistory')) || [];
        this.favorites = JSON.parse(localStorage.getItem('jokeFavorites')) || [];
        this.theme = localStorage.getItem('theme') || 'light';
        
        this.apiConfig = {
            baseUrl: 'https://v2.jokeapi.dev/joke',
            fallbackJokes: [
                {
                    type: 'single',
                    joke: 'Pourquoi les plongeurs plongent-ils toujours en arrière et jamais en avant ? Parce que sinon ils tombent dans le bateau !',
                    category: 'misc',
                    id: 'fallback-1'
                },
                {
                    type: 'twopart',
                    setup: 'Que dit un escargot quand il croise une limace ?',
                    delivery: 'Regarde le nudiste !',
                    category: 'pun',
                    id: 'fallback-2'
                },
                {
                    type: 'single',
                    joke: 'Les mathématiques, c\'est comme l\'amour : une idée simple, mais qui peut devenir compliquée.',
                    category: 'programming',
                    id: 'fallback-3'
                }
            ]
        };
        
        this.init();
    }
    
    init() {
        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.updateUI();
        this.loadRandomJoke();
    }
    
    initElements() {
        this.elements = {
            // Theme toggle
            themeToggle: document.getElementById('themeToggle'),
            themeIcon: document.querySelector('.theme-icon'),
            
            // Controls
            categorySelect: document.getElementById('categorySelect'),
            newJokeBtn: document.getElementById('newJokeBtn'),
            
            // Joke display
            jokeCard: document.getElementById('jokeCard'),
            jokeLoading: document.getElementById('jokeLoading'),
            jokeContent: document.getElementById('jokeContent'),
            jokeError: document.getElementById('jokeError'),
            jokeSetup: document.getElementById('jokeSetup'),
            jokeDelivery: document.getElementById('jokeDelivery'),
            jokeSingle: document.getElementById('jokeSingle'),
            
            // Actions
            favoriteBtn: document.getElementById('favoriteBtn'),
            shareBtn: document.getElementById('shareBtn'),
            copyBtn: document.getElementById('copyBtn'),
            retryBtn: document.getElementById('retryBtn'),
            
            // Tabs
            tabsNav: document.getElementById('tabsNav'),
            historyTab: document.getElementById('historyTab'),
            favoritesTab: document.getElementById('favoritesTab'),
            
            // Lists
            historyList: document.getElementById('historyList'),
            favoritesList: document.getElementById('favoritesList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            clearFavoritesBtn: document.getElementById('clearFavoritesBtn'),
            
            // Toast container
            toastContainer: document.getElementById('toastContainer')
        };
    }
    
    initEventListeners() {
        // Theme toggle
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Controls
        this.elements.newJokeBtn.addEventListener('click', () => this.loadRandomJoke());
        this.elements.retryBtn.addEventListener('click', () => this.loadRandomJoke());
        
        // Joke actions
        this.elements.favoriteBtn.addEventListener('click', () => this.toggleFavorite());
        this.elements.shareBtn.addEventListener('click', () => this.shareJoke());
        this.elements.copyBtn.addEventListener('click', () => this.copyJoke());
        
        // Tab navigation
        this.elements.tabsNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-btn')) {
                this.switchTab(e.target.dataset.tab);
            }
        });
        
        // Clear buttons
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.elements.clearFavoritesBtn.addEventListener('click', () => this.clearFavorites());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    initTheme() {
        document.body.className = `${this.theme}-theme`;
        this.elements.themeIcon.textContent = this.theme === 'light' ? '🌙' : '☀️';
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.initTheme();
        this.showToast('info', `Thème ${this.theme === 'light' ? 'clair' : 'sombre'} activé`);
    }
    
    async loadRandomJoke() {
        this.showLoading();
        
        try {
            const category = this.elements.categorySelect.value;
            const joke = await this.fetchJoke(category);
            
            if (joke) {
                this.currentJoke = joke;
                this.displayJoke(joke);
                this.addToHistory(joke);
                this.updateUI();
            } else {
                this.showError();
            }
        } catch (error) {
            console.error('Error loading joke:', error);
            this.showError();
        }
    }
    
    async fetchJoke(category = 'any') {
        try {
            const categoryParam = category === 'any' ? 'Any' : category;
            const url = `${this.apiConfig.baseUrl}/${categoryParam}?format=json&blacklistFlags=nsfw,religious,political,racist,sexist,explicit`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                timeout: 5000
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.message || 'API Error');
            }
            
            return {
                id: data.id || Date.now(),
                type: data.type,
                category: data.category,
                setup: data.setup,
                delivery: data.delivery,
                joke: data.joke,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.warn('API request failed, using fallback:', error);
            return this.getFallbackJoke(category);
        }
    }
    
    getFallbackJoke(category) {
        let availableJokes = [...this.apiConfig.fallbackJokes];
        
        if (category !== 'any') {
            const categoryJokes = availableJokes.filter(joke => joke.category === category);
            if (categoryJokes.length > 0) {
                availableJokes = categoryJokes;
            }
        }
        
        const randomJoke = availableJokes[Math.floor(Math.random() * availableJokes.length)];
        return {
            ...randomJoke,
            id: randomJoke.id || Date.now(),
            timestamp: Date.now()
        };
    }
    
    showLoading() {
        this.elements.jokeLoading.style.display = 'flex';
        this.elements.jokeContent.style.display = 'none';
        this.elements.jokeError.style.display = 'none';
    }
    
    showError() {
        this.elements.jokeLoading.style.display = 'none';
        this.elements.jokeContent.style.display = 'none';
        this.elements.jokeError.style.display = 'flex';
    }
    
    displayJoke(joke) {
        this.elements.jokeLoading.style.display = 'none';
        this.elements.jokeError.style.display = 'none';
        
        if (joke.type === 'single') {
            this.elements.jokeSingle.textContent = joke.joke;
            this.elements.jokeSingle.style.display = 'block';
            this.elements.jokeSetup.style.display = 'none';
            this.elements.jokeDelivery.style.display = 'none';
        } else {
            this.elements.jokeSetup.textContent = joke.setup;
            this.elements.jokeDelivery.textContent = joke.delivery;
            this.elements.jokeSetup.style.display = 'block';
            this.elements.jokeDelivery.style.display = 'block';
            this.elements.jokeSingle.style.display = 'none';
        }
        
        this.elements.jokeContent.style.display = 'block';
        this.updateFavoriteButton();
    }
    
    getJokeText(joke) {
        if (joke.type === 'single') {
            return joke.joke;
        } else {
            return `${joke.setup} ${joke.delivery}`;
        }
    }
    
    toggleFavorite() {
        if (!this.currentJoke) return;
        
        const jokeId = this.currentJoke.id;
        const existingIndex = this.favorites.findIndex(fav => fav.id === jokeId);
        
        if (existingIndex > -1) {
            this.favorites.splice(existingIndex, 1);
            this.showToast('info', 'Retiré des favoris');
        } else {
            this.favorites.unshift({ ...this.currentJoke });
            this.showToast('success', 'Ajouté aux favoris');
        }
        
        // Keep only last 50 favorites
        if (this.favorites.length > 50) {
            this.favorites = this.favorites.slice(0, 50);
        }
        
        localStorage.setItem('jokeFavorites', JSON.stringify(this.favorites));
        this.updateFavoriteButton();
        this.updateUI();
    }
    
    updateFavoriteButton() {
        if (!this.currentJoke) return;
        
        const isFavorited = this.favorites.some(fav => fav.id === this.currentJoke.id);
        this.elements.favoriteBtn.classList.toggle('active', isFavorited);
        this.elements.favoriteBtn.title = isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris';
    }
    
    async shareJoke() {
        if (!this.currentJoke) return;
        
        const jokeText = this.getJokeText(this.currentJoke);
        const shareData = {
            title: 'Blague aléatoire',
            text: jokeText,
            url: window.location.href
        };
        
        try {
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                await navigator.share(shareData);
                this.showToast('success', 'Blague partagée');
            } else {
                // Fallback to clipboard
                await this.copyToClipboard(jokeText);
                this.showToast('success', 'Blague copiée dans le presse-papier');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
                await this.copyToClipboard(jokeText);
                this.showToast('info', 'Blague copiée dans le presse-papier');
            }
        }
    }
    
    async copyJoke() {
        if (!this.currentJoke) return;
        
        const jokeText = this.getJokeText(this.currentJoke);
        await this.copyToClipboard(jokeText);
        this.showToast('success', 'Blague copiée');
    }
    
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                return new Promise((resolve, reject) => {
                    if (document.execCommand('copy')) {
                        textArea.remove();
                        resolve();
                    } else {
                        textArea.remove();
                        reject(new Error('Copy failed'));
                    }
                });
            }
        } catch (error) {
            console.error('Copy failed:', error);
            throw error;
        }
    }
    
    addToHistory(joke) {
        // Avoid duplicates
        const existingIndex = this.history.findIndex(item => item.id === joke.id);
        if (existingIndex > -1) {
            this.history.splice(existingIndex, 1);
        }
        
        this.history.unshift({ ...joke });
        
        // Keep only last 20 jokes
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }
        
        localStorage.setItem('jokeHistory', JSON.stringify(this.history));
    }
    
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}Tab`);
        });
        
        this.updateUI();
    }
    
    updateUI() {
        this.updateHistoryList();
        this.updateFavoritesList();
    }
    
    updateHistoryList() {
        if (this.history.length === 0) {
            this.elements.historyList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📜</div>
                    <p>Aucune blague dans l'historique</p>
                    <p class="empty-subtitle">Générez votre première blague !</p>
                </div>
            `;
        } else {
            this.elements.historyList.innerHTML = this.history
                .map(joke => this.createJokeItem(joke, 'history'))
                .join('');
        }
    }
    
    updateFavoritesList() {
        if (this.favorites.length === 0) {
            this.elements.favoritesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">⭐</div>
                    <p>Aucune blague favorite</p>
                    <p class="empty-subtitle">Ajoutez vos blagues préférées !</p>
                </div>
            `;
        } else {
            this.elements.favoritesList.innerHTML = this.favorites
                .map(joke => this.createJokeItem(joke, 'favorites'))
                .join('');
        }
    }
    
    createJokeItem(joke, source) {
        const jokeText = this.getJokeText(joke);
        const truncatedText = jokeText.length > 150 ? 
            jokeText.substring(0, 150) + '...' : jokeText;
        
        const timeAgo = this.getTimeAgo(joke.timestamp);
        
        return `
            <div class="joke-item" onclick="app.displayStoredJoke('${joke.id}', '${source}')">
                <div class="joke-item-text">${this.escapeHtml(truncatedText)}</div>
                <div class="joke-item-meta">
                    <div class="joke-item-category">${this.escapeHtml(joke.category)}</div>
                    <div class="joke-item-actions">
                        <span>${timeAgo}</span>
                        ${source === 'history' ? 
                            `<button class="joke-item-action" onclick="event.stopPropagation(); app.addToFavoritesFromHistory('${joke.id}')" title="Ajouter aux favoris">⭐</button>` :
                            `<button class="joke-item-action" onclick="event.stopPropagation(); app.removeFromFavorites('${joke.id}')" title="Retirer des favoris">🗑️</button>`
                        }
                        <button class="joke-item-action" onclick="event.stopPropagation(); app.copyStoredJoke('${joke.id}', '${source}')" title="Copier">📋</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    displayStoredJoke(jokeId, source) {
        const jokes = source === 'history' ? this.history : this.favorites;
        const joke = jokes.find(j => j.id == jokeId);
        
        if (joke) {
            this.currentJoke = joke;
            this.displayJoke(joke);
            this.updateFavoriteButton();
        }
    }
    
    addToFavoritesFromHistory(jokeId) {
        const joke = this.history.find(j => j.id == jokeId);
        if (joke && !this.favorites.some(fav => fav.id == jokeId)) {
            this.favorites.unshift({ ...joke });
            if (this.favorites.length > 50) {
                this.favorites = this.favorites.slice(0, 50);
            }
            localStorage.setItem('jokeFavorites', JSON.stringify(this.favorites));
            this.updateUI();
            this.showToast('success', 'Ajouté aux favoris');
        }
    }
    
    removeFromFavorites(jokeId) {
        this.favorites = this.favorites.filter(fav => fav.id != jokeId);
        localStorage.setItem('jokeFavorites', JSON.stringify(this.favorites));
        this.updateUI();
        this.showToast('info', 'Retiré des favoris');
        
        // Update current joke favorite status if it matches
        if (this.currentJoke && this.currentJoke.id == jokeId) {
            this.updateFavoriteButton();
        }
    }
    
    async copyStoredJoke(jokeId, source) {
        const jokes = source === 'history' ? this.history : this.favorites;
        const joke = jokes.find(j => j.id == jokeId);
        
        if (joke) {
            const jokeText = this.getJokeText(joke);
            await this.copyToClipboard(jokeText);
            this.showToast('success', 'Blague copiée');
        }
    }
    
    clearHistory() {
        if (this.history.length === 0) return;
        
        if (confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
            this.history = [];
            localStorage.removeItem('jokeHistory');
            this.updateUI();
            this.showToast('info', 'Historique effacé');
        }
    }
    
    clearFavorites() {
        if (this.favorites.length === 0) return;
        
        if (confirm('Êtes-vous sûr de vouloir effacer tous les favoris ?')) {
            this.favorites = [];
            localStorage.removeItem('jokeFavorites');
            this.updateUI();
            this.updateFavoriteButton();
            this.showToast('info', 'Favoris effacés');
        }
    }
    
    showToast(type, message, duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️',
            warning: '⚠️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        // Limit number of toasts
        const toasts = this.elements.toastContainer.querySelectorAll('.toast');
        if (toasts.length > 5) {
            toasts[0].remove();
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case ' ':
            case 'Enter':
                e.preventDefault();
                this.loadRandomJoke();
                break;
            case 'f':
            case 'F':
                if (this.currentJoke) {
                    e.preventDefault();
                    this.toggleFavorite();
                }
                break;
            case 'c':
            case 'C':
                if (this.currentJoke) {
                    e.preventDefault();
                    this.copyJoke();
                }
                break;
            case 's':
            case 'S':
                if (this.currentJoke) {
                    e.preventDefault();
                    this.shareJoke();
                }
                break;
            case 't':
            case 'T':
                e.preventDefault();
                this.toggleTheme();
                break;
            case '1':
                this.switchTab('history');
                break;
            case '2':
                this.switchTab('favorites');
                break;
        }
    }
    
    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) return `${days}j`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}min`;
        return 'Maintenant';
    }
    
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Performance optimization
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new JokeGenerator();
});

// Handle online/offline status
window.addEventListener('online', () => {
    document.body.classList.remove('offline');
    window.app?.showToast('success', 'Connexion rétablie');
});

window.addEventListener('offline', () => {
    document.body.classList.add('offline');
    window.app?.showToast('warning', 'Mode hors ligne - blagues de secours uniquement');
});

// Handle visibility change for performance
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.app) {
        // Refresh data when page becomes visible again
        window.app.updateUI();
    }
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, but app still works
        console.log('Service Worker registration failed');
    });
}