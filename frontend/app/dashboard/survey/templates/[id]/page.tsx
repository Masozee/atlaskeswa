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
} from 'hugeicons-react';
import type { Question, QuestionOption, QuestionType } from '@/lib/types/survey-template';
import { SurveyMindmap } from '@/components/survey/SurveyMindmap';

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

      <SurveyMindmap template={template} />

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
