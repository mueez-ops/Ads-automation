import re, sys, urllib.request, ssl, json
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
PATHS = ["", "/pages/contact", "/pages/contact-us", "/contact", "/contact-us", "/policies/privacy-policy", "/pages/faq", "/pages/about", "/pages/our-story"]
EMAIL = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
IG = re.compile(r"instagram\.com/([A-Za-z0-9_.]+)")
TT = re.compile(r"tiktok\.com/@([A-Za-z0-9_.]+)")
def get(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.geturl(), r.read(800000).decode("utf-8", "ignore")
    except Exception as e:
        return None, ""
out = {}
for dom in sys.argv[1:]:
    res = {"emails": set(), "ig": set(), "tt": set(), "ok": []}
    for p in PATHS:
        final, html = get(f"https://{dom}{p}")
        if not html: continue
        res["ok"].append(p or "/")
        for e in EMAIL.findall(html):
            if not re.search(r"\.(png|jpg|jpeg|gif|webp|svg|js|css)$", e, re.I) and "sentry" not in e and "example" not in e and "wixpress" not in e:
                res["emails"].add(e.lower())
        res["ig"].update(h for h in IG.findall(html) if h not in ("p", "reel", "explore"))
        res["tt"].update(TT.findall(html))
    out[dom] = {k: sorted(v) if isinstance(v, set) else v for k, v in res.items()}
print(json.dumps(out, indent=1))
