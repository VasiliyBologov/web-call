export const APP_STORE_URL = 'https://apps.apple.com/app/talklinkspace/id6805110249'
export const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=talk.link.space'

export type MobilePlatform = 'ios' | 'android' | 'other'

export function detectMobilePlatform(
  userAgent: string,
  maxTouchPoints = 0,
): MobilePlatform {
  if (/android/i.test(userAgent)) return 'android'

  // Modern iPads can identify themselves as macOS, so touch support is checked too.
  if (/iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1)) {
    return 'ios'
  }

  return 'other'
}

export function getStoreUrl(platform: MobilePlatform): string | null {
  if (platform === 'ios') return APP_STORE_URL
  if (platform === 'android') return GOOGLE_PLAY_URL
  return null
}
