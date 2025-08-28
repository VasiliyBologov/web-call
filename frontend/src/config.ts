const isBrowser = typeof window !== 'undefined' && typeof window.location !== 'undefined'
const proto = isBrowser && window.location.protocol === 'https:' ? 'https' : 'http'
const wsProto = proto === 'https' ? 'wss' : 'ws'
const rawHost = isBrowser ? window.location.hostname : 'localhost'

// Detect Docker bridge IPs (172.16.0.0/12). If the page is opened via a container IP,
// use localhost for API/WS so requests go through host port mapping (works from host browser).
const isDockerBridgeIP = (h: string) => /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(h)
const apiHost = isDockerBridgeIP(rawHost) ? 'localhost' : rawHost

// Resolve API/WS base dynamically:
// - Dev (Vite on 5173): use :8000 for backend
// - Prod (App Service behind 80/443): same host, default port (no explicit :8000)
const port = isBrowser ? window.location.port : ''
const apiHostPort = port === '5173' ? `${apiHost}:8000` : rawHost
const API_BASE = `${proto}://${apiHostPort}`
const WS_BASE = `${wsProto}://${apiHostPort}`

// Only ICE can be injected via build-time env; API/WS are resolved at runtime from window.location.
export const ICE_JSON = import.meta.env.VITE_ICE_JSON || '[]'

export const ICE_SERVERS: RTCIceServer[] = (() => {
  try {
    return JSON.parse(ICE_JSON)
  } catch {
    return []
  }
})()

export function api(path: string) {
  return `${API_BASE}${path}`
}

export function wsUrl(path: string) {
  return `${WS_BASE}${path}`
}
