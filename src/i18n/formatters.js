import i18n from './i18n.js';

export const getLocale = () => i18n.language === 'es' ? 'es-ES' : 'en-US';

export const formatCurrency = (value, currency = 'EUR') =>
  new Intl.NumberFormat(getLocale(), { style: 'currency', currency }).format(value);

export const formatNumber = (value, options = {}) =>
  new Intl.NumberFormat(getLocale(), options).format(value);

export const formatDate = (date, options = {}) => {
  if (!date) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(getLocale(), options);
};

export const formatDateTime = (date, options = {}) => {
  if (!date) return '--';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString(getLocale(), options);
};
