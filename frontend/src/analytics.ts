export type AnalyticsEventName =
  | 'landing_cta_click'
  | 'room_created'
  | 'link_shared'
  | 'guest_joined'
  | 'call_connected'
  | 'call_60s'
  | 'call_failed'
  | 'store_click'

export type AnalyticsConnectionType = 'direct' | 'relay' | 'unknown'

type AnalyticsValue = string | number | boolean
type AnalyticsParams = Record<string, AnalyticsValue | null | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const DEFAULT_MEASUREMENT_ID = 'G-95YPFTG6PZ'
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID

const ALLOWED_PARAM_NAMES = new Set([
  'cta_name',
  'landing_page',
  'language',
  'room_type',
  'share_method',
  'device_category',
  'connection_type',
  'failure_stage',
  'error_code',
  'store',
])

const FORBIDDEN_PARAM_NAMES = new Set([
  'token',
  'room_token',
  'room_url',
  'peer_id',
  'participant_name',
  'display_name',
  'email',
  'phone',
  'sdp',
  'candidate',
  'message',
  'ip_address',
])

const SAFE_ENUM_VALUES: Record<string, Set<string>> = {
  cta_name: new Set([
    'header_group_meeting',
    'header_private_call',
    'hero_private_call',
    'hero_group_meeting',
    'generate_private_link',
    'generate_group_link',
  ]),
  language: new Set(['en', 'ru', 'ro']),
  room_type: new Set(['private', 'group']),
  share_method: new Set(['clipboard', 'native_share']),
  device_category: new Set(['mobile', 'desktop']),
  connection_type: new Set(['direct', 'relay', 'unknown']),
  failure_stage: new Set(['room_creation', 'initialization', 'signaling', 'ice']),
  store: new Set(['app_store', 'google_play']),
}

const SAFE_ERROR_CODES = new Set([
  'unknown_error',
  'error',
  'aborterror',
  'invalidstateerror',
  'networkerror',
  'notallowederror',
  'notfounderror',
  'notreadableerror',
  'notsupportederror',
  'operationerror',
  'overconstrainederror',
  'securityerror',
  'typeerror',
  'request_failed',
  'missing_type',
  'unknown_type',
  'internal_error',
  'room_not_found',
  'room_full',
  'bad_join',
  'bad_sdp',
  'bad_candidate',
  'bad_bye',
  'bad_orientation',
  'bad_json',
  'expired',
  'ws_retries_exhausted',
  'ice_failed',
])

export function normalizeAnalyticsPath(pathname: string): string {
  const path = pathname.split('?')[0].split('#')[0] || '/'
  if (/^\/r\/[^/]+\/?$/i.test(path)) return '/r/:token'
  if (/^\/m\/[^/]+\/?$/i.test(path)) return '/m/:token'
  return path
}

export function getAnalyticsPath(): string {
  if (typeof window === 'undefined') return '/'
  return normalizeAnalyticsPath(window.location.pathname)
}

export function getAnalyticsPageLocation(): string {
  if (typeof window === 'undefined') return 'https://talklink.space/'
  return `${window.location.origin}${getAnalyticsPath()}`
}

export function getAnalyticsPageReferrer(): string {
  if (typeof document === 'undefined' || !document.referrer) return ''
  try {
    const referrer = new URL(document.referrer)
    if (typeof window !== 'undefined' && referrer.origin === window.location.origin) {
      return `${referrer.origin}${normalizeAnalyticsPath(referrer.pathname)}`
    }
    // Keep attribution at origin level without forwarding third-party paths,
    // query parameters, or fragments that could contain private information.
    return `${referrer.origin}/`
  } catch {
    return ''
  }
}

function getAnalyticsPageTitle(): string {
  const path = getAnalyticsPath()
  if (path === '/r/:token') return 'TalkLink — private call room'
  if (path === '/m/:token') return 'TalkLink — group meeting room'
  return document.title || 'TalkLink'
}

function sanitizeValue(value: AnalyticsValue): AnalyticsValue {
  if (typeof value !== 'string') return value
  return value.replace(/[\r\n\t]/g, ' ').slice(0, 100)
}

