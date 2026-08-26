/**
 * The single seam between the UI and its data source.
 *
 * Components import `api` from here and nothing else. To move onto the real
 * backend, set VITE_API_MODE=http in your environment — no component changes.
 */

import { httpApi } from './httpApi'
import { mockApi } from './mockApi'
import type { ApiClient } from './types'

const mode = import.meta.env.VITE_API_MODE ?? 'mock'

export const api: ApiClient = mode === 'http' ? httpApi : mockApi

export const apiMode = mode as 'mock' | 'http'

export * from './types'
