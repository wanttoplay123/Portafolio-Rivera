/** Prueba la interacción táctil de las placas en un móvil emulado. */
import { chromium, devices } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ ...devices['Pixel 7'] })
p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
await p.goto(process.argv[2] || 'http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)

// menú hamburguesa -> habilidades
await p.tap('.burger')
await p.waitForTimeout(500)
await p.tap('.nav-links a[href="#skills"]')
await p.waitForTimeout(3200)

const estado = await p.evaluate(() => ({
  fase: document.querySelector('.skills-panel').dataset.stage,
  pista: document.querySelector('.skills-hint').innerText.trim(),
  clicable: getComputedStyle(document.querySelector('.badge-cell')).pointerEvents,
}))
console.log(estado)

const celdas = p.locator('.badge-cell')
for (const i of [0, 1, 4]) {
  const caja = await celdas.nth(i).locator('.badge').boundingBox()
  if (!caja) { console.log('placa', i, 'fuera de pantalla'); continue }
  console.log(`placa ${i}: ${Math.round(caja.width)}x${Math.round(caja.height)} px`)
  await celdas.nth(i).locator('.badge').tap()
  await p.waitForTimeout(400)
}
await p.waitForTimeout(1200)
console.log('descubiertas:', await p.locator('.badge-cell.is-revealed').count(), 'de', await celdas.count())
console.log('overflowX:', await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
await p.screenshot({ path: 'shots/touch-skills.png' })
await b.close()
