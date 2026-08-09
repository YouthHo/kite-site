#!/usr/bin/env python3
# 生成浅色主题的 Tailwind 任意值类覆盖（src/styles/theme-light.css）
# 覆盖 bg/border/text + hover:/group-hover: 变体，纯 CSS 字面量选择器
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "styles", "theme-light.css")

BG_MAP = {
    "#060606": "#ece8de", "#080808": "#f5f2e9", "#0a0a0a": "#f2eee5", "#0b0b0b": "#f1ede4",
    "#0c0c0c": "#eae6db", "#0e0e0e": "#ffffff", "#0f0e0c": "#faf7f1", "#101010": "#faf7f0",
    "#121212": "#ffffff", "#141414": "#f6f2e9", "#161310": "#f3efe5", "#161616": "#f8f5ee",
    "#1a1415": "#f7e9e7", "#1a1a1a": "#f3efe7", "#1c1815": "#e5dfd2", "#2a2520": "#d6cfc1",
}
TX_MAP = {
    "#555048": "#7a7366", "#8a8275": "#6e675a", "#d8a0a8": "#8e4d5c", "#d8ccb8": "#4d463c",
    "#e8dcc8": "#2f2b23", "#f0e6d2": "#262119", "#f5e9d6": "#262119", "#b8860b": "#8f6d0e",
}
ALPHA_VARIANTS = {"#080808": ["60"], "#0e0e0e": ["85", "80"]}

def esc(hexv):
    return "\\#" + hexv[1:]

lines = ["/* 自动生成：scripts/gen_theme_css.py —— 浅色主题「档案纸」的 Tailwind 任意值类映射 */"]
lines.append("[data-theme='light'] {")
for k, v in BG_MAP.items():
    e = esc(k)
    lines.append(f"  .bg-[{e}] {{ background-color: {v} !important; }}")
    lines.append(f"  .hover\\:bg-[{e}]:hover {{ background-color: {v} !important; }}")
    lines.append(f"  .group:hover .group-hover\\:bg-[{e}] {{ background-color: {v} !important; }}")
    lines.append(f"  .border-[{e}] {{ border-color: {v} !important; }}")
    lines.append(f"  .hover\\:border-[{e}]:hover {{ border-color: {v} !important; }}")
for k, variants in ALPHA_VARIANTS.items():
    for s in variants:
        lines.append(f"  .bg-[{esc(k)}]\\/{s} {{ background-color: {BG_MAP[k]} !important; }}")
for k, v in TX_MAP.items():
    e = esc(k)
    lines.append(f"  .text-[{e}] {{ color: {v} !important; }}")
    lines.append(f"  .hover\\:text-[{e}]:hover {{ color: {v} !important; }}")
    lines.append(f"  .group:hover .group-hover\\:text-[{e}] {{ color: {v} !important; }}")
    lines.append(f"  .border-[{e}] {{ border-color: {v} !important; }}")
lines.append("}")
lines.append("")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))
print(f"OK -> {OUT} ({len(lines)} lines)")
