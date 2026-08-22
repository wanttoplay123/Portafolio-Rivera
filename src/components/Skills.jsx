import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

const BASE = import.meta.env.BASE_URL

/**
 * Estrella de sheriff de seis puntas, dibujada en un viewBox de 100x100
 * centrado en (50,50). Una punta mira arriba.
 */
function starPath(points, outer, inner, cx = 50, cy = 50) {
  const step = Math.PI / points
  let a = -Math.PI / 2
  const d = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    d.push(`${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`)
    a += step
  }
  return d.join(' ') + ' Z'
}

const POINTS = 6
const STAR_D = starPath(POINTS, 45, 20.5)

/** Bolas en la punta de cada pico, como las placas de verdad. */
const BALLS = Array.from({ length: POINTS }, (_, i) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / POINTS
  return { cx: +(50 + 45 * Math.cos(a)).toFixed(2), cy: +(50 + 45 * Math.sin(a)).toFixed(2) }
})

/**
 * Definiciones compartidas por todas las placas: el latón, el metal apagado,
 * el brillo y las imperfecciones. Se declaran una sola vez —ocho copias de un
 * feTurbulence cuestan ocho pasadas de ruido por frame— en un SVG de tamaño
 * cero que solo existe para colgar los `<defs>`.
 */
function BadgeDefs() {
  return (
    <svg className="badge-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {/* latón pulido: luz arriba a la izquierda, sombra abajo */}
        <linearGradient id="badge-gold" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#f7e4ab" />
          <stop offset="28%" stopColor="#e2b866" />
          <stop offset="55%" stopColor="#c9a15c" />
          <stop offset="78%" stopColor="#9a6f31" />
          <stop offset="100%" stopColor="#6d4a1e" />
        </linearGradient>

        {/* metal sin marcar: la misma pieza, apagada y oxidada */}
        <linearGradient id="badge-dull" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor="#4a4034" />
          <stop offset="55%" stopColor="#332b21" />
          <stop offset="100%" stopColor="#1d1811" />
        </linearGradient>

        {/* reflejo ancho cruzando la estrella */}
        <linearGradient id="badge-sheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d8" stopOpacity="0.55" />
          <stop offset="42%" stopColor="#fff6d8" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#fff6d8" stopOpacity="0" />
        </linearGradient>

        {/*
          Imperfecciones: ruido fractal multiplicado sobre el metal. Da los
          picados y las manchas de un latón usado; sin esto la estrella parece
          plástico plano. Va en dos frecuencias —grano fino y manchas anchas—
          porque una sola queda regular.
        */}
        <filter id="badge-worn" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" result="grain" />
          <feColorMatrix
            in="grain"
            type="matrix"
            values="0 0 0 0 0.55  0 0 0 0 0.44  0 0 0 0 0.22  0 0 0 0.42 0"
            result="grainTint"
          />
          <feComposite in="grainTint" in2="SourceGraphic" operator="in" result="grainIn" />
          <feBlend in="SourceGraphic" in2="grainIn" mode="multiply" />
        </filter>

        {/* borde comido: desplaza el contorno con ruido de baja frecuencia */}
        <filter id="badge-rough" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

/**
 * Impacto de bala contra metal, sintetizado con WebAudio en vez de servir un
 * MP3: son ~60 líneas contra un archivo más que descargar, y así cada disparo
 * suena algo distinto (los parciales se desafinan al azar) en vez de repetirse
 * clavado.
 *
 * Lo metálico está en los parciales: una chapa no suena a una frecuencia y sus
 * armónicos, sino a un puñado de modos sin relación entera entre ellos. Aquí
 * son cinco resonadores de Q alto —proporciones tomadas de una placa fina—
 * excitados por un chasquido de ruido: eso es el clang. El rebote descendente
 * va debajo, flojo, solo para que se lea «bala» y no «campana».
 */
const PARTIALS = [1, 1.51, 2.13, 2.87, 3.76, 5.09]

function playRicochet(ctx) {
  const t = ctx.currentTime
  const out = ctx.createGain()
  out.gain.value = 0.9
  out.connect(ctx.destination)

  // Excitación: un chasquido de 6 ms. Corto a propósito —lo que suena no es el
  // ruido sino los resonadores que deja vibrando.
  const len = Math.max(1, Math.floor(ctx.sampleRate * 0.006))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2)
  }

  // la placa golpeada cambia de tamaño en cada disparo
  const base = 1150 + Math.random() * 550

  PARTIALS.forEach((mult, i) => {
    const src = ctx.createBufferSource()
    src.buffer = buf

    const res = ctx.createBiquadFilter()
    res.type = 'bandpass'
    // desafinado leve: con las proporciones exactas suena a sintetizador
    res.frequency.value = base * mult * (1 + (Math.random() - 0.5) * 0.02)
    res.Q.value = 42 + i * 9

    const g = ctx.createGain()
    // los modos agudos se apagan antes que los graves, como en el metal real
    const decay = 0.9 / (1 + i * 0.75)
    const level = 0.42 / (1 + i * 0.55)
    g.gain.setValueAtTime(level, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay)

    src.connect(res)
    res.connect(g)
    g.connect(out)
    src.start(t)
    src.stop(t + decay + 0.05)
  })

  // Golpe seco: el plomo llegando, antes de que la chapa cante.
  const thudLen = Math.floor(ctx.sampleRate * 0.05)
  const thudBuf = ctx.createBuffer(1, thudLen, ctx.sampleRate)
  const thud = thudBuf.getChannelData(0)
  for (let i = 0; i < thudLen; i++) {
    thud[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / thudLen, 9)
  }
  const thudSrc = ctx.createBufferSource()
  thudSrc.buffer = thudBuf
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 900
  const thudGain = ctx.createGain()
  thudGain.gain.setValueAtTime(0.5, t)
  thudGain.gain.exponentialRampToValueAtTime(0.0008, t + 0.06)
  thudSrc.connect(hp)
  hp.connect(thudGain)
  thudGain.connect(out)
  thudSrc.start(t)
  thudSrc.stop(t + 0.08)

  // Rebote: cae de agudo a grave con vibrato, el silbido de las películas. Va
  // flojo y por detrás del clang, como cola.
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(base * 2.4, t + 0.03)
  osc.frequency.exponentialRampToValueAtTime(base * 0.5, t + 0.5)

  const lfo = ctx.createOscillator()
  lfo.frequency.value = 30
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 110
  lfo.connect(lfoGain)
  lfoGain.connect(osc.frequency)

  const tail = ctx.createGain()
  tail.gain.setValueAtTime(0.0001, t)
  tail.gain.exponentialRampToValueAtTime(0.07, t + 0.06)
  tail.gain.exponentialRampToValueAtTime(0.0001, t + 0.52)
  osc.connect(tail)
  tail.connect(out)

  osc.start(t)
  lfo.start(t)
  osc.stop(t + 0.54)
  lfo.stop(t + 0.54)
}

