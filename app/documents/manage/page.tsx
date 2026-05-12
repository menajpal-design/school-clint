"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Eye, FileCog, Search, Trash2, UploadCloud, Ticket } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";
import {
  DOCUMENT_TYPES,
  OWNER_TYPES,
  documentTypeLabel,
  formatFileSize,
  getDocumentUrl,
  getOwnerMeta,
  type DocumentType,
  type OwnerType,
  type SchoolDocument,
} from "@/lib/documents";
import { formatDate } from "@/lib/utils";

const ALL_TYPES = "all";

export default function DocumentsManagePage() {
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | typeof ALL_TYPES>(ALL_TYPES);
  const [ownerFilter, setOwnerFilter] = useState<OwnerType | typeof ALL_TYPES>(ALL_TYPES);
  const [deletingId, setDeletingId] = useState("");

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.documents.manage() as any;
      setDocuments(data.documents || []);
    } catch {
      const data = await api.documents.getAll() as any;
      setDocuments(data.documents || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments().catch(() => {
      setDocuments([]);
      setLoading(false);
    });
  }, []);

  const filteredDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documents.filter((document) => {
      const owner = getOwnerMeta(document);
      const matchesSearch = !query || [
        document.title,
        document.fileName,
        documentTypeLabel(document.type),
        owner.ownerName,
      ].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesType = typeFilter === ALL_TYPES || document.type === typeFilter;
      const matchesOwner = ownerFilter === ALL_TYPES || owner.ownerType === ownerFilter;
      return matchesSearch && matchesType && matchesOwner;
    });
  }, [documents, ownerFilter, search, typeFilter]);

  const preview = (document: SchoolDocument) => {
    const url = getDocumentUrl(document.fileUrl);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const download = (document: SchoolDocument) => {
    const url = getDocumentUrl(document.fileUrl);
    if (!url) return;
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.fileName || document.title || "document";
    link.target = "_blank";
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const deleteDocument = async (document: SchoolDocument) => {
    if (!window.confirm(`Delete ${document.fileName || document.title || "this document"}?`)) return;
    setDeletingId(document._id);
    try {
      await api.documents.delete(document._id);
      setDocuments((current) => current.filter((item) => item._id !== document._id));
    } finally {
      setDeletingId("");
    }
  };

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const generateAdmitAndDownload = async (document: SchoolDocument) => {
    const owner = getOwnerMeta(document);
    const ownerType = owner.ownerType as 'student' | 'teacher' | 'staff' | string;
    const personId = typeof document.userId === 'string' ? document.userId : (document.userId as any)?._id;
    if (!personId) {
      alert('No person associated with this document.');
      return;
    }

    try {
      setGeneratingId(document._id);
      // Use generic generate endpoint which supports ownerType
      const data = await api.idCards.generate({ ownerType: ownerType, ownerId: personId, options: { qr: true } }) as any;
      const card = data?.card;
      if (!card || !card._id) {
        alert('Failed to generate card.');
        return;
      }
      const blob = await api.idCards.download(card._id, 'pdf');
      const fileName = `${document.fileName || document.title || 'id-card'}.pdf`;
      downloadBlob(blob, fileName);
    } catch (err: any) {
      alert(err?.message || 'Failed to generate card.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Documents"
        description="Search, filter, preview, download and remove uploaded files."
        icon={FileCog}
        actions={[{ label: "Upload", href: "/documents/upload", icon: UploadCloud }]}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents, owners or types" />
          </div>
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as DocumentType | typeof ALL_TYPES)}>
            <SelectTrigger><SelectValue placeholder="Document type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All document types</SelectItem>
              {DOCUMENT_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={(value) => setOwnerFilter(value as OwnerType | typeof ALL_TYPES)}>
            <SelectTrigger><SelectValue placeholder="Owner type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_TYPES}>All owner types</SelectItem>
              {OWNER_TYPES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="h-28 text-center text-slate-500">Loading documents...</TableCell></TableRow>
            ) : filteredDocuments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="h-28 text-center text-slate-500">No documents match your filters.</TableCell></TableRow>
            ) : filteredDocuments.map((document) => {
              const owner = getOwnerMeta(document);
              return (
                <TableRow key={document._id}>
                  <TableCell>
                    <div className="font-medium text-slate-950">{document.fileName || document.title || "Untitled document"}</div>
                    <div className="text-xs text-slate-500">{document.mimeType || "Unknown file type"}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline">{documentTypeLabel(document.type)}</Badge></TableCell>
                  <TableCell>
                    <div>{owner.ownerName}</div>
                    <div className="text-xs capitalize text-slate-500">{owner.ownerType}</div>
                  </TableCell>
                  <TableCell>{document.createdAt ? formatDate(document.createdAt) : "-"}</TableCell>
                  <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => preview(document)} title="Preview"><Eye className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="icon" onClick={() => download(document)} title="Download"><Download className="h-4 w-4" /></Button>
                      {['student','teacher','staff'].includes(getOwnerMeta(document).ownerType) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => generateAdmitAndDownload(document)}
                          title="Generate Admit Card"
                          disabled={generatingId === document._id}
                        >
                          <Ticket className="h-4 w-4" />
                        </Button>
                      )}
                      <Button type="button" variant="destructive" size="icon" disabled={deletingId === document._id} onClick={() => deleteDocument(document)} title="Delete"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
