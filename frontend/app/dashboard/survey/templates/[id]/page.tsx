'use client';

import { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useSurveyTemplate } from '@/hooks/use-survey-templates';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Tick01Icon,
  Add01Icon,
} from 'hugeicons-react';
import type { Question, QuestionOption, QuestionSection, QuestionType } from '@/lib/types/survey-template';
import { SurveyMindmap } from '@/components/survey/SurveyMindmap';
import { SurveyFlowTimeline } from '@/components/survey/SurveyFlowTimeline';

const ANSWER_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'TEXT', label: 'Teks' },
  { value: 'TEXTAREA', label: 'Teks Panjang' },
  { value: 'NUMBER', label: 'Angka' },
  { value: 'INTEGER', label: 'Bilangan Bulat' },
  { value: 'DATE', label: 'Tanggal' },
  { value: 'TIME', label: 'Waktu' },
  { value: 'BOOLEAN', label: 'Ya/Tidak' },
  { value: 'SINGLE_CHOICE', label: 'Pilihan Tunggal' },
  { value: 'MULTIPLE_CHOICE', label: 'Pilihan Ganda' },
  { value: 'GEO_PROVINSI', label: 'Pilih Provinsi' },
  { value: 'GEO_KABUPATEN', label: 'Pilih Kabupaten/Kota' },
  { value: 'GEO_KECAMATAN', label: 'Pilih Kecamatan' },
  { value: 'GEO_DESA', label: 'Pilih Desa/Kelurahan' },
  { value: 'GEO_FULL', label: 'Alamat Lengkap' },
  { value: 'COVERAGE_LEVEL', label: 'Tingkat Cakupan' },
  { value: 'PHONE', label: 'Nomor Telepon' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'URL', label: 'Website' },
  { value: 'FILE', label: 'Upload File' },
  { value: 'GPS', label: 'Koordinat GPS' },
  { value: 'STAFF_TABLE', label: 'Tabel Data Staf' },
  { value: 'DIAGNOSIS_TABLE', label: 'Tabel Diagnosis' },
  { value: 'REPEATING_TABLE', label: 'Tabel Dinamis (baris berulang)' },
  { value: 'INTERVENTION_MATRIX', label: 'Matriks Intervensi (baris pilih + kolom detail)' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Sama dengan (equals)' },
  { value: 'not_equals', label: 'Tidak sama (not_equals)' },
  { value: 'in', label: 'Termasuk dalam (in)' },
  { value: 'not_in', label: 'Tidak termasuk (not_in)' },
  { value: 'contains', label: 'Mengandung (contains)' },
];

// ─── ShowCondition Editor ────────────────────────────────────

