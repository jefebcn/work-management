import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const CATEGORY_COLORS = {
  vitamina:  '#2563EB',  // blue-600
  minerale:  '#10B981',  // emerald-500
  botanical: '#8B5CF6',  // violet-500
  eccipiente:'#94A3B8',  // slate-400
  altro:     '#06B6D4',  // cyan-500
}

const CATEGORY_LABELS = {
  vitamina:  'Vitamina',
  minerale:  'Minerale',
  botanical: 'Botanical',
  eccipiente:'Eccipiente',
  altro:     'Attivo',
}

function getCategory(rm) {
  if (!rm) return 'altro'
  if (rm.category) return rm.category
  if (!rm.activeNutrient) return 'eccipiente'
  return 'altro'
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-lg px-3 py-2 shadow-card text-xs font-mono">
      <div className="font-semibold text-galenic-primary truncate max-w-40">{d.name}</div>
      <div className="text-galenic-muted mt-0.5">
        {d.value.toFixed(1)}% <span style={{ color: d.color }}>■</span>
      </div>
    </div>
  )
}

export default function CompositionChart({ rows, rawMaterials }) {
  const data = rows
    .filter(r => r.percentOfTotal > 0.01)
    .map(row => {
      const rm = rawMaterials.find(r => r.id === row.rawMaterialId)
      const cat = getCategory(rm)
      return {
        name: rm?.name || '—',
        value: parseFloat(row.percentOfTotal.toFixed(2)),
        cat,
        color: CATEGORY_COLORS[cat] || CATEGORY_COLORS.altro,
      }
    })

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)

  // Group by category for the compact legend summary
  const byCategory = {}
  data.forEach(d => {
    if (!byCategory[d.cat]) byCategory[d.cat] = 0
    byCategory[d.cat] += d.value
  })

  return (
    <div className="bg-galenic-surface border border-galenic-border rounded-xl px-5 py-4">
      <h3 className="text-xs font-mono font-semibold text-galenic-primary uppercase tracking-widest mb-4">
        Composizione Formula
      </h3>

      <div className="flex flex-col sm:flex-row items-start gap-6">

        {/* Donut chart */}
        <div className="relative w-40 h-40 shrink-0 mx-auto sm:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={44}
                outerRadius={68}
                paddingAngle={1}
                dataKey="value"
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.9} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className={`text-xl font-mono font-bold tabular-nums ${total > 100.1 ? 'text-galenic-danger' : 'text-galenic-primary'}`}>
              {total.toFixed(0)}%
            </div>
            <div className="text-xs text-galenic-muted">totale</div>
          </div>
        </div>

        {/* Ingredient breakdown */}
        <div className="flex-1 min-w-0 w-full">
          {/* Category summary pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {Object.entries(byCategory).map(([cat, pct]) => (
              <span
                key={cat}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border font-medium"
                style={{
                  color: CATEGORY_COLORS[cat],
                  borderColor: CATEGORY_COLORS[cat] + '40',
                  backgroundColor: CATEGORY_COLORS[cat] + '12',
                }}
              >
                {CATEGORY_LABELS[cat] || cat}
                <span className="font-mono opacity-70">{pct.toFixed(1)}%</span>
              </span>
            ))}
          </div>

          {/* Per-ingredient rows */}
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {data.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs group">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-galenic-primary truncate flex-1 group-hover:text-galenic-accent transition-colors">
                  {item.name}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className="h-1 rounded-full"
                    style={{ width: `${Math.max(4, item.value)}px`, backgroundColor: item.color, opacity: 0.6 }}
                  />
                  <span className="font-mono text-galenic-muted tabular-nums w-12 text-right">
                    {item.value.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
