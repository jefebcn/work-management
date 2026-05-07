const SYNONYM_MAP = {
  'mg':     'magnesio',
  'zn':     'zinco',
  'ca':     'calcio',
  'fe':     'ferro',
  'cu':     'rame',
  'mn':     'manganese',
  'se':     'selenio',
  'cr':     'cromo',
  'mo':     'molibdeno',
  'k':      'potassio',
  'na':     'sodio',
  'vit.':   'vitamina',
  'vit':    'vitamina',
  'vit.c':  'vitamina c',
  'vit.d':  'vitamina d',
  'vit.e':  'vitamina e',
  'vit.b1': 'vitamina b1',
  'vit.b2': 'vitamina b2',
  'vit.b6': 'vitamina b6',
  'vit.b12':'vitamina b12',
  'aa':     'acido ascorbico',
  'mcc':    'cellulosa microcristallina',
  'peg':    'polietilenglicole',
  'pvp':    'polivinilpirrolidone',
  'hpmc':   'idrossipropilmetilcellulosa',
  'cmc':    'carbossimetilcellulosa',
}

const SYNONYM_RE = new RegExp(
  '\\b(' + Object.keys(SYNONYM_MAP).map(k => k.replace('.', '\\.')).join('|') + ')\\b',
  'gi',
)

export function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(SYNONYM_RE, match => SYNONYM_MAP[match.toLowerCase()] ?? match)
}

const LUBRICANT_PATTERNS = ['stearato', 'stear', 'lubrif', 'talco', 'silice', 'aerosil', 'stearin', 'antiader']

export function isLubricantName(name) {
  const norm = normalizeName(name)
  return LUBRICANT_PATTERNS.some(p => norm.includes(p))
}

export function suggestCategory(name) {
  if (isLubricantName(name)) return 'lubrificante'
  return null
}
