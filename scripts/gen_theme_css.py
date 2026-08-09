#!/usr/bin/env python3
# 生成浅色主题的 Tailwind 任意值类覆盖（src/styles/theme-light.css）
# 覆盖 bg/border/text + hover:/group-hover: 变体，纯 CSS 字面量选择器
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "styles", "theme-light.css")

BG_MAP = {
    "#060606": "#e7ddc7", "#080808": "#efe6d3", "#0a0a0a": "#ece2cd", "#0b0b0b": "#ece2cd",
    "#0c0c0c": "#e4d9c0", "#0e0e0e": "#f9f2e3", "#0f0e0c": "#f6eedb", "#101010": "#f6eedb",
    "#121212": "#f9f2e3", "#141414": "#f3ead6", "#161310": "#f0e7d2", "#161616": "#f6eeda",
    "#1a1415": "#f5e4dc", "#1a1a1a": "#f1e8d4", "#1c1815": "#dfd3b8", "#2a2520": "#d9c9ab",
}
TX_MAP = {
    "#555048": "#8b7f6a", "#8a8275": "#62574a", "#d8a0a8": "#96605a", "#d8ccb8": "#4a4134",
    "#e8dcc8": "#3d362b", "#f0e6d2": "#342d22", "#f5e9d6": "#342d22", "#b8860b": "#8a6a2f",
}
ALPHA_VARIANTS = {"#080808": ["95", "90", "60"], "#0e0e0e": ["95", "85", "80"]}
# 文字透明度变体（浅色下映射为对应的深色实色）
TEXT_ALPHA = {"#e8dcc8": ["90", "70", "50"], "#8a8275": ["70"]}
# 边框透明度变体
BORDER_ALPHA = {"#2a2520": ["70"]}

def esc(hexv):
    # #080808 -> \[\#080808\]：类名中的方括号与 # 都必须转义（与 Tailwind 输出一致）
    return "\\[\\#" + hexv[1:] + "\\]"

lines = ["/* 自动生成：scripts/gen_theme_css.py —— 浅色主题「档案纸」的 Tailwind 任意值类映射 */"]
lines.append("/* 注意：必须使用扁平选择器，不能依赖 CSS 嵌套（旧浏览器不支持） */")
for k, v in BG_MAP.items():
    e = esc(k)
    lines.append(f"[data-theme='light'] .bg-{e} {{ background-color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .hover\\:bg-{e}:hover {{ background-color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .group:hover .group-hover\\:bg-{e} {{ background-color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .border-{e} {{ border-color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .hover\\:border-{e}:hover {{ border-color: {v} !important; }}")
for k, variants in ALPHA_VARIANTS.items():
    for s in variants:
        lines.append(f"[data-theme='light'] .bg-{esc(k)}\\/{s} {{ background-color: {BG_MAP[k]} !important; }}")
for k, variants in TEXT_ALPHA.items():
    for s in variants:
        lines.append(f"[data-theme='light'] .text-{esc(k)}\\/{s} {{ color: {TX_MAP[k]} !important; }}")
for k, variants in BORDER_ALPHA.items():
    for s in variants:
        lines.append(f"[data-theme='light'] .border-{esc(k)}\\/{s} {{ border-color: {BG_MAP[k]} !important; }}")
for k, v in TX_MAP.items():
    e = esc(k)
    lines.append(f"[data-theme='light'] .text-{e} {{ color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .hover\\:text-{e}:hover {{ color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .group:hover .group-hover\\:text-{e} {{ color: {v} !important; }}")
    lines.append(f"[data-theme='light'] .border-{e} {{ border-color: {v} !important; }}")
lines.append("")
lines.append("")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"OK -> {OUT} ({len(lines)} lines)")
