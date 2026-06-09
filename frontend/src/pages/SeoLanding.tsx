import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const SEO_PAGES: Record<string, any> = {
  'online-video-calls': {
    title: 'Online Video Calls',
    content: 'Long SEO content about online video calls...'
  },
  'web-calls': {
    title: 'Web Calls',
    content: 'Long SEO content about web calls...'
  },
  'video-meetings': {
    title: 'Video Meetings',
    content: 'Long SEO content about video meetings...'
  },
  'video-call-link': {
    title: 'Video Call by Link',
    content: 'Long SEO content about video call links...'
  }
}

export const SeoLanding: React.FC<{ slug: string }> = ({ slug }) => {
  const { t } = useTranslation()
  const page = SEO_PAGES[slug]

  const faqIndices = Array.from({ length: 12 }, (_, i) => i + 1)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqIndices.map(i => ({
      "@type": "Question",
      "name": t(`faq.q${i}`),
      "acceptedAnswer": {
        "@type": "Answer",
        "text": t(`faq.a${i}`)
      }
    }))
  }

  if (!page) return <div>Page not found</div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <header className="max-w-7xl mx-auto flex justify-between items-center px-6 py-8">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-lg flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white">TalkLink</span>
        </a>
        <LanguageSwitcher />
      </header>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-6xl font-black mb-8 text-white tracking-tight">
          {page.title}
        </h1>
        <div className="prose prose-invert prose-lg max-w-none text-slate-400 leading-relaxed">
          <p>{page.content}</p>
          <p>TalkLink allows you to create secure {page.title.toLowerCase()} instantly. No downloads, no registration.</p>
          
          <div className="my-12 p-8 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to start?</h2>
            <a href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-blue-600/20">
              Start Free Video Call
            </a>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">Why use TalkLink for {page.title.toLowerCase()}?</h2>
          <ul className="list-disc pl-6 space-y-4">
            <li>No registration or software installation required</li>
            <li>End-to-end encryption for maximum privacy</li>
            <li>High-quality audio and video via WebRTC</li>
            <li>Works on all devices: desktop and mobile</li>
          </ul>

          <div className="mt-20 pt-20 border-t border-white/5">
            <h2 className="text-3xl font-black mb-12 text-white tracking-tight">
              {t('faq.title')}
            </h2>
            <div className="space-y-8">
              {faqIndices.map((i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                  <h3 className="text-white font-bold text-lg mb-4">{t(`faq.q${i}`)}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{t(`faq.a${i}`)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/5 py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-slate-500 text-sm">
          <span>© 2026 TalkLink</span>
          <a href="/" className="hover:text-white transition-colors">Home</a>
        </div>
      </footer>
    </div>
  )
}
