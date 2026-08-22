"""Recorta los dos revólveres de la lámina y les genera canal alfa.

La lámina viene sobre fondo negro. Un simple umbral de luminancia dejaría
transparentes también las zonas oscuras del arma, así que solo se marca como
fondo lo que está conectado con el borde de la imagen (etiquetado de
componentes conexas). Los huecos internos —el guardamonte, por ejemplo— sí se
recuperan mirando si tocan el exterior.
"""

import numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter

SRC = "../ChatGPT Image 20 ago 2026, 16_39_12.png"
OUT = "public/assets/"


def alpha_from_dark_background(img, bright=58, min_blob=4000):
    """Alfa a partir del metal iluminado.

    Umbralar y quedarse con lo oscuro no sirve: el arma tiene zonas tan negras
    como el fondo. Se parte de los píxeles claramente metálicos, se descartan
    las motas sueltas del fondo por tamaño de componente, y luego se rellenan
    los huecos internos para recuperar las sombras propias del arma.
    """
    rgb = np.asarray(img.convert("RGB"), dtype=np.float32)
    lum = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)

    core = lum > bright
    labels, n = ndimage.label(core)
    sizes = ndimage.sum(core, labels, range(1, n + 1))
    keep = np.isin(labels, [i + 1 for i, s in enumerate(sizes) if s >= min_blob])

    # cerrar el contorno, rellenar el interior y suavizar el filo
    solid = ndimage.binary_closing(keep, np.ones((9, 9)))
    solid = ndimage.binary_fill_holes(solid)
    solid = ndimage.binary_dilation(solid, np.ones((3, 3)))

    alpha = ndimage.gaussian_filter(solid.astype(np.float32), 1.4)
    return (np.clip(alpha, 0, 1) * 255).astype(np.uint8)


def bbox_of(alpha, threshold=24):
    ys, xs = np.where(alpha > threshold)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def cut(img, alpha, x0, x1, name, pad=6):
    """Recorta media lámina y la ajusta al contorno del arma."""
    part = img.crop((x0, 0, x1, img.height)).convert("RGBA")
    part_alpha = Image.fromarray(alpha[:, x0:x1])
    part.putalpha(part_alpha)

    bx0, by0, bx1, by1 = bbox_of(np.asarray(part_alpha))
    box = (
        max(0, bx0 - pad),
        max(0, by0 - pad),
        min(part.width, bx1 + pad),
        min(part.height, by1 + pad),
    )
    out = part.crop(box)

    # suavizar el filo del recorte para que no quede aliasing duro
    a = out.getchannel("A").filter(ImageFilter.GaussianBlur(0.8))
    out.putalpha(a)
    out.save(OUT + name)
    print(name, out.size)


if __name__ == "__main__":
    img = Image.open(SRC)
    alpha = alpha_from_dark_background(img)
    mid = img.width // 2
    cut(img, alpha, 0, mid, "revolver-l.png")
    cut(img, alpha, mid, img.width, "revolver-r.png")
