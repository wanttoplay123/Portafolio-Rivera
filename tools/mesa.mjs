import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
for (const [w, h] of [[1920, 1080], [1600, 900], [1280, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } })
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2200)
  const y = await p.evaluate(() => {
    const r = document.querySelector('.mesa').getBoundingClientRect()
    return Math.round(r.top + scrollY)
  })
  await p.evaluate((top) => scrollTo({ top, behavior: 'instant' }), y)
  await p.waitForTimeout(1200)
  const box = await p.evaluate(() => {
    const r = document.querySelector('.mesa-cards').getBoundingClientRect()
    return { izq: Math.round((r.left / innerWidth) * 100), der: Math.round((r.right / innerWidth) * 100) }
  })
  console.log(`${w}x${h}: tarjetas del ${box.izq}% al ${box.der}% del ancho`)
  await p.screenshot({ path: `shots/mesa-${w}.png` })
  await p.close()
}
await b.close()
