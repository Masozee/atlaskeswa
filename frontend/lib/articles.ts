import type { Block } from '@/lib/publications';

/**
 * Long-form explainers that the landing and about pages tease with a
 * "Selengkapnya" link. Written as the same content blocks as publications so
 * one renderer typesets both; prose accepts `*italic*` and `[label](href)`.
 */
export interface Article {
  title: string;
  description: string;
  /** Breadcrumb parent, between Beranda and the article. */
  parent?: { href: string; label: string };
  cover?: { src: string; alt: string; width: number; height: number };
  body: Block[];
}

/* Shared by the teaser on the landing page and the article itself. */
export const KLASIFIKASI_INTRO = [
  'Salah satu kerangka konseptual yang digunakan dalam Penelitian OMMHA adalah DESDE-LTC (*Description and Evaluation of Services and Directories for Long-Term Care*). Kerangka ini merupakan pengembangan dari *European Service Mapping Schedule* (ESMS), yang kemudian berkembang menjadi DESDE dan selanjutnya menjadi DESDE-LTC sebagai sistem klasifikasi layanan yang komprehensif untuk *long-term care* dan layanan kesehatan-sosial (Salvador-Carulla *et al.*, 2015). Dengan menggunakan kerangka ini dimungkinkan untuk melakukan kategorisasi layanan kesehatan berdasarkan fungsi layanan, sehingga identifikasi tidak berdasarkan nama lembaga atau istilah tertentu yang digunakan.',
  'DESDE-LTC relevan untuk digunakan dalam Penelitian OMMHA, karena layanan kesehatan jiwa mencakup beragam bentuk layanan dan termasuk perawatan jangka panjang (*long-term care*). Meskipun demikian, penerapannya memerlukan adaptasi agar sesuai dengan konteks Indonesia dan Kabupaten Kebumen sebagai lokasi penelitian. Proses adaptasi ini penting untuk dilakukan karena sistem layanan kesehatan jiwa merupakan sistem yang kompleks, sehingga batasan antarsektor, jenis penyedia layanan, serta fungsi layanan tidak selalu tegas (Romero *et al.*, 2011). Selain itu, sistem layanan kesehatan jiwa dibentuk oleh interaksi berbagai faktor struktural atau kontekstual, termasuk faktor politik, sosial, historis, penyedia layanan, organisasi, dan pengguna layanan, yang membentuk pola hubungan dinamis dalam layanan kesehatan jiwa (Ellis *et al.*, 2017).',
];

