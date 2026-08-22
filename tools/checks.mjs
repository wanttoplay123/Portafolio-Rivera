/**
 * Tres comprobaciones de una pasada, sobre el servidor de desarrollo:
 *
 *   1. cierre    — que el vídeo llegue a su último fotograma y se quede quieto
 *                  en pantalla, y que se apague una pantalla más abajo
 *   2. encaje    — que la banda de placas quepa en pantalla en cada viewport
 *   3. recorrido — el tramo pegajoso de skills: segundo del vídeo, opacidad y
 *                  fase de la coreografía en nueve puntos
 *
 * Uso: node tools/checks.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] || 'http://localhost:5173/'
const browser = await chromium.launch({ channel: 'chrome' })
let failed = false

/* ------------------------------------------------------------------- cierre */

/* El vídeo ya no se funde al final: enseña su último fotograma quieto y la
   sección siguiente le pasa por encima con su propio fondo. Lo que hay que
   comprobar es eso: que sigue encendido al terminar el tramo —si se apagara,
   el corte se vería— y que se apaga una pantalla más abajo, cuando ya está
   tapado y solo costaría composición. */

{
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)

  const stage = await page.evaluate(() => {
    const r = document.querySelector('.skills-stage').getBoundingClientRect()
    return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }
  })

  const at = async (top) => {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(top))
    // el `currentTime` persigue al objetivo con un lerp: hay que dejarle llegar
    await page.waitForTimeout(2200)
    return page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.scroll-video'))
      const video = document.querySelector('.scroll-video video')
      return {
        encendido: cs.visibility !== 'hidden' && +cs.opacity > 0.01,
        t: +video.currentTime.toFixed(2),
        fin: +(video.duration || 0).toFixed(2),
      }
    })
  }

  const fin = stage.top + stage.h - 900
  const enElCorte = await at(fin)
  const unaPantallaDespues = await at(fin + 900)

  const okCorte = enElCorte.encendido && enElCorte.t > enElCorte.fin - 0.3
  const okApagado = !unaPantallaDespues.encendido
  console.log(`cierre: último fotograma ${okCorte ? 'quieto y visible' : 'FALLA'} (t=${enElCorte.t}/${enElCorte.fin})`)
  console.log(`cierre: apagado una pantalla más abajo ${okApagado ? 'sí' : 'NO'}`)
  if (!okCorte || !okApagado) failed = true
  await page.close()
}

/* ------------------------------------------------------------------ encaje */

for (const [w, h] of [[1920, 1080], [1440, 860], [1024, 768], [768, 1024], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)
  const band = await page.evaluate(() => {
    const r = document.querySelector('.stage-band').getBoundingClientRect()
    return { w: Math.round(r.width), h: Math.round(r.height) }
  })
  const fits = band.h <= h - 90
  console.log(`encaje ${w}x${h}: banda ${band.w}x${band.h} ${fits ? 'cabe' : 'NO CABE'}`)
  if (!fits) failed = true
  await page.close()
}

/* -------------------------------------------------------------- recorrido */

{
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
  const stage = await page.evaluate(() => {
    const r = document.querySelector('.skills-stage').getBoundingClientRect()
    return { top: Math.round(r.top + scrollY), h: Math.round(r.height) }
  })

  for (let f = 0; f <= 1.001; f += 0.125) {
    await page.evaluate((top) => scrollTo({ top, behavior: 'instant' }), Math.round(stage.top + (stage.h - 900) * f))
    await page.waitForTimeout(700)
    const r = await page.evaluate(() => {
      const video = document.querySelector('.scroll-video video')
      const cs = getComputedStyle(document.querySelector('.scroll-video'))
      const band = document.querySelector('.stage-band').getBoundingClientRect()
      const visible = Math.max(0, Math.min(innerHeight, band.bottom) - Math.max(0, band.top))
      return {
        t: +video.currentTime.toFixed(2),
        opacidad: cs.visibility === 'hidden' ? 0 : +(+cs.opacity).toFixed(2),
        bandaVisible: `${Math.round((visible / band.height) * 100)}%`,
        fase: document.querySelector('.skills-panel').dataset.stage,
      }
    })
    console.log(`recorrido ${(f * 100).toFixed(0).padStart(3)}%`, r)
  }
  await page.close()
}

await browser.close()
process.exit(failed ? 1 : 0)
