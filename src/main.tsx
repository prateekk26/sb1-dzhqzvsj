import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { useAuthStore } from './store';
import './index.css';

// Initialize auth store
const initAuth = async () => {
  const { refreshSession } = useAuthStore.getState();
  await refreshSession();
};

// Initialize auth on app start
initAuth();

// Get root element and create root
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find root element');
}

const root = createRoot(rootElement);

// Render the app with StrictMode for development best practices
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);