import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
p.on('pageerror', (e) => console.log('JS ERROR:', e.message))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.click('.nav-links a[href="#skills"]')
await p.waitForTimeout(3000)
const info = await p.evaluate(() => {
  const wrap = document.querySelector('.scroll-video')
  const cs = getComputedStyle(wrap)
  const layer = document.querySelector('.video-smoke').getBoundingClientRect()
  return {
    fumando: wrap.classList.contains('is-smoking'),
    caja: ['--vx', '--vy', '--vw', '--vh'].map((v) => cs.getPropertyValue(v).trim()).join(' / '),
    humoEn: `${Math.round(layer.left)},${Math.round(layer.top)}`,
    t: +document.querySelector('.scroll-video video').currentTime.toFixed(2),
  }
})
console.log(info)
for (const ms of [0, 2500, 5000]) {
  await p.waitForTimeout(ms ? 2500 : 0)
  await p.screenshot({ path: `shots/smoke-${ms}.png` })
}
await b.close()
