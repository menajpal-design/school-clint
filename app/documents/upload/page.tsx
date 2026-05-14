"use client";

import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, Search, UploadCloud, X } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  DOCUMENT_TYPES,
  OWNER_TYPES,
  type DocumentType,
  type OwnerType,
  formatFileSize,
  validateDocumentFile,
} from "@/lib/documents";
import { cn } from "@/lib/utils";

export default function DocumentsUploadPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>("certificate");
  const [ownerType, setOwnerType] = useState<OwnerType>("student");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [owners, setOwners] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const loadOwners = async () => {
    setSelectedOwner(null);
    if (ownerType === "institution") {
      const data = await api.institution.profile() as any;
      setOwners([{ _id: data.institution?._id || "institution", userId: { name: data.institution?.name || "Institution" } }]);
      setSelectedOwner({ _id: data.institution?._id || "institution", userId: { name: data.institution?.name || "Institution" } });
      return;
    }
    const data = ownerType === "student"
      ? await api.students.getAll() as any
      : ownerType === "teacher"
        ? await api.teachers.getAll() as any
        : await api.staff.getAll() as any;
    const people = data.students || data.teachers || data.staff || [];
    const query = ownerSearch.trim().toLowerCase();
    setOwners(query ? people.filter((person: any) => [
      person.userId?.name,
      person.userId?.email,
      person.rollNumber,
      person.employeeId,
      person.department,
    ].some((value) => String(value || "").toLowerCase().includes(query))) : people);
  };

  useEffect(() => {
    loadOwners().catch(() => setOwners([]));
  }, [ownerType]);

  const handleFile = (nextFile?: File) => {
    setMessage("");
    setError("");
    if (!nextFile) return;
    const validationError = validateDocumentFile(nextFile);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }
    setFile(nextFile);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
  };

  const upload = async () => {
    setError("");
    setMessage("");
    if (!file) {
      setError("Select a file before uploading.");
      return;
    }
    if (!selectedOwner) {
      setError("Select an owner before uploading.");
      return;
    }

    const ownerName = selectedOwner.userId?.name || selectedOwner.name || "Institution";
    const ownerUserId = selectedOwner.userId?._id;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.[^/.]+$/, ""));
    formData.append("type", documentType);
    formData.append("ownerType", ownerType);
    formData.append("ownerId", selectedOwner._id);
    formData.append("isPublic", ownerType === "institution" ? "true" : "false");
    formData.append("tags", [`ownerType:${ownerType}`, `ownerId:${selectedOwner._id}`, `ownerName:${ownerName}`].join(","));
    if (ownerUserId) formData.append("userId", ownerUserId);

    setUploading(true);
    setProgress(4);
    try {
      await api.documents.upload(formData, {
        onUploadProgress: (event: ProgressEvent) => {
          if (!event.total) return;
          setProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      setProgress(100);
      setMessage("Document uploaded successfully.");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err?.message || "Failed to upload document.");
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Upload Document" description="Attach school documents to students, teachers, staff or institution records." icon={UploadCloud} />

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="space-y-4 rounded-lg border border-border bg-card p-5 shadow-sm">
          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={documentType} onValueChange={(value) => setDocumentType(value as DocumentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOCUMENT_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Owner type</Label>
            <Select value={ownerType} onValueChange={(value) => setOwnerType(value as OwnerType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{OWNER_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Owner</Label>
            {ownerType !== "institution" && (
              <div className="flex gap-2">
                <Input value={ownerSearch} onChange={(event) => setOwnerSearch(event.target.value)} placeholder="Search name, roll or ID" />
                <Button type="button" variant="outline" size="icon" onClick={() => loadOwners().catch(() => setOwners([]))}><Search className="h-4 w-4" /></Button>
              </div>
            )}
            <div className="max-h-64 space-y-2 overflow-auto rounded-md border border-slate-200 p-2">
              {owners.length === 0 ? <p className="px-2 py-6 text-center text-sm text-slate-500">No owners found.</p> : owners.map((owner) => {
                const selected = selectedOwner?._id === owner._id;
                return (
                  <button
                    key={owner._id}
                    type="button"
                    onClick={() => setSelectedOwner(owner)}
                    className={cn("w-full rounded-md border p-3 text-left text-sm transition", selected ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50")}
                  >
                    <span className="font-medium text-slate-950">{owner.userId?.name || owner.name || "Institution"}</span>
                    <span className="mt-1 block text-xs text-slate-500">{owner.rollNumber || owner.employeeId || owner.userId?.email || "Institution record"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn("flex min-h-[260px] flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition", dragging ? "border-slate-900 bg-muted" : "border-border bg-card")}
          >
            <div className="rounded-lg bg-slate-100 p-4 text-slate-700"><FileUp className="h-8 w-8" /></div>
            <h2 className="mt-4 text-lg font-semibold text-slate-950">Drop file here</h2>
            <p className="mt-2 text-sm text-slate-500">JPG, PNG, PDF, DOC or DOCX up to 5 MB.</p>
            <input ref={fileInputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" onChange={onFileChange} />
            <Button type="button" variant="outline" className="mt-5" onClick={() => fileInputRef.current?.click()}>Select file</Button>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-950">{file.name}</p>
                <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)}><X className="h-4 w-4" /></Button>
            </div>
          )}

          {(uploading || progress > 0) && (
            <div className="mt-4">
              <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-slate-900 transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="mt-2 text-sm text-slate-500">{progress}% uploaded</p>
            </div>
          )}

          {error && <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          {message && <p className="mt-4 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 className="h-4 w-4" />{message}</p>}

          <Button className="mt-5 w-full" disabled={uploading} onClick={upload}>
            <UploadCloud className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </section>
      </div>
    </div>
  );
}