export const KLASIFIKASI_OMMHA: Article = {
  title: 'Klasifikasi OMMHA untuk Pemetaan Layanan Kesehatan Jiwa di Kabupaten Kebumen',
  description:
    'Bagaimana kerangka DESDE-LTC diadaptasi menjadi Klasifikasi OMMHA dengan 10 cabang, lalu diuji melalui survei pemetaan layanan kesehatan jiwa di Kabupaten Kebumen.',
  cover: {
    src: '/beranda/klasifikasi-ommha.jpg',
    alt: 'Foto bersama peserta Kick Off Meeting Penelitian OMMHA di Kebumen, 30 Desember 2025',
    width: 1431,
    height: 1073,
  },
  body: [
    ...KLASIFIKASI_INTRO.map((text): Block => ({ type: 'p', text })),
    {
      type: 'p',
      text: 'Dengan mempertimbangkan beberapa hal tersebut, proses adaptasi yang dilakukan dalam Penelitian OMMHA tidak hanya sebatas pada penerjemahan versi asli DESDE-LTC ke dalam Bahasa Indonesia, tetapi juga memerlukan penyesuaian secara konseptual, terminologi, teknis, dan operasional. Penyesuaian secara konseptual dan terminologi utamanya dilakukan pada struktur klasifikasinya, di mana dari 6 cabang utama DESDE-LTC dikembangkan menjadi 10 cabang dalam Klasifikasi OMMHA.',
    },
    {
      type: 'p',
      text: 'Dalam Klasifikasi OMMHA yang merupakan hasil adaptasi dari Klasifikasi DESDE-LTC, kode (R)esidential, (D)ay Care, (O)utpatient, (A)ccessibility, dan (I)nformation digunakan untuk mengelompokkan jenis-jenis layanan kesehatan jiwa pada fasilitas kesehatan. Sementara itu, kode (S)elf-Help and Voluntary dikembangkan menjadi SR, SD, SO, SA, dan SI untuk mengelompokkan jenis-jenis layanan kesehatan jiwa pada penyedia non-fasilitas kesehatan. Dengan demikian, cakupan S dalam Klasifikasi OMMHA diperluas dari pengertian *Self-Help & Voluntary Care* pada kerangka asal.',
    },
    {
      type: 'diagram',
      diagram: 'desde-adaptation',
      caption: 'Gambar 1. Adaptasi Klasifikasi DESDE-LTC menjadi Klasifikasi OMMHA',
    },
    {
      type: 'p',
      text: 'Secara lengkap, bagan Klasifikasi OMMHA yang dihasilkan dari proses adaptasi adalah sebagai berikut:',
    },
    {
      type: 'diagram',
      diagram: 'ommha-classification',
      caption: 'Gambar 2. Klasifikasi OMMHA',
    },
    {
      type: 'p',
      text: 'Selain penyesuaian pada struktur klasifikasinya dari 6 menjadi 10 cabang, adaptasi juga mencakup aspek teknis dan operasionalisasinya dalam penetapan kode-kode jenis layanan. Untuk menguji penerapan alur Klasifikasi OMMHA tersebut, tiap kode dan cabangnya dijabarkan menjadi pertanyaan dan pilihan jawaban, dilengkapi dengan definisi operasional dan pola lompatnya mengikuti alur logis Klasifikasi OMMHA. Keluaran dari proses adaptasi ini berupa Kuesioner OMMHA yang selanjutnya digunakan untuk melaksanakan survei pemetaan layanan kesehatan jiwa di Kabupaten Kebumen.',
    },
    {
      type: 'p',
      text: 'Survei yang dilaksanakan pada rentang waktu Juni hingga Agustus 2026 pada sisi yang lain digunakan untuk menguji apakah penetapan tiap kode jenis layanan dalam Klasifikasi OMMHA sudah berjalan atau belum. Dari hasil pemetaan diketahui bahwa Klasifikasi OMMHA dapat berjalan dengan baik dan mampu menghasilkan kode-kode jenis layanan kesehatan jiwa di tiap penyedia layanan sebagaimana ditampilkan dalam [Atlas Layanan Kesehatan Jiwa Kabupaten Kebumen](/).',
    },
    {
      type: 'p',
      text: 'Operasionalisasi penetapan kode juga diuji melalui penerapan 2 cara yang berbeda untuk pemetaan antara penyedia layanan formal (berbasis lembaga/institusi) dengan penyedia layanan non-formal atau praktik individu/praktisi. Untuk penyedia layanan formal, pemetaan dilakukan dengan menggunakan aplikasi survei, di mana kode jenis-jenis layanan kesehatan jiwa yang diperoleh didasarkan pada tiap jawaban dari penyedia layanan yang menggambarkan layanan kesehatan jiwa yang diselenggarakan. Sementara itu, untuk penyedia layanan non-formal, di mana layanan yang diselenggarakan cenderung tidak terstruktur, dilakukan wawancara mendalam untuk menggali gambaran layanan yang selama ini dilakukan. Semua jawaban yang diperoleh dari hasil wawancara ini selanjutnya ditetapkan kodenya dengan mengacu pada Klasifikasi OMMHA.',
    },
    {
      type: 'p',
      text: 'Berdasarkan pengalaman penerapan Klasifikasi OMMHA di Kabupaten Kebumen tersebut, diharapkan dapat menjadi bukti bahwa hasil adaptasi dapat digunakan untuk konteks wilayah yang lain karena telah teruji dan valid untuk digunakan.',
    },
  ],
};

/* Shared by the teaser on the about page and the article itself. */
export const OMMHA_INTRO = [
  '**OMMHA** merupakan studi percontohan untuk mengembangkan Atlas Layanan Kesehatan Jiwa, yaitu sistem informasi geospasial yang memetakan keberadaan, persebaran, dan jenis-jenis layanan kesehatan jiwa secara komprehensif dan terstandar. Standardisasi klasifikasi jenis-jenis layanan diperlukan karena setiap penyedia layanan dapat memiliki bentuk kelembagaan, cara penyelenggaraan, dan istilah yang berbeda dalam menyebut layanan yang diberikan. Perbedaan tersebut dapat menyulitkan proses identifikasi dan perbandingan ketersediaan layanan antarpenyedia maupun antarwilayah. Melalui klasifikasi yang terstandar, layanan yang diselenggarakan oleh berbagai institusi dapat dipetakan dan dibandingkan berdasarkan fungsi layanan yang benar-benar diberikan kepada masyarakat, bukan hanya berdasarkan nama atau bentuk lembaganya.',
  'Penelitian OMMHA memiliki dua tujuan utama. Pertama, memetakan jenis-jenis layanan kesehatan jiwa yang tersedia di Kabupaten Kebumen menggunakan klasifikasi layanan kesehatan jiwa yang terstandar. Kedua, memahami bagaimana layanan kesehatan jiwa di Kabupaten Kebumen diakses dan dimanfaatkan, baik pada layanan berbasis fasilitas kesehatan maupun non-fasilitas kesehatan. Pemanfaatan layanan tersebut dipelajari dari perspektif pasien, keluarga atau *caregiver*, penyedia layanan, tenaga kesehatan, pengelola layanan, dan pembuat kebijakan.',
];

