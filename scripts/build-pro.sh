#!/usr/bin/env bash
set -euo pipefail
OUTPUT_DIR="pro-dist"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp pro/index.html pro/app.css pro/app.js pro/api-config.js pro/site.webmanifest pro/sw.js "$OUTPUT_DIR/"
cp pro/courier.html pro/courier.css pro/courier.js "$OUTPUT_DIR/"
cp -R pro/media shared "$OUTPUT_DIR/"
printf 'TonMenu Pro + Courier build ready in %s\n' "$OUTPUT_DIR"
