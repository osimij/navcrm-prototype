import ts from 'typescript'

const f = ts.factory
const displayProps = new Set(['title', 'subtitle', 'description', 'label', 'hint', 'placeholder', 'emptyText', 'emptyMessage', 'aria-label', 'aria-description', 'aria-placeholder', 'alt', 'content', 'prefix', 'suffix', 'text', 'message'])
const clean = (s) => s.replace(/\s+/g, ' ').trim()
const formatters = new Set(['formatDate', 'formatDateLong', 'formatDay', 'formatDayTime', 'formatRelative', 'formatDuration', 'formatMoney', 'formatNumber', 'formatListTime', 'formatPercent', 'formatQty', 'monthLong', 'monthShort', 'dayLong', 'dayShort', 'plural'])
function hasFormatter(node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && formatters.has(node.expression.text)) return true
  return ts.forEachChild(node, hasFormatter) ?? false
}
function jsxText(text) {
  const lines = text.replace(/\r/g, '').split('\n')
  return lines.map((line, i) => {
    let s = line.replace(/\t/g, ' ')
    if (i !== 0) s = s.replace(/^ +/, '')
    if (i !== lines.length - 1) s = s.replace(/ +$/, '')
    return s && i < lines.length - 1 ? s + ' ' : s
  }).join('')
}
const call = (name, args) => f.createCallExpression(f.createIdentifier(name), undefined, args)
export function transformLocalization(source, filename) {
  const sf = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, filename.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  if (!/\.[tj]sx?$/.test(filename) || filename.includes('/i18n/')) return null
  let used = false
  const result = ts.transform(sf, [(ctx) => {
    const visit = (node) => {
      if (ts.isCallExpression(node) && /^(useMemo|React\.useMemo)$/.test(node.expression.getText(sf)) && node.arguments.length > 1) {
        used = true
        const args = node.arguments.map((arg, index) => index === 1 ? f.createArrayLiteralExpression([f.createSpreadElement(arg), call('__ruLocale', [])]) : ts.visitNode(arg, visit))
        return f.updateCallExpression(node, node.expression, node.typeArguments, args)
      }
      if (ts.isCallExpression(node) && /^(toast|toast\.(success|error|info|warning|message|loading))$/.test(node.expression.getText(sf))) {
        used = true
        const args = node.arguments.map((arg, index) => call(index === 0 ? '__ruNode' : '__ruToast', [ts.visitNode(arg, visit)]))
        return f.updateCallExpression(node, node.expression, node.typeArguments, args)
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'toLocaleString' && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && node.arguments[0].text === 'en-US') {
        used = true
        return f.updateCallExpression(node, node.expression, node.typeArguments, [call('__ruLocale', []), ...node.arguments.slice(1)])
      }
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === 'includes' && ts.isCallExpression(node.expression.expression) && ts.isPropertyAccessExpression(node.expression.expression.expression) && node.expression.expression.expression.name.text === 'toLowerCase') {
        used = true
        const lower = node.expression.expression
        const search = call('__ruSearch', [lower.expression.expression])
        const target = f.createCallExpression(f.createPropertyAccessExpression(search, 'toLowerCase'), undefined, [])
        return f.updateCallExpression(node, f.createPropertyAccessExpression(target, 'includes'), node.typeArguments, node.arguments)
      }
      if (ts.isJsxElement(node) || ts.isJsxFragment(node)) {
        if (ts.isJsxElement(node) && node.openingElement.attributes.properties.some((attr) => ts.isJsxAttribute(attr) && attr.name.getText(sf) === 'translate' && attr.initializer && ts.isStringLiteral(attr.initializer) && attr.initializer.text === 'no')) return node
        const opening = ts.isJsxElement(node) ? ts.visitNode(node.openingElement, visit) : node.openingFragment
        const closing = ts.isJsxElement(node) ? node.closingElement : node.closingFragment
        const children = node.children.map((child) => ts.isJsxExpression(child) && child.expression && (ts.isStringLiteral(child.expression) || ts.isNoSubstitutionTemplateLiteral(child.expression)) ? f.createJsxText(child.expression.text) : ts.visitNode(child, visit))
        let text = '', args = [], hasText = false
        for (const child of children) {
          if (ts.isJsxText(child)) {
            const value = jsxText(child.text)
            text += value
            if (/[a-zA-Z]/.test(value)) hasText = true
          } else if (ts.isJsxExpression(child) && !child.expression) {
            continue
          } else {
            const expression = ts.isJsxExpression(child) ? child.expression : child
            text += `{${args.length}}`
            args.push(expression)
          }
        }
        if (hasText) {
          used = true
          const expr = args.length ? call('__ruRich', [f.createStringLiteral(text), f.createArrayLiteralExpression(args)]) : call('__ruRender', [f.createStringLiteral(text)])
          const translated = f.createJsxExpression(undefined, expr)
          return ts.isJsxElement(node) ? f.updateJsxElement(node, opening, [translated], closing) : f.updateJsxFragment(node, opening, [translated], closing)
        }
        return ts.isJsxElement(node) ? f.updateJsxElement(node, opening, children, closing) : f.updateJsxFragment(node, opening, children, closing)
      }
      if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
        used = true
        const expression = ts.visitNode(node.expression, visit)
        return f.updateJsxExpression(node, hasFormatter(node.expression) ? call('__ruComputed', [f.createArrowFunction(undefined, undefined, [], undefined, f.createToken(ts.SyntaxKind.EqualsGreaterThanToken), expression)]) : call('__ruRender', [expression]))
      }
      if (ts.isJsxAttribute(node) && displayProps.has(node.name.getText(sf)) && node.initializer) {
        used = true
        if (ts.isStringLiteral(node.initializer)) return f.updateJsxAttribute(node, node.name, f.createJsxExpression(undefined, call('__ruText', [f.createStringLiteral(node.initializer.text)])))
        if (ts.isJsxExpression(node.initializer) && node.initializer.expression) return f.updateJsxAttribute(node, node.name, f.createJsxExpression(undefined, call('__ruNode', [ts.visitNode(node.initializer.expression, visit)])))
      }
      if (ts.isJsxAttribute(node) && ['items', 'options'].includes(node.name.getText(sf)) && node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        used = true
        return f.updateJsxAttribute(node, node.name, f.createJsxExpression(undefined, call('__ruOptions', [ts.visitNode(node.initializer.expression, visit)])))
      }
      const updated = ts.visitEachChild(node, visit, ctx)
      const component = (ts.isFunctionDeclaration(node) && node.name && /^[A-Z]/.test(node.name.text)) ||
        ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isVariableDeclaration(node.parent) && /^[A-Z]/.test(node.parent.name.getText(sf))) ||
        ((ts.isArrowFunction(node) || ts.isFunctionExpression(node)) && ts.isCallExpression(node.parent) && /forwardRef/.test(node.parent.expression.getText(sf)))
      if (component && updated.body) {
        used = true
        const hook = f.createExpressionStatement(call('__ruSubscribe', []))
        const body = ts.isBlock(updated.body) ? f.updateBlock(updated.body, [hook, ...updated.body.statements]) : f.createBlock([hook, f.createReturnStatement(updated.body)], true)
        if (ts.isFunctionDeclaration(updated)) return f.updateFunctionDeclaration(updated, updated.modifiers, updated.asteriskToken, updated.name, updated.typeParameters, updated.parameters, updated.type, body)
        if (ts.isArrowFunction(updated)) return f.updateArrowFunction(updated, updated.modifiers, updated.typeParameters, updated.parameters, updated.type, updated.equalsGreaterThanToken, body)
        if (ts.isFunctionExpression(updated)) return f.updateFunctionExpression(updated, updated.modifiers, updated.asteriskToken, updated.name, updated.typeParameters, updated.parameters, updated.type, body)
      }
      return updated
    }
    return (node) => ts.visitNode(node, visit)
  }])
  if (!used) { result.dispose(); return null }
  const output = ts.createPrinter().printFile(result.transformed[0])
  result.dispose()
  const scope = filename.slice(filename.lastIndexOf('/src/') + 1)
  return `import { scoped as __ruScoped, searchText as __ruSearch, getLocale as __ruLocale, toastOptions as __ruToast, useLanguage as __ruSubscribe } from '@/i18n';\nconst { text: __ruText, node: __ruNode, rich: __ruRich, render: __ruRender, computed: __ruComputed, options: __ruOptions } = __ruScoped(${JSON.stringify(scope)});\n${output}`
}

export default function localizationPlugin() {
  return {
    name: 'navcrm-localization',
    enforce: 'pre',
    transform(source, id) {
      if (!id.includes('/src/') || id.includes('/node_modules/') || id.includes('/i18n/')) return null
      const code = transformLocalization(source, id.split('?')[0])
      return code ? { code, map: null } : null
    },
  }
}
export { jsxText, clean, displayProps }
