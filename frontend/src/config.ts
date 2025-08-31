const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined'
const proto = isBrowser && window.location.protocol === 'https:' ? 'https' : 'http'
const wsProto = proto === 'https' ? 'wss' : 'ws'
const rawHost = isBrowser ? window.location.hostname : 'localhost'

// Detect Docker bridge IPs (172.16.0.0/12). If the page is opened via a container IP,
// use localhost for API/WS so requests go through host port mapping (works from host browser).
const isDockerBridgeIP = (h: string) => /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)
const apiHost = isDockerBridgeIP(rawHost) ? 'localhost' : rawHost

// Resolve API/WS base:
// - Dev (Vite dev server): talk to backend on :8000
// - Prod (built app behind nginx): same-origin (nginx proxies /api and /ws)
// - Optional explicit override via VITE_API_BASE / VITE_WS_BASE
const DEV = typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV
const ENV_API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined
const ENV_WS_BASE = (import.meta as any).env?.VITE_WS_BASE as string | undefined
const IS_PROD = (import.meta as any).env?.VITE_IS_PROD as string | undefined

// Fallback для production режима - если import.meta.env.DEV не определен, считаем что это production
const isDev = DEV === true || IS_PROD === 'false'
const isProd = DEV === false || IS_PROD === 'true' || (typeof DEV === 'undefined' && typeof window !== 'undefined')

const API_BASE = ENV_API_BASE
  ? ENV_API_BASE
  : (isDev ? `${proto}://${apiHost}:8000` : `${proto}://${isBrowser ? window.location.host : rawHost}`)

const WS_BASE = ENV_WS_BASE
  ? ENV_WS_BASE
  : (isDev ? `${wsProto}://${apiHost}:8000` : `${wsProto}://${isBrowser ? window.location.host : rawHost}`)

// Enhanced ICE configuration with better TURN support
// Use our own TURN server as the default instead of Google STUN servers
const DEFAULT_ICE_JSON = JSON.stringify([
  { urls: [
    'stun:localhost:3478'
  ] },
  { urls: [
    'turn:localhost:3478?transport=udp'
  ], username: 'user', credential: 'secret' }
])

const RAW_ICE = import.meta.env.VITE_ICE_JSON as string | undefined
export const ICE_JSON = (!RAW_ICE || RAW_ICE.trim() === '' || RAW_ICE.trim() === '[]' || RAW_ICE.trim().toLowerCase() === 'null')
  ? DEFAULT_ICE_JSON
  : RAW_ICE

// ICE transport policy: "all" (default) or "relay" (TURN-only)
const RAW_POLICY = (import.meta.env.VITE_ICE_TRANSPORT_POLICY as string | undefined)?.trim().toLowerCase()
export const ICE_TRANSPORT_POLICY: RTCIceTransportPolicy = (RAW_POLICY === 'relay' || RAW_POLICY === 'all')
  ? (RAW_POLICY as RTCIceTransportPolicy)
  : 'all'

function isFirefox(): boolean {
  if (!isBrowser) return false
  try {
    const ua = navigator.userAgent || ''
    return /Firefox\//i.test(ua)
  } catch {
    return false
  }
}

function normalizeIceServers(raw: any, policy: RTCIceTransportPolicy, dev: boolean): RTCIceServer[] {
  // Flatten to list of entries with single URL, preserve credentials
  const entries: { url: string; username?: string; credential?: string }[] = []
  try {
    const list = Array.isArray(raw) ? raw : []
    for (const item of list) {
      if (!item) continue
      const urls = (item.urls == null) ? [] : (Array.isArray(item.urls) ? item.urls : [item.urls])
      const username = item.username
      const credential = item.credential
      for (const u of urls) {
        if (typeof u !== 'string') continue
        const url = u.trim()
        if (!url) continue
        // If relay-only policy, skip STUN to reduce noise
        if (policy === 'relay' && url.toLowerCase().startsWith('stun:')) continue
        entries.push({ url, username, credential })
      }
    }
  } catch {}

  // Deduplicate by URL
  const seen = new Set<string>()
  const deduped: typeof entries = []
  for (const e of entries) {
    if (seen.has(e.url)) continue
    seen.add(e.url)
    deduped.push(e)
  }

  // Prioritize TURN over STUN for better reliability
  const turns = deduped.filter(e => e.url.toLowerCase().startsWith('turn'))
  const stuns = deduped.filter(e => e.url.toLowerCase().startsWith('stun'))

  // Firefox-specific cap: keep at most 4 URLs total (prefer TURN, then STUN)
  const cap = isFirefox() ? 4 : Infinity
  const ordered = [...turns, ...stuns]
  const capped = ordered.slice(0, cap)

  // Rebuild as RTCIceServer objects with single url per entry
  const servers: RTCIceServer[] = capped.map(e => ({
    urls: e.url,
    ...(e.username ? { username: e.username } : {}),
    ...(e.credential ? { credential: e.credential } : {}),
  }))

  if (dev) {
    try {
      // eslint-disable-next-line no-console
      console.debug('[ICE] Using', servers.length, 'ICE URLs', isFirefox() ? '(firefox cap applied)' : '')
      console.debug('[ICE] TURN servers:', turns.length, 'STUN servers:', stuns.length)
    } catch {}
  }

  return servers
}

export const ICE_SERVERS: RTCIceServer[] = (() => {
  let parsed: any
  try {
    parsed = JSON.parse(ICE_JSON)
  } catch {
    parsed = JSON.parse(DEFAULT_ICE_JSON)
  }
  return normalizeIceServers(parsed, ICE_TRANSPORT_POLICY, !!DEV)
})()

export function api(path: string) {
  return `${API_BASE}${path}`
}

export function wsUrl(path: string) {
  return `${WS_BASE}${path}`
}
