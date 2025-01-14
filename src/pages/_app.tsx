import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import "@/i18n/config";
import { useTranslation } from "react-i18next";

export default function App({ Component, pageProps }: AppProps) {
  const { i18n } = useTranslation();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        // Load preferred language from localStorage
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage) {
          await i18n.changeLanguage(savedLanguage);
        }
        console.log('App: i18n initialized with language:', i18n.language);
        console.log('App: test translation:', i18n.t('common.management'));
        setInitialized(true);
      } catch (error) {
        console.error('App: Error initializing i18n:', error);
        setInitialized(true); // Still set initialized to prevent infinite loading
      }
    };

    initializeI18n();
  }, [i18n]);

  if (!initialized) {
    return <div>Loading translations...</div>;
  }

  return <Component {...pageProps} />;
}
