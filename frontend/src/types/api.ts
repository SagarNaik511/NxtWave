export interface ApiHealth {
  status: 'ok'
  service: string
}

export interface RegistrationPayload {
  full_name: string
  email: string
  college_name: string
  branch: string
  graduation_year: number
  referral_code?: string
}

export interface RegistrationResponse {
  id: number
  full_name: string
  created_at: string
}

export interface ReferralValidationResponse {
  valid: boolean
  referral_code: string
  ambassador_name?: string
}

export interface CampaignReportingPeriod {
  key: 'all_time' | 'campaign' | 'custom'
  configured: boolean
  available: boolean
  start_date: string | null
  end_date: string | null
  timezone: string
  label: string
  message: string | null
}

export type AnalyticsPeriodKey = 'all_time' | 'campaign' | 'custom'

export interface AnalyticsPeriodParams {
  period?: AnalyticsPeriodKey
  start_date?: string
  end_date?: string
}

export interface CampaignSettings {
  name: string
  target_registrations: number
  duration_days: number
  budget_inr: number
  start_date: string | null
  timezone: string
  updated_at: string
}

export interface CampaignSettingsResponse {
  data_status: 'campaign_configuration'
  campaign: CampaignSettings
}

export interface AnalyticsOverview {
  data_status: 'live_database'
  performance: {
    total_registrations: number
    registrations_remaining: number
    target_reached_percentage: number
    attributed_registrations: number
    unattributed_registrations: number
    most_recent_registration_at: string | null
  }
  campaign: {
    name: string
    target_registrations: number
    duration_days: number
    budget_inr: number
    start_date: string | null
    timezone: string
  }
  reporting_period: CampaignReportingPeriod
  selected_period: CampaignReportingPeriod
  selected_performance: {
    total_registrations: number
    attributed_registrations: number
    unattributed_registrations: number
    most_recent_registration_at: string | null
  }
}

export interface DailyRegistrationPoint {
  date: string
  registrations: number
}

export interface AnalyticsDaily {
  data_status: 'live_database'
  reporting_period: CampaignReportingPeriod
  selected_period: CampaignReportingPeriod
  daily: DailyRegistrationPoint[]
  total_in_period: number | null
  message: string | null
}

export interface AmbassadorMetric {
  rank: number
  name: string
  referral_code: string
  registration_count: number
  share_of_total_registrations: number
}

export interface AnalyticsAmbassadors {
  data_status: 'live_database'
  total_registrations: number
  attributed_registrations: number
  unattributed_registrations: number
  share_denominator: 'all_registrations' | 'selected_period_registrations'
  inactive_historical_attributed_registrations: number
  ambassadors: AmbassadorMetric[]
  reporting_period: CampaignReportingPeriod
  selected_period: CampaignReportingPeriod
  message: string | null
}

export interface AdminLoginResponse {
  token: string
  user: { username: string }
}

export interface ManagedAmbassador {
  id: number
  name: string
  referral_code: string
  college_name: string
  is_active: boolean
  attributed_registration_count: number
  created_at: string
  updated_at: string
}

export interface ManagedAmbassadorsResponse {
  ambassadors: ManagedAmbassador[]
}

export interface AmbassadorPayload {
  name: string
  referral_code?: string
}

