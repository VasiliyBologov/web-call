"""Search-visible copy for public TalkLink pages.

The React application still provides the interactive experience.  This module
contains the same essential information in a small, server-rendered form so a
crawler does not have to execute JavaScript to understand a page.
"""

from html import escape
from typing import Any, Dict


PUBLIC_PAGE_CONTENT: Dict[str, Dict[str, Any]] = {
    "/": {
        "title": "TalkLink - Online Video Calls and Web Meetings in Your Browser",
        "description": "Create secure online video calls and web meetings instantly. No downloads, no registration. Share a link and start talking.",
        "heading": "Private video calls and web meetings with one link",
        "intro": "TalkLink creates instant browser-based video rooms without registration or software installation. Create a link, share it with your participants, and join from a desktop or mobile browser.",
        "sections": [
            ("Choose the right room", "Use a private call for a one-to-one conversation or create a group meeting for up to ten participants. Guests join through the link you send them."),
            ("Built for the browser", "TalkLink uses WebRTC for real-time communication. Participants can check their camera and microphone and start talking without creating a TalkLink account."),
        ],
        "links": [("/call", "Start a private call"), ("/meet", "Create a group meeting"), ("/business", "TalkLink for business"), ("/blog", "Read the TalkLink blog")],
    },
    "/call": {
        "title": "Create a Private Video Call Link | TalkLink",
        "description": "Create a private one-to-one video call link in seconds. No registration or download is required for you or your guest.",
        "heading": "Create a private video call room",
        "intro": "Generate a unique TalkLink room URL and send it directly to the person you want to call. Both participants join from a supported browser without registration.",
        "sections": [
            ("How a private call works", "Create the room, copy its URL, and share it through a channel you trust. The browser asks each participant for camera and microphone permission before the conversation begins."),
            ("Privacy by design", "Audio and video are encrypted in transit by WebRTC. TalkLink does not record calls, and the random room link should be treated as a private invitation."),
            ("What you need", "Use an up-to-date desktop or mobile browser, a stable internet connection, and headphones when echo or background noise is a concern."),
        ],
        "links": [("/meet", "Need a group meeting?"), ("/video-call-link", "Learn about call links")],
    },
    "/meet": {
        "title": "Create a Group Video Meeting Link | TalkLink",
        "description": "Create a browser-based group video meeting for up to ten participants and invite everyone with one private link.",
        "heading": "Create a group video meeting",
        "intro": "TalkLink group rooms support up to ten participants for meetings of up to two hours. Create the room and invite the group with one URL.",
        "sections": [
            ("Start without account setup", "The organizer creates a meeting link and shares it with the intended participants. Guests choose a display name, check their media, and join from the browser."),
            ("Useful for small groups", "Group rooms work well for project discussions, remote team check-ins, interviews, lessons, and conversations with external guests."),
            ("Protect the invitation", "Share the room URL only with invited participants. Media is encrypted in transit, and TalkLink does not record the meeting."),
        ],
        "links": [("/call", "Create a one-to-one call"), ("/video-meetings", "Learn about browser meetings")],
    },
    "/download": {
        "title": "Download TalkLink for iOS and Android",
        "description": "Download the TalkLink mobile app from the App Store or Google Play for private video calls and meetings.",
        "heading": "Download TalkLink",
        "intro": "Use TalkLink on iPhone, iPad, or Android. Mobile visitors can open the appropriate store while desktop visitors can choose the App Store or Google Play directly.",
        "sections": [
            ("The same link-based workflow", "Create or open a TalkLink room on mobile and invite participants with a URL. Guests can also join from a supported web browser."),
            ("Choose the official store", "Use the store buttons on this page to reach the official TalkLink listing for your device. Desktop users remain on this page instead of being redirected automatically."),
        ],
        "links": [("/call", "Create a call in the browser"), ("/privacy", "Read the privacy policy")],
    },
    "/business": {
        "title": "Video Calling API, Widget and Whitelabel | TalkLink for Business",
        "description": "Add secure browser video calls to your product with a TalkLink widget, room-management API, whitelabel branding, and custom deployment options.",
        "heading": "TalkLink for business",
        "intro": "Integrate browser-based video communication into your customer or internal workflow without asking participants to install another calling application.",
        "sections": [
            ("Website widget", "Place a call entry point inside your existing interface so customers can start or join a conversation without leaving your product."),
            ("Room management API", "Create rooms and connect participants programmatically as part of support, consultation, marketplace, education, or collaboration workflows."),
            ("Whitelabel delivery", "Use your own branding and domain to give participants a consistent experience from invitation through the call."),
            ("Security and deployment", "WebRTC protects media in transit. TalkLink does not record conversations, and deployment options can be discussed for your security and operational requirements."),
        ],
        "links": [("/privacy", "Review privacy information"), ("/call", "Try a TalkLink call")],
    },
    "/privacy": {
        "title": "Privacy Policy | TalkLink",
        "description": "Learn how TalkLink handles room data, WebRTC media, analytics, browser storage, and camera, microphone, and screen-sharing permissions.",
        "heading": "TalkLink privacy policy",
        "intro": "TalkLink is operated and published by TASKMASTER, SRL. The service is designed to minimize the information required for browser-based calls and meetings.",
        "sections": [
            ("Data used by the service", "TalkLink does not require an account. Signaling temporarily processes a random room identifier and connection state; group meetings also process the display name entered by a participant."),
            ("Audio and video", "Media is encrypted in transit by WebRTC and is not recorded or stored by TalkLink. It travels directly between participants when possible and may be relayed in encrypted form when necessary."),
            ("Analytics and browser storage", "Public pages use privacy-safe analytics. Full room links, room tokens, display names, SDP, and ICE candidates are excluded. Browser storage may remember language and media preferences."),
            ("Device permissions", "Camera and microphone access is used for real-time communication. Screen access is requested only after a participant chooses to start screen sharing."),
        ],
        "links": [("/", "Return to TalkLink")],
    },
    "/online-video-calls": {
        "title": "Online Video Calls Without Registration | TalkLink",
        "description": "Start an online video call in your browser without registration or software installation. Create a private TalkLink room and share one link.",
        "heading": "Online video calls without registration",
        "intro": "Start an online video call from a modern browser without creating an account or asking participants to install another app. TalkLink creates a private room for desktop and mobile devices.",
        "sections": [
            ("Start a call in a few steps", "Choose a private call or group meeting, create a unique room link, and share it with the people you want to invite. Each participant grants camera and microphone permission before joining."),
            ("Built for quick conversations", "Removing account creation and installation helps a conversation start quickly. A current browser, a stable internet connection, and a camera or microphone are all you need."),
            ("Common uses", "TalkLink is suitable for remote team check-ins, client consultations, calls with friends and family, and quick one-to-one conversations."),
        ],
        "links": [("/call", "Start a private call"), ("/meet", "Create a group meeting")],
    },
    "/web-calls": {
        "title": "Browser Web Calls Without Downloads | TalkLink",
        "description": "Start a secure web call in your browser without registration or downloads. Create a private TalkLink room, share the link, and connect in seconds.",
        "heading": "Browser web calls without downloads",
        "intro": "TalkLink lets you start a private video call directly in a modern web browser. There is no account to create and no application to install.",
        "sections": [
            ("How to start a web call", "Open TalkLink and choose a video call or group meeting. Create a private room link, send it only to the people you want to invite, then allow camera and microphone access when you are ready to join."),
            ("Why make calls in the browser?", "Browser-based calls remove installation and sign-up steps. TalkLink uses WebRTC for real-time audio and video and encrypts media in transit."),
            ("What you need", "Use a current browser and a stable internet connection. Headphones can reduce echo. Participants can join from desktop or mobile devices without creating an account."),
        ],
        "links": [("/call", "Start a web call"), ("/blog/video-calls-without-downloads", "More about calls without downloads")],
    },
    "/video-meetings": {
        "title": "Browser Video Meetings With One Link | TalkLink",
        "description": "Create a browser-based video meeting and invite a remote team, client, or group with one link. No TalkLink account is required.",
        "heading": "Video meetings in the browser",
        "intro": "Create a browser-based video meeting and invite participants with one link. TalkLink keeps the joining process short so a group can move from invitation to conversation without account setup.",
        "sections": [
            ("A simple meeting workflow", "Create a meeting room, copy its unique URL, and send it through the channel your group already uses. Participants can check their camera and microphone before entering."),
            ("Useful for distributed groups", "A link-based meeting works well for remote teams, project discussions, interviews, and informal group calls. Guests can join from different devices without dedicated meeting software."),
            ("Prepare for a reliable meeting", "Use a current browser, close applications consuming bandwidth, and choose headphones in shared or noisy rooms."),
        ],
        "links": [("/meet", "Create a meeting"), ("/blog/online-meetings-for-remote-teams", "Meetings for remote teams")],
    },
    "/video-call-link": {
        "title": "Create and Share a Private Video Call Link | TalkLink",
        "description": "Create a unique video call link and let guests join a private TalkLink room from desktop or mobile without registration.",
        "heading": "Create a video call link",
        "intro": "Create a unique video call link and share it with the person or group you want to reach. The link opens a TalkLink room directly in the browser.",
        "sections": [
            ("Create and share your room", "Start from the TalkLink call page, generate a room, and copy the URL. Treat the link like an invitation and share it directly with intended participants."),
            ("Join from desktop or mobile", "Guests open the same link on a supported browser. After granting camera and microphone access, they can join without remembering a meeting code or creating an account."),
            ("Keep room links private", "Do not publish active room links on public pages. If a conversation is finished, create a new random room link for the next call."),
        ],
        "links": [("/call", "Create a call link"), ("/meet", "Create a group link")],
    },
    "/blog": {
        "title": "Video Calling Guides and Product Updates | TalkLink Blog",
        "description": "Read practical guides about browser video calls, meeting links, WebRTC privacy, remote work, and TalkLink product updates.",
        "heading": "TalkLink blog",
        "intro": "Practical explanations for starting browser calls, choosing meeting tools, protecting room links, and helping guests join without registration or downloads.",
        "sections": [
            ("Browser calling guides", "Learn how link-based calls work, what participants need, and when a browser-first meeting is more convenient than installed software."),
            ("Privacy and product updates", "Review WebRTC security basics and follow changes to the TalkLink calling experience."),
        ],
        "links": [],
    },
    "/blog/how-to-create-online-video-call-no-registration": {
        "title": "How to Create an Online Video Call Without Registration | TalkLink",
        "description": "A practical guide to creating a private browser video call link that guests can open without registering or installing an app.",
        "heading": "How to create an online video call without registration",
        "intro": "A no-registration video call removes the account-creation step for both the organizer and the guest. With TalkLink, the invitation itself is a private room URL.",
        "sections": [
            ("1. Create the right type of room", "Choose a private call for one-to-one communication or a group meeting for several participants. TalkLink generates a random URL for the new room; no profile or email address is required."),
            ("2. Share the invitation privately", "Copy the complete room URL and send it to the intended participants through a trusted message or email. Anyone with the active link may try to join, so avoid posting it publicly."),
            ("3. Check the browser before joining", "Open the link in a current browser and allow camera and microphone access. A stable connection and headphones improve reliability and reduce echo. Guests follow the same steps without installing TalkLink."),
            ("After the conversation", "Close the room tab when the call ends. Create a fresh random link for a different conversation instead of reusing or publishing an old invitation."),
        ],
        "links": [("/call", "Create a private call"), ("/video-call-link", "How video call links work")],
    },
    "/blog/best-browser-video-calling-tools": {
        "title": "How to Choose a Browser Video Calling Tool | TalkLink",
        "description": "Compare browser video calling tools by guest access, installation requirements, room privacy, participant limits, and meeting controls.",
        "heading": "How to choose a browser video calling tool",
        "intro": "The best tool depends on who is joining and what the meeting needs to accomplish. A quick client call has different requirements from a scheduled company webinar.",
        "sections": [
            ("Start with guest friction", "Check whether guests need an account, an application, or an organization login. Browser-first tools such as TalkLink are useful when an external participant needs to join quickly from a link."),
            ("Compare the controls you actually need", "Consider participant limits, screen sharing, moderation, recording, calendar integration, captions, and support for mobile browsers. More features can help complex meetings but may add setup steps to a simple call."),
            ("Review privacy and reliability", "Look for encrypted transport, clear recording behavior, understandable room access, and a privacy policy. Test the tool on the devices and networks your participants commonly use."),
            ("Match the tool to the conversation", "Use a lightweight link-based room for spontaneous calls and external guests. Choose a full collaboration suite when the workflow requires managed accounts, scheduled events, recordings, or enterprise administration."),
        ],
        "links": [("/web-calls", "Try a browser web call"), ("/blog/how-secure-are-browser-video-meetings", "Review browser call security")],
    },
    "/blog/zoom-vs-browser-based-video-calls": {
        "title": "Installed Meeting Apps vs Browser Video Calls | TalkLink",
        "description": "Compare installed meeting software with browser-based video calls, including setup time, guest access, advanced features, and typical use cases.",
        "heading": "Installed meeting apps versus browser-based video calls",
        "intro": "Installed meeting applications and browser rooms solve overlapping problems, but they optimize for different levels of complexity and participant commitment.",
        "sections": [
            ("Where installed applications help", "A dedicated application can provide deep operating-system integration, managed updates, virtual devices, recording workflows, and advanced controls for large or recurring meetings."),
            ("Where browser calls reduce friction", "A browser link is useful for short conversations, first-time guests, support sessions, and client calls. Participants can join without downloading software or creating an account for a service they may use only once."),
            ("Security depends on configuration", "Both approaches can encrypt media in transit. Organizers should still control invitations, understand recording settings, update their browser or application, and avoid sharing private meeting links publicly."),
            ("Choose per meeting", "Use a full installed suite when you need enterprise management or specialized meeting features. Use TalkLink when speed, simple guest access, and a private link are the priorities."),
        ],
        "links": [("/online-video-calls", "Explore online video calls"), ("/call", "Start a browser call")],
    },
    "/blog/how-secure-are-browser-video-meetings": {
        "title": "How Secure Are Browser Video Meetings? | TalkLink",
        "description": "Understand WebRTC encryption, signaling, TURN relays, room-link privacy, browser permissions, and practical steps for safer video meetings.",
        "heading": "How secure are browser video meetings?",
        "intro": "Modern browser meetings use WebRTC, which requires audio and video to be encrypted in transit. Security still depends on how the room, device, and invitation are handled.",
        "sections": [
            ("Encryption protects media in transit", "WebRTC encrypts the real-time media sent between participants. When a direct peer connection is unavailable, encrypted media may pass through a TURN relay without becoming unencrypted call content."),
            ("Signaling is different from media", "Before media can flow, participants exchange connection information through a signaling service. TalkLink temporarily processes room and connection state but does not record or store the audio and video conversation."),
            ("The room link is an access secret", "Send active room URLs only to intended participants. Do not place them in public posts, analytics events, screenshots, or documents accessible to people outside the conversation."),
            ("Secure the endpoint too", "Keep the browser and operating system updated, review camera and microphone prompts, use a trusted device, and leave the room when the meeting ends. Transport encryption cannot protect a compromised device."),
        ],
        "links": [("/privacy", "Read the TalkLink privacy policy"), ("/blog/how-to-create-online-video-call-no-registration", "Create a private call")],
    },
    "/blog/how-to-create-meeting-link-in-seconds": {
        "title": "How to Create a Video Meeting Link in Seconds | TalkLink",
        "description": "Create a browser meeting room, copy its private URL, invite participants, and prepare camera and microphone access in a few simple steps.",
        "heading": "How to create a meeting link in seconds",
        "intro": "A meeting link lets participants move directly from an invitation into a browser room. TalkLink creates the URL without asking the organizer to register first.",
        "sections": [
            ("Create the room", "Open the group meeting page and choose Create meeting. TalkLink returns a unique URL for a room that supports up to ten participants for up to two hours."),
            ("Send the complete link", "Copy the URL without shortening or editing it and send it through the communication channel your group already uses. Add the meeting time and purpose so recipients recognize the invitation."),
            ("Prepare before guests arrive", "Open the room early, enter the display name you want other participants to see, and check browser permissions. Headphones and a stable network help prevent echo and interruptions."),
            ("Create a new link when appropriate", "Treat each room URL as a private invitation. For an unrelated group or a future sensitive conversation, generate a new room instead of circulating an old link."),
        ],
        "links": [("/meet", "Create a meeting link"), ("/video-meetings", "About browser meetings")],
    },
    "/blog/online-meetings-for-remote-teams": {
        "title": "Browser Meetings for Remote Teams | TalkLink",
        "description": "Use lightweight browser meeting links for remote team check-ins, project discussions, external guests, and focused small-group collaboration.",
        "heading": "Online meetings for remote teams",
        "intro": "Remote teams need meetings that are easy to enter and purposeful once they begin. A browser link can remove setup friction for colleagues and external guests.",
        "sections": [
            ("Use meetings for the right work", "Reserve synchronous calls for decisions, difficult discussions, demonstrations, and topics where rapid clarification matters. Share routine status updates asynchronously when a meeting would add little value."),
            ("Make joining predictable", "Send one clear room link with the agenda, time zone, and expected duration. Participants should test their microphone and camera before a client presentation or important review."),
            ("Keep small meetings focused", "Assign a facilitator, capture decisions outside the call, and end when the objective is complete. TalkLink group rooms support up to ten participants, which suits check-ins and focused project conversations."),
            ("Invite external collaborators", "A no-registration link is convenient for freelancers, candidates, customers, and partners who should not need an account in the team's main collaboration suite."),
        ],
        "links": [("/meet", "Create a remote team meeting"), ("/blog/video-calls-for-freelancers", "Video calls for freelancers")],
    },
    "/blog/video-calls-for-freelancers": {
        "title": "Video Calls for Freelancers and Clients | TalkLink",
        "description": "Run low-friction client video calls with a private browser link, a short agenda, sensible device checks, and no required guest account.",
        "heading": "Video calls for freelancers and clients",
        "intro": "A client should be able to join a consultation without troubleshooting a new account or application. A browser room keeps the invitation simple and professional.",
        "sections": [
            ("Reduce friction for a new client", "Send a direct room link with the scheduled time, purpose, and expected length. Explain that the browser will ask for camera and microphone access and that no TalkLink registration is required."),
            ("Prepare a professional setup", "Check lighting, audio, screen-sharing material, and network stability before the call. Use headphones in shared spaces and close unrelated tabs before presenting your screen."),
            ("Protect client conversations", "Send the invitation privately and create a different random room for unrelated clients. Do not include room tokens or full private links in analytics, public calendars, or portfolio screenshots."),
            ("Follow up outside the call", "Summarize decisions, responsibilities, and deadlines in writing. TalkLink does not record the conversation, so agreed notes should live in the project system chosen by you and the client."),
        ],
        "links": [("/call", "Create a client call"), ("/business", "Explore TalkLink for business")],
    },
    "/blog/video-calls-without-downloads": {
        "title": "Video Calls Without Downloads: How Browser Calling Works | TalkLink",
        "description": "Learn how WebRTC enables video calls without downloads, what participants need, and when a browser-based room is the convenient choice.",
        "heading": "Video calls without downloads",
        "intro": "A modern browser can capture camera and microphone input and establish a real-time call through WebRTC. That makes a separate meeting application optional for many conversations.",
        "sections": [
            ("What happens when you open the link", "The browser loads the meeting interface, asks for media permission, and exchanges connection information with the other participant. Audio and video are encrypted in transit before they leave the browser."),
            ("Why no-download calls are useful", "Guests avoid installation prompts, software updates, and account creation. This is especially helpful for first-time client calls, support conversations, interviews, and quick meetings across organizations."),
            ("What participants still need", "Use a supported current browser, a stable network, and a working microphone. Mobile operating systems may pause media when the browser is placed in the background, so keep the call visible."),
            ("When an installed tool may be better", "Large events, managed recording, specialized virtual devices, and enterprise administration can justify dedicated software. For a focused call, a browser link often provides the shortest path to the conversation."),
        ],
        "links": [("/web-calls", "Start a web call"), ("/download", "Get the TalkLink mobile app")],
    },
    "/blog/google-meet-alternative": {
        "title": "A Simple Google Meet Alternative for Link-Based Calls | TalkLink",
        "description": "Consider TalkLink when you need a lightweight browser meeting link without guest registration, downloads, calendar setup, or a large collaboration suite.",
        "heading": "A simple alternative for link-based browser calls",
        "intro": "Google Meet is a broad meeting product connected to the Google ecosystem. TalkLink focuses on a narrower workflow: create a private room link and start a browser conversation quickly.",
        "sections": [
            ("When TalkLink is a useful alternative", "Choose TalkLink for a quick one-to-one call, a small group meeting, or an external guest who should not need to sign in. The organizer can generate a link without creating a TalkLink account."),
            ("Where a collaboration suite has advantages", "Google Meet may be preferable when a team depends on Google Calendar scheduling, Workspace administration, managed recordings, live captions, or other integrated collaboration features."),
            ("Compare privacy and access", "For any platform, review who can open the invitation, whether recording is enabled, what account data is required, and how media is protected. TalkLink uses WebRTC encryption in transit and does not record calls."),
            ("Pick the smallest tool that meets the need", "A feature-rich suite is valuable for structured organizational workflows. A lightweight TalkLink room is useful when the priority is to get a small set of participants talking with minimal setup."),
        ],
        "links": [("/call", "Try a private TalkLink call"), ("/meet", "Create a group meeting")],
    },
    "/blog/best-free-video-conferencing-tools": {
        "title": "How to Evaluate Free Video Conferencing Tools | TalkLink",
        "description": "Evaluate free video conferencing options by participant limits, meeting duration, guest access, privacy, browser support, and required features.",
        "heading": "How to evaluate free video conferencing tools",
        "intro": "A free plan is useful only when its limits match the meeting. Compare the complete joining experience and operational constraints instead of choosing by the longest feature list.",
        "sections": [
            ("Check limits first", "Confirm the maximum number of participants, meeting duration, screen-sharing support, mobile behavior, and whether the organizer or every guest needs an account. Limits and plan terms can change, so verify them on each provider's official site."),
            ("Count the cost of guest friction", "An external client may value a simple browser link more than calendar integration. An internal team may prefer managed accounts, recurring meetings, recordings, and centralized administration."),
            ("Review privacy behavior", "Understand whether calls are recorded, how analytics are used, who can join from a link, and how media is encrypted. Organizers should still send private room links only to intended participants."),
            ("Test before committing", "Run a short call on the desktop and mobile devices your group uses. Check audio, camera permissions, screen sharing, weak-network behavior, and how easily a first-time guest can join."),
        ],
        "links": [("/online-video-calls", "Explore TalkLink calls"), ("/blog/best-browser-video-calling-tools", "Choose a browser calling tool")],
    },
    "/blog/changelog-last-3-months": {
        "title": "Обновления TalkLink: март–июнь 2026",
        "description": "Обзор обновлений TalkLink за март–июнь 2026 года: групповые встречи, размытие фона, локализация и улучшения WebRTC.",
        "heading": "Обновления TalkLink: март–июнь 2026",
        "language": "ru",
        "og_locale": "ru_RU",
        "intro": "За этот период TalkLink получил групповые встречи, улучшения качества WebRTC-соединения, видеоэффекты и полноценную локализацию.",
        "sections": [
            ("Июнь 2026", "Добавлены блог и тематические страницы о видеосвязи, обновлены sitemap.xml, robots.txt и метаданные публичных страниц."),
            ("Май 2026", "Появились групповые встречи, обновлённая панель управления, улучшения стабильности WebRTC, размытие фона, русская и английская локализации, а также автоматическое отключение микрофона при смене вкладки."),
            ("Март 2026", "Улучшены глубокие ссылки для iOS и Android и добавлена гибкая настройка базовых адресов комнат."),
        ],
        "links": [("/blog", "Вернуться в блог TalkLink")],
    },
}


