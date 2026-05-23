'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Position,
  MarkerType,
  Panel,
  Handle,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { SurveyTemplate, Question, QuestionOption, QuestionSection } from '@/lib/types/survey-template';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ─── Custom Nodes ───────────────────────────────────────────────

function QuestionNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    code: string;
    color: string;
    isStart: boolean;
    isEnd: boolean;
    hasCondition: boolean;
    hasBranching: boolean;
  };
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-sm min-w-[140px] max-w-[200px] text-white text-[10px] font-semibold leading-tight cursor-pointer hover:brightness-110 transition-all"
      style={{ backgroundColor: d.color }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/60 !w-2.5 !h-2.5" />
      <p className="text-xs font-bold">{d.code}</p>
      <p className="font-normal opacity-90 mt-0.5 line-clamp-2">{d.label}</p>
      {d.hasCondition && (
        <span className="text-[9px] opacity-70 mt-0.5 inline-block">Kondisional</span>
      )}
      <Handle type="source" position={Position.Right} className="!bg-white/60 !w-2.5 !h-2.5" />
    </div>
  );
}

const nodeTypes = { question: QuestionNode };

// ─── Layout ─────────────────────────────────────────────────────

const SECTION_X_GAP = 300;
const Q_Y_GAP = 70;
const SECTION_HEADER_HEIGHT = 60;

interface SurveyMindmapProps {
  template: SurveyTemplate;
  onEditQuestion?: (question: Question) => void;
  onEditChoice?: (choice: QuestionOption, questionId: number) => void;
  onAddChoice?: (questionId: number) => void;
  onEditSection?: (section: QuestionSection) => void;
  onAddQuestion?: (sectionId: number, sectionCode: string, existingCodes: string[]) => void;
  onDeleteChoice?: (choiceId: number) => void;
}

