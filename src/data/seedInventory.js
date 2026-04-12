/**
 * Seed inventory — vitamine e minerali regolamentati (Min. Salute IT, rev. settembre 2021)
 * + eccipenti e ingredienti funzionali comuni.
 *
 * maxLimitMg  = apporto massimo giornaliero in mg (μg convertiti: μg ÷ 1000)
 * nrvReference = VNR (Valori Nutritivi di Riferimento) in mg — Reg. UE 1169/2011
 * titration   = % in peso dell'attivo puro nella materia prima
 *               (sale → base libera o forma equivalente, calcolato su PM molecolare)
 */

export const seedInventory = [

  // ── VITAMINE ────────────────────────────────────────────────────────────────

  {
    id: 'rm_seed_001',
    name: 'Acido Ascorbico (Vitamina C)',
    supplier: 'DSM Nutritional Products',
    pricePerKg: 8.50,
    purity: 99.5,
    titration: 100.0,
    activeNutrient: 'Vitamina C',
    maxLimitMg: 1000,        // 1000 mg/die — Min. Salute 2021
    nrvReference: 80,        // 80 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v01',
    name: 'Vitamina D3 Colecalciferolo 100.000 UI/g',
    supplier: 'Dishman Carbogen Amcis',
    pricePerKg: 1850.00,
    purity: 98.5,
    titration: 0.25,         // 100.000 UI/g → 2.500 μg D3/g = 0,25 %
    activeNutrient: 'Vitamina D3',
    maxLimitMg: 0.05,        // 50 μg/die — Min. Salute 2021
    nrvReference: 0.005,     // 5 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v02',
    name: 'DL-alfa-Tocoferolo Acetato (Vitamina E)',
    supplier: 'BASF SE',
    pricePerKg: 22.00,
    purity: 97.0,
    titration: 91.0,         // acetato → tocoferolo libero: PM 430,71 / PM 472,73 = 91 %
    activeNutrient: 'Vitamina E',
    maxLimitMg: 60,          // 60 mg alpha-TE/die — Min. Salute 2021
    nrvReference: 12,        // 12 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v03',
    name: 'Vitamina K1 Fillochinone (puro)',
    supplier: 'Zhejiang Yongning Pharmaceutical',
    pricePerKg: 3800.00,
    purity: 99.0,
    titration: 100.0,
    activeNutrient: 'Vitamina K1',
    maxLimitMg: 0.2,         // 200 μg/die — Min. Salute 2021
    nrvReference: 0.075,     // 75 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v04',
    name: 'Vitamina A Palmitato 250.000 UI/g',
    supplier: 'BASF SE',
    pricePerKg: 320.00,
    purity: 98.0,
    titration: 7.5,          // 250.000 UI/g × 0,3 μg RE/UI = 75 mg RE/g = 7,5 %
    activeNutrient: 'Vitamina A',
    maxLimitMg: 1.2,         // 1200 μg RE/die — Min. Salute 2021
    nrvReference: 0.8,       // 800 μg RE — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v05',
    name: 'Beta-Carotene 10% (Provitamina A)',
    supplier: 'DSM Nutritional Products',
    pricePerKg: 180.00,
    purity: 98.0,
    titration: 10.0,         // 10 % beta-carotene in carrier amidaceo
    activeNutrient: 'Beta-Carotene',
    maxLimitMg: 7.5,         // 7,5 mg/die come unica fonte vit. A — Min. Salute 2021
    nrvReference: 0,         // VNR non previsto per beta-carotene
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v06',
    name: 'Tiamina Cloridrato (Vitamina B1)',
    supplier: 'Jiangxi Tianxin Pharmaceutical',
    pricePerKg: 18.00,
    purity: 99.5,
    titration: 78.7,         // HCl → tiamina libera: PM 265,35 / PM 337,27 = 78,7 %
    activeNutrient: 'Tiamina (Vitamina B1)',
    maxLimitMg: 25,          // 25 mg/die — Min. Salute 2021
    nrvReference: 1.1,       // 1,1 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v07',
    name: 'Riboflavina (Vitamina B2)',
    supplier: 'DSM Nutritional Products',
    pricePerKg: 45.00,
    purity: 98.0,
    titration: 100.0,
    activeNutrient: 'Riboflavina (Vitamina B2)',
    maxLimitMg: 25,          // 25 mg/die — Min. Salute 2021
    nrvReference: 1.4,       // 1,4 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v08',
    name: 'Niacina (Acido Nicotinico)',
    supplier: 'Lonza Group',
    pricePerKg: 12.00,
    purity: 99.5,
    titration: 100.0,
    activeNutrient: 'Niacina',
    maxLimitMg: 54,          // 54 mg/die — Min. Salute 2021
    nrvReference: 16,        // 16 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v09',
    name: 'Nicotinamide (Niacinamide)',
    supplier: 'Vertellus Performance Materials',
    pricePerKg: 14.00,
    purity: 99.5,
    titration: 100.0,
    activeNutrient: 'Niacina',
    maxLimitMg: 54,          // stesso limite della niacina — Min. Salute 2021
    nrvReference: 16,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v10',
    name: 'Piridossina Cloridrato (Vitamina B6)',
    supplier: 'Hebei Welcome Pharmaceutical',
    pricePerKg: 28.00,
    purity: 99.0,
    titration: 82.3,         // HCl → piridossina libera: PM 169,18 / PM 205,64 = 82,3 %
    activeNutrient: 'Vitamina B6',
    maxLimitMg: 10,          // 10 mg/die — Min. Salute 2021
    nrvReference: 1.4,       // 1,4 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v11',
    name: 'Acido Folico (Vitamina B9)',
    supplier: 'Hengstenberg GmbH',
    pricePerKg: 95.00,
    purity: 98.0,
    titration: 100.0,
    activeNutrient: 'Acido Folico',
    maxLimitMg: 0.4,         // 400 μg/die — Min. Salute 2021
    nrvReference: 0.2,       // 200 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_006',
    name: 'Vitamina B12 Cianocobalamina 1%',
    supplier: 'Hebei Huarong Pharmaceutical',
    pricePerKg: 280.00,
    purity: 98.0,
    titration: 1.0,          // 1 % B12 in carrier (forma commerciale standard)
    activeNutrient: 'Vitamina B12',
    maxLimitMg: 1.0,         // 1000 μg/die — Min. Salute 2021
    nrvReference: 0.0024,    // 2,4 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v12',
    name: 'D-Biotina',
    supplier: 'Zhejiang Medicine Co.',
    pricePerKg: 380.00,
    purity: 99.0,
    titration: 100.0,
    activeNutrient: 'Biotina',
    maxLimitMg: 0.45,        // 450 μg/die — Min. Salute 2021
    nrvReference: 0.05,      // 50 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_v13',
    name: 'Calcio D-Pantothenato (Acido Pantotenico)',
    supplier: 'DSM Nutritional Products',
    pricePerKg: 22.00,
    purity: 99.0,
    titration: 92.0,         // sale Ca → ac. pantotenico libero: PM 219,24×2 / PM 476,54 = 92 %
    activeNutrient: 'Acido Pantotenico',
    maxLimitMg: 18,          // 18 mg/die — Min. Salute 2021
    nrvReference: 6,         // 6 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },

  // ── MINERALI ────────────────────────────────────────────────────────────────

  {
    id: 'rm_seed_m01',
    name: 'Calcio Carbonato',
    supplier: 'Omya AG',
    pricePerKg: 1.80,
    purity: 99.0,
    titration: 40.0,         // Ca in CaCO3: PM Ca 40,08 / PM 100,09 = 40,04 %
    activeNutrient: 'Calcio',
    maxLimitMg: 1200,        // 1200 mg/die — Min. Salute 2021
    nrvReference: 800,       // 800 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m02',
    name: 'Calcio Fosfato Bibasico Anidro (fonte Calcio)',
    supplier: 'Budenheim Group',
    pricePerKg: 3.20,
    purity: 99.0,
    titration: 29.5,         // Ca in CaHPO4: PM Ca 40,08 / PM 136,06 = 29,5 %
    activeNutrient: 'Calcio',
    maxLimitMg: 1200,
    nrvReference: 800,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m02b',
    name: 'Calcio Fosfato Bibasico Anidro (fonte Fosforo)',
    supplier: 'Budenheim Group',
    pricePerKg: 3.20,
    purity: 99.0,
    titration: 22.8,         // P in CaHPO4: PM P 30,97 / PM 136,06 = 22,8 %
    activeNutrient: 'Fosforo',
    maxLimitMg: 1200,        // 1200 mg/die — Min. Salute 2021
    nrvReference: 700,       // 700 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m03',
    name: 'Magnesio Carbonato (basico leggero)',
    supplier: 'Lehvoss Group',
    pricePerKg: 4.50,
    purity: 99.0,
    titration: 25.0,         // Mg elementare nella forma basica leggera ~25 %
    activeNutrient: 'Magnesio',
    maxLimitMg: 450,         // 450 mg/die — Min. Salute 2021
    nrvReference: 375,       // 375 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m04',
    name: 'Magnesio Ossido (leggero)',
    supplier: 'Dead Sea Bromine Group',
    pricePerKg: 3.80,
    purity: 99.0,
    titration: 60.3,         // Mg in MgO: PM Mg 24,31 / PM 40,30 = 60,3 %
    activeNutrient: 'Magnesio',
    maxLimitMg: 450,
    nrvReference: 375,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m05',
    name: 'Ferro Fumarato',
    supplier: 'Lehvoss Group',
    pricePerKg: 28.00,
    purity: 98.0,
    titration: 32.9,         // Fe in C4H2FeO4: PM Fe 55,84 / PM 169,90 = 32,9 %
    activeNutrient: 'Ferro',
    maxLimitMg: 30,          // 30 mg/die — Min. Salute 2021
    nrvReference: 14,        // 14 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_003',
    name: 'Zinco Gluconato',
    supplier: 'Lehvoss Group',
    pricePerKg: 42.00,
    purity: 98.0,
    titration: 14.35,        // Zn in Zn(C6H11O7)2: PM Zn 65,38 / PM 455,68 = 14,35 %
    activeNutrient: 'Zinco',
    maxLimitMg: 15,          // 15 mg/die adulti — Min. Salute 2021
    nrvReference: 10,        // 10 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m06',
    name: 'Rame Gluconato',
    supplier: 'Lehvoss Group',
    pricePerKg: 65.00,
    purity: 98.0,
    titration: 14.0,         // Cu in Cu(C6H11O7)2: PM Cu 63,55 / PM 453,84 = 14,0 %
    activeNutrient: 'Rame',
    maxLimitMg: 2,           // 2 mg/die — Min. Salute 2021
    nrvReference: 1,         // 1 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m07',
    name: 'Manganese Gluconato',
    supplier: 'Lehvoss Group',
    pricePerKg: 38.00,
    purity: 98.0,
    titration: 12.3,         // Mn in Mn(C6H11O7)2: PM Mn 54,94 / PM 445,25 = 12,3 %
    activeNutrient: 'Manganese',
    maxLimitMg: 10,          // 10 mg/die — Min. Salute 2021
    nrvReference: 2,         // 2 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m08',
    name: 'Sodio Fluoruro (Fluoro)',
    supplier: 'Sigma-Aldrich',
    pricePerKg: 8.00,
    purity: 99.0,
    titration: 45.2,         // F in NaF: PM F 19,00 / PM NaF 41,99 = 45,2 %
    activeNutrient: 'Fluoro',
    maxLimitMg: 4,           // 4 mg/die — Min. Salute 2021
    nrvReference: 3.5,       // 3,5 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m09',
    name: 'Selenometionina 0,1% (Selenio)',
    supplier: 'Pharma Waldhof GmbH',
    pricePerKg: 420.00,
    purity: 99.0,
    titration: 0.1,          // 0,1 % Se in carrier (lievito selenizzato standardizzato)
    activeNutrient: 'Selenio',
    maxLimitMg: 0.1,         // 100 μg/die — Min. Salute 2021
    nrvReference: 0.055,     // 55 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m10',
    name: 'Cromo Picolinato',
    supplier: 'Lonza Group',
    pricePerKg: 280.00,
    purity: 99.0,
    titration: 12.4,         // Cr in Cr(C6H4NO2)3: PM Cr 52,00 / PM 418,33 = 12,4 %
    activeNutrient: 'Cromo',
    maxLimitMg: 0.25,        // 250 μg/die — Min. Salute 2021
    nrvReference: 0.04,      // 40 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m11',
    name: 'Sodio Molibdato Diidrato (Molibdeno)',
    supplier: 'H.C. Starck GmbH',
    pricePerKg: 120.00,
    purity: 99.0,
    titration: 39.7,         // Mo in Na2MoO4·2H2O: PM Mo 95,96 / PM 241,95 = 39,7 %
    activeNutrient: 'Molibdeno',
    maxLimitMg: 0.1,         // 100 μg/die — Min. Salute 2021
    nrvReference: 0.05,      // 50 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m12',
    name: 'Ioduro di Potassio (Iodio)',
    supplier: 'Sigma-Aldrich',
    pricePerKg: 45.00,
    purity: 99.0,
    titration: 76.5,         // I in KI: PM I 126,90 / PM KI 166,00 = 76,5 %
    activeNutrient: 'Iodio',
    maxLimitMg: 0.225,       // 225 μg/die — Min. Salute 2021
    nrvReference: 0.15,      // 150 μg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m13',
    name: 'Acido Borico (Boro)',
    supplier: 'Eti Maden',
    pricePerKg: 6.50,
    purity: 99.5,
    titration: 17.5,         // B in H3BO3: PM B 10,81 / PM 61,83 = 17,5 %
    activeNutrient: 'Boro',
    maxLimitMg: 3.6,         // 3,6 mg/die — Min. Salute 2021
    nrvReference: 0,         // VNR non previsto
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_m14',
    name: 'Potassio Cloruro',
    supplier: 'K+S AG',
    pricePerKg: 2.50,
    purity: 99.0,
    titration: 52.4,         // K in KCl: PM K 39,10 / PM 74,55 = 52,4 %
    activeNutrient: 'Potassio',
    maxLimitMg: 0,           // non definito — Min. Salute 2021
    nrvReference: 2000,      // 2000 mg — Reg. UE 1169/2011
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },

  // ── ECCIPENTI & INGREDIENTI FUNZIONALI ─────────────────────────────────────

  {
    id: 'rm_seed_002',
    name: 'Cellulosa Microcristallina (MCC)',
    supplier: 'FMC BioPolymer',
    pricePerKg: 3.20,
    purity: 99.0,
    titration: 100.0,
    activeNutrient: 'Eccipiente',
    maxLimitMg: 0,
    nrvReference: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_005',
    name: 'Magnesio Stearato',
    supplier: 'Peter Greven',
    pricePerKg: 5.80,
    purity: 99.0,
    titration: 100.0,
    activeNutrient: 'Eccipiente',
    maxLimitMg: 0,
    nrvReference: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_007',
    name: 'Lattosio Monoidrato',
    supplier: 'DFE Pharma',
    pricePerKg: 1.95,
    purity: 99.5,
    titration: 100.0,
    activeNutrient: 'Eccipiente',
    maxLimitMg: 0,
    nrvReference: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_e01',
    name: 'Collagene Idrolizzato (Tipo I/III)',
    supplier: 'Rousselot SAS',
    pricePerKg: 24.00,
    purity: 99.0,
    titration: 90.0,         // ~90 % proteina collagene su secco
    activeNutrient: 'Collagene',
    maxLimitMg: 0,
    nrvReference: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'rm_seed_008',
    name: 'Estratto di Rosmarino (5% Acido Rosmarinico)',
    supplier: 'Naturex',
    pricePerKg: 95.00,
    purity: 97.0,
    titration: 5.0,
    activeNutrient: 'Acido Rosmarinico',
    maxLimitMg: 50,
    nrvReference: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]
