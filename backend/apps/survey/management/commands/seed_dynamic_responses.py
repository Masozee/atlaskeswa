"""
Seed DynamicSurveyResponse + QuestionAnswer rows by simulating the mobile flow.

Mirrors getFlowItems in mobile/lib/question-logic.ts:
- Walks sections in order, honoring section show_condition
- Within a section: starts at entry-point (cross-section next_question_code) or
  first question, then follows choice.next_question_code / skip_logic chains
- Cross-section targets that resolve to an _inline_only_ section recurse as
  detail blocks with context_key = choice.value (matches mobile storage prefix)
- Generates type-appropriate values per Question.answer_type

Usage:
    python manage.py seed_dynamic_responses --count 50
"""
import json
import random
import string
from datetime import date, time, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from apps.directory.models import Service
from apps.survey.models import (
    DynamicSurveyResponse,
    GeographicUnit,
    Question,
    QuestionAnswer,
    QuestionChoice,
    QuestionSection,
    SurveyTemplate,
)

User = get_user_model()


COVERAGE_VALUES = ['DESA_KELURAHAN', 'KECAMATAN', 'KABUPATEN_KOTA', 'PROVINSI', 'NASIONAL']
LOREM = (
    "Layanan diberikan rutin tiap minggu untuk pasien dengan kebutuhan khusus. "
    "Tim mencakup tenaga kesehatan dan pendamping yang dilatih khusus."
)


def rand_word(n=8):
    return ''.join(random.choices(string.ascii_lowercase, k=n))


