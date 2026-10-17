# SkillBridge AI

Don't just learn skills. Prove you're ready to work.
Flow: Target Job -> Skill Gap Analysis -> Personalized Project -> Rubric -> Evidence-based assessment.

**Status: backend and frontend written (accounts, any-profession prompts, responsive nav). Not yet run end to end; see "First run checklist".**

## Run the backend (terminal 1)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                   # then set GEMINI_API_KEY
python manage.py makemigrations careers
python manage.py migrate        # also creates the auth/token tables
python manage.py runserver                             # http://localhost:8000
```
Get a free key in Google AI Studio (aistudio.google.com -> API keys) and put it in `backend/.env` as `GEMINI_API_KEY`.

## Environment variables (backend/.env)
| Name | Purpose |
|---|---|
| AI_PROVIDER | `gemini` (Gemma) or `groq`. Leave empty to auto-detect: Gemini if `GEMINI_API_KEY` is set, otherwise Groq if `GROQ_API_KEY` is set |
| GEMINI_API_KEY | Google AI Studio key (server-side only) |
| GEMMA_MODEL | default `gemma-4-26b-a4b-it`; `gemma-4-31b-it` also listed for the Gemini API |
| GROQ_API_KEY | Groq key from console.groq.com (server-side only) |
| GROQ_MODEL | default `openai/gpt-oss-120b`; check console.groq.com for the models your account can use |
| AI_TIMEOUT_SECONDS | per-call timeout, default 60 |
| FRONTEND_ORIGIN | CORS origin, default http://localhost:5173 |
| DJANGO_SECRET_KEY / DJANGO_DEBUG / DJANGO_ALLOWED_HOSTS | standard Django settings |
| API_THROTTLE_RATE | default 200/hour per anonymous client |
| AUTH_THROTTLE_RATE | default 30/hour per client for sign-in and sign-up attempts |

## Can't get Gemma access? Use Groq
In `backend/.env`:
```
AI_PROVIDER=groq
GROQ_API_KEY=your-groq-key
```
Restart Django and open `/api/health/`: it should show `"provider": "groq"` and `"ai_configured": true`. No extra package is needed.
Everything else (prompts, validation, scoring, rubric rules) is identical. Llama models are not Gemma, so say "AI model" rather than
"Gemma" in your pitch if you demo on Groq. Switch back by setting `AI_PROVIDER=gemini`.

## Test without an API key or network
```bash
cd backend && python -m unittest careers.tests -v
```

## API (all responses: `{"ok": true, "data": ...}` or `{"ok": false, "error": {code, message, details}}`)
| Method | Path | Body |
|---|---|---|
| GET | /api/health/ | model name + whether a key is configured |
| GET | /api/demo/ | labelled demo scenarios (marketing, accounting, data engineering), each with a sample JD and sample submission |
| POST | /api/auth/register/ | name, email, password -> `{token, user}` |
| POST | /api/auth/login/ | email, password -> `{token, user}` |
| POST | /api/auth/logout/ | (token required) |
| GET | /api/auth/me/ | (token required) name, email, details of your last plan |
| GET | /api/my/plans/ | (token required) your saved plans with progress |
| POST | /api/profiles/ | name, target_role, experience_level, existing_skills, weekly_learning_hours, job_description?, is_demo?, demo_key? |
| POST | /api/analyze/ | profile_id |
| GET | /api/analyses/<id>/ | |
| POST | /api/projects/generate/ | profile_id, analysis_id?, previous_project_id? (regenerate) |
| GET | /api/projects/<id>/ | |
| POST | /api/submissions/ | project_id, submission_text, repository_url? |
| GET | /api/submissions/<id>/results/ | |

## Accounts (optional)
Sign-up and sign-in use DRF token auth: send `Authorization: Token <key>`. Accounts store only a name, email and password hash.
- Signed-in users get **My plans**, and the setup form is prefilled from their last plan.
- Plans created while signed in are private to that account (other users get a 404). Plans created as a guest are not tied to anyone
  and stay reachable by their numeric id, which is fine for a demo but not for sensitive data.
- Passwords use Django's validators (8+ characters, not common, not all digits).

## Works for any profession
Prompts do not assume a tech career. Projects can be an analysis, plan, campaign, report, lesson plan, budget or code, using free or
low-cost tools, and rubrics score the evidence the student actually submits. Three demo scenarios ship with the app.

Quick check once the key is set:
```bash
curl localhost:8000/api/health/
curl localhost:8000/api/demo/
```

## Design rules
- The model extracts, matches synonyms, writes projects/rubrics and grades evidence. **Scores are computed in Python** (`careers/scoring.py`).
- Rubric totals must be exactly 100: validated, one correction retry, then deterministic rebalance (flagged `rebalanced`).
- "Explicit" job requirements need a verbatim quote from the job description, otherwise they are demoted to "inferred".
- Repository URLs are stored but **never opened**; results say `repository_inspected: false`. Submitted code is never executed.
- "Not demonstrated" means unproven; "deficient" means submitted evidence shows a problem.

## Run the frontend (terminal 2)
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```
In development Vite proxies `/api` to `http://localhost:8000`, so no CORS setup is needed. For a deployed frontend set
`VITE_API_URL` and add the frontend origin to `FRONTEND_ORIGIN` in `backend/.env`.

Routes: `/` landing, `/login`, `/register`, `/plans` (My plans, sign-in required), `/setup` career setup (`?demo=1` or `?demo=junior-accountant` loads a demo),
`/plan/:id` skill gap dashboard, `/project/:id` project workspace, `/results/:id` assessment results. Every page loads from the API by id, so
refreshing keeps your place. On small screens the header collapses into a hamburger menu, and plan pages show a Skill gaps / Project / Results progress bar.

## First run checklist
1. `curl localhost:8000/api/health/` shows `"ai_configured": true`.
2. Open `/setup?demo=1` (marketing demo), continue to the last step, click **Analyze my skill gaps**.
3. On the dashboard click **Generate my project**.
4. In the workspace click **Fill in the demo sample submission**, then **Assess my submission**.

## Two-minute demo script
Landing -> Try a demo scenario -> dashboard (point at the plank meter and the "inferred" labels) -> generate project ->
show the 100-point rubric -> sample submission -> results (point at Unproven vs Needs work, and the disclaimer).
