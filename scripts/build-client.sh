#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="client-dist"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp index.html app.js styles.css site.webmanifest sw.js api-config.js vercel.json "$OUTPUT_DIR/"
cp -R accueil images "$OUTPUT_DIR/"
printf 'TonMenu Client build ready in %s\n' "$OUTPUT_DIR"
