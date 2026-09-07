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
