Client pages index — concise details for each `app/.../page.tsx`

- [school-clint/app/billing/page.tsx](school-clint/app/billing/page.tsx): Purpose: Institution billing and SMS top-up UI. Key components: `Card`, `Button`, payment widget handling. APIs: `api.institution.profile()`, `api.institution.smsTopup()`, `api.institution.topups()`; Access: head/admin.

- [school-clint/app/charts/profile/page.tsx](school-clint/app/charts/profile/page.tsx): Purpose: Profile-related charts. Key components: `PieChartCard`, `LineChartCard`. APIs: `api.institution.profile()`, `api.dashboard.charts()`; Access: authenticated users.

- [school-clint/app/users-roles/permissions/page.tsx](school-clint/app/users-roles/permissions/page.tsx): Purpose: Permissions matrix editor. Key components: `PageHeader`, `ResponsiveTable`, `Checkbox`. APIs: `api.users.permissions()`, `api.users.updatePermissions()`; Access: admin/head/super_admin.

- [school-clint/app/charts/parent/page.tsx](school-clint/app/charts/parent/page.tsx): Purpose: Parent-facing charts (attendance & fees). Key components: `LineChartCard`, `AttendanceChart`. APIs: `api.finance.dashboard()`; Access: parent.

- [school-clint/app/charts/page.tsx](school-clint/app/charts/page.tsx): Purpose: Institution dashboards charts. Key components: chart cards. APIs: `api.dashboard.charts()`, `api.dashboard.composition()`; Access: authenticated (role-based).

- [school-clint/app/users-roles/page.tsx](school-clint/app/users-roles/page.tsx): Purpose: Users & roles overview. Key components: `PageHeader`, `StatCard`, `PieChartCard`. APIs: `api.users.getAll()`; Access: admin/heads.

- [school-clint/app/admin/users/page.tsx](school-clint/app/admin/users/page.tsx): Purpose: Admin — list & manage platform users. Key components: table, filters. APIs: `api.admin.users()`, `api.admin.schools()`. Access: platform admin.

- [school-clint/app/academic/syllabus/page.tsx](school-clint/app/academic/syllabus/page.tsx): Purpose: Syllabus CRUD and caching. Key components: `PageHeader`, local cache utilities. APIs: `api.academic.classes.getAll()`, `api.academic.subjects.getAll()`, `apiClient` for `/syllabus` endpoints; Access: teachers/head.

- [school-clint/app/admission/page.tsx](school-clint/app/admission/page.tsx): Purpose: Public admission application page. Key components: forms, school search. APIs: `api.admissions.schools()`, `api.admissions.apply()`; Access: public.

- [school-clint/app/users-roles/all/page.tsx](school-clint/app/users-roles/all/page.tsx): Purpose: All users listing and role/reset actions. Key components: `Table`, `Switch`. APIs: `api.users.getAllUsers()`, `api.auth.profile()`, `api.users.updateStatus()`, `api.users.updateRole()`, `api.users.resetPassword()`; Access: admin/platform roles.

- [school-clint/app/admin/select-school/page.tsx](school-clint/app/admin/select-school/page.tsx): Purpose: Admin "impersonate/select" a school context. Key components: cards, select actions. APIs: `api.admin.schools()`, `api.admin.selectSchool()`; Access: platform admin.

- [school-clint/app/admin/subscriptions/page.tsx](school-clint/app/admin/subscriptions/page.tsx): Purpose: Manage school subscriptions and payments at platform level. Key components: plan selector, badges. APIs: `api.admin.schools()`, `api.admin.updateSchool()`; Access: platform admin.

- [school-clint/app/academic/subjects/page.tsx](school-clint/app/academic/subjects/page.tsx): Purpose: Subject management (add, bulk, cache). Key components: forms, SubjectFormDialog. APIs: `api.academic.subjects.*`, `api.academic.classes.getAll()`, `api.teachers.getAll()`; Access: teachers/head/admin.

- [school-clint/app/sms-monitoring/page.tsx](school-clint/app/sms-monitoring/page.tsx): Purpose: SMS monitoring (sent / not sent lists, monthly stats). Key components: `ResponsiveTable`, `Card`. APIs: `apiClient.get('/sms/head/monthly')` (server SMS head endpoints); Access: head/admin.

