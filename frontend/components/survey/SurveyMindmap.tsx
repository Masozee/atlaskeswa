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

import type { SurveyTemplate, Question } from '@/lib/types/survey-template';
import { Badge } from '@/components/ui/badge';

// ─── Custom Nodes ───────────────────────────────────────────────

function QuestionNode({ data }: NodeProps) {
  const d = data as {
    label: string;
    code: string;
    color: string;
    isStart: boolean;
    isEnd: boolean;
  };
  return (
    <div
      className="rounded-lg px-3 py-2 shadow-sm min-w-[120px] max-w-[200px] text-white text-[10px] font-semibold leading-tight cursor-pointer hover:brightness-110 transition-all"
      style={{ backgroundColor: d.color }}
    >
      <Handle type="target" position={Position.Left} className="!bg-white/60 !w-2.5 !h-2.5" />
      <p className="text-xs font-bold">{d.code}</p>
      <p className="font-normal opacity-90 mt-0.5">{d.label}</p>
      {d.isEnd && (
        <span className="text-[9px] opacity-70 mt-1 inline-block">Selesai</span>
      )}
      <Handle type="source" position={Position.Right} className="!bg-white/60 !w-2.5 !h-2.5" />
    </div>
  );
}

const nodeTypes = { question: QuestionNode };

// ─── Layout ─────────────────────────────────────────────────────

const X_GAP = 320;
const Y_GAP = 100;

interface SurveyMindmapProps {
  template: SurveyTemplate;
}