/**
 * Impacto real: un golpe de un spinner target metálico, recortado de una
 * grabación propia (`tools/README` explica el corte) y masterizado a 10 kB. El
 * sintetizado de abajo queda de reserva por si el archivo no carga o el clic
 * llega antes de que termine de decodificarse. Vaciar esta constante deja
 * sonando solo el sintetizado.
 */
const HIT_CLIP = 'media/target-hit.mp3'

/**
 * Devuelve `fire()`. El AudioContext se crea en el primer clic —antes de un
 * gesto del usuario los navegadores lo dejan suspendido— y se reutiliza.
 */
function useShot() {
  const ctxRef = useRef(null)
  const bufferRef = useRef(null)
  // último disparo sonando: se corta al siguiente, si no se amontonan
  const playingRef = useRef(null)

  /**
   * El clip se descarga y descodifica al montar, no en el primer clic: si se
   * deja para entonces, el primer disparo llega tarde o suena el sintetizado
   * —otro sonido— mientras termina de descodificar. El AudioContext se puede
   * crear sin gesto del usuario; nace suspendido y se reanuda en el clic.
   */
  useEffect(() => {
    let alive = true
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return undefined

    let ctx
    try {
      ctx = new Ctx()
    } catch {
      return undefined
    }
    ctxRef.current = ctx

    if (HIT_CLIP) {
      fetch(BASE + HIT_CLIP)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          if (alive) bufferRef.current = buffer
        })
        .catch(() => {
          // sin clip suena el rebote sintetizado
        })
    }

    return () => {
      alive = false
      ctxRef.current = null
      ctx.close?.()
    }
  }, [])

  /**
   * Corta lo que esté sonando. Con una rampa de 12 ms, no en seco: parar un
   * buffer a mitad de onda mete un chasquido.
   */
  const cut = (ctx) => {
    const prev = playingRef.current
    if (!prev) return
    playingRef.current = null
    try {
      const t = ctx.currentTime
      prev.gain.gain.cancelScheduledValues(t)
      prev.gain.gain.setValueAtTime(prev.gain.gain.value, t)
      prev.gain.gain.linearRampToValueAtTime(0.0001, t + 0.012)
      prev.src.stop(t + 0.015)
    } catch {
      // ya había terminado por su cuenta
    }
  }

  return useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()

    cut(ctx)

    const buffer = bufferRef.current
    if (!buffer) {
      // el clip aún no está listo (o no cargó): suena el rebote sintetizado
      playRicochet(ctx)
      return
    }

    const src = ctx.createBufferSource()
    src.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = 0.9
    src.connect(gain)
    gain.connect(ctx.destination)
    src.onended = () => {
      if (playingRef.current?.src === src) playingRef.current = null
    }
    src.start()
    playingRef.current = { src, gain }
  }, [])
}

