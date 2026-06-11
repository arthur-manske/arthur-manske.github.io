async function initI18n() {
    const defaultLang = 'pt';
    let currentLang = localStorage.getItem('preferredLang') || (navigator.language.startsWith('en') ? 'en' : defaultLang);

    let translations = {};

    async function loadTranslations(lang) {
        try {
            const response = await fetch(`./locales/${lang}.json`);
            translations = await response.json();
        } catch (e) {
            console.error(`Failed to load ${lang} translations`, e);
        }
    }

    async function applyTranslations(lang) {
        await loadTranslations(lang);
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) {
                el.innerText = translations[key];
            }
        });
        
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[key]) {
                el.setAttribute('placeholder', translations[key]);
            }
        });

        document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === lang);
        });
    }

    window.setLanguage = async (lang) => {
        localStorage.setItem('preferredLang', lang);
        await applyTranslations(lang);
    };

    window.i18n = {
        t: (key) => translations[key] || key,
        getCurrentLang: () => localStorage.getItem('preferredLang') || (navigator.language.startsWith('en') ? 'en' : defaultLang)
    };

    await applyTranslations(currentLang);
}

document.addEventListener('DOMContentLoaded', initI18n);
