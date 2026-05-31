"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, BookOpenCheck, CreditCard, Loader2, ShieldCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authManager } from "@/lib/auth";
import { api } from "@/lib/api";

const features = [
  {
    title: "Academic Control",
    description: "Classes, subjects, exams, results and report cards in one clean workflow.",
    icon: BookOpenCheck,
  },
  {
    title: "Attendance & ID Cards",
    description: "Track daily attendance and connect every student, teacher and staff member with secure ID cards.",
    icon: BadgeCheck,
  },
  {
    title: "Finance & Reports",
    description: "Manage fees, salary, collections, due reports and receipts with role-aware access.",
    icon: CreditCard,
  },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [subdomainName, setSubdomainName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'easyschool.live';
      const isLocal = /^(localhost|127\.0\.0\.1)$/i.test(hostname);
      const hostParts = hostname.split('.').filter(Boolean);

      let sub = '';
      if (hostname.endsWith(mainDomain)) {
        const suffix = mainDomain.split('.').length;
        if (hostParts.length > suffix) {
          sub = hostParts.slice(0, hostParts.length - suffix).join('.');
        }
      } else if (isLocal) {
        if (hostParts.length > 1) {
          sub = hostParts.slice(0, hostParts.length - 1).join('.');
        }
      } else {
        if (hostParts.length >= 3) {
          sub = hostParts.slice(0, hostParts.length - 2).join('.');
        }
      }

      if (sub && !['www', 'app', 'api', 'admin'].includes(sub.toLowerCase())) {
        setIsSubdomain(true);
        setSubdomainName(sub.toLowerCase());

        // Fetch the specific school's details for public display
        api.admissions.schools()
          .then((res: any) => {
            const list = res.schools || [];
            if (list.length > 0) {
              setSchoolData(list[0]);
            }
            setChecking(false);
          })
          .catch(() => {
            setChecking(false);
          });
        return;
      }
    }

    if (authManager.isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
      </main>
    );
  }

  if (isSubdomain) {
    const schoolName = schoolData?.name || subdomainName.toUpperCase().replace(/-/g, ' ');
    const schoolType = schoolData?.type || 'school';
    const schoolAddress = schoolData?.address && schoolData.address !== 'Not provided' ? schoolData.address : '760 Education Ave, New York';
    const schoolPhone = schoolData?.phone && schoolData.phone !== 'Not provided' ? schoolData.phone : '+1 (555) 123-4567';
    const schoolEmail = schoolData?.email ? schoolData.email : `info@${subdomainName}.easyschool.live`;
    const schoolLogo = schoolData?.logo || '';

    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans">
        {/* Header */}
        <header className="border-b border-slate-100 bg-white sticky top-0 z-50 shadow-sm">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              {schoolLogo ? (
                <img src={schoolLogo} alt="Logo" className="h-12 w-12 object-contain rounded-full border border-slate-100" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg shadow-inner">
                  {schoolName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-base font-bold leading-tight tracking-tight text-slate-900 uppercase">{schoolName}</p>
                <p className="text-xs text-slate-500 capitalize">{schoolType} Portal</p>
              </div>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600">
              <a href="#home" className="text-blue-600 hover:text-blue-700 transition">HOME</a>
              <a href="#academics" className="hover:text-blue-600 transition">ACADEMICS</a>
              <a href="#events" className="hover:text-blue-600 transition">NEWS & EVENTS</a>
              <a href="#about" className="hover:text-blue-600 transition">ABOUT US</a>
              <a href="#contact" className="hover:text-blue-600 transition">CONTACT US</a>
              <Link href="/result" className="hover:text-blue-600 transition text-emerald-600 font-bold">RESULTS LOOKUP</Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm px-4">
                <Link href="/admission">APPLY NOW</Link>
              </Button>
              <Button asChild variant="ghost" size="sm" className="text-slate-700 hover:text-blue-600 font-semibold border border-slate-200">
                <Link href="/login">LOGIN</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section id="home" className="relative bg-slate-900 py-24 sm:py-32 lg:py-40 overflow-hidden min-h-[460px] flex items-center">
          <div className="absolute inset-0 z-0 opacity-40">
            <img 
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=1200" 
              alt="School classroom" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950 to-slate-950/80 mix-blend-multiply" />
          </div>
          
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left text-white max-w-2xl">
            <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-xs font-semibold uppercase tracking-wider text-blue-300 mb-6">
              ADMISSIONS OPEN FOR {new Date().getFullYear()}-{new Date().getFullYear() + 1}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white drop-shadow-sm leading-tight">
              NURTURING MINDS,<br className="hidden sm:inline" /> SHAPING FUTURES
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
              We provide a safe, encouraging, and academically challenging environment to help your children unlock their full potential.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-lg shadow-blue-500/20 px-8">
                <Link href="/admission">APPLY NOW</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 hover:text-white font-bold rounded-md px-8">
                <a href="#about">LEARN MORE</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Announcement Banner */}
        <div className="bg-blue-700 text-white py-3 px-4 shadow-inner">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-xs sm:text-sm font-semibold tracking-wide">
            <span>📢 LATEST ANNOUNCEMENT: ACADEMIC CALENDAR RELEASED</span>
            <span className="hidden sm:inline text-blue-300">•</span>
            <span>ONLINE ADMISSION APPLICATIONS ARE NOW BEING ACCEPTED</span>
          </div>
        </div>

        {/* Core Cards Section */}
        <section id="academics" className="py-16 bg-slate-50 border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              
              {/* Card 1 */}
              <div className="bg-blue-600 text-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300 min-h-[220px]">
                <div>
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">ACADEMICS</h3>
                  <p className="text-sm text-blue-100 leading-relaxed mb-4">
                    Curriculum, faculties, modern classrooms, labs, and interactive study material.
                  </p>
                </div>
                <a href="#about" className="text-xs font-bold tracking-wider hover:underline inline-flex items-center gap-1">
                  READ MORE <span className="text-[10px]">▶</span>
                </a>
              </div>

              {/* Card 2 */}
              <div className="bg-emerald-600 text-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300 min-h-[220px]">
                <div>
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">ADMISSIONS</h3>
                  <p className="text-sm text-emerald-100 leading-relaxed mb-4">
                    Simple online admissions, fee calculator, eligibility criteria, and step guidelines.
                  </p>
                </div>
                <Link href="/admission" className="text-xs font-bold tracking-wider hover:underline inline-flex items-center gap-1">
                  READ MORE <span className="text-[10px]">▶</span>
                </Link>
              </div>

              {/* Card 3 */}
              <div className="bg-cyan-600 text-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300 min-h-[220px]">
                <div>
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">CAMPUS LIFE</h3>
                  <p className="text-sm text-cyan-100 leading-relaxed mb-4">
                    Student clubs, library resources, physical activities, and co-curricular programs.
                  </p>
                </div>
                <a href="#about" className="text-xs font-bold tracking-wider hover:underline inline-flex items-center gap-1">
                  READ MORE <span className="text-[10px]">▶</span>
                </a>
              </div>

              {/* Card 4 */}
              <div className="bg-rose-700 text-white rounded-xl shadow-md p-6 flex flex-col justify-between hover:translate-y-[-4px] transition-transform duration-300 min-h-[220px]">
                <div>
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center mb-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-2">BEYOND CLASSROOM</h3>
                  <p className="text-sm text-rose-100 leading-relaxed mb-4">
                    Community work, sports tournaments, debating, and cultural celebrations.
                  </p>
                </div>
                <a href="#about" className="text-xs font-bold tracking-wider hover:underline inline-flex items-center gap-1">
                  READ MORE <span className="text-[10px]">▶</span>
                </a>
              </div>

            </div>
          </div>
        </section>

        {/* Upcoming Events, Admissions, and Knowledge Hub Info */}
        <section id="events" className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-3">
              
              {/* Upcoming Events Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    UPCOMING EVENTS
                  </h2>
                  <a href="#events" className="text-xs font-bold text-blue-600 hover:underline">VIEW ALL &gt;</a>
                </div>

                <div className="divide-y divide-slate-100">
                  {/* Event 1 */}
                  <div className="flex gap-4 py-4 items-start">
                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2.5 min-w-[64px] border border-blue-100 text-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">JAN</span>
                      <span className="text-xl font-extrabold text-slate-800">15</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        BARBRIK KRIDA RASTIVOVITA (ANNUAL SPORTS DAY)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">Time: 9:00 AM - 4:00 PM · School Grounds</p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  <div className="flex gap-4 py-4 items-start">
                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2.5 min-w-[64px] border border-blue-100 text-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">JAN</span>
                      <span className="text-xl font-extrabold text-slate-800">20</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        ADMISSION ENTRANCE TEST (CLASS VI-IX)
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">Time: 10:00 AM - 1:00 PM · Examination Hall</p>
                    </div>
                  </div>

                  {/* Event 3 */}
                  <div className="flex gap-4 py-4 items-start">
                    <div className="flex flex-col items-center justify-center bg-blue-50 rounded-lg p-2.5 min-w-[64px] border border-blue-100 text-center">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">JUL</span>
                      <span className="text-xl font-extrabold text-slate-800">01</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        PARENT-TEACHER ASSOCIATION MEETING
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">Time: 3:00 PM - 5:00 PM · Main Auditorium</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admissions Column */}
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                    ADMISSIONS
                  </h2>
                </div>
                
                <div className="rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-50/50 p-4 space-y-4">
                  <img 
                    src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=600" 
                    alt="Students in laboratory" 
                    className="w-full h-40 object-cover rounded-lg shadow-sm"
                  />
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Experience state-of-the-art learning. We offer online admission applications, simplified screening, and dedicated faculty support to help your child excel.
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <img 
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100" 
                        alt="Aisha Khan" 
                        className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 leading-none">Mrs. Aisha Khan</p>
                        <p className="text-[10px] text-slate-500 mt-1">Admissions Coordinator &gt;</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Knowledge Hub Column */}
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
                    KNOWLEDGE HUB
                  </h2>
                </div>

                <div className="space-y-6 pt-2">
                  {/* Item 1 */}
                  <div className="flex gap-4 items-start">
                    <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 tracking-tight">EXCELLENCE</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        High academic achievements, structured curriculum, and a focus on core learning standards.
                      </p>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="flex gap-4 items-start">
                    <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 tracking-tight">COMMUNITY</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Strong parent-teacher collaboration and interactive platforms supporting student growth.
                      </p>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex gap-4 items-start">
                    <div className="h-12 w-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-800 tracking-tight">INNOVATION</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Encouraging practical learning, science labs, debate, arts, and creative thinking.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16 bg-slate-50 border-t border-slate-100">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ABOUT OUR INSTITUTION</h2>
            <div className="h-1 w-20 bg-blue-600 mx-auto rounded-full" />
            <p className="text-base text-slate-600 leading-relaxed">
              We are dedicated to building a community of learners who strive for excellence, demonstrate strong character, and make positive contributions to society. Our comprehensive approach ensures every student receives academic, social, and emotional guidance to excel in today&apos;s dynamic world.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="bg-blue-900 text-white pt-16 pb-8 border-t border-blue-950 mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 pb-12 border-b border-blue-800">
              
              {/* Contact Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold tracking-wider uppercase border-b border-blue-800 pb-2">CONTACT US</h4>
                <div className="space-y-3 text-xs text-blue-200">
                  <p className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{schoolAddress}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{schoolPhone}</span>
                  </p>
                  <p className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{schoolEmail}</span>
                  </p>
                </div>
              </div>

              {/* Quick Links Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold tracking-wider uppercase border-b border-blue-800 pb-2">QUICK LINKS</h4>
                <div className="flex flex-col gap-2 text-xs text-blue-200 font-semibold">
                  <a href="#home" className="hover:text-white transition">Home Page</a>
                  <Link href="/admission" className="hover:text-white transition">Admission Form</Link>
                  <Link href="/result" className="hover:text-white transition">Results Portal</Link>
                  <Link href="/login" className="hover:text-white transition">Dashboard Login</Link>
                </div>
              </div>

              {/* Follow Us Column */}
              <div className="space-y-4">
                <h4 className="text-sm font-extrabold tracking-wider uppercase border-b border-blue-800 pb-2">FOLLOW US</h4>
                <div className="flex gap-3 text-white font-bold text-sm">
                  <a href="#contact" className="h-8 w-8 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition">
                    <span>f</span>
                  </a>
                  <a href="#contact" className="h-8 w-8 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition">
                    <span>t</span>
                  </a>
                  <a href="#contact" className="h-8 w-8 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition">
                    <span>y</span>
                  </a>
                  <a href="#contact" className="h-8 w-8 rounded-full bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition">
                    <span>i</span>
                  </a>
                </div>
                <div className="flex flex-col gap-1 text-[10px] text-blue-300 font-medium">
                  <Link href="/login" className="hover:underline">Student Portal</Link>
                  <Link href="/login" className="hover:underline">Teacher Portal</Link>
                  <Link href="/login" className="hover:underline">Staff Portal</Link>
                </div>
              </div>

              {/* Logo Column */}
              <div className="flex flex-col items-center sm:items-start lg:items-end justify-center">
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Logo" className="h-20 w-20 object-contain rounded-full bg-white/10 p-1 border border-blue-700/50" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 border border-blue-700 text-white font-extrabold text-3xl shadow-inner">
                    {schoolName.charAt(0)}
                  </div>
                )}
                <p className="text-[10px] text-blue-300 mt-3 font-semibold text-center sm:text-left lg:text-right uppercase leading-tight">
                  {schoolName}
                </p>
              </div>

            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-[10px] text-blue-300 gap-4 text-center sm:text-left">
              <p>© {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
              <p>Powered by <a href="https://easyschool.live" className="text-white hover:underline font-bold">EASY SCHOOL</a></p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex flex-col sm:flex-row sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-2 sm:gap-0 py-3 sm:py-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-md shadow-primary/20">
              E
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">EASY SCHOOL</p>
              <p className="mt-1 text-xs text-muted-foreground">School/Madrasah Management</p>
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href="/downloads">Download App</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full sm:w-auto">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm" className="w-full sm:w-auto">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Role-based school operations
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            EASY SCHOOL - School/Madrasah Management System
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            A professional dashboard for academics, attendance, finance, ID cards, documents, notices, parents and staff operations.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row flex-wrap">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/login">
                Login to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/pricing">See plans</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/admission">Apply for admission</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link href="/result">Check result</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
              <Link href="/downloads">Download Android app</Link>
            </Button>
          </div>

          {/* Quick action tiles for mobile */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:hidden">
            <Link href="/id-cards/generate" className="rounded-md border border-border bg-card p-3 text-center text-sm font-medium shadow-sm hover:bg-popover">Generate ID</Link>
            <Link href="/attendance/mark" className="rounded-md border border-border bg-card p-3 text-center text-sm font-medium shadow-sm hover:bg-popover">Scan & Mark</Link>
            <Link href="/documents/upload" className="rounded-md border border-border bg-card p-3 text-center text-sm font-medium shadow-sm hover:bg-popover">Upload Doc</Link>
            <Link href="/finance/collections" className="rounded-md border border-border bg-card p-3 text-center text-sm font-medium shadow-sm hover:bg-popover">Collect Fees</Link>
          </div>
        </div>

        <Card className="border-border bg-card shadow-lg shadow-slate-900/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersRound className="h-5 w-5 text-blue-600" />
              Live Module Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-lg border border-border bg-gradient-to-br from-background to-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-foreground">{feature.title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
