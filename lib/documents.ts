export type DocumentType = "id_card_photo" | "signature" | "certificate" | "result" | "other";
export type OwnerType = "student" | "teacher" | "staff" | "institution";

export type SchoolDocument = {
  _id: string;
  title?: string;
  type: DocumentType;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: { name?: string; email?: string; role?: string };
  userId?: string;
  isPublic?: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export const DOCUMENT_TYPES: { value: DocumentType; label: string; description: string }[] = [
  { value: "id_card_photo", label: "ID Card Photos", description: "Profile photos and ID card assets" },
  { value: "signature", label: "Signatures", description: "Authorized signature files" },
  { value: "certificate", label: "Certificates", description: "Academic and administrative certificates" },
  { value: "result", label: "Results", description: "Marksheets and result documents" },
  { value: "other", label: "Other Documents", description: "General institutional files" },
];

export const OWNER_TYPES: { value: OwnerType; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "teacher", label: "Teacher" },
  { value: "staff", label: "Staff" },
  { value: "institution", label: "Institution" },
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function documentTypeLabel(type?: string) {
  return DOCUMENT_TYPES.find((item) => item.value === type)?.label || "Other Documents";
}

export function formatFileSize(size = 0) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  return `${(size / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getDocumentUrl(fileUrl?: string) {
  if (!fileUrl) return "";
  if (/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) return fileUrl;
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  return `${apiBase.replace(/\/api\/?$/, "")}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
}

export function validateDocumentFile(file: File) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return "Only JPG, PNG, PDF, DOC and DOCX files are allowed.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File size must be 5 MB or smaller.";
  }
  return "";
}

export function getOwnerMeta(document: SchoolDocument) {
  const tags = document.tags || [];
  const ownerType = tags.find((tag) => tag.startsWith("ownerType:"))?.replace("ownerType:", "");
  const ownerName = tags.find((tag) => tag.startsWith("ownerName:"))?.replace("ownerName:", "");
  return {
    ownerType: ownerType || "institution",
    ownerName: ownerName || (ownerType ? ownerType : "Institution"),
  };
}