export const MITRA_TEXT =
  'Penelitian OMMHA dilaksanakan melalui kolaborasi antara Pusat Rehabilitasi YAKKUM, Badan Riset dan Inovasi Nasional (BRIN), Kementerian Kesehatan Republik Indonesia, Universitas Katolik Indonesia Atma Jaya, dan *The University of Sydney*, dengan dukungan KONEKSI–*Department of Foreign Affairs and Trade* (DFAT). Penelitian ini juga melibatkan Kelompok Penasihat Penelitian di tingkat nasional dan Kabupaten Kebumen, serta Kelompok Teknis Pengembang Atlas Layanan Kesehatan Jiwa Kabupaten Kebumen sebagai *co-designer*. Pelibatan berbagai pihak tersebut bertujuan memastikan agar proses dan hasil penelitian sesuai dengan konteks kebijakan, sistem layanan, serta kebutuhan masyarakat.';

export const TENTANG_OMMHA: Article = {
  title: 'One Map for Mental Health Atlas (OMMHA)',
  description:
    'Tujuan, metode, cakupan, mitra, dan luaran Penelitian OMMHA di Kabupaten Kebumen, Jawa Tengah.',
  parent: { href: '/tentang-kami', label: 'Tentang kami' },
  body: [
    ...OMMHA_INTRO.map((text): Block => ({ type: 'p', text })),
    {
      type: 'p',
      text: 'Penelitian ini menggunakan pendekatan *mixed methods* yang memadukan metode kuantitatif dan kualitatif. Klasifikasi layanan dikembangkan dengan mengadaptasi kerangka *Description and Evaluation of Services and Directories for Long-Term Care* (DESDE-LTC), sedangkan penjaminan mutu proses adaptasinya menggunakan *Global Impact Analytics Framework* (GIAF). Pengumpulan data dilakukan melalui survei pemetaan, wawancara mendalam, dan *Focus Group Discussion* (FGD).',
    },
    {
      type: 'p',
      text: 'Survei pemetaan mencakup berbagai penyedia layanan kesehatan jiwa di Kabupaten Kebumen. Penyedia tersebut meliputi fasilitas kesehatan, seperti Rumah Sakit, Puskesmas, Biro atau Klinik Psikologi, dan Praktik Dokter Mandiri, serta penyedia non-fasilitas kesehatan, seperti lembaga sosial dan keagamaan, organisasi berbasis komunitas, Kader Kesehatan, Posyandu Jiwa, Tenaga Kesejahteraan Sosial Kecamatan (TKSK), serta penyedia layanan berbasis agama dan tradisi. Cakupan ini digunakan untuk menggambarkan keragaman layanan kesehatan jiwa yang tersedia dan dimanfaatkan oleh masyarakat.',
    },
    {
      type: 'p',
      text: 'Penelitian OMMHA dilaksanakan pada Oktober 2025 sampai dengan Maret 2027 di Kabupaten Kebumen, Jawa Tengah. Pemilihan Kabupaten Kebumen merupakan bagian dari kelanjutan komitmen Pusat Rehabilitasi YAKKUM dalam mendukung penguatan layanan kesehatan jiwa di wilayah tersebut. Sejak 2023, Pusat Rehabilitasi YAKKUM telah menjalankan Program DIGNITY (*Disability Inclusion Through Strengthening Local to National Policy and Capacity*) di Kabupaten Kebumen. Salah satu tujuan program tersebut adalah mendorong terpenuhinya akses penyandang disabilitas psikososial terhadap layanan yang inklusif dan nondiskriminatif, serta memberikan perlindungan dari kekerasan.',
    },
    { type: 'p', text: MITRA_TEXT },
    {
      type: 'p',
      text: 'Luaran utama penelitian ini adalah [Atlas Layanan Kesehatan Jiwa Kabupaten Kebumen](/) berbasis Sistem Informasi Geografis (GIS), yang dapat diakses oleh publik melalui portal web. Penelitian ini juga menghasilkan [Klasifikasi OMMHA](/klasifikasi-ommha) sebagai hasil adaptasi DESDE-LTC ke dalam konteks penyelenggaraan layanan kesehatan jiwa di Kabupaten Kebumen.',
    },
    {
      type: 'p',
      text: 'Atlas dan klasifikasi tersebut diharapkan dapat menyediakan informasi yang lebih utuh mengenai persebaran, keragaman, dan karakteristik layanan kesehatan jiwa. Hasil penelitian dapat dimanfaatkan untuk mengidentifikasi kesenjangan layanan, mendukung perencanaan dan pengambilan kebijakan berbasis bukti, serta memperkuat koordinasi dan kolaborasi lintas lembaga dalam meningkatkan akses dan kualitas layanan kesehatan jiwa.',
    },
  ],
};
