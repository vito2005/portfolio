/**
 * Builds the Open Graph cards (1200×630 JPEG) for every page into `public/og/`,
 * plus the site icons (favicon.ico, PNG favicons, home-screen and manifest icons). Content changes rarely, so the cards are
 * rendered once by this script and committed, instead of being drawn by the
 * server on each request.
 *
 * Usage: start the dev server (`npm run dev -- --port 3010`), then
 *   npm run og                 # light cards, the site's look
 *   OG_THEME=dark npm run og   # the dark set, for a future dark theme
 * BASE_URL overrides the dev server address the avatar is rendered from.
 *   npm run og -- --icons-only # just the site icons, no dev server needed
 *
 * Messengers (VK, LinkedIn) still skip webp previews, hence JPEG.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, type Browser, type Page } from 'playwright'
import type { LabExperiment, LocaleCode, Project } from '../../app/data/types.ts'
import { labExperiments } from '../../app/data/lab.ts'
import { heroStack } from '../../app/data/profile.ts'
import { projects } from '../../app/data/projects.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = join(ROOT, 'public/og')
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3010'
const LOCALES: LocaleCode[] = ['ru', 'en']

const THEMES = {
  light: { bg: '#F9F8F6', ink: '#111111', soft: '#4A4946', mute: '#6E6B65', eyebrow: '#0a7a5b', tagBg: '#FFFFFF', tagBorder: '#E3E0DA', accentShape: 'background:#e3f5ee', frame: '#FFFFFF', frameLine: '#E3E0DA' },
  dark: { bg: '#151413', ink: '#F9F8F6', soft: '#C9C5BD', mute: '#A19D95', eyebrow: '#12b488', tagBg: '#262421', tagBorder: '#262421', accentShape: 'background:radial-gradient(circle,rgba(18,180,136,.30),rgba(18,180,136,0) 65%)', frame: '#262421', frameLine: '#33302C' },
}
const theme = THEMES[process.env.OG_THEME === 'dark' ? 'dark' : 'light']

type Messages = Record<string, Record<string, string>>
const messages = Object.fromEntries(await Promise.all(LOCALES.map(async locale =>
  [locale, JSON.parse(await readFile(join(ROOT, `i18n/locales/${locale}.json`), 'utf8')) as Messages],
))) as Record<LocaleCode, Messages>

/** The A.B. monogram from SiteLogo.vue, letters in the theme's ink. */
const LOGO = `<svg viewBox="28 16 194 99" height="34" fill="none"><path d="M28 111 L55 111 L117 44 L118 115 L196 115 L203 113 L216 103 L222 88 L221 77 L218 71 L212 64 L204 59 L207 56 L210 47 L208 32 L200 22 L187 16 L114 16 L28 111 Z M140 36 L185 36 L190 44 L185 53 L181 55 L153 55 L153 73 L195 74 L199 77 L202 83 L200 91 L193 96 L141 96 Z M105.5 72.5 L75 105.5 L105.5 105.5 Z" fill="${theme.ink}" fill-rule="evenodd"/><path d="M105.5 72.5 L75 105.5 H105.5 Z" fill="#12b488"/></svg>`

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function page(body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:opsz,wght@9..40,400;9..40,500&display=block" rel="stylesheet">
<style>
*{margin:0;box-sizing:border-box}
html,body{width:1200px;height:630px;overflow:hidden}
body{font-family:"DM Sans",sans-serif;position:relative;background:${theme.bg};color:${theme.ink}}
.logo{position:absolute;left:72px;top:56px}
.eyebrow{font-size:20px;letter-spacing:.32em;text-transform:uppercase;font-weight:500;color:${theme.eyebrow}}
h1{font-family:"DM Serif Display",serif;font-weight:400;letter-spacing:-.01em;line-height:1.02;margin-top:20px}
.text{color:${theme.soft};line-height:1.35;margin-top:20px}
.tags{display:flex;gap:10px;flex-wrap:wrap;margin-top:28px}
.tag{font-size:20px;padding:6px 14px;border-radius:8px;background:${theme.tagBg};border:1px solid ${theme.tagBorder}}
.site{position:absolute;left:72px;bottom:48px;font-size:22px;font-weight:500;color:${theme.mute}}
.clamp{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden}
</style></head><body>${body}</body></html>`
}

/** Home: the hero in one card, the waving avatar at its desk on the right. */
function homeCard(locale: LocaleCode, avatar: string): string {
  const hero = messages[locale].hero!
  return page(`
<div style="position:absolute;right:-80px;top:-60px;width:720px;height:760px;border-radius:50%;${theme.accentShape}"></div>
<div class="logo">${LOGO}</div>
<div style="position:absolute;left:72px;top:180px;width:560px">
  <div class="eyebrow">${escapeHtml(hero.eyebrow!)}</div>
  <h1 style="font-size:${locale === 'en' ? 66 : 76}px;white-space:nowrap">${escapeHtml(hero.title!)}</h1>
  <p class="text" style="font-size:27px;max-width:500px">${escapeHtml(hero.subtitle!)}</p>
  <div class="tags">${heroStack.map(name => `<span class="tag">${escapeHtml(name)}</span>`).join('')}</div>
</div>
<div class="site">abuki.dev</div>
<img src="${avatar}" style="position:absolute;right:-110px;top:10px;width:780px;height:780px">`)
}

interface ContentCardOptions {
  eyebrow: string
  title: string
  text: string
  meta?: string
  image: string
  /** Height ÷ width of the picture in the frame. */
  imageRatio: number
}

/** Projects, case studies and Lab pages: copy on the left, the picture in a browser frame on the right. */
function contentCard({ eyebrow, title, text, meta, image, imageRatio }: ContentCardOptions): string {
  const frameWidth = 500
  const imageHeight = Math.round(frameWidth * imageRatio)
  return page(`
<div style="position:absolute;right:-120px;top:-40px;width:700px;height:720px;border-radius:50%;${theme.accentShape}"></div>
<div class="logo">${LOGO}</div>
<div style="position:absolute;left:72px;top:150px;width:500px">
  <div class="eyebrow">${escapeHtml(eyebrow)}</div>
  <h1 class="clamp" style="font-size:${title.length > 16 ? 58 : 70}px;-webkit-line-clamp:2">${escapeHtml(title)}</h1>
  <p class="text clamp" style="font-size:25px;-webkit-line-clamp:3">${escapeHtml(text)}</p>
  ${meta ? `<p style="margin-top:22px;font-size:20px;color:${theme.mute}">${escapeHtml(meta)}</p>` : ''}
</div>
<div class="site">abuki.dev</div>
<div style="position:absolute;right:64px;top:50%;transform:translateY(-50%);width:${frameWidth}px;border-radius:14px;overflow:hidden;background:${theme.frame};border:1px solid ${theme.frameLine};box-shadow:0 18px 50px rgba(17,17,17,.14)">
  <div style="height:30px;display:flex;align-items:center;gap:7px;padding:0 12px;border-bottom:1px solid ${theme.frameLine}">
    <i style="width:10px;height:10px;border-radius:50%;background:#e86f5a"></i><i style="width:10px;height:10px;border-radius:50%;background:#e8c15a"></i><i style="width:10px;height:10px;border-radius:50%;background:#6fc27a"></i>
  </div>
  <img src="${image}" style="display:block;width:100%;height:${imageHeight}px;object-fit:cover;object-position:top">
</div>`)
}

async function dataUrl(publicPath: string): Promise<string> {
  const file = await readFile(join(ROOT, 'public', publicPath))
  const type = publicPath.endsWith('.webp') ? 'image/webp' : publicPath.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  return `data:${type};base64,${file.toString('base64')}`
}

/**
 * The hero avatar mid-wave, at its desk, on a transparent background: rendered
 * from the running site at 4× so it stays sharp at card size. The wave's timing
 * depends on load, so a burst of frames is taken and the one with the hand
 * highest wins: only a raised hand reaches into the left fifth of the frame
 * near the top (the lowered one hangs by the hip).
 */
async function renderAvatar(browser: Browser): Promise<string> {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 4 })
  const tab = await context.newPage()
  await tab.goto(`${BASE_URL}/ru`, { waitUntil: 'networkidle' })
  await tab.addStyleTag({ content: 'html,body,body *{background:transparent!important} body *{visibility:hidden!important} canvas[role="img"]{visibility:visible!important}' })
  await tab.waitForFunction(() => {
    const canvas = document.querySelector('canvas[role="img"]')
    return canvas && getComputedStyle(canvas).opacity === '1'
  }, null, { timeout: 60_000 })
  const box = (await tab.locator('canvas[role="img"]').boundingBox())!

  let best = { top: Infinity, png: Buffer.alloc(0) }
  // A 4× screenshot takes ~0.7 s, so 10 frames cover the whole five-second wave.
  for (let frame = 0; frame < 10; frame++) {
    const png = await tab.screenshot({ clip: box, omitBackground: true })
    const top = await tab.evaluate(async (base64) => {
      const image = new Image()
      image.src = `data:image/png;base64,${base64}`
      await image.decode()
      const canvas = document.createElement('canvas')
      canvas.width = image.width
      canvas.height = image.height
      const context = canvas.getContext('2d')!
      context.drawImage(image, 0, 0)
      const rowWidth = Math.round(image.width / 5)
      const { data } = context.getImageData(0, 0, rowWidth, image.height)
      for (let index = 3; index < data.length; index += 4) {
        if (data[index]! > 128) {
          return Math.floor((index - 3) / 4 / rowWidth)
        }
      }
      return Infinity
    }, png.toString('base64'))
    if (top < best.top) {
      best = { top, png }
    }
  }
  await context.close()
  return `data:image/png;base64,${best.png.toString('base64')}`
}

/**
 * The site icons, all from favicon.svg (the A.B. tile). Browsers that skip SVG
 * favicons (Safari and Chrome on iOS, in the address-bar suggestions) otherwise
 * fall back to /favicon.ico and show a stray letter. Home-screen and manifest
 * icons are full-bleed: the platforms round the corners themselves.
 */
async function renderIcons(tab: Page) {
  const svg = await dataUrl('/favicon.svg')
  async function renderPng(size: number, fullBleed: boolean): Promise<Buffer> {
    await tab.setViewportSize({ width: size, height: size })
    await tab.setContent(`<body style="margin:0;background:${fullBleed ? '#111111' : 'transparent'}"><img src="${svg}" style="display:block;width:${size}px;height:${size}px"></body>`)
    return tab.screenshot({ type: 'png', omitBackground: !fullBleed })
  }

  const icons: Array<[string, number, boolean]> = [
    ['favicon-32.png', 32, false],
    ['apple-touch-icon.png', 180, true],
    ['icon-192.png', 192, true],
    ['icon-512.png', 512, true],
  ]
  for (const [file, size, fullBleed] of icons) {
    await writeFile(join(ROOT, 'public', file), await renderPng(size, fullBleed))
    console.log(file)
  }

  // favicon.ico: an ICO container around 32 and 48 px PNGs (PNG-in-ICO is fine everywhere since Vista).
  const images = [await renderPng(32, false), await renderPng(48, false)]
  const header = Buffer.alloc(6 + 16 * images.length)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)
  let offset = header.length
  images.forEach((image, index) => {
    const size = index === 0 ? 32 : 48
    const entry = 6 + 16 * index
    header.writeUInt8(size, entry)
    header.writeUInt8(size, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += image.length
  })
  await writeFile(join(ROOT, 'public/favicon.ico'), Buffer.concat([header, ...images]))
  console.log('favicon.ico')
}

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 } })
  const tab = await context.newPage()

  async function shoot(html: string, file: string) {
    await tab.setContent(html, { waitUntil: 'networkidle' })
    await tab.evaluate(() => document.fonts.ready)
    await mkdir(dirname(join(OUT, file)), { recursive: true })
    await tab.screenshot({ path: join(OUT, file), type: 'jpeg', quality: 88 })
    console.log('og/' + file)
  }

  // `npm run og -- --icons-only` skips the cards (and the dev server they need).
  if (process.argv.includes('--icons-only')) {
    await renderIcons(tab)
    await browser.close()
    return
  }

  const avatar = await renderAvatar(browser)
  const pick = (text: Record<LocaleCode, string>, locale: LocaleCode) => text[locale]

  for (const locale of LOCALES) {
    const t = messages[locale]
    await shoot(homeCard(locale, avatar), `home-${locale}.jpg`)

    const featured = projects.find(project => project.featured)!
    await shoot(contentCard({
      eyebrow: t.seo!.name!,
      title: t.projects!.title!,
      text: t.projects!.intro!,
      image: await dataUrl(pick(featured.cover, locale)),
      imageRatio: 0.5,
    }), `projects-${locale}.jpg`)

    await shoot(contentCard({
      eyebrow: t.seo!.name!,
      title: t.lab!.title!,
      text: t.lab!.subtitle!,
      image: await dataUrl(`/images/lab/${labExperiments[0]!.slug}.webp`),
      imageRatio: 9 / 16,
    }), `lab-${locale}.jpg`)

    for (const project of projects as Project[]) {
      const meta = [pick(project.role, locale), project.company, project.period && pick(project.period, locale)]
        .filter(Boolean)
        .join(' · ')
      await shoot(contentCard({
        eyebrow: t.projects!.title!,
        title: project.title,
        text: pick(project.tagline, locale),
        meta,
        image: await dataUrl(pick(project.cover, locale)),
        imageRatio: 0.5,
      }), `projects/${project.slug}-${locale}.jpg`)
    }

    for (const experiment of labExperiments as LabExperiment[]) {
      await shoot(contentCard({
        eyebrow: t.lab!.title!,
        title: pick(experiment.title, locale),
        text: pick(experiment.description, locale),
        image: await dataUrl(`/images/lab/${experiment.slug}.webp`),
        imageRatio: 9 / 16,
      }), `lab/${experiment.slug}-${locale}.jpg`)
    }
  }

  await renderIcons(tab)

  await browser.close()
}

await main()
