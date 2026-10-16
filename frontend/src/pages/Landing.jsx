import { ClipboardCheck, Hammer, Search } from 'lucide-react'
import { LinkButton, Badge, PRIORITY } from '../components/ui.jsx'
import PlankMeter from '../components/PlankMeter.jsx'

// Static sample so the landing page works without the backend. Clearly labelled as demonstration data.
const PREVIEW_SKILLS = [
  { name: 'Python', status: 'to_improve' },
  { name: 'SQL', status: 'to_improve' },
  { name: 'Data cleaning', status: 'not_demonstrated' },
  { name: 'ETL fundamentals', status: 'not_demonstrated' },
  { name: 'Version control', status: 'reported' },
  { name: 'Cloud awareness', status: 'not_demonstrated' },
  { name: 'Communication', status: 'not_demonstrated' },
]
const PREVIEW_ACTIONS = [
  { name: 'Data cleaning', priority: 'high' },
  { name: 'ETL fundamentals', priority: 'high' },
  { name: 'Python', priority: 'medium' },
]

const STEPS = [
  {
    icon: Search,
    title: 'Analyze',
    body: 'Paste a job description. SkillBridge pulls out the skills it asks for, quotes the line each one came from, and compares them with what you say you can do. Anything it only guessed is labelled as a guess.',
  },
  {
    icon: Hammer,
    title: 'Build',
    body: 'Get one practical project sized to your level and your weekly hours, using free tools. It targets your biggest gaps, and you can ask for a different one.',
  },
  {
    icon: ClipboardCheck,
    title: 'Prove',
    body: 'Submit your write-up and code snippets. They are scored against a 100-point rubric, and every score points to what you showed or what is still missing.',
  },
]

export default function Landing() {
  return (
    <div className="space-y-20 sm:space-y-28">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div>
          <h1 className="text-4xl font-bold leading-[1.05] sm:text-6xl">Stop Guessing. Start Proving.</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            SkillBridge AI turns a job you want into a plan you can act on: where your skills fall short, a real
            project to close the gap, and an assessment of the evidence you produce. Built for students and graduates
            applying for internships and entry-level roles.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton to="/setup" className="px-6 py-3 text-base">Build My Career Plan</LinkButton>
            <LinkButton to="/setup?demo=1" variant="secondary" className="px-6 py-3 text-base">Try the demo scenario</LinkButton>
          </div>
        </div>

        <figure aria-label="Preview of the skill gap dashboard" className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
          <figcaption className="mb-4 flex items-center justify-between gap-3 text-sm text-muted">
            <span className="font-semibold text-ink">Junior Data Engineer</span>
            <span>Sample preview, demonstration data</span>
          </figcaption>
          <p className="text-sm text-muted">Estimated profile-to-job alignment</p>
          <p className="font-display text-5xl font-bold">33%</p>
          <div className="mt-4">
            <PlankMeter skills={PREVIEW_SKILLS} />
          </div>
          <ul className="mt-5 divide-y divide-line border-t border-line">
            {PREVIEW_ACTIONS.map((a) => (
              <li key={a.name} className="flex items-center justify-between py-2.5 text-sm">
                <span className="font-semibold">{a.name}</span>
                <Badge map={PRIORITY} value={a.priority} />
              </li>
            ))}
          </ul>
        </figure>
      </section>

      <section aria-labelledby="how">
        <h2 id="how" className="text-3xl font-bold">From a job post to evidence you can show</h2>
        <ol className="mt-8 border-l-2 border-line">
          {STEPS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="relative pb-10 pl-8 last:pb-0 sm:pl-10">
              <span className="absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-1.5 max-w-2xl leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl bg-ink px-6 py-10 text-white sm:px-12 sm:py-14">
        <p className="max-w-3xl font-display text-2xl font-semibold leading-snug sm:text-3xl">
          A degree tells an employer what someone studied. A CV tells an employer what someone claims to know.
          SkillBridge helps students demonstrate what they can actually do.
        </p>
        <p className="mt-6 max-w-2xl text-[#C5D0DE]">
          It does not guarantee a job or certify competence. It gives you a clear target, practice that matches it, and
          honest feedback on the evidence you submit.
        </p>
        <LinkButton to="/setup" variant="light" className="mt-8">Build My Career Plan</LinkButton>
      </section>
    </div>
  )
}
