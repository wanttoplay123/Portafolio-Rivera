import { chromium, devices } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ ...devices['Pixel 7'] })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.screenshot({ path: 'shots/mob-home.png' })
await p.evaluate(() => {
  const st = document.querySelector('.skills-stage')
  scrollTo({ top: st.offsetTop + (st.offsetHeight - innerHeight) * 0.85, behavior: 'instant' })
})
await p.waitForTimeout(2500)
await p.screenshot({ path: 'shots/mob-skills.png' })
console.log('listo')
await b.close()
