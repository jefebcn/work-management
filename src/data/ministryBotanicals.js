/**
 * Database botanicals — DM 10 agosto 2018 (Ministero della Salute)
 * Belfrit list — Allegato 1 "Piante e derivati vegetali"
 *
 * Schema per voce:
 * {
 *   id: string,           // kebab-case, univoco
 *   latinName: string,    // nome botanico ufficiale
 *   commonName: string,   // nome comune italiano
 *   englishName: string,
 *   family: string,       // famiglia botanica
 *   belfritId: string,    // codice Belfrit (es. "BF.035")
 *   decreeRef: string,    // riferimento normativo
 *   typicalDE: number,    // rapporto D:E tipico (estratto secco)
 *   typicalTitle: number, // titolazione tipica % (decimale, es. 0.8 = 0.8%)
 *   activeMarker: string, // marker di titolazione
 *   parts: [
 *     {
 *       partCode: string,   // 'radix' | 'herba' | 'flos' | 'fructus' | 'folium' | 'cortex' | 'rhizoma'
 *       partLabel: string,  // italiano: 'Radice', 'Sommità fiorite', ecc.
 *       claims: string[],   // claim tradizionali autorizzati per quella parte
 *       prescriptions: string[], // avvertenze obbligatorie
 *     }
 *   ]
 * }
 */

