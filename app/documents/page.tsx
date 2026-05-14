"use client";

import { useState } from "react";
import { Ticket, Download } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DocumentsPage() {
  const [selectedStudent, setSelectedStudent] = useState("Md Hridoy Sheikh");
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "Md Hridoy Sheikh",
    idNumber: "",
    photoUrl: "https://example.com/photo.jpg",
    institutionName: "hridoy School12w",
    institutionLogoUrl: "https://example.com/logo.png",
    principalName: "SHEIKH",
    examName: "Annual Examination 2024",
    examDate: "",
    examCenter: "",
    centerCode: "CENTER-001",
    enrollmentNumber: "-",
    program: "BACHELOR OF ARTS (BAG)",
    regionalCentre: "Delhi-1",
    dateOfBirth: "15 Feb 2000",
    medium: "English"
  });

  const previewExamData = [
    { courseCode: 'BEVAE-181', examDate: '00-00-0000', examTime: '', examCentre: '0757DINOU Study' },
    { courseCode: 'BHIC-131', examDate: '00-00-0000', examTime: 'Morning (10 AM)', examCentre: '0757DCentre, Delhi' },
    { courseCode: 'BPSC-131', examDate: '00-00-0000', examTime: 'Morning (10 AM)', examCentre: '0757DCentre, Delhi' },
    { courseCode: 'BHDLA-135', examDate: '00-00-0000', examTime: 'Morning (10 AM)', examCentre: '0757DCentre, Delhi' },
    { courseCode: 'BPAG-171', examDate: '00-00-0000', examTime: 'Morning (10 AM)', examCentre: '0757DCentre, Delhi' },
    { courseCode: 'BSOC-131', examDate: '00-00-0000', examTime: 'Morning (10 AM)', examCentre: '0757DCentre, Delhi' }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStudentSelect = (value: string) => {
    setSelectedStudent(value);
    setFormData(prev => ({ ...prev, fullName: value }));
  };

  const handleGeneratePreview = () => {
    setShowPreview(true);
  };

  const handleDownloadAdmitCard = async () => {
    try {
      const payload = {
        cardType: 'admit-card',
        name: formData.fullName || selectedStudent,
        enrollmentNumber: formData.enrollmentNumber || formData.fullName || selectedStudent,
        program: formData.program,
        regionalCentre: formData.regionalCentre,
        dateOfBirth: formData.dateOfBirth,
        medium: formData.medium,
        photoUrl: formData.photoUrl,
        examData: previewExamData
      };

      const response = await fetch('/api/id-cards/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admit-card-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to generate admit card');
      }
    } catch (error) {
      console.error('Error downloading admit card:', error);
    }
  };

  const qrData = encodeURIComponent(`ENR:${formData.enrollmentNumber || '-'}|NAME:${formData.fullName || selectedStudent}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Generate Admit Card"
        description="Create an English admit card with student photo, exam details, download button and mandatory QR code."
        icon={Ticket}
      />

      <Card>
        <CardHeader>
          <CardTitle>Admit Card</CardTitle>
          <CardDescription>Fill the form below and preview the admit card before downloading the PDF.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Card Type</Label>
              <Select value="admit-card" disabled>
                <SelectTrigger>
                  <SelectValue>Admit Card</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admit-card">Admit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student">Select Student</Label>
              <Select value={selectedStudent} onValueChange={handleStudentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Md Hridoy Sheikh">Md Hridoy Sheikh</SelectItem>
                  <SelectItem value="Arjun Kumar Singh">Arjun Kumar Singh</SelectItem>
                  <SelectItem value="Priya Sharma">Priya Sharma</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="e.g., Arjun Kumar Singh"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="idNumber">ID / Roll Number</Label>
              <Input
                id="idNumber"
                placeholder="e.g., A-101"
                value={formData.idNumber}
                onChange={(e) => handleInputChange("idNumber", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photoUrl">Photo URL</Label>
            <Input
              id="photoUrl"
              placeholder="https://example.com/photo.jpg"
              value={formData.photoUrl}
              onChange={(e) => handleInputChange("photoUrl", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="institutionName">Institution Name</Label>
              <Input
                id="institutionName"
                value={formData.institutionName}
                onChange={(e) => handleInputChange("institutionName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institutionLogoUrl">Institution Logo URL</Label>
              <Input
                id="institutionLogoUrl"
                placeholder="https://example.com/logo.png"
                value={formData.institutionLogoUrl}
                onChange={(e) => handleInputChange("institutionLogoUrl", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="principalName">Principal / Head Name</Label>
            <Input
              id="principalName"
              placeholder="SHEIKH"
              value={formData.principalName}
              onChange={(e) => handleInputChange("principalName", e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="examName">Exam Name</Label>
              <Input
                id="examName"
                placeholder="e.g., Annual Examination 2024"
                value={formData.examName}
                onChange={(e) => handleInputChange("examName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examDate">Exam Date</Label>
              <Input
                id="examDate"
                type="date"
                placeholder="mm/dd/yyyy"
                value={formData.examDate}
                onChange={(e) => handleInputChange("examDate", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="examCenter">Exam Center</Label>
              <Input
                id="examCenter"
                placeholder="e.g., School Campus, Hall A"
                value={formData.examCenter}
                onChange={(e) => handleInputChange("examCenter", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="centerCode">Center Code</Label>
              <Input
                id="centerCode"
                placeholder="e.g., CENTER-001"
                value={formData.centerCode}
                onChange={(e) => handleInputChange("centerCode", e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handleGeneratePreview} className="flex-1">
              Generate Preview
            </Button>
            <Button onClick={handleDownloadAdmitCard} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download Admit Card
            </Button>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <Card className="border-black border-2">
          <CardHeader>
            <CardTitle>Card Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full border-2 border-[#0A66A3] bg-white flex items-center justify-center text-[#0A66A3] font-bold text-2xl">
                    🔲
                  </div>
                  <div>
                    <p className="text-sm uppercase font-bold">{formData.institutionName}</p>
                    <p className="text-xs text-slate-600 font-semibold mt-1">ADMIT CARD – Term End Examination</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="w-24 h-24 rounded border border-slate-300 overflow-hidden bg-white">
                    <img src={qrUrl} alt="QR Code" className="w-full h-full object-cover" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.15em] mt-2 font-bold">Verify Admit</p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.8fr_1fr]">
                <div className="space-y-3 text-sm">
                  <div className="flex gap-2">
                    <span className="font-bold w-36">Enrollment Number:</span>
                    <span>{formData.enrollmentNumber || '-'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold w-36">Programme:</span>
                    <span>{formData.program}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold w-36">Regional Centre:</span>
                    <span>{formData.regionalCentre}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold w-36">Date of Birth:</span>
                    <span>{formData.dateOfBirth}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-bold w-36">Medium:</span>
                    <span>{formData.medium}</span>
                  </div>
                </div>
                <div className="w-full h-40 border border-black bg-slate-50 flex items-center justify-center uppercase text-xs font-bold">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                  ) : (
                    'PHOTO'
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black bg-slate-100 px-3 py-2 text-left uppercase">Course Code</th>
                      <th className="border border-black bg-slate-100 px-3 py-2 text-left uppercase">Exam Date</th>
                      <th className="border border-black bg-slate-100 px-3 py-2 text-left uppercase">Exam Time</th>
                      <th className="border border-black bg-slate-100 px-3 py-2 text-left uppercase">Exam Centre</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewExamData.map((item, index) => (
                      <tr key={index}>
                        <td className="border border-black px-3 py-2">{item.courseCode}</td>
                        <td className="border border-black px-3 py-2 text-slate-600">{item.examDate}</td>
                        <td className="border border-black px-3 py-2">{item.examTime || '\u00A0'}</td>
                        <td className="border border-black px-3 py-2">{item.examCentre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-slate-600 italic">
                * This is a computer-generated document. Please bring this card along with a valid Identity Proof to the examination hall. Use of unfair means will lead to cancellation of candidature.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