- [school-clint/app/settings/page.tsx](school-clint/app/settings/page.tsx): Purpose: Head-level settings, storage & app controls. Key components: `RoleGuard`, forms, storage checks. APIs: `apiClient.get('/site-settings/*')`, `apiClient.put('/site-settings/*')`; Access: head only.

- [school-clint/app/admin/schools/page.tsx](school-clint/app/admin/schools/page.tsx): Purpose: Manage schools (activate/suspend, subscription quick actions). Key components: `Card`, `BarChartCard`. APIs: `api.admin.schools()`, `api.admin.updateSchool()`; Access: platform admin.

- [school-clint/app/admin/page.tsx](school-clint/app/admin/page.tsx): Purpose: Admin dashboard summary and quick links. Key components: `PieChartCard`, `Card`. APIs: `api.admin.schools()`; Access: platform admin.

- [school-clint/app/academic/results/page.tsx](school-clint/app/academic/results/page.tsx): Purpose: Enter and manage exam results, workflow (review/publish). Key components: tables, dialogs. APIs: `api.academic.results.*`, `api.academic.classes.getAll()`, `api.academic.subjects.getAll()`, `api.academic.exams.getAll()`; Access: teachers/head.

- [school-clint/app/result/page.tsx](school-clint/app/result/page.tsx): Purpose: Public result lookup for students/guardians. Key components: `Select`, `Card`, charts. APIs: `api.publicResults.*`; Access: public.

- [school-clint/app/admin/accounting/page.tsx](school-clint/app/admin/accounting/page.tsx): Purpose: Admin accounting ledger and CSV export. Key components: `ResponsiveTable`, charts. APIs: `api.admin.accounting()`; Access: platform admin/finance.

- [school-clint/app/academic/report-card/page.tsx](school-clint/app/academic/report-card/page.tsx): Purpose: Report card generation/preview. Key components: print/export utilities. APIs: `api.academic.*` (results, students); Access: teachers/head.

- [school-clint/app/register/page.tsx](school-clint/app/register/page.tsx): Purpose: User registration page. Key components: form inputs, API registration. APIs: `api.auth.register()`; Access: public.

- [school-clint/app/admin/sms-monitoring/page.tsx](school-clint/app/admin/sms-monitoring/page.tsx): Purpose: Admin SMS monitoring (platform-level). Key components: tables/cards similar to sms-monitoring. APIs: `api.admin.sms.*` or `apiClient` SMS endpoints; Access: platform admin.

- [school-clint/app/profile/page.tsx](school-clint/app/profile/page.tsx): Purpose: Edit current user profile and view institution info. Key components: profile form, avatar. APIs: `api.auth.profile()`, `api.institution.update()`; Access: authenticated users.

- [school-clint/app/academic/promotions/page.tsx](school-clint/app/academic/promotions/page.tsx): Purpose: Promote students between classes. Key components: tables, promotion actions. APIs: `api.academic.promotions.*`, `api.academic.classes.getAll()`; Access: admin/head.

- [school-clint/app/academic/page.tsx](school-clint/app/academic/page.tsx): Purpose: Academic module index (links to classes, exams, syllabus). Key components: `PageHeader`, quick-links. APIs: links to `api.academic.*` in subpages; Access: teachers/head.

- [school-clint/app/academic/exams/page.tsx](school-clint/app/academic/exams/page.tsx): Purpose: Exams CRUD and settings. Key components: forms, table. APIs: `api.academic.exams.*`; Access: teachers/head.

- [school-clint/app/profile/change-password/page.tsx](school-clint/app/profile/change-password/page.tsx): Purpose: Change password form. Key components: `Input`, buttons. APIs: `api.auth.changePassword()`; Access: authenticated users.

- [school-clint/app/academic/exam-routine/page.tsx](school-clint/app/academic/exam-routine/page.tsx): Purpose: Exam routine scheduling. Key components: schedule UI, table. APIs: `api.academic.examRoutine.*`; Access: admin/teachers.

- [school-clint/app/pricing/page.tsx](school-clint/app/pricing/page.tsx): Purpose: Public pricing and plan checkout. Key components: plan cards, Stripe/Gateway integration. APIs: `api.institution.createCheckoutSession()`, `api.institution.profile()`; Access: public.

- [school-clint/app/parent-portal/page.tsx](school-clint/app/parent-portal/page.tsx): Purpose: Parent dashboard entry (links to child info). Key components: cards, charts. APIs: `api.parent.*`, `api.institution.profile()`; Access: parent.

