import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
p.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('404')) console.log('CONSOLE:', m.text()) })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2200)
const read = () => p.evaluate(() => ({
  lang: document.documentElement.lang,
  title: document.title,
  h1: document.querySelector('.hero-copy h1')?.innerText.replace(/\n/g, ' '),
  cta: document.querySelector('.hero-copy .btn')?.innerText,
  nav: [...document.querySelectorAll('.nav-links > a')].map((a) => a.innerText.trim().split('\n')[0]).join(' · '),
}))
console.log('inicial:', await read())
await p.screenshot({ path: 'shots/lang-es.png' })
await p.click('.lang-switch button:not(.is-active)')
await p.waitForTimeout(700)
console.log('tras cambiar:', await read())
await p.screenshot({ path: 'shots/lang-en.png' })
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(1800)
console.log('tras recargar:', await read())
await b.close()
