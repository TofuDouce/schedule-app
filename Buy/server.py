#!/usr/bin/env python3
"""趴趴灶團購清單 — 本機伺服器（提供網頁 + 商品資料代理）"""
from __future__ import annotations

import json
import ssl
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PORT = 8765
ALLOWED_HOSTS = {"www.papazao.tw", "papazao.tw"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("/proxy", "/api/product"):
            return self.proxy(parsed)
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def proxy(self, parsed):
        qs = parse_qs(parsed.query)
        target = (qs.get("url") or [None])[0]
        handle = (qs.get("handle") or [None])[0]
        if handle:
            handle = handle.strip("/").split("/")[-1]
            target = f"https://www.papazao.tw/products/{handle}.json"
        if not target:
            return self.json_err(400, "缺少 url 或 handle")
        host = urlparse(target).hostname or ""
        if host not in ALLOWED_HOSTS:
            return self.json_err(403, "只允許抓取 papazao.tw")
        if not target.endswith(".json"):
            if "/products/" in target:
                target = target.split("?")[0].rstrip("/") + ".json"
            else:
                return self.json_err(400, "請提供商品頁網址")
        try:
            req = Request(
                target,
                headers={
                    "User-Agent": "PapazaoGroupBuy/1.0 (local helper)",
                    "Accept": "application/json",
                },
            )
            ctx = ssl.create_default_context()
            with urlopen(req, timeout=20, context=ctx) as resp:
                body = resp.read()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(body)
        except HTTPError as e:
            self.json_err(e.code, f"官網回傳 {e.code}")
        except URLError as e:
            self.json_err(502, f"無法連線官網：{e.reason}")
        except Exception as e:
            self.json_err(500, str(e))

    def json_err(self, code, msg):
        payload = json.dumps({"error": msg}, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"團購清單已啟動 → http://127.0.0.1:{PORT}")
    print("按 Ctrl+C 結束")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已關閉")
        server.server_close()
