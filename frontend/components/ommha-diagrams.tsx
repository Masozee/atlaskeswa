import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

/**
 * The two figures from the OMMHA classification write-up, redrawn as markup
 * rather than embedded as images: the source was a Word-only EMF, and as HTML
 * the labels stay crisp, searchable and readable at phone width.
 */

const DARK = 'bg-[#07579E] text-white';
const FACILITY = 'bg-[#00979D]/10 border-[#00979D]/30';
const NON_FACILITY = 'bg-[#7C5CBF]/10 border-[#7C5CBF]/30';

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 text-muted-foreground" aria-hidden>
      <HugeiconsIcon icon={ArrowDown01Icon} size={22} />
      {label && <span className="text-[11px] font-semibold tracking-wider">{label}</span>}
    </div>
  );
}

/** Gambar 1: how six DESDE-LTC codes became ten OMMHA codes, and were tested. */
export function DesdeAdaptationDiagram() {
  return (
    <div className="mx-auto max-w-xl text-center">
      <div className={cn('rounded-lg px-5 py-4', DARK)}>
        <p className="text-lg font-semibold tracking-tight">6 Kode DESDE-LTC</p>
        <p className="mt-1 text-[15px] text-white/90">(R), (D), (O), (A), (I), dan (S)</p>
      </div>

      <Arrow label="ADAPTASI" />

      <div className="rounded-lg border bg-muted/40 p-4">
        <p className="text-lg font-semibold tracking-tight text-foreground">10 Kode Klasifikasi OMMHA</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className={cn('rounded-md border px-3 py-3', FACILITY)}>
            <p className="text-sm font-medium text-foreground">Fasilitas Kesehatan</p>
            <p className="mt-2 font-semibold text-foreground">(R), (D), (O), (A), (I)</p>
          </div>
          <div className={cn('rounded-md border px-3 py-3', NON_FACILITY)}>
            <p className="text-sm font-medium text-foreground">Non-Fasilitas Kesehatan</p>
            <p className="mt-2 font-semibold text-foreground">(SR), (SD), (SO), (SA), (SI)</p>
          </div>
        </div>
      </div>

      <Arrow />

      <div className={cn('rounded-lg px-5 py-4', DARK)}>
        <p className="font-semibold">Uji Reliabilitas dan Validitas Klasifikasi OMMHA</p>
        <p className="mt-1 text-sm text-white/90">Survei layanan kesehatan jiwa di Kabupaten Kebumen</p>
      </div>

      <Arrow />

      <div className={cn('rounded-lg border px-5 py-4', FACILITY)}>
        <p className="font-semibold text-foreground">Klasifikasi OMMHA Terverifikasi</p>
        <p className="mt-1 text-sm text-foreground/80">Atlas Layanan Kesehatan Jiwa Kabupaten Kebumen</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- classification */

type Node = { label: string; children?: Node[] };
type Branch = { code: string; label: string; children: Node[] };

const ACCESSIBILITY: Node[] = [
  { label: 'Komunikasi' },
  { label: 'Mobilitas Fisik' },
  { label: 'Pendampingan Pribadi' },
  { label: 'Koordinasi Kasus' },
  { label: 'Aksesibilitas Lainnya' },
];
const INFORMATION: Node[] = [{ label: 'Konsultasi dan Asesmen' }, { label: 'Penyediaan Informasi' }];
const DAY_CARE_NON_ACUTE: Node[] = [
  { label: 'Pekerjaan' },
  { label: 'Program Persiapan Kerja' },
  { label: 'Terstruktur Non-Pekerjaan' },
  { label: 'Tidak Terstruktur' },
];
const OUTPATIENT: Node[] = [{ label: 'Layanan Berbasis Kunjungan' }, { label: 'Layanan Berbasis Fasilitas' }];
const DOCTOR_ON_CALL: Node[] = [
  { label: 'Terdapat dokter jaga 24 jam' },
  { label: 'Tidak terdapat dokter jaga 24 jam' },
];

const FACILITY_BRANCHES: Branch[] = [
  {
    code: 'R',
    label: 'Layanan Rawat Inap',
    children: [
      { label: 'Akut', children: DOCTOR_ON_CALL },
      { label: 'Non Akut', children: DOCTOR_ON_CALL },
    ],
  },
  {
    code: 'D',
    label: 'Layanan Perawatan Harian',
    children: [
      { label: 'Akut', children: [{ label: 'Episodik' }, { label: 'Berkelanjutan' }] },
      { label: 'Non Akut', children: DAY_CARE_NON_ACUTE },
    ],
  },
  {
    code: 'O',
    label: 'Layanan Rawat Jalan',
    children: [
      { label: 'Akut', children: OUTPATIENT },
      { label: 'Non Akut', children: OUTPATIENT },
    ],
  },
  { code: 'A', label: 'Layanan Aksesibilitas', children: ACCESSIBILITY },
  { code: 'I', label: 'Layanan Informasi', children: INFORMATION },
];

const NON_FACILITY_BRANCHES: Branch[] = [
  { code: 'SR', label: 'Layanan Rawat Inap', children: [{ label: 'Akut' }, { label: 'Non Akut' }] },
  { code: 'SD', label: 'Layanan Perawatan Harian', children: DAY_CARE_NON_ACUTE },
  { code: 'SO', label: 'Layanan Rawat Jalan', children: OUTPATIENT },
  { code: 'SA', label: 'Layanan Aksesibilitas', children: ACCESSIBILITY },
  { code: 'SI', label: 'Layanan Informasi', children: INFORMATION },
];

function Leaves({ nodes }: { nodes: Node[] }) {
  // A flat list reads like one of the nested ones, so all leaves match.
  if (nodes.every((node) => !node.children)) {
    return (
      <ul className="space-y-1 border-l border-border pl-3 leading-snug">
        {nodes.map((node) => (
          <li key={node.label} className="text-[13px] text-foreground/75">
            {node.label}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-1.5 leading-snug">
      {nodes.map((node) => (
        <li key={node.label}>
          {node.children ? (
            <>
              <p className="text-[13px] font-medium text-foreground">{node.label}</p>
              <ul className="mt-1 mb-2 space-y-1 border-l border-border pl-3">
                {node.children.map((child) => (
                  <li key={child.label} className="text-[13px] leading-snug text-foreground/75">
                    {child.label}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <span className="text-[13px] leading-snug text-foreground/75">{node.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Group({ title, branches, tone }: { title: string; branches: Branch[]; tone: string }) {
  return (
    <section className={cn('rounded-lg border p-4', tone)}>
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {branches.map((branch) => (
          <li key={branch.code} className="rounded-md border bg-background p-3">
            <p className="flex items-baseline gap-2">
              <span className="rounded bg-[#07579E] px-1.5 py-0.5 text-[11px] font-semibold text-white tabular-nums">
                {branch.code}
              </span>
              <span className="text-sm font-medium leading-snug text-foreground">{branch.label}</span>
            </p>
            <div className="mt-2.5">
              <Leaves nodes={branch.children} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Gambar 2: the full OMMHA classification tree, one panel per provider kind. */
export function OmmhaClassificationDiagram() {
  return (
    <div>
      <div className={cn('mx-auto w-fit rounded-lg px-5 py-2.5 text-center text-[15px] font-semibold', DARK)}>
        Layanan Kesehatan Jiwa
      </div>
      <div className="mt-4 grid gap-4">
        <Group title="Fasilitas Kesehatan" branches={FACILITY_BRANCHES} tone={FACILITY} />
        <Group title="Non-Fasilitas Kesehatan" branches={NON_FACILITY_BRANCHES} tone={NON_FACILITY} />
      </div>
    </div>
  );
}
