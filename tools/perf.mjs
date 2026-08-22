import { chromium } from 'playwright'

const url = 'http://localhost:5173/'

/**
 * Mide trabajo real de CPU durante un scroll guiado, vía CDP Performance.
 * Es independiente de la tasa de refresco: si la pantalla cae a 30Hz, los
 * milisegundos de script/estilo/layout/pintado siguen siendo comparables.
 */
async function run(disable = {}) {
  const b = await chromium.launch({ channel: 'chrome' })
  const p = await b.newPage({ viewport: { width: 1440, height: 860 } })
  const cdp = await p.context().newCDPSession(p)
  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => {
    const v = document.querySelector('.scroll-video video')
    return v && v.readyState >= 2
  }, null, { timeout: 60000 }).catch(() => {})
  await p.waitForTimeout(1200)

  await p.evaluate((d) => {
    const css = []
    if (d.grain) css.push('.grain{display:none!important}')
    if (d.backdrop) css.push('.stage-band,.skills-panel{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}')
    if (d.scene3d) css.push('.scene3d{display:none!important}')
    if (d.video) css.push('.scroll-video{display:none!important}')
    if (d.smoke) css.push('.smoke{display:none!important}')
    if (css.length) {
      const s = document.createElement('style')
      s.textContent = css.join('\n')
      document.head.appendChild(s)
    }
  }, disable)
  await p.waitForTimeout(800)

  await cdp.send('Performance.enable')
  const pick = (m) => Object.fromEntries(m.metrics.map((x) => [x.name, x.value]))
  const before = pick(await cdp.send('Performance.getMetrics'))

  await p.evaluate(async () => {
    const max = document.documentElement.scrollHeight - window.innerHeight
    const T = 5000
    const t0 = performance.now()
    await new Promise((resolve) => {
      const step = () => {
        const k = (performance.now() - t0) / T
        window.scrollTo(0, Math.round(max * Math.min(1, k)))
        if (k < 1) requestAnimationFrame(step)
        else resolve()
      }
      step()
    })
  })

  const after = pick(await cdp.send('Performance.getMetrics'))
  const d = (k) => +((after[k] - before[k]) * 1000).toFixed(0)
  await b.close()
  return {
    task: d('TaskDuration'),
    script: d('ScriptDuration'),
    style: d('RecalcStyleDuration'),
    layout: d('LayoutDuration'),
  }
}

const CONFIGS = [
  ['BASE (todo activo)', {}],
  ['sin humo', { smoke: true }],
  ['sin .grain', { grain: true }],
  ['sin backdrop-filter', { backdrop: true }],
  ['sin Scene3D (WebGL)', { scene3d: true }],
  ['sin vídeo', { video: true }],
]
console.log('CPU total durante un scroll guiado de 5s (mediana de 3, menos es mejor)\n')
console.log('config                    tarea    script   estilo   layout')
for (const [label, d] of CONFIGS) {
  const runs = []
  for (let i = 0; i < 3; i++) runs.push(await run(d))
  runs.sort((a, b) => a.task - b.task)
  const m = runs[1]
  console.log(
    `${label.padEnd(24)} ${String(m.task).padStart(5)}ms ${String(m.script).padStart(7)}ms ` +
    `${String(m.style).padStart(7)}ms ${String(m.layout).padStart(7)}ms`
  )
}
