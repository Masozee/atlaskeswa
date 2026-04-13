"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  PaginationState,
  RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import {
  useQuestions,
  useCreateQuestion,
  useUpdateQuestion,
  useDeleteQuestion,
  useBulkDeleteQuestion,
  exportQuestions,
  useImportQuestions,
  useQuestionChoices,
  useCreateQuestionChoice,
  useUpdateQuestionChoice,
  useDeleteQuestionChoice,
  useBasicStableInputsOfCare,
  useQuestionSections,
} from "@/hooks/use-services";
import { Question, QuestionChoice } from "@/lib/types/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Add01Icon,
  MoreHorizontalIcon,
  Upload01Icon,
  Download01Icon,
  Edit04Icon,
  Delete01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  FloppyDiskIcon,
  ArrangeByLettersAZIcon,
} from "hugeicons-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const breadcrumbs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Manajemen Survei", href: "/dashboard/survey" },
  { label: "Model Kuisioner" },
];

const ANSWER_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "TEXTAREA", label: "Textarea" },
  { value: "EMAIL", label: "Email" },
  { value: "NUMBER", label: "Number" },
  { value: "INTEGER", label: "Integer" },
  { value: "DATE", label: "Date" },
  { value: "TIME", label: "Time" },
  { value: "BOOLEAN", label: "Boolean (Ya/Tidak)" },
  { value: "SINGLE_CHOICE", label: "Pilihan Tunggal" },
  { value: "MULTIPLE_CHOICE", label: "Pilihan Ganda" },
  { value: "STAFF_TABLE", label: "Tabel Staff" },
  { value: "DIAGNOSIS_TABLE", label: "Tabel Diagnosis" },
  { value: "REPEATING_TABLE", label: "Tabel Dinamis (baris berulang)" },
  { value: "INTERVENTION_MATRIX", label: "Matriks Intervensi (baris pilih + kolom detail)" },
  { value: "OPERATING_HOURS", label: "Jam Operasional" },
  { value: "GPS", label: "GPS" },
  { value: "FILE", label: "File Upload" },
];

type DialogTab = "detail" | "pilihan";
type ImportResult = { created: number; updated: number; errors: { row: number; error: string }[] };

function AnswerTypeBadge({ type }: { type: string }) {
  const choiceTypes = ["SINGLE_CHOICE", "MULTIPLE_CHOICE"];
  return (
    <Badge variant="outline" className={`text-xs whitespace-nowrap ${choiceTypes.includes(type) ? "text-primary border-primary" : "text-muted-foreground"}`}>
      {ANSWER_TYPES.find((t) => t.value === type)?.label ?? type}
    </Badge>
  );
}

// ─── Import Dialog ────────────────────────────────────────────────────────────

