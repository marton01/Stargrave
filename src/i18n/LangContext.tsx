// The active language, and switching it.
//
// Kept in React context rather than passed down, because practically every
// component needs it and the switch has to take effect everywhere at once.
// The choice is remembered in localStorage, so it survives a reload.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { pick, ui } from './ui'
import type { Lang, Text } from '../engine/types'

const STORAGE_KEY = 'csillagsir.lang'

/** Hungarian is the default: this is what the two of us play in. */
const DEFAULT_LANG: Lang = 'hu'

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'hu' || stored === 'en') return stored
  } catch {
    // Private browsing or a blocked storage — fall back silently.
  }
  return DEFAULT_LANG
}

type LangContextValue = {
  lang: Lang
  setLang: (lang: Lang) => void
  /** Interface string catalogue in the active language. */
  t: ReturnType<typeof ui>
  /** Resolve a content Text in the active language. */
  s: (text: Text) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(loadLang)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not being able to remember the choice is not worth an error.
    }
  }, [])

  // Keep the document language in sync — it affects hyphenation and screen readers.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      t: ui(lang),
      s: (text: Text) => pick(text, lang),
    }),
    [lang, setLang],
  )

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang(): LangContextValue {
  const value = useContext(LangContext)
  if (!value) throw new Error('useLang used outside LangProvider')
  return value
}
