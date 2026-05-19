import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export const Landing: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 overflow-x-hidden relative font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <header className="relative z-10 max-w-7xl mx-auto flex justify-between items-center px-6 py-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TalkLink</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#how-it-works" className="hover:text-white transition-colors text-xs uppercase tracking-widest">{t('nav.howItWorks')}</a>
        </nav>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <a 
            href="/call" 
            className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:border-white/20"
          >
            {t('nav.startCall')}
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          {t('hero.badge')}
        </div>
        
        <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tight text-white leading-[1.1]">
          {t('hero.title1')} <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-teal-400">
            {t('hero.title2')}
          </span>
        </h1>
        
        <p className="text-lg md:text-xl mb-12 text-slate-400 font-normal max-w-2xl leading-relaxed">
          {t('hero.description')}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 items-center">
          <a 
            href="/call" 
            className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl shadow-blue-600/30 transition-all hover:-translate-y-1 flex items-center gap-3 active:scale-95"
          >
            {t('hero.cta')}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 w-full">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-left backdrop-blur-sm hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('features.private.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('features.private.desc')}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-left backdrop-blur-sm hover:border-emerald-500/30 transition-colors group">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('features.instant.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('features.instant.desc')}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-left backdrop-blur-sm hover:border-teal-500/30 transition-colors group">
            <div className="w-12 h-12 bg-teal-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-600/30 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('features.anyDevice.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('features.anyDevice.desc')}
            </p>
          </div>
        </div>
      </main>

      {/* How it works Section */}
      <section id="how-it-works" className="relative z-10 max-w-5xl mx-auto px-6 py-32 border-t border-white/5">
        <h2 className="text-3xl md:text-5xl font-black mb-16 text-center text-white tracking-tight">
          {t('how.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400 font-black text-2xl">
              1
            </div>
            <h3 className="text-white font-bold text-xl mb-4">{t('how.step1.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('how.step1.desc')}
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-400 font-black text-2xl">
              2
            </div>
            <h3 className="text-white font-bold text-xl mb-4">{t('how.step2.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('how.step2.desc')}
            </p>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-teal-600/20 rounded-2xl flex items-center justify-center mb-6 text-teal-400 font-black text-2xl">
              3
            </div>
            <h3 className="text-white font-bold text-xl mb-4">{t('how.step3.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('how.step3.desc')}
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">TalkLink</span>
          </div>
          <div className="text-slate-500 text-xs font-medium">
            {t('footer.copy')}
          </div>
          <div className="flex gap-6">
            {/*<a href="#" className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest">Twitter</a>*/}
            <a href="https://github.com/VasiliyBologov/web-call" className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
