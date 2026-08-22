import { useEffect, useRef } from 'react'

const BASE = import.meta.env.BASE_URL

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

/**
 * Anclas por defecto [selector, segundo del vídeo]. A nivel de módulo, no como
 * valor por defecto en línea: un array literal en la firma cambia de identidad
 * en cada render y volvería a lanzar el efecto entero cada vez.
 */
const DEFAULT_STOPS = [
  // el hero sostiene el plano frontal entero
  ['.stage-hero', 0],
  // el tramo vacío: la portada ya se ha apagado y el vídeo corre solo
  ['.video-gap', 1.6],
  // las placas de skills entran sobre el plano final —sentado en la barra, con
  // los carteles WANTED en la pared— y se quedan ahí hasta el corte. El ancla
  // va en el tramo, no en la banda: la banda es `sticky` y su borde superior
  // deja de moverse en cuanto se pega.
  ['.skills-stage', 8.4],
]

/**
 * Fondo de vídeo scrubbed por scroll: desde el arranque de la portada hasta el
 * final de «Experiencia». Bajar avanza la escena (calle al atardecer → saloon)
 * y subir la rebobina; el resto —cartel, carriles de proyectos, paneles— va
 * montado encima como complemento.
 *
 * El tramo llega hasta «Experiencia» a propósito: los últimos segundos del
 * vídeo son justo esa escena (sentado en la barra) y antes se desperdiciaban.
 *
 * El MP4 está recodificado como all-intra (`-g 1`), de modo que cualquier
 * `currentTime` cae sobre un keyframe y el seek es inmediato; con el GOP
 * normal de 2 s el scrub daba saltos.
 */
