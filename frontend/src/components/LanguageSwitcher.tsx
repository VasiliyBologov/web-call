import React from 'react'
import { useTranslation } from 'react-i18next'
import Cookies from 'js-cookie'

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    Cookies.set('lang', lng, { expires: 365 })
  }

  const currentLang = i18n.language.startsWith('ru') ? 'ru' : 'en'

  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-1">
      <button
        onClick={() => changeLanguage('ru')}
        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
          currentLang === 'ru'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        RU
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all ${
          currentLang === 'en'
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
            : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
      >
        EN
      </button>
    </div>
  )
}
