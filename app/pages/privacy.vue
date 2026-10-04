<template>
  <div class="page max-w-3xl py-12 sm:py-16">
    <h1 class="font-serif text-4xl tracking-tight text-ink sm:text-5xl">{{ $t('legal.privacy_title') }}</h1>
    <p class="mt-4 text-sm text-ink-mute">{{ $t('legal.privacy_updated', { date: pick(UPDATED) }) }}</p>
    <section v-for="(block, index) in blocks" :key="index" class="mt-10">
      <h2 class="font-serif text-2xl tracking-tight text-ink">{{ pick(block.title) }}</h2>
      <p v-for="(paragraph, paragraphIndex) in block.text" :key="paragraphIndex" class="mt-3 leading-relaxed text-ink-soft">
        {{ pick(paragraph) }}
      </p>
    </section>
    <p class="mt-10 leading-relaxed text-ink-soft">
      {{ pick(CONTACT_LEAD) }}
      <a :href="`mailto:${contacts.email}`" class="link text-ink">{{ contacts.email }}</a>.
    </p>
  </div>
</template>

<script setup lang="ts">
import type { Localized } from '@/data/types'
import { contacts } from '@/data/profile'

const { t } = useI18n()
const { pick } = useLocalized()

// The policy describes what the site actually does: no forms or accounts, Yandex
// Metrica (with Webvisor) for analytics, and short-lived server connection logs.
// It follows the points Russian personal-data law (152-FZ) expects: operator,
// data, purpose, legal basis, recipients and cross-border transfer, retention,
// rights. Keep it in step with nuxt.config (the Metrica snippet) and the server setup.
const UPDATED: Localized = { en: '4 October 2026', ru: '4 октября 2026' }

const CONTACT_LEAD: Localized = {
  en: 'Questions, or a request to delete your data: write to',
  ru: 'Вопросы или просьба удалить данные — пишите на',
}

