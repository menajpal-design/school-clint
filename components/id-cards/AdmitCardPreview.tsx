import React from 'react';

/**
 * ADMIT CARD COMPONENT
 * This component follows the professional layout of a university admit card.
 * Features: Top-right QR code, blur effect on exam dates (as requested), and responsive design.
 */
const AdmitCardPreview = ({ data }: { data: any }) => {
  return (
    <div className="p-4 sm:p-8 flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-[850px] bg-white border-2 border-black p-4 sm:p-10 relative shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b-4 border-[#0A66A3] pb-6 mb-8 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 sm:w-24 sm:h-24 border-4 border-[#0A66A3] rounded-full flex items-center justify-center text-[#0A66A3] font-black text-3xl shrink-0">
              🔲
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-gray-900 uppercase leading-tight">
                {data.institutionName || "Institution Name"}
              </h1>
              <h2 className="text-md sm:text-xl font-bold text-gray-500 mt-2 tracking-tight">
                ADMIT CARD – {data.examName || "Examination"}
              </h2>
            </div>
          </div>
          
          {/* Top Right QR Code - Positioned as requested */}
          <div className="text-center self-center sm:self-start">
            <div className="w-28 h-28 border-2 border-gray-200 p-1.5 bg-white shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data.enrollmentNumber || data.idNumber}`} 
                alt="Admit QR" 
                className="w-full h-full" 
              />
            </div>
            <p className="text-[10px] font-black text-gray-400 mt-1.5 uppercase tracking-widest italic">
              Verify Admit Card
            </p>
          </div>
        </div>

        {/* Student Profile Section */}
        <div className="flex flex-col-reverse md:flex-row justify-between gap-8 mb-10">
          <div className="flex-grow space-y-3.5 text-sm sm:text-base">
            <div className="flex border-b border-dashed border-gray-300 pb-1.5">
              <span className="w-44 font-black text-gray-800 shrink-0">Enrollment Number:</span>
              <span className="text-gray-700 font-medium uppercase">{data.enrollmentNumber || data.idNumber || "N/A"}</span>
            </div>
            <div className="flex border-b border-dashed border-gray-300 pb-1.5">
              <span className="w-44 font-black text-gray-800 shrink-0">Student Name:</span>
              <span className="text-gray-700 font-medium">{data.name || "Student Name"}</span>
            </div>
            <div className="flex border-b border-dashed border-gray-300 pb-1.5">
              <span className="w-44 font-black text-gray-800 shrink-0">Program:</span>
              <span className="text-gray-600">{data.program || data.stream || "Program"}</span>
            </div>
            <div className="flex border-b border-dashed border-gray-300 pb-1.5">
              <span className="w-44 font-black text-gray-800 shrink-0">Class/Section:</span>
              <span className="text-gray-600">{data.stream || "Class/Section"}</span>
            </div>
            <div className="flex border-b border-dashed border-gray-300 pb-1.5">
              <span className="w-44 font-black text-gray-800 shrink-0">Date of Birth:</span>
              <span className="text-gray-600">{data.dateOfBirth || "N/A"}</span>
            </div>
            <div className="flex border-b border-dashed border-gray-300 pb-1.5">
              <span className="w-44 font-black text-gray-800 shrink-0">Exam Center:</span>
              <span className="text-gray-600 font-semibold">{data.examCenter || "Exam Center"}</span>
            </div>
          </div>

          {/* Candidate Photo */}
          <div className="w-36 h-44 sm:w-40 sm:h-48 border-4 border-black bg-gray-50 flex-shrink-0 shadow-md">
            <img 
              src={data.photoUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"} 
              alt="Student" 
              className="w-full h-full object-cover" 
            />
          </div>
        </div>

        {/* Exam Schedule Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black">
                <th className="p-4 border-r-2 border-black text-left font-black uppercase tracking-wider">Course Code</th>
                <th className="p-4 border-r-2 border-black text-left font-black uppercase tracking-wider">Exam Date</th>
                <th className="p-4 border-r-2 border-black text-left font-black uppercase tracking-wider">Exam Time</th>
                <th className="p-4 text-left font-black uppercase tracking-wider">Exam Centre</th>
              </tr>
            </thead>
            <tbody>
              {data.examData && data.examData.length > 0 ? (
                data.examData.map((exam: any, i: number) => (
                  <tr key={i} className="border-b border-gray-300 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-r-2 border-black font-black text-[#0A66A3]">{exam.courseCode}</td>
                    {/* Blur effect on date as seen in reference image */}
                    <td className="p-4 border-r-2 border-black text-gray-400 blur-[1px] select-none">{exam.examDate}</td>
                    <td className="p-4 border-r-2 border-black font-bold text-gray-700">{exam.examTime}</td>
                    <td className="p-4 font-medium text-gray-700">
                      <span className="bg-gray-800 text-white px-2 py-0.5 rounded text-[10px] mr-2 font-black">
                        {exam.centreCode || "CENTER"}
                      </span>
                      {exam.examCentre}
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-gray-300">
                  <td colSpan={4} className="p-4 text-center text-gray-500">No exam data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Instructions / Note */}
        <div className="mt-8 p-5 border-2 border-dashed border-gray-300 bg-[#f9fcff] text-[11px] sm:text-[12px] text-gray-600 leading-relaxed">
          <p className="font-bold text-red-600 mb-2 uppercase border-b border-red-100 pb-1">Important Instructions:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>This admit card must be carried during the examination. No examinee will be allowed to appear without it.</li>
            <li>Candidates must arrive at least 30 minutes before the scheduled exam time at the designated examination hall.</li>
            <li>No electronic devices (mobile phones, digital watches, calculators) are allowed in the examination hall.</li>
            <li>This is a computer-generated copy and does not require any manual signature.</li>
          </ul>
        </div>

        {/* Footer Branding */}
        <div className="mt-8 pt-4 border-t border-gray-200 flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <span>Date Generated: {new Date().toLocaleDateString()}</span>
          <span>Official Examination Portal</span>
        </div>
      </div>
    </div>
  );
};

export default AdmitCardPreview;
