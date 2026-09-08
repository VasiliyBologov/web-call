import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type SeoPage = {
  title: string
  intro: string
  sections: Array<{ title: string; body: string }>
  useCases: string[]
}

const SEO_PAGES: Record<string, SeoPage> = {
  'online-video-calls': {
    title: 'Online Video Calls',
    intro: 'Start an online video call from a modern browser without creating an account or asking participants to install another app. TalkLink creates a private room that you can open from desktop or mobile devices.',
    sections: [
      {
        title: 'Start a call in a few steps',
        body: 'Choose a private call or group meeting, create a unique room link, and share it with the people you want to invite. Each participant opens the link and grants camera and microphone permission before joining.'
      },
      {
        title: 'Built for quick conversations',
        body: 'Removing account creation and installation makes TalkLink useful when a conversation needs to start quickly. A current browser, a stable internet connection, and a camera or microphone are all you need.'
      }
    ],
    useCases: ['Remote team check-ins', 'Client and freelance consultations', 'Calls with friends and family', 'Quick one-to-one conversations']
  },
  'web-calls': {
    title: 'Browser Web Calls Without Downloads',
    intro: 'TalkLink lets you start a private video call directly in a modern web browser. There is no account to create and no application to install: create a room, share its unique link, and connect in seconds.',
    sections: [
      {
        title: 'How to start a web call',
        body: 'Open TalkLink and choose a video call or group meeting. Create a private room link, send it only to the people you want to invite, then allow camera and microphone access when you are ready to join.'
      },
      {
        title: 'Why make calls in the browser?',
        body: 'Browser-based calls remove installation and sign-up steps, which makes them useful for quick conversations with clients, friends, family, and remote teams. TalkLink uses WebRTC for real-time audio and video and encrypts media in transit.'
      },
      {
        title: 'What you need',
        body: 'Use a current browser and a stable internet connection. Headphones can reduce echo in noisy rooms. Participants can join from desktop or mobile devices without creating a TalkLink account.'
      }
    ],
    useCases: ['Instant calls with no registration', 'Cross-device browser meetings', 'Private links for invited participants', 'Audio and video protected in transit']
  },
  'video-meetings': {
    title: 'Video Meetings',
    intro: 'Create a browser-based video meeting and invite participants with one link. TalkLink keeps the joining process short, so a team or group can move from invitation to conversation without account setup.',
    sections: [
      {
        title: 'A simple meeting workflow',
        body: 'Create a meeting room, copy its unique URL, and send it through the channel your group already uses. Participants can check their camera and microphone in the browser before entering the meeting.'
      },
      {
        title: 'Useful for distributed groups',
        body: 'A link-based meeting works well for remote teams, project discussions, interviews, and informal group calls. Because TalkLink runs in the browser, guests can join from different devices without installing dedicated meeting software.'
      }
    ],
    useCases: ['Remote team meetings', 'Project discussions', 'Online interviews', 'Small group conversations']
  },
  'video-call-link': {
    title: 'Video Call by Link',
    intro: 'Create a unique video call link and share it with the person or group you want to reach. The link opens a TalkLink room in the browser, making it easy for guests to join without registration.',
    sections: [
      {
        title: 'Create and share your room',
        body: 'Start from the TalkLink call page, generate a room, and copy the URL. Treat the room link like an invitation: share it directly with intended participants and avoid posting private links publicly.'
      },
      {
        title: 'Join from desktop or mobile',
        body: 'Guests can open the same link on a supported desktop or mobile browser. After granting camera and microphone access, they can join the conversation without remembering a meeting code or creating an account.'
      }
    ],
    useCases: ['One-click invitations', 'No meeting codes to enter', 'Desktop and mobile access', 'No TalkLink account required']
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
          <p>{page.intro}</p>

          {page.sections.map((section) => (
            <section key={section.title} className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          
          <div className="my-12 p-8 bg-blue-600/10 border border-blue-500/20 rounded-3xl text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Ready to start?</h2>
            <a href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl text-lg font-bold transition-all shadow-xl shadow-blue-600/20">
              Start Free Video Call
            </a>
          </div>

          <h2 className="text-2xl font-bold text-white mt-12 mb-6">When to use TalkLink</h2>
          <ul className="list-disc pl-6 space-y-4">
            {page.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
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
