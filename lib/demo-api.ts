import { User, UserRole } from '@/types';
import {
  appendCollectionItem,
  deleteCollectionItem,
  getCollection,
  getDemoUser,
  nextCollectionId,
  setCollection,
  updateCollectionItem,
} from './demo-store';

const now = () => new Date().toISOString();

const stripQuery = (url: string) => url.split('?')[0].replace(/^\/api/, '');

const response = (data: any) => Promise.resolve(data);

const notFound = () => response({});

const userFromRole = (role: UserRole): User => ({
  id: `${role}-demo-${Date.now()}`,
  name: `${role.replace(/_/g, ' ')} Demo`,
  email: `${role}@demo.local`,
  role,
  isActive: true,
  permissions: ['*'],
  institutionId: 'demo-institution',
});

const toList = (name: string, key: string) => ({ [key]: getCollection(name as any) });

const matchId = (items: any[], id: string) => items.find((item) => String(item._id || item.id) === String(id));

const demoDashboard = () => {
  const students = getCollection('students');
  const teachers = getCollection('teachers');
  const staff = getCollection('staff');
  const notices = getCollection('notices');
  const attendance = getCollection('attendance');
  const fees = getCollection('fees');
  const payments = getCollection('payments');

  return {
    summary: {
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalStaff: staff.length,
      todayAttendanceCount: attendance.filter((item) => item.status === 'present').length,
      monthlyFeeCollection: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      activeNotices: notices.filter((item) => item.isPublished !== false).length,
      idCardsIssued: getCollection('idCards').length,
    },
    charts: {
      attendance: [
        { name: 'Present', value: attendance.filter((item) => item.status === 'present').length },
        { name: 'Absent', value: attendance.filter((item) => item.status === 'absent').length },
        { name: 'Late', value: attendance.filter((item) => item.status === 'late').length },
        { name: 'Leave', value: attendance.filter((item) => item.status === 'leave').length },
      ],
      feeTrend: [{ name: 'This month', value: payments.reduce((sum, item) => sum + Number(item.amount || 0), 0) }],
    },
    composition: [
      { name: 'Students', value: students.length },
      { name: 'Teachers', value: teachers.length },
      { name: 'Staff', value: staff.length },
    ],
    notices: notices.slice(-5),
  };
};

const createReceiptNumber = () => `RCPT-${Date.now()}`;

const safeText = (value: any) => String(value ?? '').trim();

