/* =========================================================================
   Todo el contenido editable del sitio, en los dos idiomas.

   La estructura de `es` y `en` es idéntica: el componente lee siempre las
   mismas claves y solo cambia el árbol del que tira (ver `src/i18n.jsx`).
   Los datos que no se traducen —correo, teléfono, GitHub, niveles, stacks,
   miniaturas— viven una sola vez en `shared` y se reparten a los dos.
   ========================================================================= */

const shared = {
  name: 'Jesús David Rivera Coronado',
  short: 'Jesús David',
  initials: 'JD',
  phone: '+57 305 420 6322',
  email: 'jdriverac08@gmail.com',
  github: 'https://github.com/wanttoplay123',
  githubLabel: 'github.com/wanttoplay123',
  reward: '$1,000,000',
}

/** Niveles y abreviaturas de las placas: iguales en los dos idiomas. */
const skillMeta = [
  { key: 'php', abbr: 'PHP', level: 95 },
  { key: 'js', abbr: 'JS', level: 92 },
  { key: 'pg', abbr: 'PG', level: 90 },
  { key: 'css', abbr: 'CSS', level: 90 },
  { key: 'db', abbr: 'DB', level: 85 },
  { key: 'rtc', abbr: 'RTC', level: 85 },
  { key: 'docker', abbr: 'DKR', level: 80 },
  { key: 'git', abbr: 'GIT', level: 90 },
]

/** Nombre de cada placa por idioma; el resto sale de `skillMeta`. */
const skillNames = {
  es: {
    php: 'PHP / Laravel',
    js: 'JavaScript / Node',
    pg: 'PostgreSQL',
    css: 'HTML / CSS',
    db: 'MongoDB / Redis',
    rtc: 'WebSockets / WebRTC',
    docker: 'Docker / IaC',
    git: 'Git / GitHub',
  },
  en: {
    php: 'PHP / Laravel',
    js: 'JavaScript / Node',
    pg: 'PostgreSQL',
    css: 'HTML / CSS',
    db: 'MongoDB / Redis',
    rtc: 'WebSockets / WebRTC',
    docker: 'Docker / IaC',
    git: 'Git / GitHub',
  },
}

const buildSkills = (lang) =>
  skillMeta.map((s) => ({ ...s, name: skillNames[lang][s.key] }))

/** Lo que no cambia de cada proyecto: número, año, miniatura y stack. */
const projectMeta = {
  videollamadas: {
    id: 'videollamadas',
    number: '01',
    year: '2026',
    bounty: '$500,000',
    thumb: 'assets/project-video-calls.webp',
    stack: ['Node.js', 'WebSocket', 'LiveKit', 'MongoDB', 'Redis', 'Docker'],
  },
  brawlhalla: {
    id: 'brawlhalla',
    number: '02',
    year: '2026',
    bounty: '$350,000',
    thumb: 'assets/project-brawlhalla.webp',
    stack: ['Node.js', 'Express', 'PostgreSQL', 'Netlify', 'Render'],
  },
  embarazo: {
    id: 'embarazo',
    number: '03',
    year: '2026',
    bounty: '$100,000',
    thumb: 'assets/project-pregnancy-guide.webp',
    stack: ['HTML', 'CSS Grid', 'JavaScript'],
  },
}

/* ------------------------------------------------------------------ español */

