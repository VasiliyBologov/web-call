import React from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

type BlogArticleData = {
  title: string
  summary: string
  sections: Array<{ title: string; body: string }>
}

const BLOG_ARTICLES: Record<string, BlogArticleData> = {
  'how-to-create-online-video-call-no-registration': {
    title: 'How to Create an Online Video Call Without Registration',
    summary: 'A no-registration video call removes the account-creation step for both the organizer and the guest. With TalkLink, the invitation itself is a private room URL.',
    sections: [
      { title: '1. Create the right type of room', body: 'Choose a private call for one-to-one communication or a group meeting for several participants. TalkLink generates a random URL for the new room; no profile or email address is required.' },
      { title: '2. Share the invitation privately', body: 'Copy the complete room URL and send it to the intended participants through a trusted message or email. Anyone with the active link may try to join, so avoid posting it publicly.' },
      { title: '3. Check the browser before joining', body: 'Open the link in a current browser and allow camera and microphone access. A stable connection and headphones improve reliability and reduce echo. Guests follow the same steps without installing TalkLink.' },
      { title: 'After the conversation', body: 'Close the room tab when the call ends. Create a fresh random link for a different conversation instead of reusing or publishing an old invitation.' },
    ],
  },
  'best-browser-video-calling-tools': {
    title: 'How to Choose a Browser Video Calling Tool',
    summary: 'The best tool depends on who is joining and what the meeting needs to accomplish. A quick client call has different requirements from a scheduled company webinar.',
    sections: [
      { title: 'Start with guest friction', body: 'Check whether guests need an account, an application, or an organization login. Browser-first tools such as TalkLink are useful when an external participant needs to join quickly from a link.' },
      { title: 'Compare the controls you actually need', body: 'Consider participant limits, screen sharing, moderation, recording, calendar integration, captions, and support for mobile browsers. More features can help complex meetings but may add setup steps to a simple call.' },
      { title: 'Review privacy and reliability', body: 'Look for encrypted transport, clear recording behavior, understandable room access, and a privacy policy. Test the tool on the devices and networks your participants commonly use.' },
      { title: 'Match the tool to the conversation', body: 'Use a lightweight link-based room for spontaneous calls and external guests. Choose a full collaboration suite when the workflow requires managed accounts, scheduled events, recordings, or enterprise administration.' },
    ],
  },
  'zoom-vs-browser-based-video-calls': {
    title: 'Installed Meeting Apps vs Browser-Based Video Calls',
    summary: 'Installed meeting applications and browser rooms solve overlapping problems, but they optimize for different levels of complexity and participant commitment.',
    sections: [
      { title: 'Where installed applications help', body: 'A dedicated application can provide deep operating-system integration, managed updates, virtual devices, recording workflows, and advanced controls for large or recurring meetings.' },
      { title: 'Where browser calls reduce friction', body: 'A browser link is useful for short conversations, first-time guests, support sessions, and client calls. Participants can join without downloading software or creating an account for a service they may use only once.' },
      { title: 'Security depends on configuration', body: 'Both approaches can encrypt media in transit. Organizers should still control invitations, understand recording settings, update their browser or application, and avoid sharing private meeting links publicly.' },
      { title: 'Choose per meeting', body: 'Use a full installed suite when you need enterprise management or specialized meeting features. Use TalkLink when speed, simple guest access, and a private link are the priorities.' },
    ],
  },
  'how-secure-are-browser-video-meetings': {
    title: 'How Secure Are Browser Video Meetings?',
    summary: 'Modern browser meetings use WebRTC, which requires audio and video to be encrypted in transit. Security still depends on how the room, device, and invitation are handled.',
    sections: [
      { title: 'Encryption protects media in transit', body: 'WebRTC encrypts the real-time media sent between participants. When a direct peer connection is unavailable, encrypted media may pass through a TURN relay without becoming unencrypted call content.' },
      { title: 'Signaling is different from media', body: 'Before media can flow, participants exchange connection information through a signaling service. TalkLink temporarily processes room and connection state but does not record or store the audio and video conversation.' },
      { title: 'The room link is an access secret', body: 'Send active room URLs only to intended participants. Do not place them in public posts, analytics events, screenshots, or documents accessible to people outside the conversation.' },
      { title: 'Secure the endpoint too', body: 'Keep the browser and operating system updated, review camera and microphone prompts, use a trusted device, and leave the room when the meeting ends. Transport encryption cannot protect a compromised device.' },
    ],
  },
  'how-to-create-meeting-link-in-seconds': {
    title: 'How to Create a Video Meeting Link in Seconds',
    summary: 'A meeting link lets participants move directly from an invitation into a browser room. TalkLink creates the URL without asking the organizer to register first.',
    sections: [
      { title: 'Create the room', body: 'Open the group meeting page and choose Create meeting. TalkLink returns a unique URL for a room that supports up to ten participants for up to two hours.' },
      { title: 'Send the complete link', body: 'Copy the URL without shortening or editing it and send it through the communication channel your group already uses. Add the meeting time and purpose so recipients recognize the invitation.' },
      { title: 'Prepare before guests arrive', body: 'Open the room early, enter the display name you want other participants to see, and check browser permissions. Headphones and a stable network help prevent echo and interruptions.' },
      { title: 'Create a new link when appropriate', body: 'Treat each room URL as a private invitation. For an unrelated group or a future sensitive conversation, generate a new room instead of circulating an old link.' },
    ],
  },
  'online-meetings-for-remote-teams': {
    title: 'Browser Meetings for Remote Teams',
    summary: 'Remote teams need meetings that are easy to enter and purposeful once they begin. A browser link can remove setup friction for colleagues and external guests.',
    sections: [
      { title: 'Use meetings for the right work', body: 'Reserve synchronous calls for decisions, difficult discussions, demonstrations, and topics where rapid clarification matters. Share routine status updates asynchronously when a meeting would add little value.' },
      { title: 'Make joining predictable', body: 'Send one clear room link with the agenda, time zone, and expected duration. Participants should test their microphone and camera before a client presentation or important review.' },
      { title: 'Keep small meetings focused', body: 'Assign a facilitator, capture decisions outside the call, and end when the objective is complete. TalkLink group rooms support up to ten participants, which suits check-ins and focused project conversations.' },
      { title: 'Invite external collaborators', body: 'A no-registration link is convenient for freelancers, candidates, customers, and partners who should not need an account in the team’s main collaboration suite.' },
    ],
  },
  'video-calls-for-freelancers': {
    title: 'Video Calls for Freelancers and Clients',
    summary: 'A client should be able to join a consultation without troubleshooting a new account or application. A browser room keeps the invitation simple and professional.',
    sections: [
      { title: 'Reduce friction for a new client', body: 'Send a direct room link with the scheduled time, purpose, and expected length. Explain that the browser will ask for camera and microphone access and that no TalkLink registration is required.' },
      { title: 'Prepare a professional setup', body: 'Check lighting, audio, screen-sharing material, and network stability before the call. Use headphones in shared spaces and close unrelated tabs before presenting your screen.' },
      { title: 'Protect client conversations', body: 'Send the invitation privately and create a different random room for unrelated clients. Do not include room tokens or full private links in analytics, public calendars, or portfolio screenshots.' },
      { title: 'Follow up outside the call', body: 'Summarize decisions, responsibilities, and deadlines in writing. TalkLink does not record the conversation, so agreed notes should live in the project system chosen by you and the client.' },
    ],
  },
  'video-calls-without-downloads': {
    title: 'Video Calls Without Downloads: How Browser Calling Works',
    summary: 'A modern browser can capture camera and microphone input and establish a real-time call through WebRTC. That makes a separate meeting application optional for many conversations.',
    sections: [
      { title: 'What happens when you open the link', body: 'The browser loads the meeting interface, asks for media permission, and exchanges connection information with the other participant. Audio and video are encrypted in transit before they leave the browser.' },
      { title: 'Why no-download calls are useful', body: 'Guests avoid installation prompts, software updates, and account creation. This is especially helpful for first-time client calls, support conversations, interviews, and quick meetings across organizations.' },
      { title: 'What participants still need', body: 'Use a supported current browser, a stable network, and a working microphone. Mobile operating systems may pause media when the browser is placed in the background, so keep the call visible.' },
      { title: 'When an installed tool may be better', body: 'Large events, managed recording, specialized virtual devices, and enterprise administration can justify dedicated software. For a focused call, a browser link often provides the shortest path to the conversation.' },
    ],
  },
  'google-meet-alternative': {
    title: 'A Simple Google Meet Alternative for Link-Based Calls',
    summary: 'Google Meet is a broad meeting product connected to the Google ecosystem. TalkLink focuses on a narrower workflow: create a private room link and start a browser conversation quickly.',
    sections: [
      { title: 'When TalkLink is a useful alternative', body: 'Choose TalkLink for a quick one-to-one call, a small group meeting, or an external guest who should not need to sign in. The organizer can generate a link without creating a TalkLink account.' },
      { title: 'Where a collaboration suite has advantages', body: 'Google Meet may be preferable when a team depends on Google Calendar scheduling, Workspace administration, managed recordings, live captions, or other integrated collaboration features.' },
      { title: 'Compare privacy and access', body: 'For any platform, review who can open the invitation, whether recording is enabled, what account data is required, and how media is protected. TalkLink uses WebRTC encryption in transit and does not record calls.' },
      { title: 'Pick the smallest tool that meets the need', body: 'A feature-rich suite is valuable for structured organizational workflows. A lightweight TalkLink room is useful when the priority is to get a small set of participants talking with minimal setup.' },
    ],
  },
  'best-free-video-conferencing-tools': {
    title: 'How to Evaluate Free Video Conferencing Tools',
    summary: 'A free plan is useful only when its limits match the meeting. Compare the complete joining experience and operational constraints instead of choosing by the longest feature list.',
    sections: [
      { title: 'Check limits first', body: 'Confirm the maximum number of participants, meeting duration, screen-sharing support, mobile behavior, and whether the organizer or every guest needs an account. Limits and plan terms can change, so verify them on each provider’s official site.' },
      { title: 'Count the cost of guest friction', body: 'An external client may value a simple browser link more than calendar integration. An internal team may prefer managed accounts, recurring meetings, recordings, and centralized administration.' },
      { title: 'Review privacy behavior', body: 'Understand whether calls are recorded, how analytics are used, who can join from a link, and how media is encrypted. Organizers should still send private room links only to intended participants.' },
      { title: 'Test before committing', body: 'Run a short call on the desktop and mobile devices your group uses. Check audio, camera permissions, screen sharing, weak-network behavior, and how easily a first-time guest can join.' },
    ],
  },
  'changelog-last-3-months': {
    title: 'Обновления TalkLink: март–июнь 2026',
    summary: 'За этот период TalkLink получил групповые встречи, улучшения качества WebRTC-соединения, видеоэффекты и полноценную локализацию.',
    sections: [
      { title: 'Июнь 2026', body: 'Добавлены блог и тематические страницы о видеосвязи, обновлены sitemap.xml, robots.txt и метаданные публичных страниц.' },
      { title: 'Май 2026', body: 'Появились групповые встречи, обновлённая панель управления, улучшения стабильности WebRTC, размытие фона, русская и английская локализации, а также автоматическое отключение микрофона при смене вкладки.' },
      { title: 'Март 2026', body: 'Улучшены глубокие ссылки для iOS и Android и добавлена гибкая настройка базовых адресов комнат.' },
    ],
  },
}

