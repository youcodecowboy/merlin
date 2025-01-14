import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import trTranslations from './locales/tr.json';

const resources = {
  en: {
    translation: enTranslations
  },
  tr: {
    translation: trTranslations
  }
};

// Log the loaded translations for debugging
console.log('Loaded translations:', {
  en: Object.keys(enTranslations),
  tr: Object.keys(trTranslations)
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    debug: true,
    react: {
      useSuspense: false
    }
  })
  .then(() => {
    console.log('i18n initialized successfully');
    console.log('Available languages:', i18n.languages);
    console.log('Current language:', i18n.language);
    console.log('Test translation:', i18n.t('common.management'));
  })
  .catch((error) => {
    console.error('i18n initialization error:', error);
  });

// Add language change listener
i18n.on('languageChanged', (lng) => {
  console.log('Language changed to:', lng);
  console.log('Test translation after change:', i18n.t('common.management'));
});

export default i18n; 