import { findLabExperiment, labExperimentImage } from '@/data/lab'

/**
 * Head tags for a Lab experiment page, built from its entry in `app/data/lab.ts`
 * so the title and description follow the locale (/ru/lab/… gets the Russian
 * ones) and stay in step with the Lab tiles. The tile image doubles as the
 * share preview.
 *
 * @param slug - The experiment's `slug` in `labExperiments`, e.g. `'kinetic-text'`
 */
export const useLabSeo = (slug: string) => {
  const { pick } = useLocalized()
  const { t } = useI18n()

  const experiment = findLabExperiment(slug)
  if (!experiment) {
    throw new Error(`useLabSeo: no experiment "${slug}" in app/data/lab.ts`)
  }

  usePageSeo({
    title: `${pick(experiment.title)} — ${t('lab.title')} | ${t('seo.name')}`,
    description: pick(experiment.description),
    type: 'article',
    image: labExperimentImage(experiment),
  })
}
