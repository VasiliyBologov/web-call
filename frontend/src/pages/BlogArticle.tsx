import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const BLOG_ARTICLES: Record<string, any> = {
  'how-to-create-online-video-call-no-registration': {
    title: 'How to Create an Online Video Call Without Registration',
    content: 'Learn how to start instant video calls without any account or registration. TalkLink provides a simple way to connect with anyone just by sharing a link.'
  },
  'best-browser-video-calling-tools': {
    title: 'Best Browser Video Calling Tools',
    content: 'Explore the top tools for video conferencing that work directly in your browser. We compare TalkLink, Google Meet, and other WebRTC-based solutions.'
  },
  'zoom-vs-browser-based-video-calls': {
    title: 'Zoom vs Browser-Based Video Calls',
    content: 'Do you really need to download an app? We compare the pros and cons of dedicated software like Zoom versus browser-based calling like TalkLink.'
  },
  'how-secure-are-browser-video-meetings': {
    title: 'How Secure Are Browser Video Meetings',
    content: 'Security is paramount. Learn about WebRTC encryption and how TalkLink ensures your meetings stay private and secure.'
  },
  'how-to-create-meeting-link-in-seconds': {
    title: 'How to Create a Meeting Link in Seconds',
    content: 'Speed matters. See how you can generate a secure meeting link and start your conversation in less than 5 seconds with TalkLink.'
  },
  'online-meetings-for-remote-teams': {
    title: 'Online Meetings for Remote Teams',
    content: 'Remote work is the new normal. Discover how browser-based video calls can simplify communication for your distributed team.'
  },
  'video-calls-for-freelancers': {
    title: 'Video Calls for Freelancers',
    content: 'As a freelancer, you need reliable and professional tools. TalkLink offers a friction-less way to meet with clients without requiring them to install anything.'
  },
  'video-calls-without-downloads': {
    title: 'Video Calls Without Downloads',
    content: 'Stop wasting time on software updates and installations. Browser video calls are the future of instant communication.'
  },
  'google-meet-alternative': {
    title: 'Google Meet Alternative',
    content: 'Looking for a simpler, more private alternative to Google Meet? See why TalkLink might be the perfect choice for your next meeting.'
  },
  'best-free-video-conferencing-tools': {
    title: 'Best Free Video Conferencing Tools',
    content: 'We list the best free tools for video calls in 2026. Focus on privacy, ease of use, and no-registration features.'
  },
  'changelog-last-3-months': {
    title: 'Обновления TalkLink: Что нового за последние 3 месяца',
    content: (
      <div className="space-y-8">
        <p>
          Мы постоянно работаем над улучшением TalkLink, чтобы сделать ваши видеозвонки еще более качественными, безопасными и удобными. Вот краткий обзор основных изменений и новых функций, появившихся за последние три месяца.
        </p>
        
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Июнь 2026</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>9 июня 2026:</strong> Запуск системы блога и специализированных SEO-лендингов. Теперь нас легче найти в поиске, а вы можете читать полезные статьи о видеосвязи.</li>
            <li><strong>9 июня 2026:</strong> Масштабное обновление SEO: динамическая генерация sitemap.xml и оптимизация robots.txt для лучшей индексации.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Май 2026</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>26 мая 2026:</strong> Групповые встречи (Meet). Добавлена возможность создания комнат для совместной работы нескольких участников.</li>
            <li><strong>26 мая 2026:</strong> Обновление панели управления: новый UI, поддержка английского языка по умолчанию и усиленная безопасность административных эндпоинтов.</li>
            <li><strong>20 мая 2026:</strong> Оптимизация WebRTC: внедрена атомарная регистрация участников, улучшена обработка очереди сообщений и стабильность соединения.</li>
            <li><strong>20 мая 2026:</strong> Эффекты видео: добавлена функция размытия фона (Background Blur) для вашего комфорта и приватности.</li>
            <li><strong>19 мая 2026:</strong> Интернационализация: полноценная поддержка русского и английского языков с автоматическим определением предпочтений пользователя.</li>
            <li><strong>18 мая 2026:</strong> "Auto mute on blur": функция автоматического отключения звука при переключении на другую вкладку.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Март 2026</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>27 марта 2026:</strong> Глубокие ссылки (Deep Linking): улучшена интеграция с мобильными операционными системами iOS и Android.</li>
            <li><strong>13 марта 2026:</strong> Динамические URL: гибкая настройка базовых адресов для ссылок на комнаты.</li>
          </ul>
        </section>

        <p className="mt-8 italic">
          Спасибо, что пользуетесь TalkLink! Мы продолжаем развиваться и готовим еще много интересного.
        </p>
      </div>
    )
  }
};

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
