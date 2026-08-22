import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

// clic en el enlace de habilidades del menú
await p.click('.nav-links a[href="#skills"]')
await p.waitForTimeout(1800)
const r = await p.evaluate(() => {
  const band = document.querySelector('.stage-band').getBoundingClientRect()
  const cs = getComputedStyle(document.querySelector('.stage-band'))
  const video = document.querySelector('.scroll-video video')
  return {
    bandaTop: Math.round(band.top),
    bandaAbajo: Math.round(band.bottom),
    dentro: band.top > 0 && band.bottom < innerHeight,
    enter: +(+cs.opacity).toFixed(2),
    videoT: +video.currentTime.toFixed(2),
    ajusteVideo: getComputedStyle(video).objectFit,
  }
})
console.log('ancla #skills ->', r)
await p.screenshot({ path: 'shots/anchor-skills.png' })

// el audio queda descodificado antes del primer clic
const ready = await p.evaluate(() => new Promise((res) => setTimeout(() => res(performance.getEntriesByType('resource').some((e) => e.name.includes('target-hit'))), 200)))
console.log('clip descargado antes del clic:', ready)
await b.close()
