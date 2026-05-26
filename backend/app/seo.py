import re
import json
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
    else:
        title = "TalkLink — Video calls via a single link"
        description = "Instant private video calls without registration and apps. Create a link and chat in the browser."

    # Use the actual host for canonical URL
    protocol = "https" # Assume https in production
    canonical_url = f"{protocol}://{host}{path}"

    noindex = False
    if "/room/" in path or "/call/" in path:
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

Disallow: /api
Disallow: /admin
Disallow: /cabinet
Disallow: /profile
Disallow: /temp

Sitemap: {protocol}://{host}/sitemap.xml
"""

def get_sitemap_xml(subdomain: str, host: str) -> str:
    """Generate dynamic sitemap.xml."""
    protocol = "https"
    # In a real app, we might fetch room tokens or categories here.
    # For MVP, we just include the home page.
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>{protocol}://{host}/</loc>
        <lastmod>2024-05-26</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
</urlset>
"""

def generate_json_ld(subdomain: str, path: str, host: str, tenant_name: str) -> str:
    """Generate dynamic JSON-LD schema based on page type."""
    protocol = "https"
    base_url = f"{protocol}://{host}"
    
    schemas = []
    
    # Homepage schemas: WebSite and Organization
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
    
    # Room/Call pages: Product schema
    elif "/room/" in path or "/call/" in path:
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
        html = html.replace('<meta name="robots" content="index, follow" />',
                            '<meta name="robots" content="noindex, nofollow" />')

    return html
