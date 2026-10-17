import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

// Shows where you are in the flow and lets you jump back to earlier steps.
export default function JourneyNav({ current, analysisId, projectId, submissionId }) {
  const steps = [
    { key: 'plan', label: 'Skill gaps', to: analysisId ? `/plan/${analysisId}` : null },
    { key: 'project', label: 'Project', to: projectId ? `/project/${projectId}` : null },
    { key: 'results', label: 'Results', to: submissionId ? `/results/${submissionId}` : null },
  ]
  return (
    <nav aria-label="Your progress" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
        {steps.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-4 w-4 text-[#7D8DA3]" aria-hidden="true" />}
            {s.key === current ? (
              <span aria-current="step" className="rounded-md bg-accentSoft px-2.5 py-1 font-semibold text-[#085C3E]">{s.label}</span>
            ) : s.to ? (
              <Link to={s.to} className="rounded-md px-2.5 py-1 font-semibold text-muted hover:bg-white hover:text-ink">{s.label}</Link>
            ) : (
              <span className="rounded-md px-2.5 py-1 text-[#7D8DA3]">{s.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
