import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { buildSync, transformSync } from 'esbuild'
import { transformLocalization } from './i18n-transform.mjs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
const require = createRequire(import.meta.url)
function bundle(entry) {
  const code = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], logLevel: 'silent' }).outputFiles[0].text
  const module = { exports: {} }
  new Function('module', 'exports', 'require', code)(module, module.exports, require)
  return module.exports
}
const locale = bundle('src/i18n/index.ts')
test('English remains intact and technical values are never translated', () => {
  locale.setLanguage('en')
  assert.equal(locale.text('New client'), 'New client')
  locale.setLanguage('ru')
  assert.equal(locale.text('New client'), 'Новый клиент')
  assert.equal(locale.node('b1'), 'b1')
  assert.equal(locale.node('/clients'), '/clients')
  assert.equal(locale.node('Nilufar Davlatova'), 'Nilufar Davlatova')
  assert.deepEqual(locale.node({ value: 'Cash' }), { value: 'Cash' })
})
test('Rich translations preserve numbers and inline elements across switches', () => {
  locale.setLanguage('en')
  const message = locale.rich('Revenue {0}{1}', [createElement('b', null, '·'), 'Today so far'])
  assert.equal(renderToStaticMarkup(message), 'Revenue <b>·</b>Today so far')
  locale.setLanguage('ru')
  assert.equal(renderToStaticMarkup(message), 'Выручка <b>·</b>Сегодня на данный момент')
  locale.setLanguage('en')
  assert.equal(renderToStaticMarkup(message), 'Revenue <b>·</b>Today so far')
})
test('Dynamic messages and named template fields translate accurately', () => {
  locale.setLanguage('ru')
  assert.equal(locale.text('Visit booked for 14:30'), 'Визит запланирован на 14:30')
  assert.equal(locale.text('Hi Nilufar! Testing our new WhatsApp number.'), 'Здравствуйте, Nilufar! Проверяем наш новый номер WhatsApp.')
})
test('Locale-specific search finds translated labels and retains originals', () => {
  assert.match(locale.searchText('Lash lamination').toLowerCase(), /ламинирование/)
  assert.match(locale.searchText('Lash lamination').toLowerCase(), /lash lamination/)
})
test('The source transform retains expressions, event handlers and stored IDs', () => {
  const source = `export function Example({count, name, choose}) { return <button value="cash" onClick={() => choose('cash')} aria-label="New client">Showing {count} of {name} clients</button> }`
  const output = transformLocalization(source, '/project/src/test.tsx')
  assert.match(output, /__ruSubscribe\(\)/)
  assert.match(output, /value="cash"/)
  assert.match(output, /choose\('cash'\)/)
  assert.match(output, /__ruRender\(count\)/)
  assert.match(output, /__ruRender\(name\)/)
  assert.match(output, /Showing \{0\} of \{1\} clients/)
  const compiled = transformSync(output, { loader: 'tsx', format: 'esm' })
  assert.ok(compiled.code.includes('count'))
})
test('User content can explicitly opt out of translation', () => {
  const output = transformLocalization('export function Note({text}) { return <p translate="no">{text}</p> }', '/project/src/note.tsx')
  assert.ok(!output.includes('__ruRender(text)'))
})


test('Composite labels, empty suffixes and contextual meanings are accurate', () => {
  locale.setLanguage('ru')
  assert.equal(locale.text('Full body massage + Back massage'), 'Общий массаж тела + Массаж спины')
  assert.equal(locale.text('Haircut + beard + Men’s haircut'), 'Стрижка волос и бороды + Мужская стрижка')
  assert.equal(locale.text('Venous blood, Capillary blood'), 'Венозная кровь, Капиллярная кровь')
  assert.equal(locale.text('1 no-show so far'), 'Неявок на данный момент: 1')
  assert.equal(locale.text('Receipt', 'src/pages/inventory/documents.tsx'), 'Поступление')
  assert.equal(locale.text('Receipt', 'src/pages/register/receipts.tsx'), 'Чек')
  assert.equal(locale.text('Free', 'src/pages/settings/pages/billing.tsx'), 'Бесплатный')
  assert.equal(locale.text('Free', 'src/pages/calendar/views.tsx'), 'Свободно')
  assert.equal(locale.text('1 from Google, 1 from Instagram'), 'Из Google: 1, из Instagram: 1')
  assert.equal(locale.text('nail artist'), 'мастер маникюра')
  assert.equal(locale.text('H-001 · Venous blood'), 'H-001 · Венозная кровь')
  assert.equal(locale.text('Women’s haircut, Blow-dry & styling +2'), 'Женская стрижка, Укладка феном +2')
})

test('Toast options preserve action handlers and stored metadata', () => {
  locale.setLanguage('ru')
  const onClick = () => {}
  const source = { description: 'All changes are saved', action: { label: 'Undo', onClick }, id: 'cash', duration: 5000 }
  const result = locale.toastOptions(source)
  assert.equal(result.description, 'Все изменения сохранены')
  assert.equal(result.action.label, 'Отменить действие')
  assert.equal(result.action.onClick, onClick)
  assert.equal(result.id, 'cash')
  assert.equal(source.action.label, 'Undo')
})

