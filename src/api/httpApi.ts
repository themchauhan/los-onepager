/**
 * Real-backend adapter.
 *
 * This is the file you edit when the LOS API is ready. Point VITE_API_BASE_URL
 * at it and set VITE_API_MODE=http — nothing else in the app changes.
 *
 * The only thing to get right is the shape: `listApplications` must return
 * `{ rows, total, page, pageSize }`, i.e. the server does the filtering,
 * sorting and pagination. If your endpoint names or payload keys differ, map
 * them here rather than in the components.
 */

import type {
  ApiClient,
  Application,
  ApplicationSummary,
  FacetOptions,
  ListParams,
  Page,
  PatchRequest,
} from './types'

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      // Swap for whatever your auth layer issues once login is in place.
      ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`)
  }
  return (await res.json()) as T
}

/** Placeholder for the auth layer that lands with the login screens. */
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('los-onepager.token')
  } catch {
    return null
  }
}

function toQuery(params: ListParams): string {
  const q = new URLSearchParams()
  q.set('page', String(params.page))
  q.set('pageSize', String(params.pageSize))
  if (params.search) q.set('search', params.search)
  if (params.status && params.status !== 'All') q.set('status', params.status)
  if (params.product && params.product !== 'All') q.set('product', params.product)
  if (params.risk && params.risk !== 'All') q.set('risk', params.risk)
  if (params.state && params.state !== 'All') q.set('state', params.state)
  if (params.sortBy) q.set('sortBy', String(params.sortBy))
  if (params.sortDir) q.set('sortDir', params.sortDir)
  return q.toString()
}

export const httpApi: ApiClient = {
  listApplications(params) {
    return request<Page<ApplicationSummary>>(`/applications?${toQuery(params)}`)
  },

  getApplication(id) {
    return request<Application>(`/applications/${encodeURIComponent(id)}`)
  },

  patchApplication({ id, section, values }: PatchRequest) {
    return request<Application>(`/applications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ section, values }),
    })
  },

  getFacets() {
    return request<FacetOptions>('/applications/facets')
  },

  getStats() {
    return request<{
      total: number
      byStatus: Record<string, number>
      byRisk: Record<string, number>
      totalBookValue: number
    }>('/applications/stats')
  },
}
