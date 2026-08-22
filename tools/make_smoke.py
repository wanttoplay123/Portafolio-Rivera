"""Genera sprites de humo con silueta orgánica.

Un `radial-gradient` borroso siempre se lee como una bola: el humo real tiene
borde irregular y densidad desigual. Cada sprite sale de ruido fractal recortado
por una caída radial, con una segunda capa de ruido fino para picar el borde.
"""

import numpy as np
from PIL import Image, ImageFilter

OUT = "public/assets/"
SIZE = 512


def fbm(size, rng, octaves=7, base=3, persistence=0.55):
    """Ruido fractal en [0, 1]."""
    total = np.zeros((size, size), dtype=np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        n = max(2, base * 2**o)
        grid = rng.random((n, n)).astype(np.float32)
        layer = np.asarray(
            Image.fromarray((grid * 255).astype(np.uint8)).resize((size, size), Image.BICUBIC),
            dtype=np.float32,
        ) / 255.0
        total += layer * amp
        norm += amp
        amp *= persistence
    return np.clip(total / norm, 0, 1)


def puff(seed, size=SIZE):
    rng = np.random.default_rng(seed)

    body = fbm(size, rng, octaves=7, base=3)
    detail = fbm(size, rng, octaves=5, base=14)

    # caída radial: el centro aguanta, el borde se deshace
    ax = np.linspace(-1, 1, size, dtype=np.float32)
    xs, ys = np.meshgrid(ax, ax)
    # elipse ligeramente irregular para que no salgan dos sprites iguales
    sx, sy = 0.9 + rng.random() * 0.3, 0.85 + rng.random() * 0.35
    r = np.sqrt((xs / sx) ** 2 + (ys / sy) ** 2)
    falloff = np.clip(1.0 - r, 0, 1) ** 1.08

    density = body * 0.72 + detail * 0.28
    alpha = np.clip((density * falloff - 0.17) * 2.9, 0, 1)
    alpha = alpha**1.25

    # el humo es más claro arriba, donde le da la luz
    light = np.clip(0.55 + (1 - (ys + 1) / 2) * 0.5 + detail * 0.15, 0, 1)
    rgb = np.zeros((size, size, 3), dtype=np.float32)
    cold = np.array([176, 170, 158], dtype=np.float32)
    warm = np.array([242, 234, 214], dtype=np.float32)
    for c in range(3):
        rgb[:, :, c] = cold[c] + (warm[c] - cold[c]) * light

    img = Image.fromarray(
        np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8), mode="RGBA"
    )
    return img.filter(ImageFilter.GaussianBlur(1.7))


if __name__ == "__main__":
    for i in range(1, 5):
        puff(100 + i * 17).save(f"{OUT}smoke-{i}.png")
        print(f"smoke-{i}.png")
