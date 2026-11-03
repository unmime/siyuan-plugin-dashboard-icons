#!/usr/bin/env python3
"""Generate icon.png (marketplace icon) and preview.png (marketplace preview).

Requires Pillow. Sample icons are fetched from the upstream CDN if missing.
"""
import os
import urllib.request

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = "/tmp/dicon-art"
CDN = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png"

BG_TOP = (18, 21, 26)
BG_BOTTOM = (34, 39, 48)
PANEL = (26, 29, 35)
CARD = (35, 39, 47)
LINE = (48, 54, 64)
TEXT = (230, 232, 236)
DIM = (139, 145, 156)
ACCENT = (74, 158, 255)
SWATCHES = [(74, 158, 255), (124, 92, 255), (45, 212, 191), (245, 158, 11)]

SAMPLE = ["plex", "jellyfin", "immich", "home-assistant", "nextcloud", "portainer",
          "grafana", "syncthing", "adguard-home", "qbittorrent", "vaultwarden", "ollama",
          "sonarr", "radarr", "paperless-ngx", "tailscale", "traefik", "mealie",
          "nginx-proxy-manager", "filebrowser", "uptime-kuma", "code-server", "minio", "prometheus"]

FONT_CANDIDATES = [
    ("/System/Library/Fonts/PingFang.ttc", 0),
    ("/System/Library/Fonts/STHeiti Medium.ttc", 0),
    ("/Library/Fonts/Arial Unicode.ttf", 0),
]


def font(size, bold=False):
    for path, index in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=1 if bold else index)
            except Exception:
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    continue
    return ImageFont.load_default()


def gradient(width, height):
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)
    for y in range(height):
        t = y / max(1, height - 1)
        draw.line([(0, y), (width, y)],
                  fill=tuple(int(BG_TOP[i] + (BG_BOTTOM[i] - BG_TOP[i]) * t) for i in range(3)))
    return img


def rounded(img, radius):
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.size[0] - 1, img.size[1] - 1], radius, fill=255)
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def fetch_sample(slug):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, slug + ".png")
    if not os.path.exists(path):
        req = urllib.request.Request(f"{CDN}/{slug}.png", headers={"User-Agent": "siyuan-plugin-dashboard-icons"})
        with urllib.request.urlopen(req, timeout=30) as resp, open(path, "wb") as fh:
            fh.write(resp.read())
    return Image.open(path).convert("RGBA")


def build_icon():
    size = 256
    base = gradient(size, size)
    draw = ImageDraw.Draw(base)
    box, gap = 78, 14
    total = box * 2 + gap
    left = (size - total) // 2
    top = (size - total) // 2
    for i, color in enumerate(SWATCHES):
        x = left + (i % 2) * (box + gap)
        y = top + (i // 2) * (box + gap)
        draw.rounded_rectangle([x, y, x + box - 1, y + box - 1], radius=20, fill=color)
    rounded(base, 56).save(os.path.join(ROOT, "icon.png"), optimize=True)


def build_preview():
    width, height = 1024, 768
    canvas = gradient(width, height)
    draw = ImageDraw.Draw(canvas)

    win_w, win_h = 960, 612
    ox, oy = (width - win_w) // 2, (height - win_h) // 2
    draw.rounded_rectangle([ox, oy, ox + win_w, oy + win_h], radius=16, fill=PANEL,
                           outline=LINE, width=1)

    pad = 26
    draw.text((ox + pad, oy + 20), "Dashboard 图标", font=font(17, True), fill=TEXT)
    draw.text((ox + win_w - pad - 150, oy + 24), "3400+ self-hosted icons", font=font(12), fill=DIM)

    # search box
    sy = oy + 58
    draw.rounded_rectangle([ox + pad, sy, ox + pad + 470, sy + 36], radius=9, fill=CARD, outline=LINE)
    draw.text((ox + pad + 14, sy + 10), "搜索图标，如 plex、immich", font=font(13), fill=DIM)

    # chips
    cy = sy + 52
    labels = ["全部", "媒体", "网络", "监控", "开发", "云存储", "安全", "自动化", "效率办公"]
    cx = ox + pad
    for i, label in enumerate(labels):
        f = font(12)
        tw = draw.textlength(label, font=f)
        w = int(tw) + 24
        fill = ACCENT if i == 0 else CARD
        fg = (255, 255, 255) if i == 0 else DIM
        draw.rounded_rectangle([cx, cy, cx + w, cy + 26], radius=13, fill=fill,
                               outline=None if i == 0 else LINE)
        draw.text((cx + 12, cy + 6), label, font=f, fill=fg)
        cx += w + 8

    # grid
    gy = cy + 44
    cols, cw, ch, gap = 6, 142, 92, 12
    for idx, slug in enumerate(SAMPLE[:24]):
        col, row = idx % cols, idx // cols
        x = ox + pad + col * (cw + gap)
        y = gy + row * (ch + gap)
        draw.rounded_rectangle([x, y, x + cw, y + ch], radius=10, fill=CARD, outline=LINE)
        try:
            art = fetch_sample(slug)
            art.thumbnail((36, 36), Image.LANCZOS)
            canvas.paste(art, (x + (cw - art.width) // 2, y + 18), art)
        except Exception:
            pass
        name = slug.replace("-", " ").title()
        f = font(11)
        tw = draw.textlength(name, font=f)
        draw.text((x + (cw - tw) / 2, y + 64), name, font=f, fill=DIM)

    draw.text((ox + pad, oy + win_h - 26), "左键插入正文 · 右键更多操作",
              font=font(11), fill=(93, 99, 110))

    canvas.save(os.path.join(ROOT, "preview.png"), optimize=True)


if __name__ == "__main__":
    build_icon()
    build_preview()
    for name in ("icon.png", "preview.png"):
        path = os.path.join(ROOT, name)
        print(f"{name}: {os.path.getsize(path) / 1024:.0f} KB")
