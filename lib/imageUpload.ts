/**
 * Client-side image upload helper
 * Uploads images to the server's MongoDB GridFS via /api/images/upload
 */

import { apiClient, API_URL } from './api';

export interface ImageUploadResult {
  url: string;
  fileId: string;
  filename: string;
  size: number;
  contentType: string;
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
  const formData = new FormData();
  formData.append('image', file);
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
  const formData = new FormData();
  formData.append('image', file);
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
