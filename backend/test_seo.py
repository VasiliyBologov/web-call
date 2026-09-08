from xml.etree import ElementTree

from app import seo


def test_download_page_is_indexable():
    metadata = seo.generate_metadata("", "/download", "talklink.space")

    assert metadata["noindex"] is False
    assert metadata["canonical"] == "https://talklink.space/download"
    assert metadata["title"] == "Download TalkLink for iOS and Android"


def test_download_page_in_dynamic_sitemap():
    sitemap = seo.get_sitemap_xml("", "talklink.space")
    root = ElementTree.fromstring(sitemap)
    namespace = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    locations = [node.text for node in root.findall("sitemap:url/sitemap:loc", namespace)]

    assert "https://talklink.space/download" in locations


def test_download_page_explicitly_allowed_in_robots():
    robots = seo.get_robots_txt("", "talklink.space")

    assert "Allow: /download" in robots


def test_download_html_has_index_directive():
    html = '<html><head><title>Old</title><meta name="description" content="Old" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://talklink.space/" /></head><body></body></html>'
    metadata = seo.generate_metadata("", "/download", "talklink.space")

    rendered = seo.inject_metadata(html, metadata, "/download", "talklink.space")

    assert '<meta name="robots" content="index, follow" />' in rendered
    assert "noindex" not in rendered


def test_reported_pages_have_specific_metadata():
    web_calls = seo.generate_metadata("", "/web-calls", "talklink.space")
    changelog = seo.generate_metadata("", "/blog/changelog-last-3-months", "talklink.space")

    assert web_calls["title"] == "Browser Web Calls Without Downloads | TalkLink"
    assert web_calls["canonical"] == "https://talklink.space/web-calls"
    assert "without registration or downloads" in web_calls["description"]
    assert changelog["title"] == "Обновления TalkLink: март–июнь 2026"
    assert changelog["canonical"] == "https://talklink.space/blog/changelog-last-3-months"
    assert changelog["language"] == "ru"
    assert changelog["og_locale"] == "ru_RU"


def test_reported_pages_are_prerendered_for_crawlers():
    html = '<html><head><title>Old</title><meta name="description" content="Old" /><meta name="robots" content="index, follow" /><link rel="canonical" href="https://talklink.space/" /></head><body><div id="root"></div></body></html>'

    for path in ["/web-calls", "/blog/changelog-last-3-months"]:
        metadata = seo.generate_metadata("", path, "talklink.space")
        rendered = seo.inject_metadata(html, metadata, path, "talklink.space")

        assert '<div id="root"><main id="seo-content">' in rendered
        assert "<h1>" in rendered
        assert "<p>" in rendered
        assert '<meta name="robots" content="index, follow" />' in rendered
        assert "Long SEO content" not in rendered


def test_sitemap_uses_content_update_dates_instead_of_request_date():
    sitemap = seo.get_sitemap_xml("", "talklink.space")
    root = ElementTree.fromstring(sitemap)
    namespace = {"sitemap": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    entries = {
        node.find("sitemap:loc", namespace).text: node.find("sitemap:lastmod", namespace).text
        for node in root.findall("sitemap:url", namespace)
    }

    assert entries["https://talklink.space/web-calls"] == "2026-09-08"
    assert entries["https://talklink.space/blog/changelog-last-3-months"] == "2026-09-08"
    assert entries["https://talklink.space/blog/google-meet-alternative"] == "2026-06-09"


def test_hreflang_is_not_advertised_without_language_specific_urls():
    html = '<html><head><title>Old</title><meta name="description" content="Old" /><link rel="canonical" href="https://talklink.space/" /></head><body><div id="root"></div></body></html>'
    metadata = seo.generate_metadata("", "/web-calls", "talklink.space")

    rendered = seo.inject_metadata(html, metadata, "/web-calls", "talklink.space")

    assert 'rel="alternate" hreflang=' not in rendered


def test_russian_changelog_sets_document_language_and_social_locale():
    html = '<html lang="en"><head><title>Old</title><meta name="description" content="Old" /><meta property="og:locale" content="en_US" /><link rel="canonical" href="https://talklink.space/" /></head><body><div id="root"></div></body></html>'
    metadata = seo.generate_metadata("", "/blog/changelog-last-3-months", "talklink.space")

    rendered = seo.inject_metadata(html, metadata, "/blog/changelog-last-3-months", "talklink.space")

    assert '<html lang="ru">' in rendered
    assert '<meta property="og:locale" content="ru_RU" />' in rendered
