/**
 * OMMHA's own publications — press releases and research reports — written out
 * as content blocks so the detail page can typeset them, plus the external
 * references the landing page has always listed.
 *
 * A plain module rather than a CMS: there are a handful of these and they
 * change with the research milestones, not daily.
 */

export type PublicationType = 'Siaran pers' | 'Laporan';

export type Block =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'quote'; text: string; cite: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string; width: number; height: number; caption?: string }
  /** A table of label/value rows; `indent` marks a breakdown of the row above. */
  | { type: 'table'; caption: string; head?: [string, string]; rows: { label: string; value: string; indent?: boolean; strong?: boolean }[] }
  /** A process drawn as numbered steps (the report's Gambar 2). */
  | { type: 'steps'; caption: string; items: string[] }
  /** Dated milestones (the report's Gambar 3). */
  | { type: 'timeline'; caption: string; items: { title: string; period: string }[] }
  | { type: 'callout'; title: string; items: string[] }
  | { type: 'note'; text: string };

export interface Publication {
  slug: string;
  type: PublicationType;
  /** ISO date the piece is dated. */
  date: string;
  title: string;
  excerpt: string;
  author: string;
  cover: { src: string; alt: string; credit?: string };
  /** Research period a report covers. */
  period?: string;
  /** A downloadable original, served from /public. */
  file?: { href: string; label: string; size: string };
  body: Block[];
}

