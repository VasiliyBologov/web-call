import re
import json
from html import escape
from typing import Dict, Any

from .seo_content import PUBLIC_PAGE_CONTENT, render_prerendered_content

# Keep indexability, metadata, sitemap membership and server-rendered content
# driven by the same registry.  Previously these were separate allowlists, so a
# newly added public page could appear in one sitemap while receiving noindex
# from another part of the backend.
SEO_PAGE_METADATA = {
    path: {
        "title": page["title"],
        "description": page["description"],
        "language": page.get("language", "en"),
        "og_locale": page.get("og_locale", "en_US"),
    }
    for path, page in PUBLIC_PAGE_CONTENT.items()
}

_CONTENT_UPDATED = "2026-09-28"
_PRIMARY_PATHS = {"/", "/call", "/meet", "/download", "/business"}
_SECONDARY_PATHS = {"/privacy", "/blog"}
SITEMAP_PAGES = [
    {
        "path": path,
        "lastmod": _CONTENT_UPDATED,
        "priority": "1.0" if path == "/" else "0.9" if path in _PRIMARY_PATHS else "0.8" if path in _SECONDARY_PATHS else "0.7",
        "changefreq": "weekly",
    }
    for path in PUBLIC_PAGE_CONTENT
]
INDEXABLE_PATHS = frozenset(page["path"] for page in SITEMAP_PAGES)
PRERENDERED_CONTENT = {
    path: render_prerendered_content(path)
    for path in INDEXABLE_PATHS
}


def normalize_path(path: str) -> str:
    """Return the canonical path form used by metadata and routing."""
    normalized = path if path.startswith("/") else f"/{path}"
    if len(normalized) > 1:
        normalized = normalized.rstrip("/")
    return normalized or "/"


def is_supported_frontend_path(path: str) -> bool:
    """Identify real SPA routes so unknown paths can return an actual 404."""
    normalized = normalize_path(path)
    if normalized in INDEXABLE_PATHS or normalized == "/admin":
        return True
    return re.fullmatch(r"/(?:r|m)/[^/]+", normalized) is not None


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
    
    clean_path = normalize_path(path)

    if subdomain:
        title = f"Video Calls in {tenant_name} | Instant & Private"
        description = f"Join {tenant_name}'s private video communication portal. Instant WebRTC calls without registration or apps."
    elif clean_path in SEO_PAGE_METADATA:
        page_metadata = SEO_PAGE_METADATA[clean_path]
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
    
    # Use the actual host for canonical URL
    protocol = "https" # Assume https in production
    canonical_url = f"{protocol}://{clean_host}{clean_path}"

    # Only exact URLs in the public registry are indexable.  Private rooms,
    # admin pages and unknown blog slugs stay out of search results.
    noindex = clean_path not in INDEXABLE_PATHS

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
    clean_host = host.split(":")[0].lower()
    if clean_host.startswith("www."):
        clean_host = clean_host[4:]
    return f"""User-agent: *
Allow: /
Allow: /download
Allow: /business
Allow: /privacy
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

Sitemap: {protocol}://{clean_host}/sitemap.xml
"""

def get_sitemap_xml(subdomain: str, host: str) -> str:
    """Generate dynamic sitemap.xml."""
    protocol = "https"

    clean_host = host.split(":")[0].lower()
    if clean_host.startswith("www."):
        clean_host = clean_host[4:]

    url_entries = []
    for page in SITEMAP_PAGES:
        url_entries.append(f"""    <url>
        <loc>{protocol}://{clean_host}{page['path']}</loc>
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
            "name": "TASKMASTER, SRL",
            "legalName": "TASKMASTER, SRL",
            "alternateName": "TalkLink",
            "url": f"{base_url}/",
            "logo": f"{base_url}/logo.png",
            "email": "vasiliybologov@gmail.com",
            "sameAs": [
                "https://github.com/VasiliyBologov/web-call",
                "https://play.google.com/store/apps/details?id=talk.link.space",
                "https://apps.apple.com/app/talklinkspace/id6805110249",
            ],
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
            },
            "provider": {"@type": "Organization", "name": "TASKMASTER, SRL"},
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
            "author": {"@type": "Organization", "name": "TASKMASTER, SRL"},
            "publisher": {"@type": "Organization", "name": "TASKMASTER, SRL"},
            "datePublished": "2026-06-09",
            "dateModified": _CONTENT_UPDATED,
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
