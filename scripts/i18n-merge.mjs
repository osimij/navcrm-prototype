import fs from 'node:fs'
const content = fs.readFileSync(0, 'utf8')
const dictionary = JSON.parse(fs.readFileSync('src/i18n/ru.json', 'utf8'))
let added = 0
for (const line of content.split('\n')) {
  if (!line.trim()) continue
  const tab = line.indexOf('\t')
  if (tab < 0) throw new Error('Missing tab: ' + line)
  const key = line.slice(0, tab).trim(), value = line.slice(tab + 1).trim()
  if (!key || !value) throw new Error('Empty key or translation: ' + line)
  if (!(key in dictionary)) added++
  dictionary[key] = value
}
fs.writeFileSync('src/i18n/ru.json', JSON.stringify(dictionary, null, 2) + '\n')
console.log({ added, total: Object.keys(dictionary).length })
