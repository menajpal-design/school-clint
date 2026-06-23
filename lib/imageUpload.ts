/**
 * Client-side image upload helper
 * Uploads images to the server's MongoDB GridFS via /api/images/upload
 */

import { apiClient, API_URL } from './api';

const MIN_UPLOAD_IMAGE_BYTES = 50 * 1024;
const MAX_UPLOAD_IMAGE_BYTES = 500 * 1024;
const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1100;
const MIN_IMAGE_QUALITY = 0.46;
const MAX_IMAGE_QUALITY = 0.92;

export interface ImageUploadResult {
  url: string;
  fileId: string;
  filename: string;
  size: number;
  contentType: string;
}

function canCompressInBrowser(file: File) {
  const hasCompressibleExtension = /\.(png|jpe?g|webp)$/i.test(file.name || '');
  return typeof window !== 'undefined'
    && typeof document !== 'undefined'
    && (/^image\/(png|jpe?g|webp)$/i.test(file.type) || hasCompressibleExtension);
}

async function loadBitmap(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try {
    await image.decode();
    return image;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Image compression failed.'));
    }, type, quality);
  });
}

async function renderCompressedBlob(
  image: HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  maxDimension: number,
  quality: number,
  type = 'image/webp'
) {
  const scale = maxDimension / Math.max(sourceWidth, sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(image, 0, 0, width, height);

  return canvasToBlob(canvas, type, quality);
}

async function compressImageForUpload(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error('Image is too large. Please choose an image under 15MB.');
  }
  if (!canCompressInBrowser(file)) {
    if (file.size < MIN_UPLOAD_IMAGE_BYTES || file.size > MAX_UPLOAD_IMAGE_BYTES) {
      throw new Error('Image must be between 50KB and 500KB.');
    }
    return file;
  }

  const image = await loadBitmap(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  let maxDimension = MAX_IMAGE_DIMENSION;
  let quality = file.size < MIN_UPLOAD_IMAGE_BYTES ? MAX_IMAGE_QUALITY : 0.82;
  let blob = await renderCompressedBlob(image, sourceWidth, sourceHeight, maxDimension, quality);

  while (blob && blob.size > MAX_UPLOAD_IMAGE_BYTES && quality > MIN_IMAGE_QUALITY) {
    quality = Math.max(MIN_IMAGE_QUALITY, quality - 0.08);
    blob = await renderCompressedBlob(image, sourceWidth, sourceHeight, maxDimension, quality);
  }
  while (blob && blob.size > MAX_UPLOAD_IMAGE_BYTES && maxDimension > 420) {
    maxDimension = Math.max(420, Math.round(maxDimension * 0.78));
    blob = await renderCompressedBlob(image, sourceWidth, sourceHeight, maxDimension, MIN_IMAGE_QUALITY);
  }
  while (blob && blob.size < MIN_UPLOAD_IMAGE_BYTES && maxDimension < 1600) {
    maxDimension = Math.min(1600, Math.round(maxDimension * 1.25));
    blob = await renderCompressedBlob(image, sourceWidth, sourceHeight, maxDimension, MAX_IMAGE_QUALITY);
  }
  if (blob && blob.size < MIN_UPLOAD_IMAGE_BYTES) {
    const pngBlob = await renderCompressedBlob(image, sourceWidth, sourceHeight, Math.max(maxDimension, 1600), 1, 'image/png');
    if (pngBlob && pngBlob.size >= MIN_UPLOAD_IMAGE_BYTES && pngBlob.size <= MAX_UPLOAD_IMAGE_BYTES) {
      blob = pngBlob;
    }
  }

  if (!blob) return file;
  if (blob.size < MIN_UPLOAD_IMAGE_BYTES || blob.size > MAX_UPLOAD_IMAGE_BYTES) {
    throw new Error('Image must be between 50KB and 500KB after compression. Please crop or choose a different image.');
  }
  const safeName = file.name.replace(/\.[^.]+$/, '') || 'image';
  const extension = blob.type === 'image/png' ? 'png' : 'webp';
  return new File([blob], `${safeName}.${extension}`, { type: blob.type || 'image/webp', lastModified: Date.now() });
}

export async function imageFileToDataUrl(file: File): Promise<string> {
  const preparedFile = await compressImageForUpload(file);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(preparedFile);
  });
}

/**
 * Upload a single image File to GridFS.
 * Returns the public URL (/api/images/:id) and fileId.
 *
 * @param file       File object from <input type="file" />
 * @param category   Optional category tag (e.g. 'logo', 'seal', 'avatar', 'document')
 */
export async function uploadImage(
  file: File,
  category = 'general'
): Promise<ImageUploadResult> {
  const preparedFile = await compressImageForUpload(file);
  const formData = new FormData();
  formData.append('image', preparedFile);
  formData.append('category', category);

  const data: any = await apiClient.post('/images/upload', formData);
  return {
    url: data.url,
    fileId: data.fileId,
    filename: data.filename,
    size: data.size,
    contentType: data.contentType,
  };
}

/**
 * Upload institution-specific images (logo, seal, headSignature).
 * Uses a dedicated endpoint that also saves the URL to the institution record.
 *
 * @param file        Image file
 * @param imageType   'logo' | 'seal' | 'headSignature'
 */
export async function uploadInstitutionImage(
  file: File,
  imageType: 'logo' | 'seal' | 'headSignature'
): Promise<{ url: string; fileId: string }> {
  const preparedFile = await compressImageForUpload(file);
  const formData = new FormData();
  formData.append('image', preparedFile);
  formData.append('imageType', imageType);

  const data: any = await apiClient.post('/institution/upload-image', formData);
  return { url: data.url, fileId: data.fileId };
}

/**
 * Delete an image from GridFS by its fileId or full /api/images/:id URL.
 */
export async function deleteImage(fileIdOrUrl: string): Promise<void> {
  const fileId = fileIdOrUrl.match(/\/api\/images\/([a-f0-9]{24})/i)?.[1] || fileIdOrUrl;
  await apiClient.delete(`/images/${fileId}`);
}

/**
 * Build a full absolute image URL from a relative /api/images/:id path.
 * Falls back to the value as-is (for old imgBB URLs etc.)
 */
export function resolveImageUrl(value?: string | null): string {
  if (!value) return '';
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  if (value.startsWith('/api/images/')) {
    // In browser: prepend API base
    if (typeof window !== 'undefined') {
      const base = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api$/, '');
      return `${base}${value}`;
    }
  }
  return value;
}
