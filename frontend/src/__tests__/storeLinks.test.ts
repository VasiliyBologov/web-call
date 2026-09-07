import { describe, expect, it } from 'vitest'
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  detectMobilePlatform,
  getStoreUrl,
} from '../storeLinks'

describe('mobile store link detection', () => {
  it('detects Android devices', () => {
    const platform = detectMobilePlatform(
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36',
    )

    expect(platform).toBe('android')
    expect(getStoreUrl(platform)).toBe(GOOGLE_PLAY_URL)
  })

  it('detects iPhones', () => {
    const platform = detectMobilePlatform(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    )

    expect(platform).toBe('ios')
    expect(getStoreUrl(platform)).toBe(APP_STORE_URL)
  })

  it('detects iPadOS desktop-style user agents by touch support', () => {
    expect(detectMobilePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)', 5)).toBe('ios')
  })

  it('does not redirect desktop visitors to an arbitrary store', () => {
    const platform = detectMobilePlatform(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
    )

    expect(platform).toBe('other')
    expect(getStoreUrl(platform)).toBeNull()
  })
})
