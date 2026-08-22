import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const stage = await p.evaluate(() => {
  const r = document.querySelector('.skills-stage').getBoundingClientRect()
  return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }
})
for (const f of [0.05, 0.2, 0.32, 0.42, 0.58, 0.75, 0.95]) {
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(stage.top + (stage.h - 900) * f))
  await p.waitForTimeout(600)
  const info = await p.evaluate(() => ({
    fase: document.querySelector('.skills-panel').dataset.stage,
    clicable: getComputedStyle(document.querySelector('.badge-cell')).pointerEvents,
  }))
  console.log(`p=${f}`, info)
  await p.screenshot({ path: `shots/choreo-${String(Math.round(f * 100)).padStart(2, '0')}.png` })
}
await b.close()
