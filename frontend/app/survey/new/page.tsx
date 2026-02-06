'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useServices } from '@/hooks/use-services';
import { useSurveyTemplates, useSurveyTemplate } from '@/hooks/use-survey-templates';
import { useCurrentUser } from '@/hooks/use-auth';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { DynamicSurveyForm } from '@/components/survey/DynamicSurveyForm';
import { VerticalAudioControls } from '@/components/survey/speech-controls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Introduction text template for OMMHA survey
const getOmmhaIntroduction = (enumeratorName: string) => `Perkenalkan, saya ${enumeratorName} dari Tim Penelitian OMMHA Pusat Rehabilitasi Yakkum.

Saat ini, kami sedang melakukan pendataan dan pemetaan layanan kesehatan jiwa di Kabupaten Kebumen. Tujuan dari pendataan ini adalah mengidentifikasi jenis layanan kesehatan jiwa yang tersedia di Kabupaten Kebumen.

Hasil dari pendataan ini akan digunakan sebagai dasar dalam menyusun sistem layanan kesehatan jiwa berbasis masyarakat yang lebih baik dan sesuai dengan kebutuhan masyarakat di Kabupaten Kebumen.

Data yang dikumpulkan akan dijaga kerahasiaannya dan hanya digunakan untuk kepentingan penelitian serta pengembangan sistem layanan kesehatan jiwa di wilayah ini.

Untuk keperluan tersebut, kami mohon kesediaan Bapak/Ibu untuk memberikan informasi tentang layanan yang Bapak/Ibu kelola.`;

const CONSENT_QUESTION = 'Apakah Bapak/Ibu bersedia untuk melanjutkan wawancara ini?';

type WizardStep = 'intro' | 'setup' | 'survey';

