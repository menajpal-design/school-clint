"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FileText, FolderKanban, Settings2, Ticket, UploadCloud } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { DOCUMENT_TYPES, documentTypeLabel, formatFileSize, getOwnerMeta, type SchoolDocument } from "@/lib/documents";
import { formatDate } from "@/lib/utils";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.documents.getAll()
      .then((data: any) => setDocuments(data.documents || []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  }, []);

  const categoryCounts = useMemo(() => {
    return DOCUMENT_TYPES.map((type) => ({
      ...type,
      count: documents.filter((document) => document.type === type.value).length,
    }));
  }, [documents]);

  const recentDocuments = documents.slice(0, 6);
  const totalStorage = documents.reduce((total, document) => total + (document.fileSize || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Documents"
        description="Browse document categories, recent uploads and the fastest paths to upload or manage files."
        icon={FolderKanban}
        actions={[
          { label: "Admit Card", href: "/documents/admit-cards", icon: Ticket },
          { label: "Upload", href: "/documents/upload", icon: UploadCloud },
          { label: "Manage", href: "/documents/manage", icon: Settings2 },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Files" value={documents.length} icon={FileText} loading={loading} tone="blue" />
        <StatCard label="Categories Used" value={categoryCounts.filter((item) => item.count > 0).length} icon={FolderKanban} loading={loading} tone="emerald" />
        <StatCard label="Storage Used" value={formatFileSize(totalStorage)} icon={UploadCloud} loading={loading} tone="amber" />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {categoryCounts.map((category) => (
          <Card key={category.value} className="border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>
                <Badge variant="outline">{category.count}</Badge>
              </div>
              <h2 className="mt-4 text-sm font-semibold text-slate-950">{category.label}</h2>
              <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">{category.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="font-semibold text-slate-950">Recent Uploaded Files</h2>
            <Button asChild variant="outline" size="sm"><Link href="/documents/manage">View all</Link></Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDocuments.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="h-28 text-center text-slate-500">No documents uploaded yet.</TableCell></TableRow>
              ) : recentDocuments.map((document) => {
                const owner = getOwnerMeta(document);
                return (
                  <TableRow key={document._id}>
                    <TableCell>
                      <div className="font-medium text-slate-950">{document.title || document.fileName || "Untitled document"}</div>
                      <div className="text-xs text-slate-500">{formatFileSize(document.fileSize)}</div>
                    </TableCell>
                    <TableCell>{documentTypeLabel(document.type)}</TableCell>
                    <TableCell>{owner.ownerName}</TableCell>
                    <TableCell>{document.createdAt ? formatDate(document.createdAt) : "-"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Quick Links</h2>
          <div className="mt-4 space-y-3">
            <Button asChild className="w-full justify-start"><Link href="/documents/admit-cards"><Ticket className="mr-2 h-4 w-4" />Generate Admit Card</Link></Button>
            <Button asChild className="w-full justify-start"><Link href="/documents/upload"><UploadCloud className="mr-2 h-4 w-4" />Upload Document</Link></Button>
            <Button asChild variant="outline" className="w-full justify-start"><Link href="/documents/manage"><Settings2 className="mr-2 h-4 w-4" />Manage Documents</Link></Button>
          </div>
        </section>
      </div>
    </div>
  );
}
