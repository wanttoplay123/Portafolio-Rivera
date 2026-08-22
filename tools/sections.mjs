import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
for (const [sel, name] of [
  ['.stage', 'sec-home'],
  ['.skills-stage', 'sec-skills'],
  ['.about', 'sec-about'],
  ['.mesa', 'sec-projects'],
  ['.saloon', 'sec-experience'],
  ['.stage-foot', 'sec-contact'],
]) {
  const top = await p.evaluate((sel) => {
    const r = document.querySelector(sel).getBoundingClientRect()
    return Math.max(0, r.top + window.scrollY - 40)
  }, sel)
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top)
  await p.waitForTimeout(900)
  await p.screenshot({ path: `shots/${name}.png` })
  console.log(name, 'top=', Math.round(top))
}
await b.close()
