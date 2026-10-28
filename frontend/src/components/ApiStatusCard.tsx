import { CheckCircle2, CircleAlert, LoaderCircle, Server } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getHealth } from '../lib/api'
import type { ApiHealth } from '../types/api'

type ApiState =
  | { status: 'loading' }
  | { status: 'success'; data: ApiHealth }
  | { status: 'error'; message: string }

export function ApiStatusCard() {
  const [state, setState] = useState<ApiState>({ status: 'loading' })

  useEffect(() => {
    let isCurrent = true

    getHealth()
      .then((data) => {
        if (isCurrent) setState({ status: 'success', data })
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          const message = error instanceof Error ? error.message : 'The API could not be reached.'
          setState({ status: 'error', message })
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="status-card" role="status" aria-live="polite">
        <LoaderCircle className="spin" size={20} aria-hidden="true" />
        <div>
          <strong>Checking the API</strong>
          <span>Connecting to the local backend…</span>
        </div>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="status-card status-card-error" role="alert">
        <CircleAlert size={20} aria-hidden="true" />
        <div>
          <strong>Backend connection unavailable</strong>
          <span>{state.message}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="status-card status-card-success" role="status">
      <CheckCircle2 size={20} aria-hidden="true" />
      <div>
        <strong>Backend is healthy</strong>
        <span>{state.data.service} · {state.data.status}</span>
      </div>
      <Server className="status-card-trailing-icon" size={18} aria-hidden="true" />
    </div>
  )
}

