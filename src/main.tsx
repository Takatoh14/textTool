import './styles/index.scss'; // もし全体SCSSをまとめている場合（なければ消してOK）

import App from './App';
import React from 'react';
import ReactDOM from 'react-dom/client';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