export const BlogArticle: React.FC<{ slug?: string }> = ({ slug }) => {
  useTranslation()

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
          <h1 className="text-5xl font-black mb-6 text-white">TalkLink Blog</h1>
          <p className="mb-12 text-lg leading-relaxed text-slate-400">Practical guides about browser video calls, private meeting links, WebRTC security, remote work, and TalkLink product updates.</p>
          <div className="grid gap-8">
            {Object.entries(BLOG_ARTICLES).map(([articleSlug, article]) => (
              <a key={articleSlug} href={`/blog/${articleSlug}`} className="block p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all group">
                <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400">{article.title}</h2>
                <p className="text-slate-400 leading-relaxed">{article.summary}</p>
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
        <a href="/blog" className="text-slate-400 hover:text-white flex items-center gap-2">← Back to Blog</a>
        <LanguageSwitcher />
      </header>
      <main className="max-w-3xl mx-auto px-6 py-20">
        <article>
          <h1 className="text-4xl md:text-5xl font-black mb-8 text-white leading-tight">{article.title}</h1>
          <div className="prose prose-invert prose-lg text-slate-400 leading-relaxed">
            <p className="text-xl">{article.summary}</p>
            {article.sections.map((section) => (
              <section key={section.title} className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-4">{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}

            <div className="mt-20 p-10 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 border border-white/10 rounded-3xl text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Start your meeting now</h2>
              <p className="mb-8">No registration, no downloads. Just private video calls.</p>
              <a href="/" className="inline-block bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all">Launch TalkLink</a>
            </div>
          </div>
        </article>
      </main>
    </div>
  )
}
