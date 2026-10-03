/**
 * Yandex Metrika for a single-page site. The counter is the stock snippet in
 * nuxt.config (production builds only). It records the first page load, but moves
 * between pages happen without a reload and it never sees them; this plugin
 * reports each one as a hit. It also turns clicks on elements marked with
 * `data-goal` into goals, so components only carry an attribute:
 *
 *   <a data-goal="contact" data-goal-channel="telegram">
 *     → ym(id, 'reachGoal', 'contact', { channel: 'telegram' })
 *
 * Goal ids to create in Metrika (type "JavaScript event"): contact, cta, locale,
 * project_open, project_link, lab_open.
 */
type YandexMetrika = (id: number, method: string, ...args: unknown[]) => void

export default defineNuxtPlugin((nuxtApp) => {
  const counterId = Number(useRuntimeConfig().public.yandexMetrikaId)
  if (!counterId) {
    return
  }
  // The snippet defines `ym` as a call queue right away, before tag.js arrives.
  const ym = (method: string, ...args: unknown[]) =>
    (window as unknown as { ym?: YandexMetrika }).ym?.(counterId, method, ...args)

  let previousUrl = location.href
  nuxtApp.hook('page:finish', () => {
    // A frame later the new page's <title> is in the document.
    requestAnimationFrame(() => {
      const url = location.href
      // The first page (hydration) is already counted by the snippet's init.
      if (url === previousUrl) {
        return
      }
      ym('hit', url, { referer: previousUrl, title: document.title })
      previousUrl = url
    })
  })

  document.addEventListener('click', (event) => {
    const element = (event.target as Element | null)?.closest<HTMLElement>('[data-goal]')
    if (!element?.dataset.goal) {
      return
    }
    // data-goal-channel="telegram" → { channel: 'telegram' }
    const params: Record<string, string> = {}
    for (const [key, value] of Object.entries(element.dataset)) {
      if (key.startsWith('goal') && key !== 'goal' && value !== undefined) {
        params[key.charAt(4).toLowerCase() + key.slice(5)] = value
      }
    }
    ym('reachGoal', element.dataset.goal, params)
  }, { capture: true })
})
