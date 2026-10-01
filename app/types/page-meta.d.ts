/**
 * Custom keys pages set through `definePageMeta`, so reading them from
 * `route.meta` is typed instead of `unknown`.
 */
declare module '#app' {
  interface PageMeta {
    /** The page ends with ContactSection; SiteFooter then hides its contact links. */
    hasContactSection?: boolean
  }
}

export {}
