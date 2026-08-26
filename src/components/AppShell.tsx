import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiMode } from '@/api'
import { cx } from './primitives'

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M3 6.5h14M3 10h14M3 13.5h9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">
          LOS One&nbsp;Pager
        </span>
        <span className="block text-[10px] font-medium uppercase tracking-wider text-slate-400">
          Loan Origination
        </span>
      </span>
    </Link>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  const nav = [
    { to: '/', label: 'Applications', match: (p: string) => p === '/' || p.startsWith('/applications') },
    { to: '/dashboard', label: 'Dashboard', match: (p: string) => p.startsWith('/dashboard') },
  ]

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-6 px-4 sm:px-6">
          <Logo />

          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  n.match(pathname)
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span
              className={cx(
                'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset sm:inline-flex',
                apiMode === 'mock'
                  ? 'bg-amber-50 text-amber-700 ring-amber-200'
                  : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
              )}
              title={
                apiMode === 'mock'
                  ? 'Serving generated records from the in-browser mock API'
                  : 'Connected to the live backend'
              }
            >
              <span
                className={cx(
                  'h-1.5 w-1.5 rounded-full',
                  apiMode === 'mock' ? 'bg-amber-500' : 'bg-emerald-500',
                )}
              />
              {apiMode === 'mock' ? 'Mock data' : 'Live API'}
            </span>

            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                CU
              </span>
              <span className="hidden text-sm text-slate-600 md:block">
                Credit User
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-3 text-[11px] text-slate-400 sm:px-6">
          Demo build · records are generated, not real customer data · auth layer
          not yet enabled
        </div>
      </footer>
    </div>
  )
}
