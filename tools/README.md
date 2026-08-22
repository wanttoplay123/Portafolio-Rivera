# Herramientas

Scripts de revisión y de generación de assets. Los `.mjs` levantan Chromium con
Playwright contra el servidor de desarrollo (`npm run dev`) y necesitan **Chrome
del sistema** (`channel: 'chrome'`): el Chromium que trae Playwright no lleva
H.264 y el vídeo del fondo no decodifica.

## Revisión

| script | qué hace |
|---|---|
| `checks.mjs` | Las tres comprobaciones que hay que pasar antes de dar algo por bueno: que About no asome nunca con el vídeo encendido, que la banda de placas quepa en pantalla en cinco viewports, y el recorrido del tramo pegajoso (segundo del vídeo, opacidad y doblez en nueve puntos). Sale con código 1 si algo falla. |
| `audit.mjs` | Cinco viewports x cinco posiciones de scroll: capturas en `shots/audit/`, overflow horizontal, errores de consola y respuestas HTTP ≥ 400. |
| `sections.mjs` | Una captura por sección en `shots/`, para mirar el diseño sin abrir el navegador. |
| `lang.mjs` | Conmutador de idioma: comprueba que cambian textos, `<title>` y `<html lang>`, y que la elección sobrevive a una recarga. |
| `perf.mjs` | Coste por frame durante el scroll. |
| `shot.mjs` | Captura secciones sueltas: `node tools/shot.mjs http://127.0.0.1:5173/ shots home,about`. |
| `shot-scroll.mjs` | Captura al 0/25/50/75/100 % y verifica que el `currentTime` del vídeo sigue al progreso. |

```bash
npm run dev            # en otra terminal
node tools/checks.mjs
node tools/audit.mjs
```

## Assets

| script | qué hace |
|---|---|
| `make_textures.py` | Genera `sky/dunes/rocks/city/paper.png` con PIL + numpy. Los recortes del mockup traían texto quemado dentro, así que se hacen de cero. |
| `cut_revolvers.py` | Recorta `revolver-l/r.png` de una lámina propia. El fondo negro no se puede quitar por umbral de luminancia —el arma tiene zonas igual de oscuras—, así que el recorte va por textura local: desviación típica en una vecindad, cierre del contorno, relleno de huecos y suavizado del filo. |
| `make_smoke.py` | Genera las cuatro volutas de humo del cañón. |

## Vídeo del fondo

El original traía seis keyframes en doce segundos: cada seek tenía que
decodificar hasta cincuenta frames y el scrub daba saltos. Se recodifica con un
keyframe por frame, recortando el primer segundo y con el grado de color
horneado (un `filter` de CSS sobre una capa a pantalla completa cuesta un pase
por frame):

```bash
ffmpeg -ss 1 -i ../upscaled-video.mp4 \
  -vf "scale=1920:1080:flags=lanczos,colorchannelmixer=rr=0.85:gg=0.85:bb=0.85,eq=contrast=1.04:saturation=0.95" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 27 \
  -g 1 -keyint_min 1 -x264-params scenecut=0:ref=1:bframes=0 \
  -movflags +faststart -an public/media/scroll-1080.mp4
```

La variante de 720p va con `-crf 28` y se sirve por debajo de 900 px.

## Sonido del impacto

`public/media/target-hit.mp3` es un golpe suelto sacado de una grabación de
spinner targets. El golpe se localiza por envolvente —ventanas de 10 ms, se
busca una subida brusca con silencio delante— y se recorta con veinte
milisegundos de aire por delante:

```bash
ffmpeg -ss 26.20 -t 0.78 -i "<grabacion>.mp3" \
  -af "highpass=f=110,afade=t=out:st=0.62:d=0.16,dynaudnorm=f=200:g=5,alimiter=limit=0.95" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 96k public/media/target-hit.mp3
```

Para cambiarlo, deja el archivo nuevo en `public/media/` y apunta `HIT_CLIP` en
`src/components/Skills.jsx`. Vaciando esa constante suena el impacto
sintetizado con WebAudio que hay en el mismo archivo, que además es el que
suena si el clip no carga.
