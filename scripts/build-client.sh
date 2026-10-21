#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="client-dist"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp index.html app.js styles.css site.webmanifest sw.js api-config.js vercel.json "$OUTPUT_DIR/"
cp -R accueil images shared "$OUTPUT_DIR/"
mkdir -p "$OUTPUT_DIR/pro"
cp pro/courier.html pro/courier.css pro/courier.js "$OUTPUT_DIR/pro/"
printf 'TonMenu Client build ready in %s\n' "$OUTPUT_DIR"
