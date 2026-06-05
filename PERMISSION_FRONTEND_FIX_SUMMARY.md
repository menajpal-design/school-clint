# Permission Frontend Fix Summary

Static review only. Tests were not run.

## Changed files

- `lib/permissions.ts`
- `app/academic/results/page.tsx`
- `app/leave-application/page.tsx`
- `app/id-cards/my-card/page.tsx`

## Completed fixes

### Central permission config

`lib/permissions.ts` now better matches backend policy:

- ID card generate is head, assistant_head, admin, super_admin only.
- Staff, finance officer, and class teacher are removed from ID card generate menu access.
- Academic subjects and classes are no longer global teacher/student/parent management routes.
- Institution students route is limited to school leaders and class teacher.
- Settings and SMS monitoring remain head/admin/super_admin only.
- Leave apply includes student, parent, teacher, subject_teacher, class_teacher, staff, and finance_officer.
- Added shared `permissionActions` helpers for route buttons.

### Results page

`app/academic/results/page.tsx` now:

- Sends student/parent to own-result view.
- Uses `api.academic.results.getOwn()` for student/parent result loading.
- Hides add/save/approve/publish actions from student/parent.
- Hides approve/publish from teacher/class_teacher unless permission helper allows it.
- Disables marks and remarks inputs for non-entry roles.
- Shows scoped empty state instead of implying global fallback.

### Leave application page

`app/leave-application/page.tsx` now:

- Supports teacher/staff-style own leave application UI.
- Keeps student and parent leave application flow.
- Hides review actions for a user's own leave record.
- Keeps review UI for head, assistant_head, class_teacher, admin, and super_admin where backend returns scoped records.

### ID card my-card page

`app/id-cards/my-card/page.tsx` now:

- Matches the returned card owner against auth user id and linked student/teacher/staff/parent profile ids.
- Reduces false personal card not found warnings.
- Keeps role-based preview fallback.

## Not completed in this pass

- `types/index.ts` librarian role enum update was attempted but blocked by the GitHub safety layer.
- `app/academic/exams/page.tsx` full page update was attempted but blocked by the GitHub safety layer.
- Exam route is now protected by the central sidebar/route permission config, but page-level action hiding is still a follow-up.

## Backend assumptions

- Backend returns scoped class, subject, exam, result, leave, and id-card data.
- `/academic/results/me` is the personal result endpoint for student and parent.
- `/leaves` supports employee leave records.
