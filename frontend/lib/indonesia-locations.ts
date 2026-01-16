// Indonesian province and city coordinates
export const indonesiaLocations: Record<string, { lat: number; lng: number; cities: Record<string, { lat: number; lng: number }> }> = {
  "Aceh": {
    lat: 4.695135,
    lng: 96.749397,
    cities: {
      "Banda Aceh": { lat: 5.548290, lng: 95.323753 },
      "Lhokseumawe": { lat: 5.180833, lng: 97.150000 },
      "Langsa": { lat: 4.468333, lng: 97.968333 },
    }
  },
  "Sumatera Utara": {
    lat: 2.115262,
    lng: 99.545097,
    cities: {
      "Medan": { lat: 3.595196, lng: 98.672223 },
      "Pematangsiantar": { lat: 2.964630, lng: 99.068130 },
      "Binjai": { lat: 3.600556, lng: 98.485556 },
    }
  },
  "Sumatera Barat": {
    lat: -0.732818,
    lng: 100.801438,
    cities: {
      "Padang": { lat: -0.947136, lng: 100.414047 },
      "Bukittinggi": { lat: -0.305528, lng: 100.369389 },
      "Payakumbuh": { lat: -0.226944, lng: 100.621667 },
    }
  },
  "Riau": {
    lat: 0.533301,
    lng: 101.449448,
    cities: {
      "Pekanbaru": { lat: 0.507068, lng: 101.447777 },
      "Dumai": { lat: 1.665000, lng: 101.448611 },
      "Bengkalis": { lat: 1.470000, lng: 102.160000 },
    }
  },
  "Jambi": {
    lat: -1.610000,
    lng: 103.610000,
    cities: {
      "Jambi": { lat: -1.590000, lng: 103.610000 },
      "Sungai Penuh": { lat: -2.063889, lng: 101.393889 },
    }
  },
  "Sumatera Selatan": {
    lat: -3.319480,
    lng: 104.914917,
    cities: {
      "Palembang": { lat: -2.990934, lng: 104.756554 },
      "Prabumulih": { lat: -3.431944, lng: 104.240278 },
      "Lubuklinggau": { lat: -3.299167, lng: 102.860833 },
    }
  },
  "Bengkulu": {
    lat: -3.792621,
    lng: 102.260833,
    cities: {
      "Bengkulu": { lat: -3.800000, lng: 102.266667 },
    }
  },
  "Lampung": {
    lat: -4.558333,
    lng: 105.407222,
    cities: {
      "Bandar Lampung": { lat: -5.450000, lng: 105.266667 },
      "Metro": { lat: -5.113056, lng: 105.306667 },
    }
  },
  "Kepulauan Bangka Belitung": {
    lat: -2.741667,
    lng: 106.440556,
    cities: {
      "Pangkal Pinang": { lat: -2.130000, lng: 106.113889 },
    }
  },
  "Kepulauan Riau": {
    lat: 3.945000,
    lng: 108.143611,
    cities: {
      "Batam": { lat: 1.047917, lng: 104.028056 },
      "Tanjung Pinang": { lat: 0.918611, lng: 104.458611 },
    }
  },
  "DKI Jakarta": {
    lat: -6.208763,
    lng: 106.845599,
    cities: {
      "Jakarta Pusat": { lat: -6.186486, lng: 106.834091 },
      "Jakarta Utara": { lat: -6.138816, lng: 106.863956 },
      "Jakarta Barat": { lat: -6.168359, lng: 106.763244 },
      "Jakarta Selatan": { lat: -6.277055, lng: 106.816635 },
      "Jakarta Timur": { lat: -6.225014, lng: 106.900447 },
    }
  },
  "Jawa Barat": {
    lat: -7.090911,
    lng: 107.668887,
    cities: {
      "Bandung": { lat: -6.917464, lng: 107.619125 },
      "Bekasi": { lat: -6.238270, lng: 106.975571 },
      "Depok": { lat: -6.402484, lng: 106.794241 },
      "Bogor": { lat: -6.595038, lng: 106.816635 },
      "Cimahi": { lat: -6.872273, lng: 107.542492 },
      "Tasikmalaya": { lat: -7.327169, lng: 108.220833 },
      "Cirebon": { lat: -6.706168, lng: 108.557167 },
    }
  },
  "Jawa Tengah": {
    lat: -7.150975,
    lng: 110.140259,
    cities: {
      "Semarang": { lat: -6.966667, lng: 110.416664 },
      "Surakarta": { lat: -7.575489, lng: 110.824326 },
      "Magelang": { lat: -7.479722, lng: 110.217222 },
      "Salatiga": { lat: -7.331389, lng: 110.492500 },
      "Pekalongan": { lat: -6.888611, lng: 109.675278 },
      "Tegal": { lat: -6.869444, lng: 109.140556 },
    }
  },
  "DI Yogyakarta": {
    lat: -7.797068,
    lng: 110.370529,
    cities: {
      "Yogyakarta": { lat: -7.797068, lng: 110.370529 },
      "Bantul": { lat: -7.888056, lng: 110.329722 },
      "Sleman": { lat: -7.715556, lng: 110.355833 },
    }
  },
  "Jawa Timur": {
    lat: -7.536600,
    lng: 112.238402,
    cities: {
      "Surabaya": { lat: -7.250445, lng: 112.768845 },
      "Malang": { lat: -7.983908, lng: 112.621391 },
      "Kediri": { lat: -7.816667, lng: 112.016667 },
      "Madiun": { lat: -7.630000, lng: 111.523333 },
      "Probolinggo": { lat: -7.754389, lng: 113.216667 },
      "Pasuruan": { lat: -7.645278, lng: 112.907500 },
      "Mojokerto": { lat: -7.466389, lng: 112.433889 },
      "Blitar": { lat: -8.097778, lng: 112.165556 },
    }
  },
  "Banten": {
    lat: -6.402484,
    lng: 106.064552,
    cities: {
      "Serang": { lat: -6.120000, lng: 106.150000 },
      "Tangerang": { lat: -6.178306, lng: 106.640000 },
      "Tangerang Selatan": { lat: -6.288611, lng: 106.717778 },
      "Cilegon": { lat: -6.002222, lng: 106.018889 },
    }
  },
  "Bali": {
    lat: -8.409518,
    lng: 115.188916,
    cities: {
      "Denpasar": { lat: -8.670458, lng: 115.212631 },
      "Badung": { lat: -8.550833, lng: 115.176667 },
      "Gianyar": { lat: -8.539167, lng: 115.333889 },
    }
  },
  "Nusa Tenggara Barat": {
    lat: -8.652894,
    lng: 117.361484,
    cities: {
      "Mataram": { lat: -8.583333, lng: 116.116667 },
      "Bima": { lat: -8.460000, lng: 118.716667 },
    }
  },
  "Nusa Tenggara Timur": {
    lat: -8.657222,
    lng: 121.079444,
    cities: {
      "Kupang": { lat: -10.171667, lng: 123.600000 },
    }
  },
  "Kalimantan Barat": {
    lat: -0.026500,
    lng: 109.342778,
    cities: {
      "Pontianak": { lat: -0.031389, lng: 109.323889 },
      "Singkawang": { lat: 0.903889, lng: 108.989167 },
    }
  },
  "Kalimantan Tengah": {
    lat: -1.682500,
    lng: 113.382778,
    cities: {
      "Palangkaraya": { lat: -2.213056, lng: 113.917222 },
    }
  },
  "Kalimantan Selatan": {
    lat: -3.320556,
    lng: 115.153889,
    cities: {
      "Banjarmasin": { lat: -3.316667, lng: 114.591667 },
      "Banjarbaru": { lat: -3.454444, lng: 114.838889 },
    }
  },
  "Kalimantan Timur": {
    lat: 0.538650,
    lng: 116.419389,
    cities: {
      "Balikpapan": { lat: -1.267500, lng: 116.828889 },
      "Samarinda": { lat: -0.501944, lng: 117.153889 },
      "Bontang": { lat: 0.134167, lng: 117.500000 },
    }
  },
  "Kalimantan Utara": {
    lat: 3.073889,
    lng: 116.040556,
    cities: {
      "Tarakan": { lat: 3.327778, lng: 117.635556 },
    }
  },
  "Sulawesi Utara": {
    lat: 0.623889,
    lng: 123.975000,
    cities: {
      "Manado": { lat: 1.479167, lng: 124.841944 },
      "Bitung": { lat: 1.444167, lng: 125.198889 },
      "Tomohon": { lat: 1.326667, lng: 124.838333 },
    }
  },
  "Sulawesi Tengah": {
    lat: -1.430000,
    lng: 121.445556,
    cities: {
      "Palu": { lat: -0.900000, lng: 119.866667 },
    }
  },
  "Sulawesi Selatan": {
    lat: -3.675000,
    lng: 119.898889,
    cities: {
      "Makassar": { lat: -5.135399, lng: 119.423790 },
      "Parepare": { lat: -4.016667, lng: 119.633333 },
      "Palopo": { lat: -2.992500, lng: 120.198889 },
    }
  },
  "Sulawesi Tenggara": {
    lat: -4.145833,
    lng: 122.174722,
    cities: {
      "Kendari": { lat: -3.966667, lng: 122.516667 },
      "Baubau": { lat: -5.470833, lng: 122.629167 },
    }
  },
  "Gorontalo": {
    lat: 0.544167,
    lng: 123.058889,
    cities: {
      "Gorontalo": { lat: 0.541667, lng: 123.060000 },
    }
  },
  "Sulawesi Barat": {
    lat: -2.846667,
    lng: 119.232222,
    cities: {
      "Mamuju": { lat: -2.677500, lng: 118.890000 },
    }
  },
  "Maluku": {
    lat: -3.238889,
    lng: 130.145556,
    cities: {
      "Ambon": { lat: -3.695556, lng: 128.181389 },
      "Tual": { lat: -5.628333, lng: 132.751667 },
    }
  },
  "Maluku Utara": {
    lat: 1.570000,
    lng: 127.808889,
    cities: {
      "Ternate": { lat: 0.787778, lng: 127.374444 },
      "Tidore": { lat: 0.655000, lng: 127.400000 },
    }
  },
  "Papua Barat": {
    lat: -1.336389,
    lng: 133.174444,
    cities: {
      "Manokwari": { lat: -0.866667, lng: 134.083333 },
      "Sorong": { lat: -0.866667, lng: 131.250000 },
    }
  },
  "Papua": {
    lat: -4.269928,
    lng: 138.080353,
    cities: {
      "Jayapura": { lat: -2.533333, lng: 140.716667 },
    }
  },
};

