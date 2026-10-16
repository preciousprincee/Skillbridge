"""Deterministic scoring. No AI calls here: the model never decides the score."""
import re

IMPORTANCE_WEIGHT = {"critical": 3, "important": 2, "nice_to_have": 1}
PARTIAL_CREDIT = 0.5

QUALIFIERS = {
    "basic", "beginner", "learning", "novice", "intro", "introductory", "elementary",
    "fundamental", "fundamentals", "some", "little", "familiar", "familiarity",
    "awareness", "entry", "limited",
}
STOPWORDS = {
    "and", "or", "of", "the", "a", "an", "in", "with", "to", "for", "skills", "skill",
    "knowledge", "using", "experience", "ability", "understanding", "working", "good",
    "strong", "proficiency", "proficient",
}
GENERIC = {"data", "system", "systems", "tool", "tools", "programming", "development",
           "management", "software", "language", "languages", "technology", "technologie"}
ALIASES = {
    "postgres": "postgresql", "psql": "postgresql", "python3": "python", "py": "python",
    "js": "javascript", "git": "version control", "github": "version control",
    "gitlab": "version control", "ms": "", "microsoft": "",
}

SCORE_LABEL = "Estimated profile-to-job alignment (not a probability of getting hired)"
METHOD_TEXT = (
    "Each required skill is weighted by importance (critical x3, important x2, "
    "nice-to-have x1). A skill you list without a qualifier earns full credit, one you "
    "describe as basic or beginner earns half credit, and a skill not found in your "
    "profile earns none. The score reflects what your profile says, not measured ability."
)


def _singular(tok):
    if len(tok) > 3 and tok.endswith("s") and not tok.endswith("ss"):
        return tok[:-1]
    return tok


def _tokens(text):
    t = re.sub(r"[^a-z0-9+#.\s/]", " ", (text or "").lower()).replace("/", " ")
    out = []
    for tok in t.split():
        tok = tok.strip(".")
        if tok:
            out.extend(ALIASES.get(tok, tok).split())
    return out


def core_tokens(text):
    return frozenset(
        _singular(t) for t in _tokens(text) if t not in STOPWORDS and t not in QUALIFIERS
    )


def is_partial(student_skill):
    return any(t in QUALIFIERS for t in _tokens(student_skill))


def _matches(rc, sc):
    if not rc or not sc:
        return False
    if rc == sc:
        return True
    small, big = (rc, sc) if len(rc) <= len(sc) else (sc, rc)
    if not small <= big:
        return False
    return bool(small - GENERIC)


def match_skill(required_name, student_skills):
    """Return (student_skill, partial) for the best match, or None."""
    rc = core_tokens(required_name)
    best = None
    for s in student_skills:
        if _matches(rc, core_tokens(s)):
            cand = (s, is_partial(s))
            if not cand[1]:
                return cand
            best = best or cand
    return best


def find_unmatched(skills, student_skills):
    return [s["name"] for s in skills if match_skill(s["name"], student_skills) is None]


def _priority(importance, status):
    credit = 0.0 if status == "not_demonstrated" else PARTIAL_CREDIT
    gap = IMPORTANCE_WEIGHT.get(importance, 2) * (1 - credit)
    return "high" if gap >= 2 else "medium" if gap >= 1 else "low"


def _explain(skill, status, matched_with):
    imp = skill["importance"].replace("_", " ")
    if status == "reported":
        return (f"Required ({imp}). You listed '{matched_with}'. This is self-reported; "
                "a project would turn the claim into evidence.")
    if status == "to_improve":
        return (f"Required ({imp}). You listed '{matched_with}', which suggests partial "
                "familiarity. Building something with it would show whether you are job-ready.")
    return (f"Required ({imp}). This skill is not in your profile, so it is unproven. "
            "That does not mean you lack it; a project can demonstrate it.")


def _weighted_score(items):
    total = sum(IMPORTANCE_WEIGHT.get(i["importance"], 2) for i in items)
    if not total:
        return 0
    got = sum(
        IMPORTANCE_WEIGHT.get(i["importance"], 2)
        * (1.0 if i["status"] == "reported" else PARTIAL_CREDIT if i["status"] == "to_improve" else 0.0)
        for i in items
    )
    return int(round(100 * got / total))


