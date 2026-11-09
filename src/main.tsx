import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './i18n';
import { ThemeProvider, applyTheme, readThemeMode, resolveTheme } from './theme';
import './index.css';

// Set the theme before the first paint, so dark mode doesn't flash white
applyTheme(resolveTheme(readThemeMode()));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