test('Russian counted phrases inflect numbers correctly', () => {
  locale.setLanguage('ru')
  assert.equal(locale.text('Visited in the last 1 days'), 'Приходили за 1 день')
  assert.equal(locale.text('Visited in the last 2 days'), 'Приходили за 2 дня')
  assert.equal(locale.text('Visited in the last 5 days'), 'Приходили за 5 дней')
  assert.equal(locale.text('Visited in the last 21 days'), 'Приходили за 21 день')
  assert.equal(renderToStaticMarkup(locale.rich('Birthday within {0} days', [1])), 'День рождения в течение 1 дня')
})

const formatCode = buildSync({ stdin: { contents: "export { setLanguage } from './src/i18n'; export * from './src/lib/format'; export { formatQty } from './src/pages/inventory/data'", resolveDir: process.cwd(), loader: 'ts' }, bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], logLevel: 'silent' }).outputFiles[0].text
const formatModule = { exports: {} }
new Function('module', 'exports', 'require', formatCode)(formatModule, formatModule.exports, require)
const format = formatModule.exports

test('Russian dates, decimals, stock units and all plural categories', () => {
  format.setLanguage('ru')
  assert.equal(format.formatMoney(1234.5, { decimals: true }).replace(/\s/g, ' '), '1 234,50 TJS')
  assert.equal(format.formatDateLong(new Date(2026, 9, 22)), 'четверг, 22 октября')
  assert.equal(format.formatDuration(90), '1 ч 30 мин')
  assert.equal(format.formatQty(3.4, 'l'), '3,4 л')
  assert.equal(format.formatQty(14, 'pcs'), '14 шт.')
  assert.deepEqual([1, 2, 5, 11, 21].map(n => format.plural(n, 'client')), ['1 клиент', '2 клиента', '5 клиентов', '11 клиентов', '21 клиент'])
  format.setLanguage('en')
  assert.equal(format.formatMoney(1234.5, { decimals: true }), '1,234.50 TJS')
  assert.equal(format.formatDateLong(new Date(2026, 9, 22)), 'Thursday, 22 October')
})

test('Translations never introduce an unknown interpolation field', () => {
  const dictionary = require('../src/i18n/ru.json')
  for (const [source, translation] of Object.entries(dictionary)) {
    const sourceFields = [...source.matchAll(/\{(\w+)\}/g)].map(match => match[1])
    const targetFields = [...translation.matchAll(/\{(\w+)(?:\|[^{}]+)?\}/g)].map(match => match[1])
    assert.ok(targetFields.every(field => sourceFields.includes(field)), source)
  }
})

test('Memoized presentation data refreshes on a language change', () => {
  const code = transformLocalization('export function Panel() { const rows = useMemo(() => makeRows(), [items]); return <div>{rows}</div> }', '/project/src/panel.tsx')
  assert.match(code, /\[\.\.\.\[items\], __ruLocale\(\)\]/)
  const hook = transformLocalization('export function useRows() { return useMemo(() => makeRows(), [items]) }', '/project/src/data.ts')
  assert.match(hook, /__ruLocale\(\)/)
})

test('Formatted values in saved React content follow the current language', () => {
  const component = locale.computed(() => locale.getLanguage() === 'ru' ? '22 октября' : '22 October')
  locale.setLanguage('en')
  assert.equal(renderToStaticMarkup(component), '22 October')
  locale.setLanguage('ru')
  assert.equal(renderToStaticMarkup(component), '22 октября')
  const source = transformLocalization('export function Result({date}) { return <b>{formatDate(date)}</b> }', '/project/src/result.tsx')
  assert.match(source, /__ruComputed\(\(\) => formatDate\(date\)\)/)
})

test('Context and counted phrases also work through formatted inline values', () => {
  locale.setLanguage('ru')
  assert.equal(locale.text('free', 'src/pages/settings/pages/notifications.tsx'), 'бесплатно')
  assert.equal(renderToStaticMarkup(locale.rich('Birthday within {0} days', [locale.computed(() => '1')])), 'День рождения в течение 1 дня')
})

test('Dropdown labels retain their section context without changing selection values', () => {
  locale.setLanguage('ru')
  const source = [{ value: 'receipt', label: 'Receipt' }]
  const items = locale.options(source, 'src/pages/inventory/documents.tsx')
  assert.equal(items[0].label, 'Поступление')
  assert.equal(items[0].value, 'receipt')
  assert.equal(source[0].label, 'Receipt')
})

test('Technical identity templates cannot consume natural-language labels', () => {
  locale.setLanguage('ru')
  assert.equal(locale.text(' · Moves between rooms'), ' · Перемещается между кабинетами')
  assert.equal(locale.text('1200ms'), '1200ms')
  assert.equal(locale.text('0.15 TJS'), '0,15 TJS')
})
