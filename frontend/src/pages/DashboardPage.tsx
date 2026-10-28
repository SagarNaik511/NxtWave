import { useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Database,
  Download,
  Info,
  LineChart as LineChartIcon,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Pencil,
  RefreshCw,
  Save,
  Settings2,
  ShieldCheck,
  Target,
  UserCheck,
  UsersRound,
  UserX,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  ApiError,
  downloadAnalyticsCsv,
  getAnalyticsAmbassadors,
  getAnalyticsDaily,
  getAnalyticsOverview,
  getCampaignSettings,
  loginAdmin,
  logoutAdmin,
  updateCampaignSettings,
} from '../lib/api'
import type {
  AnalyticsAmbassadors,
  AnalyticsDaily,
  AnalyticsOverview,
  AnalyticsPeriodKey,
  AnalyticsPeriodParams,
  CampaignSettings,
} from '../types/api'

interface DashboardData {
  overview: AnalyticsOverview | null
  daily: AnalyticsDaily | null
  ambassadors: AnalyticsAmbassadors | null
  campaign: CampaignSettings | null
}

interface CampaignForm {
  name: string
  target_registrations: string
  duration_days: string
  budget_inr: string
  start_date: string
  timezone: string
}

const initialData: DashboardData = { overview: null, daily: null, ambassadors: null, campaign: null }
const initialCampaignForm: CampaignForm = {
  name: '',
  target_registrations: '',
  duration_days: '',
  budget_inr: '',
  start_date: '',
  timezone: '',
}

function formatDateTime(value: string | null) {
  if (!value) return 'No registrations yet'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function formatShortDate(value: string) {
  const [, month, day] = value.split('-')
  return `${month}/${day}`
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) return 'Your administrator session is not authorized. Please sign in again.'
  if (error instanceof ApiError && error.status === 403) return 'This account does not have administrator access.'
  if (error instanceof ApiError) return error.message
  return 'The dashboard data could not be loaded. Please refresh and try again.'
}

function periodParams(period: AnalyticsPeriodKey, startDate: string, endDate: string): AnalyticsPeriodParams {
  return {
    period,
    ...(period === 'custom' && startDate ? { start_date: startDate } : {}),
    ...(period === 'custom' && endDate ? { end_date: endDate } : {}),
  }
}

