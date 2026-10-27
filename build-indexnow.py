from __future__ import annotations

import json
import os
from pathlib import Path
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

BASE_URL = "https://huntsmartcanada.ca"
HOST = "huntsmartcanada.ca"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"
INDEXNOW_KEY = "4b8e6f1d92c740fca361b5e897d2a48c"
KEY_FILENAME = f"{INDEXNOW_KEY}.txt"
SITE_DIR = Path("site")
SITEMAP = SITE_DIR / "sitemap.xml"


def publish_key() -> Path:
    """Publish the IndexNow ownership key at the site root."""
    SITE_DIR.mkdir(parents=True, exist_ok=True)
    key_path = SITE_DIR / KEY_FILENAME
    key_path.write_text(INDEXNOW_KEY + "\n", encoding="utf-8")
    return key_path


def sitemap_urls() -> list[str]:
    if not SITEMAP.exists():
        print("IndexNow: sitemap.xml is missing; key published but no URLs submitted.")
        return []

    root = ET.parse(SITEMAP).getroot()
    urls: list[str] = []
    for node in root.findall("{*}url/{*}loc"):
        url = (node.text or "").strip()
        if url.startswith(BASE_URL + "/") or url == BASE_URL:
            urls.append(url)

    # Preserve sitemap order while removing duplicates.
    return list(dict.fromkeys(urls))


def should_submit() -> bool:
    return os.environ.get("CONTEXT") == "production" and os.environ.get("BRANCH") == "main"


def submit(urls: list[str]) -> None:
    if not urls:
        print("IndexNow: no canonical HuntSmart URLs found in sitemap; nothing submitted.")
        return

    payload = {
        "host": HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": f"{BASE_URL}/{KEY_FILENAME}",
        "urlList": urls[:10000],
    }
    data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        INDEXNOW_ENDPOINT,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "HuntSmartCanada-IndexNow/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status = response.getcode()
            if status in (200, 202):
                print(f"IndexNow: accepted {len(payload['urlList'])} URLs (HTTP {status}).")
            else:
                print(f"IndexNow: unexpected HTTP {status}; deploy will continue.")
    except urllib.error.HTTPError as exc:
        print(f"IndexNow: HTTP {exc.code}; deploy will continue and retry on the next production build.")
    except Exception as exc:  # External indexing must never break the product deploy.
        print(f"IndexNow: submission unavailable ({exc}); deploy will continue.")


def main() -> None:
    key_path = publish_key()
    print(f"IndexNow: verification key staged at /{key_path.name}.")

    if not should_submit():
        print("IndexNow: non-production build; search-engine notification skipped.")
        return

    submit(sitemap_urls())


if __name__ == "__main__":
    main()
