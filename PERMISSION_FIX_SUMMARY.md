# Permission Fix Summary

## Scope
This branch hardens student and parent/guardian permissions across the Easy School client. The goal is that student/parent users only see allowed routes/actions and cannot access admin/head/teacher-only pages through sidebar, dashboard quick actions, or direct URL route guard.

## Dashboard
- `/dashboard` uses role-based quick action config through `getDashboardQuickActions()`.
- Student quick actions are limited to: My Result, My Attendance, My ID Card, My Fees, Syllabus, Class Routine, Homework, Leave Application.
- Parent/guardian quick actions are limited to: Child Result, Child Attendance, Child Fees, Child Routine, Child Syllabus, Homework, Leave Application.
- Student/parent dashboard does not show Enter Result, Add Student, Mark Attendance, SMS Monitoring, Subjects, Academic Management, or admin/head/teacher-only actions.

## Sidebar and route guard
- `lib/permissions.ts` centralizes sidebar visibility and route guard behavior.
- `guardian` and `parent_guardian` are normalized to `parent`.
- Student/parent cannot see or directly access: `/institution/students`, `/academic`, `/academic/subjects`, `/attendance/mark`, `/sms-monitoring`, Users & Roles, or Settings.
- Student/parent can see allowed read-only academic routes, homework, leave application, library, fees, notices, and profile routes.
- Sidebar active-route highlight and child-route auto-expand were improved in `components/layout/Sidebar.tsx`.

## ID card
- Student uses `/id-cards/my-card` for own card.
- Parent no longer sees `/id-cards/my-card`; parent child-card access must use a child-card route.
- The page should display a clear message if the student exists but the card has not been generated.

## Academic pages
- Student/parent access is read-only for syllabus, class routine, exams, exam routine, and results.
- Student/parent management buttons such as Add, Edit, Delete, Publish, Approve, Create, and Enter Result are hidden.
- Student/parent result views use personal/child-scoped result flows.

## Leave application
- `/leave-application` is available in the authenticated shell/sidebar.
- Student/parent can submit leave applications.
- Class teacher, assistant head, and head can review according to role scope.
- UI shows pending/approved/rejected status.

## Homework
- `/homework` is available in the authenticated shell/sidebar.
- Student/parent view is read-only.
- Student default action is focused on today's homework and own class/section homework.
- Management controls are reserved for teacher/class teacher/head/admin roles.

## Library
- `/library` was redesigned into a responsive dashboard with Available Books, Issued Books, Categories, Search/Filters, and Book Status sections.
- Student/parent management buttons are hidden.
- Student/parent see available books and their own/child issued or requested books only.
- Manager roles get links to book and loan management.

## Build and testing
Run these locally after pulling the branch:

```bash
cd school-clint
npm install
npm run lint
npm run build
```

Manual tests should cover student, parent/guardian, class teacher, and head roles.