class Command(BaseCommand):
    help = 'Seed DynamicSurveyResponse rows by walking the mobile flow.'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=50, help='Number of responses to create.')
        parser.add_argument('--template', type=str, default=None, help='Template code (default: all active).')
        parser.add_argument('--seed', type=int, default=None, help='Random seed.')
        parser.add_argument('--enumerator-count', type=int, default=0,
                            help='Create N enumerator users named enumerator001..NNN (SURVEYOR role).')
        parser.add_argument('--faskes-ratio', type=float, default=None,
                            help='Probability a response is faskes (Q4 in RSU/RSJ/PUSKESMAS/KLINIK/PRAKTEK_DOKTER). '
                                 'Remaining responses go to non-faskes.')
        parser.add_argument('--ql1-probs', type=str, default=None,
                            help='Independent selection probabilities for QL1, e.g. R=0.1,D=0.1,O=0.8,A=0.8,I=1.0')
        parser.add_argument('--ql2-probs', type=str, default=None,
                            help='Independent selection probabilities for QL2, e.g. SR=0.1,SD=0.1,SO=0.8,SA=0.5,SI=0.7')

    @staticmethod
    def _parse_probs(spec: str) -> dict[str, float]:
        if not spec:
            return {}
        out: dict[str, float] = {}
        for chunk in spec.split(','):
            chunk = chunk.strip()
            if not chunk:
                continue
            if '=' not in chunk:
                raise ValueError(f'Bad probs spec: {chunk!r} (expected KEY=FLOAT)')
            k, v = chunk.split('=', 1)
            out[k.strip()] = float(v.strip())
        return out

    def handle(self, *args, **opts):
        if opts['seed'] is not None:
            random.seed(opts['seed'])

        # Distribution config (used by _generate_value via self._slot)
        self.faskes_ratio = opts.get('faskes_ratio')
        self.ql1_probs = self._parse_probs(opts.get('ql1_probs') or '')
        self.ql2_probs = self._parse_probs(opts.get('ql2_probs') or '')
        self._slot: str | None = None  # 'faskes' / 'non_faskes' / None

        if opts.get('enumerator_count'):
            self._ensure_enumerators(opts['enumerator_count'])
        self._ensure_surveyors()

        templates_qs = SurveyTemplate.objects.filter(is_active=True)
        if opts['template']:
            templates_qs = templates_qs.filter(code=opts['template'])
        templates = list(templates_qs)
        if not templates:
            self.stdout.write(self.style.ERROR('No active templates found.'))
            return

        services = list(Service.objects.filter(is_active=True))
        if not services:
            self.stdout.write(self.style.ERROR('No active services. Run seed_data first.'))
            return

        surveyors = list(User.objects.filter(role=User.Role.SURVEYOR))
        verifiers = list(User.objects.filter(role=User.Role.VERIFIER))

        count = opts['count']
        # Pre-assign slot per response so faskes_ratio holds exactly.
        slots: list[str | None] = []
        if self.faskes_ratio is not None:
            n_faskes = round(count * self.faskes_ratio)
            slots = ['faskes'] * n_faskes + ['non_faskes'] * (count - n_faskes)
            random.shuffle(slots)
        else:
            slots = [None] * count

        created = 0
        for i in range(count):
            self._slot = slots[i]
            template = random.choice(templates)
            service = random.choice(services)
            surveyor = random.choice(surveyors)
            verifier = random.choice(verifiers) if verifiers else None
            try:
                with transaction.atomic():
                    self._create_response(template, service, surveyor, verifier)
                created += 1
                if (i + 1) % 10 == 0:
                    self.stdout.write(f'  ... {i + 1}/{count}')
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ! response {i} skipped: {e}'))

        self.stdout.write(self.style.SUCCESS(
            f'Done. {created}/{count} dynamic responses created.'
        ))

    def _ensure_enumerators(self, n: int):
        """Create enumerator001..N as SURVEYOR users (idempotent)."""
        for i in range(1, n + 1):
            email = f'enumerator{i:03d}@yakkum.id'
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': User.Role.SURVEYOR,
                    'first_name': f'Enumerator',
                    'last_name': f'{i:03d}',
                    'organization': 'Field Enumerator',
                },
            )
            if created:
                user.set_password(f'enumerator{i:03d}')
                user.save()
                self.stdout.write(f'  + enumerator {email}')

    def _ensure_surveyors(self):
        existing = User.objects.filter(role=User.Role.SURVEYOR).count()
        if existing >= 3:
            return
        seed = [
            ('surveyor1@yakkum.id', 'Ahmad', 'Wijaya', 'Jakarta Survey Team'),
            ('surveyor2@yakkum.id', 'Siti', 'Nurhaliza', 'Bandung Survey Team'),
            ('surveyor3@yakkum.id', 'Budi', 'Santoso', 'Surabaya Survey Team'),
        ]
        for email, first, last, org in seed:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'role': User.Role.SURVEYOR,
                    'first_name': first,
                    'last_name': last,
                    'organization': org,
                },
            )
            if created:
                user.set_password('surveyor123')
                user.save()
                self.stdout.write(f'  + surveyor {email}')

    # ---------- response creation ----------

    def _create_response(self, template: SurveyTemplate, service: Service,
                         surveyor, verifier):
        sections = list(template.sections.prefetch_related('questions__choices').order_by('order'))
        all_questions = [q for s in sections for q in s.questions.all()]

        # global code -> Question map (across template)
        self.code_to_question = {q.code: q for q in all_questions}
        # inline target lookup (DETAIL section)
        self.inline_section_for_code = {}
        for s in sections:
            sc = s.show_condition or {}
            if sc.get('question_code') == '_inline_only_':
                for q in s.questions.all():
                    self.inline_section_for_code[q.code] = s

        # answer state mirrors mobile rawAnswers: keys are "code" or "ctx|code"
        self.raw_answers: dict = {}

        survey_dt = timezone.now() - timedelta(days=random.randint(1, 90))
        status = random.choices(
            [DynamicSurveyResponse.Status.DRAFT,
             DynamicSurveyResponse.Status.SUBMITTED,
             DynamicSurveyResponse.Status.VERIFIED,
             DynamicSurveyResponse.Status.REJECTED],
            weights=[2, 3, 4, 1], k=1,
        )[0]

        lat = float(service.latitude) if service.latitude else -7.6
        lng = float(service.longitude) if service.longitude else 109.7

        response = DynamicSurveyResponse.objects.create(
            template=template,
            service=service,
            surveyor=surveyor,
            survey_date=survey_dt,
            verification_status=status,
            assigned_verifier=verifier if status != DynamicSurveyResponse.Status.DRAFT else None,
            verified_by=verifier if status == DynamicSurveyResponse.Status.VERIFIED else None,
            verified_at=timezone.now() - timedelta(days=random.randint(0, 10))
                if status == DynamicSurveyResponse.Status.VERIFIED else None,
            latitude=Decimal(str(lat + random.uniform(-0.001, 0.001))),
            longitude=Decimal(str(lng + random.uniform(-0.001, 0.001))),
            location_accuracy=Decimal(str(random.uniform(5.0, 25.0))),
            surveyor_notes=random.choice([
                'Survey diisi langsung oleh pengelola fasilitas.',
                'Sebagian data dikonfirmasi via telepon.',
                'Lokasi cukup terpencil, akses internet terbatas.',
                '',
            ]),
            started_at=survey_dt,
            submitted_at=survey_dt + timedelta(hours=2)
                if status != DynamicSurveyResponse.Status.DRAFT else None,
        )

        self.response = response
        self.recorded: list[tuple[Question, object, str]] = []
        self.section_visit_count: dict[int, int] = {}

        for section in sections:
            sc = section.show_condition or {}
            if sc.get('question_code') == '_inline_only_':
                continue  # only entered via cross-section recursion
            if not self._eval_show_condition(sc):
                continue
            self._walk_section(section, start_code=None, context_key='')

        self._persist_answers()

    # ---------- flow walker (port of getFlowItems essentials) ----------

    def _walk_section(self, section: QuestionSection, start_code: str | None,
                      context_key: str):
        # Limit recursion blow-up if template has cycles / huge fan-out
        depth = self.section_visit_count.get(section.id, 0)
        if depth > 40:
            return
        self.section_visit_count[section.id] = depth + 1

        visible = [q for q in section.questions.all().order_by('order')
                   if self._eval_show_condition(q.show_condition or {})]
        if not visible:
            return
        code_map = {q.code: q for q in visible}

        # Entry points
        if start_code:
            entry_codes = [start_code]
        else:
            entry_codes = self._find_entry_points(section, code_map) or [visible[0].code]

        visited: set[str] = set()
        for entry in entry_codes:
            current = code_map.get(entry)
            if not current:
                continue
            while current and current.code not in visited:
                visited.add(current.code)

                value = self._generate_value(current)
                self._record(current, value, context_key)

                next_code, triggering_choice = self._next_code(current, value, code_map)

                # Cross-section jump to inline detail block
                if next_code and next_code not in code_map:
                    target_section = self.inline_section_for_code.get(next_code)
                    if target_section:
                        self._handle_multi_choice_branches(
                            current, value, code_map, visited, context_key
                        )
                        # Continue by order in current section
                        idx = visible.index(current)
                        current = visible[idx + 1] if idx + 1 < len(visible) else None
                        continue
                    # unknown cross-section target — fall through to sequential
                    next_code = None

                if next_code and next_code in code_map:
                    current = code_map[next_code]
                    continue

                # sequential by order
                idx = visible.index(current)
                current = visible[idx + 1] if idx + 1 < len(visible) else None

    def _handle_multi_choice_branches(self, current: Question, value,
                                      code_map: dict, visited: set,
                                      parent_context: str):
        """For MULTIPLE_CHOICE / SINGLE_CHOICE with cross-section choices, recurse
        once per selected choice into its inline detail section."""
        if not current.choices.exists():
            return
        if current.answer_type == 'MULTIPLE_CHOICE':
            selected_values = value if isinstance(value, list) else []
        else:
            selected_values = [value] if value is not None else []

        for choice in current.choices.order_by('order'):
            if choice.value not in selected_values:
                continue
            if not choice.next_question_code:
                continue
            target = choice.next_question_code
            if target in code_map:
                continue  # in-section, will be reached by main walker
            target_section = self.inline_section_for_code.get(target)
            if not target_section:
                continue
            visited.add(target)  # mark in parent so we don't re-enter via fallthrough
            self._walk_section(target_section, start_code=target,
                               context_key=choice.value)

    def _next_code(self, q: Question, value, code_map: dict):
        """Return (next_code, triggering_choice) mirroring mobile logic."""
        triggering_choice = None
        if q.choices.exists():
            choices = list(q.choices.order_by('order'))
            if q.answer_type == 'MULTIPLE_CHOICE':
                selected = [c for c in choices if isinstance(value, list) and c.value in value]
            else:
                selected = [c for c in choices if c.value == value]
            for c in selected:
                if c.next_question_code:
                    triggering_choice = c
                    return c.next_question_code, c
            return None, None
        if q.skip_logic:
            try:
                rules = q.skip_logic if isinstance(q.skip_logic, list) else json.loads(q.skip_logic)
            except (TypeError, ValueError):
                rules = []
            for rule in rules:
                goto = rule.get('goto')
                if not goto or goto == '_END_':
                    continue
                if goto == '_next':
                    return None, None
                # match value, or _next sentinel meaning "continue"
                rv = rule.get('value')
                if rv in (None, '_next'):
                    return goto if goto != '_next' else None, None
                if value == rv or (isinstance(value, list) and rv in value):
                    return goto, None
            # default to first goto
            first = rules[0].get('goto') if rules else None
            if first and first not in ('_next', '_END_'):
                return first, None
        return None, None

    def _find_entry_points(self, section: QuestionSection, code_map: dict) -> list[str]:
        """Find codes in this section that prior MULTIPLE_CHOICE answers point to."""
        entry: list[tuple[str, int]] = []
        section_codes = set(code_map.keys())
        for code, val in self.raw_answers.items():
            if '|' in code:
                continue
            q = self.code_to_question.get(code)
            if not q:
                continue
            if not q.choices.exists():
                continue
            sel_values = val if isinstance(val, list) else [val]
            for c in q.choices.all():
                if c.value in sel_values and c.next_question_code in section_codes:
                    target_q = code_map[c.next_question_code]
                    if not any(e[0] == target_q.code for e in entry):
                        entry.append((target_q.code, target_q.order))
        entry.sort(key=lambda x: x[1])
        return [e[0] for e in entry]

    # ---------- show_condition evaluator ----------

    def _eval_show_condition(self, cond: dict) -> bool:
        if not cond:
            return True
        if cond.get('question_code') == '_inline_only_':
            return False
        if cond.get('operator') in ('and', 'or'):
            sub = cond.get('conditions', [])
            results = [self._eval_single_condition(c) for c in sub]
            return all(results) if cond['operator'] == 'and' else any(results)
        return self._eval_single_condition(cond)

    def _eval_single_condition(self, cond: dict) -> bool:
        code = cond.get('question_code')
        if not code:
            return True
        op = cond.get('operator', 'equals')
        expected = cond.get('value')
        ans = self.raw_answers.get(code)
        if ans is None:
            return False
        if op == 'equals':
            if isinstance(expected, list):
                return any(self._equal(ans, v) for v in expected)
            return self._equal(ans, expected)
        if op == 'not_equals':
            return not self._equal(ans, expected)
        if op == 'in':
            if isinstance(ans, list):
                return any(a in (expected or []) for a in ans)
            return ans in (expected or [])
        if op == 'not_in':
            return ans not in (expected or [])
        if op == 'contains':
            if isinstance(ans, list):
                return expected in ans
            return str(expected) in str(ans)
        return self._equal(ans, expected)

    @staticmethod
    def _equal(ans, expected) -> bool:
        if isinstance(ans, list):
            return expected in ans
        return ans == expected

    # ---------- value generation ----------

    @staticmethod
    def _sample_independent(q: Question, probs: dict[str, float]) -> list[str]:
        """Pick MC values per independent Bernoulli probability. Ensures at
        least one value selected (re-rolls if all zero)."""
        choices = list(q.choices.order_by('order'))
        for _ in range(5):
            picked = [c.value for c in choices if random.random() < probs.get(c.value, 0.0)]
            if picked:
                return picked
        # Fallback: pick the highest-probability value
        if choices and probs:
            best = max(choices, key=lambda c: probs.get(c.value, 0.0))
            return [best.value]
        return []

    FASKES_Q4_VALUES = ('RSU', 'RSJ', 'PUSKESMAS', 'KLINIK', 'PRAKTEK_DOKTER')
    NON_FASKES_Q4_VALUES = ('BALAI_REHABILITASI', 'PANTI_SOSIAL', 'OBK', 'LSM',
                            'LKS', 'PRAKTIK_PRIBADI', 'LAINNYA')

    def _generate_value(self, q: Question):
        # Slot-driven overrides for Q4 / QL1 / QL2
        if self._slot is not None:
            if q.code == 'Q4':
                pool = self.FASKES_Q4_VALUES if self._slot == 'faskes' else self.NON_FASKES_Q4_VALUES
                # restrict to choices that actually exist on this question
                valid = [c.value for c in q.choices.all() if c.value in pool]
                return random.choice(valid) if valid else random.choice(pool)
            if q.code == 'QL1' and self._slot == 'faskes' and self.ql1_probs:
                return self._sample_independent(q, self.ql1_probs)
            if q.code == 'QL2' and self._slot == 'non_faskes' and self.ql2_probs:
                return self._sample_independent(q, self.ql2_probs)

        t = q.answer_type
        if t in ('TEXT',):
            return f'{rand_word(5).title()} {rand_word(6)}'
        if t == 'TEXTAREA':
            return LOREM
        if t in ('NUMBER', 'INTEGER'):
            rules = q.validation_rules or {}
            lo = int(rules.get('min', 1))
            hi = int(rules.get('max', 50))
            if hi <= lo:
                hi = lo + 10
            return random.randint(lo, hi)
        if t == 'DATE':
            return date.today() - timedelta(days=random.randint(30, 3650))
        if t == 'TIME':
            return time(random.randint(7, 19), random.choice([0, 15, 30, 45]))
        if t == 'BOOLEAN':
            return random.choice([True, False])
        if t == 'SINGLE_CHOICE':
            choices = list(q.choices.order_by('order'))
            return random.choice(choices).value if choices else ''
        if t == 'MULTIPLE_CHOICE':
            choices = list(q.choices.order_by('order'))
            if not choices:
                return []
            k = min(len(choices), random.randint(1, min(3, len(choices))))
            return [c.value for c in random.sample(choices, k)]
        if t == 'GEO_PROVINSI':
            return self._random_geo('PROVINSI')
        if t == 'GEO_KABUPATEN':
            return self._random_geo('KABUPATEN_KOTA')
        if t == 'GEO_KECAMATAN':
            return self._random_geo('KECAMATAN')
        if t == 'GEO_DESA':
            return self._random_geo('DESA_KELURAHAN')
        if t == 'GEO_FULL':
            return self._random_geo('DESA_KELURAHAN')
        if t == 'COVERAGE_LEVEL':
            return random.choice(COVERAGE_VALUES)
        if t == 'PHONE':
            return f'+62{random.randint(81000000000, 89999999999)}'
        if t == 'EMAIL':
            return f'{rand_word()}@example.id'
        if t == 'URL':
            return f'https://{rand_word()}.example.id'
        if t == 'GPS':
            return {
                'latitude': -7.6 + random.uniform(-0.5, 0.5),
                'longitude': 109.7 + random.uniform(-0.5, 0.5),
            }
        if t in ('STAFF_TABLE', 'DIAGNOSIS_TABLE', 'REPEATING_TABLE',
                 'INTERVENTION_MATRIX', 'OPERATING_HOURS', 'KEGIATAN_TABLE',
                 'MATRIX_KEGIATAN'):
            return self._generate_table(q)
        if t == 'FILE':
            return ''
        return ''

    def _random_geo(self, level: str):
        units = list(GeographicUnit.objects.filter(level=level)[:50])
        if not units:
            return {'_text': f'{level.title()} Sample'}
        u = random.choice(units)
        return {'_geo_id': u.id, '_label': u.name}

    def _generate_table(self, q: Question):
        cfg = q.table_config or {}
        rows = cfg.get('rows') or cfg.get('default_rows') or [
            {'code': f'r{i}', 'label': f'Row {i}'} for i in range(1, 4)
        ]
        cols = cfg.get('columns') or [
            {'code': 'value', 'label': 'Value', 'type': 'number'},
        ]
        out = []
        for row in rows[:5]:
            row_code = row.get('code') if isinstance(row, dict) else str(row)
            entry = {'row': row_code}
            for col in cols:
                ctype = col.get('type', 'text')
                ccode = col.get('code', 'value')
                if ctype == 'number':
                    entry[ccode] = random.randint(0, 25)
                elif ctype == 'time':
                    entry[ccode] = '09:00'
                else:
                    entry[ccode] = rand_word(6)
            out.append(entry)
        return out

    # ---------- persistence ----------

    def _record(self, q: Question, value, context_key: str):
        key = f'{context_key}|{q.code}' if context_key else q.code
        self.raw_answers[key] = value
        self.recorded.append((q, value, context_key))

    def _persist_answers(self):
        seen: set[tuple[int, str]] = set()
        for q, value, ctx in self.recorded:
            key = (q.id, ctx)
            if key in seen:
                continue
            seen.add(key)
            self._save_answer(q, value, ctx)

    def _save_answer(self, q: Question, value, context_key: str):
        kwargs = dict(response=self.response, question=q, context_key=context_key)
        t = q.answer_type
        m2m_choices: list[QuestionChoice] = []
        if t == 'TEXT' or t == 'TEXTAREA':
            kwargs['text_value'] = str(value)
        elif t in ('NUMBER', 'INTEGER'):
            kwargs['number_value'] = Decimal(str(value))
        elif t == 'DATE':
            kwargs['date_value'] = value
        elif t == 'TIME':
            kwargs['time_value'] = value
        elif t == 'BOOLEAN':
            kwargs['boolean_value'] = bool(value)
        elif t == 'SINGLE_CHOICE':
            kwargs['text_value'] = str(value)
            m2m_choices = list(q.choices.filter(value=value))
        elif t == 'MULTIPLE_CHOICE':
            kwargs['text_value'] = json.dumps(value)
            m2m_choices = list(q.choices.filter(value__in=value or []))
        elif t in ('GEO_PROVINSI', 'GEO_KABUPATEN', 'GEO_KECAMATAN',
                   'GEO_DESA', 'GEO_FULL'):
            if isinstance(value, dict) and value.get('_geo_id'):
                try:
                    kwargs['geographic_unit'] = GeographicUnit.objects.get(id=value['_geo_id'])
                    kwargs['text_value'] = value.get('_label', '')
                except GeographicUnit.DoesNotExist:
                    kwargs['text_value'] = value.get('_label', '')
            else:
                kwargs['text_value'] = str(value.get('_text', '')) if isinstance(value, dict) else str(value)
        elif t == 'COVERAGE_LEVEL':
            kwargs['coverage_level'] = value
        elif t in ('PHONE', 'EMAIL', 'URL'):
            kwargs['text_value'] = str(value)
        elif t == 'GPS':
            if isinstance(value, dict):
                kwargs['gps_latitude'] = Decimal(str(value['latitude']))
                kwargs['gps_longitude'] = Decimal(str(value['longitude']))
        elif t in ('STAFF_TABLE', 'DIAGNOSIS_TABLE', 'REPEATING_TABLE',
                   'INTERVENTION_MATRIX', 'OPERATING_HOURS', 'KEGIATAN_TABLE',
                   'MATRIX_KEGIATAN'):
            kwargs['table_data'] = value
        elif t == 'FILE':
            return
        ans = QuestionAnswer.objects.create(**kwargs)
        if m2m_choices:
            ans.selected_choices.set(m2m_choices)
