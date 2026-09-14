import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// Imported here (not via CSS @import in index.css) so Vite's asset pipeline
// resolves and hashes the woff2 files correctly in the production build.
import '@fontsource-variable/space-grotesk'
import '@fontsource-variable/inter'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
