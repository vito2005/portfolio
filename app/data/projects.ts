import type { Project } from './types'

/**
 * Every project on the site, in display order. `featured` ones make the
 * home page; the rest only appear on `/projects`. Facts here were checked
 * against the CVs and the live sites; keep numbers to ones that can be
 * backed up.
 */
export const projects: Project[] = [
  {
    slug: 'sea-breeze-booking',
    title: 'Sea Breeze Booking',
    kind: 'work',
    featured: true,
    company: 'Vide Infra',
    period: { en: '2026', ru: '2026' },
    role: { en: 'Lead frontend engineer', ru: 'Ведущий фронтенд-инженер' },
    tagline: {
      en: 'Direct booking platform for a resort city near Baku, built in about three months, mostly solo.',
      ru: 'Платформа прямого бронирования для курортного города под Баку, собрана примерно за три месяца, в основном в одиночку.',
    },
    problem: {
      en: 'Sea Breeze, a resort city near Baku, needed to take bookings for apartments, hotels and villas directly instead of through aggregators: search by dates and guests, room selection, checkout with online payment, all in Azerbaijani.',
      ru: 'Курортному городу Sea Breeze под Баку нужно было принимать брони на квартиры, отели и виллы напрямую, а не через агрегаторы: поиск по датам и гостям, выбор номера, оформление с онлайн-оплатой, всё на азербайджанском.',
    },
    work: {
      en: 'Built the front end at Vide Infra: architecture, the whole booking funnel from search to payment, integration with the client\'s backend, SSR with server-side caching, and a Storybook-driven component library. Added Playwright smoke tests over the funnel and axe accessibility checks, and pushed product analytics into the roadmap. One frontend engineer helped with parts of the UI.',
      ru: 'Собрал фронтенд в Vide Infra: архитектура, вся воронка бронирования от поиска до оплаты, интеграция с бэкендом клиента, SSR с серверным кешем, библиотека компонентов в Storybook. Добавил smoke-тесты воронки на Playwright и проверки доступности axe, продвинул продуктовую аналитику в план работ. Один фронтендер помогал с частью интерфейса.',
    },
    result: {
      en: 'Live and taking bookings. Excellent Core Web Vitals on mobile, where most guests book.',
      ru: 'Работает и принимает брони. Отличные Core Web Vitals на мобильных, откуда приходит большинство гостей.',
    },
    stack: ['Nuxt', 'TypeScript', 'Pinia', 'SSR', 'i18n', 'Storybook', 'Playwright', 'Vitest', 'Datadog RUM'],
    links: [{ label: { en: 'Live site', ru: 'Сайт' }, href: 'https://booking.seabreeze.az' }],
    cover: { en: '/images/projects/sea-breeze-en.webp', ru: '/images/projects/sea-breeze-ru.webp' },
    coverAlt: { en: 'Sea Breeze Booking home page with the search form', ru: 'Главная Sea Breeze Booking с формой поиска' },
  },
  {
    slug: 'osmi',
    title: 'osmi.ai',
    kind: 'work',
    featured: true,
    company: 'POW, London',
    period: { en: '2024 - 2025', ru: '2024 - 2025' },
    role: { en: 'Lead frontend engineer', ru: 'Ведущий фронтенд-инженер' },
    tagline: {
      en: 'Led the front end of a decentralized AI ecosystem: an AI chat, an AI trading agent and a platform for node owners.',
      ru: 'Вёл фронтенд экосистемы децентрализованного ИИ: ИИ-чат, торговый ИИ-агент и платформа для владельцев нод.',
    },
    problem: {
      en: 'POW, a London studio, needed one engineer to own the front end of the OSMI.AI ecosystem: chat.osmi.ai, a decentralized AI interface; trade.osmi.ai, an autonomous AI trading agent; and nodes.osmi.ai, where nodes are sold and managed.',
      ru: 'Лондонской студии POW нужен был один инженер, который возьмёт фронтенд экосистемы OSMI.AI: chat.osmi.ai, децентрализованный ИИ-интерфейс; trade.osmi.ai, автономный торговый ИИ-агент; и nodes.osmi.ai, где продают ноды и управляют ими.',
    },
    work: {
      en: 'Owned the architecture and all user-facing features, from the first design to the production launch, including every animation and the backend-for-frontend layer with real-time AI responses. Wrote a Go utility that converts CSV exports into the project\'s import format.',
      ru: 'Отвечал за архитектуру и все пользовательские фичи, от первого макета до запуска, включая анимации и слой backend-for-frontend с ответами ИИ в реальном времени. Написал на Go утилиту конвертации CSV-выгрузок в формат импорта проекта.',
    },
    result: {
      en: 'Three products shipped by a single frontend engineer.',
      ru: 'Три продукта, выпущенные одним фронтенд-инженером.',
    },
    stack: ['Svelte 5', 'SvelteKit', 'TypeScript', 'Tailwind CSS', 'Vercel', 'Redis', 'Go'],
    links: [
      { label: { en: 'chat.osmi.ai', ru: 'chat.osmi.ai' }, href: 'https://chat.osmi.ai' },
      { label: { en: 'trade.osmi.ai', ru: 'trade.osmi.ai' }, href: 'https://trade.osmi.ai' },
      { label: { en: 'nodes.osmi.ai', ru: 'nodes.osmi.ai' }, href: 'https://nodes.osmi.ai' },
    ],
    cover: { en: '/images/projects/osmi.webp', ru: '/images/projects/osmi.webp' },
    coverAlt: { en: 'OSMI chat interface', ru: 'Интерфейс ИИ-чата OSMI' },
  },
  {
    slug: 'hemi',
    title: 'hemi.xyz',
    kind: 'work',
    featured: true,
    company: 'POW, London',
    period: { en: '2024 - 2025', ru: '2024 - 2025' },
    role: { en: 'Frontend engineer, 3D', ru: 'Фронтенд-инженер, 3D' },
    tagline: {
      en: 'Interactive Three.js scenes for the hemi.xyz site, built from Blender models and kept smooth on mid-range phones.',
      ru: 'Интерактивные 3D-сцены на Three.js для сайта hemi.xyz: модели из Blender, плавная работа на обычных телефонах.',
    },
    problem: {
      en: 'hemi.xyz wanted 3D on its site that holds up in a real browser, not just in a render: the designers\' Blender scenes had to become live, interactive parts of the page.',
      ru: 'hemi.xyz хотел на сайте 3D, которое живёт в реальном браузере, а не только на рендере: сцены дизайнеров из Blender нужно было превратить в живые интерактивные части страницы.',
    },
    work: {
      en: 'Brought the Blender models into Three.js, wrote custom shaders and animation timelines, and tuned the render loop for mid-range devices. Packaged the scenes as reusable components; the demo shows one of them.',
      ru: 'Перенёс модели из Blender в Three.js, написал собственные шейдеры и анимационные таймлайны, оптимизировал цикл рендера под устройства среднего уровня. Собрал сцены в переиспользуемые компоненты, одна из них есть в демо.',
    },
    result: {
      en: '3D that holds 60 FPS on mid-range phones, not only on a designer\'s laptop.',
      ru: '3D, которое держит 60 FPS на телефонах среднего класса, а не только на ноутбуке дизайнера.',
    },
    stack: ['Three.js', 'GLSL', 'Blender', 'TypeScript', 'React'],
    links: [
      { label: { en: 'hemi.xyz', ru: 'hemi.xyz' }, href: 'https://hemi.xyz' },
      { label: { en: '3D components demo', ru: 'Демо 3D-компонентов' }, href: 'https://framer-components-beta.vercel.app/' },
    ],
    cover: { en: '/images/projects/hemi.webp', ru: '/images/projects/hemi.webp' },
    coverAlt: { en: 'Pixel-art 3D Bitcoin coin built in Three.js for hemi.xyz', ru: 'Пиксельная 3D-монета Bitcoin на Three.js для hemi.xyz' },
    video: '/videos/hemi',
  },
  {
    slug: 'mail-ru',
    title: 'Mail.ru main page',
    kind: 'work',
    featured: true,
    company: 'VK',
    period: { en: '2020 - 2022', ru: '2020 - 2022' },
    role: { en: 'Frontend engineer', ru: 'Фронтенд-инженер' },
    tagline: {
      en: 'Performance-critical UI on one of the most visited pages in Russia, with a Playwright regression system in the release pipeline.',
      ru: 'Производительный UI на одной из самых посещаемых страниц рунета и регрессионные тесты на Playwright в пайплайне релизов.',
    },
    problem: {
      en: 'The Mail.ru main page and portal navigation serve millions of users a day. Every release had to be fast, stable and measurable.',
      ru: 'Главная Mail.ru и портальная навигация обслуживают миллионы пользователей в день. Каждый релиз должен быть быстрым, стабильным и измеримым.',
    },
    work: {
      en: 'Built and maintained high-load front end in Svelte and React. Set up end-to-end regression testing with Playwright that runs on every release and periodically in production, with alerts on failure. Deployed through GitLab CI and wrote a Go log parser for page health monitoring.',
      ru: 'Разрабатывал и поддерживал высоконагруженный фронтенд на Svelte и React. Настроил end-to-end регрессионное тестирование на Playwright: запуск на каждом релизе и периодически на проде, с алертами при падении. Деплой через GitLab CI, для мониторинга работоспособности страницы написал разбор логов на Go.',
    },
    result: {
      en: 'Chrome Excellence award at VK People Awards 2021 for Web Vitals work on the main page.',
      ru: 'Награда Chrome Excellence на VK People Awards 2021 за работу над Web Vitals главной страницы.',
    },
    stack: ['Svelte', 'React', 'TypeScript', 'XState', 'Playwright', 'GitLab CI', 'Go'],
    links: [{ label: { en: 'mail.ru', ru: 'mail.ru' }, href: 'https://mail.ru' }],
    cover: { en: '/images/projects/mail-ru.webp', ru: '/images/projects/mail-ru.webp' },
    coverAlt: { en: 'Mail.ru main page', ru: 'Главная страница Mail.ru' },
  },
  {
    slug: 'metamap',
    title: 'Metamap',
    kind: 'work',
    featured: false,
    company: 'Metamap, San Francisco',
    period: { en: '2022 - 2024', ru: '2022 - 2024' },
    role: { en: 'Full-stack engineer, Node.js', ru: 'Full-stack инженер, Node.js' },
    tagline: {
      en: 'Microservices for a fintech underwriting platform used by 35 banks in Latin America.',
      ru: 'Микросервисы для финтех-платформы андеррайтинга, которой пользуются 35 банков Латинской Америки.',
    },
    problem: {
      en: 'Metamap\'s underwriting product processed bank statements for lenders across Latin America. Releases were slow, and every new bank integration added risk to a shared codebase.',
      ru: 'Продукт андеррайтинга Metamap обрабатывал банковские выписки для кредиторов Латинской Америки. Релизы были медленными, и каждая новая интеграция с банком добавляла риска в общую кодовую базу.',
    },
    work: {
      en: 'Designed and implemented a microservices architecture: routing, persistence, queues and inter-service communication for bank-statement processing. Worked in a mixed Node.js and Go environment: extended the Go document-processing services that talk to the Node side through RabbitMQ, adding new formats and fixing queue consumers.',
      ru: 'Спроектировал и внедрил микросервисную архитектуру: маршрутизация, хранение, очереди и взаимодействие сервисов для обработки банковских выписок. Работал в смешанной среде Node.js и Go: дорабатывал Go-сервисы обработки документов, которые общаются с Node-контуром через RabbitMQ, добавлял новые форматы и чинил воркеры очередей.',
    },
    result: {
      en: 'Average release cycle cut by 70%. Six months in, the product supported 35 banks, the most in the region.',
      ru: 'Средний цикл релиза сократился на 70%. Через полгода продукт поддерживал 35 банков, больше всех в регионе.',
    },
    stack: ['Node.js', 'Go', 'Moleculer', 'Fastify', 'RabbitMQ', 'MongoDB', 'Camunda'],
    links: [{ label: { en: 'metamap.com', ru: 'metamap.com' }, href: 'https://www.metamap.com' }],
    cover: { en: '/images/projects/metamap.webp', ru: '/images/projects/metamap.webp' },
    coverAlt: { en: 'Metamap website', ru: 'Сайт Metamap' },
  },
  {
    slug: 'strikerstat',
    title: 'Strikerstat',
    kind: 'freelance',
    featured: false,
    role: { en: 'Architect and frontend lead', ru: 'Архитектор и ведущий фронтенд' },
    tagline: {
      en: 'Combat sports platform for competitions, fighters and trainers, moved off a legacy PHP monolith with zero downtime.',
      ru: 'Платформа единоборств для соревнований, бойцов и тренеров, переведена с легаси PHP-монолита без остановки.',
    },
    problem: {
      en: 'Strikerstat is a combat sports platform I originally built for a friend: competitions, fighters, trainers, camps and a knowledge base. Years later it had become a PHP and JavaScript monolith: slow to change, risky to touch, and the product still had to keep shipping.',
      ru: 'Strikerstat, платформа единоборств, которую я изначально собрал для друга: соревнования, бойцы, тренеры, сборы и база знаний. Спустя годы она превратилась в монолит на PHP и JavaScript: медленно меняется, страшно трогать, а продукт должен продолжать выходить.',
    },
    work: {
      en: 'Designed the split into a separate Next.js frontend and a PHP backend, then migrated page by page behind an Nginx reverse proxy: high-traffic pages first, each route reversible on its own, old and new stacks serving traffic side by side until the last route moved.',
      ru: 'Спроектировал разделение на отдельный фронтенд на Next.js и PHP-бэкенд, затем мигрировал постранично через Nginx reverse proxy: сначала самые нагруженные страницы, каждый маршрут откатывается отдельно, старый и новый стек работали параллельно, пока не переехал последний.',
    },
    result: {
      en: 'No big-bang release and no product freeze. The platform kept growing on the new foundation.',
      ru: 'Без большого релиза и без заморозки продукта. Платформа продолжила расти на новой основе.',
    },
    stack: ['Next.js', 'React', 'TypeScript', 'PHP', 'Nginx'],
    links: [{ label: { en: 'Live site', ru: 'Сайт' }, href: 'https://strikerstat.com' }],
    cover: { en: '/images/projects/strikerstat-en.webp', ru: '/images/projects/strikerstat-ru.webp' },
    coverAlt: { en: 'Strikerstat home page', ru: 'Главная Strikerstat' },
  },
  {
    slug: 'orbit',
    title: 'Orbit',
    kind: 'side',
    featured: false,
    period: { en: '2026', ru: '2026' },
    role: { en: 'Everything, from idea to production', ru: 'Всё: от идеи до запуска' },
    tagline: {
      en: 'Voice-first life inbox: a Telegram bot that turns voice notes into a categorized dashboard.',
      ru: 'Голосовой инбокс: Telegram-бот превращает голосовые заметки в структурированный дашборд.',
    },
    problem: {
      en: 'Ideas and tasks come as voice notes on the go and get lost in chats. I wanted a private place where a voice message becomes a structured entry I can review on my own schedule.',
      ru: 'Идеи и задачи приходят голосовыми на ходу и теряются в чатах. Хотелось приватное место, где голосовое сообщение становится структурированной записью, к которой можно вернуться в удобное время.',
    },
    work: {
      en: 'Built end to end as a side project: a Telegram bot that transcribes voice with Whisper, categorizes entries with an LLM into structured JSON and stores them in Supabase Postgres with row-level security; a SvelteKit dashboard for review; daily and weekly summaries as bot commands. Developed with AI coding agents as part of the workflow, deployed through GitHub Actions.',
      ru: 'Собрал целиком как пет-проект: Telegram-бот транскрибирует голос через Whisper, LLM раскладывает записи по категориям в структурированный JSON, хранение в Supabase Postgres с row-level security; дашборд на SvelteKit; ежедневные и недельные сводки командами бота. Разрабатывал с ИИ-агентами как частью процесса, деплой через GitHub Actions.',
    },
    result: {
      en: 'Open source and in daily use. Also a working example of how I build with AI agents in the loop.',
      ru: 'Открытый код, в ежедневном использовании. Заодно рабочий пример того, как я строю продукты с ИИ-агентами.',
    },
    stack: ['Bun', 'Telegraf', 'SvelteKit', 'Svelte 5', 'Supabase', 'OpenAI', 'GitHub Actions'],
    links: [
      { label: { en: 'Live', ru: 'Сайт' }, href: 'https://orbit.abuki.dev' },
      { label: { en: 'Source on GitHub', ru: 'Код на GitHub' }, href: 'https://github.com/vito2005/orbit' },
    ],
    cover: { en: '/images/projects/orbit.webp', ru: '/images/projects/orbit.webp' },
    coverAlt: { en: 'Orbit dashboard: notes filtered by the 3D category', ru: 'Дашборд Orbit: записи в категории «3d»' },
  },
]

export const findProject = (slug: string): Project | undefined =>
  projects.find(project => project.slug === slug)

export const featuredProjects = (): Project[] => projects.filter(project => project.featured)

/**
 * i18n key for the line where a card shows the company, for projects that have
 * none: client work done freelance, or a project of my own.
 */
export const projectOriginKey = (project: Project): string =>
  project.kind === 'freelance' ? 'projects.freelance' : 'projects.side_project'
