// Definimos a estrutura do i18n globalmente para evitar erros de "undefined" em outros scripts
window.i18n = {
    currentLang: 'pt',
    translations: {},
    t: function(key) {
        return this.translations[key] || key;
    },
    getCurrentLang: function() {
        return this.currentLang;
    }
};

async function initI18n() {
    const defaultLang = 'pt';
    let preferredLang = 'pt';

    try {
        preferredLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('en') ? 'en' : defaultLang);
    } catch (e) {
        console.warn("LocalStorage is disabled. Using default language.");
    }

    window.i18n.currentLang = preferredLang;

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`./locales/${lang}.json`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            window.i18n.translations = await response.json();
        } catch (e) {
            console.error(`Failed to load ${lang} translations:`, e);
        }
    }

    async function applyTranslations(lang) {
        await loadTranslations(lang);
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (window.i18n.t(key) !== key) {
                el.innerText = window.i18n.t(key);
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (window.i18n.t(key) !== key) {
                el.setAttribute('placeholder', window.i18n.t(key));
            }
        });

        document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    window.setLanguage = async (lang) => {
        try {
            localStorage.setItem('preferredLang', lang);
        } catch (e) {}
        window.i18n.currentLang = lang;
        await applyTranslations(lang);
    };

    await applyTranslations(preferredLang);
}

document.addEventListener('DOMContentLoaded', initI18n);
