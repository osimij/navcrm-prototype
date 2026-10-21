import { Fragment, createElement, isValidElement, type ReactNode } from 'react'
import translations from './ru.json'
import contexts from './ru-context.json'
import { getLanguage, useLanguage } from './language'
export { getLanguage, getLocale, setLanguage, useLanguage, type Language } from './language'

const dictionary = translations as Record<string, string>
const casefold = new Map(Object.entries(dictionary).map(([key, translation]) => [key.toLowerCase(), { key, translation }]))
const contextual = contexts as Record<string, Record<string, string>>
const scopeCache = new Map<string, Record<string, string>>()
function contextFor(scope?: string) {
  const key = scope ?? ''
  let context = scopeCache.get(key)
  if (!context) {
    context = Object.assign({}, ...Object.entries(contextual).filter(([prefix]) => scope?.startsWith(prefix)).sort(([a], [b]) => a.length - b.length).map(([, values]) => values)) as Record<string, string>
    scopeCache.set(key, context)
  }
  return context
}
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
function numericValue(value: unknown): number {
  if (isValidElement<{ value?: unknown; children?: unknown; evaluate?: () => unknown }>(value)) return numericValue(value.props.evaluate ? value.props.evaluate() : value.props.value ?? value.props.children)
  return Number(String(value ?? '').replace(/[\s\u00a0]/g, '').replace(',', '.'))
}

/** A catalog slot can supply the Russian one/few/many forms, including adjectives. */
function pluralSlots(template: string, value: (index: string) => unknown): string {
  return template.replace(/\{(\d+)\|([^{}|]+)\|([^{}|]+)\|([^{}|]+)\}/g, (_, index, one, few, many) => {
    const category = new Intl.PluralRules('ru-RU').select(numericValue(value(index)))
    return (category === 'one' ? one : category === 'few' ? few : many).replaceAll('#', `{${index}}`)
  })
}
const patterns = Object.entries(dictionary).filter(([key, translation]) => /\{\w+\}/.test(key) && (translation !== key || key === '{0} TJS')).map(([key, translation]) => {
  const ids: string[] = []
  const chunks = key.split(/(\{\w+\})/g).map((part) => {
    const match = /^\{(\w+)\}$/.exec(part)
    if (!match) return escapeRegex(part)
    ids.push(match[1]); return '(.*?)'
  })
  return { key, regex: new RegExp(`^${chunks.join('')}$`), translation, ids, specificity: key.replace(/\{\w+\}/g, '').length }
}).sort((a, b) => b.specificity - a.specificity)

/** Only presentation text is translated. IDs, stored values and input values stay intact. */
export function text(value: string, scope?: string): string {
  if (getLanguage() !== 'ru' || !value) return value
  const key = normalize(value)
  const overrides = contextFor(scope)
  let translated = overrides[key] ?? dictionary[key]
  if (translated === undefined && !/^[A-Z0-9_-]+$/.test(key)) {
    const match = casefold.get(key.toLowerCase())
    if (match) {
      const target = overrides[match.key] ?? match.translation
      translated = match.key === target ? value.trim() : /^[a-z]/.test(key) ? target.charAt(0).toLowerCase() + target.slice(1) : target
    }
  }
  if (translated === undefined && key.includes(', ')) {
    const parts = key.split(', ')
    if (parts.every((part) => part in dictionary)) translated = parts.map((part) => text(part, scope)).join(', ')
  }
  if (translated === undefined && key.includes(' + ')) {
    for (let position = key.lastIndexOf(' + '); position > 0; position = key.lastIndexOf(' + ', position - 1)) {
      const left = key.slice(0, position)
      if (left in dictionary) {
        translated = `${text(left, scope)} + ${text(key.slice(position + 3), scope)}`
        break
      }
    }
  }
  if (translated === undefined) {
    for (const pattern of patterns) {
      const match = pattern.regex.exec(key)
      if (!match) continue
      translated = pluralSlots(overrides[pattern.key] ?? pattern.translation, (index) => match[pattern.ids.indexOf(index) + 1]).replace(/\{(\w+)\}/g, (_, index) => {
        const position = pattern.ids.indexOf(index)
        return position < 0 ? '' : text(match[position + 1], scope)
      })
      break
    }
  }
  if (translated === undefined && value.includes('\n')) translated = value.split('\n').map((line) => text(line, scope)).join('\n')
  if (translated === undefined && key.includes(' · ')) translated = key.split(' · ').map((part) => text(part, scope)).join(' · ')
  if (translated === undefined && /\s\+\d+$/.test(key)) translated = key.replace(/^(.*)(\s\+\d+)$/, (_, base, rest) => text(base, scope) + rest)
  if (translated === undefined && /^[→←↗✓·]+\s*/.test(key)) translated = key.replace(/^([→←↗✓·]+\s*)(.+)$/, (_, prefix, rest) => prefix + text(rest, scope))
  if (translated === undefined && /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s/.test(key)) translated = key.replace(/^(\w+) (.+)$/, (_, day, rest) => `${text(day, scope)} ${rest}`)
  if (translated === undefined && /^[+−-]?\d+\.\d+$/.test(key)) translated = key.replace('.', ',')
  if (translated === undefined) return value
  return `${/^\s/.test(value) ? ' ' : ''}${translated}${/\s$/.test(value) ? ' ' : ''}`
}