function buildFlowGraph(template: SurveyTemplate) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const sections = (template.sections || []).slice().sort((a, b) => a.order - b.order);

  if (sections.length === 0) return { nodes, edges };

  const SECTION_PALETTE = ['#4F72E5', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#07579E', '#6366F1'];
  const codeToQuestion = new Map<string, Question>();
  const questionToNodeId = new Map<string, string>();

  // Collect all questions for cross-section lookups
  sections.forEach((s) => {
    (s.questions || []).forEach((q) => codeToQuestion.set(q.code, q));
  });

  // Layout: each section is a column, questions stacked vertically
  let xOffset = 0;

  sections.forEach((section, sIdx) => {
    const sectionColor = SECTION_PALETTE[sIdx % SECTION_PALETTE.length];
    const questions = (section.questions || []).slice().sort((a, b) => a.order - b.order);

    // Question nodes
    questions.forEach((question, qIdx) => {
      const nodeId = `q-${question.id}`;
      questionToNodeId.set(question.code, nodeId);

      const hasBranching = !!(
        (question.choices || []).some((c) => c.next_question_code) ||
        (question.skip_logic && question.skip_logic.length > 0 && question.skip_logic[0].goto)
      );

      nodes.push({
        id: nodeId,
        type: 'question',
        position: { x: xOffset, y: qIdx * Q_Y_GAP },
        data: {
          label: question.question_text,
          code: question.code,
          color: sectionColor,
          isStart: qIdx === 0,
          isEnd: qIdx === questions.length - 1,
          hasCondition: !!question.show_condition,
          hasBranching,
        },
      });

      // Edge: sequential flow within section
      if (qIdx > 0) {
        const prevQ = questions[qIdx - 1];
        const prevNodeId = `q-${prevQ.id}`;
        const prevHasBranching = (prevQ.choices || []).some((c) => c.next_question_code);
        if (!prevHasBranching) {
          edges.push({
            id: `e-seq-${prevQ.id}-${question.id}`,
            source: prevNodeId,
            target: nodeId,
            type: 'default',
            style: { stroke: sectionColor, strokeWidth: 1, strokeDasharray: '4 4' },
            markerEnd: { type: MarkerType.ArrowClosed, color: sectionColor },
          });
        }
      }
    });

    // Edge: last question → first question of next non-conditional section
    if (sIdx < sections.length - 1) {
      const nextSection = sections[sIdx + 1];
      const lastQ = questions[questions.length - 1];
      const nextQuestions = (nextSection.questions || []).slice().sort((a, b) => a.order - b.order);
      if (lastQ && nextQuestions.length > 0 && !nextSection.show_condition) {
        edges.push({
          id: `e-sec-${lastQ.id}-${nextQuestions[0].id}`,
          source: `q-${lastQ.id}`,
          target: `q-${nextQuestions[0].id}`,
          type: 'default',
          style: { stroke: '#94A3B8', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
        });
      }
    }

    xOffset += SECTION_X_GAP;
  });

  // Second pass: branching edges (next_question_code, skip_logic, show_condition)
  const branchColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6'];
  let branchColorIdx = 0;
  const seenBranch = new Set<string>();

  sections.forEach((section) => {
    const questions = (section.questions || []).slice().sort((a, b) => a.order - b.order);

    questions.forEach((question) => {
      const choices = question.choices || [];
      const choicesWithNext = choices.filter((c) => c.next_question_code && questionToNodeId.has(c.next_question_code));

      // Choice-level branching
      choicesWithNext.forEach((choice) => {
        const sourceId = questionToNodeId.get(question.code)!;
        const targetId = questionToNodeId.get(choice.next_question_code!)!;
        const edgeKey = `${sourceId}-${targetId}`;

        if (seenBranch.has(edgeKey)) {
          // Combine labels for same source→target
          const existing = edges.find((e) => e.id === `e-br-${edgeKey}`);
          if (existing && existing.label) {
            existing.label = (existing.label as string) + ', ' + choice.label;
          }
          return;
        }
        seenBranch.add(edgeKey);

        const color = branchColors[branchColorIdx++ % branchColors.length];
        edges.push({
          id: `e-br-${edgeKey}`,
          source: sourceId,
          target: targetId,
          type: 'default',
          label: choice.label,
          labelStyle: { fontSize: 9, fill: '#6B7280' },
          labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
          labelBgPadding: [4, 2] as [number, number],
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color },
        });
      });

      // Question-level skip_logic
      if (choicesWithNext.length === 0 && question.skip_logic && question.skip_logic.length > 0 && question.skip_logic[0].goto) {
        const targetCode = question.skip_logic[0].goto;
        if (questionToNodeId.has(targetCode)) {
          const sourceId = questionToNodeId.get(question.code)!;
          const targetId = questionToNodeId.get(targetCode)!;
          const edgeKey = `${sourceId}-${targetId}`;
          if (!seenBranch.has(edgeKey)) {
            seenBranch.add(edgeKey);
            const color = branchColors[branchColorIdx++ % branchColors.length];
            edges.push({
              id: `e-br-${edgeKey}`,
              source: sourceId,
              target: targetId,
              type: 'default',
              style: { stroke: color, strokeWidth: 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color },
            });
          }
        }
      }
    });
  });

  // Show_condition edges: section or question depends on another question
  sections.forEach((section) => {
    if (section.show_condition?.question_code) {
      const triggerCode = section.show_condition.question_code;
      const sectionQuestions = (section.questions || []).slice().sort((a, b) => a.order - b.order);
      const firstQ = sectionQuestions[0];
      if (questionToNodeId.has(triggerCode) && firstQ && questionToNodeId.has(firstQ.code)) {
        edges.push({
          id: `e-cond-s-${section.id}`,
          source: questionToNodeId.get(triggerCode)!,
          target: questionToNodeId.get(firstQ.code)!,
          type: 'default',
          label: `if ${triggerCode} ${section.show_condition.operator || '='}`,
          labelStyle: { fontSize: 8, fill: '#9333EA' },
          labelBgStyle: { fill: '#FAF5FF', fillOpacity: 0.95 },
          labelBgPadding: [4, 2] as [number, number],
          style: { stroke: '#9333EA', strokeWidth: 1.5, strokeDasharray: '6 3' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9333EA' },
        });
      }
    }

    (section.questions || []).forEach((question) => {
      if (question.show_condition?.question_code) {
        const triggerCode = question.show_condition.question_code;
        if (questionToNodeId.has(triggerCode)) {
          const targetId = questionToNodeId.get(question.code)!;
          const sourceId = questionToNodeId.get(triggerCode)!;
          if (sourceId !== targetId) {
            edges.push({
              id: `e-cond-q-${question.id}`,
              source: sourceId,
              target: targetId,
              type: 'default',
              label: `if ${triggerCode}`,
              labelStyle: { fontSize: 8, fill: '#9333EA' },
              labelBgStyle: { fill: '#FAF5FF', fillOpacity: 0.95 },
              labelBgPadding: [4, 2] as [number, number],
              style: { stroke: '#9333EA', strokeWidth: 1, strokeDasharray: '4 3' },
              markerEnd: { type: MarkerType.ArrowClosed, color: '#9333EA' },
            });
          }
        }
      }
    });
  });

  return { nodes, edges };
}

// ─── Detail Popup ───────────────────────────────────────────────

function QuestionPopup({ question, position, onClose, onEditQuestion, onEditChoice, onAddChoice, onDeleteChoice }: {
  question: Question;
  position: { x: number; y: number };
  onClose: () => void;
  onEditQuestion?: (question: Question) => void;
  onEditChoice?: (choice: QuestionOption, questionId: number) => void;
  onAddChoice?: (questionId: number) => void;
  onDeleteChoice?: (choiceId: number) => void;
}) {
  const choices = question.choices || [];
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as HTMLElement)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bg-white rounded-lg border shadow-lg w-[340px] max-h-[360px] overflow-y-auto"
      style={{ left: position.x, top: position.y + 8 }}
    >
      <div className="px-3 py-2 border-b flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-mono text-sm font-bold text-primary">{question.code}</p>
          <p className="text-xs text-foreground leading-snug mt-0.5">{question.question_text}</p>
          {question.show_condition && (
            <Badge variant="outline" className="text-[9px] font-mono mt-1">
              if {question.show_condition.question_code} {question.show_condition.operator} [{Array.isArray(question.show_condition.value) ? question.show_condition.value.join(', ') : question.show_condition.value}]
            </Badge>
          )}
        </div>
        {onEditQuestion && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] shrink-0"
            onClick={() => { onEditQuestion(question); onClose(); }}
          >
            Edit
          </Button>
        )}
      </div>

      {choices.length > 0 ? (
        <div className="px-3 py-2 space-y-1">
          {choices
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((choice) => (
              <div
                key={choice.id}
                className="flex items-start gap-2 rounded border px-2 py-1.5 cursor-pointer hover:bg-muted/50"
                onClick={() => { if (onEditChoice) { onEditChoice(choice, question.id); onClose(); } }}
              >
                <span className="text-xs leading-tight flex-1">{choice.label}</span>
                {choice.next_question_code && (
                  <Badge variant="outline" className="font-mono text-[9px] shrink-0 text-primary border-primary">
                    → {choice.next_question_code}
                  </Badge>
                )}
              </div>
            ))}
          {onAddChoice && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-full text-[10px] text-muted-foreground"
              onClick={() => { onAddChoice(question.id); onClose(); }}
            >
              + Tambah pilihan
            </Button>
          )}
        </div>
      ) : (
        <div className="px-3 py-3 text-center">
          <p className="text-xs text-muted-foreground">Tidak ada pilihan jawaban</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────

export function SurveyMindmap({ template, onEditQuestion, onEditChoice, onAddChoice, onEditSection, onAddQuestion, onDeleteChoice }: SurveyMindmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [showSections, setShowSections] = useState(false);

  const sections = useMemo(() =>
    (template.sections || []).slice().sort((a, b) => a.order - b.order),
    [template]
  );

  const questionMap = useMemo(() => {
    const map = new Map<number, Question>();
    (template.sections || []).forEach((s) => {
      (s.questions || []).forEach((q) => map.set(q.id, q));
    });
    return map;
  }, [template]);

  useEffect(() => {
    const { nodes: n, edges: e } = buildFlowGraph(template);
    setNodes(n);
    setEdges(e);
  }, [template, setNodes, setEdges]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    const qId = parseInt(node.id.replace('q-', ''), 10);
    const question = questionMap.get(qId);
    if (!question) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clampedX = Math.min(x, rect.width - 360);

    setSelectedQuestion(question);
    setPopupPos({ x: Math.max(0, clampedX), y });
  }, [questionMap]);

  return (
    <div ref={containerRef} className="flex-1 min-h-0 w-full bg-white relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={() => setSelectedQuestion(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'default' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#D1D5DB" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeColor="#94A3B8"
          nodeColor={(node) => (node.data as any).color || '#94A3B8'}
          maskColor="rgba(0,0,0,0.06)"
          className="!bottom-2 !right-2"
        />
        <Panel position="top-left">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold">{template.name}</h1>
            <span className="text-xs text-muted-foreground font-mono">{template.code} v{template.version}</span>
            <span className="text-xs text-muted-foreground">{template.total_questions} pertanyaan</span>
          </div>
        </Panel>

        {/* Sections panel toggle */}
        {onEditSection && (
          <Panel position="top-right">
            <Button
              variant={showSections ? 'default' : 'outline'}
              size="sm"
              className="text-xs shadow-sm"
              onClick={() => setShowSections(!showSections)}
            >
              Bagian ({sections.length})
            </Button>
          </Panel>
        )}
      </ReactFlow>

      {/* Sections panel */}
      {showSections && onEditSection && (
        <div className="absolute top-12 right-2 z-40 bg-white rounded-lg border shadow-lg w-[300px] max-h-[400px] overflow-y-auto">
          <div className="px-3 py-2 border-b">
            <p className="text-sm font-semibold">Bagian Survei</p>
          </div>
          <div className="p-2 space-y-1">
            {sections.map((section) => {
              const qCount = (section.questions || []).length;
              return (
                <div
                  key={section.id}
                  className="flex items-center gap-2 rounded-md border px-2.5 py-2 cursor-pointer hover:bg-muted/50"
                  onClick={() => { onEditSection(section); setShowSections(false); }}
                >
                  <Badge variant="secondary" className="font-mono text-[10px] shrink-0">{section.code}</Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{section.name}</p>
                    <p className="text-[10px] text-muted-foreground">{qCount} pertanyaan</p>
                  </div>
                  {section.show_condition && (
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      if {section.show_condition.question_code}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedQuestion && popupPos && (
        <QuestionPopup
          question={selectedQuestion}
          position={popupPos}
          onClose={() => setSelectedQuestion(null)}
          onEditQuestion={onEditQuestion}
          onEditChoice={onEditChoice}
          onAddChoice={onAddChoice}
          onDeleteChoice={onDeleteChoice}
        />
      )}
    </div>
  );
}