- [school-clint/app/page.tsx](school-clint/app/page.tsx): Purpose: Root landing/home dashboard. Key components: main dashboard cards, quick links. APIs: `api.dashboard.*`, `api.institution.profile()`; Access: authenticated/home.

- [school-clint/app/id-cards/templates/page.tsx](school-clint/app/id-cards/templates/page.tsx): Purpose: ID card templates preview and selection. Key components: `ProfessionalIDCard`, `AdmitCard`, `PageHeader`. APIs: `api.institution.profile()`; Access: staff/head.

- [school-clint/app/notifications/page.tsx](school-clint/app/notifications/page.tsx): Purpose: Notifications center. Key components: list view, badges. APIs: `api.notifications.*`; Access: authenticated.

- [school-clint/app/id-cards/reports/page.tsx](school-clint/app/id-cards/reports/page.tsx): Purpose: ID card/report printing reports. Key components: print/export. APIs: `api.idcards.reports()`; Access: admin/staff.

- [school-clint/app/notices/page.tsx](school-clint/app/notices/page.tsx): Purpose: Notices management and publication. Key components: editor, list. APIs: `api.notices.*`; Access: admin/teachers.

- [school-clint/app/academic/classes/page.tsx](school-clint/app/academic/classes/page.tsx): Purpose: Classes management (sections, years). Key components: forms/tables. APIs: `api.academic.classes.*`; Access: admin/head.

- [school-clint/app/id-cards/renewal/page.tsx](school-clint/app/id-cards/renewal/page.tsx): Purpose: ID card renewal workflows. Key components: forms, list. APIs: `api.idcards.renewal()`; Access: admin/staff.

- [school-clint/app/messages/page.tsx](school-clint/app/messages/page.tsx): Purpose: Internal messaging center. Key components: thread list, composer. APIs: `api.messages.*`; Access: authenticated (role-based).

- [school-clint/app/id-cards/print/page.tsx](school-clint/app/id-cards/print/page.tsx): Purpose: Print ID cards. Key components: print layout, preview. APIs: `api.idcards.print()` or local generation; Access: admin/staff.

- [school-clint/app/academic/class-routine/page.tsx](school-clint/app/academic/class-routine/page.tsx): Purpose: Class routine scheduling & view. Key components: schedule grid. APIs: `api.academic.classRoutine.*`; Access: teachers/staff.

- [school-clint/app/id-cards/page.tsx](school-clint/app/id-cards/page.tsx): Purpose: ID cards module index. Key components: navigation to templates, generate, print. APIs: `api.idcards.*`, `api.institution.profile()`; Access: staff.

- [school-clint/app/login/page.tsx](school-clint/app/login/page.tsx): Purpose: Login page. Key components: auth form. APIs: `api.auth.login()`, `api.auth.requestPasswordReset()`; Access: public.

- [school-clint/app/forgot-password/page.tsx](school-clint/app/forgot-password/page.tsx): Purpose: Password reset request UI. Key components: input & submit. APIs: `api.auth.forgotPassword()`; Access: public.

- [school-clint/app/id-cards/my-card/page.tsx](school-clint/app/id-cards/my-card/page.tsx): Purpose: View own ID card. Key components: ID preview. APIs: `api.institution.profile()`; Access: authenticated.

- [school-clint/app/library/page.tsx](school-clint/app/library/page.tsx): Purpose: Library index and quick links. Key components: cards/list. APIs: `api.library.*`; Access: staff/students.

- [school-clint/app/id-cards/generate/page.tsx](school-clint/app/id-cards/generate/page.tsx): Purpose: Bulk generate ID cards. Key components: generation UI, progress. APIs: `api.idcards.generate()`; Access: admin/staff.

- [school-clint/app/library/loans/page.tsx](school-clint/app/library/loans/page.tsx): Purpose: Loaned books list and return actions. Key components: table, actions. APIs: `api.library.loans.*`; Access: library staff.

- [school-clint/app/id-cards/bulk-generate/page.tsx](school-clint/app/id-cards/bulk-generate/page.tsx): Purpose: Bulk generation with CSV/upload. Key components: upload, status. APIs: `api.idcards.bulkGenerate()`; Access: admin.

- [school-clint/app/library/books/page.tsx](school-clint/app/library/books/page.tsx): Purpose: Book catalog management. Key components: table, filters. APIs: `api.library.books.*`; Access: library staff.