// Mock mental health services data for Indonesia
export const mockIndonesianServices = [
  // Jakarta
  { id: 1, service_name: "RS Jiwa Dr. Soeharto Heerdjan", province: "DKI Jakarta", city: "Jakarta Barat", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 450, total_staff: 120 },
  { id: 2, service_name: "RSCM Kencana", province: "DKI Jakarta", city: "Jakarta Pusat", mtc_code: "R1", bsic_code: "R1.2", verification_status: "VERIFIED", total_beds: 30, total_staff: 45 },
  { id: 3, service_name: "RS Omni Alam Sutera", province: "DKI Jakarta", city: "Jakarta Selatan", mtc_code: "R2", bsic_code: "R2.1", verification_status: "SUBMITTED", total_beds: 20, total_staff: 35 },

  // Jawa Barat
  { id: 4, service_name: "RS Jiwa Provinsi Jawa Barat", province: "Jawa Barat", city: "Bandung", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 380, total_staff: 95 },
  { id: 5, service_name: "RSUD Kota Bandung", province: "Jawa Barat", city: "Bandung", mtc_code: "R2", bsic_code: "R2.2", verification_status: "VERIFIED", total_beds: 25, total_staff: 40 },
  { id: 6, service_name: "Klinik Psikologi Bekasi", province: "Jawa Barat", city: "Bekasi", mtc_code: "O1", bsic_code: "O1.1", verification_status: "SUBMITTED", total_beds: null, total_staff: 8 },
  { id: 7, service_name: "Puskesmas Depok Mental Health", province: "Jawa Barat", city: "Depok", mtc_code: "O2", bsic_code: "O2.1", verification_status: "VERIFIED", total_beds: null, total_staff: 12 },

  // Jawa Tengah
  { id: 8, service_name: "RS Jiwa Prof. Dr. Soerojo", province: "Jawa Tengah", city: "Magelang", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 420, total_staff: 110 },
  { id: 9, service_name: "RSUD Dr. Moewardi", province: "Jawa Tengah", city: "Surakarta", mtc_code: "R2", bsic_code: "R2.1", verification_status: "VERIFIED", total_beds: 35, total_staff: 50 },
  { id: 10, service_name: "RS Jiwa Daerah Amino Gondohutomo", province: "Jawa Tengah", city: "Semarang", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 400, total_staff: 105 },

  // DI Yogyakarta
  { id: 11, service_name: "RS Jiwa Grhasia", province: "DI Yogyakarta", city: "Sleman", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 350, total_staff: 90 },
  { id: 12, service_name: "RSUP Dr. Sardjito", province: "DI Yogyakarta", city: "Yogyakarta", mtc_code: "R2", bsic_code: "R2.2", verification_status: "VERIFIED", total_beds: 28, total_staff: 42 },

  // Jawa Timur
  { id: 13, service_name: "RS Jiwa Menur", province: "Jawa Timur", city: "Surabaya", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 480, total_staff: 125 },
  { id: 14, service_name: "RS Jiwa Dr. Radjiman Wediodiningrat", province: "Jawa Timur", city: "Malang", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 360, total_staff: 92 },
  { id: 15, service_name: "RSU Haji Surabaya", province: "Jawa Timur", city: "Surabaya", mtc_code: "R2", bsic_code: "R2.1", verification_status: "SUBMITTED", total_beds: 22, total_staff: 38 },

  // Sumatera Utara
  { id: 16, service_name: "RS Jiwa Prof. Dr. M. Ildrem", province: "Sumatera Utara", city: "Medan", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 410, total_staff: 108 },
  { id: 17, service_name: "RSUP H. Adam Malik", province: "Sumatera Utara", city: "Medan", mtc_code: "R2", bsic_code: "R2.2", verification_status: "VERIFIED", total_beds: 30, total_staff: 47 },

  // Sumatera Barat
  { id: 18, service_name: "RS Jiwa Prof. HB Sa'anin", province: "Sumatera Barat", city: "Padang", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 390, total_staff: 100 },

  // Sulawesi Selatan
  { id: 19, service_name: "RS Jiwa Dadi", province: "Sulawesi Selatan", city: "Makassar", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 370, total_staff: 96 },
  { id: 20, service_name: "RSUP Dr. Wahidin Sudirohusodo", province: "Sulawesi Selatan", city: "Makassar", mtc_code: "R2", bsic_code: "R2.1", verification_status: "VERIFIED", total_beds: 26, total_staff: 41 },

  // Bali
  { id: 21, service_name: "RS Jiwa Provinsi Bali", province: "Bali", city: "Bangli", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 340, total_staff: 88 },
  { id: 22, service_name: "RSUP Sanglah", province: "Bali", city: "Denpasar", mtc_code: "R2", bsic_code: "R2.2", verification_status: "VERIFIED", total_beds: 24, total_staff: 36 },

  // Kalimantan Timur
  { id: 23, service_name: "RS Jiwa Atma Husada Mahakam", province: "Kalimantan Timur", city: "Samarinda", mtc_code: "R1", bsic_code: "R1.1", verification_status: "SUBMITTED", total_beds: 280, total_staff: 72 },

  // Riau
  { id: 24, service_name: "RS Jiwa Tampan", province: "Riau", city: "Pekanbaru", mtc_code: "R1", bsic_code: "R1.1", verification_status: "VERIFIED", total_beds: 300, total_staff: 78 },

  // Add more outpatient services
  { id: 25, service_name: "Klinik Psikologi UGM", province: "DI Yogyakarta", city: "Yogyakarta", mtc_code: "O1", bsic_code: "O1.1", verification_status: "VERIFIED", total_beds: null, total_staff: 15 },
  { id: 26, service_name: "Klinik Psikiatri Bandung", province: "Jawa Barat", city: "Bandung", mtc_code: "O1", bsic_code: "O1.2", verification_status: "SUBMITTED", total_beds: null, total_staff: 10 },
  { id: 27, service_name: "Puskesmas Kesehatan Jiwa Surabaya", province: "Jawa Timur", city: "Surabaya", mtc_code: "O2", bsic_code: "O2.1", verification_status: "VERIFIED", total_beds: null, total_staff: 18 },
  { id: 28, service_name: "Mental Health Center Jakarta", province: "DKI Jakarta", city: "Jakarta Pusat", mtc_code: "O3", bsic_code: "O3.1", verification_status: "VERIFIED", total_beds: null, total_staff: 22 },
  { id: 29, service_name: "Klinik Konseling Medan", province: "Sumatera Utara", city: "Medan", mtc_code: "O1", bsic_code: "O1.1", verification_status: "SUBMITTED", total_beds: null, total_staff: 9 },
  { id: 30, service_name: "Layanan Krisis Makassar", province: "Sulawesi Selatan", city: "Makassar", mtc_code: "O4", bsic_code: "O4.1", verification_status: "VERIFIED", total_beds: null, total_staff: 14 },
];

// Helper function to get coordinates for a service
export function getServiceCoordinates(service: { province: string; city: string }): { lat: number; lng: number } | null {
  const province = indonesiaLocations[service.province];
  if (!province) return null;

  const city = province.cities[service.city];
  if (city) return city;

  // Fallback to province center if city not found
  return { lat: province.lat, lng: province.lng };
}