BLOG_PATHS = tuple(path for path in PUBLIC_PAGE_CONTENT if path.startswith("/blog/"))


def render_prerendered_content(path: str) -> str:
    """Render meaningful, dependency-free HTML for a known public page."""
    page = PUBLIC_PAGE_CONTENT[path]
    article_tag = "article" if path.startswith("/blog/") else "section"
    parts = [
        '<main id="seo-content">',
        f"  <{article_tag}>",
        f"    <h1>{escape(page['heading'])}</h1>",
        f"    <p>{escape(page['intro'])}</p>",
    ]

    for heading, body in page.get("sections", []):
        parts.extend([
            "    <section>",
            f"      <h2>{escape(heading)}</h2>",
            f"      <p>{escape(body)}</p>",
            "    </section>",
        ])

    links = list(page.get("links", []))
    if path == "/blog":
        links.extend(
            (article_path, PUBLIC_PAGE_CONTENT[article_path]["heading"])
            for article_path in BLOG_PATHS
        )
    if links:
        parts.append('    <nav aria-label="Related TalkLink pages"><ul>')
        for href, label in links:
            parts.append(f'      <li><a href="{escape(href, quote=True)}">{escape(label)}</a></li>')
        parts.append("    </ul></nav>")

    parts.extend([f"  </{article_tag}>", "</main>"])
    return "\n".join(parts)
