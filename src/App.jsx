import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ScrollVideo from './components/ScrollVideo.jsx'
import Tilt from './components/Tilt.jsx'
import SkillsPanel from './components/Skills.jsx'
import {
  GithubIcon,
  LinkedinIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  StarDivider,
} from './components/Icons.jsx'
import { useLang } from './i18n.jsx'

const BASE = import.meta.env.BASE_URL
const asset = (p) => BASE + p

/**
 * El canvas de polvo arrastra three + fiber + drei, que pesan más que todo lo
 * demás junto y solo son decoración de fondo. Se carga aparte y después, para
 * que la portada pinte sin esperarlos.
 */
const Scene3D = lazy(() => import('./components/Scene3D.jsx'))

/* ------------------------------------------------------------------ reveal */

const reveal = {
  hidden: { opacity: 0, y: 34 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
}

function Reveal({ children, delay = 0, className = '', as = 'div' }) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.25 }}
      transition={{ delay }}
    >
      {children}
    </Tag>
  )
}

function SectionTitle({ children }) {
  return (
    <Reveal className="section-title">
      <StarDivider className="rule" />
      <h2>{children}</h2>
      <StarDivider className="rule" />
    </Reveal>
  )
}

/* -------------------------------------------------------------------- props */

/** Prop decorativo (imagen) que deriva con el puntero. */
function Prop({ src, className, depth = 20 }) {
  const ref = useRef(null)
  useEffect(() => {
    const onMove = (e) => {
      if (!ref.current) return
      ref.current.style.setProperty('--px', `${(e.clientX / window.innerWidth - 0.5) * depth}px`)
      ref.current.style.setProperty('--py', `${(e.clientY / window.innerHeight - 0.5) * depth}px`)
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [depth])
  return (
    <img
      ref={ref}
      className={`prop ${className}`}
      src={asset(src)}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
    />
  )
}

/** Penacho de humo continuo: varias volutas desfasadas saliendo del cañón. */
function Smoke({ puffs = 5 }) {
  return (
    <span className="smoke" aria-hidden="true">
      {Array.from({ length: puffs }, (_, i) => (
        <span
          key={i}
          className="puff"
          style={{
            backgroundImage: `url(${asset(`assets/smoke-${(i % 4) + 1}.webp`)})`,
            animationDelay: `${(i * 8) / puffs}s`,
            '--drift': `${(i % 2 ? 1 : -1) * (12 + (i % 4) * 9)}px`,
            '--scale': 2.2 + (i % 3) * 0.7,
            '--spin0': `${i * 37}deg`,
            '--spin': `${(i % 2 ? 1 : -1) * (55 + (i % 3) * 30)}deg`,
          }}
        />
      ))}
    </span>
  )
}

/* ------------------------------------------------------------------------ nav */

/** Conmutador de idioma: dos botones, el activo marcado. */
function LangSwitch() {
  const { lang, setLang, langs, c } = useLang()
  return (
    <div className="lang-switch" role="group" aria-label={c.ui.langLabel}>
      {langs.map((l) => (
        <button
          key={l.id}
          type="button"
          className={l.id === lang ? 'is-active' : ''}
          onClick={() => setLang(l.id)}
          aria-pressed={l.id === lang}
          title={l.title}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Salto a una sección con animación propia, no con `behavior: 'smooth'`: el
 * suavizado del navegador dura lo mismo para un salto de media pantalla que
 * para uno de ocho mil píxeles, y en los tramos largos el vídeo scrubbed y la
 * entrada de las placas pasaban de golpe, sin verse.
 *
 * Aquí el tiempo crece con la distancia —con tope— y la curva es suave por los
 * dos extremos, así que la transición se aprecia. Cualquier gesto del usuario
 * (rueda, dedo, teclas) la cancela: quedarse atrapado en un scroll automático
 * es de las cosas que más molestan de una página.
 */
function animatedScrollTo(target) {
  const start = window.scrollY
  const max = document.documentElement.scrollHeight - window.innerHeight
  const end = Math.max(0, Math.min(max, target))
  const distance = end - start

  if (Math.abs(distance) < 4) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top: end, behavior: 'instant' })
    return
  }

  // ~0.55 ms por píxel, entre 0.8 s y 2.6 s: lo justo para leer la transición
  // sin que se haga esperar desde el pie de la página.
  const duration = Math.min(2600, Math.max(800, Math.abs(distance) * 0.55))
  const t0 = performance.now()
  let raf = 0

  const stop = () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('wheel', stop)
    window.removeEventListener('touchstart', stop)
    window.removeEventListener('keydown', stop)
  }

  const step = (now) => {
    const t = Math.min(1, (now - t0) / duration)
    // easeInOutCubic: arranca y frena despacio
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    window.scrollTo({ top: start + distance * e, behavior: 'instant' })
    if (t < 1) raf = requestAnimationFrame(step)
    else stop()
  }

  window.addEventListener('wheel', stop, { passive: true, once: true })
  window.addEventListener('touchstart', stop, { passive: true, once: true })
  window.addEventListener('keydown', stop, { once: true })
  raf = requestAnimationFrame(step)
}

/**
 * Destino de cada sección. «Habilidades» es el caso raro: su tramo mide 260 vh
 * y las placas entran volando durante el primer tercio, así que caer en el
 * borde de arriba dejaba al visitante mirando placas en movimiento y sin poder
 * dispararles. Se salta al 80 % del tramo, que es donde ya están colocadas.
 */
function scrollToSection(id) {
  const el = document.getElementById(id)
  if (!el) return
  const top =
    id === 'skills'
      ? el.offsetTop + Math.max(0, el.offsetHeight - window.innerHeight) * 0.8
      : el.getBoundingClientRect().top + window.scrollY - 90
  animatedScrollTo(top)
}

function Nav({ active }) {
  const { c } = useLang()
  const { profile, navItems, ui } = c
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav ${solid ? 'is-solid' : ''}`}>
      <a
        className="brand"
        href="#home"
        onClick={(e) => {
          e.preventDefault()
          setOpen(false)
          scrollToSection('home')
        }}
      >
        <span className="monogram">{profile.initials}</span>
        <span className="brand-text">
          <strong>{profile.short.toUpperCase()}</strong>
          <em>{profile.tagline}</em>
        </span>
      </a>

      <button
        className={`burger ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={ui.menu}
        aria-expanded={open}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={`nav-links ${open ? 'is-open' : ''}`}>
        {navItems.map((item, i) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={active === item.id ? 'is-active' : ''}
            onClick={(e) => {
              e.preventDefault()
              setOpen(false)
              scrollToSection(item.id)
            }}
          >
            {item.label}
            {i < navItems.length - 1 && <b className="sep">✦</b>}
          </a>
        ))}
        <LangSwitch />
      </nav>
    </header>
  )
}

/* ------------------------------------------------------------------- proyectos */

function ProjectCard({ project, onOpen }) {
  const { c } = useLang()
  return (
    <Tilt max={10} scale={1.04} className="card-tilt">
      <article className="poster-card" onClick={() => onOpen(project)}>
        <span className="card-number">{project.number}</span>
        <h3>{project.title}</h3>
        <div className="card-photo">
          <img src={asset(project.thumb)} alt={project.title} loading="lazy" decoding="async" />
        </div>
        <p className="card-cat">{project.category}</p>
        <button className="btn btn-frame btn-sm" type="button">
          {c.ui.viewCase}
        </button>
      </article>
    </Tilt>
  )
}

function ProjectModal({ project, onClose }) {
  const { c } = useLang()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal paper"
        initial={{ opacity: 0, y: 60, rotateX: -8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label={c.ui.close}>
          ✕
        </button>
        <span className="wanted-tag">
          ← {c.ui.wanted} {project.number} →
        </span>
        <h3>{project.title}</h3>
        <p className="modal-cat">
          {project.category} · {project.year}
        </p>
        <p className="modal-summary">{project.summary}</p>
        <ul className="modal-list">
          {project.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
        <div className="chips">
          {project.stack.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

/** Los tres carteles apoyados sobre la mesa del forajido (`assets/table-scene.webp`).
 *  La foto ya trae el cartel SE BUSCA, el farol y el revólver en los bordes;
 *  el centro es tabla vacía y ahí caen las tarjetas. */
function ProjectsTable({ onOpen }) {
  const { c } = useLang()
  return (
    <section className="mesa" id="projects">
      <div className="mesa-inner">
        <h2 className="panel-title mesa-title">{c.ui.projectsTitle}</h2>
        <p className="panel-sub">{c.ui.projectsSub}</p>
        <div className="mesa-cards">
          {c.projects.map((p) => (
            <ProjectCard key={p.id} project={p} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  )
}

/**
 * Apaga el contenido de la portada en cuanto arranca el scroll: a partir de
 * ahí el vídeo corre limpio y no se le monta nada encima. Devuelve un ref para
 * el contenedor, sobre el que escribe `--hero-in` (1 -> 0).
 *
 * Va por rAF y no por un `transition`: el valor tiene que seguir al scroll,
 * no llegar tarde. Solo escribe cuando el valor cambia de verdad, porque
 * tocar `style` invalida el estilo del nodo aunque se repita el mismo valor.
 */
function useHeroFade() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let painted = -1
    const paint = () => {
      raf = 0
      // se apaga en los primeros 55% de pantalla de scroll
      const d = window.innerHeight * 0.55
      const v = Math.max(0, Math.min(1, 1 - window.scrollY / d))
      const rounded = Math.round(v * 100) / 100
      if (rounded === painted) return
      painted = rounded
      el.style.setProperty('--hero-in', rounded)
      // sin esto, los enlaces invisibles seguirían siendo clicables
      el.dataset.heroOut = rounded <= 0.01 ? '1' : '0'
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])
  return ref
}

/**
 * Aparición por fundido según lo cerca que esté el elemento del borde superior
 * del viewport. Se usa en la banda de proyectos: entrar solo por scroll la
 * dejaba media pantalla dentro cuando el vídeo aún iba por la mitad. Con el
 * fundido se controla el momento exacto sin depender de lo largo que sea el
 * tramo vacío: las placas ya están puestas cuando el vídeo va por su último
 * plano, no asomando justo en el corte.
 */
function useEnterFade({ from = 0.95, to = 0.5 } = {}) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    let painted = -1
    const paint = () => {
      raf = 0
      const vh = window.innerHeight
      const top = el.getBoundingClientRect().top / vh
      const v = Math.max(0, Math.min(1, (from - top) / (from - to)))
      const rounded = Math.round(v * 100) / 100
      if (rounded === painted) return
      painted = rounded
      el.style.setProperty('--enter', rounded)
      el.dataset.entered = rounded > 0.01 ? '1' : '0'
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint)
    }
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [from, to])
  return ref
}

/* ------------------------------------------------------------------- portada */

function Stage() {
  const fadeRef = useHeroFade()
  const { c } = useLang()
  const { profile, ui, heroFacts } = c
  return (
    <section id="home" className="stage" ref={fadeRef}>
      <Prop src="assets/rider.webp" className="rider" depth={8} />

      {/* fijos: sin seguimiento del puntero */}
      <div className="prop prop-box revolver revolver-l" aria-hidden="true">
        <img className="revolver-art" src={asset('assets/revolver-left.webp')} alt="" />
        <Smoke />
      </div>
      <div className="prop prop-box revolver revolver-r" aria-hidden="true">
        <img className="revolver-art" src={asset('assets/revolver-right.webp')} alt="" />
        <Smoke />
      </div>

      {/* ---------------------------------------------------------- fila 1 */}
      <div className="stage-hero">
        <motion.div
          className="hero-copy"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <span className="kicker">{ui.kicker}</span>
          <h1>
            {ui.heroLead}
            <br />
            <span className="stroke">{ui.heroWord}</span>
          </h1>
          <p className="hero-sub">{ui.heroSub}</p>
          <a
            className="btn btn-frame"
            href="#projects"
            onClick={(e) => {
              e.preventDefault()
              scrollToSection('projects')
            }}
          >
            {ui.heroCta}
          </a>
          <div className="socials">
            <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
              <GithubIcon />
            </a>
            <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <LinkedinIcon />
            </a>
            <a href={`mailto:${profile.email}`} aria-label="Email">
              <MailIcon />
            </a>
          </div>
        </motion.div>

        <div className="hero-side">
          <img
            className="palace"
            src={asset('assets/palace.webp')}
            alt=""
            aria-hidden="true"
            decoding="async"
          />
          <Reveal className="hero-quote" delay={0.45}>
            <Tilt max={8}>
              <figure className="paper">
                <span className="quote-mark">“</span>
                <blockquote>{profile.quote}</blockquote>
                <figcaption>{profile.short}</figcaption>
              </figure>
            </Tilt>
          </Reveal>
        </div>
      </div>

      {/* Franja de cifras al pie de la portada. Va aquí y no en una sección
          propia para no partir el recorrido del vídeo, y pegada abajo porque
          la cara del plano vive siempre en la mitad superior. */}
      <div className="hero-stats">
        <p className="hero-stats-tag">{ui.statsTag}</p>
        <p className="hero-stats-sub">{ui.statsSub}</p>
        <dl className="hero-stats-grid">
          {heroFacts.map((f) => (
            <Reveal key={f.label} className="hero-stat" as="div">
              <dt>{f.value}</dt>
              <dd>{f.label}</dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ---------------------------------------------------------------------- about */

function About() {
  const { c } = useLang()
  const { profile, ui, aboutFacts, skillGroups } = c

  return (
    <section id="about" className="section about">
      <SectionTitle>{ui.aboutTitle}</SectionTitle>

      <div className="about-grid">
        {/* Ficha: retrato y los datos duros. Va a la izquierda para que la
            columna de texto arranque a media página y no quede un hueco. */}
        <Reveal className="about-card">
          <Tilt max={6} scale={1.02}>
            <div className="about-card-inner">
              <div className="about-photo">
                <img
                  src={asset('assets/portrait.webp')}
                  alt={profile.name}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <h3>{profile.name}</h3>
              <p className="about-role">{profile.role}</p>
              <dl className="about-facts">
                {aboutFacts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="about-links">
                <a href={profile.github} target="_blank" rel="noreferrer" aria-label="GitHub">
                  <GithubIcon />
                </a>
                <a href={profile.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn">
                  <LinkedinIcon />
                </a>
                <a href={`mailto:${profile.email}`} aria-label="Email">
                  <MailIcon />
                </a>
                <a href={`tel:${profile.phone.replace(/\s/g, '')}`} aria-label={profile.phone}>
                  <PhoneIcon />
                </a>
              </div>
            </div>
          </Tilt>
        </Reveal>

        <div className="about-copy">
          {profile.about.map((p, i) => (
            <Reveal key={i} delay={i * 0.1} as="p">
              {p}
            </Reveal>
          ))}
          <Reveal delay={0.3} className="about-quote">
            <span className="quote-mark">“</span>
            <blockquote>{profile.quote}</blockquote>
          </Reveal>
        </div>
      </div>

      <Reveal className="skill-groups-head" as="h3">
        {ui.toolsTitle}
      </Reveal>

      <div className="skill-groups">
        {skillGroups.map((g, i) => (
          <Reveal key={g.label} delay={i * 0.05} className="skill-group">
            <h4>{g.label}</h4>
            <p>{g.items}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

/* --------------------------------------------------------------------- saloon */

/**
 * Experiencia: línea de tiempo centrada. Antes vivía pegada a la mitad derecha
 * porque el vídeo enseñaba la escena a la izquierda; el vídeo ya se corta
 * antes de llegar aquí, así que la columna vacía sobraba.
 */
function Saloon() {
  const { c } = useLang()
  const { ui, experience, education } = c

  return (
    <section id="experience" className="saloon">
      <div className="saloon-inner">
        <SectionTitle>{ui.experienceTitle}</SectionTitle>

        <ol className="timeline">
          {experience.map((job, i) => (
            <Reveal key={job.role} delay={i * 0.1} as="li" className="timeline-item">
              <span className="timeline-dot" aria-hidden="true" />
              <div className="timeline-card">
                <div className="timeline-head">
                  <h3>{job.role}</h3>
                  <span className="timeline-period">{job.period}</span>
                </div>
                <p className="timeline-org">
                  {job.org} · {job.place}
                </p>
                <ul>
                  {job.bullets.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>

        <div className="saloon-foot">
          <h3 className="saloon-sub">{ui.educationTitle}</h3>
          <div className="saloon-edu">
            {education.map((e) => (
              <Reveal key={e.title} className="edu-card">
                <h4>{e.title}</h4>
                <p>{e.org}</p>
                <span>{e.period}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  const { c } = useLang()
  return (
    <footer className="footer">
      <small>
        © {new Date().getFullYear()} {c.profile.name} — {c.profile.githubLabel}
      </small>
    </footer>
  )
}

/** Banda desgarrada del final del vídeo: solo las placas de skills. Cae sobre
 *  los últimos segundos, donde la pared del saloon está llena de carteles. Los
 *  proyectos ya no viven aquí: tienen su propia mesa. */
function SkillsBand() {
  const enterRef = useEnterFade()
  const { c } = useLang()
  return (
    <div className="stage-band" ref={enterRef}>
      <SkillsPanel
        items={c.skills}
        title={c.ui.skillsTitle}
        sub={c.ui.skillsSub}
        hint={c.ui.skillsHint}
        hintTouch={c.ui.skillsHintTouch}
        hiddenLabel={c.ui.badgeHidden}
      />
    </div>
  )
}

/** Bloque de contacto. Cierra la página, ya fuera del tramo del vídeo. */
function ContactBlock() {
  const { c } = useLang()
  const { profile, ui } = c

  return (
    <div className="stage-foot" id="contact">
      <Prop src="assets/casings.webp" className="casings" depth={12} />
      <Prop src="assets/lantern.webp" className="lantern" depth={14} />
      <Prop src="assets/hat.webp" className="hat" depth={10} />

      <div className="foot-contact">
        <h2>{ui.contactTitle}</h2>
        <p>{ui.contactLead}</p>
        <a href={`mailto:${profile.email}`}>
          <MailIcon /> {profile.email}
        </a>
        <a href={`tel:${profile.phone.replace(/\s/g, '')}`}>
          <PhoneIcon /> {profile.phone}
        </a>
        <span>
          <PinIcon /> {profile.location}
        </span>
      </div>

      <div className="foot-center">
        <img src={asset('assets/skull.webp')} alt="" aria-hidden="true" loading="lazy" decoding="async" />
        <p>{ui.footLine1}</p>
        <p>{ui.footLine2}</p>
      </div>

      <div className="foot-cta">
        <a className="btn btn-frame" href={`mailto:${profile.email}`}>
          {ui.contactCta}
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------------ app */

export default function App() {
  const { c } = useLang()
  const { navItems } = c
  const [active, setActive] = useState('home')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -40% 0px' }
    )
    navItems.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [navItems])

  return (
    <>
      <ScrollVideo endSelector=".skills-stage" />
      {/* sin `terrain`: el fondo lo pone el vídeo, del canvas solo queda el polvo */}
      <Suspense fallback={null}>
        <Scene3D terrain={false} />
      </Suspense>
      <div className="vignette" aria-hidden="true" />
      <Nav active={active} />
      <main>
        <Stage />
        {/* Tramo sin contenido: aquí el vídeo corre solo. */}
        <div className="video-gap" aria-hidden="true" />
        {/* Tramo alto con la banda pegada dentro: las placas se quedan en
            pantalla mientras el vídeo gasta su último plano y se funde, en vez
            de irse por arriba y dejar la pantalla vacía. */}
        {/* El ancla vive en el tramo y no en el panel: el panel va pegado
            (`sticky`), así que su posición depende del scroll y saltar a él
            dejaba las placas a media pantalla. */}
        <div className="skills-stage" id="skills">
          <SkillsBand />
        </div>
        <About />
        <ProjectsTable onOpen={setOpen} />
        <Saloon />
        <ContactBlock />
      </main>
      <Footer />
      <AnimatePresence>
        {open && <ProjectModal project={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </>
  )
}
