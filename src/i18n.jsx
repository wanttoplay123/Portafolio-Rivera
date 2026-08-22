import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { content, LANGS } from './data/content.js'

const STORAGE_KEY = 'jd-lang'
const LangContext = createContext(null)

/**
 * Idioma inicial: primero lo que eligió el visitante la vez anterior, y si no
 * hay nada guardado, el del navegador. Cualquier cosa que no sea español cae
 * en inglés — el sitio está pensado para que un reclutador de fuera lo lea sin
 * tener que buscar el conmutador.
 */
function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && content[saved]) return saved
  } catch {
    // modo privado o cookies bloqueadas: se sigue con el del navegador
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language || '' : ''
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(initialLang)

  useEffect(() => {
    // el atributo importa de verdad: guía al lector de pantalla y a la
    // separación silábica del navegador
    document.documentElement.lang = lang
    const c = content[lang]
    document.title = c.meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.meta.description)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // sin almacenamiento: el idioma dura lo que dure la visita
    }
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, c: content[lang], langs: LANGS }), [lang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

/** Devuelve `{ lang, setLang, c, langs }`; `c` es el árbol del idioma activo. */
export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang() fuera de <LangProvider>')
  return ctx
}
