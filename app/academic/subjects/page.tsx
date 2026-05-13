"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { SUBJECT_PRESETS } from "@/lib/academic-presets";
import { cn } from "@/lib/utils";

type ClassOption = {
  _id: string;
  name: string;
  grade?: string;
  academicYear?: string;
  isActive?: boolean;
};

type TeacherOption = {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
  };
};

type SubjectItem = {
  _id: string;
  name: string;
  code: string;
  type: "core" | "elective" | "optional";
  classId?: ClassOption;
  teacherId?: {
    _id: string;
    name: string;
    email?: string;
  };
  description?: string;
  creditHours: number;
  isActive: boolean;
};

type SubjectForm = {
  name: string;
  code: string;
  type: "core" | "elective" | "optional";
  classId: string;
  teacherId: string;
  description: string;
  creditHours: number;
  isActive: boolean;
};

const emptyForm = (): SubjectForm => ({
  name: "",
  code: "",
  type: "core",
  classId: "",
  teacherId: "",
  description: "",
  creditHours: 1,
  isActive: true,
});

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const matchesClass = classFilter === "all" || subject.classId?._id === classFilter;
      const matchesType = typeFilter === "all" || subject.type === typeFilter;
      return matchesClass && matchesType;
    });
  }, [subjects, classFilter, typeFilter]);

  const activeSubjects = useMemo(
    () => subjects.filter((subject) => subject.isActive !== false).length,
    [subjects]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [subjectResponse, classResponse, teacherResponse] = await Promise.all([
        api.academic.subjects.getAll() as Promise<{ subjects: SubjectItem[] }>,
        api.academic.classes.getAll() as Promise<{ classes: ClassOption[] }>,
        api.teachers.getAll() as Promise<{ teachers: TeacherOption[] }>,
      ]);
      setSubjects(subjectResponse.subjects || []);
      setClasses(classResponse.classes || []);
      setTeachers(teacherResponse.teachers || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load subject data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    setForm({ ...emptyForm(), classId: classes[0]?._id || "" });
    setFormOpen(true);
  };

  const openEditModal = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setForm({
      name: subject.name || "",
      code: subject.code || "",
      type: subject.type || "core",
      classId: subject.classId?._id || "",
      teacherId: subject.teacherId?._id || "",
      description: subject.description || "",
      creditHours: subject.creditHours || 1,
      isActive: subject.isActive !== false,
    });
    setFormOpen(true);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingSubject) {
        await api.academic.subjects.update(editingSubject._id, form);
      } else {
        await api.academic.subjects.create(form);
      }
      setFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save subject");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await api.academic.subjects.delete(deleteTarget._id);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete subject");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subject Management"
        description="Manage subject catalog, class assignment, teacher ownership and subject type."
        icon={BookOpen}
        status={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {activeSubjects} active
          </Badge>
        }
        actions={[
          { label: "Refresh", icon: RefreshCw, onClick: loadData },
          { label: "Add Subject", icon: Plus, onClick: openAddModal, active: true },
        ]}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px]">
          <div>
            <div className="text-xs font-medium uppercase text-slate-500">Visible subjects</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{filteredSubjects.length}</div>
          </div>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Class</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="all">All classes</option>
              {classes.map((classItem) => (
                <option key={classItem._id} value={classItem._id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Type</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              <option value="all">All types</option>
              <option value="core">Core</option>
              <option value="elective">Elective</option>
              <option value="optional">Optional</option>
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Subject name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  Loading subjects...
                </TableCell>
              </TableRow>
            ) : filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No subjects found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject._id}>
                  <TableCell>
                    <div className="font-medium text-slate-950">{subject.name}</div>
                    {subject.description && <div className="text-xs text-slate-500">{subject.description}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-200 bg-slate-50">
                      {subject.code}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {subject.classId?.name || "Unassigned"}
                    {subject.classId?.grade && <span className="ml-1 text-xs text-slate-500">Grade {subject.classId.grade}</span>}
                  </TableCell>
                  <TableCell>{subject.teacherId?.name || "Not assigned"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {subject.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        subject.isActive !== false
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      )}
                    >
                      {subject.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="icon" title="Edit subject" onClick={() => openEditModal(subject)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="destructive" size="icon" title="Delete subject" onClick={() => setDeleteTarget(subject)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <SubjectFormDialog
        open={formOpen}
        editing={Boolean(editingSubject)}
        form={form}
        classes={classes}
        teachers={teachers}
        saving={saving}
        onOpenChange={setFormOpen}
        onSubmit={submitForm}
        onFormChange={setForm}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete subject?</DialogTitle>
            <DialogDescription>
              This will remove {deleteTarget?.name} from its class and teacher assignment.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={saving} onClick={confirmDelete}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubjectFormDialog({
  open,
  editing,
  form,
  classes,
  teachers,
  saving,
  onOpenChange,
  onSubmit,
  onFormChange,
}: {
  open: boolean;
  editing: boolean;
  form: SubjectForm;
  classes: ClassOption[];
  teachers: TeacherOption[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (form: SubjectForm) => void;
}) {
  const applySubjectPreset = (subjectName: string) => {
    const preset = SUBJECT_PRESETS.find((item) => item.name === subjectName);
    if (!preset) return;
    onFormChange({
      ...form,
      name: preset.name,
      code: preset.code,
      type: preset.type,
      description: form.description || preset.name,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit subject" : "Add subject"}</DialogTitle>
          <DialogDescription>
            Assign the subject to a class and choose the teacher responsible for it.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Preset subject">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={SUBJECT_PRESETS.some((item) => item.name === form.name) ? form.name : ""}
                onChange={(event) => applySubjectPreset(event.target.value)}
              >
                <option value="">Custom subject</option>
                {SUBJECT_PRESETS.map((subject) => (
                  <option key={subject.code} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject name / custom">
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="Select or type subject name" required />
            </Field>
            <Field label="Code / custom">
              <Input value={form.code} onChange={(event) => onFormChange({ ...form, code: event.target.value.toUpperCase() })} placeholder="Auto filled, editable" required />
            </Field>
            <Field label="Class">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.classId}
                onChange={(event) => onFormChange({ ...form, classId: event.target.value })}
                required
              >
                <option value="">Select class</option>
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name}{classItem.grade ? ` - Grade ${classItem.grade}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject teacher">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.teacherId}
                onChange={(event) => onFormChange({ ...form, teacherId: event.target.value })}
              >
                <option value="">Not assigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher.userId?._id || ""}>
                    {teacher.userId?.name || "Unnamed teacher"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.type}
                onChange={(event) => onFormChange({ ...form, type: event.target.value as SubjectForm["type"] })}
              >
                <option value="core">Core</option>
                <option value="elective">Elective</option>
                <option value="optional">Optional</option>
              </select>
            </Field>
            <Field label="Credit hours">
              <Input
                type="number"
                min={0}
                step="0.5"
                value={form.creditHours}
                onChange={(event) => onFormChange({ ...form, creditHours: Number(event.target.value) })}
                required
              />
            </Field>
            <Field label="Status">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.isActive ? "active" : "inactive"}
                onChange={(event) => onFormChange({ ...form, isActive: event.target.value === "active" })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Description">
              <Input value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
