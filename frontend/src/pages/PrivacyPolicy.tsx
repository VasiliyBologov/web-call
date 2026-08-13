import React from 'react'

export const PrivacyPolicy: React.FC = () => {
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
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-black mb-8 text-white tracking-tight">Политика конфиденциальности</h1>
        
        <div className="space-y-6 text-slate-400 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Общие положения</h2>
            <p>
              Данная политика конфиденциальности относится к приложению TalkLink (далее — Приложение). 
              Приложение является проектом с открытым исходным кодом (Open Source) и предоставляется «как есть».
              Разработка и поддержка Приложения осуществляется частным лицом, юридическое лицо отсутствует.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Сбор и использование данных</h2>
            <p>
              Приложение TalkLink разработано с приоритетом на приватность:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Мы не собираем, не храним и не передаем персональные данные пользователей.</li>
              <li>В приложении отсутствует система регистрации и личные кабинеты.</li>
              <li>Мы не используем файлы cookie для отслеживания ваших действий.</li>
              <li>Аудио- и видеовызовы осуществляются по технологии WebRTC, обеспечивающей передачу данных напрямую между участниками (Peer-to-Peer).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Права доступа</h2>
            <p>
              Для функционирования основных возможностей Приложению требуются следующие доступы:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li><strong>Камера и микрофон:</strong> Исключительно для осуществления видео- и аудиосвязи в реальном времени. Данные с камеры и микрофона не записываются и не сохраняются на серверах.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Авторское право и лицензия</h2>
            <p>
              Исходный код приложения TalkLink находится в открытом доступе и защищен авторским правом. 
              Условия использования, копирования и модификации кода определяются лицензией, указанной в репозитории проекта на GitHub.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Изменения политики</h2>
            <p>
              Данная политика может обновляться по мере развития Приложения. Рекомендуется периодически проверять эту страницу на наличие изменений.
            </p>
          </section>

          <section className="pt-8 border-t border-white/10 text-sm">
            <p>Дата последнего обновления: 13 августа 2026 г.</p>
            <p>
              GitHub: <a href="https://github.com/VasiliyBologov/web-call" className="text-blue-400 hover:underline">VasiliyBologov/web-call</a>
            </p>
          </section>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12 px-6 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <a href="/" className="text-slate-500 hover:text-white transition-colors text-xs uppercase font-bold tracking-widest">
            Вернуться на главную
          </a>
        </div>
      </footer>
    </div>
  )
}
