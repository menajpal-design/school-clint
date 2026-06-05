# Permission Fix Summary

## Scope
This branch hardens backend API protections for student and parent/guardian permissions in the Easy School server. The goal is to ensure UI hiding is not the only protection: APIs also enforce authentication, institution/tenant scope, role checks, and ownership/child-link checks.

## Authentication and scope
- Protected routes use authenticated request context.
- Queries are scoped by `institutionId` / tenant where available.
- Student data reads are limited to the logged-in student's profile.
- Parent data reads are limited to linked child profiles.
- Class teacher operations are limited to assigned classes where supported.
- Head/admin/super_admin retain broader institution/system scope according to existing rules.

## ID cards
- `/api/id-cards/me/card` resolves student card by authenticated user/student mapping.
- Student lookup checks auth user id, linked student user id, student id, and card/roll/admission-style identifiers where supported.
- Parent is blocked from `/me/card` and must use scoped child card access.
- `/api/id-cards/child/:studentId/card` allows parent access only for linked child student ids.
- If a student profile exists but no ID card has been generated, the API returns a clear generated=false response instead of a misleading false not-found.

## Academic pages
- `/api/academic/exams` allows student/parent read-only scoped GET access for published/visible exams/routines.
- Student/parent write routes for exams remain guarded by academic management middleware.
- Create/update/delete/publish APIs remain manager-only.

## Leave applications
- Leave schema includes applicantType, attachmentUrl, approvedBy, approvedAt, and rejectedReason fields.
- Student can create/view own leave applications only.
- Parent can create/view leave applications only for linked children.
- Student/parent cannot approve or reject leave.
- Class teacher can approve/reject only assigned class leave applications.
- Head/assistant head/admin/super_admin can review institution-scoped leave according to route policy.
- Approved leave creates attendance records for every date from startDate to endDate with `status: "leave"`.
- Rejected/pending review removes generated leave attendance records.

## Homework
- Student can only read published homework for own class/section.
- Parent can only read homework for linked child classes.
- Student/parent cannot create/delete/manage homework.
- Teacher/class_teacher/subject_teacher can manage homework for assigned classes where assignment data exists.
- Head/assistant head/admin/super_admin can manage according to role policy.
- Filters supported by API include date, subject, classId, and sectionId.

## Library
- Existing library backend role checks block student/parent management actions.
- Student/parent can read available books and only own/linked-child issued/requested records.
- Manager roles can add/edit/delete books, issue/return, and manage categories through protected routes.

## SMS monitoring
- SMS monitoring is intended to be restricted to head/admin/super_admin.
- Student/parent must not access SMS monitoring routes.

## Build and testing
Run these locally after pulling the branch:

```bash
cd school-server
npm install
npm run lint
npm run build
```

Manual tests should cover student, parent/guardian, class teacher, and head roles.