export function DashboardPage() {
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [data, setData] = useState<DashboardData>(initialData)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [sectionErrors, setSectionErrors] = useState<string[]>([])
  const [period, setPeriod] = useState<AnalyticsPeriodKey>('all_time')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [periodError, setPeriodError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(initialCampaignForm)
  const [exportLoading, setExportLoading] = useState(false)
  const [exportError, setExportError] = useState('')
  const dashboardRequestId = useRef(0)

  const syncCampaignForm = (campaign: CampaignSettings) => {
    setCampaignForm({
      name: campaign.name,
      target_registrations: String(campaign.target_registrations),
      duration_days: String(campaign.duration_days),
      budget_inr: String(campaign.budget_inr),
      start_date: campaign.start_date ?? '',
      timezone: campaign.timezone,
    })
  }

  const loadDashboard = async (authToken: string, requestedPeriod = period, requestedStart = customStart, requestedEnd = customEnd) => {
    const requestId = ++dashboardRequestId.current
    setLoading(true)
    setLoadError('')
    setSectionErrors([])
    const params = periodParams(requestedPeriod, requestedStart, requestedEnd)
    const results = await Promise.allSettled([
      getAnalyticsOverview(authToken, params),
      getAnalyticsDaily(authToken, params),
      getAnalyticsAmbassadors(authToken, params),
      getCampaignSettings(authToken),
    ])
    if (requestId !== dashboardRequestId.current) return
    const unauthorized = results.some((result) => result.status === 'rejected' && result.reason instanceof ApiError && result.reason.status === 401)

    if (unauthorized) {
      setToken(null)
      setUsername('')
      setData(initialData)
      setLoginError('Your administrator session expired. Please sign in again.')
      setLoading(false)
      return
    }

    const [overview, daily, ambassadors, campaign] = results
    const nextData: DashboardData = {
      overview: overview.status === 'fulfilled' ? overview.value : null,
      daily: daily.status === 'fulfilled' ? daily.value : null,
      ambassadors: ambassadors.status === 'fulfilled' ? ambassadors.value : null,
      campaign: campaign.status === 'fulfilled' ? campaign.value.campaign : null,
    }
    const errors = results
      .map((result, index) => result.status === 'rejected' ? `${['Overview', 'Daily registrations', 'Ambassador performance', 'Campaign settings'][index]}: ${getErrorMessage(result.reason)}` : '')
      .filter(Boolean)
    setData(nextData)
    setSectionErrors(errors)
    if (nextData.campaign) syncCampaignForm(nextData.campaign)
    if (!nextData.overview && !nextData.daily && !nextData.ambassadors) setLoadError('No dashboard data could be loaded. Please refresh and try again.')
    setLoading(false)
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (loginLoading) return
    const formData = new FormData(event.currentTarget)
    const loginUsername = String(formData.get('username') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    setLoginLoading(true)
    setLoginError('')
    try {
      const response = await loginAdmin(loginUsername, password)
      setToken(response.token)
      setUsername(response.user.username)
      await loadDashboard(response.token)
    } catch (error: unknown) {
      setLoginError(error instanceof ApiError && error.status === 401 ? 'Invalid administrator credentials.' : 'The sign-in service is unavailable. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    dashboardRequestId.current += 1
    if (token) await logoutAdmin(token).catch(() => undefined)
    setToken(null)
    setUsername('')
    setData(initialData)
    setLoadError('')
    setSectionErrors([])
    setLoginError('')
    setSettingsOpen(false)
  }

  const handlePeriodChange = (nextPeriod: AnalyticsPeriodKey) => {
    setPeriod(nextPeriod)
    setPeriodError('')
    if (nextPeriod !== 'custom' && token) void loadDashboard(token, nextPeriod)
  }

  const applyCustomPeriod = () => {
    if (!customStart || !customEnd) {
      setPeriodError('Choose both a custom start date and end date.')
      return
    }
    if (customEnd < customStart) {
      setPeriodError('Custom end date must be on or after the start date.')
      return
    }
    setPeriodError('')
    if (token) void loadDashboard(token, 'custom', customStart, customEnd)
  }

  const handleSettingsSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || settingsSaving) return
    setSettingsSaving(true)
    setSettingsError('')
    setSettingsMessage('')
    const payload = {
      name: campaignForm.name,
      target_registrations: Number(campaignForm.target_registrations),
      duration_days: Number(campaignForm.duration_days),
      budget_inr: Number(campaignForm.budget_inr),
      start_date: campaignForm.start_date || null,
      timezone: campaignForm.timezone,
    }
    try {
      const response = await updateCampaignSettings(token, payload)
      setData((current) => ({ ...current, campaign: response.campaign }))
      syncCampaignForm(response.campaign)
      setSettingsMessage('Campaign settings saved.')
      await loadDashboard(token)
    } catch (error: unknown) {
      setSettingsError(getSettingsError(error))
    } finally {
      setSettingsSaving(false)
    }
  }

  const handleExport = async () => {
    if (!token || exportLoading) return
    if (period === 'custom' && (!customStart || !customEnd)) {
      setExportError('Choose a valid custom date range before exporting.')
      return
    }
    setExportLoading(true)
    setExportError('')
    try {
      const file = await downloadAnalyticsCsv(token, periodParams(period, customStart, customEnd))
      const url = URL.createObjectURL(file.blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        setToken(null)
        setUsername('')
        setLoginError('Your administrator session expired. Please sign in again.')
      } else {
        setExportError(getErrorMessage(error))
      }
    } finally {
      setExportLoading(false)
    }
  }

  if (!token) return <AdminSignIn loginError={loginError} loading={loginLoading} onSubmit={handleLogin} />

  const overview = data.overview
  const campaign = data.campaign
  const selectedPeriod = overview?.selected_period
  const progress = overview ? Math.min(Math.max(overview.performance.target_reached_percentage, 0), 100) : 0
  const campaignPeriodAvailable = Boolean(campaign?.start_date)

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <Link className="dashboard-brand" to="/" aria-label="Return to AI Sprint home"><span className="brand-mark"><Target size={17} /></span><span>AI Sprint <small>/ GROWTH OPS</small></span></Link>
        <div className="dashboard-header-actions"><span className="dashboard-user"><ShieldCheck size={15} aria-hidden="true" /> {username}</span><button className="dashboard-ghost-button" type="button" onClick={handleLogout}><LogOut size={15} aria-hidden="true" /> Sign out</button></div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-intro">
          <div><div className="dashboard-eyebrow"><Database size={14} aria-hidden="true" /> Live database reporting</div><h1>Growth dashboard</h1><p>{campaign?.name ?? 'Monitor genuine workshop registrations and ambassador attribution without inventing campaign results.'}</p></div>
          <div className="dashboard-intro-actions"><button className="dashboard-refresh-button" type="button" onClick={() => void loadDashboard(token)} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} aria-hidden="true" /> {loading ? 'Refreshing…' : 'Refresh data'}</button><button className="dashboard-ghost-button" type="button" onClick={() => { setSettingsOpen((open) => !open); setSettingsError(''); setSettingsMessage('') }}><Settings2 size={15} aria-hidden="true" /> {settingsOpen ? 'Close settings' : 'Campaign settings'}</button></div>
        </div>

        {settingsOpen && <CampaignSettingsPanel form={campaignForm} setForm={setCampaignForm} onSubmit={handleSettingsSave} onCancel={() => { if (campaign) syncCampaignForm(campaign); setSettingsOpen(false) }} saving={settingsSaving} error={settingsError} message={settingsMessage} />}

        <section className="reporting-controls" aria-labelledby="reporting-controls-heading">
          <div><div className="dashboard-eyebrow"><CalendarDays size={14} aria-hidden="true" /> Reporting controls</div><h2 id="reporting-controls-heading">Choose the period behind charts and exports</h2><p>All-time totals remain separate from date-scoped counts. Dates are interpreted in {campaign?.timezone ?? 'the configured campaign timezone'}.</p></div>
          <div className="period-control-group"><label htmlFor="period-select">Reporting period</label><select id="period-select" value={period} onChange={(event) => handlePeriodChange(event.target.value as AnalyticsPeriodKey)}><option value="all_time">All time</option><option value="campaign" disabled={!campaignPeriodAvailable}>Campaign period{campaignPeriodAvailable ? '' : ' (start date required)'}</option><option value="custom">Custom date range</option></select></div>
          {period === 'custom' && <div className="custom-period-fields"><div className="field-group"><label htmlFor="custom-start">Start date</label><input id="custom-start" type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></div><div className="field-group"><label htmlFor="custom-end">End date</label><input id="custom-end" type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></div><button className="button button-secondary" type="button" onClick={applyCustomPeriod}>Apply range</button></div>}
          {periodError && <div className="dashboard-inline-error" role="alert"><CircleAlert size={16} aria-hidden="true" />{periodError}</div>}
        </section>

        {selectedPeriod && <div className={`reporting-banner ${selectedPeriod.available ? '' : 'reporting-banner-warning'}`}><CalendarDays size={17} aria-hidden="true" /><div><strong>{selectedPeriod.label}</strong><span>{selectedPeriod.message ?? 'Charts, ambassador counts, and exports use this selected period.'}</span></div><span className="banner-note">All-time total remains {overview?.performance.total_registrations.toLocaleString() ?? '—'}.</span></div>}
        {loadError && <div className="dashboard-alert" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{loadError}</span><button className="dashboard-alert-action" type="button" onClick={() => void loadDashboard(token)} disabled={loading}>Retry</button></div>}
        {sectionErrors.length > 0 && <div className="dashboard-alert dashboard-alert-soft" role="status"><Info size={18} aria-hidden="true" /><span>Some panels could not be refreshed: {sectionErrors.join(' · ')}</span></div>}
        {exportError && <div className="dashboard-alert dashboard-alert-soft" role="alert"><CircleAlert size={18} aria-hidden="true" />{exportError}</div>}
        {loading && !overview && <div className="dashboard-loading" role="status"><LoaderCircle className="spin" size={22} aria-hidden="true" /> Loading live campaign data…</div>}

        {overview && <>
          <section className="dashboard-kpis" aria-label="All-time campaign key performance indicators">
            <MetricCard label="All-time registrations" value={overview.performance.total_registrations.toLocaleString()} icon={<UsersRound size={19} />} detail="Actual records in the database" />
            <MetricCard label="All-time with ambassador" value={overview.performance.attributed_registrations.toLocaleString()} icon={<UserCheck size={19} />} detail="Valid persisted attribution" />
            <MetricCard label="All-time without attribution" value={overview.performance.unattributed_registrations.toLocaleString()} icon={<UserX size={19} />} detail="Registrations with no ambassador" />
            <MetricCard label="Latest registration" value={formatDateTime(overview.performance.most_recent_registration_at)} icon={<CheckCircle2 size={19} />} detail="Most recent saved record" compact />
          </section>

          <section className="selected-summary" aria-labelledby="selected-summary-heading"><div><div className="dashboard-eyebrow"><Target size={14} aria-hidden="true" /> Selected-period snapshot</div><h2 id="selected-summary-heading">{selectedPeriod?.label ?? 'Selected period'}</h2></div><div className="selected-summary-stats"><span><strong>{overview.selected_performance.total_registrations.toLocaleString()}</strong> registrations</span><span><strong>{overview.selected_performance.attributed_registrations.toLocaleString()}</strong> attributed</span><span><strong>{overview.selected_performance.unattributed_registrations.toLocaleString()}</strong> unattributed</span></div></section>

          <section className="goal-panel" aria-labelledby="goal-heading"><div className="goal-heading"><div><div className="dashboard-eyebrow"><Target size={14} aria-hidden="true" /> Campaign goal</div><h2 id="goal-heading">{overview.campaign.target_registrations.toLocaleString()} registrations in {overview.campaign.duration_days} days</h2></div><div className="goal-budget"><span>Configured budget</span><strong>₹{overview.campaign.budget_inr.toLocaleString('en-IN')}</strong></div></div><div className="goal-progress-row"><div className="goal-progress-track" aria-label={`${overview.performance.target_reached_percentage}% of target reached`}><span style={{ width: `${progress}%` }} /></div><strong>{overview.performance.target_reached_percentage.toFixed(1)}%</strong></div><div className="goal-footer"><span>{overview.performance.total_registrations.toLocaleString()} actual registrations</span><span>{overview.performance.registrations_remaining.toLocaleString()} remaining to target</span></div></section>
        </>}

        <div className="dashboard-chart-grid">
          <section className="dashboard-panel daily-panel" aria-labelledby="daily-heading"><PanelHeading id="daily-heading" icon={<LineChartIcon size={17} />} title="Daily registrations" detail={data.daily?.selected_period.label ?? 'Selected reporting period'} />{!data.daily ? <PanelError title="Daily data unavailable" onRetry={() => void loadDashboard(token)} /> : data.daily.daily.length === 0 ? <DashboardEmpty icon={<CalendarDays size={20} />} title="No daily history available" message={data.daily.message ?? 'There are no persisted registrations in this period.'} /> : <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.daily.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="rgba(193,236,216,0.1)" vertical={false} /><XAxis dataKey="date" tickFormatter={formatShortDate} stroke="#668078" tickLine={false} axisLine={false} fontSize={11} /><YAxis allowDecimals={false} stroke="#668078" tickLine={false} axisLine={false} fontSize={11} /><Tooltip contentStyle={{ background: '#10211b', border: '1px solid rgba(193,236,216,0.22)', borderRadius: '8px', color: '#edf5f1' }} labelFormatter={(label) => `Date: ${label}`} formatter={(value) => [value, 'Registrations']} /><Line type="monotone" dataKey="registrations" stroke="#8cf2bc" strokeWidth={2.5} dot={{ r: 3, fill: '#8cf2bc', strokeWidth: 0 }} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer></div><p className="chart-summary">Saved registrations by local date in {data.daily.selected_period.timezone}, including zero-registration days.</p></>}</section>

          <section className="dashboard-panel ambassador-panel" aria-labelledby="ambassador-chart-heading"><PanelHeading id="ambassador-chart-heading" icon={<UsersRound size={17} />} title="Ambassador performance" detail={data.ambassadors?.selected_period.label ?? 'Selected period'} />{!data.ambassadors ? <PanelError title="Ambassador data unavailable" onRetry={() => void loadDashboard(token)} /> : data.ambassadors.ambassadors.length === 0 ? <DashboardEmpty icon={<UsersRound size={20} />} title="No ambassador data" message={data.ambassadors.message ?? 'Active ambassadors will appear here once they have attributed registrations.'} /> : <><div className="chart-wrap"><ResponsiveContainer width="100%" height={Math.max(180, data.ambassadors.ambassadors.length * 48)}><BarChart data={data.ambassadors.ambassadors} layout="vertical" margin={{ top: 0, right: 18, left: 8, bottom: 0 }}><CartesianGrid stroke="rgba(193,236,216,0.1)" horizontal={false} /><XAxis type="number" allowDecimals={false} hide /><YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9aafa7', fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: '#10211b', border: '1px solid rgba(193,236,216,0.22)', borderRadius: '8px', color: '#edf5f1' }} formatter={(value) => [value, 'Registrations']} /><Bar dataKey="registration_count" radius={[0, 4, 4, 0]} barSize={18}>{data.ambassadors.ambassadors.map((entry) => <Cell key={entry.referral_code} fill={entry.rank === 1 ? '#8cf2bc' : '#a99bff'} />)}</Bar></BarChart></ResponsiveContainer></div><p className="chart-summary">Share denominator: {data.ambassadors.share_denominator === 'all_registrations' ? 'all registrations' : 'registrations in the selected period'}.</p></>}</section>
        </div>

        <section className="dashboard-panel leaderboard-panel" aria-labelledby="leaderboard-heading"><div className="panel-heading-with-action"><PanelHeading id="leaderboard-heading" icon={<ShieldCheck size={17} />} title="Ambassador leaderboard" detail={data.ambassadors ? `${data.ambassadors.attributed_registrations} selected-period attributed registrations` : 'Live attribution data'} /><button className="button button-secondary export-button" type="button" onClick={() => void handleExport()} disabled={exportLoading}>{exportLoading ? <LoaderCircle className="spin" size={15} /> : <Download size={15} />} {exportLoading ? 'Preparing CSV…' : 'Export CSV'}</button></div>{!data.ambassadors ? <PanelError title="Leaderboard data unavailable" onRetry={() => void loadDashboard(token)} /> : data.ambassadors.ambassadors.length === 0 ? <DashboardEmpty icon={<UsersRound size={20} />} title="Leaderboard is empty" message={data.ambassadors.message ?? 'Active ambassadors will appear here once they are configured.'} /> : <div className="table-scroll"><table><caption className="sr-only">Active ambassador registrations and share of selected-period registrations</caption><thead><tr><th scope="col">Rank</th><th scope="col">Ambassador</th><th scope="col">Referral code</th><th scope="col">Registrations</th><th scope="col">Share of selected period</th></tr></thead><tbody>{data.ambassadors.ambassadors.map((ambassador) => <tr key={ambassador.referral_code}><td><span className={`rank-badge ${ambassador.rank === 1 ? 'rank-first' : ''}`}>{String(ambassador.rank).padStart(2, '0')}</span></td><th scope="row">{ambassador.name}</th><td><code>{ambassador.referral_code}</code></td><td className="table-number">{ambassador.registration_count}</td><td><div className="share-cell"><span>{ambassador.share_of_total_registrations.toFixed(1)}%</span><span className="share-track"><i style={{ width: `${Math.min(ambassador.share_of_total_registrations, 100)}%` }} /></span></div></td></tr>)}</tbody></table></div>}{data.ambassadors && data.ambassadors.inactive_historical_attributed_registrations > 0 && <p className="panel-footnote"><Info size={14} aria-hidden="true" /> {data.ambassadors.inactive_historical_attributed_registrations} historical registration(s) remain attributed to inactive ambassadors and are excluded from this active leaderboard.</p>}</section>
      </main>
      <footer className="dashboard-footer"><Link to="/"><ArrowLeft size={14} /> Back to website</Link><span>Aggregate metrics only · no fabricated performance data</span></footer>
    </div>
  )
}

function getSettingsError(error: unknown) {
  if (error instanceof ApiError && typeof error.body === 'object' && error.body !== null && 'errors' in error.body) {
    const errors = error.body.errors
    if (typeof errors === 'object' && errors !== null) return Object.entries(errors).map(([field, message]) => `${field}: ${Array.isArray(message) ? message[0] : message}`).join(' ')
  }
  return getErrorMessage(error)
}

function CampaignSettingsPanel({ form, setForm, onSubmit, onCancel, saving, error, message }: { form: CampaignForm; setForm: (form: CampaignForm) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; saving: boolean; error: string; message: string }) {
  const update = (field: keyof CampaignForm, value: string) => setForm({ ...form, [field]: value })
  return <section className="dashboard-panel campaign-settings-panel" aria-labelledby="campaign-settings-heading"><div className="settings-panel-heading"><div><div className="dashboard-eyebrow"><Settings2 size={14} aria-hidden="true" /> Persisted campaign configuration</div><h2 id="campaign-settings-heading">Campaign settings</h2><p>These values configure the goal and reporting window; they are not performance results.</p></div><Pencil size={18} aria-hidden="true" /></div><form onSubmit={onSubmit}><div className="settings-form-grid"><div className="field-group settings-field-wide"><label htmlFor="campaign-name">Campaign name</label><input id="campaign-name" value={form.name} onChange={(event) => update('name', event.target.value)} required /></div><div className="field-group"><label htmlFor="campaign-target">Registration target</label><input id="campaign-target" type="number" min="1" max="100000000" value={form.target_registrations} onChange={(event) => update('target_registrations', event.target.value)} required /></div><div className="field-group"><label htmlFor="campaign-duration">Duration in days</label><input id="campaign-duration" type="number" min="1" max="365" value={form.duration_days} onChange={(event) => update('duration_days', event.target.value)} required /></div><div className="field-group"><label htmlFor="campaign-budget">Budget (INR)</label><input id="campaign-budget" type="number" min="0" value={form.budget_inr} onChange={(event) => update('budget_inr', event.target.value)} required /></div><div className="field-group"><label htmlFor="campaign-start">Start date <span>(optional)</span></label><input id="campaign-start" type="date" value={form.start_date} onChange={(event) => update('start_date', event.target.value)} /></div><div className="field-group settings-field-wide"><label htmlFor="campaign-timezone">Reporting timezone</label><input id="campaign-timezone" value={form.timezone} onChange={(event) => update('timezone', event.target.value)} placeholder="Asia/Kolkata" required /></div></div>{error && <div className="dashboard-inline-error" role="alert"><CircleAlert size={16} aria-hidden="true" />{error}</div>}{message && <div className="dashboard-inline-success" role="status"><CheckCircle2 size={16} aria-hidden="true" />{message}</div>}<div className="settings-actions"><button className="button button-secondary" type="button" onClick={onCancel}><X size={15} /> Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Save size={15} />} {saving ? 'Saving…' : 'Save settings'}</button></div></form></section>
}

