'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Send, GraduationCap, Building2, UserCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { getSubdomain } from '@/lib/utils';
import AdmissionFields from '@/components/admission/AdmissionFields';

type School = { _id: string; name: string; type: string; eiin?: string; address: string; phone?: string; email?: string };

const emptyForm = {
  studentName: '',
  guardianName: '',
  guardianPhone: '',
  guardianEmail: '',
  dateOfBirth: '',
  address: '',
        {/* Layout */}
        {!initialLoading && (
          <div className={`grid gap-6 ${isSubdomain || selectedSchool ? 'grid-cols-1' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>

            {/* Registered Schools List (Hidden when school is selected or on subdomain) */}
            {!isSubdomain && !selectedSchool && (
              <Card className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                <CardHeader className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-300" />
                    <CardTitle className="text-sm font-bold tracking-wide">Registered Schools</CardTitle>
                  </div>
                  <CardDescription className="text-indigo-200/80 text-[10px] uppercase font-semibold mt-1">Select the school where you want to apply</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      placeholder="Search school, address or EIIN" 
                      className="w-full px-4 py-2.5 border border-slate-355 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                    />
                    <Button onClick={loadSchools} className="bg-indigo-650 hover:bg-indigo-850 text-white font-bold rounded-xl shadow-md"><Search className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {schools.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 font-bold text-sm">No registered schools found.</p>
                    ) : (
                      schools.map((school) => (
                        <button
                          key={school._id}
                          onClick={() => setSelectedSchool(school)}
                          className={`w-full rounded-xl border p-4 text-left text-sm transition-all duration-200 ${
                            (selectedSchool as any)?._id === school._id 
                              ? 'border-indigo-500 bg-indigo-50/40 shadow-md ring-2 ring-indigo-550/10' 
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}>
                          <div className="font-extrabold text-slate-800 uppercase tracking-wide">{school.name}</div>
                          <div className="mt-1 text-xs text-slate-500 font-medium">{school.address}</div>
                          <div className="mt-1 text-[10px] text-slate-400 font-semibold">EIIN: {school.eiin || 'N/A'}</div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Form using shared AdmissionFields component */}
            <Card className={`rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white ${(isSubdomain || selectedSchool) ? 'max-w-2xl mx-auto w-full' : ''}`}>
              <CardHeader className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-300" />
                    <CardTitle className="text-sm font-bold tracking-wide">
                      {selectedSchool ? `Apply to ${selectedSchool.name}` : 'Application Details'}
                    </CardTitle>
                  </div>
                  {!isSubdomain && selectedSchool && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-indigo-200 hover:text-white border border-indigo-800 hover:bg-indigo-900/50 text-[10px] font-bold h-7 rounded-lg px-2.5"
                      onClick={() => setSelectedSchool(null)}
                    >
                      Change School
                    </Button>
                  )}
                </div>
                <CardDescription className="text-indigo-200/80 text-[10px] uppercase font-semibold mt-1">Provide student, guardian, previous school and result information</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdmissionFields values={form as any} onChange={(k, v) => update(k as any, v)} />
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Address</span>
                  <Textarea 
                    value={form.address} 
                    onChange={(e) => update('address', e.target.value)} 
                    placeholder="Street, City, State, Zip Code" 
                    className="w-full px-4 py-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-medium transition min-h-[90px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <p className={`text-xs font-bold ${status.includes('successfully') ? 'text-emerald-700' : 'text-slate-600'}`}>{status}</p>
                  <Button 
                    onClick={submit} 
                    className="w-full sm:w-auto bg-indigo-650 hover:bg-indigo-850 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 px-6 py-2.5"
                  >
                    <Send className="h-4 w-4" />
                    Submit Application
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
            </Button>
          </div>
        </header>

        {/* Initial Loading State */}
        {initialLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-white/70 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-650 mb-3" />
            <p className="text-sm font-bold text-slate-500 tracking-wide">Resolving school portal details...</p>
          </div>
        )}

<<<<<<< HEAD
        {/* Layout */}
        {!initialLoading && (
          <div className={`grid gap-6 ${isSubdomain || selectedSchool ? 'grid-cols-1' : 'lg:grid-cols-[0.9fr_1.1fr]'}`}>
            
            {/* Registered Schools List (Hidden when school is selected or on subdomain) */}
            {!isSubdomain && !selectedSchool && (
              <Card className="rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white">
                <CardHeader className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-indigo-300" />
                    <CardTitle className="text-sm font-bold tracking-wide">Registered Schools</CardTitle>
                  </div>
                  <CardDescription className="text-indigo-200/80 text-[10px] uppercase font-semibold mt-1">Select the school where you want to apply</CardDescription>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="flex gap-2">
                    <Input 
                      value={search} 
                      onChange={(e) => setSearch(e.target.value)} 
                      placeholder="Search school, address or EIIN" 
                      className="w-full px-4 py-2.5 border border-slate-355 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm"
                    />
                    <Button onClick={loadSchools} className="bg-indigo-650 hover:bg-indigo-850 text-white font-bold rounded-xl shadow-md"><Search className="h-4 w-4" /></Button>
                  </div>
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {schools.length === 0 ? (
                      <p className="text-center py-10 text-slate-400 font-bold text-sm">No registered schools found.</p>
                    ) : (
                      schools.map((school) => (
                        <button
                          key={school._id}
                          onClick={() => setSelectedSchool(school)}
                          className={`w-full rounded-xl border p-4 text-left text-sm transition-all duration-200 ${
                            (selectedSchool as any)?._id === school._id 
                              ? 'border-indigo-500 bg-indigo-50/40 shadow-md ring-2 ring-indigo-550/10' 
                              : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="font-extrabold text-slate-800 uppercase tracking-wide">{school.name}</div>
                          <div className="mt-1 text-xs text-slate-500 font-medium">{school.address}</div>
                          <div className="mt-1 text-[10px] text-slate-400 font-semibold">EIIN: {school.eiin || 'N/A'}</div>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Application Form */}
            <Card className={`rounded-3xl overflow-hidden shadow-xl border border-slate-200 bg-white ${(isSubdomain || selectedSchool) ? 'max-w-2xl mx-auto w-full' : ''}`}>
              <CardHeader className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white px-5 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-300" />
                    <CardTitle className="text-sm font-bold tracking-wide">
                      {selectedSchool ? `Apply to ${selectedSchool.name}` : 'Application Details'}
                    </CardTitle>
                  </div>
                  {!isSubdomain && selectedSchool && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-indigo-200 hover:text-white border border-indigo-800 hover:bg-indigo-900/50 text-[10px] font-bold h-7 rounded-lg px-2.5"
                      onClick={() => setSelectedSchool(null)}
                    >
                      Change School
                    </Button>
                  )}
                </div>
                <CardDescription className="text-indigo-200/80 text-[10px] uppercase font-semibold mt-1">Provide student, guardian, previous school and result information</CardDescription>
              </CardHeader>
              <CardContent className="p-6 md:p-8 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Student Name" value={form.studentName} onChange={(v) => update('studentName', v)} />
                  <Field label="Class for Admission" value={form.requestedClass} onChange={(v) => update('requestedClass', v)} />
                  <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => update('dateOfBirth', v)} />
                  <Field label="Guardian Name" value={form.guardianName} onChange={(v) => update('guardianName', v)} />
                  <Field label="Guardian Phone" value={form.guardianPhone} onChange={(v) => update('guardianPhone', v)} />
                  <Field label="Guardian Email" type="email" value={form.guardianEmail} onChange={(v) => update('guardianEmail', v)} />
                  <Field label="Previous School" value={form.previousSchool} onChange={(v) => update('previousSchool', v)} />
                  <Field label="Previous Result" value={form.previousResult} onChange={(v) => update('previousResult', v)} />
                </div>
                
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Full Address</span>
                  <Textarea 
                    value={form.address} 
                    onChange={(e) => update('address', e.target.value)} 
                    placeholder="Street, City, State, Zip Code" 
                    className="w-full px-4 py-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-medium transition min-h-[90px]"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <p className={`text-xs font-bold ${status.includes('successfully') ? 'text-emerald-700' : 'text-slate-600'}`}>{status}</p>
                  <Button 
                    onClick={submit} 
                    className="w-full sm:w-auto bg-indigo-650 hover:bg-indigo-850 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 px-6 py-2.5"
                  >
                    <Send className="h-4 w-4" />
                    Submit Application
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        )}
=======
          <Card>
            <CardHeader>
              <CardTitle>{selectedSchool ? `Apply to ${selectedSchool.name}` : 'Application Details'}</CardTitle>
              <CardDescription>Provide student, guardian, previous school and result information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <AdmissionFields values={form as any} onChange={(k, v) => update(k as any, v)} />
                <Input placeholder="Class for Admission" value={form.requestedClass} onChange={(e) => update('requestedClass', e.target.value)} />
              </div>
              <Textarea value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Full address" />
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-600">{status}</p>
                <Button onClick={submit}><Send className="mr-2 h-4 w-4" />Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
>>>>>>> 47b2f43 (chore: add redirect page for /institution/billing (sidebar link))
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</span>
      <Input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        placeholder={label} 
        className="w-full px-4 py-2.5 border border-slate-350 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white text-sm font-medium transition"
      />
    </div>
  );
}
