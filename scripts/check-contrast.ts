// Contrast ratio (WCAG 2.2, 1.4.3 and 1.4.11) of every text/background pair of the theme tokens in app/globals.css,
// in the light (:root) and dark (.dark) themes. Translucent colors are composited over the surface they sit on.
// Usage: npx tsx scripts/check-contrast.ts   (exits with 1 when a pair is below its minimum)
import { readFileSync } from 'node:fs'
import path from 'node:path'

type Rgba = [number, number, number, number]
type Theme = 'light' | 'dark'

interface Pair {
  text: string
  background: string
  // Surface under a translucent background (for example a status tint over a card).
  over?: string
  kind: 'text' | 'large-text' | 'ui'
  usage: string
}

const MINIMUM = { text: 4.5, 'large-text': 3, ui: 3 }

const PAIRS: Pair[] = [
  { text: 'foreground', background: 'background', kind: 'text', usage: 'Body text on the page' },
  { text: 'foreground', background: 'card', kind: 'text', usage: 'Body text on cards' },
  { text: 'foreground', background: 'muted', kind: 'text', usage: 'Text on muted tiles' },
  { text: 'card-foreground', background: 'card', kind: 'text', usage: 'Card text' },
  { text: 'muted-foreground', background: 'background', kind: 'text', usage: 'Secondary text on the page' },
  { text: 'muted-foreground', background: 'card', kind: 'text', usage: 'Secondary text on cards' },
  { text: 'muted-foreground', background: 'muted', kind: 'text', usage: 'Secondary text on muted tiles' },
  { text: 'accent-text', background: 'card', kind: 'text', usage: 'Links and accents on cards' },
  { text: 'accent-text', background: 'muted', kind: 'text', usage: 'Links and accents on muted tiles' },
  { text: 'orange-text', background: 'card', kind: 'text', usage: 'Orange text on cards' },
  { text: 'orange-text', background: 'background', kind: 'text', usage: 'Orange text on the page' },
  { text: 'orange-text', background: 'status-available-bg', over: 'card', kind: 'text', usage: 'Orange text on orange tint' },
  { text: 'primary-foreground', background: 'primary', kind: 'text', usage: 'Primary button text' },
  { text: 'on-orange', background: 'brand-orange', kind: 'text', usage: 'Text on brand orange (buttons, badges)' },
  { text: 'status-passed', background: 'status-passed-bg', over: 'card', kind: 'text', usage: 'Passed status' },
  { text: 'status-passed', background: 'card', kind: 'text', usage: 'Passed amounts on cards' },
  { text: 'status-progress', background: 'status-progress-bg', over: 'card', kind: 'text', usage: 'In progress status' },
  { text: 'status-available', background: 'status-available-bg', over: 'card', kind: 'text', usage: 'Available status' },
  { text: 'status-blocked', background: 'status-blocked-bg', over: 'card', kind: 'text', usage: 'Blocked status' },
  { text: 'status-failed', background: 'status-failed-bg', over: 'card', kind: 'text', usage: 'Failed status and errors' },
  { text: 'status-failed', background: 'muted', kind: 'text', usage: 'Error text on muted tiles' },
  { text: 'relation-prerequisite-text', background: 'relation-prerequisite', kind: 'text', usage: 'Flowchart prerequisite tag' },
  { text: 'relation-unlock-text', background: 'relation-unlock', kind: 'text', usage: 'Flowchart unlocked subject tag' },
  { text: 'control-border', background: 'card', kind: 'ui', usage: 'Border of form controls' },
  { text: 'control-border', background: 'background', kind: 'ui', usage: 'Border of form controls on the page' },
  { text: 'ring', background: 'card', kind: 'ui', usage: 'Keyboard focus ring' },
]

// Custom properties declared directly in a CSS block (`:root {` or `.dark {`).
function readBlock(css: string, selector: string) {
  const start = css.indexOf(`${selector} {`)
  if (start < 0) throw new Error(`Block ${selector} not found`)
  const body = css.slice(start, css.indexOf('\n}', start))
  const tokens: Record<string, string> = {}
  for (const match of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[match[1]] = match[2].trim()
  return tokens
}

function parseColor(value: string): Rgba {
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1]
    return [0, 2, 4].map((offset) => parseInt(digits.slice(offset, offset + 2), 16)).concat(1) as Rgba
  }
  const rgb = value.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+)(%?))?\s*\)$/i)
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]) / (rgb[5] ? 100 : 1)
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), alpha]
  }
  if (value === 'white') return [255, 255, 255, 1]
  throw new Error(`Unsupported color: ${value}`)
}

function resolve(tokens: Record<string, string>, name: string, depth = 0): Rgba {
  const value = tokens[name]
  if (value === undefined) throw new Error(`Token --${name} is not defined`)
  const reference = value.match(/^var\(--([\w-]+)\)$/)
  if (reference && depth < 10) return resolve(tokens, reference[1], depth + 1)
  return parseColor(value)
}

const composite = ([r, g, b, a]: Rgba, [br, bg, bb]: Rgba): Rgba => [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a), 1]

function luminance([r, g, b]: Rgba) {
  const channel = (value: number) => {
    const c = value / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(a: Rgba, b: Rgba) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

function check(theme: Theme, tokens: Record<string, string>) {
  const page = resolve(tokens, 'background')
  return PAIRS.map((pair) => {
    const under = composite(pair.over ? resolve(tokens, pair.over) : page, page)
    const background = composite(resolve(tokens, pair.background), under)
    const text = composite(resolve(tokens, pair.text), background)
    const ratio = contrastRatio(text, background)
    return { theme, ...pair, ratio, ok: ratio >= MINIMUM[pair.kind] }
  })
}

const css = readFileSync(path.join(process.cwd(), 'app/globals.css'), 'utf8')
const light = readBlock(css, ':root')
const dark = { ...light, ...readBlock(css, '.dark') }
const results = [...check('light', light), ...check('dark', dark)]

for (const result of results) {
  const status = result.ok ? 'ok  ' : 'FAIL'
  const minimum = MINIMUM[result.kind].toFixed(1)
  console.log(
    `${status} ${result.theme.padEnd(5)} ${result.ratio.toFixed(2).padStart(5)}:1 (min ${minimum}) --${result.text} on --${result.background}${result.over ? ` over --${result.over}` : ''} · ${result.usage}`,
  )
}
const failures = results.filter((result) => !result.ok)
console.log(failures.length ? `\n${failures.length} pair(s) below the minimum.` : `\nAll ${results.length} pairs meet WCAG 2.2 AA.`)
process.exitCode = failures.length ? 1 : 0