function sanitizeLandingPage(value: string): string {
  try {
    const path = /^https?:\/\//i.test(value) ? new URL(value).pathname : value
    return normalizeAnalyticsPath(path.startsWith('/') ? path : '/')
  } catch {
    return '/'
  }
}

export function sanitizeAnalyticsParams(params: AnalyticsParams): Record<string, AnalyticsValue> {
  const sanitized: Record<string, AnalyticsValue> = {}

  for (const [key, value] of Object.entries(params)) {
    if (!ALLOWED_PARAM_NAMES.has(key) || FORBIDDEN_PARAM_NAMES.has(key) || value == null) continue
    if (key === 'landing_page' && typeof value === 'string') {
      sanitized[key] = sanitizeLandingPage(value)
      continue
    }
    if (key === 'error_code') {
      sanitized[key] = getSafeServerCode(value)
      continue
    }
    const allowedValues = SAFE_ENUM_VALUES[key]
    if (allowedValues && (typeof value !== 'string' || !allowedValues.has(value))) continue
    sanitized[key] = sanitizeValue(value)
  }

  return sanitized
}

export function initializeAnalytics(): void {
  if (typeof window === 'undefined' || window.gtag) return

  window.dataLayer = window.dataLayer || []
  window.gtag = (...args: unknown[]) => {
    window.dataLayer!.push(args)
  }

  const pageLocation = getAnalyticsPageLocation()
  const pageTitle = getAnalyticsPageTitle()
  const pageReferrer = getAnalyticsPageReferrer()

  // Keep every automatic event on a privacy-safe URL. Automatic page views are
  // disabled so room tokens can never be inferred from the browser location.
  window.gtag('set', {
    page_location: pageLocation,
    page_title: pageTitle,
    page_referrer: pageReferrer,
  })
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    page_location: pageLocation,
    page_title: pageTitle,
    page_referrer: pageReferrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })
  window.gtag('event', 'page_view', {
    page_location: pageLocation,
    page_title: pageTitle,
    page_referrer: pageReferrer,
  })

  const script = document.createElement('script')
  script.id = 'talklink-google-analytics'
  script.async = true
  script.referrerPolicy = 'origin'
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`
  document.head.appendChild(script)
}

export function trackEvent(name: AnalyticsEventName, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', name, {
    ...sanitizeAnalyticsParams(params),
    page_location: getAnalyticsPageLocation(),
    page_title: getAnalyticsPageTitle(),
    page_referrer: getAnalyticsPageReferrer(),
  })
}

export function getDeviceCategory(): 'mobile' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const touchPoints = navigator.maxTouchPoints || 0
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || touchPoints > 0
    ? 'mobile'
    : 'desktop'
}

export function getSafeErrorCode(error: unknown): string {
  const raw = error instanceof Error ? error.name : typeof error === 'string' ? error : 'unknown_error'
  return getSafeServerCode(raw)
}

export function getSafeServerCode(code: unknown): string {
  if (typeof code !== 'string') return 'unknown_error'
  const normalized = code.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  if (/^http_[1-5][0-9]{2}$/.test(normalized)) return normalized
  return SAFE_ERROR_CODES.has(normalized) ? normalized : 'unknown_error'
}

export async function detectConnectionType(pc: RTCPeerConnection): Promise<AnalyticsConnectionType> {
  try {
    const stats = await pc.getStats()
    let selectedPair: any = null
    let selectedPairId: string | null = null

    stats.forEach((report: any) => {
      if (report.type === 'transport' && report.selectedCandidatePairId) {
        selectedPairId = report.selectedCandidatePairId
      }
      if (
        report.type === 'candidate-pair' &&
        report.state === 'succeeded' &&
        (report.nominated || report.selected)
      ) {
        selectedPair = report
      }
    })

    if (selectedPairId) selectedPair = stats.get(selectedPairId) || selectedPair
    if (!selectedPair) return 'unknown'

    const local = stats.get(selectedPair.localCandidateId)
    const remote = stats.get(selectedPair.remoteCandidateId)
    return local?.candidateType === 'relay' || remote?.candidateType === 'relay' ? 'relay' : 'direct'
  } catch {
    return 'unknown'
  }
}
