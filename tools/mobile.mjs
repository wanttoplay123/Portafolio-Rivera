/** Capturas por sección en móvil y tablet, para revisar el responsive. */
import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
for (const [w, h, tag] of [[390, 844, 'm390'], [768, 1024, 't768']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, isMobile: w < 500, hasTouch: w < 500 })
  p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
  await p.goto(process.argv[2] || 'http://localhost:5173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2500)
  for (const [sel, name, frac] of [
    ['.stage', 'home', 0],
    ['.skills-stage', 'skills', 0.85],
    ['.about', 'about', 0],
    ['.mesa', 'projects', 0],
    ['.saloon', 'experience', 0],
    ['.stage-foot', 'contact', 0],
  ]) {
    const top = await p.evaluate(([s, f]) => {
      const el = document.querySelector(s)
      const r = el.getBoundingClientRect()
      const base = r.top + window.scrollY
      return Math.max(0, base + Math.max(0, el.offsetHeight - innerHeight) * f - (f ? 0 : 0))
    }, [sel, frac])
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top)
    await p.waitForTimeout(1200)
    await p.screenshot({ path: `shots/${tag}-${name}.png` })
  }
  const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  console.log(`${w}x${h}: overflowX=${over}px`)
  await p.close()
}
await b.close()
