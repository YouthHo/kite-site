#!/usr/bin/env python3
# 定向重试：蒋介石本人照片（zh.wikipedia pageimages）+ 重庆大轰炸老照片（commons）
import json, os, time, urllib.request, urllib.parse

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", "history")
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "KiteSite/1.0 (fan-site image collector)"}

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

def zh_wiki_pageimage(title):
    api = "https://zh.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "pageimages",
        "piprop": "thumbnail|name", "pithumbsize": "900", "titles": title})
    d = json.loads(get(api).decode("utf-8"))
    for p in d.get("query", {}).get("pages", {}).values():
        t = p.get("thumbnail", {}).get("source")
        if t:
            return t
    return None

def commons_search(query, skip=()):
    api = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrsearch": query,
        "gsrnamespace": "6", "gsrlimit": "12", "prop": "imageinfo", "iiprop": "url", "iiurlwidth": "1200"})
    d = json.loads(get(api).decode("utf-8"))
    for p in d.get("query", {}).get("pages", {}).values():
        ii = p.get("imageinfo", [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        name = p.get("title", "")
        if not url or any(s in name for s in skip):
            continue
        if os.path.splitext(name)[1].lower() not in (".jpg", ".jpeg", ".png"):
            continue
        return url, name
    return None, None

# 1) 蒋介石：zh wiki 页面主图
try:
    u = zh_wiki_pageimage("蔣介石")
    if u:
        data = get(u)
        with open(os.path.join(OUT, "hist_jiang_jieshi.jpg"), "wb") as f:
            f.write(data)
        print("OK 蒋介石(zh-wiki) -> hist_jiang_jieshi.jpg", len(data))
    else:
        print("SKIP 蒋介石 zh-wiki 无主图")
except Exception as e:
    print("FAIL 蒋介石:", e)
time.sleep(1)

# 2) 重庆大轰炸/老重庆（commons）
for q, name in [
    ("Chongqing bombing", "hist_chongqing_bombing.jpg"),
    ("Chongqing 1940", "hist_chongqing_old.jpg"),
]:
    try:
        u, t = commons_search(q)
        if u:
            data = get(u)
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(data)
            print(f"OK {q} <- {t} -> {name}", len(data))
            break
    except Exception as e:
        print(f"FAIL {q}: {e}")
    time.sleep(1)
