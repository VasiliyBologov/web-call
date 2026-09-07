import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  detectMobilePlatform,
  getStoreUrl,
  isCrawlerUserAgent,
} from '../storeLinks'

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 fill-current">
    <path d="M17.05 12.54c-.02-2.25 1.84-3.34 1.92-3.39a4.12 4.12 0 0 0-3.25-1.76c-1.37-.15-2.7.82-3.4.82-.72 0-1.8-.8-2.97-.78a4.3 4.3 0 0 0-3.62 2.2c-1.58 2.73-.4 6.75 1.11 8.96.76 1.09 1.65 2.3 2.82 2.26 1.14-.05 1.57-.73 2.95-.73 1.36 0 1.77.73 2.96.7 1.23-.02 2-1.08 2.73-2.18a8.9 8.9 0 0 0 1.25-2.55 3.9 3.9 0 0 1-2.5-3.55ZM14.82 5.94a4.01 4.01 0 0 0 .92-2.87 4.1 4.1 0 0 0-2.66 1.36 3.82 3.82 0 0 0-.95 2.76 3.4 3.4 0 0 0 2.69-1.25Z" />
  </svg>
)

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8">
    <path fill="#00d7fe" d="M3.3 2.4 13.9 12 3.3 21.6c-.2-.4-.3-.8-.3-1.3V3.7c0-.5.1-.9.3-1.3Z" />
    <path fill="#ffce00" d="m17.3 8.9-3.4 3.1L3.3 2.4c.5-.8 1.5-1 2.4-.5l11.6 7Z" />
    <path fill="#ff3a44" d="M17.3 15.1 5.7 22c-.9.5-1.9.3-2.4-.5L13.9 12l3.4 3.1Z" />
    <path fill="#00f076" d="M21 12c0 .7-.4 1.3-1 1.7l-2.7 1.5-3.4-3.2 3.4-3.1 2.7 1.5c.6.3 1 .9 1 1.6Z" />
  </svg>
)

type StoreButtonProps = {
  href: string
  eyebrow: string
  title: string
  icon: React.ReactNode
}

export const StoreButton: React.FC<StoreButtonProps> = ({ href, eyebrow, title, icon }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex min-w-56 items-center gap-3 rounded-2xl border border-white/15 bg-white px-5 py-3 text-left text-slate-950 shadow-xl transition-all hover:-translate-y-0.5 hover:bg-slate-100 active:scale-95"
  >
    {icon}
    <span className="flex flex-col leading-none">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-600">{eyebrow}</span>
      <span className="text-lg font-bold">{title}</span>
    </span>
  </a>
)

export const AppStoreButton = () => {
  const { t } = useTranslation()
  return <StoreButton href={APP_STORE_URL} eyebrow={t('download.on')} title="App Store" icon={<AppleIcon />} />
}

export const GooglePlayButton = () => {
  const { t } = useTranslation()
  return <StoreButton href={GOOGLE_PLAY_URL} eyebrow={t('download.on')} title="Google Play" icon={<GooglePlayIcon />} />
}

export const Download: React.FC = () => {
  const { t } = useTranslation()

  useEffect(() => {
    // Search engines must see the download landing page instead of being sent to a store.
    if (isCrawlerUserAgent(navigator.userAgent)) return

    const platform = detectMobilePlatform(navigator.userAgent, navigator.maxTouchPoints)
    const storeUrl = getStoreUrl(platform)
    if (storeUrl) window.location.replace(storeUrl)
  }, [])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-6 text-slate-200">
      <div className="pointer-events-none absolute left-[-10%] top-[-10%] h-[45%] w-[45%] rounded-full bg-blue-600/20 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[45%] w-[45%] rounded-full bg-emerald-600/20 blur-[90px]" />

      <div className="absolute right-6 top-6 z-10"><LanguageSwitcher /></div>

      <main className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <a href="/" className="mb-10 flex items-center gap-2 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </span>
          <span className="text-2xl font-bold tracking-tight">TalkLink</span>
        </a>

        <h1 className="mb-5 text-4xl font-black tracking-tight text-white md:text-6xl">{t('download.title')}</h1>
        <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-400">{t('download.description')}</p>

        <div className="flex flex-col gap-4 sm:flex-row">
          <AppStoreButton />
          <GooglePlayButton />
        </div>

        <a href="/" className="mt-10 text-sm font-semibold text-slate-400 transition-colors hover:text-white">
          {t('download.back')}
        </a>
      </main>
    </div>
  )
}
