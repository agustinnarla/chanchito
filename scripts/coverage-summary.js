// Prints a Markdown coverage table from Vitest json-summary reports.
// Usage: node scripts/coverage-summary.js "Label=path/to/coverage-summary.json" ...
import { existsSync, readFileSync } from 'node:fs'

const metrics = ['lines', 'statements', 'functions', 'branches']

const rows = process.argv.slice(2).map((arg) => {
  const [label, file] = arg.split('=')
  if (!label || !file || !existsSync(file)) {
    return `| ${label ?? arg} | ${metrics.map(() => 'sin datos').join(' | ')} |`
  }
  const { total } = JSON.parse(readFileSync(file, 'utf8'))
  return `| ${label} | ${metrics.map((m) => `${total[m].pct}%`).join(' | ')} |`
})

console.log(
  [
    '### Cobertura',
    '',
    '| Paquete | Líneas | Sentencias | Funciones | Ramas |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n'),
)
