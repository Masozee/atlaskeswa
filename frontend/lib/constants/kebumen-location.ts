/**
 * Kebumen Location Constants
 * Fixed location data for surveys in Kebumen district
 * Codes from 33.05_kecamatan.geojson
 */

export const PROVINSI = 'Jawa Tengah';
export const KABUPATEN = 'Kebumen';

// Database IDs for fixed geographic units (from GeographicUnit table)
export const PROVINSI_ID = 1;  // Jawa Tengah
export const KABUPATEN_ID = 2; // Kebumen

// Kecamatan data with codes from geojson (kd_kecamatan)
export const KECAMATAN_DATA = [
  { code: '015', name: 'Adimulyo' },
  { code: '011', name: 'Alian' },
  { code: '007', name: 'Ambal' },
  { code: '001', name: 'Ayah' },
  { code: '023', name: 'Bonorowo' },
  { code: '002', name: 'Buayan' },
  { code: '006', name: 'Buluspesantren' },
  { code: '019', name: 'Gombong' },
  { code: '020', name: 'Karanganyar' },
  { code: '021', name: 'Karanggayam' },
  { code: '026', name: 'Karangsambung' },
  { code: '012', name: 'Kebumen' },
  { code: '005', name: 'Klirong' },
  { code: '010', name: 'Kutowinangun' },
  { code: '016', name: 'Kuwarasan' },
  { code: '008', name: 'Mirit' },
  { code: '024', name: 'Padureso' },
  { code: '013', name: 'Pejagoan' },
  { code: '004', name: 'Petanahan' },
  { code: '025', name: 'Poncowarno' },
  { code: '009', name: 'Prembun' },
  { code: '003', name: 'Puring' },
  { code: '017', name: 'Rowokele' },
  { code: '022', name: 'Sadang' },
  { code: '018', name: 'Sempor' },
  { code: '014', name: 'Sruweng' },
] as const;

// Legacy list for backwards compatibility (just names)
export const KECAMATAN_LIST = KECAMATAN_DATA.map(k => k.name);

export type Kecamatan = typeof KECAMATAN_DATA[number]['name'];

// Helper to get kecamatan name from code
export function getKecamatanName(code: string): string | undefined {
  return KECAMATAN_DATA.find(k => k.code === code)?.name;
}

// Helper to get kecamatan code from name
export function getKecamatanCode(name: string): string | undefined {
  return KECAMATAN_DATA.find(k => k.name === name)?.code;
}

export interface LocationData {
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  koordinat: {
    latitude: number | null;
    longitude: number | null;
  };
}

export const DEFAULT_LOCATION: LocationData = {
  provinsi: PROVINSI,
  kabupaten: KABUPATEN,
  kecamatan: '',
  desa: '',
  koordinat: {
    latitude: null,
    longitude: null,
  },
};
