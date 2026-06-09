import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const BLOG_ARTICLES: Record<string, any> = {
  'how-to-create-online-video-call-no-registration': {
    title: 'How to Create an Online Video Call Without Registration',
    content: 'Full article content about creating calls without registration...'
  },
  'best-browser-video-calling-tools': {
    title: 'Best Browser Video Calling Tools',
    content: 'Comparison of best browser tools...'
  }
  // ... rest of 10 articles
}

export const BlogArticle: React.FC<{ slug?: string }> = ({ slug }) => {
  const { t } = useTranslation()
  
  // If no slug, show list
  if (!slug) {
    return (
      <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
        <header className="max-w-7xl mx-auto flex justify-between items-center px-6 py-8">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">TalkLink Blog</span>
          </a>
          <LanguageSwitcher />
        </header>
        <main className="max-w-4xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-black mb-12 text-white">TalkLink Blog</h1>
          <div className="grid gap-8">
            {Object.entries(BLOG_ARTICLES).map(([s, a]) => (
              <a key={s} href={`/blog/${s}`} className="block p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all group">
                <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400">{a.title}</h2>
                <p className="text-slate-400">Read more about {a.title.toLowerCase()}...</p>
              </a>
            ))}
          </div>
        </main>
      </div>
    )
  }

  const article = BLOG_ARTICLES[slug]
  if (!article) return <div>Article not found</div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans">
      <header className="max-w-7xl mx-auto flex justify-between items-center px-6 py-8">
        <a href="/blog" className="text-slate-400 hover:text-white flex items-center gap-2">
          ← Back to Blog
        </a>
        <LanguageSwitcher />
      </header>
      <main className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-black mb-8 text-white leading-tight">
          {article.title}
        </h1>
        <div className="prose prose-invert prose-lg text-slate-400 leading-relaxed">
          {article.content}
          
          <div className="mt-20 p-10 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border border-white/10 rounded-3xl text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Start your meeting now</h3>
            <p className="mb-8">No registration, no downloads. Just private video calls.</p>
            <a href="/" className="inline-block bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all">
              Launch TalkLink
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