/**
 * Placa. Empieza **volteada**: solo se ve el dorso, metal apagado y sin marcar.
 * Al dispararle voltea sobre su eje horizontal y enseña la cara: la estrella de
 * latón con la abreviatura grabada, y debajo aparecen el nombre de la skill y
 * el nivel. Los disparos siguientes le dan otra vuelta entera y la dejan
 * enseñando la cara.
 *
 * Las dos caras son dos capas HTML con `backface-visibility: hidden`, no dos
 * grupos del mismo SVG: Chrome no compone en 3D los hijos de un `<svg>`, así
 * que dentro del SVG el dorso se vería a través de la cara.
 */
function Badge({ abbr, level, wide, spin, revealed, hiddenLabel, onShoot }) {
  const clipId = `badge-fill-${abbr.replace(/\W/g, '')}`

  return (
    <button
      type="button"
      className={`badge ${revealed ? 'is-revealed' : ''}`}
      onClick={onShoot}
      style={{ '--spin': `${spin}deg` }}
      aria-label={revealed ? `${abbr}, ${level}%` : hiddenLabel}
      aria-pressed={revealed}
    >
      <span className="badge-flip">
        {/* dorso: la misma pieza sin marcar */}
        <span className="badge-face badge-back">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <g filter="url(#badge-rough)">
              <path d={STAR_D} fill="url(#badge-dull)" />
              <path className="badge-edge" d={STAR_D} />
              {BALLS.map((p, i) => (
                <circle key={i} className="badge-ball is-dull" cx={p.cx} cy={p.cy} r="4.4" />
              ))}
            </g>
            <circle className="badge-inner" cx="50" cy="50" r="19" />
          </svg>
          <b className="badge-mark">?</b>
        </span>

        {/* cara: latón hasta el nivel, con la abreviatura */}
        <span className="badge-face badge-front">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <clipPath id={clipId}>
                <motion.rect
                  x="0"
                  width="100"
                  initial={{ y: 100, height: 0 }}
                  animate={revealed ? { y: 100 - level, height: level } : { y: 100, height: 0 }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
                />
              </clipPath>
            </defs>

            <g filter="url(#badge-rough)">
              {/* metal sin marcar */}
              <path d={STAR_D} fill="url(#badge-dull)" />
              {/* latón hasta el nivel */}
              <g clipPath={`url(#${clipId})`}>
                <path d={STAR_D} fill="url(#badge-gold)" filter="url(#badge-worn)" />
              </g>
              {/* reflejo y contorno, por encima del relleno */}
              <path d={STAR_D} fill="url(#badge-sheen)" />
              <path className="badge-edge" d={STAR_D} />

              {BALLS.map((p, i) => (
                <circle key={i} className="badge-ball" cx={p.cx} cy={p.cy} r="4.4" />
              ))}
            </g>

            {/* aro grabado del centro: fuera del filtro, o el texto baila */}
            <circle className="badge-inner" cx="50" cy="50" r="19" />
          </svg>
          <b className={wide ? 'is-wide' : undefined}>{abbr}</b>
        </span>
      </span>
    </button>
  )
}

/**
 * Celda: la placa y, debajo, el nombre y el nivel — que no se leen hasta que
 * la placa recibe su disparo. El primer disparo la voltea media vuelta; los
 * siguientes le dan una entera, así que se queda siempre de cara.
 */
function SkillCell({ skill, hiddenLabel, onShoot }) {
  const [shots, setShots] = useState(0)
  const revealed = shots > 0

  const shoot = () => {
    setShots((n) => n + 1)
    onShoot()
  }

  return (
    <div className={`badge-cell ${revealed ? 'is-revealed' : ''}`}>
      <Badge
        abbr={skill.abbr}
        level={skill.level}
        wide={skill.abbr.length > 3}
        spin={shots === 0 ? 0 : 180 + (shots - 1) * 360}
        revealed={revealed}
        hiddenLabel={hiddenLabel}
        onShoot={shoot}
      />
      <span className="badge-name">{skill.name}</span>
      <span className="badge-level">{skill.level}%</span>
    </div>
  )
}

/**
 * Reparte las placas en pirámide: la fila de arriba con una, y cada fila
 * siguiente con más. Se ordenan por nivel, así que la cima es la skill más
 * dominada. Si sobran o faltan, la última fila absorbe la diferencia.
 */
function pyramid(items, shape = [1, 3, 4]) {
  const sorted = [...items].sort((a, b) => b.level - a.level)
  const rows = []
  let i = 0
  shape.forEach((n, r) => {
    const last = r === shape.length - 1
    rows.push(sorted.slice(i, last ? undefined : i + n))
    i += n
  })
  return rows.filter((r) => r.length)
}

/* ------------------------------------------------------- entrada por scroll */

const ENTRY_END = 0.26   // entran volando desde la derecha y se alinean en fila
const ROW_END = 0.38     // la fila se sostiene, todas a la misma altura
const CIRCLE_END = 0.58  // la fila se cierra en círculo y el círculo gira
const SETTLE_END = 0.76  // el círculo se deshace en la pirámide; luego, quietas
const STAGGER = 0.022    // desfase entre placa y placa al entrar

const easeOut = (t) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t

/**
 * Coreografía de entrada, atada al scroll del tramo pegajoso:
 *
 *   1. las placas entran volando desde la derecha, una detrás de otra, y se
 *      alinean en una sola fila a media altura
 *   2. la fila se cierra en círculo y el círculo gira sobre sí mismo
 *   3. el círculo se deshace y cada placa cae en su sitio de la pirámide
 *
 * Se mueve por `transform` sobre la posición que ya tienen en la rejilla, no
 * colocándolas en absoluto: al terminar se limpia el `transform` y quedan
 * exactamente donde las puso el layout, sin acumular error.
 *
 * Mientras vuelan no se puede disparar —`data-stage` lo apaga en CSS—: una
 * placa en movimiento es imposible de acertar y el clic caía en la de al lado.
 */
function useChoreo() {
  const ref = useRef(null)

  useEffect(() => {
    const panel = ref.current
    if (!panel) return undefined

    const grid = panel.querySelector('.badge-pyramid')
    const track = panel.closest('.skills-stage')
    if (!grid || !track) return undefined

    const cells = [...grid.querySelectorAll('.badge-cell')]
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    let raf = 0
    let natural = []
    let painted = []
    let stage = ''

    /** Centro de cada celda dentro de la rejilla. `offsetX` no lo altera el
     *  `transform`, así que la referencia no se contamina con la animación. */
    const measure = () => {
      natural = cells.map((el) => ({
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight / 2,
      }))
    }

    const setStage = (next) => {
      if (next === stage) return
      stage = next
      panel.dataset.stage = next
    }

    /** Deja las placas donde las puso el layout. */
    const rest = () => {
      cells.forEach((el, i) => {
        if (painted[i] === 'rest') return
        painted[i] = 'rest'
        el.style.transform = ''
        el.style.opacity = ''
      })
      setStage('settled')
    }

    const paint = () => {
      raf = 0
      if (reduced.matches) {
        rest()
        return
      }

      const vh = window.innerHeight
      const r = track.getBoundingClientRect()
      const run = Math.max(1, r.height - vh)
      const p = clamp01(-r.top / run)

      if (p >= SETTLE_END) {
        rest()
        return
      }

      const W = grid.clientWidth
      const H = grid.clientHeight
      const n = cells.length
      const cellW = cells[0].offsetWidth
      const cx = W / 2
      const cy = H / 2

      // Fila: todas a la misma altura, repartidas por el ancho útil. El paso se
      // limita al ancho de una placa para que no se solapen en pantallas
      // estrechas, y con el mismo tope la fila queda centrada.
      const step = Math.min((W - cellW) / Math.max(1, n - 1), cellW * 0.62)
      const rowW = step * (n - 1)
      const rowX = (i) => cx - rowW / 2 + step * i
      const rowY = cy

      // Círculo: el radio es el que cabe en la caja, y gira mientras se
      // sostiene y mientras se deshace.
      const radius = Math.min(W, H) * 0.42
      const spin = mix(0, 0.22, clamp01((p - ROW_END) / (SETTLE_END - ROW_END)))

      // fase 2: de la fila al círculo
      const toCircle = easeInOut(clamp01((p - ROW_END) / (CIRCLE_END - ROW_END)))
      // fase 3: del círculo a la pirámide
      const settle = easeInOut(clamp01((p - CIRCLE_END) / (SETTLE_END - CIRCLE_END)))

      cells.forEach((el, i) => {
        const angle = (-0.25 + i / n + spin) * Math.PI * 2
        const circleX = cx + Math.cos(angle) * radius
        const circleY = cy + Math.sin(angle) * radius

        // fase 1: cada placa tiene su propia ventana dentro del tramo de entrada
        const start = i * STAGGER
        const span = Math.max(0.06, ENTRY_END - STAGGER * (n - 1))
        const fly = easeOut(clamp01((p - start) / span))

        // vuelo: desde fuera por la derecha hasta su hueco en la fila
        const flyX = mix(W + 280, rowX(i), fly)
        const flyY = mix(rowY - 30, rowY, fly)

        // fila -> círculo -> rejilla
        const cX = mix(flyX, circleX, toCircle)
        const cY = mix(flyY, circleY, toCircle)
        const tx = mix(cX, natural[i].x, settle)
        const ty = mix(cY, natural[i].y, settle)

        const scale = mix(0.58, 1, settle)
        const spinDeg = mix(-18, 0, settle) + mix(35, 0, fly)
        const opacity = fly

        const key = `${tx | 0},${ty | 0},${scale.toFixed(2)},${spinDeg.toFixed(1)},${opacity.toFixed(2)}`
        if (painted[i] === key) return
        painted[i] = key

        el.style.transform =
          `translate(${(tx - natural[i].x).toFixed(1)}px, ${(ty - natural[i].y).toFixed(1)}px)` +
          ` rotate(${spinDeg.toFixed(1)}deg) scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(2)
      })

      setStage(p < ROW_END ? 'flying' : p < CIRCLE_END ? 'circle' : 'settling')
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }

    const onResize = () => {
      measure()
      onScroll()
    }

    measure()
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    // el tramo cambia de alto con las fuentes y las imágenes: hay que volver a
    // medir o las placas caen desplazadas
    const ro = new ResizeObserver(onResize)
    ro.observe(grid)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return ref
}

/**
 * `true` en pantallas sin puntero fino: el móvil no dispara, toca. Se resuelve
 * con `matchMedia` y no con el ancho, porque hay tablets anchas sin ratón y
 * portátiles estrechos con él.
 */
function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none)')
    const apply = () => setCoarse(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return coarse
}

export default function SkillsPanel({ items, title, sub, hint, hintTouch, hiddenLabel }) {
  const panelRef = useChoreo()
  const coarse = useCoarsePointer()
  const fire = useShot()
  const rows = pyramid(items)
  // la pista se retira en cuanto se dispara la primera placa: ya no hace falta
  const [shot, setShot] = useState(false)

  const onShoot = () => {
    fire()
    setShot(true)
  }

  return (
    <section className="skills-panel" ref={panelRef} data-stage="flying">
      <BadgeDefs />
      <h2 className="panel-title">{title}</h2>
      <p className="panel-sub">{sub}</p>

      <div className="badge-pyramid">
        {rows.map((row, r) => (
          <div className="badge-row" key={r}>
            {row.map((s) => (
              <SkillCell key={s.key} skill={s} hiddenLabel={hiddenLabel} onShoot={onShoot} />
            ))}
          </div>
        ))}
      </div>

      <p className={`skills-hint ${shot ? 'is-done' : ''}`} aria-hidden={shot}>
        <span className="hint-cross" />
        {coarse ? hintTouch || hint : hint}
      </p>
    </section>
  )
}
