// The product's signature visual: one plank per required skill.
// Solid = self-reported, half = partial, dashed outline = unproven (a gap still to span).
const PLANK = {
  reported: 'bg-accent',
  to_improve: 'bg-[linear-gradient(90deg,#0B7A52_50%,#BFE0D1_50%)]',
  not_demonstrated: 'border border-dashed border-[#7D8DA3] bg-transparent',
}
const NAMES = { reported: 'self-reported', to_improve: 'partial', not_demonstrated: 'unproven' }

export default function PlankMeter({ skills, showLegend = true }) {
  const count = (s) => skills.filter((k) => k.status === s).length
  const summary = `${skills.length} required skills: ${count('reported')} self-reported, ${count('to_improve')} partial, ${count('not_demonstrated')} unproven`
  return (
    <div>
      <div role="img" aria-label={summary} className="flex gap-1.5">
        {skills.map((s, i) => (
          <span
            key={`${s.name}-${i}`}
            title={`${s.name}: ${NAMES[s.status]}`}
            className={`h-4 min-w-0 flex-1 rounded-sm ${PLANK[s.status]}`}
          />
        ))}
      </div>
      {showLegend && (
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <li className="flex items-center gap-2"><span className={`h-3 w-5 rounded-sm ${PLANK.reported}`} />Self-reported</li>
          <li className="flex items-center gap-2"><span className={`h-3 w-5 rounded-sm ${PLANK.to_improve}`} />Partial</li>
          <li className="flex items-center gap-2"><span className={`h-3 w-5 rounded-sm ${PLANK.not_demonstrated}`} />Unproven</li>
        </ul>
      )}
    </div>
  )
}
