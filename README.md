# Outlaw Portfolio — Jesús David Rivera Coronado

Portafolio personal con estética western, fondo de vídeo scrubbed por scroll y
contenido en español e inglés.

## Stack

- React 18 + Vite
- React Three Fiber + drei + three (polvo aditivo del fondo)
- Framer Motion (reveals, modal de proyectos, relleno de las placas)
- CSS propio, sin framework: paleta sepia, tipografías Bevan / Rye / Roboto Slab

## Comandos

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # genera dist/
npm run preview   # sirve dist/
```

## Estructura

```
public/assets/       recortes de los mockups, texturas generadas y la mesa
public/media/        vídeo del fondo (3 tamaños) y el impacto de las placas
src/
  App.jsx            todas las secciones
  i18n.jsx           idioma activo: contexto, persistencia y <html lang>
  data/content.js    TODO el contenido editable, en los dos idiomas
  components/
    Scene3D.jsx      canvas WebGL de fondo: polvo aditivo con parallax
    ScrollVideo.jsx  vídeo de fondo scrubbed por scroll
    Skills.jsx       placas de sheriff: pirámide, volteo al disparo y sonido
    Tilt.jsx         tilt 3D por CSS para tarjetas
    Icons.jsx        iconos SVG inline
  styles.css         sistema visual: tipografía, botones, nav, modal, pie
  lang.css           conmutador ES / EN
  stage.css          portada y tramo del vídeo
  skills.css         placas de sheriff
  mesa.css           proyectos sobre la mesa
  about.css          About me
  saloon.css         Experiencia
