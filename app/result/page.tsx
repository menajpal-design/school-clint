'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Printer, AlertTriangle, ArrowLeft, GraduationCap, Award, BookOpen, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { getSubdomain } from '@/lib/utils';
import SchoolNotFound from '@/components/SchoolNotFound';

export default function PublicResultPage() {
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');
  const [isValidSubdomain, setIsValidSubdomain] = useState(true);
  const [schools, setSchools] = useState<any[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Form states
  const [exam, setExam] = useState('');
  const [year, setYear] = useState('');
  const [resultType, setResultType] = useState('');
  const [roll, setRoll] = useState('');
  const [reg, setReg] = useState('');
  
  // Searchable School states
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [appControlSettings, setAppControlSettings] = useState<any>({});
  
  // Captcha states
  const [captchaText, setCaptchaText] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  
  // Result and loading states
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const isDedicatedPortal = useMemo(() => {
    if (isSubdomain) return true;
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
    const isMainDomain = hostname === mainDomain || hostname === `www.${mainDomain}` || hostname === 'localhost' || hostname === '127.0.0.1';
    return !isMainDomain && selectedSchool && schools.length === 1;
  }, [isSubdomain, selectedSchool, schools]);

  // Generate dynamic captcha code and image using Canvas
  const handleRefreshCaptcha = () => {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setCaptchaText(code);
    setCaptchaInput('');
    
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add random grid lines for captcha noise
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
          ctx.stroke();
        }
        
        // Draw text
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = '#1e3a8a'; // Deep Navy Blue
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < code.length; i++) {
          ctx.save();
          ctx.translate(15 + i * 25, 20 + (Math.random() - 0.5) * 8);
          ctx.rotate((Math.random() - 0.5) * 0.4);
          ctx.fillText(code[i], 0, 0);
          ctx.restore();
        }
        setCaptchaImage(canvas.toDataURL());
      }
    }
  };

  // Subdomain detection and initial school fetching
  useEffect(() => {
    handleRefreshCaptcha();

    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
      const sub = getSubdomain(hostname, mainDomain);

      if (sub) {
        setIsSubdomain(true);
        setSubdomainName(sub);
        
        // Fetch public schools passing subdomain and domain to auto-select
        api.publicResults.schools({ subdomain: sub, domain: hostname })
          .then((res: any) => {
            const list = res.schools || [];
            if (list.length > 0) {
              setSelectedSchool(list[0]);
              setIsValidSubdomain(true);
            } else {
              setIsValidSubdomain(false);
            }
            setInitialLoading(false);
          })
          .catch(() => {
            setIsValidSubdomain(false);
            setInitialLoading(false);
          });
      } else {
        // Fallback for main domain: let user select schools
        api.publicResults.schools({ domain: hostname })
          .then((res: any) => {
            const list = res.schools || [];
            setSchools(list);
            if (list.length === 1) {
              setSelectedSchool(list[0]);
            }
            setInitialLoading(false);
          })
          .catch(() => {
            setInitialLoading(false);
          });
      }
    }
  }, []);

  // Dynamic school search when query changes (with debounce)
  useEffect(() => {
    if (isSubdomain) return;
    if (selectedSchool && selectedSchool.name === schoolSearchQuery) return;

    const delayDebounce = setTimeout(() => {
      const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
      api.publicResults.schools({ search: schoolSearchQuery, domain: hostname })
        .then((res: any) => {
          setSchools(res.schools || []);
        })
        .catch(() => {});
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [schoolSearchQuery, isSubdomain, selectedSchool]);

  // Fetch exams and app control settings for selected school
  useEffect(() => {
    if (!selectedSchool) {
      setExams([]);
      setAppControlSettings({});
      return;
    }
    setSchoolSearchQuery(selectedSchool.name || '');
    api.publicResults.options({ institutionId: selectedSchool._id })
      .then((res: any) => {
        setExams(res.exams || []);
        setAppControlSettings(res.appControlSettings || {});
      })
      .catch(() => {
        setExams([]);
        setAppControlSettings({});
      });
  }, [selectedSchool]);

  const examOptions = useMemo(() => {
    return exams.map((ex) => ({
      id: ex._id || ex.id,
      name: ex.name,
    }));
  }, [exams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('');
    setResult(null);

    if (!selectedSchool) {
      setStatus('Institution information is not selected or still loading.');
      return;
    }

    if (resultType !== '1') {
      setStatus('Please select the Individual/Detailed Result type.');
      return;
    }

    if (!roll.trim()) {
      setStatus('Please provide a valid Roll Number.');
      return;
    }

    if (captchaInput !== captchaText) {
      setStatus('Robot prevention technique check failed (incorrect CAPTCHA digits).');
      handleRefreshCaptcha();
      return;
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(exam);
    const lookupParams: any = {
      institutionId: selectedSchool._id,
      rollNumber: roll.trim(),
      regNumber: reg.trim(),
      year,
      subdomain: subdomainName || undefined,
      domain: typeof window !== 'undefined' ? window.location.hostname : undefined
    };
    if (isObjectId) {
      lookupParams.examId = exam;
    } else {
      lookupParams.exam = exam;
    }

    setLoading(true);
    try {
      const data = await api.publicResults.lookup(lookupParams) as any;
      setResult(data);
      setStatus('');
    } catch (error: any) {
      setStatus(error?.message || 'Published result not found for this candidate. Verify your Roll/Reg and exam details.');
      handleRefreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAgain = () => {
    setResult(null);
    setStatus('');
    setCaptchaInput('');
    handleRefreshCaptcha();
  };

  // Group core vs continuous assessment subjects for the tables
  const getSubjectGroups = () => {
    if (!result || !result.results) return { core: [], continuous: [] };
    
    const resultsList = result.results || [];
    const continuous = resultsList.filter((r: any) => {
      const name = String(r.subjectName || '').toLowerCase();
      const code = String(r.subjectCode || '');
      return name.includes('physical') || name.includes('career') || name.includes('arts') || name.includes('craft') || name.includes('work') || code === '147' || code === '156';
    });

    const core = resultsList.filter((r: any) => {
      const name = String(r.subjectName || '').toLowerCase();
      const code = String(r.subjectCode || '');
      return !(name.includes('physical') || name.includes('career') || name.includes('arts') || name.includes('craft') || name.includes('work') || code === '147' || code === '156');
    });

    return { core, continuous };
  };

  const { core, continuous } = getSubjectGroups();

  if (!initialLoading && isSubdomain && !isValidSubdomain) {
    return <SchoolNotFound subdomain={subdomainName} />;
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4 font-sans text-slate-800">
      {/* Print media CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, footer, nav, button, .buttons, .no-print, .print-hidden, .panel-heading {
            display: none !important;
          }
          .main-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          #page-wrapper {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .table-container {
            border: none !important;
            box-shadow: none !important;
          }
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 20px !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px 10px !important;
            text-align: left !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
          }
          .cent-align {
            text-align: center !important;
          }
        }
      `}</style>

      <div className="w-full max-w-3xl main-container space-y-6">
        {/* Institution / Portal Branding */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-200/80 pb-5 print-hidden gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-650 to-indigo-900 text-white rounded-2xl h-12 w-12 flex items-center justify-center font-extrabold text-lg shadow-lg">
              {selectedSchool ? selectedSchool.name.slice(0, 2).toUpperCase() : 'ES'}
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-indigo-950 tracking-tight leading-tight">
                {selectedSchool ? selectedSchool.name : 'Select Institution'}
              </h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                {selectedSchool?.eiin ? `EIIN: ${selectedSchool.eiin} • ` : ''}Public Results Publication Portal
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="flex items-center justify-between print-hidden">
          <Link href="/" className="text-xs font-bold text-indigo-750 hover:text-indigo-900 transition flex items-center gap-1.5 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Portal Home
          </Link>
        </div>

        {/* Search Error Message */}
        {status && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-bold text-rose-800 flex items-center gap-3 shadow-sm print-hidden animate-shake">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <span>{status}</span>
          </div>
        )}

        {/* Initial Loading State */}
        {initialLoading && (
          <div className="flex flex-col items-center justify-center py-20 print-hidden bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
            <p className="text-sm font-bold text-slate-500 tracking-wide">Resolving school portal details...</p>
          </div>
        )}

        {/* Form Panel */}
        {!result && !initialLoading && (
          <div className="page-gradient-card rounded-3xl overflow-hidden print-hidden transition-all duration-300">
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-6 py-5 text-center shadow-md">
              <div className="inline-flex p-2.5 bg-white/10 rounded-xl mb-2.5 shadow-inner">
                <GraduationCap className="h-7 w-7 text-indigo-200" />
              </div>
              <h2 className="font-extrabold text-lg tracking-tight">Search Public Result</h2>
              <p className="text-[10px] text-indigo-200/80 uppercase font-semibold tracking-wider mt-0.5">Please provide correct examinee details</p>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1. Select Institution */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center relative">
                  <label htmlFor="institution-search" className="md:col-span-5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Select Institution
                  </label>
                  <div className="md:col-span-7 relative">
                    {isDedicatedPortal ? (
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-sm font-bold text-slate-500 cursor-not-allowed"
                        value={selectedSchool?.name || ''}
                        disabled
                        readOnly
                      />
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            id="institution-search"
                            type="text"
                            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-semibold transition"
                            placeholder="Type EIIN or Institution name..."
                            value={schoolSearchQuery}
                            onChange={(e) => {
                              setSchoolSearchQuery(e.target.value);
                              setDropdownOpen(true);
                              if (selectedSchool && selectedSchool.name !== e.target.value) {
                                setSelectedSchool(null);
                              }
                            }}
                            onFocus={() => setDropdownOpen(true)}
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                            <Building2 className="h-4 w-4" />
                          </div>
                        </div>

                        {dropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => {
                                setDropdownOpen(false);
                                if (selectedSchool) {
                                  setSchoolSearchQuery(selectedSchool.name || '');
                                }
                              }} 
                            />
                            
                            <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-20 divide-y divide-slate-50 animate-fadeIn">
                              {schools.length > 0 ? (
                                schools.map((s) => (
                                  <button
                                    key={s._id}
                                    type="button"
                                    className={cn(
                                      "w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-indigo-50 transition duration-150 flex flex-col gap-0.5",
                                      selectedSchool?._id === s._id ? "bg-indigo-50/50 text-indigo-900" : "text-slate-700"
                                    )}
                                    onClick={() => {
                                      setSelectedSchool(s);
                                      setSchoolSearchQuery(s.name || '');
                                      setDropdownOpen(false);
                                    }}
                                  >
                                    <span className="font-bold text-slate-900">{s.name}</span>
                                    <span className="text-[10px] text-slate-500">
                                      {s.eiin ? `EIIN: ${s.eiin}` : ''} {s.address ? `• ${s.address}` : ''}
                                    </span>
                                  </button>
                                ))
                              ) : (
                                <div className="px-4 py-3 text-xs text-slate-500 text-center font-bold">
                                  No institutions found
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Name of Examination */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="exam" className="md:col-span-5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Name of Examination
                  </label>
                  <div className="md:col-span-7">
                    <select
                      id="exam"
                      name="exam"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-semibold transition"
                      value={exam}
                      onChange={(e) => setExam(e.target.value)}
                      required
                    >
                      <option value="">
                        {!selectedSchool 
                          ? 'Select institution first' 
                          : examOptions.length === 0 
                            ? 'No exams published yet' 
                            : 'Select One'
                        }
                      </option>
                      {examOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 3. Year of Examination */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="year" className="md:col-span-5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Year of Examination
                  </label>
                  <div className="md:col-span-7">
                    <select
                      id="year"
                      name="year"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm transition"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                    >
                      <option value="">Select One</option>
                      {Array.from({ length: 31 }, (_, i) => 2026 - i).map((y) => (
                        <option key={y} value={y.toString()}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Type of Result */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center">
                  <label htmlFor="result_type" className="md:col-span-5 text-xs font-black text-rose-600 uppercase tracking-wider">
                    Type of Result
                  </label>
                  <div className="md:col-span-7">
                    <select
                      id="result_type"
                      name="result_type"
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-bold text-indigo-950 transition"
                      value={resultType}
                      onChange={(e) => setResultType(e.target.value)}
                      required
                    >
                      <option value="">Select One</option>
                      <option value="1">Individual/Detailed Result</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Fields (displayed only when Type of Result is selected as Individual "1") */}
                {resultType === '1' && (
                  <div className="space-y-4 pt-4 border-t border-slate-200/60 animate-fadeIn">
                    
                    {/* 5. Roll Number */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center" id="col_5">
                      <label htmlFor="roll" className="md:col-span-5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Roll Number of Examinee
                      </label>
                      <div className="md:col-span-7">
                        <input
                          id="roll"
                          name="roll"
                          type="number"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition font-medium"
                          value={roll}
                          onChange={(e) => setRoll(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* 6. Registration Number */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center" id="col_6">
                      <label htmlFor="reg" className="md:col-span-5 text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Registration Number of Examinee
                      </label>
                      <div className="md:col-span-7">
                        <input
                          id="reg"
                          name="reg"
                          type="number"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition font-medium"
                          placeholder="Optional"
                          value={reg}
                          onChange={(e) => setReg(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* 7. Captcha Robot Prevention */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 items-center" id="col_10">
                      <div className="md:col-span-5 flex flex-wrap items-center gap-2">
                        <label htmlFor="captcha" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Robot Prevention Code
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          {captchaImage && (
                            <img
                              id="captcha_img"
                              src={captchaImage}
                              alt="Captcha Code"
                              className="border border-slate-200 rounded-xl select-none h-10 w-28 object-contain bg-white shadow-inner"
                            />
                          )}
                          <button
                            id="captcha_reload"
                            type="button"
                            onClick={handleRefreshCaptcha}
                            className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition duration-150 active:scale-95 flex items-center justify-center border border-indigo-200/50 shadow-sm"
                            title="Reload Code"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="md:col-span-7">
                        <input
                          id="captcha"
                          name="captcha"
                          type="number"
                          autoComplete="off"
                          className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition font-semibold"
                          placeholder="Type the 4 digits shown on the left"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {/* 8. View Result Button */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 pt-4" id="col_11">
                      <div className="md:col-span-5 hidden md:block"></div>
                      <div className="md:col-span-7 flex justify-center md:justify-start">
                        <button
                          id="submit"
                          type="submit"
                          disabled={loading}
                          className="px-8 py-3 bg-indigo-650 hover:bg-indigo-850 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 text-sm w-full sm:w-auto"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading Result...
                            </>
                          ) : (
                            'View Result'
                          )}
                        </button>
                      </div>
                    </div>

                  </div>
                )}

              </form>
            </div>
          </div>
        )}

        {/* Result Transcript Section */}
        {result && (
          <div id="page-wrapper" className="space-y-6 animate-fadeIn">
            
            {/* Header Title */}
            <div className="text-center pb-4 border-b border-slate-200">
              <h3 className="text-xl md:text-2xl font-black text-indigo-950 uppercase tracking-tight">
                {result.summary?.examName || (exam ? exam.toUpperCase() : 'SSC')} or Equivalent Examination {result.summary?.examYear ? `- ${result.summary.examYear}` : (year ? `- ${year}` : '')}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Official Result Transcript</p>
            </div>

            {/* Action Buttons */}
            <div className="row buttons flex justify-center gap-3 print-hidden" id="buttons_up">
              <button
                type="button"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl shadow transition duration-200 active:scale-95 text-xs uppercase tracking-wider"
                id="search"
                onClick={handleSearchAgain}
              >
                Search Again
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow transition duration-200 active:scale-95 flex items-center gap-1.5 text-xs uppercase tracking-wider"
                id="printbtn"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Print Transcript
              </button>
            </div>

            {/* Tables Container */}
            <div id="result_display" className="space-y-6">
              
              {/* 1. Student Information Summary Card & Table */}
              <div className="table-container border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xl">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr>
                      <th colSpan={4} className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white font-extrabold px-5 py-4 text-center sm:text-left shadow-sm">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <Award className="h-5 w-5 text-indigo-300" />
                          <span>Student Information Summary</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 w-1/4 px-5 py-3">Roll No</td>
                      <td className="w-1/4 px-5 py-3 font-extrabold text-slate-900">{result.student?.rollNumber}</td>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 w-1/4 px-5 py-3">Registration No</td>
                      <td className="w-1/4 px-5 py-3 font-bold text-slate-700">{reg || '[NOT SHOWN]'}</td>
                    </tr>
                    <tr>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Name of Student</td>
                      <td colSpan={3} className="px-5 py-3 font-black text-indigo-950 uppercase tracking-wide">
                        {result.student?.name}
                      </td>
                    </tr>
                    {result.student?.fatherName && (
                      <tr>
                        <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Father&apos;s Name</td>
                        <td colSpan={3} className="px-5 py-3 font-semibold text-slate-800 uppercase">
                          {result.student.fatherName}
                        </td>
                      </tr>
                    )}
                    {result.student?.motherName && (
                      <tr>
                        <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Mother&apos;s Name</td>
                        <td colSpan={3} className="px-5 py-3 font-semibold text-slate-800 uppercase">
                          {result.student.motherName}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Board</td>
                      <td className="px-5 py-3 font-extrabold text-slate-800 uppercase">{result.summary?.board || 'DHAKA'}</td>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Session</td>
                      <td className="px-5 py-3 font-bold text-slate-700">{result.student?.session || '-'}</td>
                    </tr>
                    <tr>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Group</td>
                      <td className="px-5 py-3 font-extrabold text-slate-800 uppercase">{result.student?.group || '-'}</td>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Gender</td>
                      <td className="px-5 py-3 font-semibold text-slate-700 uppercase">{result.student?.gender || '-'}</td>
                    </tr>
                    <tr>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Result</td>
                      <td className="px-5 py-3 font-black">
                        <span className={`border px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm ${
                          result.summary?.passed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {result.summary?.gpa || 'PASSED'}
                        </span>
                      </td>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Date of Birth</td>
                      <td className="px-5 py-3 font-semibold text-slate-700">{result.student?.dateOfBirth || '-'}</td>
                    </tr>
                    <tr>
                      <td className="font-extrabold text-slate-700 bg-slate-50/70 px-5 py-3">Name of Institute</td>
                      <td colSpan={3} className="px-5 py-3 font-extrabold text-indigo-900 uppercase" id="i_name">
                        {result.institution?.name}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* 2. Subject-wise Grade/Marks Table */}
                <div className="border-t border-slate-200 py-3.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-center font-extrabold text-sm text-indigo-950 tracking-wide flex items-center justify-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-650" />
                  <span>Subject-wise Grade/Marks</span>
                </div>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200">
                      <th className="w-1/4 px-5 py-3 border-r border-slate-200 text-center font-extrabold text-slate-900">Subject Code</th>
                      <th className="w-2/3 px-5 py-3 border-r border-slate-200 font-extrabold text-slate-900">Subject Name</th>
                      <th className="w-1/12 px-5 py-3 text-center font-extrabold text-slate-900">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {core.length > 0 ? (
                      core.map((item: any, idx: number) => {
                        const isF = item.grade === 'F' || item.isPassed === false;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                            <td className="cent-align px-5 py-3 border-r border-slate-200 text-center font-semibold text-slate-500">
                              {item.subjectCode || '-'}
                            </td>
                            <td className="px-5 py-3 border-r border-slate-200 font-extrabold uppercase text-slate-800">
                              <span className={`code_${item.subjectCode}`}>{item.subjectName}</span>
                            </td>
                            <td className={`cent-align px-5 py-3 text-center font-black ${isF ? 'text-rose-600 bg-rose-50/30' : 'text-indigo-900'}`}>
                              {item.grade || 'N/A'}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={3} className="text-center py-6 text-slate-500 font-bold">No subjects found in this category.</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* 3. Continuous Assessment Table */}
                {continuous.length > 0 && (
                  <>
                    <div className="border-t border-slate-200 py-3.5 bg-gradient-to-r from-indigo-50 to-indigo-100/50 text-center font-extrabold text-sm text-indigo-950 tracking-wide flex items-center justify-center gap-2">
                      <Building2 className="h-4 w-4 text-indigo-650" />
                      <span>Subject-wise Grade/Marks for Continuous Assessment</span>
                    </div>
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-100/70 border-b border-slate-200">
                          <th className="w-1/4 px-5 py-3 border-r border-slate-200 text-center font-extrabold text-slate-900">Subject Code</th>
                          <th className="w-2/3 px-5 py-3 border-r border-slate-200 font-extrabold text-slate-900">Subject Name</th>
                          <th className="w-1/12 px-5 py-3 text-center font-extrabold text-slate-900">Grade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {continuous.map((item: any, idx: number) => {
                          const isF = item.grade === 'F' || item.isPassed === false;
                          return (
                            <tr key={idx} className="hover:bg-slate-50/50 transition duration-150">
                              <td className="cent-align px-5 py-3 border-r border-slate-200 text-center font-semibold text-slate-500">
                                {item.subjectCode || '-'}
                              </td>
                              <td className="px-5 py-3 border-r border-slate-200 font-extrabold uppercase text-slate-800">
                                <span className={`code_${item.subjectCode}`}>{item.subjectName}</span>
                              </td>
                              <td className={`cent-align px-5 py-3 text-center font-black ${isF ? 'text-rose-600 bg-rose-50/30' : 'text-indigo-900'}`}>
                                {item.grade || 'N/A'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </>
                )}

              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="row buttons flex justify-center gap-3 print-hidden" id="buttons_down">
              <button
                type="button"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold rounded-xl shadow transition duration-200 active:scale-95 text-xs uppercase tracking-wider"
                id="search"
                onClick={handleSearchAgain}
              >
                Search Again
              </button>
              <button
                type="button"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow transition duration-200 active:scale-95 flex items-center gap-1.5 text-xs uppercase tracking-wider"
                id="printbtn"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                Print Transcript
              </button>
            </div>
            
          </div>
        )}
      </div>
    </main>
  );
}
