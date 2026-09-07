import re
import json
from datetime import datetime
from typing import Dict, Any

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
    
    if subdomain:
        title = f"Video Calls in {tenant_name} | Instant & Private"
        description = f"Join {tenant_name}'s private video communication portal. Instant WebRTC calls without registration or apps."
    elif path == "/" or path == "":
        title = "TalkLink - Online Video Calls and Web Meetings in Your Browser"
        description = "Create secure online video calls and web meetings instantly. No downloads, no registration. Share a link and start talking."
    elif path.rstrip("/") == "/download":
        title = "Download TalkLink for iOS and Android"
        description = "Download the TalkLink mobile app from the App Store or Google Play for private video calls and meetings."
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
    now = datetime.utcnow().strftime("%Y-%m-%d")
    
    # Static pages that should be indexed
    pages = [
        {"path": "/", "priority": "1.0", "changefreq": "daily"},
        {"path": "/call", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/meet", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/download", "priority": "0.9", "changefreq": "monthly"},
        {"path": "/online-video-calls", "priority": "0.9", "changefreq": "monthly"},
        {"path": "/web-calls", "priority": "0.9", "changefreq": "monthly"},
        {"path": "/video-meetings", "priority": "0.9", "changefreq": "monthly"},
        {"path": "/video-call-link", "priority": "0.9", "changefreq": "monthly"},
        {"path": "/blog", "priority": "0.8", "changefreq": "weekly"},
        {"path": "/blog/how-to-create-online-video-call-no-registration", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/best-browser-video-calling-tools", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/zoom-vs-browser-based-video-calls", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/how-secure-are-browser-video-meetings", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/how-to-create-meeting-link-in-seconds", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/online-meetings-for-remote-teams", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/video-calls-for-freelancers", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/video-calls-without-downloads", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/google-meet-alternative", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/best-free-video-conferencing-tools", "priority": "0.7", "changefreq": "monthly"},
        {"path": "/blog/changelog-last-3-months", "priority": "0.7", "changefreq": "monthly"},
    ]
    
    url_entries = []
    for page in pages:
        url_entries.append(f"""    <url>
        <loc>{protocol}://{host}{page['path']}</loc>
        <lastmod>{now}</lastmod>
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
    # Replace Title
    html = re.sub(r'<title>.*?</title>', f'<title>{metadata["title"]}</title>', html)
    
    # Replace Description
    html = re.sub(r'<meta name="description" content=".*?" />', 
                  f'<meta name="description" content="{metadata["description"]}" />', html)
    
    # Twitter tags
    html = re.sub(r'<meta name="twitter:title" content=".*?" />',
                  f'<meta name="twitter:title" content="{metadata["og_title"]}" />', html)
    html = re.sub(r'<meta name="twitter:description" content=".*?" />',
                  f'<meta name="twitter:description" content="{metadata["og_description"]}" />', html)
    html = re.sub(r'<meta name="twitter:url" content=".*?" />',
                  f'<meta name="twitter:url" content="{metadata["og_url"]}" />', html)
    
    # Hreflang tags
    hreflangs = f"""
    <link rel="alternate" hreflang="en" href="{metadata["canonical"]}" />
    <link rel="alternate" hreflang="ru" href="{metadata["canonical"]}" />
    <link rel="alternate" hreflang="ro" href="{metadata["canonical"]}" />
    <link rel="alternate" hreflang="x-default" href="{metadata["canonical"]}" />
    """
    html = html.replace('</head>', f'{hreflangs}\n</head>')
    
    # Replace Canonical
    html = re.sub(r'<link rel="canonical" href=".*?" />', 
                  f'<link rel="canonical" href="{metadata["canonical"]}" />', html)
    
    # Replace OG tags
    html = re.sub(r'<meta property="og:title" content=".*?" />', 
                  f'<meta property="og:title" content="{metadata["og_title"]}" />', html)
    html = re.sub(r'<meta property="og:description" content=".*?" />', 
                  f'<meta property="og:description" content="{metadata["og_description"]}" />', html)
    html = re.sub(r'<meta property="og:url" content=".*?" />', 
                  f'<meta property="og:url" content="{metadata["og_url"]}" />', html)
    
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

    return html
