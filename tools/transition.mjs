import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const about = await p.evaluate(() => {
  const r = document.querySelector('.about').getBoundingClientRect()
  return Math.round(r.top + scrollY)
})
for (const [off, tag] of [[-700, 'a'], [-400, 'b'], [-120, 'c'], [200, 'd']]) {
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.max(0, about + off))
  await p.waitForTimeout(900)
  await p.screenshot({ path: `shots/trans-${tag}.png` })
}
console.log('about top =', about)
await b.close()