function AdminSignIn({ loginError, loading, onSubmit }: { loginError: string; loading: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="dashboard-shell dashboard-auth-shell"><header className="dashboard-header"><Link className="dashboard-brand" to="/" aria-label="Return to AI Sprint home"><span className="brand-mark"><Target size={17} /></span><span>AI Sprint <small>/ GROWTH OPS</small></span></Link><Link className="dashboard-back-public" to="/"><ArrowLeft size={15} /> Back to website</Link></header><main className="dashboard-auth-main"><div className="dashboard-auth-copy"><div className="dashboard-eyebrow"><LockKeyhole size={14} aria-hidden="true" /> Restricted administrator area</div><h1>Growth dashboard</h1><p>Sign in with a Django administrator account to view persisted campaign metrics. No analytics data is loaded before authentication.</p></div><form className="dashboard-login-card" onSubmit={onSubmit}>{loginError && <div className="form-alert" role="alert"><CircleAlert size={18} aria-hidden="true" />{loginError}</div>}<div className="form-header"><span className="form-step">ADMIN ACCESS</span><span>DJANGO AUTH</span></div><div className="dashboard-login-fields"><div className="field-group"><label htmlFor="dashboard-username">Username</label><input id="dashboard-username" name="username" required autoComplete="username" /></div><div className="field-group"><label htmlFor="dashboard-password">Password</label><input id="dashboard-password" name="password" type="password" required autoComplete="current-password" /></div></div><button className="button button-primary submit-button" type="submit" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Signing in…</> : <><LockKeyhole size={17} /> Sign in securely</>}</button><p className="login-note"><ShieldCheck size={15} aria-hidden="true" /> Administrator access is controlled by Django's built-in user permissions.</p></form></main></div>
}

function MetricCard({ label, value, icon, detail, compact = false }: { label: string; value: string; icon: ReactNode; detail: string; compact?: boolean }) {
  return <article className={`metric-card ${compact ? 'metric-card-compact' : ''}`}><div className="metric-icon">{icon}</div><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function PanelHeading({ id, icon, title, detail }: { id?: string; icon: ReactNode; title: string; detail: string }) {
  return <div className="panel-heading"><div><h2 id={id}>{icon}{title}</h2><span>{detail}</span></div></div>
}

function PanelError({ title, onRetry }: { title: string; onRetry: () => void }) {
  return <div className="dashboard-empty"><CircleAlert size={20} /><strong>{title}</strong><span>Live data could not be loaded for this panel.</span><button className="button button-secondary" type="button" onClick={onRetry}>Retry</button></div>
}

function DashboardEmpty({ icon, title, message }: { icon: ReactNode; title: string; message: string }) {
  return <div className="dashboard-empty"><div className="empty-icon">{icon}</div><strong>{title}</strong><span>{message}</span></div>
}
