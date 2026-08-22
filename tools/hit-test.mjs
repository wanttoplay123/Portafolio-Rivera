import { chromium } from 'playwright'
const b = await chromium.launch({ channel: 'chrome' })
const p = await b.newPage({ viewport: { width: 1600, height: 900 } })
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
await p.click('.nav-links a[href="#skills"]')
await p.waitForTimeout(1600)
const r = await p.evaluate(() => {
  const badge = document.querySelector('.badge')
  const rect = badge.getBoundingClientRect()
  const x = Math.round(rect.left + rect.width / 2)
  const y = Math.round(rect.top + rect.height / 2)
  const top = document.elementFromPoint(x, y)
  const chain = []
  let el = top
  while (el && chain.length < 5) {
    const cs = getComputedStyle(el)
    chain.push(`${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]} [z=${cs.zIndex} pe=${cs.pointerEvents} pos=${cs.position}]`)
    el = el.parentElement
  }
  return { x, y, encimaEsPlaca: top === badge || badge.contains(top), cadena: chain }
})
console.log(r)
await b.close()
