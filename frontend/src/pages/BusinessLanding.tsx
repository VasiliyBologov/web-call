import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export const BusinessLanding: React.FC = () => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    contact_email: '',
    company_name: '',
    contact_name: '',
    phone: '',
    text: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    document.title = `${t('business.title')} — TalkLink`
    
    // Update meta description if it exists
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('business.subtitle'))
    }
  }, [t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const response = await fetch('https://business.talklink.space/api/request-demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          date: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setStatus('success')
        setFormData({ 
          contact_email: '', 
          company_name: '', 
          contact_name: '',
          phone: '',
          text: '' 
        })
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 overflow-x-hidden relative font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 rounded-full blur-[80px] pointer-events-none"></div>

      <header className="relative z-10 max-w-7xl mx-auto flex justify-between items-center px-6 py-8">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">TalkLink</span>
        </a>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <a 
            href="/" 
            className="bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all hover:border-white/20"
          >
            {t('common.back')}
          </a>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-32">
        <div className="text-center mb-20">
          <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tight text-white leading-[1.1]">
            {t('business.title')}
          </h1>
          <p className="text-xl text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed">
            {t('business.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-blue-500/30 transition-colors group">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('business.feature1.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('business.feature1.desc')}</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-emerald-500/30 transition-colors group">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 text-emerald-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('business.feature2.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('business.feature2.desc')}</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-indigo-500/30 transition-colors group">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('business.feature3.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('business.feature3.desc')}</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm hover:border-teal-500/30 transition-colors group">
            <div className="w-12 h-12 bg-teal-600/20 rounded-2xl flex items-center justify-center mb-6 text-teal-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-xl mb-3">{t('business.feature4.title')}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{t('business.feature4.desc')}</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2rem] backdrop-blur-md shadow-2xl relative overflow-hidden">
            <h2 className="text-3xl font-black mb-8 text-white tracking-tight">{t('business.form.title')}</h2>
            
            {status === 'success' ? (
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold">
                {t('business.form.success')}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('business.form.name')}</label>
                    <input
                      required
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('business.form.email')}</label>
                    <input
                      required
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="email@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('business.form.company')}</label>
                    <input
                      required
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('business.form.phone')}</label>
                    <input
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">{t('business.form.text')}</label>
                  <textarea
                    required
                    value={formData.text}
                    onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors h-32 resize-none"
                    placeholder="..."
                  />
                </div>
                
                {status === 'error' && (
                  <p className="text-red-400 text-sm font-bold">{t('business.form.error')}</p>
                )}

                <button
                  disabled={status === 'loading'}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  {status === 'loading' ? '...' : t('business.form.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
              <div className="w-3 h-3 bg-slate-900 rounded-full"></div>
            </div>
            <span className="text-sm font-bold text-white tracking-tight">TalkLink</span>
          </div>
          <div className="text-slate-500 text-xs font-medium">
            © 2026 TalkLink. Business Solutions.
          </div>
        </div>
      </footer>
    </div>
  )
}
