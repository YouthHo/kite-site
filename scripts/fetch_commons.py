#!/usr/bin/env python3
# 从 Wikimedia Commons 搜索演员照片与重庆历史照片（自由许可）
import json, os, time, urllib.request, urllib.parse

API = "https://commons.wikimedia.org/w/api.php"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images")
ACTOR_DIR = os.path.join(OUT, "actors")
HIST_DIR = os.path.join(OUT, "history")
UA = {"User-Agent": "KiteSite/1.0 (fan-site image collector)"}

QUERIES = [
    ("actor_liu_yunlong", "柳云龙", ACTOR_DIR),
    ("actor_luo_haiqiong", "罗海琼", ACTOR_DIR),
    ("actor_li_xiaoran", "李小冉", ACTOR_DIR),
    ("actor_zhang_meng", "张檬", ACTOR_DIR),
    ("actor_ma_chi", "马驰", ACTOR_DIR),
    ("actor_sun_bin", "孙斌", ACTOR_DIR),
    ("actor_lei_han", "雷汉", ACTOR_DIR),
    ("actor_qi_huan", "齐欢", ACTOR_DIR),
    ("hist_mao_renfeng", "毛人凤", HIST_DIR),
    ("hist_jiang_jieshi", "蒋介石", HIST_DIR),
    ("hist_chongqing_old", "Chongqing 1945", HIST_DIR),
    ("hist_yanan", "Yan'an 1938", HIST_DIR),
]

def api(params):
    params = dict(params, format="json")
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(params), headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))

def pick_image(title):
    """在 Commons 里搜索，取第一张合理图片（跳过 logo/地图/国旗等）"""
    d = api({"action": "query", "generator": "search", "gsrsearch": title,
             "gsrnamespace": "6", "gsrlimit": "10",
             "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": "1000"})
    pages = d.get("query", {}).get("pages", {})
    for p in pages.values():
        ii = p.get("imageinfo", [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        if not url:
            continue
        ext = os.path.splitext(p.get("title", ""))[1].lower()
        if ext not in (".jpg", ".jpeg", ".png"):
            continue
        md = ii.get("extmetadata", {})
        desc = (md.get("ImageDescription", {}) or {}).get("value", "").lower()
        if any(k in desc for k in ["logo", "map of", "flag of", "coat of arms"]):
            continue
        return url, p.get("title", "")
    return None, None

for name, query, outdir in QUERIES:
    os.makedirs(outdir, exist_ok=True)
    try:
        url, title = pick_image(query)
        if not url:
            print(f"SKIP {query}")
            continue
        path = os.path.join(outdir, name + os.path.splitext(url.split("?")[0])[1] or ".jpg")
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=40) as r, open(path, "wb") as f:
            f.write(r.read())
        print(f"OK {query} <- {title}")
    except Exception as e:
        print(f"FAIL {query}: {e}")
    time.sleep(1)