export const MINISTRY_BOTANICALS = [
  // ── VALERIANA ──────────────────────────────────────────────────────────────
  {
    id: 'valeriana',
    latinName: 'Valeriana officinalis L.',
    commonName: 'Valeriana',
    englishName: 'Valerian',
    family: 'Caprifoliaceae',
    belfritId: 'BF.035',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 4.5,
    typicalTitle: 0.8,
    activeMarker: 'Acidi valerenici',
    parts: [
      {
        partCode: 'radix',
        partLabel: 'Radice/Rizoma',
        claims: [
          'Favorisce il normale rilassamento',
          'Contribuisce al normale sonno',
          'Aiuta a mantenere un sonno normale e ristoratore',
          'Contribuisce alla riduzione della tensione nervosa',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non adatto ai bambini al di sotto dei 12 anni',
          'In caso di assunzione prolungata (> 4 settimane) consultare il medico',
          'Non assumere in gravidanza o durante l\'allattamento senza consiglio medico',
          'Può determinare sonnolenza; evitare la guida di veicoli e l\'uso di macchinari',
          'Non assumere con bevande alcoliche',
        ],
      },
    ],
  },

  // ── PASSIFLORA ─────────────────────────────────────────────────────────────
  {
    id: 'passiflora',
    latinName: 'Passiflora incarnata L.',
    commonName: 'Passiflora',
    englishName: 'Passionflower',
    family: 'Passifloraceae',
    belfritId: 'BF.026',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 4,
    typicalTitle: 2.0,
    activeMarker: 'Vitexina',
    parts: [
      {
        partCode: 'herba',
        partLabel: 'Parti aeree / Sommità fiorite',
        claims: [
          'Favorisce il normale rilassamento',
          'Contribuisce alla normale gestione dello stress',
          'Sostiene il benessere mentale in condizioni di stress',
          'Contribuisce al normale sonno',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non adatto ai bambini al di sotto dei 12 anni',
          'Non assumere in gravidanza o durante l\'allattamento senza consiglio medico',
          'Può determinare sonnolenza; usare con cautela alla guida',
        ],
      },
    ],
  },

  // ── CURCUMA ────────────────────────────────────────────────────────────────
  {
    id: 'curcuma',
    latinName: 'Curcuma longa L.',
    commonName: 'Curcuma',
    englishName: 'Turmeric',
    family: 'Zingiberaceae',
    belfritId: 'BF.013',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 20,
    typicalTitle: 95.0,
    activeMarker: 'Curcuminoidi',
    parts: [
      {
        partCode: 'rhizoma',
        partLabel: 'Rizoma',
        claims: [
          'Contribuisce alla normale funzione digestiva',
          'Favorisce la normale produzione di bile',
          'Contribuisce alla protezione delle cellule dallo stress ossidativo',
          'Supporta il normale benessere articolare',
          'Contribuisce al mantenimento del normale stato infiammatorio fisiologico',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non assumere in caso di calcoli biliari o ostruzione delle vie biliari',
          'Non assumere in caso di terapia anticoagulante senza consiglio medico',
          'Sconsigliato in gravidanza e durante l\'allattamento',
          'Assumere con un pasto per migliorare l\'assorbimento',
        ],
      },
    ],
  },

  // ── CARDO MARIANO ──────────────────────────────────────────────────────────
  {
    id: 'cardo-mariano',
    latinName: 'Silybum marianum (L.) Gaertn.',
    commonName: 'Cardo Mariano',
    englishName: 'Milk Thistle',
    family: 'Asteraceae',
    belfritId: 'BF.006',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 32,
    typicalTitle: 70.0,
    activeMarker: 'Silimarina (silibina)',
    parts: [
      {
        partCode: 'fructus',
        partLabel: 'Frutti (acheni)',
        claims: [
          'Contribuisce al normale funzionamento del fegato',
          'Favorisce la normale funzione digestiva',
          'Contribuisce alla protezione delle cellule epatiche dallo stress ossidativo',
          'Sostiene il normale metabolismo dei lipidi nel fegato',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non assumere in caso di allergia alle Asteraceae/Compositae',
          'Non assumere durante la gravidanza e l\'allattamento senza consiglio medico',
          'Consultare il medico in caso di patologie epatiche accertate',
        ],
      },
    ],
  },

  // ── ECHINACEA ──────────────────────────────────────────────────────────────
  {
    id: 'echinacea',
    latinName: 'Echinacea purpurea (L.) Moench',
    commonName: 'Echinacea',
    englishName: 'Purple Coneflower',
    family: 'Asteraceae',
    belfritId: 'BF.016',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 5,
    typicalTitle: 4.0,
    activeMarker: 'Polifenoli (acido cicorico)',
    parts: [
      {
        partCode: 'herba',
        partLabel: 'Parti aeree fiorite',
        claims: [
          'Contribuisce al normale funzionamento del sistema immunitario',
          'Supporta le difese naturali dell\'organismo',
          'Utile nei periodi di maggiore esposizione agli agenti stagionali',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non adatto ai bambini al di sotto dei 12 anni senza consiglio medico',
          'Non assumere in caso di allergia alle Asteraceae/Compositae',
          'Non utilizzare per periodi superiori a 8 settimane consecutive',
          'Non assumere in caso di patologie autoimmuni o immunodepressione',
          'Non assumere durante la gravidanza e l\'allattamento senza consiglio medico',
        ],
      },
      {
        partCode: 'radix',
        partLabel: 'Radice',
        claims: [
          'Contribuisce al normale funzionamento del sistema immunitario',
          'Supporta le difese naturali dell\'organismo',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non assumere in caso di allergia alle Asteraceae/Compositae',
          'Non utilizzare per periodi superiori a 8 settimane consecutive',
          'Non assumere in caso di patologie autoimmuni',
          'Non assumere durante la gravidanza e l\'allattamento senza consiglio medico',
        ],
      },
    ],
  },

  // ── GINKGO BILOBA ──────────────────────────────────────────────────────────
  {
    id: 'ginkgo',
    latinName: 'Ginkgo biloba L.',
    commonName: 'Ginkgo Biloba',
    englishName: 'Ginkgo',
    family: 'Ginkgoaceae',
    belfritId: 'BF.019',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 50,
    typicalTitle: 24.0,
    activeMarker: 'Ginkgoflavonoidi (24%) + Terpenoidi (6%)',
    parts: [
      {
        partCode: 'folium',
        partLabel: 'Foglia',
        claims: [
          'Contribuisce alla normale circolazione periferica',
          'Favorisce la normale funzione cognitiva',
          'Supporta la memoria e la concentrazione',
          'Contribuisce al normale flusso sanguigno cerebrale',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non assumere in caso di terapia anticoagulante o antiaggregante',
          'Non assumere in caso di disturbi della coagulazione',
          'Sospendere l\'assunzione 2 settimane prima di interventi chirurgici',
          'Non adatto ai bambini al di sotto dei 12 anni',
          'Non assumere durante la gravidanza e l\'allattamento senza consiglio medico',
          'Può interagire con farmaci anticoagulanti (warfarin, aspirina)',
        ],
      },
    ],
  },

  // ── IPERICO ────────────────────────────────────────────────────────────────
  {
    id: 'hypericum',
    latinName: 'Hypericum perforatum L.',
    commonName: 'Iperico (Erba di San Giovanni)',
    englishName: 'St. John\'s Wort',
    family: 'Hypericaceae',
    belfritId: 'BF.022',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 6,
    typicalTitle: 0.3,
    activeMarker: 'Ipericina',
    parts: [
      {
        partCode: 'herba',
        partLabel: 'Sommità fiorite',
        claims: [
          'Contribuisce al normale tono dell\'umore',
          'Favorisce il benessere emotivo',
          'Contribuisce alla normale gestione degli stati d\'ansia lieve',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Può ridurre l\'efficacia di numerosi farmaci (antiretrovirali, contraccettivi orali, ciclosporina, digossina, warfarin, anticonvulsivanti): consultare il medico se si assumono farmaci',
          'Può causare fotosensibilizzazione: evitare l\'esposizione prolungata al sole',
          'Non assumere in concomitanza con antidepressivi',
          'Non adatto ai bambini al di sotto dei 18 anni',
          'Non assumere durante la gravidanza e l\'allattamento',
          'In caso di umore depresso persistente consultare il medico',
        ],
      },
    ],
  },

  // ── GINSENG ────────────────────────────────────────────────────────────────
  {
    id: 'ginseng',
    latinName: 'Panax ginseng C.A. Meyer',
    commonName: 'Ginseng Coreano',
    englishName: 'Korean Ginseng',
    family: 'Araliaceae',
    belfritId: 'BF.020',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 5,
    typicalTitle: 5.0,
    activeMarker: 'Ginsenosidi',
    parts: [
      {
        partCode: 'radix',
        partLabel: 'Radice',
        claims: [
          'Contribuisce al mantenimento delle normali performance fisiche',
          'Contribuisce alla normale resistenza alla fatica',
          'Supporta le normali difese dell\'organismo',
          'Favorisce la normale vitalità e il tono generale',
          'Contribuisce alla normale funzione cognitiva',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non adatto ai bambini al di sotto dei 12 anni',
          'Non assumere in caso di ipertensione non controllata',
          'Non assumere in concomitanza con anticoagulanti o aspirina senza consiglio medico',
          'Evitare l\'uso prolungato (> 3 mesi) senza consulto medico',
          'Non assumere durante la gravidanza e l\'allattamento',
          'Può causare insonnia se assunto nelle ore serali',
        ],
      },
    ],
  },

  // ── RODIOLA ────────────────────────────────────────────────────────────────
  {
    id: 'rhodiola',
    latinName: 'Rhodiola rosea L.',
    commonName: 'Rodiola',
    englishName: 'Rhodiola / Rose Root',
    family: 'Crassulaceae',
    belfritId: 'BF.029',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 7,
    typicalTitle: 3.0,
    activeMarker: 'Rosavina + Salidroside',
    parts: [
      {
        partCode: 'radix',
        partLabel: 'Radice/Rizoma',
        claims: [
          'Contribuisce alla normale gestione dello stress',
          'Favorisce la normale resistenza alla fatica mentale e fisica',
          'Supporta il normale tono dell\'umore e il benessere psicofisico',
          'Contribuisce alla normale performance cognitiva',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non adatto ai bambini al di sotto dei 12 anni',
          'Non assumere in caso di disturbi bipolari o eccitabilità',
          'Non assumere in gravidanza o durante l\'allattamento senza consiglio medico',
          'Può interferire con farmaci antidepressivi: consultare il medico',
          'Evitare l\'assunzione nelle ore serali per possibile effetto stimolante',
        ],
      },
    ],
  },

  // ── ASHWAGANDHA ────────────────────────────────────────────────────────────
  {
    id: 'ashwagandha',
    latinName: 'Withania somnifera (L.) Dunal',
    commonName: 'Ashwagandha (Withania)',
    englishName: 'Ashwagandha / Indian Ginseng',
    family: 'Solanaceae',
    belfritId: 'BF.037',
    decreeRef: 'DM 10/08/2018 All. 1',
    typicalDE: 9,
    typicalTitle: 5.0,
    activeMarker: 'Withanolidi',
    parts: [
      {
        partCode: 'radix',
        partLabel: 'Radice',
        claims: [
          'Contribuisce alla normale gestione dello stress',
          'Favorisce il normale rilassamento e il benessere mentale',
          'Contribuisce alla normale resistenza alla fatica fisica',
          'Supporta il normale equilibrio ormonale in condizioni di stress cronico',
        ],
        prescriptions: [
          'Non superare la dose giornaliera indicata',
          'Non adatto ai bambini al di sotto dei 18 anni',
          'Non assumere in gravidanza (può avere effetti abortivi)',
          'Non assumere in caso di patologie tiroidee senza consiglio medico',
          'Non assumere in caso di patologie autoimmuni senza consiglio medico',
          'Può interagire con farmaci sedativi, immunosoppressori e tiroxina: consultare il medico',
        ],
      },
    ],
  },
]

/**
 * Filtra le piante per testo libero (nome comune, latino, inglese, ID).
 * @param {string} query
 * @returns {typeof MINISTRY_BOTANICALS}
 */
export function filterBotanicalsByQuery(query) {
  if (!query) return MINISTRY_BOTANICALS
  const q = query.toLowerCase().trim()
  return MINISTRY_BOTANICALS.filter(b =>
    b.commonName.toLowerCase().includes(q) ||
    b.latinName.toLowerCase().includes(q) ||
    b.englishName.toLowerCase().includes(q) ||
    b.id.includes(q) ||
    (b.belfritId || '').toLowerCase().includes(q),
  )
}
