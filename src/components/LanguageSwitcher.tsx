import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useEffect, useState } from 'react';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(i18n.language);

  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  const toggleLanguage = async () => {
    try {
      const newLang = currentLang === 'en' ? 'tr' : 'en';
      await i18n.changeLanguage(newLang);
      localStorage.setItem('preferredLanguage', newLang);
      setCurrentLang(newLang);
      console.log('Language toggled to:', newLang);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleLanguage}
      title={currentLang === 'en' ? 'Switch to Turkish' : 'İngilizce\'ye geç'}
    >
      <Globe className="h-5 w-5" />
      <span className="ml-2 text-xs font-bold">{currentLang.toUpperCase()}</span>
    </Button>
  );
} 