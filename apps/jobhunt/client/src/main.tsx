import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { WalletProvider } from './context/WalletContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ThemeProvider>
  </StrictMode>,
)
