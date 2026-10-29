import type {
  AdminLoginResponse,
  AmbassadorPayload,
  AnalyticsAmbassadors,
  AnalyticsDaily,
  AnalyticsOverview,
  AnalyticsPeriodParams,
  ApiHealth,
  CampaignSettingsResponse,
  ReferralValidationResponse,
  RegistrationPayload,
  RegistrationResponse,
  ManagedAmbassador,
  ManagedAmbassadorsResponse,
} from '../types/api'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

function normalizeApiBaseUrl(value: string) {
  const normalized = value.trim().replace(/\/+$/, '')
  if (!normalized) return '/api'
  return /\/api$/i.test(normalized) ? normalized : `${normalized}/api`
}

// Render users commonly paste the backend service URL without `/api`. Normalize
// that safe configuration mistake instead of turning every request into a 404.
const apiBaseUrl = normalizeApiBaseUrl(configuredApiBaseUrl ?? (import.meta.env.PROD ? '/api' : 'http://127.0.0.1:8000/api'))

function analyticsQuery(params?: AnalyticsPeriodParams) {
  if (!params) return ''
  const search = new URLSearchParams()
  if (params.period) search.set('period', params.period)
  if (params.start_date) search.set('start_date', params.start_date)
  if (params.end_date) search.set('end_date', params.end_date)
  const query = search.toString()
  return query ? `?${query}` : ''
}

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

async function requestJson<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  if (import.meta.env.PROD && !configuredApiBaseUrl) {
    throw new ApiError('The frontend API URL is not configured. Set VITE_API_BASE_URL to the deployed backend URL.', 0)
  }

  let response: Response

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Token ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch {
    throw new ApiError('Unable to reach the API. Is the backend running?', 0)
  }

  const responseBody = await response.json().catch(() => null)

  if (!response.ok) {
    const detail = typeof responseBody === 'object' && responseBody !== null && 'detail' in responseBody
      ? responseBody.detail
      : null
    const message = typeof detail === 'string'
      ? detail
      : response.status === 404
        ? 'The API endpoint was not found. Check that VITE_API_BASE_URL points to the backend URL and includes /api.'
        : response.status >= 500
          ? `The backend returned an error (${response.status}). Please try again shortly.`
          : `The API returned an error (${response.status}).`
    throw new ApiError(message, response.status, responseBody)
  }

  return responseBody as T
}

export function getHealth() {
  return requestJson<ApiHealth>('/health/')
}

export function createRegistration(payload: RegistrationPayload) {
  return requestJson<RegistrationResponse>('/registrations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function validateReferralCode(referralCode: string) {
  return requestJson<ReferralValidationResponse>(`/referrals/validate/${encodeURIComponent(referralCode)}/`)
}

export function loginAdmin(username: string, password: string) {
  return requestJson<AdminLoginResponse>('/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

export function logoutAdmin(token: string) {
  return requestJson<null>('/auth/logout/', { method: 'POST' }, token)
}

export function getAnalyticsOverview(token: string, params?: AnalyticsPeriodParams) {
  return requestJson<AnalyticsOverview>(`/analytics/overview/${analyticsQuery(params)}`, undefined, token)
}

export function getAnalyticsDaily(token: string, params?: AnalyticsPeriodParams) {
  return requestJson<AnalyticsDaily>(`/analytics/daily/${analyticsQuery(params)}`, undefined, token)
}

export function getAnalyticsAmbassadors(token: string, params?: AnalyticsPeriodParams) {
  return requestJson<AnalyticsAmbassadors>(`/analytics/ambassadors/${analyticsQuery(params)}`, undefined, token)
}

export function getCampaignSettings(token: string) {
  return requestJson<CampaignSettingsResponse>('/analytics/campaign/', undefined, token)
}

export function updateCampaignSettings(token: string, payload: Partial<CampaignSettingsResponse['campaign']>) {
  return requestJson<CampaignSettingsResponse>('/analytics/campaign/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, token)
}

export function getManagedAmbassadors(token: string) {
  return requestJson<ManagedAmbassadorsResponse>('/referrals/ambassadors/', undefined, token)
}

export function createManagedAmbassador(token: string, payload: AmbassadorPayload) {
  return requestJson<ManagedAmbassador>('/referrals/ambassadors/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, token)
}

export function updateManagedAmbassador(token: string, id: number, payload: Partial<AmbassadorPayload>) {
  return requestJson<ManagedAmbassador>(`/referrals/ambassadors/${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }, token)
}

export function setManagedAmbassadorStatus(token: string, id: number, isActive: boolean) {
  const action = isActive ? 'activate' : 'deactivate'
  return requestJson<ManagedAmbassador>(`/referrals/ambassadors/${id}/${action}/`, {
    method: 'POST',
  }, token)
}

export async function downloadAnalyticsCsv(token: string, params?: AnalyticsPeriodParams) {
  let response: Response
  try {
    response = await fetch(`${apiBaseUrl}/analytics/export.csv${analyticsQuery(params)}`, {
      headers: { Accept: 'text/csv', Authorization: `Token ${token}` },
    })
  } catch {
    throw new ApiError('Unable to reach the API. Is the backend running?', 0)
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string'
      ? body.detail
      : `The API returned an error (${response.status}).`
    throw new ApiError(detail, response.status, body)
  }

  const contentDisposition = response.headers.get('Content-Disposition') ?? ''
  const filename = contentDisposition.match(/filename="([^"]+)"/)?.[1] ?? 'ai-sprint-report.csv'
  return { blob: await response.blob(), filename }
}