const es = {
  profile: {
    ...shared,
    role: 'Desarrollador Full Stack',
    tagline: 'Developer / Designer',
    location: 'Cartagena de Indias, Colombia',
    quote:
      'No solo escribo código: diseño soluciones, cuento historias y construyo experiencias que dejan huella.',
    about: [
      'Desarrollador Full Stack con 4 años y medio de experiencia construyendo, desplegando y manteniendo aplicaciones web en producción.',
      'Especializado en PHP y Laravel sobre PostgreSQL, con diseño de APIs REST y optimización de consultas. Construyo además sistemas propios en Node.js y Express con arquitectura por capas, autenticación JWT con roles y comunicación en tiempo real por WebSockets.',
      'Llevo mis proyectos hasta producción por mi cuenta: despliegue en la nube, contenedores e infraestructura como código. Estudiante de Ingeniería de Sistemas, 10° semestre.',
    ],
  },

  ui: {
    menu: 'Menú',
    close: 'Cerrar',
    langLabel: 'Idioma',
    kicker: '✦ Bienvenido a mi mundo ✦',
    heroLead: 'Construyo',
    heroWord: 'experiencias',
    heroSub: 'Por las que vale la pena ser buscado',
    heroCta: 'Ver mi trabajo',
    statsTag: 'El código es mi bala · El diseño es mi blanco',
    statsSub: 'Cuatro años y medio llevando aplicaciones web hasta producción.',
    aboutTitle: 'Sobre mí',
    toolsTitle: '✦ Herramientas del oficio ✦',
    skillsTitle: '✦ Mis habilidades ✦',
    skillsSub: 'Cada placa marcada con el nivel de dominio',
    skillsHint: 'Dispara a las placas para descubrirlas',
    badgeHidden: 'Placa sin identificar — dispara para verla',
    projectsTitle: '✦ Los más buscados ✦',
    projectsSub: 'Tres casos sobre la mesa. Abre el expediente.',
    viewCase: 'Ver el caso',
    wanted: 'Se busca',
    experienceTitle: 'Experiencia',
    educationTitle: '✦ Formación ✦',
    contactTitle: '✦ Hagamos algo legendario ✦',
    contactLead: '¿Tienes una idea? Hablemos y hagámosla realidad.',
    contactCta: 'Hablemos',
    footLine1: '← El código es mi bala →',
    footLine2: '← El diseño es mi blanco →',
  },

  aboutFacts: [
    { label: 'Ubicación', value: 'Cartagena de Indias, Colombia' },
    { label: 'Experiencia', value: '4 años y medio' },
    { label: 'Estudios', value: 'Ing. de Sistemas, 10° semestre' },
    { label: 'Enfoque', value: 'Backend, APIs y despliegue' },
  ],

  heroFacts: [
    { value: '4.5', label: 'años de experiencia' },
    { value: '70+', label: 'endpoints en producción' },
    { value: '3', label: 'proyectos propios desplegados' },
    { value: '10°', label: 'semestre Ing. Sistemas' },
  ],

  projects: [
    {
      ...projectMeta.videollamadas,
      title: 'Plataforma de Videollamadas',
      category: 'Tiempo real · WebRTC',
      summary:
        'Sistema de videoconferencia con salas, sala de espera con admisión por moderador, chat, encuestas en vivo, mano alzada, compartir pantalla y moderación por roles.',
      bullets: [
        'Servidor de señalización sobre WebSockets (ws): estado de sala, heartbeat cada 30 s, periodo de gracia ante reconexión, limpieza escalonada de sesiones huérfanas y tope de 50 participantes por sala.',
        'Rate limiting a nivel de socket (20 mensajes/segundo por cliente) y rate limiting HTTP respaldado por Redis para resistir abuso y flooding.',
        'Audio y vídeo con LiveKit (WebRTC): el servidor firma tokens de acceso con permisos por participante y delega el tráfico multimedia.',
        'Backend en capas (routes, controllers, services, models) con siete servicios desacoplados y middleware propio de autenticación, validación y manejo centralizado de errores.',
        'Seguridad con JWT y token de refresco, bcrypt, Helmet, validación de esquemas con Zod y arranque bloqueado si faltan los secretos del entorno.',
        'Despliegue con Docker Compose (healthchecks, dependencias condicionadas, volúmenes persistentes), procesos en producción bajo PM2 y túnel de Cloudflare.',
        'Suite de pruebas automatizadas propia: carga, fugas de memoria, roles, moderación y seguridad.',
      ],
    },
    {
      ...projectMeta.brawlhalla,
      title: 'Liga Brawlhalla',
      category: 'Plataforma en producción',
      summary:
        'Plataforma completa de gestión de liga competitiva: inscripciones, calendario por jornadas, resultados, clasificación, torneos con playoffs y repechaje, y estadísticas históricas.',
      bullets: [
        'API REST propia de más de 70 endpoints en Node.js y Express, organizada por recurso y con rutas administrativas separadas y protegidas.',
        'Autenticación JWT con bcrypt y middleware de autorización por rol (administrador / jugador).',
        'PostgreSQL con consultas parametrizadas frente a inyección SQL y agregaciones para tablas de posiciones, rachas, head-to-head y ranking de personajes.',
        'Integración con la API pública de Brawlhalla para verificar identidades y sincronizar nickname y rango oficial.',
        'Parser binario de archivos replay escrito desde cero: descompresión zlib, lectura a nivel de bit y desofuscación XOR para extraer ganador, KOs y personajes automáticamente.',
        'Despliegue en la nube: frontend estático en Netlify, API en Render y PostgreSQL gestionada, unidos por un proxy bajo un mismo dominio que evita problemas de CORS.',
      ],
    },
    {
      ...projectMeta.embarazo,
      title: 'Guía de Factores de Riesgo en el Embarazo',
      category: 'Proyecto académico · Front-end',
      summary:
        'Sitio informativo de contenido clínico construido sin framework para la Universidad del Sinú.',
      bullets: [
        'Diseño responsive con CSS Grid y consultas de medios para móvil, tablet y escritorio.',
        'Navegación e interacciones dinámicas en JavaScript nativo, sin dependencias externas.',
      ],
    },
  ],

  skills: buildSkills('es'),

  skillGroups: [
    { label: 'Lenguajes', items: 'PHP · JavaScript (Node.js) · SQL · HTML · CSS' },
    { label: 'Frameworks', items: 'Laravel · Blade · Express · Mongoose · Zod · Helmet' },
    { label: 'Bases de datos', items: 'PostgreSQL · MongoDB · Redis — modelado, consultas complejas, optimización, caché' },
    { label: 'APIs y tiempo real', items: 'REST · OpenAPI/Swagger · JWT con token de refresco · WebSockets · WebRTC · rate limiting' },
    { label: 'Despliegue', items: 'Netlify · Render · bases de datos gestionadas · Cloudflare Tunnel · separación de entornos' },
    { label: 'Infraestructura', items: 'Docker · Docker Compose · PM2 · Terraform · Pulumi' },
    { label: 'Seguridad', items: 'bcrypt · control de acceso por roles · validación de esquemas · consultas parametrizadas · cabeceras HTTP' },
    { label: 'Datos', items: 'Reportes y gráficos desde bases de datos · exportación a Excel' },
  ],

  experience: [
    {
      role: 'Desarrollador Junior Full Stack',
      org: 'Fundación Universitaria Tecnológico Comfenalco',
      place: 'Cartagena, Colombia',
      period: 'Febrero 2023 — Actualidad',
      bullets: [
        'Desarrollé y mantuve aplicativos web académicos y administrativos en PHP y Laravel, usados a diario por áreas de la universidad.',
        'Diseñé e implementé endpoints REST y la lógica de negocio backend, con validación de entrada y manejo consistente de errores y códigos de estado HTTP.',
        'Modelé, consulté y optimicé bases de datos PostgreSQL revisando consultas lentas, índices y normalización.',
        'Automaticé el aprovisionamiento de infraestructura IaaS y PaaS con Terraform y Pulumi, logrando entornos reproducibles y auditables.',
        'Ejecuté pruebas funcionales en servidores de prueba antes de cada despliegue a producción, reduciendo regresiones.',
        'Brindé soporte técnico de segundo nivel a los sistemas institucionales desplegados.',
      ],
    },
    {
      role: 'Desarrollador web freelance',
      org: 'Desarrollo web independiente',
      place: 'Cartagena, Colombia',
      period: 'Febrero 2022 — Enero 2023',
      bullets: [
        'Desarrollé sitios y aplicaciones web a medida para clientes particulares, encargándome del proyecto completo: requisitos, construcción, pruebas y entrega.',
        'Implementé interfaces con HTML, CSS y JavaScript y lógica de servidor en PHP, con persistencia en base de datos relacional.',
        'Puse los desarrollos en funcionamiento en hosting del cliente y di soporte y correcciones posteriores a la entrega.',
      ],
    },
  ],

  education: [
    {
      title: 'Ingeniería de Sistemas',
      org: 'Fundación Universitaria Tecnológico Comfenalco',
      period: 'Cursando 10° semestre',
    },
    {
      title: 'Tecnólogo en Desarrollo de Software',
      org: 'Fundación Universitaria Tecnológico Comfenalco',
      period: '2022 — 2025',
    },
  ],

  navItems: [
    { id: 'home', label: 'Inicio' },
    { id: 'skills', label: 'Habilidades' },
    { id: 'about', label: 'Sobre mí' },
    { id: 'projects', label: 'Proyectos' },
    { id: 'experience', label: 'Experiencia' },
    { id: 'contact', label: 'Contacto' },
  ],

  meta: {
    title: 'Jesús David Rivera — Desarrollador Full Stack',
    description:
      'Portafolio de Jesús David Rivera Coronado, desarrollador Full Stack. PHP, Laravel, Node.js, PostgreSQL, WebRTC, Docker.',
  },
}

