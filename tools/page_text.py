import re, sys, urllib.request, html as H
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36"}
url, kws = sys.argv[1], [k.lower() for k in sys.argv[2:]]
try:
    raw = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25).read(1500000).decode("utf-8", "ignore")
except Exception as e:
    print("ERR", e); sys.exit()
t = re.search(r"<title>(.*?)</title>", raw, re.S)
print("TITLE:", H.unescape(t.group(1).strip()) if t else "")
raw = re.sub(r"(?s)<(script|style|noscript|svg)[^>]*>.*?</\1>", " ", raw)
txt = H.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", raw)))
if not kws:
    print(txt[:3000]); sys.exit()
seen = set()
for k in kws:
    for m in re.finditer(re.escape(k), txt.lower()):
        s = max(0, m.start() - 160); key = s // 200
        if key in seen: continue
        seen.add(key); print(f"[{k}] …{txt[s:m.end()+200]}…")
        if len([x for x in seen]) > 25: break
