/**
 * Tabella di riferimento normativa — Ministero della Salute IT, rev. settembre 2021
 * Reg. UE 1169/2011 Allegato XIII (VNR).
 *
 * Tutti i valori in mg. Per i nutrienti espressi in μg nel regolamento:
 * maxLimitMg = μg ÷ 1000  /  nrvReference = μg ÷ 1000
 */

export const VITAMINE_REF = [
  { key: 'vit_a',   label: 'Vitamina A (Retinolo Equivalenti)',   activeNutrient: 'Vitamina A',              maxLimitMg: 1.2,    nrvReference: 0.8    },
  { key: 'vit_abc', label: 'Vitamina A – Beta-Carotene (unica fonte)', activeNutrient: 'Beta-Carotene',     maxLimitMg: 7.5,    nrvReference: 0      },
  { key: 'vit_d',   label: 'Vitamina D',                           activeNutrient: 'Vitamina D',             maxLimitMg: 0.05,   nrvReference: 0.005  },
  { key: 'vit_e',   label: 'Vitamina E',                           activeNutrient: 'Vitamina E',             maxLimitMg: 60,     nrvReference: 12     },
  { key: 'vit_k',   label: 'Vitamina K',                           activeNutrient: 'Vitamina K',             maxLimitMg: 0.2,    nrvReference: 0.075  },
  { key: 'vit_c',   label: 'Vitamina C',                           activeNutrient: 'Vitamina C',             maxLimitMg: 1000,   nrvReference: 80     },
  { key: 'vit_b1',  label: 'Tiamina (Vitamina B1)',                activeNutrient: 'Tiamina (Vitamina B1)',  maxLimitMg: 25,     nrvReference: 1.1    },
  { key: 'vit_b2',  label: 'Riboflavina (Vitamina B2)',            activeNutrient: 'Riboflavina (Vitamina B2)', maxLimitMg: 25,  nrvReference: 1.4    },
  { key: 'vit_b3',  label: 'Niacina (Vitamina B3)',                activeNutrient: 'Niacina',                maxLimitMg: 54,     nrvReference: 16     },
  { key: 'vit_b6',  label: 'Vitamina B6',                          activeNutrient: 'Vitamina B6',            maxLimitMg: 10,     nrvReference: 1.4    },
  { key: 'vit_b9',  label: 'Acido Folico (Vitamina B9)',           activeNutrient: 'Acido Folico',           maxLimitMg: 0.4,    nrvReference: 0.2    },
  { key: 'vit_b12', label: 'Vitamina B12',                         activeNutrient: 'Vitamina B12',           maxLimitMg: 1.0,    nrvReference: 0.0024 },
  { key: 'vit_h',   label: 'Biotina (Vitamina H/B7)',              activeNutrient: 'Biotina',                maxLimitMg: 0.45,   nrvReference: 0.05   },
  { key: 'vit_b5',  label: 'Acido Pantotenico (Vitamina B5)',      activeNutrient: 'Acido Pantotenico',      maxLimitMg: 18,     nrvReference: 6      },
]

export const MINERALI_REF = [
  { key: 'ca',  label: 'Calcio',                activeNutrient: 'Calcio',     maxLimitMg: 1200,  nrvReference: 800   },
  { key: 'p',   label: 'Fosforo',               activeNutrient: 'Fosforo',    maxLimitMg: 1200,  nrvReference: 700   },
  { key: 'mg',  label: 'Magnesio',              activeNutrient: 'Magnesio',   maxLimitMg: 450,   nrvReference: 375   },
  { key: 'fe',  label: 'Ferro',                 activeNutrient: 'Ferro',      maxLimitMg: 30,    nrvReference: 14    },
  { key: 'zn',  label: 'Zinco (adulti)',         activeNutrient: 'Zinco',      maxLimitMg: 15,    nrvReference: 10    },
  { key: 'cu',  label: 'Rame',                  activeNutrient: 'Rame',       maxLimitMg: 2,     nrvReference: 1     },
  { key: 'mn',  label: 'Manganese',             activeNutrient: 'Manganese',  maxLimitMg: 10,    nrvReference: 2     },
  { key: 'f',   label: 'Fluoro',                activeNutrient: 'Fluoro',     maxLimitMg: 4,     nrvReference: 3.5   },
  { key: 'se',  label: 'Selenio',               activeNutrient: 'Selenio',    maxLimitMg: 0.1,   nrvReference: 0.055 },
  { key: 'cr',  label: 'Cromo',                 activeNutrient: 'Cromo',      maxLimitMg: 0.25,  nrvReference: 0.04  },
  { key: 'mo',  label: 'Molibdeno',             activeNutrient: 'Molibdeno',  maxLimitMg: 0.1,   nrvReference: 0.05  },
  { key: 'i',   label: 'Iodio',                 activeNutrient: 'Iodio',      maxLimitMg: 0.225, nrvReference: 0.15  },
  { key: 'b',   label: 'Boro',                  activeNutrient: 'Boro',       maxLimitMg: 3.6,   nrvReference: 0     },
  { key: 'k',   label: 'Potassio',              activeNutrient: 'Potassio',   maxLimitMg: 0,     nrvReference: 2000  },
  { key: 'cl',  label: 'Cloro',                 activeNutrient: 'Cloro',      maxLimitMg: 0,     nrvReference: 0     },
  { key: 'na',  label: 'Sodio',                 activeNutrient: 'Sodio',      maxLimitMg: 0,     nrvReference: 0     },
  { key: 'si',  label: 'Silicio',               activeNutrient: 'Silicio',    maxLimitMg: 0,     nrvReference: 0     },
]

/** Format maxLimitMg for dropdown label: show μg when < 1 mg */
export function fmtLimit(maxLimitMg) {
  if (maxLimitMg === 0) return 'limite: n.d.'
  if (maxLimitMg < 1)   return `max: ${+(maxLimitMg * 1000).toPrecision(4)} μg/die`
  return `max: ${maxLimitMg} mg/die`
}
