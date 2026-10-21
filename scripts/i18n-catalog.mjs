import ts from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
import { displayProps, transformLocalization } from './i18n-transform.mjs'
const keys = new Map()
const add = (s, p, kind) => {
  const key = s.replace(/\s+/g, ' ').trim()
  if (!/[A-Za-z]{2}/.test(key)) return
  const entry = keys.get(key) ?? { en: key, locations: [], kinds: [] }
  if (!entry.locations.includes(p)) entry.locations.push(p)
  if (!entry.kinds.includes(kind)) entry.kinds.push(kind)
  keys.set(key, entry)
}
const skipAttrs = new Set(['className', 'class', 'id', 'key', 'value', 'type', 'name', 'href', 'to', 'src', 'target', 'rel', 'htmlFor', 'size', 'variant', 'align', 'side', 'color', 'data-state', 'autoComplete', 'inputMode', 'role', 'method', 'format', 'accept', 'viewBox', 'd', 'fill', 'stroke', 'strokeWidth', 'fontFamily'])
function human(s) {
  return /[A-Z]/.test(s) || (/\s/.test(s) && /[a-z]{2}/i.test(s)) || /[a-z][.!?…]/i.test(s)
}
function codeLike(s) {
  if (s.split(/\s+/).every(w => /^[!\w:[\]()/.-]+$/.test(w) && (/[-:[\]\/]/.test(w) || ['flex','grid','relative','absolute','hidden','block','inline','truncate','tabular','sticky','fixed','uppercase'].includes(w)))) return true
  if (/var\(--|(?:^| )duration-\d|^hidden\s|^clip-path|^pointer-events-/.test(s)) return true
  if (/^(?:[a-z]+[A-Z][A-Za-z]*|Arrow(?:Left|Right|Up|Down)|en-US|ru-RU)$/.test(s)) return true
  if (/^[a-zA-Z0-9_./-]+\.(?:com|tj|jpg|png|xlsx|csv)(?:\/[a-zA-Z0-9_./-]*)?$/.test(s)) return true
  if (/^(?:linear-gradient|radial-gradient|repeating-linear-gradient|cursor-|line-through)/.test(s) || s.includes('minmax(')) return true
  return /(?:^[@./#]|https?:|^\w+:\/\/|^\w+@\w|\b(?:bg-|text-|flex-|grid-|rounded-|border-|px-|py-|gap-|ring-|hover:|sm:|lg:|data-\[)|^(?:scale[XY]|translate[XY])\(|^(?:flex|relative|absolute|tabular|group\/row|w-full)\b|^\[|^--|^\^|\$\{|<\/|^M\d|^\d+:\d+$)/.test(s)
}
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (p.startsWith('src/i18n')) continue
    if (fs.statSync(p).isDirectory()) { walk(p); continue }
    if (!/\.[tj]sx?$/.test(p)) continue
    const source = fs.readFileSync(p, 'utf8')
    const sf = ts.createSourceFile(p, source, ts.ScriptTarget.Latest, true)
    function visit(n) {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
        const par = n.parent
        const skip = ts.isImportDeclaration(par) || ts.isExportDeclaration(par) || ts.isLiteralTypeNode(par) ||
          ((ts.isPropertyAssignment(par) || ts.isPropertySignature(par)) && par.name === n) ||
          (ts.isElementAccessExpression(par) && par.argumentExpression === n) ||
          (ts.isJsxAttribute(par) && skipAttrs.has(par.name.getText(sf))) ||
          (ts.isPropertyAssignment(par) && skipAttrs.has(par.name.getText(sf)) && par.name.getText(sf) !== 'name')
        let jsxBranch = false
        if (ts.isConditionalExpression(par) && (par.whenTrue === n || par.whenFalse === n)) {
          let ancestor = par.parent
          while (ancestor && !ts.isStatement(ancestor)) {
            if (ts.isJsxAttribute(ancestor)) { jsxBranch = displayProps.has(ancestor.name.getText(sf)); break }
            if (ts.isJsxExpression(ancestor)) jsxBranch = true
            ancestor = ancestor.parent
          }
        }
        const displayValue = ts.isPropertyAssignment(par) && ['label', 'name', 'title', 'description', 'hint', 'unit', 'content', 'short', 'text', 'prep'].includes(par.name.getText(sf))
        if (!skip && (human(n.text) || displayValue || jsxBranch) && !codeLike(n.text)) add(n.text, p, 'literal')
      }
      if (ts.isTemplateExpression(n)) {
        const s = n.head.text + n.templateSpans.map((span, i) => `{${i}}${span.literal.text}`).join('')
        if (!codeLike(s)) add(s, p, 'template')
      }
      ts.forEachChild(n, visit)
    }
    visit(sf)
    const transformed = transformLocalization(source, '/'+p)
    if (transformed) {
      const output = ts.createSourceFile(p, transformed, ts.ScriptTarget.Latest, true)
      function collect(n) {
        if (ts.isCallExpression(n) && ['__ruText', '__ruRich', '__ruRender'].includes(n.expression.getText(output)) && ts.isStringLiteral(n.arguments[0])) add(n.arguments[0].text, p, n.expression.getText(output) === '__ruRich' ? 'rich' : 'jsx')
        ts.forEachChild(n, collect)
      }
      collect(output)
    }
  }
}
walk('src')
const catalog = [...keys.values()]
const dictionary = JSON.parse(fs.readFileSync('src/i18n/ru.json', 'utf8'))
const missing = catalog.filter((entry) => !(entry.en in dictionary))
fs.writeFileSync('/tmp/navcrm-translation-catalog.json', JSON.stringify(catalog, null, 2))
fs.writeFileSync('/tmp/navcrm-missing-translations.json', JSON.stringify(missing, null, 2))
console.log(JSON.stringify({ total: catalog.length, translated: catalog.length - missing.length, missing: missing.length }))
if (process.argv.includes('--check') && missing.length) process.exitCode = 1
