import { chromium } from 'playwright'

const url = process.argv[2] || 'http://127.0.0.1:5178/'
const outDir = process.argv[3] || 'shots'
const targets = (process.argv[4] || 'home,about,projects,skills,experience,contact').split(',')

const browser = await chromium.launch({
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
})
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(url, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

for (const id of targets) {
  await page.evaluate((sid) => {
    const el = document.getElementById(sid)
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' })
  }, id)
  await page.waitForTimeout(1400)
  await page.screenshot({ path: `${outDir}/${id}.png` })
}

if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.slice(0, 10).join('\n'))
else console.log('no console errors')

await browser.close()
