import React, { useEffect, useMemo, useState, createContext, useContext, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { esES } from '@mui/material/locale';
import { enUS } from '@mui/material/locale';
import i18n from './i18n/i18n.js';
import App from './App.jsx';
import { getDesignTokens } from './theme.js';
import './index.css';

const MUI_LOCALES = { es: esES, en: enUS };

const DARK_MODE_KEY = 'beworking_dark_mode';

export const ColorModeContext = createContext({ mode: 'light', toggleColorMode: () => {} });

export const useColorMode = () => useContext(ColorModeContext);

const Root = () => {
  const [lang, setLang] = useState(i18n.language);
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(DARK_MODE_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const handler = (lng) => setLang(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(DARK_MODE_KEY, next); } catch {}
      return next;
    });
  }, []);

  const colorModeValue = useMemo(() => ({ mode, toggleColorMode }), [mode, toggleColorMode]);

  const theme = useMemo(
    () => createTheme(getDesignTokens(mode), MUI_LOCALES[lang] || esES),
    [lang, mode]
  );

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
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
