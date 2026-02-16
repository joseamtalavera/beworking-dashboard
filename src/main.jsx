import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { esES } from '@mui/material/locale';
import { enUS } from '@mui/material/locale';
import i18n from './i18n/i18n.js';
import App from './App.jsx';
import baseTheme from './theme.js';
import './index.css';

const MUI_LOCALES = { es: esES, en: enUS };

const Root = () => {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng) => setLang(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const theme = useMemo(
    () => createTheme(baseTheme, MUI_LOCALES[lang] || esES),
    [lang]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