- [school-clint/app/attendance/sms-monitoring/page.tsx](school-clint/app/attendance/sms-monitoring/page.tsx): Purpose: Attendance-related SMS monitoring. Key components: lists, filters. APIs: `api.attendance.*`, SMS endpoints; Access: teachers/head.

- [school-clint/app/finance/salary/page.tsx](school-clint/app/finance/salary/page.tsx): Purpose: Salary management (payroll). Key components: tables, forms. APIs: `api.finance.salary.*`; Access: finance officer.

- [school-clint/app/leave-list/page.tsx](school-clint/app/leave-list/page.tsx): Purpose: List of leave requests. Key components: table, status controls. APIs: `api.leaves.*`; Access: staff/head.

- [school-clint/app/admin/sms-usage/page.tsx](school-clint/app/admin/sms-usage/page.tsx): Purpose: Platform SMS usage summary. Key components: charts, table. APIs: `api.admin.smsUsage()`; Access: platform admin.

- [school-clint/app/id-cards/admit-card/page.tsx](school-clint/app/id-cards/admit-card/page.tsx): Purpose: Admit card preview & printing for exams. Key components: AdmitCard, export. APIs: `api.idcards.admit()`; Access: admin/exam officers.

- [school-clint/app/finance/reports/page.tsx](school-clint/app/finance/reports/page.tsx): Purpose: Finance reports and exports. Key components: charts, CSV. APIs: `api.finance.reports()`; Access: finance officer/admin.

- [school-clint/app/finance/page.tsx](school-clint/app/finance/page.tsx): Purpose: Finance dashboard (collections, fees, summaries). Key components: cards, charts. APIs: `api.finance.*`; Access: finance officer.

- [school-clint/app/leave-application/page.tsx](school-clint/app/leave-application/page.tsx): Purpose: Submit leave application. Key components: form. APIs: `api.leaves.create()`; Access: staff.

- [school-clint/app/attendance/mark/page.tsx](school-clint/app/attendance/mark/page.tsx): Purpose: Mark attendance for a class/day. Key components: attendance grid, quick actions. APIs: `api.attendance.mark()`, `api.academic.classes.getAll()`; Access: class_teacher/teachers.

- [school-clint/app/attendance/reports/page.tsx](school-clint/app/attendance/reports/page.tsx): Purpose: Attendance reports & exports. Key components: charts/tables. APIs: `api.attendance.reports()`; Access: staff/head.

- [school-clint/app/attendance/page.tsx](school-clint/app/attendance/page.tsx): Purpose: Attendance module index. Key components: quick links, stats. APIs: `api.attendance.*`; Access: teachers.

- [school-clint/app/homework/page.tsx](school-clint/app/homework/page.tsx): Purpose: Homework assignment CRUD. Key components: forms, attachments. APIs: `api.homework.*`; Access: teachers/students.

- [school-clint/app/finance/my-fees/page.tsx](school-clint/app/finance/my-fees/page.tsx): Purpose: Student/parent view of fees and payments. Key components: invoices, pay button. APIs: `api.finance.myFees()`; Access: parent/student.

- [school-clint/app/holidays/page.tsx](school-clint/app/holidays/page.tsx): Purpose: View and manage holidays/closures. Key components: calendar/list. APIs: `api.holidays.*`; Access: staff/head.

- [school-clint/app/attendance/all-present/page.tsx](school-clint/app/attendance/all-present/page.tsx): Purpose: Mark all present UI and summary. Key components: quick-mark button. APIs: `api.attendance.markAllPresent()`; Access: teachers.

- [school-clint/app/attendance/my-attendance/page.tsx](school-clint/app/attendance/my-attendance/page.tsx): Purpose: Individual attendance history. Key components: list, charts. APIs: `api.attendance.my()`; Access: staff/students.

- [school-clint/app/finance/fees/page.tsx](school-clint/app/finance/fees/page.tsx): Purpose: Fee structure and fee item management. Key components: table/forms. APIs: `api.finance.fees.*`; Access: finance officer.

- [school-clint/app/downloads/page.tsx](school-clint/app/downloads/page.tsx): Purpose: Shared downloads page (public/institution). Key components: download cards. APIs: `api.documents.downloads()`; Access: authenticated/public depending on doc.

- [school-clint/app/institution/backup/page.tsx](school-clint/app/institution/backup/page.tsx): Purpose: Institution backup controls. Key components: backup trigger, status. APIs: `api.institution.backup()`; Access: head/admin.

