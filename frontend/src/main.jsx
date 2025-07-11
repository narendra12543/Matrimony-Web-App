import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Readable, Writable, Duplex } from 'readable-stream';


window.global = window;
window.process = window.process || {};
window.process.nextTick = window.process.nextTick || function (cb) { setTimeout(cb, 0); };

// Polyfill for simple-peer/stream-browserify
window.ReadableStream = window.ReadableStream || Readable;
window.WritableStream = window.WritableStream || Writable;
window.DuplexStream = window.DuplexStream || Duplex;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
