import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../config'
import QRCode from 'qrcode'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export const Call: React.FC = () => {
  const { t } = useTranslation()
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const base = useMemo(() => window.location.origin, [])

  useEffect(() => {
    document.title = `${t('nav.startCall')} — TalkLink`
  }, [t])

  async function createRoom() {
    setRoomUrl(null)
    setQrDataUrl(null)
    const res = await fetch(api('/api/rooms'), { method: 'POST' })
    if (!res.ok) {
      alert(t('room.error.create.title'))
      return
    }
    const data = await res.json()
    const url = data.url.startsWith('http') ? data.url : `${base}${data.url}`
    setRoomUrl(url)
    const qr = await QRCode.toDataURL(url, { 
      margin: 2, 
      scale: 10,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
    setQrDataUrl(qr)
  }

  async function shareLink(url: string) {
    try {
      if (navigator.share) {
        await navigator.share({ title: t('call.share'), text: t('call.share'), url })
      } else {
        await navigator.clipboard.writeText(url)
        alert(t('call.copied'))
      }
    } catch (e) {
      console.warn('Share failed', e)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <header className="mb-16 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TalkLink</span>
          </a>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a href="/" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              {t('common.back')}
            </a>
          </div>
        </header>

        <main>
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              {t('call.title1')} <br />
              <span className="text-blue-500">{t('call.title2')}</span>
            </h1>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              {t('call.desc')}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Subtle Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

            {!roomUrl ? (
              <div className="flex flex-col items-center py-8">
                <button 
                  onClick={createRoom}
                  className="group relative bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl shadow-blue-600/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('call.generate')}
                </button>
                <p className="mt-8 text-slate-500 text-sm font-medium flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {t('call.protected')}
                </p>
              </div>
            ) : (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-4">{t('call.accessLink')}</h2>
                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative group/input">
                      <input 
                        readOnly 
                        value={roomUrl}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-lg font-mono text-blue-100 focus:outline-none focus:border-blue-500/50 transition-all"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity"></div>
                    </div>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(roomUrl);
                        alert(t('call.copied'));
                      }}
                      className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 whitespace-nowrap"
                    >
                      {t('call.copy')}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-12 items-center">
                  <div className="flex-1 w-full space-y-4">
                    <button 
                      onClick={() => window.open(roomUrl, '_blank')}
                      className="w-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 px-6 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      <span>{t('call.enter')}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => shareLink(roomUrl)}
                      className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-5 rounded-2xl font-bold transition-all flex items-center justify-center gap-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {t('call.share')}
                    </button>
                  </div>

                  {qrDataUrl && (
                    <div className="relative group">
                      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="relative bg-white p-5 rounded-3xl shadow-2xl">
                        <img src={qrDataUrl} alt="QR Code" className="w-40 h-40" />
                        <div className="mt-3 text-slate-900 text-[10px] font-black uppercase tracking-widest text-center opacity-40">
                          {t('call.scan')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-12">
            {[
              { step: '01', title: t('call.steps.1.title'), desc: t('call.steps.1.desc') },
              { step: '02', title: t('call.steps.2.title'), desc: t('call.steps.2.desc') },
              { step: '03', title: t('call.steps.3.title'), desc: t('call.steps.3.desc') }
            ].map((item, idx) => (
              <div key={idx} className="relative group">
                <div className="text-4xl font-black text-white/5 absolute -top-6 -left-2 group-hover:text-blue-500/10 transition-colors tracking-tighter">
                  {item.step}
                </div>
                <h3 className="text-white font-bold mb-2 relative z-10">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