def compute_gap(skills, student_skills, ai_matches=None):
    ai_matches = ai_matches or {}
    lowered = {s.lower(): s for s in student_skills}
    items = []
    for sk in skills:
        m = match_skill(sk["name"], student_skills)
        if m is None:
            ai = ai_matches.get(sk["name"])
            if isinstance(ai, str) and ai.lower() in lowered:
                real = lowered[ai.lower()]
                m = (real, is_partial(real))
        if m is None:
            status, matched_with = "not_demonstrated", None
        else:
            matched_with = m[0]
            status = "to_improve" if m[1] else "reported"
        items.append({
            **sk,
            "status": status,
            "matched_with": matched_with,
            "priority": None if status == "reported" else _priority(sk["importance"], status),
            "explanation": _explain(sk, status, matched_with),
        })

    groups, display = {}, {}
    for it in items:
        raw = (it.get("category") or ("Technical" if it.get("type") == "technical" else "Professional")).strip()
        key = raw.lower()
        display.setdefault(key, raw.title() if raw.islower() else raw)
        groups.setdefault(key, []).append(it)
    categories = [{
        "category": display[cat],
        "score": _weighted_score(g),
        "total": len(g),
        "reported": sum(i["status"] == "reported" for i in g),
        "to_improve": sum(i["status"] == "to_improve" for i in g),
        "not_demonstrated": sum(i["status"] == "not_demonstrated" for i in g),
    } for cat, g in groups.items()]

    rank = {"high": 0, "medium": 1, "low": 2}
    todo = sorted((i for i in items if i["priority"]),
                  key=lambda i: (rank[i["priority"]], -IMPORTANCE_WEIGHT.get(i["importance"], 2)))
    return {
        "alignment_score": _weighted_score(items),
        "score_label": SCORE_LABEL,
        "method": METHOD_TEXT,
        "counts": {
            "total": len(items),
            "reported": sum(i["status"] == "reported" for i in items),
            "to_improve": sum(i["status"] == "to_improve" for i in items),
            "not_demonstrated": sum(i["status"] == "not_demonstrated" for i in items),
        },
        "skills": items,
        "categories": categories,
        "priorities": [{"name": i["name"], "priority": i["priority"], "status": i["status"],
                        "explanation": i["explanation"]} for i in todo[:5]],
    }


# ---------- rubric + assessment ----------

def rebalance_points(points, target=100):
    """Scale positive integer points to sum exactly `target` (largest remainder)."""
    total = sum(points)
    raw = [p * target / total for p in points]
    out = [max(1, int(r)) for r in raw]
    while sum(out) < target:
        i = max(range(len(out)), key=lambda k: raw[k] - out[k])
        out[i] += 1
    while sum(out) > target:
        i = max((k for k in range(len(out)) if out[k] > 1), key=lambda k: out[k] - raw[k])
        out[i] -= 1
    return out


def _norm_name(s):
    return " ".join(re.sub(r"[^a-z0-9 ]", " ", str(s).lower()).split())


SCORE_BANDS = [(85, "Strong evidence"), (70, "Good evidence"), (50, "Developing evidence"),
               (0, "Limited evidence")]
VALID_STATUS = {"demonstrated", "partial", "not_demonstrated", "deficient"}


def finalize_assessment(rubric_criteria, ai):
    """Clamp AI per-criterion scores to the rubric and compute the total ourselves."""
    ai_items = ai.get("criteria_scores", [])
    by_name = {_norm_name(c.get("name", "")): c for c in ai_items}
    rows, total = [], 0
    for idx, crit in enumerate(rubric_criteria):
        item = by_name.get(_norm_name(crit["name"]))
        if item is None and len(ai_items) == len(rubric_criteria):
            item = ai_items[idx]
        item = item or {}
        status = item.get("status") if item.get("status") in VALID_STATUS else "partial"
        try:
            score = int(round(float(item.get("score", 0))))
        except (TypeError, ValueError):
            score = 0
        score = max(0, min(score, crit["max_points"]))
        if status == "not_demonstrated":
            score = 0
        total += score
        rows.append({
            "name": crit["name"], "max_points": crit["max_points"], "score": score,
            "status": status, "evidence": item.get("evidence", ""),
            "missing_evidence": item.get("missing_evidence", ""),
        })
    band = next(label for floor, label in SCORE_BANDS if total >= floor)
    return {
        "total_score": total,
        "band": band,
        "criteria": rows,
        "unproven": [r["name"] for r in rows if r["status"] == "not_demonstrated"],
        "demonstrated_deficiencies": [r["name"] for r in rows if r["status"] == "deficient"],
        "weaknesses": ai.get("weaknesses", []),
        "recommended_improvements": ai.get("recommended_improvements", []),
        "next_steps": ai.get("next_steps", []),
        "overall_feedback": ai.get("overall_feedback", ""),
    }
