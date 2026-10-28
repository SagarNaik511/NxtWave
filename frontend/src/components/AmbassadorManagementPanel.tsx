import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, CircleAlert, LoaderCircle, Pencil, Plus, UserRound, UserRoundCheck, UserRoundX, X } from 'lucide-react'

import {
  ApiError,
  createManagedAmbassador,
  getManagedAmbassadors,
  setManagedAmbassadorStatus,
  updateManagedAmbassador,
} from '../lib/api'
import type { ManagedAmbassador } from '../types/api'

interface AmbassadorManagementPanelProps {
  token: string
  onChanged: () => void
  onUnauthorized: () => void
}

function getManagementError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return 'Your administrator session expired. Please sign in again.'
  if (error instanceof ApiError && error.status === 403) return 'This account does not have administrator access.'
  if (error instanceof ApiError && typeof error.body === 'object' && error.body !== null && 'errors' in error.body) {
    const errors = error.body.errors
    if (typeof errors === 'object' && errors !== null) {
      return Object.entries(errors).map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`).join(' ')
    }
  }
  if (error instanceof ApiError) return error.message
  return 'Ambassador management is unavailable. Please try again.'
}

function isUnauthorized(error: unknown) {
  return error instanceof ApiError && error.status === 401
}

export function AmbassadorManagementPanel({ token, onChanged, onUnauthorized }: AmbassadorManagementPanelProps) {
  const [ambassadors, setAmbassadors] = useState<ManagedAmbassador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')

  const loadAmbassadors = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await getManagedAmbassadors(token)
      setAmbassadors(response.ambassadors)
    } catch (loadError: unknown) {
      if (isUnauthorized(loadError)) onUnauthorized()
      else setError(getManagementError(loadError))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAmbassadors()
  }, [token])

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    const form = new FormData(event.currentTarget)
    const name = String(form.get('ambassador-name') ?? '').trim()
    const referralCode = String(form.get('ambassador-code') ?? '').trim()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await createManagedAmbassador(token, { name, ...(referralCode ? { referral_code: referralCode } : {}) })
      event.currentTarget.reset()
      setMessage('Ambassador created. Their referral link is ready for new registrations.')
      await loadAmbassadors()
      onChanged()
    } catch (createError: unknown) {
      if (isUnauthorized(createError)) onUnauthorized()
      else setError(getManagementError(createError))
    } finally {
      setSaving(false)
    }
  }

  const startEditing = (ambassador: ManagedAmbassador) => {
    setEditingId(ambassador.id)
    setEditName(ambassador.name)
    setEditCode(ambassador.referral_code)
    setError('')
    setMessage('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditName('')
    setEditCode('')
  }

  const saveEdit = async (event: FormEvent<HTMLFormElement>, id: number) => {
    event.preventDefault()
    if (busyId !== null) return
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      await updateManagedAmbassador(token, id, { name: editName.trim(), referral_code: editCode.trim() })
      cancelEditing()
      setMessage('Ambassador details updated.')
      await loadAmbassadors()
      onChanged()
    } catch (updateError: unknown) {
      if (isUnauthorized(updateError)) onUnauthorized()
      else setError(getManagementError(updateError))
    } finally {
      setBusyId(null)
    }
  }

  const changeStatus = async (ambassador: ManagedAmbassador) => {
    if (busyId !== null) return
    setBusyId(ambassador.id)
    setError('')
    setMessage('')
    try {
      await setManagedAmbassadorStatus(token, ambassador.id, !ambassador.is_active)
      setMessage(`${ambassador.name} is now ${ambassador.is_active ? 'inactive' : 'active'}. Historical attribution is preserved.`)
      await loadAmbassadors()
      onChanged()
    } catch (statusError: unknown) {
      if (isUnauthorized(statusError)) onUnauthorized()
      else setError(getManagementError(statusError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className="dashboard-panel ambassador-management-panel" aria-labelledby="ambassador-management-heading">
      <div className="settings-panel-heading">
        <div>
          <div className="dashboard-eyebrow"><UserRound size={14} aria-hidden="true" /> Growth operations</div>
          <h2 id="ambassador-management-heading">Manage ambassadors</h2>
          <p>Create and maintain referral partners. Counts below are persisted registrations only.</p>
        </div>
        <UserRoundCheck size={18} aria-hidden="true" />
      </div>

      <div className="ambassador-management-layout">
        <form className="ambassador-create-form" onSubmit={handleCreate}>
          <div className="management-form-label"><Plus size={15} aria-hidden="true" /> Add ambassador</div>
          <div className="field-group">
            <label htmlFor="ambassador-name">Name</label>
            <input id="ambassador-name" name="ambassador-name" required minLength={2} maxLength={160} placeholder="e.g. Priya Shah" />
          </div>
          <div className="field-group">
            <label htmlFor="ambassador-code">Custom referral code <span>(optional)</span></label>
            <input id="ambassador-code" name="ambassador-code" maxLength={50} pattern="[A-Za-z0-9-]+" placeholder="Generated if blank" />
          </div>
          {error && <div className="dashboard-inline-error" role="alert"><CircleAlert size={16} aria-hidden="true" />{error}</div>}
          {message && <div className="dashboard-inline-success" role="status"><CheckCircle2 size={16} aria-hidden="true" />{message}</div>}
          <button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />} {saving ? 'Creating…' : 'Create ambassador'}</button>
        </form>

        <div className="ambassador-management-list" aria-live="polite">
          <div className="management-list-heading"><span>Ambassador directory</span><span>{ambassadors.length} configured</span></div>
          {loading ? <div className="management-state"><LoaderCircle className="spin" size={20} aria-hidden="true" /> Loading ambassadors…</div> : ambassadors.length === 0 ? <div className="management-state"><UserRound size={20} aria-hidden="true" /><strong>No ambassadors configured</strong><span>Create the first ambassador to start attributing new registrations.</span></div> : <div className="ambassador-list">
            {ambassadors.map((ambassador) => editingId === ambassador.id ? (
              <form className="ambassador-row ambassador-row-editing" key={ambassador.id} onSubmit={(event) => void saveEdit(event, ambassador.id)}>
                <div className="ambassador-edit-fields"><div className="field-group"><label htmlFor={`edit-name-${ambassador.id}`}>Name</label><input id={`edit-name-${ambassador.id}`} value={editName} onChange={(event) => setEditName(event.target.value)} required /></div><div className="field-group"><label htmlFor={`edit-code-${ambassador.id}`}>Referral code</label><input id={`edit-code-${ambassador.id}`} value={editCode} onChange={(event) => setEditCode(event.target.value)} required pattern="[A-Za-z0-9-]+" /></div></div>
                <div className="ambassador-row-actions"><button className="button button-primary" type="submit" disabled={busyId === ambassador.id}>{busyId === ambassador.id ? <LoaderCircle className="spin" size={14} /> : <CheckCircle2 size={14} />} Save</button><button className="button button-secondary" type="button" onClick={cancelEditing}><X size={14} /> Cancel</button></div>
              </form>
            ) : (
              <article className="ambassador-row" key={ambassador.id}>
                <div className="ambassador-row-main"><div className="ambassador-name-line"><strong>{ambassador.name}</strong><span className={`status-pill ${ambassador.is_active ? 'status-active' : 'status-inactive'}`}>{ambassador.is_active ? 'Active' : 'Inactive'}</span></div><code>{ambassador.referral_code}</code><span className="ambassador-count">{ambassador.attributed_registration_count} attributed registration{ambassador.attributed_registration_count === 1 ? '' : 's'}</span></div>
                <div className="ambassador-row-actions"><button className="button button-secondary" type="button" onClick={() => startEditing(ambassador)} disabled={busyId !== null}><Pencil size={14} /> Edit</button><button className="button button-secondary" type="button" onClick={() => void changeStatus(ambassador)} disabled={busyId === ambassador.id}>{busyId === ambassador.id ? <LoaderCircle className="spin" size={14} /> : ambassador.is_active ? <UserRoundX size={14} /> : <UserRoundCheck size={14} />} {ambassador.is_active ? 'Deactivate' : 'Activate'}</button></div>
              </article>
            ))}
          </div>}
        </div>
      </div>
    </section>
  )
}
