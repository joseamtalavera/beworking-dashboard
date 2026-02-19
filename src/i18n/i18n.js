import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import esCommon from './locales/es/common.json';
import enCommon from './locales/en/common.json';
import esBooking from './locales/es/booking.json';
import enBooking from './locales/en/booking.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      es: { common: esCommon, booking: esBooking },
      en: { common: enCommon, booking: enBooking },
    },
    lng: localStorage.getItem('beworking_lang') || 'es',
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'booking'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
