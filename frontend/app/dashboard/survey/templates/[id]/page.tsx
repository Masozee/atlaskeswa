'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
  FileEditIcon,
  Tick01Icon,
  Delete02Icon,
  Add01Icon,
  InformationCircleIcon,
} from 'hugeicons-react';
import type { Question, QuestionOption, QuestionType } from '@/lib/types/survey-template';

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
];

const ANSWER_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ANSWER_TYPE_OPTIONS.map(opt => [opt.value, opt.label])
);

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Rawat Inap (R)',
  DAY_CARE: 'Rawat Harian (D)',
  OUTPATIENT: 'Rawat Jalan (O)',
  ACCESSIBILITY: 'Aksesibilitas (A)',
  INFORMATION: 'Informasi (I)',
  BASIC_DATA: 'Data Dasar',
  GENERAL: 'Umum',
};

interface EditQuestionData {
  question_text: string;
  keterangan: string;
  answer_type: QuestionType;
  is_required: boolean;
}

interface EditChoiceData {
  value: string;
  label: string;
  order: number;
  keterangan: string;
}

interface EditQuestionDialogProps {
  question: Question | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (questionId: number, data: EditQuestionData) => void;
  isSaving: boolean;
}

function EditQuestionDialog({ question, open, onOpenChange, onSave, isSaving }: EditQuestionDialogProps) {
  const [questionText, setQuestionText] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [answerType, setAnswerType] = useState<QuestionType>('TEXT');
  const [isRequired, setIsRequired] = useState(false);

  useEffect(() => {
    if (question && open) {
      setQuestionText(question.question_text || '');
      setKeterangan(question.keterangan || '');
      setAnswerType(question.answer_type || 'TEXT');
      setIsRequired(question.is_required || false);
    }
  }, [question, open]);

  const handleSave = () => {
    if (!question) return;
    onSave(question.id, {
      question_text: questionText,
      keterangan,
      answer_type: answerType,
      is_required: isRequired,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Pertanyaan</DialogTitle>
          <DialogDescription>
            Ubah pertanyaan untuk kode {question?.code}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="answer-type" className="mb-2 block">Tipe Jawaban</Label>
            <Select value={answerType} onValueChange={(v) => setAnswerType(v as QuestionType)}>
              <SelectTrigger id="answer-type">
                <SelectValue placeholder="Pilih tipe jawaban" />
              </SelectTrigger>
              <SelectContent>
                {ANSWER_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
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
          <Label htmlFor="question-text" className="mb-2 block">Teks Pertanyaan</Label>
          <Textarea
            id="question-text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={3}
            placeholder="Masukkan teks pertanyaan..."
          />
        </div>

        <div>
          <Label htmlFor="keterangan" className="mb-2 block">Keterangan / Petunjuk</Label>
          <Textarea
            id="keterangan"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            rows={5}
            placeholder="Masukkan keterangan atau petunjuk untuk enumerator..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? 'Menyimpan...' : (
              <>
                <Tick01Icon className="h-4 w-4" />
                Simpan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface EditChoiceDialogProps {
  choice: QuestionOption | null;
  questionId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { questionId: number; choiceId?: number; data: EditChoiceData }) => void;
  isSaving: boolean;
  isNew?: boolean;
}

function EditChoiceDialog({ choice, questionId, open, onOpenChange, onSave, isSaving, isNew }: EditChoiceDialogProps) {
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [order, setOrder] = useState(0);
  const [keterangan, setKeterangan] = useState('');

  useEffect(() => {
    if (open) {
      if (choice) {
        setValue(choice.value || '');
        setLabel(choice.label || '');
        setOrder(choice.order || 0);
        setKeterangan(choice.keterangan || '');
      } else {
        setValue('');
        setLabel('');
        setOrder(0);
        setKeterangan('');
      }
    }
  }, [choice, open]);

  const handleSave = () => {
    if (!questionId) return;
    onSave({
      questionId,
      choiceId: choice?.id,
      data: { value, label, order, keterangan },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Tambah Pilihan Baru' : 'Edit Pilihan'}</DialogTitle>
          <DialogDescription>
            {isNew ? 'Tambah pilihan jawaban baru' : 'Ubah pilihan jawaban'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="choice-value">Value (Kode)</Label>
              <Input
                id="choice-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="KODE_PILIHAN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="choice-order">Urutan</Label>
              <Input
                id="choice-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="choice-label">Label (Tampilan)</Label>
            <Input
              id="choice-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label yang ditampilkan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="choice-keterangan">Keterangan</Label>
            <Textarea
              id="choice-keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={3}
              placeholder="Keterangan untuk pilihan ini..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !value || !label} className="gap-2">
            {isSaving ? 'Menyimpan...' : (
              <>
                <Tick01Icon className="h-4 w-4" />
                {isNew ? 'Tambah' : 'Simpan'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface AddQuestionDialogProps {
  sectionId: number | null;
  sectionCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { sectionId: number; data: { code: string; question_text: string; answer_type: QuestionType; is_required: boolean; order: number; keterangan: string } }) => void;
  isSaving: boolean;
  existingCodes: string[];
}

function AddQuestionDialog({ sectionId, sectionCode, open, onOpenChange, onSave, isSaving, existingCodes }: AddQuestionDialogProps) {
  const [code, setCode] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answerType, setAnswerType] = useState<QuestionType>('TEXT');
  const [isRequired, setIsRequired] = useState(false);
  const [order, setOrder] = useState(1);
  const [keterangan, setKeterangan] = useState('');

  useEffect(() => {
    if (open) {
      setCode('');
      setQuestionText('');
      setAnswerType('TEXT');
      setIsRequired(false);
      setOrder(existingCodes.length + 1);
      setKeterangan('');
    }
  }, [open, existingCodes.length]);

  const handleSave = () => {
    if (!sectionId) return;
    onSave({
      sectionId,
      data: { code, question_text: questionText, answer_type: answerType, is_required: isRequired, order, keterangan },
    });
  };

  const codeExists = existingCodes.includes(code);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Pertanyaan Baru</DialogTitle>
          <DialogDescription>
            Tambah pertanyaan baru ke seksi {sectionCode}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-question-code">Kode Pertanyaan</Label>
              <Input
                id="new-question-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Q17"
              />
              {codeExists && (
                <p className="text-xs text-destructive">Kode sudah digunakan</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-question-order">Urutan</Label>
              <Input
                id="new-question-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-question-text">Teks Pertanyaan</Label>
            <Textarea
              id="new-question-text"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={3}
              placeholder="Masukkan teks pertanyaan..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-answer-type">Tipe Jawaban</Label>
              <Select value={answerType} onValueChange={(v) => setAnswerType(v as QuestionType)}>
                <SelectTrigger id="new-answer-type">
                  <SelectValue placeholder="Pilih tipe jawaban" />
                </SelectTrigger>
                <SelectContent>
                  {ANSWER_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Wajib Diisi</Label>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  checked={isRequired}
                  onCheckedChange={setIsRequired}
                />
                <span className="text-sm text-muted-foreground">
                  {isRequired ? 'Ya' : 'Tidak'}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-keterangan">Keterangan / Petunjuk</Label>
            <Textarea
              id="new-keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              rows={3}
              placeholder="Masukkan keterangan atau petunjuk untuk enumerator..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !code || !questionText || codeExists} className="gap-2">
            {isSaving ? 'Menyimpan...' : (
              <>
                <Add01Icon className="h-4 w-4" />
                Tambah Pertanyaan
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal memperbarui pertanyaan');
    },
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
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal menambahkan pertanyaan');
    },
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
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal memperbarui pilihan');
    },
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
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal menambahkan pilihan');
    },
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
    onError: (error: any) => {
      toast.error(error?.message || 'Gagal menghapus pilihan');
    },
  });

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setEditDialogOpen(true);
  };

  const handleSaveQuestion = (questionId: number, data: EditQuestionData) => {
    updateQuestionMutation.mutate({ questionId, data });
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

  const handleConfirmDeleteChoice = () => {
    if (deleteChoiceId) {
      deleteChoiceMutation.mutate(deleteChoiceId);
    }
  };

  const handleAddQuestion = (sectionId: number, sectionCode: string, existingCodes: string[]) => {
    setAddQuestionSectionId(sectionId);
    setAddQuestionSectionCode(sectionCode);
    setExistingQuestionCodes(existingCodes);
    setAddQuestionDialogOpen(true);
  };

  const handleSaveNewQuestion = ({ sectionId, data }: { sectionId: number; data: any }) => {
    createQuestionMutation.mutate({ sectionId, data });
  };

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
            <Button onClick={() => router.push('/dashboard/survey')}>
              Kembali ke Survei
            </Button>
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

      <div className="flex flex-1 gap-8 p-8">
        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-4 max-w-3xl">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Badge variant={template.is_active ? 'default' : 'secondary'}>
                {template.is_active ? 'Aktif' : 'Nonaktif'}
              </Badge>
              <h1 className="text-3xl font-bold">{template.name}</h1>
              <p className="text-muted-foreground">{template.description}</p>
            </div>
          </div>

          {/* Template Info */}
          <div>
            <h2 className="text-base font-semibold mb-4">Informasi Template</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Kode</p>
                <p className="font-mono font-medium">{template.code}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Versi</p>
                <p className="font-medium">{template.version}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipe</p>
                <Badge variant="outline">
                  {TEMPLATE_TYPE_LABELS[template.template_type] || template.template_type}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pertanyaan</p>
                <p className="font-medium">{template.total_questions}</p>
              </div>
            </div>
          </div>

          {/* Sections and Questions */}
          <div>
            <div className="mb-4">
              <h2 className="text-base font-semibold">Struktur Kuesioner</h2>
              <p className="text-muted-foreground text-xs">
                Klik pada pertanyaan untuk mengedit. Untuk pertanyaan pilihan, Anda juga dapat mengelola pilihan jawaban.
              </p>
            </div>
            {template.sections && template.sections.length > 0 ? (
              <Accordion type="multiple" defaultValue={template.sections.map(s => s.code)} className="space-y-2">
                {template.sections.map((section) => (
                  <AccordionItem key={section.id} value={section.code} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {section.code}
                        </Badge>
                        <span className="font-medium">{section.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({section.questions?.length || 0} pertanyaan)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {section.description && (
                        <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
                      )}
                      {section.introduction_text && (
                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Teks Pengantar:</p>
                          <p className="text-sm whitespace-pre-wrap">{section.introduction_text}</p>
                        </div>
                      )}
                      <div className="space-y-3">
                        {section.questions?.map((question) => (
                          <div
                            key={question.id}
                            id={`question-${question.id}`}
                            className="border rounded-lg p-4 scroll-mt-4"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="font-mono text-xs">
                                    {question.code}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {ANSWER_TYPE_LABELS[question.answer_type] || question.answer_type}
                                  </Badge>
                                  {question.is_required && (
                                    <Badge variant="destructive" className="text-xs">
                                      Wajib
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm font-medium">{question.question_text}</p>
                                {question.keterangan && (
                                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                    <InformationCircleIcon className="h-4 w-4 mt-0.5 shrink-0" />
                                    <p className="whitespace-pre-wrap">{question.keterangan}</p>
                                  </div>
                                )}
                                {question.choices && question.choices.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <p className="text-xs text-muted-foreground font-medium">Pilihan Jawaban:</p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddChoice(question.id);
                                        }}
                                      >
                                        <Add01Icon className="h-3 w-3 mr-1" />
                                        Tambah
                                      </Button>
                                    </div>
                                    <div className="space-y-1">
                                      {question.choices.map((choice) => (
                                        <div
                                          key={choice.id}
                                          className="flex items-center justify-between gap-2 py-1 group"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs font-mono">
                                              {choice.value}
                                            </Badge>
                                            <span className="text-sm">{choice.label}</span>
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditChoice(choice, question.id);
                                              }}
                                            >
                                              <FileEditIcon className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-destructive hover:text-destructive"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteChoice(choice.id);
                                              }}
                                            >
                                              <Delete02Icon className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {(question.answer_type === 'SINGLE_CHOICE' || question.answer_type === 'MULTIPLE_CHOICE') && (!question.choices || question.choices.length === 0) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddChoice(question.id);
                                    }}
                                  >
                                    <Add01Icon className="h-4 w-4 mr-1" />
                                    Tambah Pilihan
                                  </Button>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0"
                                onClick={() => handleEditQuestion(question)}
                              >
                                <FileEditIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleAddQuestion(
                            section.id,
                            section.code,
                            section.questions?.map(q => q.code) || []
                          )}
                        >
                          <Add01Icon className="h-4 w-4 mr-2" />
                          Tambah Pertanyaan ke {section.code}
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Belum ada seksi dan pertanyaan dalam template ini
              </p>
            )}
        </div>
        </div>

        {/* Right Sidebar - Questions List */}
        <div className="w-72 shrink-0">
          <div className="sticky top-4 border rounded-lg p-4">
            <h3 className="text-sm font-semibold mb-3">Daftar Pertanyaan</h3>
            <div className="space-y-3 text-xs max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
              {template.sections?.map((section) => (
                <div key={section.id}>
                  <p className="font-medium text-muted-foreground mb-1">{section.code}</p>
                  <div className="space-y-1">
                    {section.questions?.map((question) => (
                      <a
                        key={question.id}
                        href={`#question-${question.id}`}
                        className="block py-1 text-muted-foreground hover:text-foreground"
                      >
                        <span className="font-mono text-xs font-semibold">{question.code}</span>
                        <span className="block text-[11px] leading-tight line-clamp-2">{question.question_text}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Question Dialog */}
      <EditQuestionDialog
        question={editingQuestion}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveQuestion}
        isSaving={updateQuestionMutation.isPending}
      />

      {/* Edit/Add Choice Dialog */}
      <EditChoiceDialog
        choice={editingChoice}
        questionId={editingChoiceQuestionId}
        open={choiceDialogOpen}
        onOpenChange={setChoiceDialogOpen}
        onSave={handleSaveChoice}
        isSaving={updateChoiceMutation.isPending || createChoiceMutation.isPending}
        isNew={isNewChoice}
      />

      {/* Add Question Dialog */}
      <AddQuestionDialog
        sectionId={addQuestionSectionId}
        sectionCode={addQuestionSectionCode}
        open={addQuestionDialogOpen}
        onOpenChange={setAddQuestionDialogOpen}
        onSave={handleSaveNewQuestion}
        isSaving={createQuestionMutation.isPending}
        existingCodes={existingQuestionCodes}
      />

      {/* Delete Choice Confirmation */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pilihan?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pilihan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteChoiceMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteChoice}
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
