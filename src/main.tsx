import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // The corpus is static between edits — no need to refetch on focus.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
})

// Set at build time for GitHub Pages sub-path deploys; '/' everywhere else.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename || undefined}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