function buildFlowGraph(template: SurveyTemplate) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const sections = template.sections || [];

  if (sections.length === 0) return { nodes, edges };

  const allQuestions: Question[] = [];
  sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      const qs = (section.questions || []).slice().sort((a, b) => a.order - b.order);
      allQuestions.push(...qs);
    });

  if (allQuestions.length === 0) return { nodes, edges };

  const codeToQuestion = new Map<string, Question>();
  allQuestions.forEach((q) => codeToQuestion.set(q.code, q));

  // Collect edges: choice-level next_question_code takes priority, otherwise question-level skip_logic
  const flowEdges: { sourceCode: string; targetCode: string; label: string }[] = [];
  const targetCodes = new Set<string>();

  allQuestions.forEach((q) => {
    const choices = q.choices || [];
    const choiceWithNext = choices.filter((c) => c.next_question_code && codeToQuestion.has(c.next_question_code));

    if (choiceWithNext.length > 0) {
      // Use per-choice branching
      choiceWithNext.forEach((choice) => {
        flowEdges.push({
          sourceCode: q.code,
          targetCode: choice.next_question_code!,
          label: choice.label,
        });
        targetCodes.add(choice.next_question_code!);
      });
    } else if (q.skip_logic && q.skip_logic.length > 0 && q.skip_logic[0].goto) {
      // Fallback to question-level next
      const targetCode = q.skip_logic[0].goto;
      if (codeToQuestion.has(targetCode)) {
        flowEdges.push({
          sourceCode: q.code,
          targetCode,
          label: '',
        });
        targetCodes.add(targetCode);
      }
    }
  });

  if (flowEdges.length === 0) return { nodes, edges };

  // Find all questions involved in the graph
  const involvedCodes = new Set<string>();
  flowEdges.forEach((e) => {
    involvedCodes.add(e.sourceCode);
    involvedCodes.add(e.targetCode);
  });

  // BFS to assign positions (layered layout)
  // Find root nodes (sources that are not targets)
  const sourceCodes = new Set(flowEdges.map((e) => e.sourceCode));
  const rootCodes = [...sourceCodes].filter((c) => !targetCodes.has(c));
  if (rootCodes.length === 0) rootCodes.push([...sourceCodes][0]);

  // Build adjacency list
  const adj = new Map<string, string[]>();
  flowEdges.forEach((e) => {
    if (!adj.has(e.sourceCode)) adj.set(e.sourceCode, []);
    const targets = adj.get(e.sourceCode)!;
    if (!targets.includes(e.targetCode)) targets.push(e.targetCode);
  });

  // BFS for layer assignment
  const layers = new Map<string, number>();
  const queue: string[] = [];
  rootCodes.forEach((c) => { layers.set(c, 0); queue.push(c); });

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current)!;
    const neighbors = adj.get(current) || [];
    neighbors.forEach((n) => {
      if (!layers.has(n)) {
        layers.set(n, currentLayer + 1);
        queue.push(n);
      }
    });
  }

  // Group by layer for Y positioning
  const layerGroups = new Map<number, string[]>();
  layers.forEach((layer, code) => {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(code);
  });

  const PALETTE = ['#4F72E5', '#22C55E', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#00979D', '#6366F1'];
  let colorIdx = 0;
  const codeToColor = new Map<string, string>();

  // Create nodes
  layerGroups.forEach((codes, layer) => {
    const totalHeight = (codes.length - 1) * Y_GAP;
    const startY = -totalHeight / 2;

    codes.forEach((code, idx) => {
      const question = codeToQuestion.get(code)!;
      const color = codeToColor.get(code) || PALETTE[colorIdx++ % PALETTE.length];
      codeToColor.set(code, color);

      const outgoing = adj.get(code) || [];
      const isEnd = outgoing.length === 0;

      nodes.push({
        id: `q-${question.id}`,
        type: 'question',
        position: { x: layer * X_GAP, y: startY + idx * Y_GAP },
        data: {
          label: question.question_text,
          code: question.code,
          color,
          isStart: rootCodes.includes(code),
          isEnd,
        },
      });
    });
  });

  // Create edges
  const edgeColors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
  let edgeColorIdx = 0;
  const seenEdges = new Set<string>();

  flowEdges.forEach((ce) => {
    const sourceQ = codeToQuestion.get(ce.sourceCode)!;
    const targetQ = codeToQuestion.get(ce.targetCode)!;
    const edgeKey = `${sourceQ.id}-${targetQ.id}`;

    // For multiple choices going to the same target, combine labels
    if (seenEdges.has(edgeKey)) {
      if (ce.label) {
        const existing = edges.find((e) => e.id === `e-q-${edgeKey}`);
        if (existing && existing.label) {
          existing.label = (existing.label as string) + ', ' + ce.label;
        }
      }
      return;
    }
    seenEdges.add(edgeKey);

    const color = edgeColors[edgeColorIdx++ % edgeColors.length];
    const hasLabel = ce.label.length > 0;

    edges.push({
      id: `e-q-${edgeKey}`,
      source: `q-${sourceQ.id}`,
      target: `q-${targetQ.id}`,
      type: 'default',
      ...(hasLabel ? {
        label: ce.label,
        labelStyle: { fontSize: 9, fill: '#6B7280' },
        labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
        labelBgPadding: [4, 2] as [number, number],
      } : {}),
      style: { stroke: color, strokeWidth: 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color },
    });
  });

  return { nodes, edges };
}

// ─── Detail Popup ───────────────────────────────────────────────

function QuestionPopup({ question, position, onClose }: {
  question: Question;
  position: { x: number; y: number };
  onClose: () => void;
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
      className="absolute z-50 bg-white rounded-lg border shadow-lg w-[300px] max-h-[280px] overflow-y-auto"
      style={{ left: position.x, top: position.y + 8 }}
    >
      <div className="px-3 py-2 border-b">
        <p className="font-mono text-sm font-bold text-primary">{question.code}</p>
        <p className="text-xs text-foreground leading-snug mt-0.5">{question.question_text}</p>
      </div>

      {choices.length > 0 ? (
        <div className="px-3 py-2 space-y-1">
          {choices
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((choice) => (
              <div key={choice.id} className="flex items-start gap-2 rounded border px-2 py-1.5">
                <span className="text-xs leading-tight flex-1">{choice.label}</span>
                {choice.next_question_code && (
                  <Badge variant="outline" className="font-mono text-[9px] shrink-0 text-primary border-primary">
                    → {choice.next_question_code}
                  </Badge>
                )}
              </div>
            ))}
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

export function SurveyMindmap({ template }: SurveyMindmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);

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

    const clampedX = Math.min(x, rect.width - 320);

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
      </ReactFlow>

      {selectedQuestion && popupPos && (
        <QuestionPopup
          question={selectedQuestion}
          position={popupPos}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  );
}
