#!/usr/bin/env python3
"""Prepare TonMenu static assets for the GitHub Pages project-site prefix."""
from pathlib import Path
import re
import sys

root = Path(sys.argv[1] if len(sys.argv) > 1 else "pages-dist")
base = "/leplats-"
paths = (
    "accueil|explorer|restaurants|restaurant|promotions|panier|paiement|commandes|"
    "compte|pro|admin|shared|images|media|api-config\\.js|site\\.webmanifest|sw\\.js|favicon\\.ico"
)
quoted_root_path = re.compile(r"([\"'`])/(?!/)(?=(?:" + paths + r")(?:/|[?\"'`#]))")
root_attribute = re.compile(r"(\b(?:href|src|action|start_url|scope)\s*=\s*[\"'])/(?!/)([\"'])", re.I)
root_json_value = re.compile(r"([\"'](?:scope|start_url)[\"']\s*:\s*[\"'])/([\"'])", re.I)

for path in root.rglob("*"):
    if not path.is_file() or path.suffix.lower() not in {".html", ".js", ".css", ".json", ".webmanifest"}:
        continue
    text = path.read_text(encoding="utf-8")
    text = quoted_root_path.sub(lambda m: m.group(1) + base + "/", text)
    text = root_attribute.sub(lambda m: m.group(1) + base + "/" + m.group(2), text)
    text = root_json_value.sub(lambda m: m.group(1) + base + "/" + m.group(2), text)
    path.write_text(text, encoding="utf-8")

# Set the Client SPA router base before deferred app scripts run.
for config in (root / "api-config.js", root / "pro" / "api-config.js"):
    text = config.read_text(encoding="utf-8")
    if "TONMENU_BASE_PATH" not in text:
        config.write_text('window.TONMENU_BASE_PATH = "/leplats-";\n' + text, encoding="utf-8")

# The fallback page is copied before URL rewriting; keep it in sync with the rewritten SPA entry.
(root / "404.html").write_text((root / "accueil" / "index.html").read_text(encoding="utf-8"), encoding="utf-8")