function ShowConditionEditor({
  value,
  onChange,
  allQuestionCodes,
}: {
  value: Record<string, any> | null | undefined;
  onChange: (val: Record<string, any> | null) => void;
  allQuestionCodes: string[];
}) {
  const hasCondition = !!value;
  const questionCode = value?.question_code || '';
  const operator = value?.operator || 'equals';
  const condValue = value?.value;

  const isArrayOp = operator === 'in' || operator === 'not_in';
  const displayValue = isArrayOp && Array.isArray(condValue)
    ? condValue.join(', ')
    : (condValue ?? '');

  const handleToggle = (checked: boolean) => {
    if (checked) {
      onChange({ question_code: '', operator: 'equals', value: '' });
    } else {
      onChange(null);
    }
  };

  const update = (field: string, val: any) => {
    const current = value || { question_code: '', operator: 'equals', value: '' };
    onChange({ ...current, [field]: val });
  };

  const handleValueChange = (text: string) => {
    if (isArrayOp) {
      const arr = text.split(',').map(s => s.trim()).filter(Boolean);
      update('value', arr);
    } else {
      update('value', text);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Checkbox id="has-condition" checked={hasCondition} onCheckedChange={handleToggle} />
        <Label htmlFor="has-condition" className="text-sm">Tampilkan dengan kondisi</Label>
      </div>
      {hasCondition && (
        <div className="grid grid-cols-3 gap-3 pl-6">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kode Pertanyaan</Label>
            <Select value={questionCode} onValueChange={(v) => update('question_code', v)}>
              <SelectTrigger className="!h-8 text-xs">
                <SelectValue placeholder="Pilih kode" />
              </SelectTrigger>
              <SelectContent>
                {allQuestionCodes.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Operator</Label>
            <Select value={operator} onValueChange={(v) => update('operator', v)}>
              <SelectTrigger className="!h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATOR_OPTIONS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Nilai {isArrayOp && '(pisah koma)'}
            </Label>
            <Input
              className="h-8 text-xs"
              value={displayValue}
              onChange={(e) => handleValueChange(e.target.value)}
              placeholder={isArrayOp ? 'RSU, RSJ, KLINIK' : 'nilai'}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Question Dialog ────────────────────────────────────

interface EditQuestionData {
  question_text: string;
  keterangan: string;
  answer_type: QuestionType;
  is_required: boolean;
  show_condition: Record<string, any> | null;
}

function EditQuestionDialog({
  question, open, onOpenChange, onSave, isSaving, allQuestionCodes,
}: {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (questionId: number, data: EditQuestionData) => void;
  isSaving: boolean;
  allQuestionCodes: string[];
}) {
  const [questionText, setQuestionText] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [answerType, setAnswerType] = useState<QuestionType>('TEXT');
  const [isRequired, setIsRequired] = useState(false);
  const [showCondition, setShowCondition] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (question && open) {
      setQuestionText(question.question_text || '');
      setKeterangan(question.keterangan || '');
      setAnswerType(question.answer_type || 'TEXT');
      setIsRequired(question.is_required || false);
      setShowCondition(question.show_condition || null);
    }
  }, [question, open]);

  const handleSave = () => {
    if (!question) return;
    onSave(question.id, { question_text: questionText, keterangan, answer_type: answerType, is_required: isRequired, show_condition: showCondition });
  };

  const filteredCodes = allQuestionCodes.filter(c => c !== question?.code);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Pertanyaan {question?.code}</DialogTitle>
          <DialogDescription>Ubah pertanyaan dan kondisi tampil</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Tipe Jawaban</Label>
              <Select value={answerType} onValueChange={(v) => setAnswerType(v as QuestionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANSWER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Wajib Diisi</Label>
              <Switch checked={isRequired} onCheckedChange={setIsRequired} />
              <span className="text-sm text-muted-foreground ml-2">{isRequired ? 'Ya' : 'Tidak'}</span>
            </div>
          </div>
          <div>
            <Label className="mb-2 block">Teks Pertanyaan</Label>
            <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="mb-2 block">Keterangan / Petunjuk</Label>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={3} />
          </div>
          <div className="border rounded-lg p-3">
            <Label className="mb-2 block font-semibold text-sm">Kondisi Tampil (show_condition)</Label>
            <p className="text-xs text-muted-foreground mb-3">Pertanyaan ini hanya tampil jika kondisi terpenuhi</p>
            <ShowConditionEditor value={showCondition} onChange={setShowCondition} allQuestionCodes={filteredCodes} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? 'Menyimpan...' : <><Tick01Icon className="h-4 w-4" />Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Section Dialog ─────────────────────────────────────

function EditSectionDialog({
  section, open, onOpenChange, onSave, isSaving, allQuestionCodes,
}: {
  section: QuestionSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (sectionId: number, data: any) => void;
  isSaving: boolean;
  allQuestionCodes: string[];
}) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);
  const [introductionText, setIntroductionText] = useState('');
  const [showCondition, setShowCondition] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (section && open) {
      setName(section.name || '');
      setCode(section.code || '');
      setDescription(section.description || '');
      setOrder(section.order || 0);
      setIntroductionText(section.introduction_text || '');
      setShowCondition(section.show_condition || null);
    }
  }, [section, open]);

  const handleSave = () => {
    if (!section) return;
    onSave(section.id, { name, code, description, order, introduction_text: introductionText, show_condition: showCondition });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Bagian {section?.code}</DialogTitle>
          <DialogDescription>Ubah pengaturan bagian dan kondisi tampil</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Kode</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Deskripsi</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Teks Pengantar</Label>
            <Textarea value={introductionText} onChange={(e) => setIntroductionText(e.target.value)} rows={2} />
          </div>
          <div className="border rounded-lg p-3">
            <Label className="mb-2 block font-semibold text-sm">Kondisi Tampil (show_condition)</Label>
            <p className="text-xs text-muted-foreground mb-3">Bagian ini hanya tampil jika kondisi terpenuhi. Contoh: tampilkan hanya jika Q4 = fasilitas kesehatan.</p>
            <ShowConditionEditor value={showCondition} onChange={setShowCondition} allQuestionCodes={allQuestionCodes} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? 'Menyimpan...' : <><Tick01Icon className="h-4 w-4" />Simpan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Choice Dialog ──────────────────────────────────────

interface EditChoiceData {
  value: string;
  label: string;
  order: number;
  keterangan: string;
  next_question_code: string;
  has_other_input: boolean;
  other_input_label: string;
  cabang_mtc: string;
  kode_desde_ltc: string;
}

function EditChoiceDialog({
  choice, questionId, open, onOpenChange, onSave, isSaving, isNew, allQuestionCodes,
}: {
  choice: QuestionOption | null;
  questionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { questionId: number; choiceId?: number; data: EditChoiceData }) => void;
  isSaving: boolean;
  isNew?: boolean;
  allQuestionCodes: string[];
}) {
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [order, setOrder] = useState(0);
  const [keterangan, setKeterangan] = useState('');
  const [nextQuestionCode, setNextQuestionCode] = useState('');
  const [hasOtherInput, setHasOtherInput] = useState(false);
  const [otherInputLabel, setOtherInputLabel] = useState('');
  const [cabangMtc, setCabangMtc] = useState('');
  const [kodeDesde, setKodeDesde] = useState('');

  useEffect(() => {
    if (open) {
      if (choice) {
        setValue(choice.value || '');
        setLabel(choice.label || '');
        setOrder(choice.order || 0);
        setKeterangan(choice.keterangan || '');
        setNextQuestionCode(choice.next_question_code || '');
        setHasOtherInput(choice.has_other_input || false);
        setOtherInputLabel(choice.other_input_label || '');
        setCabangMtc(choice.cabang_mtc || '');
        setKodeDesde(choice.kode_desde_ltc || '');
      } else {
        setValue(''); setLabel(''); setOrder(0); setKeterangan('');
        setNextQuestionCode(''); setHasOtherInput(false); setOtherInputLabel('');
        setCabangMtc(''); setKodeDesde('');
      }
    }
  }, [choice, open]);

  const handleSave = () => {
    if (!questionId) return;
    onSave({
      questionId,
      choiceId: choice?.id,
      data: { value, label, order, keterangan, next_question_code: nextQuestionCode || '', has_other_input: hasOtherInput, other_input_label: otherInputLabel, cabang_mtc: cabangMtc, kode_desde_ltc: kodeDesde },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Tambah Pilihan Baru' : 'Edit Pilihan'}</DialogTitle>
          <DialogDescription>{isNew ? 'Tambah pilihan jawaban baru' : 'Ubah pilihan jawaban'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Value (Kode)</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="KODE_PILIHAN" />
            </div>
            <div className="space-y-2">
              <Label>Label (Tampilan)</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Keterangan</Label>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lanjut ke Pertanyaan (next_question_code)</Label>
              <Select value={nextQuestionCode || '_none'} onValueChange={(v) => setNextQuestionCode(v === '_none' ? '' : v)}>
                <SelectTrigger className="!h-9"><SelectValue placeholder="Default (urutan)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Default (urutan berikutnya)</SelectItem>
                  {allQuestionCodes.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Cabang MTC</Label>
                <Input value={cabangMtc} onChange={(e) => setCabangMtc(e.target.value)} placeholder="max 50" />
              </div>
              <div className="space-y-2">
                <Label>Kode DESDE-LTC</Label>
                <Input value={kodeDesde} onChange={(e) => setKodeDesde(e.target.value)} placeholder="R.1.1.3" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 border rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Checkbox id="has-other-input" checked={hasOtherInput} onCheckedChange={(v) => setHasOtherInput(!!v)} />
              <Label htmlFor="has-other-input" className="text-sm">Butuh input tambahan</Label>
            </div>
            {hasOtherInput && (
              <div className="flex-1">
                <Input value={otherInputLabel} onChange={(e) => setOtherInputLabel(e.target.value)} placeholder="Label input (misal: Sebutkan)" className="h-8 text-sm" />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving || !value || !label} className="gap-2">
            {isSaving ? 'Menyimpan...' : <><Tick01Icon className="h-4 w-4" />{isNew ? 'Tambah' : 'Simpan'}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Question Dialog ─────────────────────────────────────

function AddQuestionDialog({
  sectionId, sectionCode, open, onOpenChange, onSave, isSaving, existingCodes, allQuestionCodes,
}: {
  sectionId: number | null;
  sectionCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { sectionId: number; data: any }) => void;
  isSaving: boolean;
  existingCodes: string[];
  allQuestionCodes: string[];
}) {
  const [code, setCode] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answerType, setAnswerType] = useState<QuestionType>('TEXT');
  const [isRequired, setIsRequired] = useState(false);
  const [order, setOrder] = useState(1);
  const [keterangan, setKeterangan] = useState('');
  const [showCondition, setShowCondition] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    if (open) {
      setCode(''); setQuestionText(''); setAnswerType('TEXT'); setIsRequired(false);
      setOrder(existingCodes.length + 1); setKeterangan(''); setShowCondition(null);
    }
  }, [open, existingCodes.length]);

  const handleSave = () => {
    if (!sectionId) return;
    onSave({ sectionId, data: { code, question_text: questionText, answer_type: answerType, is_required: isRequired, order, keterangan, show_condition: showCondition } });
  };

  const codeExists = existingCodes.includes(code);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Pertanyaan Baru</DialogTitle>
          <DialogDescription>Tambah pertanyaan baru ke seksi {sectionCode}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kode Pertanyaan</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Q17" />
              {codeExists && <p className="text-xs text-destructive">Kode sudah digunakan</p>}
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 1)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Teks Pertanyaan</Label>
            <Textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipe Jawaban</Label>
              <Select value={answerType} onValueChange={(v) => setAnswerType(v as QuestionType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ANSWER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wajib Diisi</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                <span className="text-sm text-muted-foreground">{isRequired ? 'Ya' : 'Tidak'}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Keterangan / Petunjuk</Label>
            <Textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)} rows={2} />
          </div>
          <div className="border rounded-lg p-3">
            <Label className="mb-2 block font-semibold text-sm">Kondisi Tampil (show_condition)</Label>
            <ShowConditionEditor value={showCondition} onChange={setShowCondition} allQuestionCodes={allQuestionCodes} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Batal</Button>
          <Button onClick={handleSave} disabled={isSaving || !code || !questionText || codeExists} className="gap-2">
            {isSaving ? 'Menyimpan...' : <><Add01Icon className="h-4 w-4" />Tambah Pertanyaan</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────

export default function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: template, isLoading } = useSurveyTemplate(Number(id));

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [editingSection, setEditingSection] = useState<QuestionSection | null>(null);
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false);

  const [editingChoice, setEditingChoice] = useState<QuestionOption | null>(null);
  const [editingChoiceQuestionId, setEditingChoiceQuestionId] = useState<number | null>(null);
  const [choiceDialogOpen, setChoiceDialogOpen] = useState(false);
  const [isNewChoice, setIsNewChoice] = useState(false);

  const [addQuestionSectionId, setAddQuestionSectionId] = useState<number | null>(null);
  const [addQuestionSectionCode, setAddQuestionSectionCode] = useState('');
  const [addQuestionDialogOpen, setAddQuestionDialogOpen] = useState(false);
  const [existingQuestionCodes, setExistingQuestionCodes] = useState<string[]>([]);

  const [deleteChoiceId, setDeleteChoiceId] = useState<number | null>(null);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'mindmap' | 'flow'>('mindmap');

  const allQuestionCodes = useMemo(() => {
    if (!template?.sections) return [];
    return template.sections.flatMap(s => s.questions || []).map(q => q.code).sort();
  }, [template]);

  // ─── Mutations ───────────────────────────────────────────

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: number; data: EditQuestionData }) => {
      return apiClient.patch(`/surveys/questions/${questionId}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-template', Number(id)] });
      toast.success('Pertanyaan berhasil diperbarui');
      setEditDialogOpen(false);
      setEditingQuestion(null);
    },
    onError: (error: any) => { toast.error(error?.message || 'Gagal memperbarui pertanyaan'); },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: number; data: any }) => {
      return apiClient.patch(`/surveys/sections/${sectionId}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-template', Number(id)] });
      toast.success('Bagian berhasil diperbarui');
      setSectionDialogOpen(false);
      setEditingSection(null);
    },
    onError: (error: any) => { toast.error(error?.message || 'Gagal memperbarui bagian'); },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async ({ sectionId, data }: { sectionId: number; data: any }) => {
      return apiClient.post('/surveys/questions/', { ...data, section: sectionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-template', Number(id)] });
      toast.success('Pertanyaan berhasil ditambahkan');
      setAddQuestionDialogOpen(false);
    },
    onError: (error: any) => { toast.error(error?.message || 'Gagal menambahkan pertanyaan'); },
  });

  const updateChoiceMutation = useMutation({
    mutationFn: async ({ choiceId, data }: { choiceId: number; data: any }) => {
      return apiClient.patch(`/surveys/choices/${choiceId}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-template', Number(id)] });
      toast.success('Pilihan berhasil diperbarui');
      setChoiceDialogOpen(false);
      setEditingChoice(null);
    },
    onError: (error: any) => { toast.error(error?.message || 'Gagal memperbarui pilihan'); },
  });

  const createChoiceMutation = useMutation({
    mutationFn: async ({ questionId, data }: { questionId: number; data: any }) => {
      return apiClient.post('/surveys/choices/', { ...data, question: questionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-template', Number(id)] });
      toast.success('Pilihan berhasil ditambahkan');
      setChoiceDialogOpen(false);
    },
    onError: (error: any) => { toast.error(error?.message || 'Gagal menambahkan pilihan'); },
  });

  const deleteChoiceMutation = useMutation({
    mutationFn: async (choiceId: number) => {
      return apiClient.delete(`/surveys/choices/${choiceId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['survey-template', Number(id)] });
      toast.success('Pilihan berhasil dihapus');
      setDeleteAlertOpen(false);
      setDeleteChoiceId(null);
    },
    onError: (error: any) => { toast.error(error?.message || 'Gagal menghapus pilihan'); },
  });

  // ─── Handlers (passed to SurveyMindmap) ──────────────────

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditDialogOpen(true);
  };

  const handleEditSection = (section: QuestionSection) => {
    setEditingSection(section);
    setSectionDialogOpen(true);
  };

  const handleEditChoice = (choice: QuestionOption, questionId: number) => {
    setEditingChoice(choice);
    setEditingChoiceQuestionId(questionId);
    setIsNewChoice(false);
    setChoiceDialogOpen(true);
  };

  const handleAddChoice = (questionId: number) => {
    setEditingChoice(null);
    setEditingChoiceQuestionId(questionId);
    setIsNewChoice(true);
    setChoiceDialogOpen(true);
  };

  const handleSaveChoice = ({ questionId, choiceId, data }: { questionId: number; choiceId?: number; data: EditChoiceData }) => {
    if (choiceId) {
      updateChoiceMutation.mutate({ choiceId, data });
    } else {
      createChoiceMutation.mutate({ questionId, data });
    }
  };

  const handleDeleteChoice = (choiceId: number) => {
    setDeleteChoiceId(choiceId);
    setDeleteAlertOpen(true);
  };

  const handleAddQuestion = (sectionId: number, sectionCode: string, existingCodes: string[]) => {
    setAddQuestionSectionId(sectionId);
    setAddQuestionSectionCode(sectionCode);
    setExistingQuestionCodes(existingCodes);
    setAddQuestionDialogOpen(true);
  };

  // ─── Render ──────────────────────────────────────────────

  const loadingBreadcrumbs = [
    { label: 'Dasbor', href: '/dashboard' },
    { label: 'Survei', href: '/dashboard/survey' },
    { label: 'Template', href: '/dashboard/survey/templates' },
    { label: 'Memuat...' },
  ];

  if (isLoading) {
    return (
      <>
        <PageHeader breadcrumbs={loadingBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Memuat template...</p>
          </div>
        </div>
      </>
    );
  }

  if (!template) {
    return (
      <>
        <PageHeader breadcrumbs={loadingBreadcrumbs} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Template tidak ditemukan</p>
            <Button onClick={() => router.push('/dashboard/survey')}>Kembali ke Survei</Button>
          </div>
        </div>
      </>
    );
  }

  const breadcrumbs = [
    { label: 'Dasbor', href: '/dashboard' },
    { label: 'Survei', href: '/dashboard/survey' },
    { label: 'Template Survei' },
  ];

  return (
    <>
      <PageHeader breadcrumbs={breadcrumbs} />

      {/* View toggle */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b bg-background">
        <button
          onClick={() => setViewMode('mindmap')}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            viewMode === 'mindmap'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Peta Pertanyaan
        </button>
        <button
          onClick={() => setViewMode('flow')}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-md border-b-2 transition-colors ${
            viewMode === 'flow'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Alur Pertanyaan
        </button>
      </div>

      {viewMode === 'mindmap' ? (
        <SurveyMindmap
          template={template}
          onEditQuestion={handleEditQuestion}
          onEditChoice={handleEditChoice}
          onAddChoice={handleAddChoice}
          onEditSection={handleEditSection}
          onAddQuestion={handleAddQuestion}
          onDeleteChoice={handleDeleteChoice}
        />
      ) : (
        <SurveyFlowTimeline template={template} />
      )}

      {/* Dialogs */}
      <EditQuestionDialog
        question={editingQuestion}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={(qId, data) => updateQuestionMutation.mutate({ questionId: qId, data })}
        isSaving={updateQuestionMutation.isPending}
        allQuestionCodes={allQuestionCodes}
      />

      <EditSectionDialog
        section={editingSection}
        open={sectionDialogOpen}
        onOpenChange={setSectionDialogOpen}
        onSave={(sId, data) => updateSectionMutation.mutate({ sectionId: sId, data })}
        isSaving={updateSectionMutation.isPending}
        allQuestionCodes={allQuestionCodes}
      />

      <EditChoiceDialog
        choice={editingChoice}
        questionId={editingChoiceQuestionId}
        open={choiceDialogOpen}
        onOpenChange={setChoiceDialogOpen}
        onSave={handleSaveChoice}
        isSaving={updateChoiceMutation.isPending || createChoiceMutation.isPending}
        isNew={isNewChoice}
        allQuestionCodes={allQuestionCodes}
      />

      <AddQuestionDialog
        sectionId={addQuestionSectionId}
        sectionCode={addQuestionSectionCode}
        open={addQuestionDialogOpen}
        onOpenChange={setAddQuestionDialogOpen}
        onSave={(data) => createQuestionMutation.mutate(data)}
        isSaving={createQuestionMutation.isPending}
        existingCodes={existingQuestionCodes}
        allQuestionCodes={allQuestionCodes}
      />

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pilihan?</AlertDialogTitle>
            <AlertDialogDescription>Apakah Anda yakin ingin menghapus pilihan ini?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteChoiceMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteChoiceId && deleteChoiceMutation.mutate(deleteChoiceId)}
              disabled={deleteChoiceMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteChoiceMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