export default function ScrollVideo({
  src1440 = 'media/scroll-1440.mp4',
  src1080 = 'media/scroll-1080.mp4',
  src720 = 'media/scroll-720.mp4',
  poster = 'media/scroll-poster.jpg',
  /**
   * Anclas [selector, segundo]: el borde superior de cada sección se clava en
   * ese instante del vídeo y entre anclas se interpola. Sirve para que cada
   * beat dure lo que pide su contenido en vez de repartir el tiempo a partes
   * iguales — el hero sostiene el plano frontal, el giro cae en la zona de
   * paso y «Experiencia» se queda toda la secuencia sentado en la barra.
   */
  stops = DEFAULT_STOPS,
  /** Última sección: su borde inferior cierra el vídeo. */
  endSelector = '.skills-stage',
  /**
   * Largo del fundido de salida, en pantallas. En 0 no hay fundido: el vídeo
   * enseña su último fotograma a plena luz y se corta en seco al llegar al
   * final del tramo, que es una pantalla antes de que asome la sección
   * siguiente. Se mide en pantallas y no como fracción del tramo a propósito.
   */
  fadeOut = 0,
  ease = 0.12,
}) {
  const wrapRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Un solo <source> elegido en JS: con varios <source> el navegador se queda
    // siempre con el primero que sabe decodificar, no con el que toca por
    // ancho de pantalla. Se mira el ancho en píxeles reales para no servir un
    // 1440p a un móvil con mucho `devicePixelRatio`.
    const px = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2)
    video.src = BASE + (px >= 1600 ? src1440 : px >= 900 ? src1080 : src720)
    video.load()

    let duration = 0
    let current = 0
    let raf = 0
    let idle = 0
    let geo = null

    const measure = () => {
      if (!document.querySelector(endSelector) || !duration) {
        geo = null
        return
      }
      const y = window.scrollY
      const anchors = []
      for (const [sel, t] of stops) {
        const el = document.querySelector(sel)
        if (el) anchors.push({ y: el.getBoundingClientRect().top + y, t })
      }
      if (anchors.length < 2) {
        geo = null
        return
      }
      // Cierre una pantalla antes del borde inferior de la última sección: es
      // el mismo punto en el que el fundido llega a 0 (ver `read`), así que el
      // último fotograma se ve en vez de gastarse con el vídeo ya apagado.
      const r = document.querySelector(endSelector).getBoundingClientRect()
      anchors.push({ y: r.top + y + r.height - window.innerHeight, t: duration - 0.05 })
      anchors.sort((a, b) => a.y - b.y)
      geo = { anchors, startY: anchors[0].y, endY: anchors[anchors.length - 1].y }
    }

    /**
     * Opacidad del vídeo. Con `fadeOut` en 0 —lo normal— no hay fundido: el
     * último fotograma se queda quieto en pantalla y la sección siguiente sube
     * por encima con su propio fondo, sin corte. El apagado real ocurre una
     * pantalla más abajo, ya tapado, y solo sirve para no componer de balde.
     */
    const read = () => {
      if (!geo) return 1
      const vh = window.innerHeight
      const px = fadeOut * vh
      // Sin fundido: el vídeo se queda encendido en su último fotograma y la
      // sección siguiente le pasa por encima con su propio fondo, como
      // cualquier otro scroll. Se apaga una pantalla más abajo, cuando ya está
      // tapado del todo y solo cuesta composición.
      if (px <= 0) return window.scrollY >= geo.endY + vh ? 0 : 1
      return clamp01((geo.endY - window.scrollY) / px)
    }

    /** Segundo del vídeo que toca al scroll actual, interpolando entre anclas. */
    const timeAt = () => {
      if (!geo) return 0
      const y = window.scrollY
      const a = geo.anchors
      if (y <= a[0].y) return a[0].t
      for (let i = 1; i < a.length; i++) {
        if (y <= a[i].y) {
          const k = (y - a[i - 1].y) / Math.max(1, a[i].y - a[i - 1].y)
          return a[i - 1].t + (a[i].t - a[i - 1].t) * k
        }
      }
      return a[a.length - 1].t
    }

    // Escribir en `style` invalida el estilo del nodo aunque el valor no cambie,
    // y esto corre en cada frame: se memoriza lo último pintado para no tocar
    // el DOM si no hace falta.
    let painted = { opacity: -1, hidden: null }

    const paint = (raw) => {
      // Se redondea: por debajo de 1/255 el cambio no es visible.
      const opacity = Math.round(raw * 255) / 255
      const hidden = opacity <= 0.002

      if (opacity !== painted.opacity) {
        wrap.style.opacity = opacity
        painted.opacity = opacity
      }
      // Sin vídeo visible no hace falta que el navegador lo componga.
      if (hidden !== painted.hidden) {
        wrap.style.visibility = hidden ? 'hidden' : ''
        painted.hidden = hidden
      }
    }

    const tick = () => {
      raf = requestAnimationFrame(tick)
      const p = read()
      paint(p)

      if (!duration) return

      const target = timeAt()
      const delta = target - current

      if (Math.abs(delta) < 0.002) {
        current = target
        // Tras ~30 frames quietos se apaga el bucle; lo revive el scroll.
        if (++idle > 30) {
          cancelAnimationFrame(raf)
          raf = 0
        }
        return
      }

      idle = 0
      current += delta * ease

      // Por debajo de medio frame el seek no cambiaría el fotograma pintado.
      if (Math.abs(video.currentTime - current) > 1 / 50) {
        video.currentTime = current
      }
    }

    const wake = () => {
      idle = 0
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onResize = () => {
      measure()
      wake()
    }

    const onMeta = () => {
      duration = video.duration || 0
      measure()
      // Salto seco a la posición de scroll actual (recarga a media página).
      current = timeAt()
      video.currentTime = current
      if (!reduced) wake()
    }

    const onReady = () => wrap.classList.add('is-ready')

    video.addEventListener('loadedmetadata', onMeta)
    video.addEventListener('loadeddata', onReady)
    if (video.readyState >= 1) onMeta()
    if (video.readyState >= 2) onReady()

    measure()
    paint(read())

    if (!reduced) {
      window.addEventListener('scroll', wake, { passive: true })
      window.addEventListener('resize', onResize, { passive: true })
      // El tramo crece con su texto: si el layout se mueve (fuentes, imágenes)
      // hay que volver a medir o el scrub se desfasa.
      const ro = new ResizeObserver(onResize)
      ro.observe(document.body)
      wrap._ro = ro
    }

    // iOS/Safari no deja hacer seek en un vídeo que nunca se ha reproducido;
    // un play()/pause() en el primer gesto lo desbloquea.
    const unlock = () => {
      const p = video.play()
      if (p && typeof p.then === 'function') p.then(() => video.pause()).catch(() => {})
      else video.pause()
    }
    window.addEventListener('touchstart', unlock, { once: true, passive: true })
    window.addEventListener('pointerdown', unlock, { once: true })

    return () => {
      if (raf) cancelAnimationFrame(raf)
      wrap._ro?.disconnect()
      video.removeEventListener('loadedmetadata', onMeta)
      video.removeEventListener('loadeddata', onReady)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('touchstart', unlock)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [src1440, src1080, src720, stops, endSelector, fadeOut, ease])

  return (
    <div className="scroll-video" ref={wrapRef} aria-hidden="true">
      <video
        ref={videoRef}
        poster={BASE + poster}
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        tabIndex={-1}
      />
    </div>
  )
}