const sanitizeFilename = (value: string) => String(value || 'card').replace(/[^a-z0-9-_]+/gi, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'card';

async function createDemoPdfBlob(payload: any): Promise<Blob> {
  const [{ default: jsPDF }, QRCode] = await Promise.all([
    import('jspdf'),
    import('qrcode'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const cardType = String(payload.cardType || '').toLowerCase();

  if (cardType === 'teacher') {
    // Teacher ID Card Design - Updated to match server
    const cardW = 88; // Convert to mm (350px at 96dpi ≈ 88mm)
    const cardH = 125; // Convert to mm (500px at 96dpi ≈ 125mm)
    const cardX = (pageWidth - cardW) / 2;
    const cardY = (pageHeight - cardH) / 2;

    // Card background - Dark blue
    doc.setFillColor(0, 43, 54);
    doc.roundedRect(cardX, cardY, cardW, cardH, 4.23, 4.23, 'F');

    // Top White Section - Curved
    const whiteH = 58; // 230px ≈ 58mm
    doc.save();
    doc.roundedRect(cardX, cardY, cardW, whiteH, 4.23, 4.23, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(cardX, cardY, cardW, whiteH, 'F');
    doc.moveTo(cardX, cardY + whiteH);
    doc.lineTo(cardX + cardW, cardY + whiteH);
    doc.lineTo(cardX + cardW, cardY + whiteH - 6.35);
    doc.quadraticCurveTo(cardX + cardW/2, cardY + whiteH - 12.7, cardX, cardY + whiteH - 6.35);
    doc.fill();
    doc.restore();

    // Gold accent corner
    doc.setFillColor(212, 155, 65);
    doc.moveTo(cardX, cardY);
    doc.lineTo(cardX + 23.62, cardY); // 90px ≈ 23.62mm
    doc.lineTo(cardX, cardY + 23.62);
    doc.fill();

    // Photo container
    const photoY = cardY + 10.58; // 40px ≈ 10.58mm
    const photoW = 37.04; // 140px ≈ 37.04mm
    const photoH = 44.45; // 170px ≈ 44.45mm
    const photoX = cardX + (cardW - photoW) / 2;
    doc.setDrawColor(0, 43, 54);
    doc.setLineWidth(1.59); // 6px ≈ 1.59mm
    doc.roundedRect(photoX, photoY, photoW, photoH, 7.62, 7.62, 'S'); // 30px radius ≈ 7.62mm

    // Content Area
    const contentY = photoY + photoH + 2.65; // 10px ≈ 2.65mm
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.7); // 45px ≈ 12.7mm (adjusted for font size)
    doc.setTextColor(0, 0, 0);
    doc.text('TEACHER', cardX + cardW/2, contentY, { align: 'center' });

    // Info table
    const tableY = contentY + 13.23; // 50px ≈ 13.23mm
    const tableW = cardW * 0.9;
    const tableX = cardX + cardW * 0.05;
    const rowH = 6.35; // 24px ≈ 6.35mm
    const labels = ['Name:', 'Qualification:', 'ID Number:', 'Working Since:'];
    const values = [
      payload.name || 'Jessica Tomson',
      payload.qualification || 'M.Sc (Physics)',
      payload.idNumber || 'ABC-123-45678',
      payload.workingSince || 'June 2018'
    ];

    // Semi-transparent background for table
    doc.setFillColor(0, 31, 40, 0.5);
    doc.rect(tableX - 1.32, tableY - 1.32, tableW + 2.65, labels.length * rowH + 2.65, 'F');

    doc.setFontSize(3.44); // 13px ≈ 3.44mm
    labels.forEach((label, i) => {
      const y = tableY + i * rowH + 1.85; // 7px ≈ 1.85mm
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(label, tableX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(values[i], tableX + tableW * 0.4, y);
    });

    // Footer
    const footerY = cardY + cardH - 13.23; // 50px ≈ 13.23mm
    doc.setFillColor(0, 43, 54);
    doc.rect(cardX, footerY, cardW, 13.23, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.35); // 25px ≈ 6.35mm
    doc.setTextColor(212, 155, 65);
    doc.text('🔱', cardX + 2.65, footerY + 6.61); // 10px ≈ 2.65mm, 25px ≈ 6.61mm
    doc.setFontSize(3.7); // 14px ≈ 3.7mm
    doc.text('Institute Logo', cardX + 10.58, footerY + 5.29); // 40px ≈ 10.58mm, 20px ≈ 5.29mm
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(2.65); // 10px ≈ 2.65mm
    doc.setTextColor(204, 204, 204);
    doc.text('slogan text line goes here', cardX + 10.58, footerY + 8.73); // 33px ≈ 8.73mm

  } else if (cardType === 'student') {
    // Student ID Card Design - Updated to match server
    const cardW = 88; // 350px ≈ 88mm
    const cardH = 125; // 500px ≈ 125mm
    const cardX = (pageWidth - cardW) / 2;
    const cardY = (pageHeight - cardH) / 2;

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.26); // 1px ≈ 0.26mm
    doc.roundedRect(cardX, cardY, cardW, cardH, 3.18, 3.18, 'FD'); // 12px ≈ 3.18mm

    // Header - Black background
    const headerH = 47.62; // 180px ≈ 47.62mm
    doc.setFillColor(26, 26, 26);
    doc.rect(cardX, cardY, cardW, headerH, 'F');

    // Blue wave arc
    doc.save();
    doc.rect(cardX, cardY, cardW, headerH, 'F'); // Clip to header area
    doc.setFillColor(30, 115, 190);
    doc.moveTo(cardX, cardY + 21.17); // 80px ≈ 21.17mm
    doc.lineTo(cardX + cardW, cardY + 21.17);
    doc.lineTo(cardX + cardW, cardY + headerH);
    doc.quadraticCurveTo(cardX + cardW/2, cardY + headerH - 5.29, cardX, cardY + headerH); // 20px ≈ 5.29mm
    doc.fill();
    doc.restore();

    // Circular Photo
    const photoSize = 29.37; // 115px ≈ 29.37mm
    const photoX = cardX + (cardW - photoSize) / 2;
    const photoY = cardY + headerH - photoSize/2;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.06); // 4px ≈ 1.06mm
    doc.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 'FD');

    // Details Section
    const detailsY = photoY + photoSize + 3.97; // 15px ≈ 3.97mm
    const nameParts = (payload.name || 'John Smith').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.35); // 24px ≈ 6.35mm
    doc.setTextColor(0, 0, 0);
    doc.text(firstName, cardX + cardW/2, detailsY, { align: 'center' });
    if (lastName) {
      doc.setTextColor(30, 115, 190);
      doc.text(lastName, cardX + cardW/2, detailsY + 6.35, { align: 'center' }); // 24px ≈ 6.35mm
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(3.44); // 13px ≈ 3.44mm
    doc.setTextColor(136, 136, 136);
    doc.text(payload.designation || 'Graphic Designer', cardX + cardW/2, detailsY + (lastName ? 13.23 : 6.61), { align: 'center' }); // 50px ≈ 13.23mm, 25px ≈ 6.61mm

    // Fields
    const fieldsY = detailsY + (lastName ? 18.52 : 11.91); // 70px ≈ 18.52mm, 45px ≈ 11.91mm
    const fieldLabels = ['ID NO :', 'JOIN DATE :', 'Phone :', 'Mail :'];
    const fieldValues = [
      payload.idNumber || '00000',
      payload.joinDate || '01.01.2024',
      payload.phone || '+880 1700 000000',
      payload.mail || 'student@example.com'
    ];

    doc.setFontSize(3.44); // 13px ≈ 3.44mm
    fieldLabels.forEach((label, i) => {
      const y = fieldsY + i * 6.61; // 25px ≈ 6.61mm
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(187, 187, 187); // #bbbbbb
      doc.text(label, cardX + 5.29, y); // 20px ≈ 5.29mm
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(68, 68, 68); // #444444
      doc.text(fieldValues[i], cardX + 26.46, y); // 100px ≈ 26.46mm
    });

    // Footer
    const footerY = cardY + cardH - 15.88; // 60px ≈ 15.88mm
    doc.setFillColor(26, 26, 26);
    doc.rect(cardX, footerY, cardW, 15.88, 'F');

    // Footer accent shape
    doc.setFillColor(30, 115, 190);
    doc.moveTo(cardX + cardW - 35.72, footerY); // 135px ≈ 35.72mm
    doc.lineTo(cardX + cardW, footerY);
    doc.lineTo(cardX + cardW - 11.91, footerY + 15.88); // 45px ≈ 11.91mm
    doc.lineTo(cardX + cardW - 47.62, footerY + 15.88); // 180px ≈ 47.62mm
    doc.fill();

    // Logo text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.76); // 18px ≈ 4.76mm
    doc.setTextColor(255, 255, 255);
    doc.text('LOGO', cardX + cardW - 26.46, footerY + 7.94, { align: 'center' }); // 100px ≈ 26.46mm, 30px ≈ 7.94mm

  } else if (cardType === 'admit-card') {
    // Admit Card Design - IGNOU Style
    const cardW = 198.43; // 750px ≈ 198.43mm
    const cardH = 105.83; // 400px ≈ 105.83mm
    const cardX = (pageWidth - cardW) / 2;
    const cardY = (pageHeight - cardH) / 2;

    // Border
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.53); // 2px ≈ 0.53mm
    doc.rect(cardX, cardY, cardW, cardH, 'S');

    // Header Section
    const headerY = cardY + 7.94; // 30px ≈ 7.94mm
    const headerH = 21.17; // 80px ≈ 21.17mm

    // University Info with Logo
    const logoSize = 18.52; // 70px ≈ 18.52mm
    const logoX = cardX + 5.29; // 20px ≈ 5.29mm
    doc.setFillColor(10, 102, 163);
    doc.setDrawColor(10, 102, 163);
    doc.circle(logoX + logoSize/2, headerY + logoSize/2, logoSize/2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.41); // 28px ≈ 7.41mm (adjusted)
    doc.setTextColor(255, 255, 255);
    doc.text('IGNOU', logoX + logoSize/2 - 6.35, headerY + logoSize/2 - 2.12, { align: 'center' }); // 24px ≈ 7.41mm, 8px ≈ 2.12mm

    // Titles
    const titleX = logoX + logoSize + 5.29; // 20px ≈ 5.29mm
    doc.setFontSize(5.82); // 22px ≈ 5.82mm
    doc.setTextColor(0, 0, 0);
    doc.text('Indira Gandhi National Open University', titleX, headerY + 1.32, { maxWidth: cardW - 53 }); // 5px ≈ 1.32mm, 200px ≈ 53mm
    doc.setFontSize(4.5); // 17px ≈ 4.5mm
    doc.setTextColor(68, 68, 68); // #444444
    doc.text('ADMIT CARD – Term End Examination', titleX, headerY + 9.26, { maxWidth: cardW - 53 }); // 35px ≈ 9.26mm

    // QR Code Top Right
    const qrSize = 23.81; // 90px ≈ 23.81mm
    const qrX = cardX + cardW - qrSize - 5.29; // 20px ≈ 5.29mm
    const qrY = headerY;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(204, 204, 204);
    doc.setLineWidth(0.26); // 1px ≈ 0.26mm
    doc.rect(qrX, qrY, qrSize, qrSize, 'FD');
    const qrData = JSON.stringify({
      cardType: 'admit-card',
      enrollmentNumber: payload.enrollmentNumber,
      name: payload.name,
      examName: payload.examName
    });
    const qrDataUrl = await QRCode.toDataURL(qrData, { width: 180, margin: 1 });
    doc.addImage(qrDataUrl, 'PNG', qrX + 0.53, qrY + 0.53, qrSize - 1.06, qrSize - 1.06); // 2px ≈ 0.53mm, 4px ≈ 1.06mm
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(2.38); // 9px ≈ 2.38mm
    doc.setTextColor(0, 0, 0);
    doc.text('Verify Admit', qrX + qrSize/2, qrY + qrSize + 0.79, { align: 'center' }); // 3px ≈ 0.79mm

    // Header bottom line
    doc.setDrawColor(51, 51, 51);
    doc.setLineWidth(0.53); // 2px ≈ 0.53mm
    doc.line(cardX, headerY + headerH, cardX + cardW, headerY + headerH);

    // Body Section
    const bodyY = headerY + headerH + 6.35; // 24px ≈ 6.35mm
    const bodyH = 42.33; // 160px ≈ 42.33mm

    // Info Grid
    const infoX = cardX + 5.29; // 20px ≈ 5.29mm
    const infoLabels = ['Enrollment Number:', 'Programm:', 'Regional Centre:', 'Date of Birth:', 'Medium:'];
    const infoValues = [
      payload.enrollmentNumber || payload.name || '',
      payload.program || 'BACHELOR OF ARTS (BAG)',
      payload.regionalCentre || 'Delhi-1',
      payload.dateOfBirth || '15 Feb 2000',
      payload.medium || 'English'
    ];

    doc.setFontSize(3.97); // 15px ≈ 3.97mm
    infoLabels.forEach((label, i) => {
      const y = bodyY + i * 5.82; // 22px ≈ 5.82mm
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text(label, infoX, y, { maxWidth: 42.33 }); // 160px ≈ 42.33mm
      doc.setFont('helvetica', 'normal');
      doc.text(infoValues[i], infoX + 42.33, y, { maxWidth: 52.92 }); // 200px ≈ 52.92mm
    });

    // Photo
    const photoW = 34.92; // 130px ≈ 34.92mm
    const photoH = 36.51; // 140px ≈ 36.51mm
    const photoX = cardX + cardW - photoW - 5.29; // 20px ≈ 5.29mm
    const photoY = bodyY;
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.26); // 1px ≈ 0.26mm
    doc.rect(photoX, photoY, photoW, photoH, 'FD');

    // Exam Table
    const tableY = bodyY + bodyH + 5.29; // 20px ≈ 5.29mm
    const tableW = cardW - 7.94; // 30px ≈ 7.94mm
    const tableX = cardX + 3.97; // 15px ≈ 3.97mm
    const rowH = 9.26; // 35px ≈ 9.26mm
    const colWidths = [0.25, 0.25, 0.25, 0.25].map(r => tableW * r);
    const headers = ['Course Code', 'Exam Date', 'Exam Time', 'Exam Centre'];

    // Header row
    let currentX = tableX;
    doc.setFillColor(240, 240, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.26);
    headers.forEach((header, i) => {
      doc.rect(currentX, tableY, colWidths[i], rowH, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(3.44); // 13px ≈ 3.44mm
      doc.setTextColor(0, 0, 0);
      doc.text(header, currentX + 1.06, tableY + 2.65, { maxWidth: colWidths[i] - 2.12 }); // 4px ≈ 1.06mm, 10px ≈ 2.65mm, 8px ≈ 2.12mm
      currentX += colWidths[i];
    });

    // Data rows
    const examData = payload.examData || [
      { courseCode: 'BEVAE-181', examDate: '20-June-2024', examTime: 'Morning (10:00 AM)', examCentre: '0757D - Study Centre, Delhi' },
      { courseCode: 'BHIC-131', examDate: '23-June-2024', examTime: 'Morning (10:00 AM)', examCentre: '0757D - Delhi Central' },
      { courseCode: 'BPSC-131', examDate: '26-June-2024', examTime: 'Morning (10:00 AM)', examCentre: '0757D - New Delhi' }
    ];

    examData.forEach((exam: any, i: number) => {
      const rowY = tableY + rowH + i * rowH;
      currentX = tableX;
      const values = [exam.courseCode || '', exam.examDate || '', exam.examTime || '', exam.examCentre || ''];
      values.forEach((value, j) => {
        doc.rect(currentX, rowY, colWidths[j], rowH, 'FD');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(3.44); // 13px ≈ 3.44mm
        doc.setTextColor(0, 0, 0);
        doc.text(value, currentX + 1.06, rowY + 2.65, { maxWidth: colWidths[j] - 2.12 });
        currentX += colWidths[j];
      });
    });

    // Footer Note
    const noteY = tableY + rowH + (examData.length * rowH) + 5.29; // 20px ≈ 5.29mm
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(2.91); // 11px ≈ 2.91mm
    doc.setTextColor(85, 85, 85); // #555555
    doc.text('* This is a computer-generated document. Please bring this card along with a valid Identity Proof to the examination hall. Use of unfair means will lead to cancellation of candidature.', cardX + 5.29, noteY, { maxWidth: cardW - 7.94 }); // 20px ≈ 5.29mm, 30px ≈ 7.94mm
  }

  return doc.output('blob');
}

const handleCrud = (collection: string, method: string, path: string, data: any, listKey: string) => {
  const items = getCollection(collection as any);
  const id = path.split('/').filter(Boolean)[1];
  const singularKey = collection.endsWith('s') ? collection.slice(0, -1) : collection;

  if (method === 'GET' && (!id || path.endsWith('/manage'))) return response({ [listKey]: items });
  if (method === 'GET' && id) return response(matchId(items, id) || null);
  if (method === 'POST') return response({ [singularKey]: appendCollectionItem(collection as any, collection.slice(0, 3), data) });
  if (method === 'PUT' || method === 'PATCH') return response({ [singularKey]: updateCollectionItem(collection as any, id, data) });
  if (method === 'DELETE') return response({ success: deleteCollectionItem(collection as any, id) });
  return notFound();
};

export async function demoRequest(method: string, url: string, data?: any): Promise<any> {
  const path = stripQuery(url);
  const parts = path.split('/').filter(Boolean);
  const [root, first, second] = parts;

  if (root === 'auth' && method === 'POST' && first === 'login') {
    const role = (data?.role || 'head') as UserRole;
    const user = userFromRole(role);
    return response({ token: `demo-${role}-${Date.now()}`, user });
  }

  if (root === 'auth' && method === 'POST' && first === 'forgot-password') {
    return response({ message: 'Password reset instructions have been sent to your email address' });
  }

  if (root === 'auth' && method === 'POST' && first === 'register') {
    const role = 'head' as UserRole;
    const user = userFromRole(role);
    return response({ token: `demo-${Date.now()}`, user });
  }

  if (root === 'auth' && method === 'GET' && first === 'profile') {
    return response({ user: getDemoUser() || userFromRole('head') });
  }

  if (root === 'auth' && method === 'PUT' && first === 'profile') return response({ user: getDemoUser() });
  if (root === 'auth' && method === 'POST' && first === 'change-password') return response({ success: true });

  if (root === 'dashboard') {
    const state = demoDashboard();
    if (first === 'summary') return response(state.summary);
    if (first === 'charts') return response(state.charts);
    if (first === 'composition') return response(state.composition);
    if (first === 'recent-notices') return response(state.notices);
    if (first === 'stats' || first === 'attendance-overview' || first === 'fee-overview') return response(state.summary);
  }

  if (root === 'users') {
    if (method === 'GET' && (first === 'all' || first === '')) return response({ users: getCollection('users') });
    if (method === 'GET' && first === 'permissions') return response({ permissions: ['*'] });
    if (method === 'PATCH' && second === 'status') return response({ user: updateCollectionItem('users', first, { isActive: data?.isActive }) });
    if (method === 'PATCH' && second === 'role') return response({ user: updateCollectionItem('users', first, { role: data?.role }) });
    if (method === 'POST' && second === 'reset-password') return response({ success: true });
    if (method === 'PUT' && first === 'permissions') return response({ success: true, matrix: data?.matrix || {} });
    if (method === 'GET' && first) return response(matchId(getCollection('users'), first) || null);
    if (method === 'POST') return response({ user: appendCollectionItem('users', 'usr', data) });
    if (method === 'PUT' && first) return response({ user: updateCollectionItem('users', first, data) });
    if (method === 'DELETE' && first) return response({ success: deleteCollectionItem('users', first) });
  }

  if (root === 'students') return handleCrud('students', method, path, data, 'students');
  if (root === 'teachers') return handleCrud('teachers', method, path, data, 'teachers');
  if (root === 'staff') return handleCrud('staff', method, path, data, 'staff');
  if (root === 'documents') return handleCrud('documents', method, path, data, 'documents');
  if (root === 'notices') return handleCrud('notices', method, path, data, 'notices');
  if (root === 'committee') return handleCrud('committee', method, path, data, 'committee');
  if (root === 'messages') return handleCrud('messages', method, path, data, 'messages');
  if (root === 'notifications') return handleCrud('notifications', method, path, data, 'notifications');

  if (root === 'admissions') {
    if (method === 'GET' && first === 'public' && second === 'schools') return response({ schools: [{ _id: 'demo-school', name: 'Demo School', isActive: true }] });
    if (method === 'GET') return response({ admissions: getCollection('admissions') });
    if (method === 'POST' && first === 'public' && second === 'apply') return response({ admission: appendCollectionItem('admissions', 'adm', data) });
    if (method === 'POST' && second === 'accept') return response({ admission: updateCollectionItem('admissions', first, { status: 'accepted' }) });
    if (method === 'POST' && second === 'reject') return response({ admission: updateCollectionItem('admissions', first, { status: 'rejected' }) });
  }

  if (root === 'academic') {
    if (first === 'classes') return response({ classes: getCollection('classes') });
    if (first === 'subjects') return response({ subjects: getCollection('subjects') });
    if (first === 'exams') return response({ exams: getCollection('exams') });
    if (first === 'results') {
      if (second === 'students') return response({ students: getCollection('students') });
      if (second?.startsWith('student')) return response({ results: getCollection('results') });
      return response({ results: getCollection('results') });
    }
    if (first === 'report-card') {
      if (second === 'students') return response({ students: getCollection('students') });
      return response({ reportCard: getCollection('results')[0] || null });
    }
  }

  if (root === 'attendance') {
    if (first === 'students') return response({ students: getCollection('students') });
    if (first === 'reports') return response({ attendance: getCollection('attendance') });
    if (first === 'me') return response({ attendance: getCollection('attendance') });
    if (first === 'student' && second) return response({ attendance: getCollection('attendance').filter((item) => String(item.studentId?._id || item.studentId) === String(second)) });
    if (first === 'mark' && method === 'POST') {
      const records = Array.isArray(data?.records) ? data.records : [];
      records.forEach((record: any) => appendCollectionItem('attendance', 'att', record));
      return response({ success: true, attendance: getCollection('attendance') });
    }
    if (first === 'scan-id-card') {
      const student = getCollection('students').find((item) => String(item._id) === String(data?.code) || String(item.rollNumber) === String(data?.code));
      return response({ student: student || null });
    }
    return response({ attendance: getCollection('attendance') });
  }

  if (root === 'finance') {
    if (first === '') return response({ summary: demoDashboard().summary });
    if (first === 'fees') {
      if (second === 'student' && parts[3]) return response({ fees: getCollection('fees').filter((item) => String(item.studentId?._id || item.studentId) === String(parts[3])) });
      return response({ fees: getCollection('fees') });
    }
    if (first === 'payments') {
      if (method === 'GET') return response({ payments: getCollection('payments') });
      if (method === 'POST') {
        const payment = appendCollectionItem('payments', 'pay', { ...data, receiptNumber: createReceiptNumber(), paymentDate: now() });
        return response({ payment });
      }
    }
    if (first === 'collections') {
      return response({ students: getCollection('students').map((student) => ({ ...student, dueAmount: 2500 })) });
    }
    if (first === 'salary') return response({ salary: [] });
    if (first === 'process' || second === 'process') return response({ success: true });
    if (first === 'reports') return response({ reports: { collections: getCollection('payments'), dues: getCollection('fees'), salaries: [] } });
    if (first === 'my-fees') return response({ fees: getCollection('fees'), payments: getCollection('payments') });
  }

  if (root === 'id-cards') {
    if (first === 'owners' && second === 'search') return response({ people: [...getCollection('students'), ...getCollection('teachers'), ...getCollection('staff')] });
    if (first === 'me' && second === 'card') return response({ card: getCollection('idCards')[0] || null });
    if (first === 'reports' && second === 'stats') return response({ totalIssued: getCollection('idCards').length, downloads: 0, expiredCards: 0, pendingRenewals: 0, monthlyDownloads: [] });
    if (first === 'verify') return response({ valid: true });
    if (first === 'bulk') return response({ success: true, message: `Generated ${Array.isArray(data?.ids) ? data.ids.length : 0} cards` });
    if (first === 'render-pdf' && method === 'POST') return response(await createDemoPdfBlob(data));
    if (first === 'generate' && method === 'POST') {
      const card = appendCollectionItem('idCards', 'card', { ...data, userType: data?.ownerType || 'student', cardNumber: nextCollectionId('idCards', 'CARD') });
      return response({ card });
    }
    if (first === 'download') return response(new Blob([JSON.stringify({ id: parts[1], format: new URLSearchParams(url.split('?')[1] || '').get('format') || 'pdf' })], { type: 'application/pdf' }));
    if (first === 'email') return response({ success: true, message: 'Email disabled in demo mode' });
    if (first === 'renew') return response({ card: updateCollectionItem('idCards', parts[1], { status: 'active' }) });
    if (method === 'GET' && (!first || first === '')) return response(getCollection('idCards'));
    if (method === 'GET' && first) return response(matchId(getCollection('idCards'), first) || null);
    if (method === 'POST' && first === 'student' && second) return response({ card: appendCollectionItem('idCards', 'card', { userId: second, userType: 'student' }) });
    if (method === 'POST' && first === 'teacher' && second) return response({ card: appendCollectionItem('idCards', 'card', { userId: second, userType: 'teacher' }) });
    if (method === 'POST' && first === 'staff' && second) return response({ card: appendCollectionItem('idCards', 'card', { userId: second, userType: 'staff' }) });
  }

  if (root === 'institution') {
    if (first === 'plans') return response({ plans: [] });
    if (first === 'profile') return response({ institution: { _id: 'demo-institution', name: 'Demo Institution', isActive: true, billing: { billingStatus: 'demo' } } });
    if (first === 'billing' && second === 'payment') return response({ institution: { _id: 'demo-institution', isActive: true, billing: { billingStatus: 'paid' } } });
  }

  if (root === 'parent' && first === 'portal') return response({ children: getCollection('students') });
  if (root === 'backup') return response({ backups: [] });

  return notFound();
}
