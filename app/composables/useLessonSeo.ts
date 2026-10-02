import { useLessons } from '@/composables/three-js-lessons/useLessons'

/**
 * Head tags for a lesson page, built from its entry in `useLessons` so the title
 * and description follow the locale (/ru/lessons/… gets the Russian ones) and
 * stay in step with the Lab tiles. The tile image doubles as the share preview.
 *
 * @param lessonId - The lesson's `id` in `useLessons`, e.g. `'50'`
 */
export const useLessonSeo = (lessonId: string) => {
  const { getLessonById } = useLessons()
  const { pick } = useLocalized()
  const { t } = useI18n()

  const lesson = getLessonById(lessonId)
  if (!lesson) {
    throw new Error(`useLessonSeo: no lesson with id "${lessonId}" in useLessons`)
  }

  usePageSeo({
    title: `${pick(lesson.title)} — ${t('lab.title')} | ${t('seo.name')}`,
    description: pick(lesson.description),
    type: 'article',
    image: `/images/lab/${lesson.id}.webp`,
  })
}
