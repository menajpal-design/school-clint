"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus, RefreshCw, Trash2, UsersRound } from "lucide-react";

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
import { api, apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

type SectionItem = {
  _id?: string;
  name: string;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
};

type TeacherItem = {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
  };
};

type ClassItem = {
  _id: string;
  name: string;
  grade: string;
  shift?: "morning" | "day" | "evening";
  classTeacherId?: {
    _id: string;
    name: string;
    email?: string;
  };
  sections?: SectionItem[];
  academicYear: string;
  isActive: boolean;
  status?: string;
  totalStudents?: number;
};

type ClassForm = {
  name: string;
  grade: string;
  shift: "morning" | "day" | "evening";
  classTeacherId: string;
  academicYear: string;
  isActive: boolean;
  sections: SectionItem[];
};

const emptyForm = (): ClassForm => ({
  name: "",
  grade: "",
  shift: "day",
  classTeacherId: "",
  academicYear: new Date().getFullYear().toString(),
  isActive: true,
  sections: [{ name: "A", capacity: 30, currentStudents: 0, isActive: true }],
});

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassItem | null>(null);
  const [form, setForm] = useState<ClassForm>(emptyForm);

  const sectionCount = useMemo(
    () => classes.reduce((total, classItem) => total + (classItem.sections?.filter((section) => section.isActive !== false).length || 0), 0),
    [classes]
  );

  const totalStudents = useMemo(
    () => classes.reduce((total, classItem) => total + (classItem.totalStudents || 0), 0),
    [classes]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, teacherResponse] = await Promise.all([
        api.academic.classes.getAll() as Promise<{ classes: ClassItem[] }>,
        api.teachers.getAll() as Promise<{ teachers: TeacherItem[] }>,
      ]);
      setClasses(classResponse.classes || []);
      setTeachers(teacherResponse.teachers || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditModal = (classItem: ClassItem) => {
    setEditingClass(classItem);
    setForm({
      name: classItem.name || "",
      grade: classItem.grade || "",
      shift: classItem.shift || "day",
      classTeacherId: classItem.classTeacherId?._id || "",
      academicYear: classItem.academicYear || new Date().getFullYear().toString(),
      isActive: classItem.isActive !== false,
      sections: classItem.sections?.length
        ? classItem.sections.map((section) => ({
            _id: section._id,
            name: section.name,
            capacity: section.capacity || 30,
            currentStudents: section.currentStudents || 0,
            isActive: section.isActive !== false,
          }))
        : [{ name: "A", capacity: 30, currentStudents: 0, isActive: true }],
    });
    setFormOpen(true);
  };

  const updateSection = (index: number, value: Partial<SectionItem>) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.map((section, sectionIndex) =>
        sectionIndex === index ? { ...section, ...value } : section
      ),
    }));
  };

  const addSection = () => {
    setForm((current) => ({
      ...current,
      sections: [...current.sections, { name: "", capacity: 30, currentStudents: 0, isActive: true }],
    }));
  };

  const removeSection = (index: number) => {
    setForm((current) => ({
      ...current,
      sections: current.sections.filter((_, sectionIndex) => sectionIndex !== index),
    }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      sections: form.sections.filter((section) => section.name.trim()),
    };

    try {
      if (editingClass) {
        await api.academic.classes.update(editingClass._id, payload);
      } else {
        await api.academic.classes.create(payload);
      }
      setFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save class");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.delete(`/academic/classes/${deleteTarget._id}`);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class Management"
        description="Manage classes, sections, shifts, teacher assignments and student capacity."
        icon={UsersRound}
        status={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {classes.length} classes
          </Badge>
        }
        actions={[
          { label: "Refresh", icon: RefreshCw, onClick: loadData },
          { label: "Add Class", icon: Plus, onClick: openAddModal, active: true },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile label="Active classes" value={classes.filter((classItem) => classItem.isActive !== false).length} />
        <SummaryTile label="Sections" value={sectionCount} />
        <SummaryTile label="Students" value={totalStudents} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Class name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Class teacher</TableHead>
              <TableHead>Total students</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  Loading classes...
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                  No classes found.
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem._id}>
                  <TableCell>
                    <div className="font-medium text-slate-950">{classItem.name}</div>
                    <div className="text-xs text-slate-500">Grade {classItem.grade} · {classItem.academicYear}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-xs flex-wrap gap-1">
                      {classItem.sections?.filter((section) => section.isActive !== false).length ? (
                        classItem.sections
                          ?.filter((section) => section.isActive !== false)
                          .map((section) => (
                            <Badge key={section._id || section.name} variant="outline" className="border-slate-200 bg-slate-50">
                              {section.name}
                            </Badge>
                          ))
                      ) : (
                        <span className="text-slate-400">Unassigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{classItem.shift || "day"}</TableCell>
                  <TableCell>{classItem.classTeacherId?.name || "Not assigned"}</TableCell>
                  <TableCell>{classItem.totalStudents || 0}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        classItem.isActive !== false
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-500"
                      )}
                    >
                      {classItem.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="icon" title="Edit class" onClick={() => openEditModal(classItem)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="destructive" size="icon" title="Delete class" onClick={() => setDeleteTarget(classItem)}>
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

      <ClassFormDialog
        open={formOpen}
        editing={Boolean(editingClass)}
        form={form}
        teachers={teachers}
        saving={saving}
        onOpenChange={setFormOpen}
        onSubmit={submitForm}
        onFormChange={setForm}
        onAddSection={addSection}
        onRemoveSection={removeSection}
        onUpdateSection={updateSection}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete class?</DialogTitle>
            <DialogDescription>
              This will remove {deleteTarget?.name} and its sections. Classes with enrolled students cannot be deleted.
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

function SummaryTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs font-medium uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
    </div>
  );
}

function ClassFormDialog({
  open,
  editing,
  form,
  teachers,
  saving,
  onOpenChange,
  onSubmit,
  onFormChange,
  onAddSection,
  onRemoveSection,
  onUpdateSection,
}: {
  open: boolean;
  editing: boolean;
  form: ClassForm;
  teachers: TeacherItem[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (form: ClassForm) => void;
  onAddSection: () => void;
  onRemoveSection: (index: number) => void;
  onUpdateSection: (index: number, value: Partial<SectionItem>) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit class" : "Add class"}</DialogTitle>
          <DialogDescription>
            Configure the class details, section list, shift and assigned class teacher.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Class name">
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
            </Field>
            <Field label="Grade">
              <Input value={form.grade} onChange={(event) => onFormChange({ ...form, grade: event.target.value })} required />
            </Field>
            <Field label="Academic year">
              <Input value={form.academicYear} onChange={(event) => onFormChange({ ...form, academicYear: event.target.value })} required />
            </Field>
            <Field label="Shift">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.shift}
                onChange={(event) => onFormChange({ ...form, shift: event.target.value as ClassForm["shift"] })}
              >
                <option value="morning">Morning</option>
                <option value="day">Day</option>
                <option value="evening">Evening</option>
              </select>
            </Field>
            <Field label="Class teacher">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.classTeacherId}
                onChange={(event) => onFormChange({ ...form, classTeacherId: event.target.value })}
              >
                <option value="">Not assigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher.userId?._id || ""}>
                    {teacher.userId?.name || "Unnamed teacher"}
                  </option>
                ))}
              </select>
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
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-950">Sections</h3>
              <Button type="button" variant="outline" size="sm" onClick={onAddSection}>
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
            <div className="space-y-2">
              {form.sections.map((section, index) => (
                <div key={section._id || index} className="grid gap-2 rounded-lg border border-slate-200 p-3 md:grid-cols-[1fr_120px_120px_92px]">
                  <Input
                    value={section.name}
                    placeholder="Section"
                    onChange={(event) => onUpdateSection(index, { name: event.target.value })}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={section.capacity}
                    placeholder="Capacity"
                    onChange={(event) => onUpdateSection(index, { capacity: Number(event.target.value) })}
                  />
                  <Input
                    type="number"
                    min={0}
                    value={section.currentStudents}
                    placeholder="Students"
                    onChange={(event) => onUpdateSection(index, { currentStudents: Number(event.target.value) })}
                  />
                  <Button type="button" variant="outline" disabled={form.sections.length === 1} onClick={() => onRemoveSection(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Class"}
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
