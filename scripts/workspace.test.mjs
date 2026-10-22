import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRequire } from 'node:module'
import { buildSync } from 'esbuild'

const require = createRequire(import.meta.url)
const saved = new Map()
globalThis.localStorage = {
  getItem: (key) => saved.get(key) ?? null,
  setItem: (key, value) => saved.set(key, value),
  removeItem: (key) => saved.delete(key),
}
function bundle(entry) {
  const code = buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', write: false, external: ['react'], logLevel: 'silent' }).outputFiles[0].text
  const module = { exports: {} }
  // Zustand's browser storage adapter reads window.localStorage. Keep the
  // browser shim scoped to this bundle so unrelated stores remain in Node mode.
  const browser = entry === 'src/lib/workspace.ts' ? { localStorage: globalThis.localStorage } : undefined
  new Function('module', 'exports', 'require', 'window', code)(module, module.exports, require, browser)
  return module.exports
}

test('Workspace layout choices survive reload without coupling independent sections', () => {
  saved.clear()
  const { useWorkspace } = bundle('src/lib/workspace.ts')
  useWorkspace.getState().toggleSidebar()
  useWorkspace.getState().setSection('home:performance', true)
  useWorkspace.getState().setSection('nav:Money', false)
  const restored = bundle('src/lib/workspace.ts').useWorkspace.getState()
  assert.equal(restored.sidebarCollapsed, true)
  assert.equal(restored.sections['home:performance'], true)
  assert.equal(restored.sections['nav:Money'], false)
  useWorkspace.getState().toggleSidebar()
  assert.equal(useWorkspace.getState().sections['home:performance'], true)
})

test('Switching conversations preserves each draft, including the new-chat draft', () => {
  const { useAssistant } = bundle('src/pages/assistant/store.ts')
  const state = () => useAssistant.getState()
  state().setDraft(null, 'Проверить завтрашнюю загрузку')
  const first = state().ensureChat('Revenue')
  state().setDraft(first, 'Why did revenue change?')
  state().newChat()
  const second = state().ensureChat('Schedule')
  state().setDraft(second, 'У кого свободное время?')
  state().setActive(first)
  assert.equal(state().drafts[first], 'Why did revenue change?')
  assert.equal(state().drafts[second], 'У кого свободное время?')
  state().newChat()
  assert.equal(state().drafts.new, 'Проверить завтрашнюю загрузку')
})

test('An answer finishing after a chat switch updates only its original conversation', () => {
  const { useAssistant } = bundle('src/pages/assistant/store.ts')
  const state = () => useAssistant.getState()
  const first = state().ensureChat('Revenue')
  state().addMessage(first, { id: 'pending-1', role: 'assistant', pending: true })
  state().newChat()
  const second = state().ensureChat('Schedule')
  state().resolve(first, 'pending-1', [{ type: 'text', text: 'Revenue answer' }])
  assert.equal(state().activeId, second)
  assert.equal(state().chats.find((c) => c.id === second).messages.length, 0)
  assert.deepEqual(state().chats.find((c) => c.id === first).messages[0].blocks, [{ type: 'text', text: 'Revenue answer' }])
  assert.equal(state().chats.find((c) => c.id === first).messages[0].pending, false)
})

test('Chat titles stay compact while the complete user question remains intact', () => {
  const { useAssistant } = bundle('src/pages/assistant/store.ts')
  const state = () => useAssistant.getState()
  const question = '  Сравни выручку\nза последние семь дней\n' + '1234567890'.repeat(24)
  const first = state().ensureChat(question)
  state().addMessage(first, { id: 'original', role: 'user', text: question })
  const chat = state().chats.find((c) => c.id === first)
  assert.equal(chat.title, 'Сравни выручку')
  assert.equal(chat.titleIsUserText, true)
  assert.equal(chat.messages[0].text, question)

  state().newChat()
  const second = state().ensureChat('📅'.repeat(100))
  const title = state().chats.find((c) => c.id === second).title
  assert.equal(Array.from(title).length, 72)
  assert.equal(title, '📅'.repeat(71) + '…')
})