export const PUBLICATIONS: Publication[] = [
  {
    slug: 'pemaparan-hasil-pemetaan-layanan-kesehatan-jiwa-kebumen',
    type: 'Siaran pers',
    date: '2026-09-29',
    title: 'Tim Peneliti OMMHA Paparkan Hasil Pemetaan Layanan Kesehatan Jiwa Kabupaten Kebumen',
    excerpt:
      'Layanan kesehatan jiwa telah tersedia di seluruh kecamatan di Kabupaten Kebumen, dengan penyedia dari sektor kesehatan, sosial, keagamaan, komunitas, hingga praktisi individu.',
    author: 'Tim Peneliti OMMHA',
    cover: {
      src: '/publikasi/siaran-pers-pemaparan-cover.jpg',
      alt: 'Sambutan pada pemaparan hasil pemetaan layanan kesehatan jiwa OMMHA di Hotel Grand Kolopaking, Kebumen',
    },
    body: [
      {
        type: 'p',
        text: 'Tim Peneliti One Map for Mental Health Atlas (OMMHA) pada hari Selasa, 29 September 2026 memaparkan hasil pemetaan layanan kesehatan jiwa di Kabupaten Kebumen. Kegiatan ini bertempat di Hotel Grand Kolopaking dan dibuka oleh Kepala Dinas Kesehatan, Pengendalian Penduduk, dan Keluarga Berencana (Dinkes PPKB) Kabupaten Kebumen, dr. Iwan Danardono, Sp.Rad., M.M.R., serta dihadiri oleh anggota Kelompok Penasehat Penelitian OMMHA dan Tim Teknis Pengembang Atlas Layanan Kesehatan Jiwa Kabupaten Kebumen.',
      },
      {
        type: 'p',
        text: 'Penelitian OMMHA merupakan penelitian kolaboratif yang diselenggarakan oleh Pusat Rehabilitasi YAKKUM, Badan Riset dan Inovasi Nasional (BRIN), Kementerian Kesehatan RI, Universitas Atma Jaya Jakarta, dan University of Sydney, dengan dukungan dari KONEKSI – DFAT. Penelitian ini dilaksanakan di Kabupaten Kebumen dengan melibatkan Pemerintah Daerah, penyedia layanan kesehatan jiwa, akademisi, komunitas, dan berbagai pemangku kepentingan lainnya di Kabupaten Kebumen.',
      },
      { type: 'p', text: 'Dalam sambutannya, dr. Iwan Danardono menyambut baik hasil dari pemetaan ini.' },
      {
        type: 'quote',
        text: 'Harapan kami, Atlas yang disusun ini benar-benar sesuai kebutuhan dan memberikan manfaat nyata bagi layanan kesehatan jiwa di Kabupaten Kebumen. Lebih dari itu, model pemetaan ini diharapkan dapat menjadi contoh bagi kabupaten lain untuk mengembangkan inisiatif serupa di wilayahnya masing-masing.',
        cite: 'dr. Iwan Danardono, Sp.Rad., M.M.R., Kepala Dinkes PPKB Kabupaten Kebumen',
      },
      {
        type: 'p',
        text: 'Disampaikan oleh Tim Peneliti OMMHA bahwa hasil pemetaan menunjukkan bahwa layanan kesehatan jiwa telah tersedia di seluruh kecamatan di Kabupaten Kebumen. Jenis-jenis penyedia layanannya pun beragam, mencakup sektor kesehatan, sosial, keagamaan, komunitas, hingga praktisi individu berbasis tradisional/agama dan hipnoterapi. Dari seluruh penyedia layanan tersebut, Puskesmas dan Kader tercatat sebagai penyedia layanan kesehatan jiwa yang paling banyak muncul dari hasil pemetaan. Sementara itu, jenis-jenis layanan kesehatan jiwa yang ditemukan juga bervariasi antar penyedia layanan, meliputi layanan rawat jalan, rawat inap, perawatan harian, aksesibilitas, hingga layanan informasi.',
      },
      {
        type: 'image',
        src: '/publikasi/siaran-pers-pemaparan-foto-bersama.jpg',
        alt: 'Foto bersama peserta pemaparan hasil pemetaan layanan kesehatan jiwa OMMHA',
        width: 964,
        height: 723,
      },
      {
        type: 'p',
        text: 'Peneliti OMMHA juga mengidentifikasi karakteristik pengguna layanan di tiap-tiap penyedia layanan tersebut, di mana sebagian besar tidak ada batasan usia dan jenis kelamin yang dilayani. Namun demikian, terdapat variasi kecenderungan karakteristik klien yang dilayani, di mana untuk layanan rawat jalan cenderung bisa diakses oleh laki-laki maupun perempuan dari semua kelompok umur. Sedangkan untuk layanan rawat inap, pada beberapa penyedia layanan hanya menerima klien perempuan saja atau laki-laki saja. Demikian halnya dengan variasi kelompok usia yang dilayani.',
      },
      {
        type: 'p',
        text: 'Dari hasil pemetaan juga diketahui gambaran pembiayaan untuk layanan kesehatan jiwa, di mana layanan Rumah Sakit dan Puskesmas umumnya telah ditanggung BPJS Kesehatan, sedangkan layanan yang disediakan oleh Kader, Komunitas, dan Praktisi Individu sebagian besar menyatakan tidak berbayar atau secara sukarela.',
      },
      {
        type: 'p',
        text: 'Salah satu temuan menarik yang muncul dari hasil pemetaan adalah persepsi mengenai layanan kesehatan dan non-kesehatan, di mana sebagian besar praktisi kesehatan jiwa berbasis tradisional/agama, hipnoterapi, dan komunitas menyatakan bahwa layanan kesehatan dan layanan non-kesehatan sifatnya saling melengkapi. Tidak ditemukan anggapan bahwa peran mereka sebagai pengganti pengobatan medis, melainkan dua pendekatan yang saling mendukung proses pemulihan klien/pasien.',
      },
      {
        type: 'p',
        text: 'Selain memaparkan hasil pemetaan, Tim Peneliti OMMHA juga menampilkan Peta Layanan Kesehatan Jiwa Kabupaten Kebumen. Peta ini menyajikan profil, lokasi, dan kapasitas berbagai penyedia layanan kesehatan jiwa yang teridentifikasi dalam pemetaan. Saat ini, peta masih dalam tahap finalisasi dan akan terus disempurnakan hingga tahap akhir Penelitian OMMHA.',
      },
      {
        type: 'image',
        src: '/publikasi/siaran-pers-pemaparan-dashboard.jpg',
        alt: 'Tampilan dashboard OMMHA Kebumen di www.atlaskeswa.id',
        width: 1800,
        height: 1004,
        caption: 'Gambar 1. Dashboard OMMHA Kebumen — www.atlaskeswa.id',
      },
      {
        type: 'p',
        text: 'Kegiatan selanjutnya setelah pemetaan layanan adalah analisis pemanfaatan layanan. Kegiatan ini akan diawali dengan wawancara mendalam dan FGD yang melibatkan berbagai pihak pada bulan Oktober 2026. Hasil analisis ini akan digunakan untuk mendeskripsikan pola layanan, navigasi pasien, dan pemanfaatan layanan kesehatan jiwa yang ada di Kabupaten Kebumen, baik pada layanan berbasis kesehatan (fasilitas kesehatan formal) maupun layanan non-kesehatan, dari sudut pandang pasien, keluarga, tenaga kesehatan, dan pembuat kebijakan.',
      },
      {
        type: 'p',
        text: 'Disampaikan oleh Principal Investigator Penelitian OMMHA, Ignatius Praptoraharjo, Ph.D bahwa dalam melangkah ke tahap selanjutnya, Tim Peneliti masih terus membutuhkan dukungan dari berbagai pihak demi kelancaran dan keberhasilan pelaksanaan Penelitian OMMHA hingga tahap akhir.',
      },
    ],
  },
  {
    slug: 'laporan-perkembangan-penelitian-ommha-2026',
    type: 'Laporan',
    date: '2026-08-18',
    title: 'Laporan Perkembangan Penelitian OMMHA',
    excerpt:
      'Perkembangan penelitian OMMHA dari Oktober 2025 hingga Agustus 2026: kolaborasi multi-pihak, adaptasi DESDE-LTC, pemetaan 188 penyedia layanan di 26 kecamatan, dan rencana tindak lanjut.',
    author: 'Tim Peneliti OMMHA',
    period: 'Oktober 2025 – Agustus 2026',
    cover: {
      src: '/publikasi/laporan-perkembangan-cover.jpg',
      alt: 'Grafik garis yang digambar tangan di atas kertas, dengan penggaris dan pena',
      credit: 'Foto: Isaac Smith / Unsplash',
    },
    file: {
      href: '/publikasi/laporan-perkembangan-penelitian-ommha-2026.pdf',
      label: 'Unduh laporan (PDF)',
      size: '435 KB',
    },
    body: [
      { type: 'h2', text: 'Pengantar' },
      {
        type: 'p',
        text: 'Penelitian One Map for Mental Health Atlas (OMMHA) merupakan penelitian kolaboratif yang dilaksanakan oleh Pusat Rehabilitasi YAKKUM, Badan Riset dan Inovasi Nasional (BRIN), Kementerian Kesehatan RI, Universitas Atma Jaya Jakarta, dan University of Sydney, dengan dukungan dari KONEKSI – DFAT. Penelitian ini dilaksanakan di Kabupaten Kebumen dengan melibatkan Pemerintah Daerah, penyedia layanan kesehatan jiwa, akademisi, komunitas, dan berbagai pemangku kepentingan lainnya di Kabupaten Kebumen.',
      },
      {
        type: 'p',
        text: 'Kabupaten Kebumen dipilih sebagai lokasi penelitian, selain karena masih ditemuinya berbagai tantangan dalam penyelenggaraan layanan kesehatan jiwa, sejak tahun 2023 Pusat Rehabilitasi YAKKUM juga telah mengembangkan program DIGNITY (Disability Inclusion Through Strengthening Local to National Policy and Capacity) sebagai upaya untuk mendorong layanan yang lebih inklusif dan non-diskriminatif bagi penyandang disabilitas psikososial di Kabupaten Kebumen. Dengan demikian, pemilihan lokasi penelitian ini merupakan kelanjutan komitmen tersebut dari Pusat Rehabilitasi YAKKUM.',
      },
      {
        type: 'p',
        text: 'Terdapat tiga pertanyaan penelitian yang ingin dijawab melalui penelitian OMMHA:',
      },
      {
        type: 'list',
        ordered: true,
        items: [
          'Apa saja jenis-jenis layanan kesehatan jiwa yang tersedia di Kabupaten Kebumen?',
          'Bagaimana layanan kesehatan jiwa dimanfaatkan oleh berbagai pihak?',
          'Layanan kesehatan jiwa apa saja yang telah berjalan efektif dan yang masih belum optimal?',
        ],
      },
      {
        type: 'p',
        text: 'Untuk menjawab ketiga pertanyaan tersebut, terdapat dua kegiatan utama dalam penelitian OMMHA, yaitu (1) pemetaan dan (2) analisis pemanfaatan layanan kesehatan jiwa di Kabupaten Kebumen.',
      },
      {
        type: 'p',
        text: 'Pada saat laporan ini disusun, penelitian OMMHA telah menyelesaikan pengumpulan data pemetaan layanan kesehatan jiwa di Kabupaten Kebumen. Hasil perolehan data dari proses pemetaan tersebut diuraikan pada bagian-bagian berikut dalam laporan ini. Secara umum, tujuan dari penyusunan laporan ini untuk menyampaikan perkembangan pelaksanaan penelitian OMMHA selama periode Oktober 2025 hingga Agustus 2026, termasuk rencana tindak lanjutnya.',
      },
      {
        type: 'p',
        text: 'Melalui laporan ini, diharapkan seluruh pemangku kepentingan dapat memperoleh gambaran mengenai perkembangan pelaksanaan OMMHA, sekaligus memberikan dukungan dalam penyelesaian penelitian dan pemanfaatan hasilnya untuk penguatan layanan kesehatan jiwa di Kabupaten Kebumen.',
      },
    ],
  },
];

