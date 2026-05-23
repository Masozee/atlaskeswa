import * as FileSystem from 'expo-file-system/legacy';

type PickedImageAsset = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  base64?: string | null;
};

export type UploadImageSource = {
  uri: string;
  fileName: string;
  mimeType: string;
  fileSize?: number | null;
};

const extensionFromMimeType = (mimeType?: string | null) => {
  switch (mimeType?.toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
    case 'image/heif':
      return 'heic';
    default:
      return 'jpg';
  }
};

const inferMimeType = (fileName: string, mimeType?: string | null) => {
  if (mimeType) return mimeType;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'heic') return 'image/heic';
  if (ext === 'heif') return 'image/heif';
  return 'image/jpeg';
};

const safeFileName = (name: string, mimeType?: string | null) => {
  const fallbackExt = extensionFromMimeType(mimeType);
  const baseName = name
    .split('?')[0]
    .split('/')
    .pop()
    ?.trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_') || `photo_${Date.now()}.${fallbackExt}`;

  return baseName.includes('.') ? baseName : `${baseName}.${fallbackExt}`;
};

export const prepareImageForUpload = async (
  asset: PickedImageAsset,
  prefix = 'photo'
): Promise<UploadImageSource> => {
  const originalName = asset.fileName || asset.uri || `${prefix}_${Date.now()}.jpg`;
  const fileName = safeFileName(originalName, asset.mimeType);
  const mimeType = inferMimeType(fileName, asset.mimeType);

  if (!FileSystem.documentDirectory) {
    console.warn('[ImageUpload] documentDirectory not available, using original URI');
    return { uri: asset.uri, fileName, mimeType, fileSize: asset.fileSize };
  }

  const uploadDir = `${FileSystem.documentDirectory}upload-images/`;
  const storedUri = `${uploadDir}${Date.now()}_${fileName}`;

  try {
    await FileSystem.makeDirectoryAsync(uploadDir, { intermediates: true });

    // STRATEGY 1: Write from base64 — most reliable in production APK.
    // The ImagePicker result always includes base64 when we pass `base64: true`.
    if (asset.base64) {
      await FileSystem.writeAsStringAsync(storedUri, asset.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const info = await FileSystem.getInfoAsync(storedUri);
      if (info.exists) {
        console.log('[ImageUpload] Saved via base64 →', storedUri);
        return {
          uri: storedUri,
          fileName,
          mimeType,
          fileSize: info.exists ? info.size : asset.fileSize,
        };
      }
    }

    // STRATEGY 2: Copy from URI (works for file:// URIs; may fail for content:// in APK).
    try {
      await FileSystem.copyAsync({ from: asset.uri, to: storedUri });
      const info = await FileSystem.getInfoAsync(storedUri);
      if (info.exists) {
        console.log('[ImageUpload] Saved via copy →', storedUri);
        return {
          uri: storedUri,
          fileName,
          mimeType,
          fileSize: info.exists ? info.size : asset.fileSize,
        };
      }
    } catch (copyError) {
      console.warn('[ImageUpload] copyAsync failed (likely content:// URI):', copyError);
    }

    // STRATEGY 3: Fallback — return the original URI directly.
    // In Expo Go this works; in a production APK content:// URIs usually work for
    // display but may fail when serialized to SQLite and read back later.
    console.warn('[ImageUpload] All copy strategies failed, falling back to original URI:', asset.uri);
    return { uri: asset.uri, fileName, mimeType, fileSize: asset.fileSize };
  } catch (error) {
    console.warn('[ImageUpload] Unexpected error, falling back to original URI:', error);
    return { uri: asset.uri, fileName, mimeType, fileSize: asset.fileSize };
  }
};
