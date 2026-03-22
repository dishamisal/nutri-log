#!/usr/bin/env python3
import http.server
import json
import requests
import os

PORT = 8000

# Load .env manually
def load_env():
    try:
        with open(".env") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()
    except FileNotFoundError:
        pass

load_env()
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/groq":
            length = int(self.headers["Content-Length"])
            body   = json.loads(self.rfile.read(length))

            try:
                response = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type":  "application/json"
                    },
                    json=body
                )

                self.send_response(response.status_code)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(response.content)

            except Exception as e:
                print("Exception:", e)
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"  {args[0]} {args[1]}")



print(f"NutriLog running at http://localhost:{PORT}")
try:
    http.server.HTTPServer(("", PORT), Handler).serve_forever()
except Exception as e:
    print("Server error:", e)
    input("Press Enter to exit...")