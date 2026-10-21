#!/usr/bin/env python3
"""Small static SPA preview server with Vercel-style TonMenu route rewrites."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit
import argparse
import os

APP_ROUTES = (
    "/accueil", "/explorer", "/restaurants", "/restaurant", "/promotions",
    "/panier", "/paiement", "/commandes", "/compte",
)

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        pathname = urlsplit(path).path.rstrip("/") or "/"
        disk_path = super().translate_path(pathname)
        if pathname == "/accueil":
            return super().translate_path("/accueil/index.html")
        if os.path.isfile(disk_path):
            return disk_path
        if pathname.startswith("/accueil/") or any(pathname == route or pathname.startswith(route + "/") for route in APP_ROUTES[1:]):
            return super().translate_path("/accueil/index.html")
        return disk_path

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=4175)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    print(f"TonMenu Client preview on 0.0.0.0:{args.port}", flush=True)
    server.serve_forever()
