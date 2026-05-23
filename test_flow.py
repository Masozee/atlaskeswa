#!/usr/bin/env python3
"""
Flow simulation for route: Q1→Q2→...→Q16→QL1(R)→RQ1→...→RQ13→RQA→...→RQH(MANDIRI)→RQI→RQJ
Verifies:
  1. Q1→Q4→QL1 in DATA_DASAR traversal
  2. QL1(R) → jump to FASKSES (RQ section)
  3. RQ1→RQ13 (AKUT branch) in FASKSES section
  4. RQ5=DOKTER_24=no → RQ8 (sequential, no RQ6/RQ7)
  5. RQ13 → RQH (via choice next_code) → DETAIL inline
  6. RQH(MANDIRI) → RQI → RQJ (MANDIRI special case)
  7. RQ6 visible only for RSU/RSJ (RQH answer), RQ7 hidden
  8. SRQH/SRQI absent (QL2 not answered)
"""
import sqlite3, json, os

DB = os.path.join(os.path.dirname(__file__), 'backend', 'db.sqlite3')
conn = sqlite3.connect(DB)

MANDIRI_VALUE = 'PEMBAYARAN MANDIRI OLEH KLIEN/PASIEN/KELUARGA'

_col_cache = {}

def _get_cols(t):
    if t not in _col_cache:
        _col_cache[t] = [c[1] for c in conn.execute(f"PRAGMA table_info({t})").fetchall()]
    return _col_cache[t]

def rows(sql, *args):
    cols = None
    results = []
    for row in conn.execute(sql, args).fetchall():
        if cols is None:
            for t in ['survey_questions', 'survey_question_choices', 'survey_question_sections']:
                if t in sql:
                    cols = _get_cols(t)
                    break
        if cols:
            results.append(dict(zip(cols, row)))
        else:
            results.append(dict(enumerate(row)))
    return results

# ── Load schema ────────────────────────────────────────────────────────────────
sections_ordered = rows("SELECT * FROM survey_question_sections WHERE template_id=1 ORDER BY `order`")
sections = {s['id']: s for s in sections_ordered}
section_by_code = {s['code']: s for s in sections_ordered}
all_questions = {}
for q in rows("SELECT * FROM survey_questions"):
    q['choices'] = rows("SELECT * FROM survey_question_choices WHERE question_id=? ORDER BY `order`", q['id'])
    all_questions[q['code']] = q

# ── Evaluators ────────────────────────────────────────────────────────────────
def evaluate_show_condition(sc, ctx):
    if not sc: return True
    op = sc.get('operator')
    qc = sc.get('question_code')
    val = sc.get('value')
    ans = ctx.get(qc)
    if op == 'contains':
        return isinstance(ans, list) and val in ans
    if op == 'in': return isinstance(val, list) and ans in val
    if op == 'not_in': return isinstance(val, list) and ans not in val
    if op == 'and':
        return all(evaluate_show_condition(c, ctx) for c in sc['conditions'])
    if op == 'or':
        return any(evaluate_show_condition(c, ctx) for c in sc['conditions'])
    return ans == val

def find_choice(q, answer):
    if not q.get('choices'): return None
    if isinstance(answer, list):
        for c in q['choices']:
            if c['value'] in answer: return c
    elif isinstance(answer, str):
        for c in q['choices']:
            if c['value'] == answer: return c
    return None

def get_visible_for_section(sec_id, ctx):
    result = []
    for q in all_questions.values():
        if q['section_id'] != sec_id: continue
        sc = q.get('show_condition')
        if not sc:
            result.append(q)
        else:
            try:
                sc2 = json.loads(sc) if isinstance(sc, str) else sc
            except:
                result.append(q); continue
            if evaluate_show_condition(sc2, ctx):
                result.append(q)
    result.sort(key=lambda q: q['order'])
    return result

def find_entry_points_for_section(sec_id, ctx):
    target_codes = {q['code'] for q in all_questions.values() if q['section_id'] == sec_id}
    eps = []
    for q in all_questions.values():
        ans = ctx.get(q['code'])
        if ans is None: continue
        vals = ans if isinstance(ans, list) else [ans]
        for c in q['choices']:
            if c['value'] in vals and c.get('next_question_code') and c['next_question_code'] in target_codes:
                dest = all_questions.get(c['next_question_code'])
                if dest and dest['section_id'] == sec_id:
                    eps.append(c['next_question_code'])
    return list(set(eps))