const blocks: Array<{ title: Localized, text: Localized[] }> = [
  {
    title: { en: 'Who runs this site', ru: 'Кто отвечает за сайт' },
    text: [{
      en: 'abuki.dev is the personal site of Aleksandr Buki. He decides how the data described below is used.',
      ru: 'abuki.dev — личный сайт Александра Буки. Он определяет, как используются данные, описанные ниже.',
    }],
  },
  {
    title: { en: 'What is collected', ru: 'Какие данные собираются' },
    text: [
      {
        en: 'The site has no sign-up and no forms, so it never asks for your name, phone or email.',
        ru: 'На сайте нет регистрации и форм, поэтому он не просит имя, телефон или почту.',
      },
      {
        en: 'Yandex Metrica, a web analytics service, sets cookies and records anonymous visit data: IP address, device and browser, where you came from, which pages you opened and what you clicked. Its Webvisor feature records how pages are scrolled and clicked, to see what is useful and what is in the way.',
        ru: 'Яндекс Метрика — сервис веб-аналитики — сохраняет cookies и собирает обезличенные данные о посещении: IP-адрес, устройство и браузер, откуда вы пришли, какие страницы открыли и куда нажимали. Её функция Вебвизор записывает, как страницы прокручивают и нажимают, чтобы видеть, что полезно, а что мешает.',
      },
      {
        en: 'The servers keep short technical connection logs (IP address and time) to run and protect the site.',
        ru: 'Серверы ведут короткие технические журналы соединений (IP-адрес и время), чтобы сайт работал и был защищён.',
      },
    ],
  },
  {
    title: { en: 'Why', ru: 'Зачем' },
    text: [{
      en: 'To understand which pages and projects interest visitors and to improve the site. The data is not sold and not used for advertising.',
      ru: 'Чтобы понимать, какие страницы и проекты интересны посетителям, и улучшать сайт. Данные не продаются и не используются для рекламы.',
    }],
  },
  {
    title: { en: 'On what basis', ru: 'На каком основании' },
    text: [{
      en: 'With your consent. The site tells you about cookies and Yandex Metrica on your first visit; by continuing to use it you agree to this policy. You can withdraw consent at any time (see "How to opt out") or by writing to me.',
      ru: 'С вашего согласия. При первом визите сайт сообщает о cookies и Яндекс Метрике; продолжая им пользоваться, вы соглашаетесь с этой политикой. Отозвать согласие можно в любой момент — см. «Как отказаться» — или написав мне.',
    }],
  },
  {
    title: { en: 'Who else receives it', ru: 'Кто ещё получает данные' },
    text: [
      {
        en: 'Yandex LLC, which runs Metrica, processes the analytics data under its own privacy policy (yandex.com/legal/confidential).',
        ru: 'ООО «Яндекс», оператор Метрики, обрабатывает данные аналитики по своей политике конфиденциальности (yandex.ru/legal/confidential).',
      },
      {
        en: 'The site is hosted in Russia (Timeweb), and for visitors in Russia the data stays there. For visitors outside Russia, connections pass through a relay server in the Netherlands: their IP address crosses the border, the relay forwards the connection without storing its content and keeps only a short connection log.',
        ru: 'Сайт размещён в России (Timeweb), и для посетителей из России данные остаются в России. Для посетителей из-за рубежа соединения проходят через сервер-посредник в Нидерландах: их IP-адрес передаётся за границу, а посредник пересылает соединение, не сохраняя содержимое, и ведёт только короткий журнал соединений.',
      },
    ],
  },
  {
    title: { en: 'If you write to me', ru: 'Если вы мне пишете' },
    text: [{
      en: 'Messages sent by email, Telegram or LinkedIn are used only to reply to you and are kept as long as the conversation needs them.',
      ru: 'Сообщения по почте, в Telegram или LinkedIn используются только для ответа вам и хранятся, пока нужны для переписки.',
    }],
  },
  {
    title: { en: 'How long it is kept', ru: 'Сколько хранятся данные' },
    text: [{
      en: 'Server connection logs are kept briefly and overwritten automatically. Yandex Metrica data is kept under Yandex\'s rules. Messages are kept as long as the conversation needs them.',
      ru: 'Журналы соединений серверов хранятся недолго и перезаписываются автоматически. Данные Яндекс Метрики хранятся по правилам Яндекса. Переписка — пока она нужна для общения.',
    }],
  },
  {
    title: { en: 'Your rights', ru: 'Ваши права' },
    text: [
      {
        en: 'You can ask whether data about you is processed and what it is, ask for it to be corrected, blocked or deleted, and withdraw your consent. Write to the email below; I reply within 10 working days.',
        ru: 'Вы можете узнать, обрабатываются ли данные о вас и какие именно, потребовать их уточнить, заблокировать или удалить, а также отозвать согласие. Напишите на почту ниже — отвечу в течение 10 рабочих дней.',
      },
      {
        en: 'If you believe your rights have been violated, you can complain to Roskomnadzor, the Russian data protection authority (rkn.gov.ru).',
        ru: 'Если считаете, что ваши права нарушены, можно обратиться в Роскомнадзор (rkn.gov.ru).',
      },
    ],
  },
  {
    title: { en: 'How to opt out', ru: 'Как отказаться' },
    text: [{
      en: 'Block cookies in your browser or install Yandex\'s Metrica opt-out extension (yandex.com/support/metrica/general/opt-out.html). The site keeps working without them.',
      ru: 'Запретите cookies в браузере или установите расширение Яндекса для отказа от Метрики (yandex.ru/support/metrica/general/opt-out.html). Сайт продолжит работать.',
    }],
  },
]

usePageSeo({
  title: `${t('legal.privacy_title')} | ${t('seo.name')}`,
  description: pick({
    en: 'What data abuki.dev collects (Yandex Metrica, cookies), why, and how to opt out.',
    ru: 'Какие данные собирает abuki.dev (Яндекс Метрика, cookies), зачем и как отказаться.',
  }),
})
</script>
