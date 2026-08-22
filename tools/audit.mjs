import { chromium } from 'playwright'
import fs from 'fs'

const url = process.argv[2] || 'http://localhost:5173/'
const outDir = 'shots/audit'
fs.mkdirSync(outDir, { recursive: true })

const VIEWPORTS = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'laptop-1440', width: 1440, height: 860 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
]

const b = await chromium.launch({ channel: 'chrome' })

for (const vp of VIEWPORTS) {
  const p = await b.newPage({ viewport: { width: vp.width, height: vp.height } })
  const problems = []
  p.on('pageerror', (e) => problems.push(`JS ERROR: ${e.message}`))
  p.on('console', (m) => {
    if (m.type() === 'error') problems.push(`CONSOLE: ${m.text()}`)
    if (m.type() === 'warning' && /React|key|prop/i.test(m.text())) problems.push(`WARN: ${m.text()}`)
  })
  p.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`) })

  await p.goto(url, { waitUntil: 'networkidle' })
  await p.waitForFunction(() => {
    const v = document.querySelector('.scroll-video video')
    return v && v.readyState >= 2
  }, null, { timeout: 60000 }).catch(() => problems.push('VIDEO never reached readyState 2'))
  await p.waitForTimeout(1500)

  const info = await p.evaluate(() => {
    const de = document.documentElement
    const out = {
      scrollW: de.scrollWidth,
      clientW: de.clientWidth,
      scrollH: de.scrollHeight,
      overflowX: de.scrollWidth - de.clientWidth,
      videoSrc: (document.querySelector('.scroll-video video')?.currentSrc || '').split('/').pop(),
      offenders: [],
      tiny: [],
    }
    // elementos que sobresalen por la derecha
    const vw = de.clientWidth
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed') return
      if (r.right > vw + 2 || r.left < -2) {
        // ignora los que recortan a propósito
        const id = `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ').filter(Boolean).slice(0, 2).join('.')}`
        out.offenders.push({ id, left: Math.round(r.left), right: Math.round(r.right) })
      }
    })
    out.offenders = out.offenders.slice(0, 14)
    return out
  })

  console.log(`\n===== ${vp.name} (${vp.width}x${vp.height}) =====`)
  console.log(`scrollH=${info.scrollH} overflowX=${info.overflowX}px video=${info.videoSrc}`)
  if (info.offenders.length) {
    console.log('sobresalen horizontalmente:')
    info.offenders.forEach((o) => console.log(`   ${o.id}  [${o.left} .. ${o.right}]`))
  }

  const max = info.scrollH - vp.height
  for (const f of [0, 25, 50, 75, 100]) {
    await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round((max * f) / 100))
    await p.waitForTimeout(1800)
    await p.screenshot({ path: `${outDir}/${vp.name}-${f}.png` })
  }

  console.log(problems.length ? 'PROBLEMAS:\n  ' + [...new Set(problems)].join('\n  ') : 'sin errores de consola')
  await p.close()
}
await b.close()