export default function SurveyWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('intro');
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);

  // Setup data
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [surveyDate, setSurveyDate] = useState(new Date().toISOString().split('T')[0]);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [setupErrors, setSetupErrors] = useState<Record<string, string>>({});

  // Hooks
  const { data: user } = useCurrentUser();
  const { data: templates, isLoading: templatesLoading } = useSurveyTemplates();
  const { data: selectedTemplate, isLoading: templateLoading } = useSurveyTemplate(
    selectedTemplateId ? parseInt(selectedTemplateId) : undefined
  );
  const { data: servicesData, isLoading: servicesLoading } = useServices({ is_active: true, page_size: 100 });
  const { cancel } = useSpeechSynthesis();

  // Speech text for survey step (updated by DynamicSurveyForm)
  const [surveySpeechText, setSurveySpeechText] = useState('');

  // Auto-select template if there's only one (or always select the first active one)
  useEffect(() => {
    if (templates && templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id.toString());
    }
  }, [templates, selectedTemplateId]);

  // Get user's full name for introduction
  const enumeratorName = useMemo(() => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.first_name || user?.email || 'Enumerator';
  }, [user]);

  // Generate introduction text with user's name
  const introductionText = useMemo(() => {
    return getOmmhaIntroduction(enumeratorName);
  }, [enumeratorName]);

  // Get selected service info
  const selectedService = servicesData?.results.find(s => s.id.toString() === selectedServiceId);

  // Generate setup step speech text
  const setupSpeechText = useMemo(() => {
    let text = 'Pengaturan Survei. Silakan pilih fasilitas layanan kesehatan jiwa yang akan disurvei, masukkan tanggal survei, dan tentukan periode data yang dilaporkan.';
    if (selectedService) {
      text += ` Fasilitas terpilih: ${selectedService.name}, ${selectedService.city}.`;
    }
    if (surveyDate) {
      text += ` Tanggal survei: ${new Date(surveyDate).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`;
    }
    return text;
  }, [selectedService, surveyDate]);

  // Current speech text based on step
  const currentSpeechText = useMemo(() => {
    switch (currentStep) {
      case 'intro':
        return `${introductionText}\n\n${CONSENT_QUESTION}`;
      case 'setup':
        return setupSpeechText;
      case 'survey':
        return surveySpeechText;
      default:
        return '';
    }
  }, [currentStep, introductionText, setupSpeechText, surveySpeechText]);

  // Callback for DynamicSurveyForm to update speech text
  const handleSpeechTextChange = useCallback((text: string) => {
    setSurveySpeechText(text);
  }, []);

  // Handle consent
  const handleConsentYes = () => {
    setHasConsent(true);
    cancel();
    setCurrentStep('setup');
  };

  const handleConsentNo = () => {
    setHasConsent(false);
    cancel();
    toast.info('Terima kasih atas waktunya. Wawancara tidak dapat dilanjutkan tanpa persetujuan.');
    router.push('/dashboard');
  };

  // Validate setup step
  const validateSetup = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedTemplateId) {
      errors.template = 'Pilih template survei';
    }
    if (!selectedServiceId) {
      errors.service = 'Pilih fasilitas layanan';
    }
    if (!surveyDate) {
      errors.surveyDate = 'Masukkan tanggal survei';
    }
    if (!periodStart) {
      errors.periodStart = 'Masukkan periode awal';
    }
    if (!periodEnd) {
      errors.periodEnd = 'Masukkan periode akhir';
    }
    if (periodStart && periodEnd && new Date(periodEnd) < new Date(periodStart)) {
      errors.periodEnd = 'Periode akhir harus setelah periode awal';
    }

    setSetupErrors(errors);

    if (Object.keys(errors).length > 0) {
      const errorMessages = Object.values(errors).join(', ');
      toast.error(`Mohon lengkapi: ${errorMessages}`);
      return false;
    }

    return true;
  };

  // Handle setup next
  const handleSetupNext = () => {
    if (!validateSetup()) return;
    setCurrentStep('survey');
  };

  // Handle survey success
  const handleSurveySuccess = () => {
    toast.success('Survei berhasil disimpan!');
    router.push('/dashboard/survey/responses');
  };

  // Handle back from survey to setup
  const handleBackFromSurvey = () => {
    cancel();
    setCurrentStep('setup');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {currentStep === 'intro' && 'Perkenalan'}
                {currentStep === 'setup' && 'Pengaturan Survei'}
                {currentStep === 'survey' && 'Formulir Survei DESDE-LTC'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.first_name ? `Selamat datang, ${user.first_name}` : user?.email}
              </p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Kembali ke Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="bg-background border-b">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              'flex items-center gap-2',
              currentStep === 'intro' ? 'text-primary' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2',
                currentStep !== 'intro'
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-primary border-primary text-primary-foreground'
              )}>
                {currentStep === 'intro' ? '1' : '✓'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Perkenalan</span>
            </div>
            <div className={cn('flex-1 h-1 rounded', currentStep !== 'intro' ? 'bg-primary' : 'bg-muted')} />
            <div className={cn(
              'flex items-center gap-2',
              currentStep === 'setup' ? 'text-primary' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2',
                currentStep === 'setup' || currentStep === 'survey'
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}>
                {currentStep === 'survey' ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium hidden sm:inline">Pengaturan</span>
            </div>
            <div className={cn('flex-1 h-1 rounded', currentStep === 'survey' ? 'bg-primary' : 'bg-muted')} />
            <div className={cn(
              'flex items-center gap-2',
              currentStep === 'survey' ? 'text-primary' : 'text-muted-foreground'
            )}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2',
                currentStep === 'survey'
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'border-muted-foreground/30'
              )}>
                3
              </div>
              <span className="text-sm font-medium hidden sm:inline">Survei</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Same layout for all steps */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {/* Introduction Step */}
            {currentStep === 'intro' && (
              <div className="space-y-6">
                {/* Section header */}
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold">Perkenalan dan Persetujuan</h2>
                  <p className="text-muted-foreground mt-1">
                    Silakan baca atau dengarkan perkenalan berikut sebelum memulai survei
                  </p>
                </div>

                {/* Introduction text */}
                <div className="space-y-4">
                  {introductionText.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-base leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Consent question */}
                <div className="space-y-4 pt-6 border-t">
                  <Label className="text-lg font-semibold block">
                    {CONSENT_QUESTION}
                  </Label>

                  <RadioGroup
                    value={hasConsent === true ? 'yes' : hasConsent === false ? 'no' : ''}
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 py-1">
                      <RadioGroupItem
                        value="yes"
                        id="consent-yes"
                        onClick={() => setHasConsent(true)}
                      />
                      <Label
                        htmlFor="consent-yes"
                        className="text-base font-normal cursor-pointer"
                      >
                        Ya, saya bersedia melanjutkan wawancara
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 py-1">
                      <RadioGroupItem
                        value="no"
                        id="consent-no"
                        onClick={() => setHasConsent(false)}
                      />
                      <Label
                        htmlFor="consent-no"
                        className="text-base font-normal cursor-pointer"
                      >
                        Tidak, saya tidak bersedia
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Navigation */}
                <div className="flex justify-end gap-4 pt-6 border-t">
                  {hasConsent === false && (
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                      Kembali ke Dashboard
                    </Button>
                  )}
                  {hasConsent === true && (
                    <Button onClick={handleConsentYes}>
                      Lanjutkan →
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Setup Step */}
            {currentStep === 'setup' && (
              <div className="space-y-6">
                {/* Section header */}
                <div className="border-b pb-4">
                  <h2 className="text-xl font-semibold">Pengaturan Survei</h2>
                  <p className="text-muted-foreground mt-1">
                    Pilih fasilitas layanan dan periode survei
                  </p>
                </div>

                {/* Service Selection */}
                <div className="space-y-3 pb-6 border-b border-border/50">
                  <Label htmlFor="service" className="text-base font-medium">
                    Fasilitas Layanan <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pilih fasilitas layanan kesehatan jiwa yang akan disurvei.
                  </p>
                  <Select
                    value={selectedServiceId}
                    onValueChange={(value) => {
                      setSelectedServiceId(value);
                      if (setupErrors.service) {
                        setSetupErrors(prev => ({ ...prev, service: '' }));
                      }
                    }}
                    disabled={servicesLoading}
                  >
                    <SelectTrigger className={cn('w-full', setupErrors.service && 'border-destructive')}>
                      <SelectValue placeholder={servicesLoading ? 'Memuat...' : '-- Pilih Fasilitas --'}>
                        {selectedService ? `${selectedService.name} - ${selectedService.city}` : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {servicesData?.results.map((service) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} - {service.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {setupErrors.service && (
                    <p className="text-sm text-destructive">{setupErrors.service}</p>
                  )}
                </div>

                {/* Survey Date */}
                <div className="space-y-3 pb-6 border-b border-border/50">
                  <Label htmlFor="surveyDate" className="text-base font-medium">
                    Tanggal Survei <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Masukkan tanggal pelaksanaan survei.
                  </p>
                  <Input
                    id="surveyDate"
                    type="date"
                    value={surveyDate}
                    onChange={(e) => {
                      setSurveyDate(e.target.value);
                      if (setupErrors.surveyDate) {
                        setSetupErrors(prev => ({ ...prev, surveyDate: '' }));
                      }
                    }}
                    className={cn('max-w-xs', setupErrors.surveyDate && 'border-destructive')}
                  />
                  {setupErrors.surveyDate && (
                    <p className="text-sm text-destructive">{setupErrors.surveyDate}</p>
                  )}
                </div>

                {/* Survey Period */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">
                    Periode Data yang Dilaporkan <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Tentukan rentang waktu data yang dikumpulkan dalam survei ini.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="periodStart" className="text-sm">Dari tanggal</Label>
                      <Input
                        id="periodStart"
                        type="date"
                        value={periodStart}
                        onChange={(e) => {
                          setPeriodStart(e.target.value);
                          if (setupErrors.periodStart) {
                            setSetupErrors(prev => ({ ...prev, periodStart: '' }));
                          }
                        }}
                        className={setupErrors.periodStart ? 'border-destructive' : ''}
                      />
                      {setupErrors.periodStart && (
                        <p className="text-sm text-destructive">{setupErrors.periodStart}</p>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="periodEnd" className="text-sm">Sampai tanggal</Label>
                      <Input
                        id="periodEnd"
                        type="date"
                        value={periodEnd}
                        onChange={(e) => {
                          setPeriodEnd(e.target.value);
                          if (setupErrors.periodEnd) {
                            setSetupErrors(prev => ({ ...prev, periodEnd: '' }));
                          }
                        }}
                        className={setupErrors.periodEnd ? 'border-destructive' : ''}
                      />
                      {setupErrors.periodEnd && (
                        <p className="text-sm text-destructive">{setupErrors.periodEnd}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between gap-4 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('intro')}
                  >
                    ← Sebelumnya
                  </Button>
                  <Button onClick={handleSetupNext} disabled={templateLoading}>
                    {templateLoading ? 'Memuat template...' : 'Mulai Survei →'}
                  </Button>
                </div>
              </div>
            )}

            {/* Survey Step */}
            {currentStep === 'survey' && (
              selectedTemplate ? (
                <DynamicSurveyForm
                  template={selectedTemplate}
                  serviceId={parseInt(selectedServiceId)}
                  surveyDate={surveyDate}
                  surveyPeriodStart={periodStart}
                  surveyPeriodEnd={periodEnd}
                  onSuccess={handleSurveySuccess}
                  onBack={handleBackFromSurvey}
                  onSpeechTextChange={handleSpeechTextChange}
                />
              ) : (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground">Memuat template survei...</p>
                </div>
              )
            )}
          </div>

          {/* Audio Controls Sidebar */}
          <div className="w-16 flex-shrink-0">
            <div className="sticky top-24">
              <VerticalAudioControls text={currentSpeechText} position="relative" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
