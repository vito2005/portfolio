import type { LocaleCode, Localized } from '@/data/types'

/**
 * Picks the current-locale string out of a `{ en, ru }` pair from `app/data`.
 * Falls back to English so a missing translation never renders as empty.
 */
export const useLocalized = () => {
  const { locale } = useI18n()

  const pick = (text: Localized | undefined): string => {
    if (!text) {
      return ''
    }
    return text[locale.value as LocaleCode] ?? text.en
  }

  return { pick }
}
