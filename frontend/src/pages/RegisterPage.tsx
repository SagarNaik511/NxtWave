import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Clock3, LoaderCircle, LockKeyhole, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { ApiError, createRegistration, validateReferralCode } from '../lib/api'
import type { RegistrationPayload, RegistrationResponse } from '../types/api'

interface FormValues {
  full_name: string
  email: string
  college_name: string
  branch: string
  graduation_year: string
  referral_code: string
}

type FieldName = keyof FormValues
type FieldErrors = Partial<Record<FieldName, string>>
type SubmissionState = 'idle' | 'submitting' | 'success' | 'error'
type ReferralState = 'idle' | 'validating' | 'valid' | 'invalid' | 'unavailable'

const initialValues: FormValues = {
  full_name: '',
  email: '',
  college_name: '',
  branch: '',
  graduation_year: '',
  referral_code: '',
}

function collapseWhitespace(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeReferralCode(value: string) {
  return value.trim().toUpperCase()
}

function getApiFieldErrors(body: unknown): FieldErrors {
  if (typeof body !== 'object' || body === null) return {}

  const errors: FieldErrors = {}
  for (const field of ['full_name', 'email', 'college_name', 'branch', 'graduation_year', 'referral_code'] as FieldName[]) {
    const value = (body as Record<string, unknown>)[field]
    if (Array.isArray(value) && typeof value[0] === 'string') errors[field] = value[0]
  }
  return errors
}

function validate(values: FormValues, currentYear: number): FieldErrors {
  const errors: FieldErrors = {}
  const fullName = collapseWhitespace(values.full_name)
  const collegeName = collapseWhitespace(values.college_name)
  const branch = collapseWhitespace(values.branch)

  if (fullName.length < 2) errors.full_name = 'Enter your full name.'
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address.'
  if (collegeName.length < 2) errors.college_name = 'Enter your college name.'
  if (branch.length < 2) errors.branch = 'Enter your branch or specialization.'

  const year = Number(values.graduation_year)
  if (!values.graduation_year || !Number.isInteger(year) || year < 2000 || year > currentYear + 8) {
    errors.graduation_year = `Enter a year between 2000 and ${currentYear + 8}.`
  }

  return errors
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 0) return 'We could not reach the registration service. Please try again in a moment.'
  if (error instanceof ApiError && error.status >= 500) return 'The registration service is temporarily unavailable. Your form is still here—please try again shortly.'
  return 'Something went wrong while submitting your registration. Please review the form and try again.'
}

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const currentYear = new Date().getFullYear()
  const validationRequestId = useRef(0)
  const initialReferralCode = normalizeReferralCode(searchParams.get('ref') ?? '')
  const [values, setValues] = useState<FormValues>(() => ({ ...initialValues, referral_code: initialReferralCode }))
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState('')
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [registration, setRegistration] = useState<RegistrationResponse | null>(null)
  const [referralState, setReferralState] = useState<ReferralState>('idle')
  const [ambassadorName, setAmbassadorName] = useState('')

  useEffect(() => {
    document.title = 'Register free | AI Sprint'
    document.querySelector('meta[name="description"]')?.setAttribute(
      'content',
      'Reserve your free spot for the AI Sprint beginner-friendly online workshop.',
    )
  }, [])

  const updateField = (field: FieldName, value: string) => {
    const nextValue = field === 'referral_code' ? value.toUpperCase() : value
    setValues((current) => ({ ...current, [field]: nextValue }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    setGeneralError('')

    if (field === 'referral_code') {
      validationRequestId.current += 1
      setReferralState('idle')
      setAmbassadorName('')
    }
  }

  const clearReferralCode = () => {
    validationRequestId.current += 1
    setValues((current) => ({ ...current, referral_code: '' }))
    setFieldErrors((current) => ({ ...current, referral_code: undefined }))
    setReferralState('idle')
    setAmbassadorName('')
    setGeneralError('')
  }

  const handleReferralValidation = async () => {
    const code = normalizeReferralCode(values.referral_code)
    if (!code) {
      setReferralState('idle')
      setAmbassadorName('')
      setFieldErrors((current) => ({ ...current, referral_code: undefined }))
      return
    }

    const requestId = ++validationRequestId.current
    setReferralState('validating')
    setAmbassadorName('')
    setFieldErrors((current) => ({ ...current, referral_code: undefined }))

    try {
      const result = await validateReferralCode(code)
      if (requestId !== validationRequestId.current) return

      if (result.valid) {
        setReferralState('valid')
        setAmbassadorName(result.ambassador_name ?? 'the ambassador who shared it')
      } else {
        setReferralState('invalid')
        setFieldErrors((current) => ({ ...current, referral_code: 'This code is unknown or inactive.' }))
      }
    } catch {
      if (requestId !== validationRequestId.current) return
      setReferralState('unavailable')
      setFieldErrors((current) => ({ ...current, referral_code: 'We could not verify this code. Remove it or retry.' }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submissionState === 'submitting') return

    const validationErrors = validate(values, currentYear)
    const normalizedReferralCode = normalizeReferralCode(values.referral_code)
    if (normalizedReferralCode && referralState !== 'valid') {
      validationErrors.referral_code = referralState === 'unavailable'
        ? 'We could not verify this code. Remove it or retry.'
        : 'Validate this code before submitting, or remove it.'
    }

    setFieldErrors(validationErrors)
    setGeneralError(Object.keys(validationErrors).length > 0 && validationErrors.referral_code
      ? 'Please validate the referral code or remove it before registering.'
      : '')
    if (Object.keys(validationErrors).length > 0) {
      setSubmissionState('error')
      return
    }

    const payload: RegistrationPayload = {
      full_name: collapseWhitespace(values.full_name),
      email: values.email.trim().toLowerCase(),
      college_name: collapseWhitespace(values.college_name),
      branch: collapseWhitespace(values.branch),
      graduation_year: Number(values.graduation_year),
      ...(normalizedReferralCode ? { referral_code: normalizedReferralCode } : {}),
    }

    setSubmissionState('submitting')
    try {
      const createdRegistration = await createRegistration(payload)
      setRegistration(createdRegistration)
      setSubmissionState('success')
    } catch (error: unknown) {
      setFieldErrors(error instanceof ApiError ? getApiFieldErrors(error.body) : {})
      setGeneralError(error instanceof ApiError && error.status === 409
        ? 'This email has already been used for the workshop. Try a different email or return to the workshop page.'
        : errorMessage(error))
      setSubmissionState('error')
    }
  }

  if (submissionState === 'success' && registration) {
    return (
      <section className="registration-page success-page" aria-labelledby="success-heading">
        <div className="success-icon"><CheckCircle2 size={28} aria-hidden="true" /></div>
        <div className="eyebrow"><Sparkles size={15} aria-hidden="true" /> Registration created</div>
        <h1 id="success-heading">You are on the list, {registration.full_name.split(' ')[0]}.</h1>
        <p>Your registration was saved successfully. Confirmed joining instructions and final workshop details will be shared when they are available.</p>
        <div className="success-note"><LockKeyhole size={16} aria-hidden="true" /> No meeting link or schedule has been invented here.</div>
        <Link className="button button-primary" to="/">Back to the workshop <ArrowLeft size={17} aria-hidden="true" /></Link>
      </section>
    )
  }

  const referralStatusMessage = referralState === 'valid'
    ? `Valid code — shared by ${ambassadorName}.`
    : referralState === 'invalid'
      ? 'This code is unknown or inactive. You can remove it and continue without a referral.'
      : referralState === 'unavailable'
        ? 'The code could not be verified right now. Remove it or retry.'
        : referralState === 'validating'
          ? 'Checking this code…'
          : ''

  return (
    <section className="registration-page" aria-labelledby="register-heading">
      <div className="registration-intro">
        <Link className="back-link" to="/"><ArrowLeft size={15} aria-hidden="true" /> Back to the workshop</Link>
        <div className="eyebrow"><Sparkles size={15} aria-hidden="true" /> Free workshop registration</div>
        <h1 id="register-heading">Take your first step in AI.</h1>
        <p>Share a few details so we can hold your interest for the beginner-friendly workshop. It takes about a minute.</p>
        <div className="registration-facts"><span><Clock3 size={16} aria-hidden="true" /> 60 minutes</span><span>Online format</span><span>Free to attend</span></div>
      </div>

      <form className="registration-card" onSubmit={handleSubmit} noValidate>
        <div className="form-header"><span className="form-step">01 / 01</span><span>YOUR DETAILS</span></div>
        {generalError && <div className="form-alert" role="alert"><CircleAlert size={18} aria-hidden="true" /><span>{generalError}</span></div>}

        <div className="form-fields">
          <Field label="Full name" name="full_name" value={values.full_name} error={fieldErrors.full_name} onChange={updateField} placeholder="Your name" autoComplete="name" />
          <Field label="Email address" name="email" type="email" value={values.email} error={fieldErrors.email} onChange={updateField} placeholder="you@example.com" autoComplete="email" />
          <Field label="College name" name="college_name" value={values.college_name} error={fieldErrors.college_name} onChange={updateField} placeholder="Your college or university" autoComplete="organization" />
          <Field label="Branch / specialization" name="branch" value={values.branch} error={fieldErrors.branch} onChange={updateField} placeholder="CSE, IT, AI/ML…" />
          <div className="field-group">
            <label htmlFor="graduation_year">Graduation year <span aria-hidden="true">*</span></label>
            <input id="graduation_year" name="graduation_year" type="number" min="2000" max={currentYear + 8} inputMode="numeric" value={values.graduation_year} onChange={(event) => updateField('graduation_year', event.target.value)} aria-invalid={Boolean(fieldErrors.graduation_year)} aria-describedby={fieldErrors.graduation_year ? 'graduation_year-error' : undefined} placeholder={String(currentYear)} />
            {fieldErrors.graduation_year && <span className="field-error" id="graduation_year-error" role="alert">{fieldErrors.graduation_year}</span>}
          </div>
          <div className="field-group field-full referral-field">
            <label htmlFor="referral_code">Referral code <span className="optional-label">(optional)</span></label>
            <div className="referral-input-row">
              <input id="referral_code" name="referral_code" type="text" value={values.referral_code} onChange={(event) => updateField('referral_code', event.target.value)} onBlur={() => void handleReferralValidation()} placeholder="e.g. AMB102" autoComplete="off" aria-invalid={Boolean(fieldErrors.referral_code)} aria-describedby="referral-help referral-status" />
              <button className="validate-code-button" type="button" onClick={() => void handleReferralValidation()} disabled={!values.referral_code.trim() || referralState === 'validating'}>
                {referralState === 'validating' ? <LoaderCircle className="spin" size={15} aria-hidden="true" /> : 'Validate'}
              </button>
            </div>
            <span className="form-help" id="referral-help">Have a code from a student ambassador? You can also continue without one.</span>
            {values.referral_code && <button className="clear-code-button" type="button" onClick={clearReferralCode}>Remove code</button>}
            {referralStatusMessage && <span className={`referral-status referral-status-${referralState}`} id="referral-status" role="status" aria-live="polite">{referralStatusMessage}</span>}
            {fieldErrors.referral_code && <span className="field-error" id="referral-code-error" role="alert">{fieldErrors.referral_code}</span>}
          </div>
        </div>

        <div className="form-footer">
          <p><LockKeyhole size={15} aria-hidden="true" /> Your details are used for this workshop registration only.</p>
          <button className="button button-primary submit-button" type="submit" disabled={submissionState === 'submitting'}>
            {submissionState === 'submitting' ? <><LoaderCircle className="spin" size={17} aria-hidden="true" /> Saving registration…</> : <>Reserve my free spot <ArrowRight size={17} aria-hidden="true" /></>}
          </button>
        </div>
      </form>
    </section>
  )
}

interface FieldProps {
  label: string
  name: FieldName
  value: string
  error?: string
  onChange: (field: FieldName, value: string) => void
  placeholder: string
  type?: string
  autoComplete?: string
}

function Field({ label, name, value, error, onChange, placeholder, type = 'text', autoComplete }: FieldProps) {
  const errorId = `${name}-error`
  return (
    <div className="field-group">
      <label htmlFor={name}>{label} <span aria-hidden="true">*</span></label>
      <input id={name} name={name} type={type} value={value} onChange={(event) => onChange(name, event.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} />
      {error && <span className="field-error" id={errorId} role="alert">{error}</span>}
    </div>
  )
}