export function node<T>(value: T, scope?: string): T {
  if (typeof value === 'string') return text(value, scope) as T
  if (Array.isArray(value)) return value.map((entry) => node(entry, scope)) as T
  return value
}

export function toastOptions<T>(value: T): T {
  if (!value || typeof value !== 'object') return value
  const options = value as Record<string, unknown>
  const action = (item: unknown) => item && typeof item === 'object' && 'label' in item ? { ...item, label: node(item.label) } : item
  return { ...options, description: node(options.description), action: action(options.action), cancel: action(options.cancel) } as T
}

/** Translate a whole sentence while retaining inline links, emphasis and data. */
function RichText({ source, values, scope }: { source: string; values: ReactNode[]; scope?: string }): ReactNode {
  useLanguage()
  const key = normalize(source)
  const template = getLanguage() === 'ru' ? pluralSlots(contextFor(scope)[key] ?? dictionary[key] ?? source, (index) => values[Number(index)]) : source
  const parts = template.split(/(\{\d+\})/g)
  return parts.map((part, index) => {
    const match = /^\{(\d+)\}$/.exec(part)
    return match ? createElement(Fragment, { key: index }, node(values[Number(match[1])], scope)) : node(part, scope)
  })
}

export function rich(source: string, values: ReactNode[], scope?: string): ReactNode {
  return createElement(RichText, { source, values, scope })
}

function TranslatedText({ value, scope }: { value: string; scope?: string }) {
  useLanguage()
  return text(value, scope)
}

export function render(value: ReactNode, scope?: string): ReactNode {
  if (typeof value === 'string') return createElement(TranslatedText, { value, scope })
  if (Array.isArray(value)) return value.map((part, index) => createElement(Fragment, { key: index }, render(part, scope)))
  return value
}

function ComputedText({ evaluate, scope }: { evaluate: () => ReactNode; scope?: string }) {
  useLanguage()
  return render(evaluate(), scope)
}

export function computed(evaluate: () => ReactNode, scope?: string) {
  return createElement(ComputedText, { evaluate, scope })
}

export function options<T>(value: T, scope?: string): T {
  if (!Array.isArray(value)) return value
  return value.map((item) => item && typeof item === 'object' && 'label' in item ? { ...item, label: node(item.label, scope), hint: node(item.hint, scope) } : item) as T
}

export function scoped(scope: string) {
  return { text: (value: string) => text(value, scope), node: <T>(value: T) => node(value, scope), rich: (source: string, values: ReactNode[]) => rich(source, values, scope), render: (value: ReactNode) => render(value, scope), computed: (evaluate: () => ReactNode) => computed(evaluate, scope), options: <T>(value: T) => options(value, scope) }
}

/** Search English and Russian labels while keeping the original stored values. */
const searchCache = new Map<string, string>()
const searchEntries = Object.entries(dictionary).filter(([key]) => !key.includes('{')).map(([key, translation]) => ({ key: key.toLowerCase(), translation, boundary: new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegex(key)}(?:$|[^\\p{L}\\p{N}])`, 'iu') }))
export function searchText(value: string): string {
  const cached = searchCache.get(value)
  if (cached) return cached
  const lower = value.toLowerCase()
  const translated = searchEntries.filter(({ key, boundary }) => lower.includes(key) && boundary.test(value)).map(({ translation }) => translation)
  const result = `${value} ${translated.join(' ')}`
  if (searchCache.size > 2000) searchCache.clear()
  searchCache.set(value, result)
  return result
}
