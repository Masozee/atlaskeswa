'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROVINSI, KABUPATEN, KECAMATAN_LIST, LocationData } from '@/lib/constants/kebumen-location';
import { Location01Icon, Loading03Icon } from 'hugeicons-react';

interface LocationInputProps {
  value: LocationData | null;
  onChange: (value: LocationData) => void;
  error?: string;
  required?: boolean;
}

export function LocationInput({ value, onChange, error, required }: LocationInputProps) {
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Initialize with default values
  const currentValue: LocationData = value || {
    provinsi: PROVINSI,
    kabupaten: KABUPATEN,
    kecamatan: '',
    desa: '',
    koordinat: { latitude: null, longitude: null },
  };

  const handleKecamatanChange = (kecamatan: string) => {
    onChange({
      ...currentValue,
      kecamatan,
    });
  };

  const handleDesaChange = (desa: string) => {
    onChange({
      ...currentValue,
      desa,
    });
  };

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    setIsGettingLocation(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          ...currentValue,
          koordinat: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
        });
        setIsGettingLocation(false);
      },
      (err) => {
        let errorMessage = 'Gagal mendapatkan lokasi';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Akses lokasi ditolak. Silakan izinkan akses lokasi di browser Anda.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Waktu permintaan lokasi habis.';
            break;
        }
        setGeoError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [currentValue, onChange]);

  const hasCoordinates = currentValue.koordinat.latitude !== null && currentValue.koordinat.longitude !== null;

  return (
    <div className="space-y-4">
      {/* Provinsi - Fixed */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Provinsi
        </Label>
        <Input
          value={PROVINSI}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Kabupaten - Fixed */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Kabupaten/Kota
        </Label>
        <Input
          value={KABUPATEN}
          disabled
          className="bg-muted"
        />
      </div>

      {/* Kecamatan - Dropdown */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Kecamatan {required && <span className="text-destructive">*</span>}
        </Label>
        <Select
          value={currentValue.kecamatan}
          onValueChange={handleKecamatanChange}
        >
          <SelectTrigger className={!currentValue.kecamatan && error ? 'border-destructive' : ''}>
            <SelectValue placeholder="-- Pilih Kecamatan --" />
          </SelectTrigger>
          <SelectContent>
            {KECAMATAN_LIST.map((kec) => (
              <SelectItem key={kec} value={kec}>
                {kec}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desa - Text Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Desa/Kelurahan {required && <span className="text-destructive">*</span>}
        </Label>
        <Input
          value={currentValue.desa}
          onChange={(e) => handleDesaChange(e.target.value)}
          placeholder="Masukkan nama desa/kelurahan"
          className={!currentValue.desa && error ? 'border-destructive' : ''}
        />
      </div>

      {/* Koordinat - Auto-fill */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Koordinat {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex gap-2">
          <Input
            value={hasCoordinates
              ? `${currentValue.koordinat.latitude?.toFixed(6)}, ${currentValue.koordinat.longitude?.toFixed(6)}`
              : ''
            }
            disabled
            placeholder="Klik tombol untuk mendapatkan koordinat"
            className={`flex-1 bg-muted ${!hasCoordinates && error ? 'border-destructive' : ''}`}
          />
          <Button
            type="button"
            variant="outline"
            onClick={getLocation}
            disabled={isGettingLocation}
            className="shrink-0"
          >
            {isGettingLocation ? (
              <Loading03Icon className="h-4 w-4 animate-spin" />
            ) : (
              <Location01Icon className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">
              {isGettingLocation ? 'Mencari...' : 'Dapatkan Lokasi'}
            </span>
          </Button>
        </div>
        {geoError && (
          <p className="text-sm text-destructive">{geoError}</p>
        )}
        {!hasCoordinates && required && (
          <p className="text-sm text-muted-foreground">
            Koordinat harus diisi sebelum menyimpan survei
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
