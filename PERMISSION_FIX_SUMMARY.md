# Permission Fix Summary

## Scope
This update focuses on student and parent/guardian permission hardening for the Easy School client and server.

## Completed client changes
- `/dashboard` now uses `getDashboardQuickActions()` and shows role-based actions only.
- Student dashboard actions are limited to: My Result, My Attendance, My ID Card, My Fees, Syllabus, Class Routine, Homework, Leave Application.
- Parent dashboard actions are limited to: Child Result, Child Attendance, Child Fees, Child Routine, Homework, Leave Application.
- `/homework` is read-only for student/parent and management actions are hidden.
- `/library` is redesigned with role-based view; student/parent see available books only, while management is reserved for permitted staff/head roles.
- `/leave-application` UI allows student/parent application creation and class teacher/assistant head/head review UI.
- Central `lib/permissions.ts` was updated previously to block student access to student-management, academic overview/subjects, attendance marking, and SMS monitoring routes.

## Completed server changes
- Leave application routes already create attendance records with status `leave` when approved.
- Leave status `leave` is separate from present/absent and should be rendered as a separate calendar status by attendance UI.

## Remaining follow-up checks
- Verify server build after deployment because connector access does not run `npm run build`.
- Verify `/id-cards/me/card` in production with an actual student account and ensure both auth user id and linked student id are checked.
- Verify SMS monitoring access in deployed UI after sidebar cache refresh.

## Role behavior
- Student/parent are view-only for academic data and cannot create/edit/delete/publish/approve academic records.
- Student uses `/attendance/my-attendance`; student/parent cannot access `/attendance/mark`.
- Student/parent cannot access `/sms-monitoring`.
- Parent can view child-scoped data only and can create leave applications for linked children.