/* ------------------------------------------------------------------ english */

const en = {
  profile: {
    ...shared,
    role: 'Full Stack Developer',
    tagline: 'Developer / Designer',
    location: 'Cartagena de Indias, Colombia',
    quote:
      "I don't just write code: I design solutions, tell stories and build experiences that leave a mark.",
    about: [
      'Full Stack developer with four and a half years building, shipping and maintaining web applications in production.',
      'Focused on PHP and Laravel over PostgreSQL, designing REST APIs and tuning queries. I also build my own systems in Node.js and Express with a layered architecture, JWT auth with roles and real-time communication over WebSockets.',
      'I take my projects all the way to production on my own: cloud deployment, containers and infrastructure as code. Systems Engineering student, 10th semester.',
    ],
  },

  ui: {
    menu: 'Menu',
    close: 'Close',
    langLabel: 'Language',
    kicker: '✦ Welcome to my world ✦',
    heroLead: 'I build',
    heroWord: 'experiences',
    heroSub: 'Worth getting wanted for',
    heroCta: 'View my work',
    statsTag: 'Code is my bullet · Design is my target',
    statsSub: 'Four and a half years taking web applications to production.',
    aboutTitle: 'About me',
    toolsTitle: '✦ Tools of the trade ✦',
    skillsTitle: '✦ My skills ✦',
    skillsSub: 'Every badge marked with how far it goes',
    skillsHint: 'Shoot the badges to reveal them',
    badgeHidden: 'Unidentified badge — shoot it to reveal',
    projectsTitle: '✦ Most wanted projects ✦',
    projectsSub: 'Three cases on the table. Open the file.',
    viewCase: 'View case',
    wanted: 'Wanted',
    experienceTitle: 'Experience',
    educationTitle: '✦ Education ✦',
    contactTitle: "✦ Let's create something legendary ✦",
    contactLead: 'Got an idea? Let’s talk and make it real.',
    contactCta: "Let's talk",
    footLine1: '← Code is my bullet →',
    footLine2: '← Design is my target →',
  },

  aboutFacts: [
    { label: 'Location', value: 'Cartagena de Indias, Colombia' },
    { label: 'Experience', value: 'Four and a half years' },
    { label: 'Studies', value: 'Systems Engineering, 10th semester' },
    { label: 'Focus', value: 'Backend, APIs and deployment' },
  ],

  heroFacts: [
    { value: '4.5', label: 'years of experience' },
    { value: '70+', label: 'endpoints in production' },
    { value: '3', label: 'own projects shipped' },
    { value: '10th', label: 'semester, Systems Eng.' },
  ],

  projects: [
    {
      ...projectMeta.videollamadas,
      title: 'Video Calling Platform',
      category: 'Real time · WebRTC',
      summary:
        'Video conferencing system with rooms, a waiting room with moderator admission, chat, live polls, raise hand, screen sharing and role-based moderation.',
      bullets: [
        'Signalling server over WebSockets (ws): room state, a 30 s heartbeat, a grace period on reconnect, staggered cleanup of orphan sessions and a cap of 50 participants per room.',
        'Socket-level rate limiting (20 messages per second per client) and Redis-backed HTTP rate limiting to hold up against abuse and flooding.',
        'Audio and video through LiveKit (WebRTC): the server signs access tokens with per-participant permissions and hands off the media traffic.',
        'Layered backend (routes, controllers, services, models) with seven decoupled services and its own auth, validation and centralized error-handling middleware.',
        'Security with JWT plus refresh token, bcrypt, Helmet, schema validation with Zod, and a startup that refuses to boot when environment secrets are missing.',
        'Deployment with Docker Compose (healthchecks, conditional dependencies, persistent volumes), production processes under PM2 and a Cloudflare tunnel.',
        'A test suite written from scratch: load, memory leaks, roles, moderation and security.',
      ],
    },
    {
      ...projectMeta.brawlhalla,
      title: 'Brawlhalla League',
      category: 'Platform in production',
      summary:
        'Full competitive-league management platform: sign-ups, a fixture calendar, results, standings, tournaments with playoffs and repechage, and historical stats.',
      bullets: [
        'A REST API of more than 70 endpoints in Node.js and Express, organized by resource, with separate protected admin routes.',
        'JWT auth with bcrypt and role-based authorization middleware (admin / player).',
        'PostgreSQL with parameterized queries against SQL injection, plus aggregations for standings, streaks, head-to-head and character rankings.',
        'Integration with the public Brawlhalla API to verify identities and sync nickname and official rank.',
        'A binary replay-file parser written from scratch: zlib decompression, bit-level reading and XOR deobfuscation to pull winner, KOs and characters automatically.',
        'Cloud deployment: static frontend on Netlify, API on Render and managed PostgreSQL, joined by a proxy under one domain that keeps CORS out of the way.',
      ],
    },
    {
      ...projectMeta.embarazo,
      title: 'Pregnancy Risk Factors Guide',
      category: 'Academic project · Front-end',
      summary:
        'An informational site with clinical content, built without a framework for Universidad del Sinú.',
      bullets: [
        'Responsive design with CSS Grid and media queries for mobile, tablet and desktop.',
        'Navigation and dynamic interactions in plain JavaScript, with no external dependencies.',
      ],
    },
  ],

  skills: buildSkills('en'),

  skillGroups: [
    { label: 'Languages', items: 'PHP · JavaScript (Node.js) · SQL · HTML · CSS' },
    { label: 'Frameworks', items: 'Laravel · Blade · Express · Mongoose · Zod · Helmet' },
    { label: 'Databases', items: 'PostgreSQL · MongoDB · Redis — modelling, complex queries, tuning, caching' },
    { label: 'APIs and real time', items: 'REST · OpenAPI/Swagger · JWT with refresh token · WebSockets · WebRTC · rate limiting' },
    { label: 'Deployment', items: 'Netlify · Render · managed databases · Cloudflare Tunnel · environment separation' },
    { label: 'Infrastructure', items: 'Docker · Docker Compose · PM2 · Terraform · Pulumi' },
    { label: 'Security', items: 'bcrypt · role-based access control · schema validation · parameterized queries · HTTP headers' },
    { label: 'Data', items: 'Reports and charts straight from the database · Excel export' },
  ],

  experience: [
    {
      role: 'Junior Full Stack Developer',
      org: 'Fundación Universitaria Tecnológico Comfenalco',
      place: 'Cartagena, Colombia',
      period: 'February 2023 — Present',
      bullets: [
        'Built and maintained academic and administrative web applications in PHP and Laravel, used daily across university departments.',
        'Designed and implemented REST endpoints and backend business logic, with input validation and consistent error and HTTP status handling.',
        'Modelled, queried and tuned PostgreSQL databases by going through slow queries, indexes and normalization.',
        'Automated IaaS and PaaS infrastructure provisioning with Terraform and Pulumi, getting reproducible and auditable environments.',
        'Ran functional tests on staging servers before every production deploy, cutting down regressions.',
        'Provided second-level technical support for the deployed institutional systems.',
      ],
    },
    {
      role: 'Freelance web developer',
      org: 'Independent web development',
      place: 'Cartagena, Colombia',
      period: 'February 2022 — January 2023',
      bullets: [
        'Built custom sites and web applications for private clients, owning the whole project: requirements, build, testing and delivery.',
        'Implemented interfaces with HTML, CSS and JavaScript and server logic in PHP, with persistence in a relational database.',
        'Put the work live on the client’s hosting and handled support and fixes after delivery.',
      ],
    },
  ],

  education: [
    {
      title: 'Systems Engineering',
      org: 'Fundación Universitaria Tecnológico Comfenalco',
      period: 'Currently in the 10th semester',
    },
    {
      title: 'Software Development Technologist',
      org: 'Fundación Universitaria Tecnológico Comfenalco',
      period: '2022 — 2025',
    },
  ],

  navItems: [
    { id: 'home', label: 'Home' },
    { id: 'skills', label: 'Skills' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'experience', label: 'Experience' },
    { id: 'contact', label: 'Contact' },
  ],

  meta: {
    title: 'Jesús David Rivera — Full Stack Developer',
    description:
      'Portfolio of Jesús David Rivera Coronado, Full Stack developer. PHP, Laravel, Node.js, PostgreSQL, WebRTC, Docker.',
  },
}

export const content = { es, en }
export const LANGS = [
  { id: 'es', label: 'ES', title: 'Español' },
  { id: 'en', label: 'EN', title: 'English' },
]