# ── Core flow engine (matches getFlowItems semantics) ──────────────────────────
def get_flow_for_section(sec_id, ctx, forced_start=None, raw_ctx=None, _visited=None):
    if raw_ctx is None: raw_ctx = ctx
    if _visited is None: _visited = set()

    sec = sections[sec_id]
    vis = get_visible_for_section(sec_id, ctx)
    if not vis: return []

    code_map = {q['code']: q for q in vis}

    if forced_start:
        entry_codes = [forced_start]
    elif sec.get('show_condition'):
        entry_codes = [vis[0]['code']]
    else:
        eps = find_entry_points_for_section(sec_id, ctx)
        entry_codes = eps if eps else [vis[0]['code']]

    result = []
    visited_local = set()

    for entry in entry_codes:
        current = code_map.get(entry)
        if not current: continue

        while current and current['code'] not in visited_local:
            visited_local.add(current['code'])

            code = current['code']
            answer = ctx.get(code)
            result.append((code, answer))

            next_code = None
            triggering_choice = None

            # ── Special RQH/SRQH MANDIRI case ─────────────────────────────────────
            if code == 'RQH' and isinstance(answer, list):
                next_code = 'RQI' if MANDIRI_VALUE in answer else 'RQJ'
            elif code == 'SRQH' and isinstance(answer, list):
                next_code = 'SRQI' if MANDIRI_VALUE in answer else 'SRQJ'
            else:
                c = find_choice(current, answer)
                if c:
                    triggering_choice = c
                    if c.get('next_question_code'):
                        next_code = c['next_question_code']

            # skip_logic
            if not next_code and answer is not None:
                c = find_choice(current, answer)
                if c and c.get('skip_logic'):
                    try:
                        sl = json.loads(c['skip_logic']) if isinstance(c['skip_logic'], str) else c['skip_logic']
                        if sl and sl[0].get('goto'):
                            next_code = sl[0]['goto']
                    except: pass

            if next_code == '': next_code = None

            # Sequential fallback
            if not next_code:
                idx = next((i for i, q in enumerate(vis) if q['code'] == code), -1)
                if idx >= 0 and idx < len(vis) - 1:
                    current = vis[idx + 1]
                    continue
                break

            # Same-section next
            if code_map.get(next_code):
                current = code_map[next_code]
                continue

            # Cross-section jump to _inline_only_ section only (DETAIL sentinel)
            target_q = all_questions.get(next_code)
            if target_q:
                target_sec_id = target_q['section_id']
                target_sec = sections.get(target_sec_id)
                tsec_sc = target_sec.get('show_condition') or '{}'
                try:
                    tsec_sc = json.loads(tsec_sc) if isinstance(tsec_sc, str) else tsec_sc
                except:
                    tsec_sc = {}
                is_inline = isinstance(tsec_sc, dict) and tsec_sc.get('question_code') == '_inline_only_'

                if is_inline and target_sec_id not in _visited:
                    trigger_val = triggering_choice['value'] if triggering_choice else ''
                    ctx_pfx = trigger_val + '|'
                    new_ctx = {k: v for k, v in ctx.items() if '|' not in k}
                    if ctx_pfx != '|':
                        for k, v in raw_ctx.items():
                            if k.startswith(ctx_pfx):
                                new_ctx[k[len(ctx_pfx):]] = v

                    new_visited = set(_visited)
                    new_visited.add(sec_id)

                    sub_flow = get_flow_for_section(target_sec_id, new_ctx, forced_start=next_code, raw_ctx=new_ctx, _visited=new_visited)
                    result.extend(sub_flow)

                    # Backward-walking
                    mc_found = False
                    next_branch = None

                    for item in reversed(result):
                        if not isinstance(item, tuple): continue
                        item_code, item_ans = item
                        item_q = all_questions.get(item_code)
                        if not item_q: continue
                        if item_q['section_id'] != sec_id: continue
                        if item_q.get('answer_type') != 'MULTIPLE_CHOICE': continue

                        raw_mc_ans = ctx.get(item_code)
                        mc_ans = raw_mc_ans if isinstance(raw_mc_ans, list) else ([raw_mc_ans] if raw_mc_ans else [])

                        if mc_ans:
                            sel_with_next = [
                                c for c in item_q['choices']
                                if c['value'] in mc_ans and c.get('next_question_code')
                            ]
                            has_unvisited = any(
                                code_map.get(c['next_question_code']) and
                                code_map.get(c['next_question_code'])['code'] not in visited_local
                                for c in sel_with_next
                            )
                            if has_unvisited:
                                next_c = next(
                                    c for c in sel_with_next
                                    if code_map.get(c['next_question_code']) and
                                    code_map.get(c['next_question_code'])['code'] not in visited_local
                                )
                                next_branch = code_map.get(next_c['next_question_code'])
                                mc_found = True
                                break
                            else:
                                mc_found = True

                    if next_branch and next_branch['code'] not in visited_local:
                        current = next_branch
                        continue
                    if mc_found:
                        break

                    break
                else:
                    break
            break

    return result

