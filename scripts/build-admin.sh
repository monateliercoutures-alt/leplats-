#!/usr/bin/env bash
set -euo pipefail
OUTPUT_DIR="admin-dist"
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"
cp admin/index.html "$OUTPUT_DIR/index.html"
cp admin/app.css admin/app.js "$OUTPUT_DIR/"
cp -R shared "$OUTPUT_DIR/"
printf 'TonMenu Admin build ready in %s\n' "$OUTPUT_DIR"
