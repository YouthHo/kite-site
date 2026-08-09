#!/usr/bin/env python3
# 演员照片补抓：Commons 检索，文件名必须包含全名或拼音，防误抓
import json, os, time, urllib.request, urllib.parse

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "images", "actors", "staging")
os.makedirs(OUT, exist_ok=True)
UA = {"User-Agent": "KiteSite/1.0 (fan-site image collector)"}

ACTORS = [
    ("liu_yunlong", "柳云龙", "liu yunlong"),
    ("luo_haiqiong", "罗海琼", "luo haiqiong"),
    ("ma_chi", "马驰", "ma chi"),
    ("sun_bin", "孙斌", "sun bin"),
    ("lei_han", "雷汉", "lei han"),
    ("qi_huan", "齐欢", "qi huan"),
    ("liu_liwei", "刘立伟", "liu liwei"),
    ("wang_xin", "王鑫", "wang xin"),
    ("cao_kenan", "曹克难", "cao kenan"),
    ("liu_mingyang", "刘名洋", "liu mingyang"),
    ("yin_fei", "殷飞", "yin fei"),
    ("shi_anni", "石安妮", "shi anni"),
    ("ma_xiaowei", "马晓伟", "ma xiaowei"),
    ("xie_chengying", "谢承颖", "xie chengying"),
    ("pei_xinglei", "裴兴雷", "pei xinglei"),
]

def api(params):
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode("utf-8"))

def search(q):
    try:
        d = api({"action": "query", "generator": "search", "gsrsearch": q,
                 "gsrnamespace": "6", "gsrlimit": "15",
                 "prop": "imageinfo", "iiprop": "url|size", "iiurlwidth": "800"})
    except Exception:
        return []
    out = []
    for p in d.get("query", {}).get("pages", {}).values():
        ii = p.get("imageinfo", [{}])[0]
        url = ii.get("thumburl") or ii.get("url")
        name = p.get("title", "")
        w = ii.get("width", 0)
        h = ii.get("height", 0)
        if not url or w < 200 or h < 200:
            continue
        if os.path.splitext(name)[1].lower() not in (".jpg", ".jpeg", ".png"):
            continue
        out.append((name, url))
    return out

def title_ok(title, cn, py):
    t = title.lower()
    return (cn and cn in title) or (py and py.replace(" ", "") in t.replace(" ", ""))

for key, cn, py in ACTORS:
    found = []
    for q in [cn, f"{cn} (actor)", py]:
        for name, url in search(q):
            if title_ok(name, cn, py) and (name, url) not in found:
                found.append((name, url))
        if len(found) >= 2:
            break
        time.sleep(0.4)
    for i, (name, url) in enumerate(found[:2]):
        ext = os.path.splitext(name)[1].lower()
        path = os.path.join(OUT, f"{key}_{i}{ext}")
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=40) as r, open(path, "wb") as f:
                f.write(r.read())
            print(f"OK {key} [{i}] <- {name}")
        except Exception as e:
            print(f"FAIL {key} [{i}]: {e}")
    if not found:
        print(f"NONE {key}")
    time.sleep(0.5)