# ── Answer set: RQ single-route with MANDIRI in RQH ──────────────────────────
answers = {
    'Q1': 'Ya, saya siap',
    'Q2': 'RSUP (Rumah Sakit Universitas Pendidikan)',
    'Q3': 'Fasilitas kesehatan tingkat pertama (FKTP)',
    'Q4': 'RSU',                          # QL1='R' (QL1 contains R)
    'Q5': 'Ya',
    'Q6': 'Tidak ada',
    'Q7': 'Tidak',
    'Q8': 'Ya',
    'Q9': 'Ya',
    'Q10': 'Tidak',
    'Q11': 'Ya',
    'Q12': 'Ya',
    'Q13': 'Tidak',
    'Q14': 'Ya',
    'Q15': 'Tidak',
    'Q16': 'DESA',
    'QL1': ['R'],                         # ← R type selected → routes to RQ section
    'RQ1': 'Ya',                         # AKUT branch
    'RQ2': 'Ya',
    'RQ3': 'Ya',
    'RQA': 'Ya',
    'RQB': 'Ya',
    'RQC': 'Ya',
    'RQD': 'Ya',
    'RQE': 'Ya',
    'RQF1': 'Ya',
    'RQF': 'Ya',
    'RQG': 'Ya',
    'RQH': [MANDIRI_VALUE],             # ← MANDIRI selected → RQI appears
    'RQK': 'Ya',
    'RQL': 'Ya',
    'RQ4': 'Ya',
    'RQ5': 'Tidak',                      # DOKTER_24=no → RQ8 (no RQ6/RQ7)
    'RQ8': 'Ya',
    'RQ9': 'Tidak',
    'RQ10': 'Ya',
    'RQ11': 'Ya',
    'RQ12': 'Ya',
    'RQ13': 'Tidak',
}

# ── Run traversal ─────────────────────────────────────────────────────────────
ctx = {k: v for k, v in answers.items() if '|' not in k}
route = []

# DATA_DASAR: Q1→Q16 (user clicks Next through each section)
dd_id = section_by_code['DATA_DASAR']['id']
route.extend(get_flow_for_section(dd_id, ctx))

# JENIS_LAYANAN: QL1 (user answers QL1 then clicks Next to FASKSES)
jl_id = section_by_code['JENIS_LAYANAN']['id']
route.extend(get_flow_for_section(jl_id, ctx))

# FASKSES: RQ section (QL1='R' → RQ1 entry point, user clicks Next through)
if ctx.get('QL1') == ['R']:
    faskses_id = section_by_code['FASKSES']['id']
    faskses_flow = get_flow_for_section(faskses_id, ctx)
    route.append(('--- [RQ] FASKSES ---', None))
    route.extend(faskses_flow)

    # DETAIL inline block: embedded after RQ13→RQH (RQ1 AKUT branch)
    detail_id = section_by_code['DETAIL']['id']
    detail_ctx = {k: v for k, v in ctx.items() if '|' not in k}
    detail_flow = get_flow_for_section(detail_id, detail_ctx)
    if detail_flow:
        route.append(('--- [RQ] DETAIL ---', None))
        route.extend(detail_flow)

# ── Print flow ─────────────────────────────────────────────────────────────────
print(f"\n=== FLOW ({len(route)} steps) ===")
print("Route: Q1→Q2→...→Q16→QL1(R)→FASKSES(RQ1→...→RQ13→DETAIL[RQA→...→RQH(MANDIRI)→RQI→RQJ])")
print()
for i, (code, ans) in enumerate(route, 1):
    if isinstance(code, str) and code.startswith('==='):
        print(f"\n  {code}")
    elif ans is None:
        print(f"  {i:2d}. {code}")
    elif isinstance(ans, list):
        print(f"  {i:2d}. {code} → {ans}")
    else:
        print(f"  {i:2d}. {code} → {ans}")

codes = [c for c, _ in route if isinstance(c, str)]

# ── Verification ─────────────────────────────────────────────────────────────
print(f"\n=== VERIFICATION ===")

def check(label, condition):
    print(f"  {'✓' if condition else '✗'} {label}")

print(f"\nQ1-Q16 (DATA_DASAR):")
for c in ['Q1','Q2','Q3','Q4','Q5','Q6','Q7','Q8','Q9','Q10','Q11','Q12','Q13','Q14','Q15','Q16']:
    check(f"Q{c}: {'✓' if c in codes else '✗ MISSING'}", c in codes)

print(f"\nQL1 routing:")
check("QL1 appears", 'QL1' in codes)
check("QL1='R' routes to FASKSES (RQ1 visible)", 'RQ1' in codes)

print(f"\nRQ (FASKSES) section:")
check("RQ1 (AKUT branch):", 'RQ1' in codes)
check("RQ5='Tidak' (DOKTER_24=no) → RQ8", 'RQ5' in codes and 'RQ8' in codes)
check("RQ6 visible (RSU branch, Q4=RSU):", 'RQ6' in codes)
check("RQ7 hidden (RSU branch, not RSJ):", 'RQ7' not in codes)

print(f"\nRQH → MANDIRI routing:")
check("RQH with MANDIRI selected:", 'RQH' in codes)
check("RQI appears (MANDIRI → RQI):", 'RQI' in codes)
check("RQJ appears (after RQI):", 'RQJ' in codes)
check("RQ8 appears (from RQ5=no):", 'RQ8' in codes)

print(f"\nSRQH/SRQI (QL2 not answered — should be absent):")
check("SRQH absent (QL2 not in answers):", 'SRQH' not in codes)
check("SRQJ absent (QL2 not in answers):", 'SRQJ' not in codes)
# Note: SRQI may appear due to SRQI's show_condition checking RQH (not SRQH)
# SRQI show_condition is data-level — not part of the RQH→SRQH routing fix
check("SRQI absent:", 'SRQI' not in codes)
