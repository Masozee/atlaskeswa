'use client';

import { useMemo } from 'react';
import type { SurveyTemplate, Question, QuestionSection } from '@/lib/types/survey-template';

// ─── Types ───────────────────────────────────────────────────────────────────

interface InlineCrossFlow {
  choiceLabel: string;
  cabangMtc: string;
  targetSectionCode: string;
  targetSectionColor: string;
  questionCodes: string[];
}

interface FlowStep {
  code: string;
  answerType: string;
  hasCondition: boolean;
  inSectionBranches: string[];
  // Inline cross-section sub-flows (one per choice that exits to another section)
  inlineCross: InlineCrossFlow[];
}

interface SectionFlow {
  section: QuestionSection;
  color: string;
  steps: FlowStep[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SECTION_PALETTE = [
  '#4F72E5', '#22C55E', '#8B5CF6', '#F59E0B',
  '#EF4444', '#EC4899', '#07579E', '#6366F1',
];

/** Walk a section's questions linearly from a given start code, following next_question_code. */
function walkSectionFlow(
  section: QuestionSection,
  startCode: string | undefined,
): string[] {
  const questions = (section.questions || []).slice().sort((a, b) => a.order - b.order);
  if (questions.length === 0) return [];

  const codeMap = new Map(questions.map((q) => [q.code, q]));
  const result: string[] = [];
  const visited = new Set<string>();

  let current: Question | undefined = (startCode ? codeMap.get(startCode) : undefined) ?? questions[0];

  while (current && !visited.has(current.code)) {
    visited.add(current.code);
    result.push(current.code);

    const nextCode = current.skip_logic?.[0]?.goto
      ?? current.choices?.find((c) => c.next_question_code)?.next_question_code;

    if (nextCode && codeMap.has(nextCode)) {
      current = codeMap.get(nextCode);
    } else {
      const idx = questions.indexOf(current);
      current = idx < questions.length - 1 ? questions[idx + 1] : undefined;
    }
  }

  return result;
}

function buildSectionFlows(template: SurveyTemplate): SectionFlow[] {
  const sections = (template.sections || []).slice().sort((a, b) => a.order - b.order);
  if (sections.length === 0) return [];

  // Global code → section lookup
  const codeToSection = new Map<string, QuestionSection>();
  sections.forEach((s) => {
    (s.questions || []).forEach((q) => codeToSection.set(q.code, s));
  });

  // Section code → palette color
  const sectionColor = new Map<string, string>();
  sections.forEach((s, idx) => sectionColor.set(s.code, SECTION_PALETTE[idx % SECTION_PALETTE.length]));

  return sections.map((section, idx) => {
    const color = SECTION_PALETTE[idx % SECTION_PALETTE.length];
    const questions = (section.questions || []).slice().sort((a, b) => a.order - b.order);
    if (questions.length === 0) return { section, color, steps: [] };

    const codeMap = new Map(questions.map((q) => [q.code, q]));
    const sectionCodes = new Set(questions.map((q) => q.code));

    const steps: FlowStep[] = [];
    const visited = new Set<string>();
    let current: Question | undefined = questions[0];

    while (current && !visited.has(current.code)) {
      visited.add(current.code);

      const inSectionBranches: string[] = [];
      const inlineCross: InlineCrossFlow[] = [];

      for (const choice of (current.choices || [])) {
        if (!choice.next_question_code) continue;
        if (sectionCodes.has(choice.next_question_code)) {
          if (!inSectionBranches.includes(choice.next_question_code)) {
            inSectionBranches.push(choice.next_question_code);
          }
        } else {
          const targetSection = codeToSection.get(choice.next_question_code);
          if (targetSection) {
            inlineCross.push({
              choiceLabel: choice.label,
              cabangMtc: (choice as any).cabang_mtc ?? '',
              targetSectionCode: targetSection.code,
              targetSectionColor: sectionColor.get(targetSection.code) ?? '#94A3B8',
              questionCodes: walkSectionFlow(targetSection, choice.next_question_code),
            });
          }
        }
      }

      steps.push({
        code: current.code,
        answerType: current.answer_type,
        hasCondition: !!current.show_condition,
        inSectionBranches,
        inlineCross,
      });

      if (inSectionBranches.length > 0) {
        const next = codeMap.get(inSectionBranches[0]);
        if (next && !visited.has(next.code)) {
          current = next;
        } else {
          const currentIdx = questions.indexOf(current);
          const nextUnvisited = questions.slice(currentIdx + 1).find((q) => !visited.has(q.code));
          current = nextUnvisited;
        }
      } else {
        const currentIdx = questions.indexOf(current);
        current = currentIdx < questions.length - 1 ? questions[currentIdx + 1] : undefined;
      }
    }

    // Append unvisited questions
    for (const q of questions) {
      if (!visited.has(q.code)) {
        steps.push({
          code: q.code,
          answerType: q.answer_type,
          hasCondition: !!q.show_condition,
          inSectionBranches: [],
          inlineCross: [],
        });
      }
    }

    return { section, color, steps };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionChip({
  code,
  hasCondition,
  color,
  isCross = false,
}: {
  code: string;
  hasCondition: boolean;
  color: string;
  isCross?: boolean;
}) {
  return (
    <div
      className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white leading-none select-none"
      style={{ backgroundColor: isCross ? '#94A3B8' : color }}
      title={hasCondition ? 'Pertanyaan kondisional' : undefined}
    >
      {code}
      {hasCondition && <span className="opacity-60 ml-0.5">*</span>}
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center mx-0.5 text-muted-foreground">
      {label ? (
        <div className="flex flex-col items-center gap-0 leading-none">
          <span className="text-[8px] text-muted-foreground whitespace-nowrap max-w-[80px] truncate text-center">{label}</span>
          <span className="text-[10px]">→</span>
        </div>
      ) : (
        <span className="text-[11px]">→</span>
      )}
    </div>
  );
}

/** Inline sub-row showing the DETAIL questions for one cabang_mtc context. */
function InlineCrossRow({ cross }: { cross: InlineCrossFlow }) {
  const codes = cross.questionCodes;
  // If many codes, abbreviate: show first 4, ellipsis, last 1
  const MAX_SHOW = 6;
  const showAll = codes.length <= MAX_SHOW;
  const displayed = showAll ? codes : [...codes.slice(0, MAX_SHOW - 1), '…', codes[codes.length - 1]];

  return (
    <div className="flex items-start gap-1.5 mt-1 ml-4 pl-3 border-l-2 border-dashed" style={{ borderColor: cross.targetSectionColor }}>
      {/* Label */}
      <div
        className="shrink-0 rounded px-1.5 py-0.5 text-white text-[9px] font-bold leading-none self-center whitespace-nowrap"
        style={{ backgroundColor: cross.targetSectionColor }}
      >
        {cross.targetSectionCode}
      </div>

      {/* cabang_mtc label if any */}
      {cross.cabangMtc && (
        <span className="text-[8px] text-muted-foreground self-center whitespace-nowrap max-w-[120px] truncate font-mono" title={cross.cabangMtc}>
          [{cross.cabangMtc}]
        </span>
      )}

      {/* Question chips */}
      <div className="flex items-center flex-wrap gap-y-0.5">
        {displayed.map((code, i) => (
          <div key={`${code}-${i}`} className="flex items-center">
            {code === '…' ? (
              <span className="text-[10px] text-muted-foreground mx-1">…</span>
            ) : (
              <QuestionChip code={code} hasCondition={false} color={cross.targetSectionColor} />
            )}
            {i < displayed.length - 1 && <Arrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SurveyFlowTimelineProps {
  template: SurveyTemplate;
}

export function SurveyFlowTimeline({ template }: SurveyFlowTimelineProps) {
  const sectionFlows = useMemo(() => buildSectionFlows(template), [template]);

  return (
    <div className="flex flex-1 flex-col overflow-auto p-4 gap-0 bg-white">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[10px] text-muted-foreground flex-wrap">
        <span className="font-semibold text-foreground text-xs">Alur Pertanyaan</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-primary" /> pertanyaan
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-sm bg-slate-400" /> lanjut ke bagian lain
        </span>
        <span className="flex items-center gap-1 font-mono">* = kondisional</span>
        <span className="flex items-center gap-1 font-mono">A / B = percabangan</span>
        <span className="flex items-center gap-1 font-mono">↳ = detail inline</span>
      </div>

      {sectionFlows.map((sf, idx) => (
        <div key={sf.section.id}>
          {/* Section row */}
          <div className="flex items-start gap-3 py-2 min-w-0">
            {/* Section label */}
            <div
              className="shrink-0 w-32 rounded-md px-2 py-1.5 text-white text-[10px] font-bold text-center leading-tight self-start"
              style={{ backgroundColor: sf.color }}
            >
              <div>{sf.section.code}</div>
              {sf.section.name && (
                <div className="font-normal opacity-80 text-[9px] truncate mt-0.5">{sf.section.name}</div>
              )}
              {sf.section.show_condition && (
                <div className="text-[8px] opacity-70 mt-0.5">
                  if {sf.section.show_condition.question_code}
                </div>
              )}
            </div>

            {/* Flow steps + inline cross-section sub-rows */}
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              {/* Main flow row */}
              <div className="flex items-center flex-wrap gap-y-1">
                {sf.steps.length === 0 ? (
                  <span className="text-[10px] text-muted-foreground italic">kosong</span>
                ) : (
                  sf.steps.map((step, sIdx) => (
                    <div key={step.code} className="flex items-center">
                      <QuestionChip
                        code={step.code}
                        hasCondition={step.hasCondition}
                        color={sf.color}
                      />

                      {/* Inline branch label: A / B */}
                      {step.inSectionBranches.length > 1 && (
                        <span className="text-[9px] text-muted-foreground mx-0.5 font-mono">
                          ({step.inSectionBranches.join(' / ')})
                        </span>
                      )}

                      {/* Arrow to next step (no arrow if this step has cross branches — those are shown below) */}
                      {sIdx < sf.steps.length - 1 && step.inlineCross.length === 0 && (
                        <Arrow />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Inline cross-section sub-rows: one row per step that has cross exits */}
              {sf.steps.map((step) =>
                step.inlineCross.length > 0 ? (
                  <div key={`cross-${step.code}`} className="flex flex-col gap-0.5 ml-2">
                    <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <span className="font-mono font-bold">{step.code}</span>
                      <span>↓ detail inline ({step.inlineCross.length} konteks)</span>
                    </div>
                    {step.inlineCross.map((cross, ci) => (
                      <InlineCrossRow key={ci} cross={cross} />
                    ))}
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Section transition */}
          {idx < sectionFlows.length - 1 && (
            <div className="flex items-center gap-3 pl-[140px] pb-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <div className="w-px h-4 bg-border mx-1" />
                <span className="text-[9px] font-medium text-muted-foreground tracking-wide">
                  ↓ Selanjutnya
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
