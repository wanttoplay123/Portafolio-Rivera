import { chromium } from 'playwright'
const url = process.argv[2] || 'http://localhost:5173/'
const out = process.argv[3] || 'shots'
const fracs = (process.argv[4] || '0,8,16,24,32,40,46').split(',').map(Number)
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1 })
const errs = []
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message))
await p.goto(url, { waitUntil: 'networkidle' })
await p.waitForFunction(() => {
  const v = document.querySelector('.scroll-video video')
  return v && v.readyState >= 2
}, null, { timeout: 60000 })
await p.waitForTimeout(1200)
const max = await p.evaluate(() => document.documentElement.scrollHeight - window.innerHeight)
console.log('scrollable px:', max)
for (const f of fracs) {
  await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round((max * f) / 100))
  await p.waitForTimeout(2200)
  const st = await p.evaluate(() => {
    const w = document.querySelector('.scroll-video')
    const v = w.querySelector('video')
    return { t: +v.currentTime.toFixed(2), op: +(+getComputedStyle(w).opacity).toFixed(2) }
  })
  console.log(`${String(f).padStart(3)}% -> t=${st.t}s opacity=${st.op}`)
  await p.screenshot({ path: `${out}/sv-${f}.png` })
}
console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no page errors')
await b.close()
