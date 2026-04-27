import React from 'react'

const VB = 200
const C  = VB / 2
const R  = 74   // max outer radius in viewBox units

function layerColor(layerResult, fallback) {
  const c = (layerResult.ingredients || []).find(i => i.role === 'colorante' && i.colorHex)
  return c?.colorHex ?? fallback
}

// Helper: return inline SVG element for the chosen shape at radius r
function S({ shape, r, fill }) {
  if (shape === 'Cilindro') {
    return (
      <rect
        x={C - r * 0.775} y={C - r * 1.025}
        width={r * 1.55}  height={r * 2.05}
        rx={r * 0.22}
        fill={fill}
      />
    )
  }
  if (shape === 'Oblunga') {
    return <ellipse cx={C} cy={C} rx={r} ry={r * 1.38} fill={fill} />
  }
  return <circle cx={C} cy={C} r={r} fill={fill} />
}

// Clip path content for the outer boundary
function ClipContent({ shape, r }) {
  if (shape === 'Cilindro') {
    return (
      <rect
        x={C - r * 0.775} y={C - r * 1.025}
        width={r * 1.55}  height={r * 2.05}
        rx={r * 0.22}
      />
    )
  }
  if (shape === 'Oblunga') {
    return <ellipse cx={C} cy={C} rx={r} ry={r * 1.38} />
  }
  return <circle cx={C} cy={C} r={r} />
}

export default function CoatingVisualizer({ sc, results }) {
  if (!sc?.enabled || !results?.layerResults?.length) return null
  if (results.finalWeightMg <= 0) return null

  const { coreWeightMg, finalWeightMg, layerResults } = results
  const shape = sc.shape ?? 'Sfera'

  // Radius ∝ ∛(weight) to keep volume proportional to mass
  const toR = w => R * Math.cbrt(w / finalWeightMg)
  const coreR = toR(coreWeightMg)

  const bands = layerResults.map((l, i) => ({
    r:     toR(l.accumulatedWeightMg),
    color: layerColor(l, i === layerResults.length - 1 ? '#4dc4d8' : '#8dd9e8'),
  }))
  const outerR = bands[bands.length - 1].r

  return (
    <div className="flex flex-col items-center gap-1.5 py-1 shrink-0">
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        width={148}
        height={148}
        className="drop-shadow-lg"
        aria-label={`Anteprima ${shape}`}
      >
        <defs>
          <radialGradient id="cv-gloss" cx="34%" cy="27%" r="65%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.55" />
            <stop offset="45%"  stopColor="white" stopOpacity="0.07" />
            <stop offset="100%" stopColor="black" stopOpacity="0.20" />
          </radialGradient>
          <clipPath id="cv-clip">
            <ClipContent shape={shape} r={outerR} />
          </clipPath>
        </defs>

        {/* Paint from outermost shell inward */}
        <S shape={shape} r={bands[bands.length - 1].r} fill={bands[bands.length - 1].color} />

        {/* Intermediate shells (outer → inner so each inner sits on top) */}
        {[...bands.slice(0, -1)].reverse().map((b, i) => (
          <S key={i} shape={shape} r={b.r} fill={b.color} />
        ))}

        {/* Core */}
        <S shape={shape} r={coreR} fill="#00a4bd" />

        {/* Gloss highlight overlay */}
        <rect
          x="0" y="0" width={VB} height={VB}
          fill="url(#cv-gloss)"
          clipPath="url(#cv-clip)"
        />
      </svg>
      <span className="text-[10px] font-mono text-galenic-muted">
        {shape} · {Number(finalWeightMg).toFixed(0)} mg
      </span>
    </div>
  )
}
