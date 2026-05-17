'use client';

import { useEffect } from 'react';

const MAX_IMAGE_UPLOAD_BYTES = 100 * 1024;
const RECOMMENDED_MIN_IMAGE_BYTES = 50 * 1024;
const MAX_IMAGE_UPLOAD_LABEL = '100KB';
const RECOMMENDED_IMAGE_LABEL = '50KB–100KB';

function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name);
}

function shouldValidateInput(input: HTMLInputElement, files: File[]) {
  const accept = String(input.getAttribute('accept') || '').toLowerCase();
  return accept.includes('image') || files.some(isImageFile);
}

function formatKb(bytes: number) {
  return `${Math.ceil(bytes / 1024)}KB`;
}

function showImageSizeError(file: File) {
  const message = `Image upload size limit: ${MAX_IMAGE_UPLOAD_LABEL}.\n\nSelected: ${file.name} (${formatKb(file.size)}).\nPlease compress/crop the image and keep it within ${RECOMMENDED_IMAGE_LABEL}.`;
  window.alert(message);
}

export function validateImageUploadFiles(files: FileList | File[] | null | undefined) {
  const list = Array.from(files || []);
  const imageFiles = list.filter(isImageFile);
  const tooLarge = imageFiles.find((file) => file.size > MAX_IMAGE_UPLOAD_BYTES);
  if (tooLarge) {
    showImageSizeError(tooLarge);
    return false;
  }
  return true;
}

export function ImageUploadGuard() {
  useEffect(() => {
    const onChangeCapture = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target || target.tagName !== 'INPUT' || target.type !== 'file') return;
      const files = Array.from(target.files || []);
      if (!files.length || !shouldValidateInput(target, files)) return;
      const tooLarge = files.find((file) => isImageFile(file) && file.size > MAX_IMAGE_UPLOAD_BYTES);
      if (!tooLarge) return;
      event.preventDefault();
      event.stopPropagation();
      showImageSizeError(tooLarge);
      target.value = '';
    };

    document.addEventListener('change', onChangeCapture, true);
    return () => document.removeEventListener('change', onChangeCapture, true);
  }, []);

  return null;
}
