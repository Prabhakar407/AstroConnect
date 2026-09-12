import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Preserve existing shared links and the Google return URL when moving to clean paths.
// Never treat a protocol-relative hash as a destination on another website.
if (window.location.hash.startsWith('#/') && !window.location.hash.startsWith('#//')) {
  const destination = new URL(window.location.hash.slice(1), window.location.origin)
  if (destination.origin === window.location.origin) {
    window.history.replaceState(null, '', destination.pathname + destination.search + destination.hash)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