tools/               revisión y generación de assets (ver tools/README.md)
```

## Recorrido de la página

| sección | fondo |
|---|---|
| Portada | vídeo, segundo 0 |
| Tramo vacío | vídeo corriendo solo |
| Habilidades | vídeo, plano final del saloon, con la banda pegada encima |
| Sobre mí | negro |
| Proyectos | foto de la mesa |
| Experiencia | negro |
| Contacto | negro |

## Idiomas

Todo el texto vive en `src/data/content.js`, en dos árboles con las mismas
claves (`es` y `en`); lo que no se traduce —correo, teléfono, GitHub, niveles,
stacks, miniaturas— se declara una sola vez y se reparte a los dos. Los
componentes leen el árbol activo con `useLang()`.

El idioma inicial sale de lo que eligió el visitante la vez anterior
(`localStorage`) y, si no hay nada guardado, del navegador: cualquier cosa que
no sea español cae en inglés. Al cambiarlo se actualizan también `<html lang>`,
el `<title>` y la meta descripción.

## Fondo de vídeo scrubbed por scroll

`src/components/ScrollVideo.jsx` fija un `<video>` a pantalla completa detrás
del contenido y mapea su `currentTime` al scroll.

### Qué tramo cubre y con qué tiempos

El mapeo **no es lineal**: `DEFAULT_STOPS` clava el borde superior de cada
sección en un instante concreto del vídeo y entre anclas interpola.

| sección | segundo | plano |
|---|---|---|
| `.stage-hero` | 0 s | frontal en la calle, presentación |
| `.video-gap` | 1.6 s | gira, sale del pueblo y entra al saloon |
| `.skills-stage` | 8.4 s | sentado en la barra, carteles WANTED en la pared |
| (borde inferior de `.skills-stage`, menos una pantalla) | 11.0 s | fin |

El cierre resta una pantalla a propósito: ahí el vídeo llega a su último
fotograma y **se queda quieto**, sin fundido. La sección siguiente le pasa por
encima con su propio fondo, como cualquier otro scroll, y el vídeo se apaga una
pantalla más abajo, cuando ya está tapado y solo costaría composición.
`node tools/checks.mjs` comprueba las dos cosas.

El `<video>` va con `object-fit: contain`: el plano se ve entero y sin
reescalar de más. Con `cover` el 16:9 se recortaba contra pantallas más altas o
más anchas y el mismo archivo tenía que estirarse para tapar el hueco, que es
lo que restaba nitidez.

### El tramo de skills va pegado

`.skills-stage` mide 260 vh y la banda de placas va `position: sticky` dentro.
Así las placas están puestas durante todo el plano final en vez de asomar y
marcharse por arriba dejando la pantalla vacía.

Dentro de ese tramo, `useChoreo` mueve las placas con el scroll en tres actos:
entran volando desde la derecha una detrás de otra y se **alinean en fila**,
la fila se cierra en **círculo** y el círculo gira, y por último se deshace y
cada placa cae en su sitio de la **pirámide**. Se mueven por `transform` sobre
la posición que ya tienen en la rejilla, así que al terminar basta con limpiar
el estilo para que queden exactamente donde las puso el layout. Mientras vuelan
no se puede disparar (`data-stage` lo apaga en CSS): acertar a una placa en
movimiento es imposible y el clic caía en la de al lado.

### Saltos del menú

Los enlaces del menú no usan `behavior: 'smooth'` del navegador: dura lo mismo
para medio scroll que para ocho mil píxeles y en los tramos largos el vídeo y la
entrada de las placas pasaban de golpe. `animatedScrollTo` hace la animación
propia, con el tiempo creciendo con la distancia (0,8 s a 2,6 s) y curva suave
por los dos extremos; cualquier gesto del usuario la cancela.

«Habilidades» además no salta al borde del tramo sino al 80 %, que es donde las
placas ya están colocadas y se pueden disparar.

### Composición: no tapar la cara

Medido fotograma a fotograma, la cara vive siempre en la mitad superior y se
mueve en horizontal según el plano. No hay una columna lateral fija que la
esquive, así que la regla es vertical: el contenido de la portada se ancla
abajo y la franja alta queda para la escena y los revólveres.

### Por qué el MP4 está recodificado

Con `-g 1` cualquier `currentTime` cae sobre un keyframe y el seek es
inmediato; con el GOP normal de 2 s el scrub daba saltos. El comando entero
está en `tools/README.md`.

El tiempo persigue al objetivo con un lerp en rAF, no punto por punto: absorbe
los saltos de ~100 px de la rueda. El bucle se apaga solo tras ~30 frames
quietos y lo revive el siguiente scroll. `prefers-reduced-motion: reduce` deja
el vídeo fijo en el frame inicial. En iOS un `play()`/`pause()` en el primer
gesto desbloquea el seek, que Safari no permite sobre un vídeo que nunca se ha
reproducido.

## Las placas de skills

Ocho estrellas de sheriff en pirámide (1 / 3 / 4, la cima es la más dominada).
El latón lleva imperfecciones: ruido fractal multiplicado sobre el metal y el
contorno desplazado con ruido de baja frecuencia, los dos en `<defs>`
declarados una sola vez para las ocho.

Cada placa empieza **volteada**: solo se ve el dorso, sin marcar. Al dispararle
voltea sobre su eje horizontal, enseña la abreviatura y aparecen el nombre y el
nivel, con el latón subiendo hasta el porcentaje. Los disparos siguientes le
dan una vuelta entera y la dejan de cara.

Las dos caras son dos capas HTML con `backface-visibility: hidden`, no dos
grupos del mismo SVG: Chrome no compone en 3D los hijos de un `<svg>`. Y la
sombra va en cada cara y no en el contenedor del volteo, porque un `filter`
aplana el contexto 3D y el dorso se vería a través de la cara.

El impacto suena con un clip real (`public/media/target-hit.mp3`, 10 kB), con
un rebote metálico sintetizado en WebAudio de reserva. El clip se descarga y
descodifica al montar el componente, no en el primer clic: si se deja para
entonces, el primer disparo llega tarde o suena el sintetizado —otro sonido—
mientras termina de descodificar. Cada disparo corta el anterior con una rampa
de 12 ms, para que no se amontonen.

## Proyectos sobre la mesa

`.mesa` usa `assets/table-scene.webp` como fondo a sangre. La foto ya trae el cartel SE
BUSCA, el farol y el revólver pegados al borde izquierdo y la botella y las
cartas al derecho, así que las tarjetas van al centro-derecha, que es la tabla
vacía. En móvil el bodegón no cabe: la foto se queda de textura oscurecida y
las tarjetas ocupan el ancho.

## Assets

Tres orígenes distintos:

1. **Recortes de los mockups** (`portrait.png`, `poster-wanted.png`,
   `thumb-*.png`, `lantern.png`, `hat.png`, `skull.png`). Se muestran con
   `mix-blend-mode: screen` y una máscara radial, que borra el fondo negro y el
   borde recto del recorte.
2. **Texturas generadas** (`sky.png`, `dunes.png`, `rocks.png`, `city.png`,
   `paper.png`) — `tools/make_textures.py`.
3. **`revolver-l.png` / `revolver-r.png`** — `tools/cut_revolvers.py`.

## Revisión

`node tools/checks.mjs` antes de dar algo por bueno; `node tools/audit.mjs`
para capturas y errores de consola en cinco viewports. El detalle de cada
script está en `tools/README.md`.

## Deploy

Build estático puro. En Netlify: build `npm run build`, publish `dist`.
`vite.config.js` usa `base: '/'`; si se despliega en un subdirectorio (GitHub
Pages de proyecto), cambiar a `base: '/nombre-repo/'`.

## Pendiente

- Reemplazar la URL de LinkedIn (`https://www.linkedin.com/`) por el perfil real en `src/App.jsx`.
- Enlaces a repos/demo por proyecto (hoy el modal solo describe el caso).
