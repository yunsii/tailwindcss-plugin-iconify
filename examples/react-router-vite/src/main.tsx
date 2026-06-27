import { createRoot } from 'react-dom/client'

import { App } from './App'

import './styles.css'

declare global {
  interface Window {
    __ICONCAT_CSS_HREF__?: string
  }
}

createRoot(document.getElementById('root')!).render(<App />)
