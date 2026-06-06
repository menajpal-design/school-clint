"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, LayoutList, Plus, RefreshCw, Trash2, Users, CheckCircle2, AlertTriangle, Search, Filter } from "lucide-react";

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
import { useAuth } from "@/hooks/useAuth";
import { normalizeUserRole } from "@/lib/permissions";

type ClassItem = {
  _id: string;
  name: string;
  grade: string;
  academicYear: string;
};

type TeacherItem = {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email?: string;
  };
};

type SectionItem = {
  _id: string;
  name: string;
  classId: ClassItem | string;
  sectionTeacherId?: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  } | string;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
};

type SectionForm = {
  name: string;
  classId: string;
  sectionTeacherId: string;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
};

const emptyForm = (): SectionForm => ({
  name: "",
  classId: "",
  sectionTeacherId: "",
  capacity: 30,
  currentStudents: 0,
  isActive: true,
});

export default function SectionsPage() {
  const { user } = useAuth();
  const rawRole = user?.role || "";
  const normalizedRole = normalizeUserRole(rawRole);
  
  // Only head, assistant_head, admin, super_admin can write.
  const canManage = useMemo(() => {
    const role = normalizedRole || rawRole;
    return ["head", "assistant_head", "admin", "super_admin"].includes(role);
  }, [normalizedRole, rawRole]);

  const [sections, setSections] = useState<SectionItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SectionItem | null>(null);
  const [form, setForm] = useState<SectionForm>(emptyForm());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [sectionsResponse, classesResponse, teachersResponse] = await Promise.all([
        api.academic.sections.getAll() as Promise<{ sections: SectionItem[] }>,
        api.academic.classes.getAll() as Promise<{ classes: ClassItem[] }>,
        api.teachers.getAll() as Promise<{ teachers: TeacherItem[] }>,
      ]);

      setSections(sectionsResponse.sections || []);
      setClasses(classesResponse.classes || []);
      setTeachers(teachersResponse.teachers || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load sections data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSection(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEditModal = (section: SectionItem) => {
    setEditingSection(section);
    
    const classIdVal = typeof section.classId === "object" ? section.classId?._id : section.classId;
    const teacherIdVal = typeof section.sectionTeacherId === "object" ? section.sectionTeacherId?._id : section.sectionTeacherId;

    setForm({
      name: section.name || "",
      classId: classIdVal || "",
      sectionTeacherId: teacherIdVal || "",
      capacity: section.capacity || 30,
      currentStudents: section.currentStudents || 0,
      isActive: section.isActive !== false,
    });
    setFormOpen(true);
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingSection) {
        await api.academic.sections.update(editingSection._id, form);
      } else {
        await api.academic.sections.create(form);
      }
      setFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await api.academic.sections.delete(deleteTarget._id);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete section");
    } finally {
      setSaving(false);
    }
  };

  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const clsObj = typeof sec.classId === "object" ? sec.classId : null;
      const className = clsObj ? clsObj.name : "";
      
      const teacherObj = typeof sec.sectionTeacherId === "object" ? sec.sectionTeacherId : null;
      const teacherName = teacherObj ? teacherObj.name : "";

      const matchesSearch =
        sec.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacherName.toLowerCase().includes(searchQuery.toLowerCase());

      const classIdStr = clsObj ? clsObj._id : String(sec.classId);
      const matchesClass = !classFilter || classIdStr === classFilter;

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" && sec.isActive !== false) ||
        (statusFilter === "inactive" && sec.isActive === false);

      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [sections, searchQuery, classFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = sections.length;
    const active = sections.filter((s) => s.isActive !== false).length;
    const totalStudents = sections.reduce((sum, s) => sum + (s.currentStudents || 0), 0);
    const totalCapacity = sections.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const avgFillRatio = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

    return { total, active, totalStudents, avgFillRatio };
  }, [sections]);

  const getClassLabel = (classId: string | ClassItem) => {
    if (typeof classId === "object" && classId) {
      return `${classId.name} (${classId.academicYear})`;
    }
    const found = classes.find((c) => c._id === String(classId));
    return found ? `${found.name} (${found.academicYear})` : "Unknown Class";
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Class Sections"
        description="Configure class branches, student capacities, and assign class/section teachers."
        icon={LayoutList}
        status={
          <Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">
            {sections.length} sections registered
          </Badge>
        }
        actions={
          [
            <Button key="refresh" variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>,
            canManage && (
              <Button key="add-section" size="sm" onClick={openAddModal} className="bg-teal-600 hover:bg-teal-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            ),
          ].filter(Boolean) as any
        }
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Sections</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Sections</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Enrolled</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Average Fill Ratio</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{stats.avgFillRatio}%</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search by section name, class or teacher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} ({cls.academicYear})
                </option>
              ))}
            </select>
          </div>
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Sections Table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="font-semibold text-slate-700">Section Name</TableHead>
              <TableHead className="font-semibold text-slate-700">Class</TableHead>
              <TableHead className="font-semibold text-slate-700">Assigned Teacher</TableHead>
              <TableHead className="font-semibold text-slate-700">Student Capacity</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              {canManage && <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="h-32 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-teal-600" />
                    Loading sections...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="h-32 text-center text-slate-500">
                  No sections found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => {
                const fillPercent = section.capacity > 0 ? Math.min(100, Math.round((section.currentStudents / section.capacity) * 100)) : 0;
                
                const classLabel = typeof section.classId === "object" && section.classId
                  ? `${section.classId.name} (${section.classId.academicYear})`
                  : "Unassigned";

                const teacherLabel = typeof section.sectionTeacherId === "object" && section.sectionTeacherId
                  ? section.sectionTeacherId.name
                  : "Not Assigned";

                return (
                  <TableRow key={section._id} className="hover:bg-slate-50/50">
                    <TableCell className="font-medium text-slate-900">{section.name}</TableCell>
                    <TableCell>{classLabel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="h-4 w-4 text-slate-400" />
                        {teacherLabel}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{section.currentStudents} / {section.capacity}</span>
                          <span className="text-slate-500">{fillPercent}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              fillPercent >= 90
                                ? "bg-red-500"
                                : fillPercent >= 75
                                ? "bg-amber-500"
                                : "bg-teal-500"
                            )}
                            style={{ width: `${fillPercent}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          section.isActive !== false
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-500"
                        )}
                      >
                        {section.isActive !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-teal-600 hover:border-teal-300"
                            title="Edit Section"
                            onClick={() => openEditModal(section)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-slate-600 hover:text-red-600 hover:border-red-300"
                            title="Delete Section"
                            onClick={() => setDeleteTarget(section)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </section>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? "Edit Section" : "Add Section"}</DialogTitle>
            <DialogDescription>
              Configure section attributes including class alignment, capacity limits, and teacher assignments.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={submitForm}>
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Section Name</label>
                <Input
                  required
                  placeholder="e.g. A, B, Alpha, Beta"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Class</label>
                <select
                  required
                  className="h-10 w-full rounded-md border border-slate-200 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                >
                  <option value="" disabled>Select target class...</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} ({cls.academicYear})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Section Teacher</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={form.sectionTeacherId}
                  onChange={(e) => setForm({ ...form, sectionTeacherId: e.target.value })}
                >
                  <option value="">Not Assigned</option>
                  {teachers.map((t) => (
                    <option key={t._id} value={t.userId?._id || ""}>
                      {t.userId?.name || "Unnamed Teacher"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Max Capacity</label>
                  <Input
                    required
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Current Students</label>
                  <Input
                    required
                    type="number"
                    min={0}
                    value={form.currentStudents}
                    onChange={(e) => setForm({ ...form, currentStudents: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Status</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  value={form.isActive ? "active" : "inactive"}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === "active" })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white">
                {saving ? "Saving..." : editingSection ? "Save Changes" : "Create Section"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete section "{deleteTarget?.name}"? This will detach the section from its class, and this action cannot be undone.
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
