#!/usr/bin/env python3
# 从维基百科/Wikimedia 抓取可合法使用的演员与历史人物照片（公共领域/自由许可）
# 用法: python scripts/fetch_images.py
import json, os, sys, urllib.request, urllib.parse, time

API = "https://zh.wikipedia.org/w/api.php"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images")
ACTOR_DIR = os.path.join(OUT, "actors")
HIST_DIR = os.path.join(OUT, "history")

TITLES = [
    "柳云龙", "罗海琼", "李小冉", "张檬", "马驰", "孙斌", "雷汉",
    "刘立伟", "王鑫", "齐欢", "曹克难", "殷飞", "石安妮", "马晓伟",
    "戴笠", "毛人凤", "蒋介石", "周恩来", "徐恩曾", "重庆",
]

UA = {"User-Agent": "KiteSite/1.0 (fan-site image collector; contact: none)"}

def api(params):
    params = dict(params, format="json")
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))

def fetch():
    os.makedirs(ACTOR_DIR, exist_ok=True)
    os.makedirs(HIST_DIR, exist_ok=True)
    for i in range(0, len(TITLES), 20):
        batch = TITLES[i:i+20]
        d = api({"action": "query", "prop": "pageimages", "piprop": "thumbnail|name",
                 "pithumbsize": "800", "titles": "|".join(batch)})
        pages = d.get("query", {}).get("pages", {})
        for pid, p in pages.items():
            title = p.get("title", "")
            thumb = p.get("thumbnail", {}).get("source")
            if not thumb:
                print(f"SKIP {title}: 无图片")
                continue
            safe = title.replace(" ", "_")
            if title in ("戴笠", "毛人凤", "蒋介石", "周恩来", "徐恩曾", "重庆"):
                outdir, prefix = HIST_DIR, "hist"
            else:
                outdir, prefix = ACTOR_DIR, "actor"
            path = os.path.join(outdir, f"{prefix}_{safe}.jpg")
            try:
                req = urllib.request.Request(thumb, headers=UA)
                with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
                    f.write(r.read())
                print(f"OK {title} -> {os.path.relpath(path, OUT)}")
            except Exception as e:
                print(f"FAIL {title}: {e}")
        time.sleep(0.5)

if __name__ == "__main__":
    fetch()
