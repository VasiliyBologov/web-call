import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAnalyticsPageLocation,
  getAnalyticsPageReferrer,
  initializeAnalytics,
  normalizeAnalyticsPath,
  sanitizeAnalyticsParams,
  trackEvent,
} from '../analytics'

describe('privacy-safe analytics', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/')
    Object.defineProperty(document, 'referrer', { configurable: true, value: '' })
    delete window.gtag
    window.dataLayer = []
    document.getElementById('talklink-google-analytics')?.remove()
  })

  it('replaces private room identifiers with route placeholders', () => {
    expect(normalizeAnalyticsPath('/r/private-room-token')).toBe('/r/:token')
    expect(normalizeAnalyticsPath('/m/private-meeting-token/')).toBe('/m/:token')
    expect(normalizeAnalyticsPath('/video-call-link')).toBe('/video-call-link')
  })

  it('keeps referrers attribution-safe without paths or query parameters', () => {
    Object.defineProperty(document, 'referrer', {
      configurable: true,
      value: 'https://messenger.example/invite?room=private-token',
    })

    expect(getAnalyticsPageReferrer()).toBe('https://messenger.example/')
  })

  it('drops sensitive and unknown event parameters', () => {
    expect(sanitizeAnalyticsParams({
      room_type: 'private',
      language: 'en',
      cta_name: 'hero_private_call',
      token: 'secret',
      room_url: 'https://example.test/r/secret',
      peer_id: 'peer-secret',
      arbitrary: 'not-allowed',
    })).toEqual({ room_type: 'private', language: 'en', cta_name: 'hero_private_call' })
  })

  it('normalizes private URLs even when accidentally supplied as landing pages', () => {
    expect(sanitizeAnalyticsParams({
      landing_page: 'https://talklink.space/r/private-room-token?name=Alice',
      error_code: 'private-room-token',
    })).toEqual({ landing_page: '/r/:token', error_code: 'unknown_error' })
  })

  it('initializes GA with a normalized room location and no automatic page view', () => {
    window.history.replaceState({}, '', '/r/private-room-token')
    initializeAnalytics()

    expect(getAnalyticsPageLocation()).toBe(`${window.location.origin}/r/:token`)
    expect(window.dataLayer).toEqual(expect.arrayContaining([
      expect.arrayContaining([
        'config',
        expect.any(String),
        expect.objectContaining({
          send_page_view: false,
          page_location: `${window.location.origin}/r/:token`,
        }),
      ]),
    ]))
  })

  it('never includes a room token in funnel events', () => {
    window.history.replaceState({}, '', '/m/private-meeting-token')
    initializeAnalytics()
    const gtag = vi.spyOn(window, 'gtag')

    trackEvent('call_connected', {
      room_type: 'group',
      connection_type: 'direct',
      token: 'private-meeting-token',
    })

    expect(gtag).toHaveBeenLastCalledWith('event', 'call_connected', {
      room_type: 'group',
      connection_type: 'direct',
      page_location: `${window.location.origin}/m/:token`,
      page_title: 'TalkLink — group meeting room',
      page_referrer: '',
    })
  })
})
