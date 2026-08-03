"""Dev server for Span. No-store so module edits always show up."""
import http.server, functools, os

ROOT = os.path.dirname(os.path.abspath(__file__))

class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

http.server.ThreadingHTTPServer(
    ('127.0.0.1', 8802), functools.partial(H, directory=ROOT)
).serve_forever()