function ImportDialog({ open, onOpenChange, onImport, isPending, result }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  onImport: (file: File, updateExisting: boolean) => void;
  isPending: boolean; result: ImportResult | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  function handleClose(v: boolean) { if (!v) { setFile(null); setUpdateExisting(false); } onOpenChange(v); }
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Import Pertanyaan</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Upload CSV/XLSX/JSON dengan kolom: <span className="font-mono text-xs bg-muted px-1 rounded">section_id</span>, <span className="font-mono text-xs bg-muted px-1 rounded">code</span>, <span className="font-mono text-xs bg-muted px-1 rounded">question_text</span>, <span className="font-mono text-xs bg-muted px-1 rounded">answer_type</span>
          </p>
          <div className="space-y-2">
            <Label>File * <span className="text-muted-foreground font-normal">(CSV, XLSX, JSON)</span></Label>
            <div className="flex rounded-md border overflow-hidden">
              <label htmlFor="q-import-file" className="flex items-center justify-center px-4 py-1.5 text-sm font-medium hover:bg-accent transition-colors cursor-pointer whitespace-nowrap">Pilih File</label>
              <div className="w-px bg-border" />
              <span className="flex items-center px-3 py-1.5 text-sm text-muted-foreground truncate flex-1">{file ? file.name : 'Belum ada file'}</span>
              <input id="q-import-file" type="file" accept=".csv,.xlsx,.json" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="q-update-existing" checked={updateExisting} onCheckedChange={(v) => setUpdateExisting(!!v)} />
            <Label htmlFor="q-update-existing" className="text-sm font-normal cursor-pointer">Update data yang sudah ada</Label>
          </div>
          {result && (
            <div className="rounded-lg border p-3 space-y-2">
              {result.created > 0 && <p className="text-sm font-medium text-green-600">{result.created} pertanyaan dibuat.</p>}
              {result.updated > 0 && <p className="text-sm font-medium text-blue-600">{result.updated} pertanyaan diperbarui.</p>}
              {result.created === 0 && result.updated === 0 && <p className="text-sm font-medium text-muted-foreground">Tidak ada data yang diimport.</p>}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">{result.errors.length} baris dilewati:</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((e, i) => <li key={i}>Baris {e.row}: {e.error}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{result ? 'Tutup' : 'Batal'}</Button>
          {!result && <Button onClick={() => file && onImport(file, updateExisting)} disabled={!file || isPending}>{isPending ? 'Mengimport...' : 'Import'}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Inline Choices Panel ─────────────────────────────────────────────────────

function ChoicesPanel({ questionId, allQuestions = [] }: { questionId: number; allQuestions?: Question[] }) {
  const { data: choices = [], isLoading } = useQuestionChoices(questionId);
  const { data: mtcList = [] } = useBasicStableInputsOfCare();
  const createChoice = useCreateQuestionChoice();
  const updateChoice = useUpdateQuestionChoice();
  const deleteChoice = useDeleteQuestionChoice();

  const emptyForm = { value: "", label: "", keterangan: "", order: 0, next_question_code: "", mtc_code: "", has_other_input: false, other_input_label: "Sebutkan", cabang_mtc: "", kode_desde_ltc: "" };
  const [addForm, setAddForm] = useState(emptyForm);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  function startEdit(c: QuestionChoice) {
    setEditId(c.id);
    setEditForm({ value: c.value, label: c.label, keterangan: c.keterangan ?? "", order: c.order, next_question_code: c.next_question_code ?? "", mtc_code: c.mtc_code ? String(c.mtc_code) : "", has_other_input: c.has_other_input ?? false, other_input_label: c.other_input_label ?? "Sebutkan", cabang_mtc: c.cabang_mtc ?? "", kode_desde_ltc: c.kode_desde_ltc ?? "" });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    await createChoice.mutateAsync({ question: questionId, value: addForm.value, label: addForm.label, order: addForm.order || choices.length + 1, next_question_code: addForm.next_question_code, mtc_code: addForm.mtc_code ? Number(addForm.mtc_code) : undefined, has_other_input: addForm.has_other_input, other_input_label: addForm.has_other_input ? addForm.other_input_label : "", cabang_mtc: addForm.cabang_mtc, kode_desde_ltc: addForm.kode_desde_ltc });
    setAddForm(emptyForm);
    setAddOpen(false);
  }

  async function handleEditSave(choiceId: number) {
    await updateChoice.mutateAsync({ id: choiceId, question: questionId, value: editForm.value, label: editForm.label, order: editForm.order, next_question_code: editForm.next_question_code, mtc_code: editForm.mtc_code ? Number(editForm.mtc_code) : undefined, has_other_input: editForm.has_other_input, other_input_label: editForm.has_other_input ? editForm.other_input_label : "", cabang_mtc: editForm.cabang_mtc, kode_desde_ltc: editForm.kode_desde_ltc });
    setEditId(null);
  }

  if (isLoading) return <div className="flex items-center justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setAddOpen((v) => !v)}>
          <Add01Icon className="w-4 h-4 mr-2" />{addOpen ? "Batal" : "Tambah Pilihan"}
        </Button>
      </div>

      {/* Inline add form */}
      {addOpen && (
        <form onSubmit={handleAdd} className="rounded-lg border bg-muted/30 p-3 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pilihan Baru</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1"><Label className="text-xs">Nilai *</Label><Input value={addForm.value} onChange={(e) => setAddForm((f) => ({ ...f, value: e.target.value }))} placeholder="e.g. YA" className="h-8 text-sm" required /></div>
            <div className="col-span-2 space-y-1"><Label className="text-xs">Label *</Label><Input value={addForm.label} onChange={(e) => setAddForm((f) => ({ ...f, label: e.target.value }))} placeholder="Teks pilihan" className="h-8 text-sm" required /></div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kode MTC</Label>
            <select value={addForm.mtc_code} onChange={(e) => setAddForm((f) => ({ ...f, mtc_code: e.target.value }))} className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-background h-8">
              <option value="">— Tidak ada —</option>
              {mtcList.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Cabang MTC</Label><Input value={addForm.cabang_mtc} onChange={(e) => setAddForm((f) => ({ ...f, cabang_mtc: e.target.value }))} placeholder="e.g. Rumah Sakit" className="h-8 text-sm" maxLength={50} /></div>
            <div className="space-y-1"><Label className="text-xs">Kode DESDE-LTC</Label><Input value={addForm.kode_desde_ltc} onChange={(e) => setAddForm((f) => ({ ...f, kode_desde_ltc: e.target.value }))} placeholder="e.g. R.1.1.3" className="h-8 text-sm" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs">Lanjut ke</Label><select value={addForm.next_question_code} onChange={(e) => setAddForm((f) => ({ ...f, next_question_code: e.target.value }))} className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring bg-background h-8"><option value="">— Tidak ada —</option>{allQuestions.map((q) => <option key={q.id} value={q.code}>{q.code} — {q.question_text.slice(0, 30)}{q.question_text.length > 30 ? '...' : ''}</option>)}</select></div>
            <div className="space-y-1"><Label className="text-xs">Urutan</Label><Input type="number" value={addForm.order || ''} onChange={(e) => setAddForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} placeholder={String(choices.length + 1)} className="h-8 text-sm" /></div>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="add-has-other" checked={addForm.has_other_input} onCheckedChange={(checked) => setAddForm((f) => ({ ...f, has_other_input: !!checked }))} />
            <Label htmlFor="add-has-other" className="text-xs cursor-pointer">Butuh input tambahan</Label>
            {addForm.has_other_input && (
              <Input value={addForm.other_input_label} onChange={(e) => setAddForm((f) => ({ ...f, other_input_label: e.target.value }))} placeholder="Label input (e.g. Sebutkan)" className="h-8 text-sm flex-1" />
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAddOpen(false); setAddForm(emptyForm); }}>Batal</Button>
            <Button type="submit" size="sm" disabled={createChoice.isPending}>{createChoice.isPending ? "Menyimpan..." : "Tambah"}</Button>
          </div>
        </form>
      )}

      {/* Choices list */}
      {choices.length === 0 && !addOpen ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Belum ada pilihan jawaban. Klik "Tambah Pilihan" untuk menambahkan.
        </div>
      ) : choices.length > 0 ? (
        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead className="w-24">Nilai</TableHead>
                <TableHead>Label</TableHead>
                <TableHead className="w-36">Cabang MTC</TableHead>
                <TableHead className="w-28">DESDE-LTC</TableHead>
                <TableHead className="w-48">Kode MTC</TableHead>
                <TableHead className="w-28">Lanjut ke</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {choices.map((c) =>
                editId === c.id ? (
                  // Inline edit row
                  <TableRow key={c.id} className="bg-muted/30">
                    <TableCell className="text-center">
                      <Input type="number" value={editForm.order} onChange={(e) => setEditForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} className="h-7 w-14 text-xs p-1 text-center" />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.value} onChange={(e) => setEditForm((f) => ({ ...f, value: e.target.value }))} className="h-7 text-xs p-1" />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.label} onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))} className="h-7 text-xs p-1" />
                      <div className="flex items-center gap-2 mt-1">
                        <Checkbox id={`edit-other-${c.id}`} checked={editForm.has_other_input} onCheckedChange={(checked) => setEditForm((f) => ({ ...f, has_other_input: !!checked }))} className="h-3.5 w-3.5" />
                        <label htmlFor={`edit-other-${c.id}`} className="text-[10px] text-muted-foreground cursor-pointer">+ Input</label>
                        {editForm.has_other_input && <Input value={editForm.other_input_label} onChange={(e) => setEditForm((f) => ({ ...f, other_input_label: e.target.value }))} placeholder="Label" className="h-6 text-[10px] p-1 flex-1" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.cabang_mtc} onChange={(e) => setEditForm((f) => ({ ...f, cabang_mtc: e.target.value }))} className="h-7 text-xs p-1" maxLength={50} placeholder="Cabang MTC" />
                    </TableCell>
                    <TableCell>
                      <Input value={editForm.kode_desde_ltc} onChange={(e) => setEditForm((f) => ({ ...f, kode_desde_ltc: e.target.value }))} className="h-7 text-xs p-1" placeholder="R.1.1.3" />
                    </TableCell>
                    <TableCell>
                      <select value={editForm.mtc_code} onChange={(e) => setEditForm((f) => ({ ...f, mtc_code: e.target.value }))} className="w-full rounded border px-1 py-0.5 text-xs bg-background outline-none focus:ring-1 focus:ring-ring">
                        <option value="">—</option>
                        {mtcList.map((m) => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
                      </select>
                    </TableCell>
                    <TableCell>
                      <select value={editForm.next_question_code} onChange={(e) => setEditForm((f) => ({ ...f, next_question_code: e.target.value }))} className="w-full rounded border px-1 py-0.5 text-xs bg-background outline-none focus:ring-1 focus:ring-ring"><option value="">—</option>{allQuestions.map((q) => <option key={q.id} value={q.code}>{q.code} — {q.question_text.slice(0, 25)}{q.question_text.length > 25 ? '...' : ''}</option>)}</select>
                    </TableCell>
                    <TableCell>
                      <div className="flex rounded-md border overflow-hidden">
                        <button onClick={() => handleEditSave(c.id)} disabled={updateChoice.isPending} className="flex items-center justify-center w-8 py-1.5 hover:bg-accent transition-colors border-r disabled:opacity-50">
                          <FloppyDiskIcon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditId(null)} className="flex items-center justify-center w-8 py-1.5 text-muted-foreground hover:bg-accent transition-colors">
                          <Cancel01Icon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Normal row
                  <TableRow key={c.id}>
                    <TableCell className="text-center text-sm text-muted-foreground">{c.order}</TableCell>
                    <TableCell><span className="font-mono text-sm font-medium">{c.value}</span></TableCell>
                    <TableCell><div className="text-sm whitespace-normal break-words">{c.label}{c.has_other_input && <Badge variant="outline" className="text-[10px] ml-1.5 align-middle">+ Input{c.other_input_label ? `: ${c.other_input_label}` : ''}</Badge>}</div></TableCell>
                    <TableCell>{c.cabang_mtc ? <span className="text-xs">{c.cabang_mtc}</span> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                    <TableCell>{c.kode_desde_ltc ? <span className="font-mono text-xs">{c.kode_desde_ltc}</span> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      {c.mtc_code_display
                        ? <span className="text-xs whitespace-normal break-words">{c.mtc_code_display}</span>
                        : <span className="text-xs text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell>{c.next_question_code ? <span className="font-mono text-xs">{c.next_question_code}</span> : <span className="text-xs text-muted-foreground">-</span>}</TableCell>
                    <TableCell>
                      <div className="flex rounded-md border overflow-hidden">
                        <button onClick={() => startEdit(c)} className="flex items-center justify-center w-8 py-1.5 hover:bg-accent transition-colors border-r">
                          <Edit04Icon className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteChoice.mutateAsync({ id: c.id, questionId })} className="flex items-center justify-center w-8 py-1.5 text-destructive hover:bg-destructive/10 transition-colors">
                          <Delete01Icon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}

// ─── Question Dialog (tabbed) ─────────────────────────────────────────────────

function QuestionDialog({ open, onOpenChange, editTarget, onSubmit, isPending, allQuestions }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  editTarget: Question | null;
  onSubmit: (data: Partial<Question>) => void;
  isPending: boolean;
  allQuestions: Question[];
}) {
  const [activeTab, setActiveTab] = useState<DialogTab>("detail");
  const [form, setForm] = useState({ section: 0, code: "", question_text: "", answer_type: "TEXT", is_required: true, order: 1, desde_ltc_description: "", introduction_text: "", keterangan: "", skip_logic: null as any });

  const { data: sections = [] } = useQuestionSections();

  useMemo(() => {
    setActiveTab("detail");
    if (editTarget) {
      setForm({ section: editTarget.section, code: editTarget.code, question_text: editTarget.question_text, answer_type: editTarget.answer_type, is_required: editTarget.is_required, order: editTarget.order, desde_ltc_description: editTarget.desde_ltc_description ?? "", introduction_text: editTarget.introduction_text ?? "", keterangan: editTarget.keterangan ?? "", skip_logic: editTarget.skip_logic ?? null });
    } else {
      setForm({ section: sections[0]?.id || 0, code: "", question_text: "", answer_type: "TEXT", is_required: true, order: 1, desde_ltc_description: "", introduction_text: "", keterangan: "", skip_logic: null });
    }
  }, [editTarget, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editTarget ? `Edit Pertanyaan — ${editTarget.code}` : "Tambah Pertanyaan"}</DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 border-b -mt-1">
          {[
            { key: "detail" as DialogTab, label: "Detail Pertanyaan" },
            { key: "pilihan" as DialogTab, label: "Pilihan Jawaban", disabled: !editTarget || !["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(form.answer_type) },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              disabled={tab.disabled}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.key === "pilihan" && !editTarget && (
                <span className="ml-1.5 text-xs text-muted-foreground font-normal">(simpan dulu)</span>
              )}
            </button>
          ))}
        </div>

        {/* Detail tab */}
        {activeTab === "detail" && (
          <form id="question-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="q-section">Section *</Label>
              <select
                id="q-section"
                value={form.section || ""}
                onChange={(e) => setForm((f) => ({ ...f, section: parseInt(e.target.value) || 0 }))}
                className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
                required
              >
                <option value="" disabled>— Pilih Section —</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="q-code">Kode *</Label><Input id="q-code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. Q1, QL1, RQA" required /></div>
              <div className="space-y-2"><Label htmlFor="q-order">Urutan</Label><Input id="q-order" type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="q-text">Teks Pertanyaan *</Label><Textarea id="q-text" value={form.question_text} onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))} placeholder="Teks pertanyaan lengkap" rows={3} required /></div>
            <div className="space-y-2"><Label htmlFor="q-intro">Teks Pengantar</Label><Textarea id="q-intro" value={form.introduction_text} onChange={(e) => setForm((f) => ({ ...f, introduction_text: e.target.value }))} placeholder="Teks kontekstual yang ditampilkan di atas pertanyaan ini" rows={3} /><p className="text-[10px] text-muted-foreground">Teks ini akan muncul sebagai kotak kuning sebelum pertanyaan.</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="q-type">Tipe Jawaban *</Label>
                <select id="q-type" value={form.answer_type} onChange={(e) => { setForm((f) => ({ ...f, answer_type: e.target.value })); if (!["SINGLE_CHOICE", "MULTIPLE_CHOICE"].includes(e.target.value)) setActiveTab("detail"); }} className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                  {ANSWER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="space-y-2 flex flex-col justify-end">
                <div className="flex items-center gap-2 pb-2">
                  <Checkbox id="q-required" checked={form.is_required} onCheckedChange={(v) => setForm((f) => ({ ...f, is_required: !!v }))} />
                  <Label htmlFor="q-required" className="text-sm font-normal cursor-pointer">Wajib diisi</Label>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label htmlFor="q-desde">Deskripsi DESDE-LTC</Label><Input id="q-desde" value={form.desde_ltc_description} onChange={(e) => setForm((f) => ({ ...f, desde_ltc_description: e.target.value }))} placeholder="Panduan klasifikasi DESDE-LTC" /></div>
              <div className="space-y-2">
                <Label htmlFor="q-next">Pertanyaan Selanjutnya</Label>
                <select
                  id="q-next"
                  value={form.skip_logic?.[0]?.goto ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => ({ ...f, skip_logic: val ? [{ value: "_next", goto: val }] : null }));
                  }}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background"
                >
                  <option value="">— Tidak ada —</option>
                  {allQuestions.filter((q) => q.code !== form.code).map((q) => (
                    <option key={q.id} value={q.code}>{q.code} — {q.question_text.slice(0, 35)}{q.question_text.length > 35 ? '...' : ''}</option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">Default untuk semua jawaban. Bisa di-override per pilihan.</p>
              </div>
            </div>
          </form>
        )}

        {/* Pilihan Jawaban tab */}
        {activeTab === "pilihan" && editTarget && (
          <div className="pt-1">
            <ChoicesPanel questionId={editTarget.id} allQuestions={allQuestions} />
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {activeTab === "pilihan" ? "Tutup" : "Batal"}
          </Button>
          {activeTab === "detail" && (
            <Button type="submit" form="question-form" disabled={isPending}>
              {isPending ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Tambah Pertanyaan"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Questions Table ──────────────────────────────────────────────────────────

function QuestionsTable({ questions, showMtc, onEdit, onDelete, onView }: {
  questions: Question[]; showMtc: boolean;
  onEdit: (q: Question) => void; onDelete: (q: Question) => void; onView: (q: Question) => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortAZ, setSortAZ] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [filterRequired, setFilterRequired] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState<PaginationState>(() => ({
    pageIndex: Math.max(0, (Number(searchParams.get("page")) || 1) - 1),
    pageSize: Number(searchParams.get("size")) || 10,
  }));
  const [jumpPage, setJumpPage] = useState("");
  const isFirstRender = useRef(true);

  // Sync page to URL
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(pagination.pageIndex + 1));
    params.set("size", String(pagination.pageSize));
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [pagination.pageIndex, pagination.pageSize]);
  const bulkDelete = useBulkDeleteQuestion();

  const filtered = useMemo(() => {
    let result = [...questions];
    if (filterType !== "ALL") result = result.filter((q) => q.answer_type === filterType);
    if (filterRequired === "YES") result = result.filter((q) => q.is_required);
    if (filterRequired === "NO") result = result.filter((q) => !q.is_required);
    if (sortAZ) result = result.sort((a, b) => a.code.localeCompare(b.code));
    return result;
  }, [questions, filterType, filterRequired, sortAZ]);

  const columns = useMemo<ColumnDef<Question, any>[]>(() => {
    const cols: ColumnDef<Question, any>[] = [
      {
        id: "select",
        header: ({ table }) => <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />,
        cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />,
        enableSorting: false, enableGlobalFilter: false,
      },
      { accessorKey: "code", header: "Kode", cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onView(row.original)}
          className="font-mono font-semibold text-sm whitespace-nowrap text-primary underline-offset-2 hover:underline cursor-pointer"
        >
          {row.getValue("code")}
        </button>
      )},
      { accessorKey: "order", header: "Urutan", cell: ({ row }) => <span className="text-xs text-muted-foreground font-mono">{row.getValue("order")}</span> },
      { accessorKey: "question_text", header: "Pertanyaan", cell: ({ row }) => <div className="max-w-sm whitespace-normal break-words text-sm">{row.getValue("question_text")}</div> },
      { accessorKey: "answer_type", header: "Tipe", cell: ({ row }) => <AnswerTypeBadge type={row.getValue("answer_type")} /> },
      { accessorKey: "is_required", header: "Wajib", cell: ({ row }) => row.getValue("is_required") ? <Badge variant="outline" className="text-xs text-primary border-primary">Ya</Badge> : <Badge variant="outline" className="text-xs text-muted-foreground">Tidak</Badge> },
      { id: "next_question", header: "Selanjutnya", cell: ({ row }) => {
        const sl = row.original.skip_logic;
        return sl && sl.length > 0
          ? <Badge variant="outline" className="font-mono text-xs text-primary border-primary">{sl[0].goto}</Badge>
          : <span className="text-xs text-muted-foreground">-</span>;
      }},
    ];
    if (showMtc) {
      cols.push({
        accessorKey: "mtc_code_display", header: "Kode MTC",
        cell: ({ row }) => { const v = row.getValue("mtc_code_display") as string | undefined; return v ? <Badge variant="outline" className="font-mono text-xs">{v}</Badge> : <span className="text-muted-foreground text-xs">-</span>; },
      });
    }
    // Show choices count
    cols.push({
      id: "choices_count", header: "Pilihan",
      cell: ({ row }) => {
        const c = row.original.choices;
        return c && c.length > 0 ? <Badge variant="outline" className="text-xs text-muted-foreground">{c.length} pilihan</Badge> : <span className="text-xs text-muted-foreground">-</span>;
      },
    });
    cols.push({
      id: "actions", header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0"><MoreHorizontalIcon className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}><Edit04Icon className="mr-2 h-4 w-4" />Edit & Pilihan</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(row.original)}><Delete01Icon className="mr-2 h-4 w-4" />Hapus</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
    return cols;
  }, [showMtc, onEdit, onDelete, onView]);

  const table = useReactTable({
    data: filtered, columns,
    getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting, onRowSelectionChange: setRowSelection, onPaginationChange: setPagination,
    state: { sorting, globalFilter: search, rowSelection, pagination },
    onGlobalFilterChange: (v) => { setSearch(v); setPagination((p) => ({ ...p, pageIndex: 0 })); },
    enableRowSelection: true,
    autoResetPageIndex: false,
  });

  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);
  const selectedCount = selectedIds.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        {/* Left: search + sort */}
        <div className="flex items-center gap-2">
          <Input placeholder="Cari kode atau teks pertanyaan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-72" />
          <Button
            variant={sortAZ ? "default" : "outline"}
            size="sm"
            className="!h-9 px-3"
            onClick={() => setSortAZ((v) => !v)}
            title="Urutkan A–Z"
          >
            <ArrangeByLettersAZIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Right: grouped filters */}
        <div className="flex rounded-md border overflow-hidden">
          <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
            <SelectTrigger className="!h-9 w-44 rounded-none border-0 border-r focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {ANSWER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRequired} onValueChange={(v) => { setFilterRequired(v); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
            <SelectTrigger className="!h-9 w-36 rounded-none border-0 focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua</SelectItem>
              <SelectItem value="YES">Wajib</SelectItem>
              <SelectItem value="NO">Opsional</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/50 px-4 py-2">
          <span className="text-sm font-medium">{selectedCount} dipilih</span>
          <Separator orientation="vertical" className="h-4" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download01Icon className="w-4 h-4 mr-2" />Export Pilihan</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportQuestions(selectedIds, 'csv').then(() => toast.success('Export CSV berhasil')).catch((e) => toast.error(e.message))}>Export sebagai CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportQuestions(selectedIds, 'xlsx').then(() => toast.success('Export XLSX berhasil')).catch((e) => toast.error(e.message))}>Export sebagai XLSX</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportQuestions(selectedIds, 'json').then(() => toast.success('Export JSON berhasil')).catch((e) => toast.error(e.message))}>Export sebagai JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="destructive" size="sm" onClick={async () => { await bulkDelete.mutateAsync(selectedIds); setRowSelection({}); }} disabled={bulkDelete.isPending}>
            <Delete01Icon className="w-4 h-4 mr-2" />{bulkDelete.isPending ? 'Menghapus...' : 'Hapus Pilihan'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setRowSelection({})}>Batal</Button>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>{hg.headers.map((h) => <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>{row.getVisibleCells().map((cell) => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">Belum ada pertanyaan.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {(() => {
        const pageCount = table.getPageCount() || 1;
        const currentPage = pagination.pageIndex;
        const totalRows = table.getFilteredRowModel().rows.length;

        // Build page number buttons: first, ..., window around current, ..., last
        const buildPages = () => {
          const pages: (number | "...")[] = [];
          if (pageCount <= 7) {
            for (let i = 0; i < pageCount; i++) pages.push(i);
          } else {
            pages.push(0);
            if (currentPage > 2) pages.push("...");
            for (let i = Math.max(1, currentPage - 1); i <= Math.min(pageCount - 2, currentPage + 1); i++) pages.push(i);
            if (currentPage < pageCount - 3) pages.push("...");
            pages.push(pageCount - 1);
          }
          return pages;
        };

        return (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                {totalRows > 0
                  ? `Menampilkan ${currentPage * pagination.pageSize + 1}–${Math.min((currentPage + 1) * pagination.pageSize, totalRows)} dari ${totalRows}`
                  : "Tidak ada hasil"}
              </p>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                value={pagination.pageSize}
                onChange={(e) => setPagination((p) => ({ ...p, pageIndex: 0, pageSize: Number(e.target.value) }))}
              >
                {[10, 25, 50, 100].map((s) => <option key={s} value={s}>{s} / hal</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} title="Halaman pertama">
                <ArrowLeft01Icon className="h-3.5 w-3.5" />
                <ArrowLeft01Icon className="h-3.5 w-3.5 -ml-2" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ArrowLeft01Icon className="h-4 w-4" />
              </Button>
              {buildPages().map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground select-none">…</span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => table.setPageIndex(p as number)}
                  >
                    {(p as number) + 1}
                  </Button>
                )
              )}
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                <ArrowRight01Icon className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()} title="Halaman terakhir">
                <ArrowRight01Icon className="h-3.5 w-3.5" />
                <ArrowRight01Icon className="h-3.5 w-3.5 -ml-2" />
              </Button>
              <div className="flex items-center gap-1 ml-2">
                <span className="text-sm text-muted-foreground">Ke hal</span>
                <Input
                  className="h-8 w-14 text-center"
                  value={jumpPage}
                  onChange={(e) => setJumpPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const p = Math.max(1, Math.min(pageCount, Number(jumpPage))) - 1;
                      if (!isNaN(p)) { table.setPageIndex(p); setJumpPage(""); }
                    }
                  }}
                  placeholder={String(currentPage + 1)}
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Question Drawer ──────────────────────────────────────────────────────────

function QuestionDrawer({ question, open, onOpenChange, onSave, allQuestions = [] }: {
  question: Question | null; open: boolean;
  onOpenChange: (v: boolean) => void; onSave: (id: number, data: Partial<Question>) => Promise<void>;
  allQuestions?: Question[];
}) {
  const choiceTypes = ["SINGLE_CHOICE", "MULTIPLE_CHOICE"];
  const hasChoices = question && choiceTypes.includes(question?.answer_type);
  const { data: sections = [] } = useQuestionSections();
  const [form, setForm] = useState({ section: 0, code: "", question_text: "", answer_type: "TEXT", is_required: true, order: 1, desde_ltc_description: "", introduction_text: "", keterangan: "", skip_logic: null as any });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (question) {
      setForm({ section: question.section, code: question.code, question_text: question.question_text, answer_type: question.answer_type, is_required: question.is_required, order: question.order, desde_ltc_description: question.desde_ltc_description ?? "", introduction_text: question.introduction_text ?? "", keterangan: question.keterangan ?? "", skip_logic: question.skip_logic ?? null });
    }
  }, [question]);

  async function handleSave() {
    if (!question) return;
    setSaving(true);
    try {
      await onSave(question.id, form);
      toast.success("Pertanyaan berhasil disimpan");
    } catch { toast.error("Gagal menyimpan"); }
    finally { setSaving(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-4xl w-full flex flex-col gap-0 p-0 overflow-hidden">
        {question && (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b">
              <div className="flex items-start gap-3 pr-6">
                <span className="font-mono text-2xl font-bold text-primary leading-none">{question.code}</span>
                <AnswerTypeBadge type={form.answer_type} />
              </div>
              <SheetTitle className="text-base font-normal text-foreground leading-snug mt-1">
                {form.question_text || question.question_text}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* ── Informasi Dasar ── */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Informasi Dasar</p>
                <p className="text-xs text-muted-foreground mb-3">Section, kode pertanyaan, urutan, dan tipe jawaban.</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Section *</Label>
                      <select value={form.section || ""} onChange={(e) => setForm((f) => ({ ...f, section: parseInt(e.target.value) || 0 }))} className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background" required>
                        <option value="" disabled>— Pilih Section —</option>
                        {sections.map((s) => <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2"><Label className="text-xs">Kode *</Label><Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. Q1, QL1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label className="text-xs">Urutan</Label><Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 1 }))} /></div>
                    <div className="space-y-2">
                      <Label className="text-xs">Tipe Jawaban *</Label>
                      <select value={form.answer_type} onChange={(e) => setForm((f) => ({ ...f, answer_type: e.target.value }))} className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                        {ANSWER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Konten Pertanyaan ── */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Konten Pertanyaan</p>
                <p className="text-xs text-muted-foreground mb-3">Teks pertanyaan dan keterangan untuk enumerator.</p>
                <div className="space-y-3">
                  <div className="space-y-2"><Label className="text-xs">Teks Pertanyaan *</Label><Textarea value={form.question_text} onChange={(e) => setForm((f) => ({ ...f, question_text: e.target.value }))} rows={3} /></div>
                  <div className="space-y-2"><Label className="text-xs">Teks Pengantar</Label><Textarea value={form.introduction_text} onChange={(e) => setForm((f) => ({ ...f, introduction_text: e.target.value }))} rows={3} placeholder="Teks kontekstual yang ditampilkan di atas pertanyaan ini" /><p className="text-[10px] text-muted-foreground">Teks ini akan muncul sebagai kotak kuning sebelum pertanyaan.</p></div>
                  <div className="space-y-2"><Label className="text-xs">Keterangan</Label><Textarea value={form.keterangan} onChange={(e) => setForm((f) => ({ ...f, keterangan: e.target.value }))} rows={2} placeholder="Petunjuk pengisian untuk enumerator" /></div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="drawer-required" checked={form.is_required} onCheckedChange={(v) => setForm((f) => ({ ...f, is_required: !!v }))} />
                    <Label htmlFor="drawer-required" className="text-sm font-normal cursor-pointer">Wajib diisi</Label>
                  </div>
                </div>
              </div>

              {/* ── Klasifikasi & Navigasi ── */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Klasifikasi & Navigasi</p>
                <p className="text-xs text-muted-foreground mb-3">Deskripsi DESDE-LTC dan logika lompat pertanyaan.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label className="text-xs">Deskripsi DESDE-LTC</Label><Input value={form.desde_ltc_description} onChange={(e) => setForm((f) => ({ ...f, desde_ltc_description: e.target.value }))} placeholder="Panduan klasifikasi" /></div>
                  <div className="space-y-2">
                    <Label className="text-xs">Pertanyaan Selanjutnya</Label>
                    <select value={form.skip_logic?.[0]?.goto ?? ""} onChange={(e) => { const val = e.target.value; setForm((f) => ({ ...f, skip_logic: val ? [{ value: "_next", goto: val }] : null })); }} className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring bg-background">
                      <option value="">— Tidak ada —</option>
                      {allQuestions.filter((q) => q.code !== form.code).map((q) => <option key={q.id} value={q.code}>{q.code} — {q.question_text.slice(0, 30)}{q.question_text.length > 30 ? '...' : ''}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Pilihan Jawaban ── */}
              {hasChoices && (
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Pilihan Jawaban</p>
                  <p className="text-xs text-muted-foreground mb-3">Kelola opsi jawaban untuk pertanyaan pilihan tunggal/ganda.</p>
                  <ChoicesPanel questionId={question.id} allQuestions={allQuestions} />
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4">
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ModelKuisionerPage() {
  const [activeTab, setActiveTab] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Question | null>(null);
  const [drawerTarget, setDrawerTarget] = useState<Question | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: allQuestions = [], isLoading, error } = useQuestions();
  const { data: allSections = [] } = useQuestionSections();
  const createQuestion = useCreateQuestion();
  const updateQuestion = useUpdateQuestion();
  const deleteQuestion = useDeleteQuestion();
  const importQuestions = useImportQuestions();

  // Build section tabs from the sections API, with question counts
  const sectionTabs = useMemo(() => {
    const questionsBySection = new Map<number, Question[]>();
    for (const q of allQuestions) {
      const list = questionsBySection.get(q.section) || [];
      list.push(q);
      questionsBySection.set(q.section, list);
    }
    return allSections.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      questions: questionsBySection.get(s.id) || [],
    }));
  }, [allQuestions, allSections]);

  // Set active tab to first section once data is loaded
  useEffect(() => {
    if (activeTab === null && sectionTabs.length > 0) {
      setActiveTab(sectionTabs[0].id);
    }
  }, [sectionTabs, activeTab]);

  const activeSection = sectionTabs.find((s) => s.id === activeTab);
  const activeQuestions = activeSection?.questions || [];

  const handleDelete = useCallback((q: Question) => { deleteQuestion.mutate(q.id); }, [deleteQuestion]);

  async function handleSubmit(data: Partial<Question>) {
    if (editTarget) await updateQuestion.mutateAsync({ id: editTarget.id, ...data });
    else await createQuestion.mutateAsync(data);
    setDialogOpen(false);
  }

  if (error) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <p className="text-destructive">Gagal memuat data pertanyaan: {error.message}</p>
          <button className="text-sm underline text-muted-foreground" onClick={() => window.location.reload()}>Coba lagi</button>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={breadcrumbs} />
        <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      </>
    );
  }

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        {/* Header */}
        <div className="border-b pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Model Kuisioner</h1>
            <p className="text-muted-foreground">Kelola pertanyaan dan jawaban kuisioner DESDE-LTC</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-md border overflow-hidden">
              <button onClick={() => { setImportResult(null); setImportOpen(true); }} className="flex items-center justify-center gap-2 w-28 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
                <Upload01Icon className="w-4 h-4" />Import
              </button>
              <div className="w-px bg-border" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center gap-2 w-32 py-1.5 text-sm font-medium hover:bg-accent transition-colors">
                    <Download01Icon className="w-4 h-4" />Export All
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportQuestions(undefined, 'csv').then(() => toast.success('Export CSV berhasil')).catch((e) => toast.error(e.message))}>Export sebagai CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportQuestions(undefined, 'xlsx').then(() => toast.success('Export XLSX berhasil')).catch((e) => toast.error(e.message))}>Export sebagai XLSX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportQuestions(undefined, 'json').then(() => toast.success('Export JSON berhasil')).catch((e) => toast.error(e.message))}>Export sebagai JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button size="sm" onClick={() => { setEditTarget(null); setDialogOpen(true); }}>
              <Add01Icon className="w-4 h-4 mr-2" />Tambah Pertanyaan
            </Button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              {tab.name}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-normal ${activeTab === tab.id ? "bg-white/20" : "bg-background"}`}>{tab.questions.length}</span>
            </button>
          ))}
        </div>

        <QuestionsTable
          key={activeTab ?? 0}
          questions={activeQuestions}
          showMtc={true}
          onEdit={(q) => { setEditTarget(q); setDialogOpen(true); }}
          onDelete={handleDelete}
          onView={(q) => { setDrawerTarget(q); setDrawerOpen(true); }}
        />
      </div>

      <QuestionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editTarget={editTarget}
        onSubmit={handleSubmit}
        isPending={createQuestion.isPending || updateQuestion.isPending}
        allQuestions={allQuestions}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        result={importResult}
        isPending={importQuestions.isPending}
        onImport={async (file, updateExisting) => {
          try {
            const r = await importQuestions.mutateAsync({ file, updateExisting });
            setImportResult(r);
            if (r.created > 0 || r.updated > 0) toast.success(`Import berhasil: ${r.created} dibuat, ${r.updated} diperbarui`);
          } catch (e: unknown) {
            toast.error(e instanceof Error ? e.message : 'Import gagal');
          }
        }}
      />

      <QuestionDrawer
        question={drawerTarget}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={async (id, data) => { await updateQuestion.mutateAsync({ id, ...data }); }}
        allQuestions={allQuestions}
      />
    </>
  );
}
