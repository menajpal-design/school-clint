# DRMS Client - Next.js Web Application

Distributed Records Management System - Next.js Frontend

## Overview

Modern, responsive web application for school management with:
- Role-based dashboard
- Student, teacher, and staff management
- Attendance tracking and reporting
- Financial management interface
- Academic result management
- ID card generation and download
- Document management
- Notice board
- Parent portal
- Committee management
- Comprehensive analytics and charts
- Mobile-friendly responsive design

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running on `http://localhost:5000`

## Installation

1. **Navigate to client folder:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Setup environment variables:**
Create a `.env.local` file in the client root:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=
```

## Project Structure

```
client/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard with charts
│   ├── id-cards/
│   │   ├── page.tsx            # ID card list
│   │   ├── my-card/page.tsx    # My ID card
│   │   ├── generate/page.tsx   # Generate card form
│   │   ├── bulk-generate/page.tsx
│   │   ├── templates/page.tsx  # Card templates
│   │   ├── reports/page.tsx    # Card reports
│   │   └── renewal/page.tsx    # Card renewal
│   ├── attendance/
│   │   ├── page.tsx            # Attendance list
│   │   ├── mark/page.tsx       # Mark attendance
│   │   ├── reports/page.tsx    # Attendance reports
│   │   └── my-attendance/page.tsx
│   ├── academic/
│   │   ├── classes/page.tsx
│   │   ├── subjects/page.tsx
│   │   ├── exams/page.tsx
│   │   ├── results/page.tsx
│   │   └── report-card/page.tsx
│   ├── finance/
│   │   ├── fees/page.tsx
│   │   ├── collections/page.tsx
│   │   ├── salary/page.tsx
│   │   ├── reports/page.tsx
│   │   └── my-fees/page.tsx
│   ├── institution/
│   │   ├── profile/page.tsx
│   │   ├── teachers/page.tsx
│   │   ├── staff/page.tsx
│   │   ├── admission/page.tsx
│   │   └── backup/page.tsx
│   ├── notices/page.tsx        # Notice board
│   ├── documents/page.tsx      # Documents
│   ├── users-roles/page.tsx    # User management
│   ├── committee/page.tsx      # Committee
│   ├── parent-portal/page.tsx  # Parent portal
│   ├── profile/page.tsx        # User profile
│   ├── settings/page.tsx       # Settings
│   └── globals.css             # Global styles
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Navigation bar
│   │   ├── Sidebar.tsx         # Side navigation
│   │   └── AppLayout.tsx       # Main layout
│   ├── ui/                     # shadcn/ui components
│   ├── charts/                 # Chart components
│   │   ├── AttendanceChart.tsx
│   │   ├── FeeChart.tsx
│   │   └── CompositionChart.tsx
│   ├── id-cards/              # ID card components
│   │   ├── StudentIDCard.tsx
│   │   ├── TeacherIDCard.tsx
│   │   ├── StaffIDCard.tsx
│   │   ├── QRCodePreview.tsx
│   │   ├── BarcodePreview.tsx
│   │   ├── IDCardPreview.tsx
│   │   ├── DownloadButtons.tsx
│   │   └── GenerateIDCardForm.tsx
│   ├── RoleGuard.tsx           # Role-based rendering
│   └── PermissionButton.tsx    # Permission-based button
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   ├── usePermission.ts        # Permission hook
│   └── useToast.tsx            # Toast notifications
├── lib/
│   ├── api.ts                  # API client
│   ├── auth.ts                 # Auth utilities
│   ├── permissions.ts          # Permission definitions
│   ├── routes.ts               # Route constants
│   └── utils.ts                # Helper utilities
├── types/
│   └── index.ts                # TypeScript types
├── tailwind.config.js          # Tailwind configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.js              # Next.js configuration
└── package.json
```

## Key Features

### Authentication
- Login with email/password
- JWT token management
- Automatic session refresh
- Role-based redirect

### Dashboard
- Institution statistics cards
- Attendance pie chart
- Fee collection line chart
- Composition bar chart
- Quick action buttons
- Recent notices widget

### ID Card Management
- Generate single/bulk ID cards
- Download as PDF or PNG
- Email ID cards
- QR code verification
- Card renewal workflow
- Template customization
- Report generation

### Attendance Tracking
- Mark attendance by class
- Attendance reports
- Student-specific tracking
- Parent access to child attendance

### Academic Management
- Class and section management
- Subject configuration
- Exam creation
- Result entry and viewing
- Report card generation

### Finance Management
- Fee management
- Payment tracking
- Salary management
- Financial reports
- Student/parent fee portal

### User Management
- User CRUD operations
- Role assignment
- Permission management
- Activity logging

### Notice Board
- Create and publish notices
- Category organization
- Priority levels
- Parent/student notifications

### Parent Portal
- View child attendance
- View child results
- Download child ID card
- Fee payment tracking

## Technologies

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Running

### Development
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Build for Production
```bash
npm run build
npm start
```

### Lint and Format
```bash
npm run lint
npm run format
```

## Features by Role

### Head (Admin)
- Access to all features
- Full institution management
- All reports and analytics
- User management
- System backup and restore

### Assistant Head
- Manage assigned areas
- Generate ID cards
- Manage academic records
- Create notices
- View reports

### Class Teacher
- Manage class attendance
- Manage class students
- Enter and view results
- Communicate with parents

### Subject Teacher
- Manage subject results
- View attendance reports
- Enter exam marks

### Finance Officer
- Manage all fees
- Track payments
- Manage salary
- Generate financial reports

### Staff
- Manage ID cards
- Generate reports
- Support documentation

### Student
- View own profile
- Download own ID card
- View results and attendance
- Read notices

### Parent
- View child profile
- Download child ID card
- View child attendance and results
- Access fee information

### Committee Member
- Create and publish notices
- View reports

## API Integration

The application connects to the backend API at the URL specified in `NEXT_PUBLIC_API_URL`.

### Error Handling
- Automatic 401 redirect on auth failure
- Toast notifications for errors
- Fallback UI for loading states

### Token Management
- Stored in localStorage
- Automatically added to request headers
- Refreshed on demand
- Cleared on logout

## Responsive Design

- Mobile-first approach
- Hamburger menu on mobile
- Collapsible sidebar
- Touch-friendly buttons
- Optimized for all screen sizes

## Performance

- Image optimization
- Code splitting
- Dynamic imports
- Route prefetching
- API response caching

## Accessibility

- ARIA labels
- Semantic HTML
- Keyboard navigation
- Color contrast compliance
- Screen reader support

## Development Tips

### Adding a New Page
1. Create folder in `app/` directory
2. Add `page.tsx` component
3. Import layout from `components/layout`
4. Add menu item in `lib/permissions.ts`

### Adding a New API Endpoint
1. Add method to `lib/api.ts`
2. Use in components via `api.moduleName.method()`
3. Add error handling with try-catch

### Using Permissions
```typescript
import { usePermission } from '@/hooks/usePermission';

export function MyComponent() {
  const { can } = usePermission();
  
  if (can('admin:users')) {
    return <AdminPanel />;
  }
  return <RestrictedMessage />;
}
```

### Creating Charts
Use Recharts components for consistency:
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

<BarChart data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="value" fill="#3b82f6" />
</BarChart>
```

## Troubleshooting

### API Connection Error
- Ensure backend is running: `npm run dev` in server folder
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Look for CORS errors in browser console

### Login Not Working
- Verify backend database is seeded
- Check demo credentials
- Ensure JWT tokens are being stored

### Components Not Rendering
- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`
- Restart dev server

### Styling Issues
- Run Tailwind build: `npx tailwindcss build`
- Ensure `globals.css` is imported in layout
- Clear browser cache

## Build and Deploy

### Vercel (Recommended)
```bash
# Push to GitHub and connect to Vercel
# Environment variables set in Vercel dashboard
vercel --prod
```

### Docker
```bash
docker build -t drms-client .
docker run -p 3000:3000 drms-client
```

### Self-hosted
```bash
npm run build
npm start
```

## License

ISC

## Support

For issues or questions, contact the development team.
