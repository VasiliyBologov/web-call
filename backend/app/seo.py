import re
import json
from html import escape
from typing import Dict, Any


SEO_PAGE_METADATA = {
    "/web-calls": {
        "title": "Browser Web Calls Without Downloads | TalkLink",
        "description": "Start a secure web call in your browser without registration or downloads. Create a private TalkLink room, share the link, and connect in seconds.",
        "language": "en",
        "og_locale": "en_US",
    },
    "/blog/changelog-last-3-months": {
        "title": "Обновления TalkLink: март–июнь 2026",
        "description": "Обзор обновлений TalkLink за март–июнь 2026 года: групповые встречи, размытие фона, локализация и улучшения WebRTC.",
        "language": "ru",
        "og_locale": "ru_RU",
    },
}


SITEMAP_PAGES = [
    {"path": "/", "lastmod": "2026-09-08", "priority": "1.0", "changefreq": "daily"},
    {"path": "/call", "lastmod": "2026-06-09", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/meet", "lastmod": "2026-06-09", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/download", "lastmod": "2026-09-07", "priority": "0.9", "changefreq": "monthly"},
    {"path": "/online-video-calls", "lastmod": "2026-06-09", "priority": "0.9", "changefreq": "monthly"},
    {"path": "/web-calls", "lastmod": "2026-09-08", "priority": "0.9", "changefreq": "monthly"},
    {"path": "/video-meetings", "lastmod": "2026-06-09", "priority": "0.9", "changefreq": "monthly"},
    {"path": "/video-call-link", "lastmod": "2026-06-09", "priority": "0.9", "changefreq": "monthly"},
    {"path": "/blog", "lastmod": "2026-06-09", "priority": "0.8", "changefreq": "weekly"},
    {"path": "/blog/how-to-create-online-video-call-no-registration", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/best-browser-video-calling-tools", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/zoom-vs-browser-based-video-calls", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/how-secure-are-browser-video-meetings", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/how-to-create-meeting-link-in-seconds", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/online-meetings-for-remote-teams", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/video-calls-for-freelancers", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/video-calls-without-downloads", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/google-meet-alternative", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/best-free-video-conferencing-tools", "lastmod": "2026-06-09", "priority": "0.7", "changefreq": "monthly"},
    {"path": "/blog/changelog-last-3-months", "lastmod": "2026-09-08", "priority": "0.7", "changefreq": "monthly"},
]


PRERENDERED_CONTENT = {
    "/": """
<main id="seo-content">
  <h1>Private video calls and web meetings with one link</h1>
  <p>TalkLink creates instant browser-based video rooms without registration or software installation. Create a link, share it with your participants, and join from a desktop or mobile browser.</p>
  <nav aria-label="TalkLink services">
    <a href="/call">Start a video call</a>
    <a href="/meet">Create a group meeting</a>
    <a href="/web-calls">Learn about browser web calls</a>
    <a href="/blog">Read the TalkLink blog</a>
  </nav>
</main>
""",
    "/web-calls": """
<main id="seo-content">
  <article>
    <h1>Browser Web Calls Without Downloads</h1>
    <p>TalkLink lets you start a private video call directly in a modern web browser. There is no account to create and no application to install: create a room, share its unique link, and allow camera and microphone access when you are ready to join.</p>
    <h2>How to start a web call</h2>
    <ol>
      <li>Open TalkLink and choose a video call or group meeting.</li>
      <li>Create a private room link and send it only to the people you want to invite.</li>
      <li>Open the link in a supported browser and grant camera and microphone permission.</li>
    </ol>
    <h2>Why make calls in the browser?</h2>
    <p>Browser-based calls remove installation and sign-up steps, which makes them useful for quick conversations with clients, friends, family, and remote teams. TalkLink uses WebRTC for real-time audio and video and protects media in transit using the encryption built into WebRTC.</p>
    <h2>What you need</h2>
    <p>You need a current browser, a stable internet connection, and permission to use your microphone and camera. Headphones can reduce echo in noisy rooms. Participants can join from desktop or mobile devices.</p>
    <p><a href="/call">Start a private web call</a> or <a href="/meet">create a group meeting</a>.</p>
  </article>
</main>
""",
    "/blog/changelog-last-3-months": """
<main id="seo-content">
  <article>
    <h1>Обновления TalkLink: март–июнь 2026</h1>
    <p>За этот период TalkLink получил групповые встречи, улучшения качества WebRTC-соединения, видеоэффекты и полноценную локализацию. Ниже собраны основные изменения продукта.</p>
    <h2>Июнь 2026</h2>
    <ul>
      <li><strong>9 июня:</strong> добавлены блог и тематические страницы о видеосвязи.</li>
      <li><strong>9 июня:</strong> обновлены sitemap.xml, robots.txt и метаданные публичных страниц.</li>
    </ul>
    <h2>Май 2026</h2>
    <ul>
      <li><strong>26 мая:</strong> появились групповые встречи и обновлённая панель управления.</li>
      <li><strong>20 мая:</strong> улучшена стабильность WebRTC и добавлено размытие фона.</li>
      <li><strong>19 мая:</strong> добавлена поддержка русского и английского языков.</li>
      <li><strong>18 мая:</strong> добавлено автоматическое отключение микрофона при смене вкладки.</li>
    </ul>
    <h2>Март 2026</h2>
    <ul>
      <li><strong>27 марта:</strong> улучшены глубокие ссылки для iOS и Android.</li>
      <li><strong>13 марта:</strong> добавлена гибкая настройка адресов комнат.</li>
    </ul>
    <p><a href="/blog">Вернуться в блог TalkLink</a></p>
  </article>
</main>
""",
}

def get_subdomain(host: str) -> str:
    """Extract subdomain from host."""
    if not host:
        return ""
    # Remove port if present
    host = host.split(":")[0]
    # Simple check for subdomain (e.g. tenant.domain.com)
    # This logic might need adjustment based on the actual domain
    parts = host.split(".")
    if len(parts) > 2:
        return parts[0]
    return ""

def generate_metadata(subdomain: str, path: str, host: str) -> Dict[str, Any]:
    """Generate dynamic metadata based on subdomain and path."""
    tenant_name = subdomain.capitalize() if subdomain else "TalkLink"
    language = "en"
    og_locale = "en_US"
    
    if subdomain:
        title = f"Video Calls in {tenant_name} | Instant & Private"
        description = f"Join {tenant_name}'s private video communication portal. Instant WebRTC calls without registration or apps."
    elif path == "/" or path == "":
        title = "TalkLink - Online Video Calls and Web Meetings in Your Browser"
        description = "Create secure online video calls and web meetings instantly. No downloads, no registration. Share a link and start talking."
    elif path.rstrip("/") == "/download":
        title = "Download TalkLink for iOS and Android"
        description = "Download the TalkLink mobile app from the App Store or Google Play for private video calls and meetings."
    elif path.rstrip("/") in SEO_PAGE_METADATA:
        page_metadata = SEO_PAGE_METADATA[path.rstrip("/")]
        title = page_metadata["title"]
        description = page_metadata["description"]
        language = page_metadata["language"]
        og_locale = page_metadata["og_locale"]
    else:
        title = f"TalkLink - {path.strip('/').replace('-', ' ').capitalize()}"
        description = f"Learn more about {path.strip('/').replace('-', ' ')} with TalkLink. Secure, instant video calls without registration."

    # Normalize host: remove port and www
    clean_host = host.split(":")[0].lower()
    if clean_host.startswith("www."):
        clean_host = clean_host[4:]
    
    # Normalize path: remove trailing slash for consistency (except root)
    clean_path = path
    if len(clean_path) > 1 and clean_path.endswith("/"):
        clean_path = clean_path[:-1]

    # Use the actual host for canonical URL
    protocol = "https" # Assume https in production
    canonical_url = f"{protocol}://{clean_host}{clean_path}"

    # Set noindex for temporary pages (rooms, meetings)
    # We only want to index main landing pages and blog posts
    noindex = False
    static_paths = ["/", "/call", "/meet", "/download", "/online-video-calls", "/web-calls", "/video-meetings", "/video-call-link", "/blog"]
    is_static = clean_path in static_paths or clean_path.startswith("/blog")
    
    if not is_static:
        noindex = True

    return {
        "title": title,
        "description": description,
        "canonical": canonical_url,
        "tenant_name": tenant_name,
        "og_title": title,
        "og_description": description,
        "og_url": canonical_url,
        "language": language,
        "og_locale": og_locale,
        "noindex": noindex
    }

def get_robots_txt(subdomain: str, host: str) -> str:
    """Generate dynamic robots.txt."""
    protocol = "https"
    return f"""User-agent: *
Allow: /
Allow: /download
Disallow: /api/
Disallow: /admin/
Disallow: /cabinet/
Disallow: /profile/
Disallow: /temp/

# Allow AI Bots
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: CCBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: {protocol}://{host}/sitemap.xml
"""

def get_sitemap_xml(subdomain: str, host: str) -> str:
    """Generate dynamic sitemap.xml."""
    protocol = "https"

    url_entries = []
    for page in SITEMAP_PAGES:
        url_entries.append(f"""    <url>
        <loc>{protocol}://{host}{page['path']}</loc>
        <lastmod>{page['lastmod']}</lastmod>
        <changefreq>{page['changefreq']}</changefreq>
        <priority>{page['priority']}</priority>
    </url>""")
    
    urls_xml = "\n".join(url_entries)
    
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{urls_xml}
</urlset>
"""

def generate_json_ld(subdomain: str, path: str, host: str, tenant_name: str) -> str:
    """Generate dynamic JSON-LD schema based on page type."""
    protocol = "https"
    base_url = f"{protocol}://{host}"
    
    schemas = []
    
    # Homepage schemas: WebSite, Organization, SoftwareApplication
    if not subdomain and (path == "/" or path == ""):
        schemas.append({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "TalkLink",
            "url": f"{base_url}/",
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{base_url}/?q={{search_term_string}}",
                "query-input": "required name=search_term_string"
            }
        })
        schemas.append({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "TalkLink",
            "url": f"{base_url}/",
            "logo": f"{base_url}/logo.png"
        })
        schemas.append({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "TalkLink",
            "url": f"{base_url}/",
            "applicationCategory": "CommunicationApplication",
            "operatingSystem": "Web, iOS, Android, macOS, Windows",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            }
        })
        schemas.append({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "How do I start an online video call?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Click the 'Create Link' button on the homepage to instantly generate a unique room URL. Share this URL with participants to start your video call."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Can I make a video call without registration?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes, TalkLink allows you to start video calls instantly without any registration, email, or account creation."
                    }
                },
                {
                    "@type": "Question",
                    "name": "Do participants need to install software?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "No, TalkLink works entirely in the web browser using WebRTC technology. No downloads or installations are required."
                    }
                }
            ]
        })
    
    # Blog posts use Article semantics instead of describing every URL as an app.
    elif path.startswith("/blog/"):
        page_metadata = SEO_PAGE_METADATA.get(path, {})
        schemas.append({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": page_metadata.get("title", path.rsplit("/", 1)[-1].replace("-", " ").title()),
            "description": page_metadata.get("description", "TalkLink product news and guides."),
            "url": f"{base_url}{path}",
            "mainEntityOfPage": f"{base_url}{path}",
            "author": {"@type": "Organization", "name": "TalkLink"},
            "publisher": {"@type": "Organization", "name": "TalkLink"},
            "datePublished": "2026-06-09",
            "dateModified": "2026-09-08" if path == "/blog/changelog-last-3-months" else "2026-06-09",
        })

    # Room/Call pages: Product schema
    elif any(p in path for p in ["/room/", "/call/", "/meet", "/r/", "/m/"]):
        schemas.append({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": f"Приватный видеозвонок {tenant_name}",
            "image": f"{base_url}/og-image.png",
            "description": f"Присоединяйтесь к видеозвонку в {tenant_name}. Безопасно, без регистрации.",
            "offers": {
                "@type": "Offer",
                "url": f"{base_url}{path}",
                "price": "0",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
            }
        })
    
    # Default WebApplication schema
    else:
        schemas.append({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": tenant_name,
            "url": f"{base_url}{path}",
            "applicationCategory": "CommunicationApplication",
            "operatingSystem": "Web, iOS, Android, macOS, Windows"
        })
    
    # Return as formatted script tags
    return "\n    ".join([f'<script type="application/ld+json">{json.dumps(s, ensure_ascii=False)}</script>' for s in schemas])

def inject_metadata(html: str, metadata: Dict[str, Any], path: str = "/", host: str = "") -> str:
    """Inject metadata into index.html."""
    safe_title = escape(metadata["title"], quote=True)
    safe_description = escape(metadata["description"], quote=True)
    safe_canonical = escape(metadata["canonical"], quote=True)
    safe_language = escape(metadata.get("language", "en"), quote=True)
    safe_og_locale = escape(metadata.get("og_locale", "en_US"), quote=True)

    html = re.sub(r'<html\s+lang=".*?">', f'<html lang="{safe_language}">', html, count=1)

    # Replace Title
    html = re.sub(r'<title>.*?</title>', f'<title>{safe_title}</title>', html)
    
    # Replace Description
    html = re.sub(r'<meta name="description" content=".*?" />', 
                  f'<meta name="description" content="{safe_description}" />', html)
    
    # Twitter tags
    html = re.sub(r'<meta name="twitter:title" content=".*?" />',
                  f'<meta name="twitter:title" content="{metadata["og_title"]}" />', html)
    html = re.sub(r'<meta name="twitter:description" content=".*?" />',
                  f'<meta name="twitter:description" content="{metadata["og_description"]}" />', html)
    html = re.sub(r'<meta name="twitter:url" content=".*?" />',
                  f'<meta name="twitter:url" content="{metadata["og_url"]}" />', html)
    
    # Replace Canonical
    html = re.sub(r'<link rel="canonical" href=".*?" />', 
                  f'<link rel="canonical" href="{safe_canonical}" />', html)
    
    # Replace OG tags
    html = re.sub(r'<meta property="og:title" content=".*?" />', 
                  f'<meta property="og:title" content="{metadata["og_title"]}" />', html)
    html = re.sub(r'<meta property="og:description" content=".*?" />', 
                  f'<meta property="og:description" content="{metadata["og_description"]}" />', html)
    html = re.sub(r'<meta property="og:url" content=".*?" />', 
                  f'<meta property="og:url" content="{metadata["og_url"]}" />', html)
    html = re.sub(r'<meta property="og:locale" content=".*?" />',
                  f'<meta property="og:locale" content="{safe_og_locale}" />', html)
    
    # Inject dynamic JSON-LD
    json_ld_scripts = generate_json_ld(get_subdomain(host), path, host, metadata["tenant_name"])
    # Find existing JSON-LD script and replace it, or inject before </head>
    if '<script type="application/ld+json">' in html:
        # Replace the entire block from first <script type="application/ld+json"> to last </script>
        # Note: This is a simplified replacement for the MVP
        html = re.sub(r'<script type="application/ld\+json">.*?</script>', 
                      json_ld_scripts, html, flags=re.DOTALL)
    else:
        html = html.replace('</head>', f'    {json_ld_scripts}\n</head>')
    
    if metadata.get("noindex"):
        # Если принудительно установлен noindex в метаданных
        if '<meta name="robots"' in html:
            html = re.sub(r'<meta name="robots" content=".*?" />',
                          '<meta name="robots" content="noindex, nofollow" />', html)
        else:
            html = html.replace('</head>', '    <meta name="robots" content="noindex, nofollow" />\n</head>')
    elif '<meta name="robots"' not in html:
        # Если robots нет, добавляем дефолтный
        html = html.replace('</head>', '    <meta name="robots" content="index, follow" />\n</head>')

    # Give crawlers meaningful HTML in the first response. React replaces this
    # snapshot on load, so users still receive the interactive application.
    prerendered_content = PRERENDERED_CONTENT.get(path.rstrip("/") or "/")
    if prerendered_content:
        html = re.sub(
            r'<div\s+id=["\']root["\']\s*>\s*</div>',
            f'<div id="root">{prerendered_content.strip()}</div>',
            html,
            count=1,
        )

    return html
