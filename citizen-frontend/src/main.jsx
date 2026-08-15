import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import keycloak from './keycloak.js';
import { ThemeProvider } from './context/ThemeContext.jsx';
import FullPagePreloader from './components/FullPagePreloader.jsx';
import './index.css';

let initPromise = null;

function Root() {
  const [kcReady, setKcReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Safety fallback: if Keycloak SSO check takes longer than 2.5 seconds, unblock UI so visitor can view landing page
    const timeout = setTimeout(() => {
      setKcReady(true);
    }, 2200);

    const token = localStorage.getItem('kc_token');
    const refreshToken = localStorage.getItem('kc_refreshToken');
    const idToken = localStorage.getItem('kc_idToken');

    const initOptions = {
      onLoad: 'check-sso',
      checkLoginIframe: false,
    };

    if (token) {
      initOptions.token = token;
      initOptions.refreshToken = refreshToken;
      initOptions.idToken = idToken;
    }

    if (!initPromise) {
      initPromise = keycloak.init(initOptions);
    }

    initPromise
      .then((auth) => {
        clearTimeout(timeout);
        if (auth) {
          localStorage.setItem('kc_token', keycloak.token);
          localStorage.setItem('kc_refreshToken', keycloak.refreshToken);
          if (keycloak.idToken) {
            localStorage.setItem('kc_idToken', keycloak.idToken);
          }
        } else {
          localStorage.removeItem('kc_token');
          localStorage.removeItem('kc_refreshToken');
          localStorage.removeItem('kc_idToken');
        }
        setAuthenticated(!!auth);
        setKcReady(true);
      })
      .catch((err) => {
        clearTimeout(timeout);
        console.warn('Keycloak init check bypassed', err);
        localStorage.removeItem('kc_token');
        localStorage.removeItem('kc_refreshToken');
        localStorage.removeItem('kc_idToken');
        setKcReady(true);
      });

    return () => clearTimeout(timeout);
  }, []);

  if (!kcReady) {
    return <FullPagePreloader />;
  }

  return <App authenticated={authenticated} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </React.StrictMode>
);

export { keycloak };