/** Newest first. */
export function sortedPublications(): Publication[] {
  return [...PUBLICATIONS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPublication(slug: string): Publication | undefined {
  return PUBLICATIONS.find((publication) => publication.slug === slug);
}

export function formatPublicationDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Outside reading the landing page has listed since launch. These link out;
 * they have no page of their own.
 */
export const REFERENCES = [
  {
    type: 'Jurnal',
    year: '2024',
    publisher: 'World Health Organization',
    title: 'Mental Health Atlas 2020: WHO Global Report on Mental Health Services',
    description:
      'Laporan komprehensif WHO tentang status layanan kesehatan jiwa global, termasuk ketersediaan sumber daya dan kebijakan di berbagai negara.',
    href: 'https://www.who.int/publications/i/item/9789240036703',
  },
  {
    type: 'Artikel',
    year: '2023',
    publisher: 'European Journal of Psychiatry',
    title: 'DESDE-LTC: A Standardized Tool for Mental Health Service Mapping',
    description:
      'Penjelasan lengkap tentang metodologi DESDE-LTC dan penerapannya dalam pemetaan layanan kesehatan jiwa di berbagai negara Eropa.',
    href: 'https://pubmed.ncbi.nlm.nih.gov/',
  },
  {
    type: 'Laporan',
    year: '2023',
    publisher: 'Kementerian Kesehatan RI',
    title: 'Situasi Kesehatan Jiwa di Indonesia: Data dan Tantangan',
    description:
      'Analisis situasi kesehatan jiwa di Indonesia berdasarkan data Riskesdas dan tantangan dalam penyediaan layanan kesehatan jiwa.',
    href: 'https://www.kemkes.go.id',
  },
];
