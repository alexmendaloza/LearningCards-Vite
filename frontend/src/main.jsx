import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// ── Application Entry Point ─────────────────────────────────────
// Initializes the React application into the #app container.

const container = document.getElementById('app');

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('No se pudo encontrar el contenedor #app en el DOM.');
}