- [school-clint/app/institution/teachers/page.tsx](school-clint/app/institution/teachers/page.tsx): Purpose: Institution teacher listing & management. Key components: table, actions. APIs: `api.teachers.*`, `api.institution.profile()`; Access: admin/head.

- [school-clint/app/finance/collections/page.tsx](school-clint/app/finance/collections/page.tsx): Purpose: Collections dashboard and receipts. Key components: table/chart. APIs: `api.finance.collections()`; Access: finance officer.

- [school-clint/app/institution/page.tsx](school-clint/app/institution/page.tsx): Purpose: Institution settings/index (school-level). Key components: profile, badges. APIs: `api.institution.profile()`, update endpoints; Access: head/admin.

- [school-clint/app/institution/profile/page.tsx](school-clint/app/institution/profile/page.tsx): Purpose: Edit institution profile (logo, details). Key components: forms, image upload. APIs: `api.institution.update()`, `api.institution.profile()`; Access: head/admin.

- [school-clint/app/institution/admission/page.tsx](school-clint/app/institution/admission/page.tsx): Purpose: Institution admission settings & applications. Key components: list, actions. APIs: `api.admissions.*`; Access: admin/head.

- [school-clint/app/institution/subordinates/page.tsx](school-clint/app/institution/subordinates/page.tsx): Purpose: Manage subordinate institutions or branches. Key components: list. APIs: `api.institution.subordinates()`; Access: head.

- [school-clint/app/institution/staff/page.tsx](school-clint/app/institution/staff/page.tsx): Purpose: Staff listing and role assignments. Key components: table/actions. APIs: `api.institution.staff()`; Access: head/admin.

- [school-clint/app/documents/upload/page.tsx](school-clint/app/documents/upload/page.tsx): Purpose: Upload documents (memo/admit-cards). Key components: uploader, progress. APIs: `api.documents.upload()`; Access: staff.

- [school-clint/app/documents/page.tsx](school-clint/app/documents/page.tsx): Purpose: Document management index. Key components: filters, list. APIs: `api.documents.*`; Access: staff.

- [school-clint/app/institution/students/page.tsx](school-clint/app/institution/students/page.tsx): Purpose: Student directory & bulk actions. Key components: table, import/export. APIs: `api.students.*`; Access: admin/teachers.

- [school-clint/app/documents/admit-cards/page.tsx](school-clint/app/documents/admit-cards/page.tsx): Purpose: Admit card documents management. Key components: list, generate. APIs: `api.documents.admitCards()`; Access: exam officers.

- [school-clint/app/documents/memo/page.tsx](school-clint/app/documents/memo/page.tsx): Purpose: Memo documents (internal notices). Key components: editor/list. APIs: `api.documents.memos()`; Access: staff/admin.

- [school-clint/app/documents/manage/page.tsx](school-clint/app/documents/manage/page.tsx): Purpose: Manage document templates and uploads. Key components: table, actions. APIs: `api.documents.*`; Access: admin.

- [school-clint/app/documents/management/page.tsx](school-clint/app/documents/management/page.tsx): Purpose: Alias for document management; admin functions. Key components & APIs: same as `documents/manage`.

- [school-clint/app/committee/page.tsx](school-clint/app/committee/page.tsx): Purpose: Committee members listing and roles. Key components: list. APIs: `api.committee.*`; Access: admin.

- [school-clint/app/dashboard/page.tsx](school-clint/app/dashboard/page.tsx): Purpose: School dashboard (key metrics). Key components: `PieChartCard`, `LineChartCard`. APIs: `api.dashboard.*`, `api.institution.profile()`; Access: authenticated.

- [school-clint/app/documents/sms-monitoring/page.tsx](school-clint/app/documents/sms-monitoring/page.tsx): Purpose: Document-triggered SMS monitoring view. Key components: tables. APIs: SMS endpoints and `api.documents.*`.

- [school-clint/app/class-routine/page.tsx](school-clint/app/class-routine/page.tsx): Purpose: Class routine overview (all classes). Key components: schedule grid. APIs: `api.classRoutine.*`; Access: teachers/staff.

(End of concise index — covers pages discovered in `app/**/page.tsx` scan.)

If you want, I can:
- expand any page with full component/prop-level details and exact API call lines, or
- generate a per-page markdown file under `school-clint/docs/pages/` with deeper extraction.

Which option do you prefer?