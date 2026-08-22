import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

// baja al pie y salta a habilidades: es el salto largo
await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
await p.waitForTimeout(900)
const t0 = Date.now()
await p.click('.nav-links a[href="#skills"]')
const muestras = []
for (let i = 0; i < 14; i++) {
  await p.waitForTimeout(150)
  muestras.push(await p.evaluate(() => Math.round(scrollY)))
}
console.log('duración aprox:', Date.now() - t0, 'ms')
console.log('recorrido:', muestras.join(' -> '))
await p.waitForTimeout(1200)
console.log('fase final:', await p.evaluate(() => document.querySelector('.skills-panel').dataset.stage))

// y de vuelta a home
await p.click('.brand')
await p.waitForTimeout(2800)
console.log('scrollY tras volver a home:', await p.evaluate(() => Math.round(scrollY)))
await b.close()
