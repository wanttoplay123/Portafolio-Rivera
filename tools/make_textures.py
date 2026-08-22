"""Genera las texturas de fondo del portafolio.

Los recortes de los mockups originales traían texto quemado dentro (titulares,
nav, la cita), que se colaba detrás del contenido real. Estas texturas se
generan de cero: cielo, luna, dunas, roca de primer plano, ciudad y pergamino.
"""

import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = "public/assets/"
random.seed(7)
rng = np.random.default_rng(7)


def fnoise(w, h, octaves=6, base=3, persistence=0.55):
    """Ruido fractal en [0, 1] por suma de octavas escaladas con bicúbico."""
    total = np.zeros((h, w), dtype=np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, base * 2**o)
        gh = max(2, int(gw * h / w))
        grid = rng.random((gh, gw)).astype(np.float32)
        layer = np.asarray(
            Image.fromarray((grid * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC),
            dtype=np.float32,
        ) / 255.0
        total += layer * amp
        norm += amp
        amp *= persistence
    total /= norm
    return np.clip(total, 0, 1)


def to_img(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def lerp(a, b, t):
    return a + (b - a) * t


# --------------------------------------------------------------------- cielo

def make_sky(w=1920, h=1080):
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    horizon = 0.80

    t = np.clip(y / horizon, 0, 1) ** 1.35
    top = np.array([9, 8, 7], dtype=np.float32)
    mid = np.array([46, 36, 25], dtype=np.float32)
    glow = np.array([104, 76, 44], dtype=np.float32)

    sky = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        band = lerp(top[c], mid[c], t)
        band = band + (glow[c] - band) * np.clip((t - 0.62) / 0.38, 0, 1) ** 2
        sky[:, :, c] = band

    # nubes de tormenta
    clouds = fnoise(w, h, octaves=7, base=3)
    clouds = np.clip((clouds - 0.42) * 2.4, 0, 1)
    band_mask = np.clip(1.0 - np.abs(y - 0.42) / 0.55, 0, 1)[:, :, None] ** 1.5
    cloud_col = np.array([120, 100, 74], dtype=np.float32)
    sky = sky + (cloud_col - sky) * (clouds[:, :, None] * 0.55) * band_mask

    # luna alta a la derecha, con halo
    mx, my, r = int(w * 0.68), int(h * 0.20), int(h * 0.105)
    xs = np.arange(w, dtype=np.float32)[None, :]
    ys = np.arange(h, dtype=np.float32)[:, None]
    d = np.sqrt((xs - mx) ** 2 + (ys - my) ** 2)

    halo = np.exp(-(d / (r * 4.2)) ** 2) * 0.85
    sky += np.array([150, 128, 96], dtype=np.float32) * halo[:, :, None]

    disc = np.clip((r - d) / 2.5, 0, 1)
    craters = fnoise(w, h, octaves=5, base=24)
    moon_col = np.array([228, 214, 186], dtype=np.float32) - craters[:, :, None] * 46
    sky = sky * (1 - disc[:, :, None]) + moon_col * disc[:, :, None]

    # grano fino
    sky += (rng.random((h, w, 1)).astype(np.float32) - 0.5) * 9

    # oscurecer bordes para que el texto respire por encima
    vx = np.clip(1 - ((xs / w - 0.5) * 2) ** 2, 0, 1) ** 0.5
    vy = np.clip(1 - ((ys / h - 0.5) * 2) ** 2, 0, 1) ** 0.35
    sky *= (0.42 + 0.58 * vx * vy)[:, :, None]

    to_img(sky).save(OUT + "sky.png")


# ------------------------------------------------------------------ siluetas

def ridge(w, points, rough, seed):
    """Perfil de altura (0..1) para una cresta de dunas o roca."""
    r = random.Random(seed)
    xs = np.linspace(0, 1, w, dtype=np.float32)
    prof = np.zeros(w, dtype=np.float32)
    for i in range(points):
        freq = 0.6 * (i + 1) + r.random() * 1.4
        prof += np.sin(xs * math.pi * 2 * freq + r.random() * 6.28) / (i + 1.3)
    prof = (prof - prof.min()) / (prof.max() - prof.min() + 1e-6)
    if rough:
        n = fnoise(w, 8, octaves=5, base=6)[0]
        prof = np.clip(prof * 0.72 + n * 0.28, 0, 1)
    return prof


def silhouette(w, h, prof, top, color, edge_light, blur=1.2):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pts = [(x, int(top + (1 - prof[x]) * (h - top) * 0.55)) for x in range(w)]
    d.polygon([(0, h)] + pts + [(w - 1, h)], fill=color)
    if edge_light:
        d.line(pts, fill=edge_light, width=2)
    return img.filter(ImageFilter.GaussianBlur(blur))


def make_dunes(w=1920, h=560):
    base = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    layers = [
        (ridge(w, 5, False, 11), 0.55, (30, 24, 17, 235), (86, 68, 44, 190), 1.6),
        (ridge(w, 7, True, 12), 0.30, (18, 14, 10, 248), (64, 50, 32, 160), 1.1),
    ]
    for prof, topf, col, edge, blur in layers:
        base.alpha_composite(silhouette(w, h, prof, int(h * topf), col, edge, blur))
    base.save(OUT + "dunes.png")


def make_rocks(w=1920, h=520):
    prof = ridge(w, 9, True, 21)
    prof = np.clip(prof**1.6, 0, 1)
    img = silhouette(w, h, prof, int(h * 0.18), (8, 6, 5, 255), (40, 31, 20, 120), 0.8)
    img.save(OUT + "rocks.png")


# ------------------------------------------------------------------- ciudad

def make_city(w=1500, h=680):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    ink = (13, 11, 9, 252)
    rim = (96, 74, 46, 130)
    ground = h - 40
    r = random.Random(33)

    glow = (74, 50, 26, 255)

    def arch_window(cx, cy, aw, ah):
        d.rectangle([cx - aw, cy - ah * 0.45, cx + aw, cy + ah * 0.5], fill=glow)
        d.pieslice([cx - aw, cy - ah * 1.35, cx + aw, cy + ah * 0.45], 180, 360, fill=glow)

    def dome(cx, body_top, rw, rh):
        """Cúpula apoyada exactamente sobre el cuerpo del edificio."""
        d.rectangle([cx - rw * 0.86, body_top, cx + rw * 0.86, ground], fill=ink)
        d.pieslice([cx - rw, body_top - rh, cx + rw, body_top + rh], 180, 360, fill=ink)
        d.arc([cx - rw, body_top - rh, cx + rw, body_top + rh], 190, 350, fill=rim, width=2)
        d.polygon(
            [(cx - 5, body_top - rh + 4), (cx + 5, body_top - rh + 4), (cx, body_top - rh - 26)],
            fill=ink,
        )
        for k in (-0.45, 0.45):
            arch_window(int(cx + rw * k), int(body_top + 74), 13, 30)

    def minaret(cx, top_y, bw):
        shaft_top = top_y + 40
        d.rectangle([cx - bw, shaft_top, cx + bw, ground], fill=ink)
        # balcón
        d.rectangle([cx - bw * 2.1, shaft_top - 4, cx + bw * 2.1, shaft_top + 7], fill=ink)
        # cupulín rematando el fuste
        d.pieslice([cx - bw * 1.5, top_y + 6, cx + bw * 1.5, shaft_top + 6], 180, 360, fill=ink)
        d.polygon([(cx - 3, top_y + 8), (cx + 3, top_y + 8), (cx, top_y - 16)], fill=ink)
        arch_window(cx, shaft_top + 60, 5, 14)

    # muralla de fondo con arcos iluminados
    wall_top = int(h * 0.66)
    d.rectangle([0, wall_top, w, ground], fill=(11, 9, 7, 244))
    for x in range(60, w, 104):
        arch_window(x, wall_top + 54, 20, 42)

    for cx, rw, rh in [(300, 92, 78), (620, 132, 112), (980, 104, 88), (1272, 74, 62)]:
        dome(cx, int(h * 0.50), rw, rh)

    for cx, bw in [(150, 13), (470, 11), (800, 15), (1130, 12), (1420, 10)]:
        minaret(cx, int(h * 0.10) + r.randint(-20, 50), bw)

    img = img.filter(ImageFilter.GaussianBlur(0.7))
    img.save(OUT + "city.png")


# ---------------------------------------------------------------- pergamino

def make_parchment(w=1024, h=1024, name="paper.png", burn=True):
    base = fnoise(w, h, octaves=7, base=4)
    fine = fnoise(w, h, octaves=4, base=90)

    tone = 0.62 + base * 0.30 + fine * 0.08
    col = np.zeros((h, w, 3), dtype=np.float32)
    light = np.array([226, 208, 172], dtype=np.float32)
    dark = np.array([150, 126, 88], dtype=np.float32)
    for c in range(3):
        col[:, :, c] = lerp(dark[c], light[c], np.clip(tone, 0, 1))

    # manchas de humedad
    stains = fnoise(w, h, octaves=5, base=6)
    stain_mask = np.clip((stains - 0.55) * 3.0, 0, 1) ** 1.4
    col *= (1 - stain_mask * 0.22)[:, :, None]

    # fibras
    fibers = fnoise(w, h, octaves=3, base=200)
    col += (fibers[:, :, None] - 0.5) * 10

    if burn:
        xs = np.linspace(-1, 1, w, dtype=np.float32)[None, :]
        ys = np.linspace(-1, 1, h, dtype=np.float32)[:, None]
        edge = np.clip((np.maximum(np.abs(xs), np.abs(ys)) - 0.72) / 0.28, 0, 1) ** 1.5
        edge = edge * (0.55 + 0.45 * fnoise(w, h, octaves=4, base=10))
        burn_col = np.array([62, 42, 24], dtype=np.float32)
        col = col + (burn_col - col) * edge[:, :, None]

    to_img(col).save(OUT + name)


if __name__ == "__main__":
    make_sky()
    make_dunes()
    make_rocks()
    make_city()
    make_parchment()
    print("texturas generadas")


# ------------------------------------------------------------------- rosetón

def make_mandala(size=1024):
    """Rosetón arabesco: anillos, lóbulos y radios sobre fondo transparente."""
    ss = 2  # supersampling para bordes limpios
    s = size * ss
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = s / 2
    gold = (196, 158, 96)

    def ring(r, w, alpha):
        d.ellipse([c - r, c - r, c + r, c + r], outline=gold + (alpha,), width=w)

    for r, w, a in [
        (0.97, 5, 90), (0.90, 3, 130), (0.74, 9, 110),
        (0.70, 3, 150), (0.46, 7, 120), (0.30, 3, 150), (0.13, 5, 160),
    ]:
        ring(c * r, w * ss, a)

    def petal(angle, r0, r1, half, alpha, width=3):
        """Lóbulo apuntado, dibujado como dos arcos que se cierran en punta."""
        a = math.radians(angle)
        tip = (c + math.cos(a) * r1, c + math.sin(a) * r1)
        base = (c + math.cos(a) * r0, c + math.sin(a) * r0)
        hw = math.radians(half)
        mid_r = (r0 + r1) * 0.55
        left = (c + math.cos(a - hw) * mid_r, c + math.sin(a - hw) * mid_r)
        right = (c + math.cos(a + hw) * mid_r, c + math.sin(a + hw) * mid_r)
        d.line([base, left, tip], fill=gold + (alpha,), width=width * ss, joint="curve")
        d.line([base, right, tip], fill=gold + (alpha,), width=width * ss, joint="curve")

    for i in range(16):
        petal(i * 22.5, c * 0.30, c * 0.70, 7.5, 135)
    for i in range(32):
        petal(i * 11.25 + 5.6, c * 0.74, c * 0.90, 3.4, 100, width=2)
    for i in range(8):
        petal(i * 45, c * 0.13, c * 0.30, 12, 150)

    # radios finos hasta el anillo exterior
    for i in range(64):
        a = math.radians(i * 5.625)
        d.line(
            [
                (c + math.cos(a) * c * 0.90, c + math.sin(a) * c * 0.90),
                (c + math.cos(a) * c * 0.97, c + math.sin(a) * c * 0.97),
            ],
            fill=gold + (70,),
            width=2 * ss,
        )

    img = img.resize((size, size), Image.LANCZOS)
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    img.save(OUT + "mandala.png")
