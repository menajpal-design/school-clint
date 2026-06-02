"use client";

import React from "react";
import { AlertTriangle, ArrowRight, Building2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SchoolNotFoundProps {
  subdomain: string;
}

export default function SchoolNotFound({ subdomain }: SchoolNotFoundProps) {
  const getMainDomainUrl = () => {
    if (typeof window === "undefined") return "/";
    const hostname = window.location.hostname;
    const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "easyschool.live";
    const port = window.location.port;
    const protocol = window.location.protocol;

    let targetHost = mainDomain;
    if (hostname.endsWith("localhost")) {
      targetHost = "localhost";
    } else if (hostname.endsWith("127.0.0.1")) {
      targetHost = "127.0.0.1";
    }

    return `${protocol}//${targetHost}${port ? `:${port}` : ""}`;
  };

  const handleGoToMainDomain = () => {
    if (typeof window !== "undefined") {
      window.location.href = getMainDomainUrl();
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Background abstract gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      
      <div className="w-full max-w-lg z-10">
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 md:p-10 space-y-8 transition-all duration-300">
          
          {/* Header Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-20 w-20 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-200/50 shadow-inner">
                <Building2 className="h-10 w-10 text-rose-500" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-500 text-white p-1.5 rounded-xl border-4 border-white shadow">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Texts */}
          <div className="text-center space-y-4">
            <div className="inline-flex px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 text-[11px] font-black uppercase tracking-widest text-slate-500">
              {subdomain}.easyschool.live
            </div>
            
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              বিদ্যালয়টি খুঁজে পাওয়া যায়নি <br />
              <span className="text-xl md:text-2xl font-bold text-slate-500">School Not Found</span>
            </h1>
            
            <div className="space-y-3 pt-2 text-sm text-slate-600 leading-relaxed font-medium">
              <p className="border-b border-dashed border-slate-200 pb-3">
                এই সাবডোমেনটি আমাদের সিস্টেমে নিবন্ধিত নেই বা বর্তমানে সক্রিয় নেই। অনুগ্রহ করে ডোমেন নামটি সঠিক কিনা পরীক্ষা করুন।
              </p>
              <p className="pt-1">
                This subdomain is not registered in our system or is currently inactive. Please check the URL or contact the institution administrator.
              </p>
            </div>
          </div>

          {/* Interactive buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={handleGoToMainDomain}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-750 text-white font-extrabold rounded-xl shadow-lg shadow-blue-500/10 px-6 py-6 transition active:scale-98 duration-150 flex items-center justify-center gap-2"
            >
              <Globe className="h-5 w-5" />
              প্রধান ওয়েবসাইট
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleGoToMainDomain}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 font-extrabold rounded-xl px-6 py-6 transition active:scale-98 duration-150 flex items-center justify-center gap-2"
            >
              Back to Main Portal
            </Button>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400 font-semibold tracking-wide">
            POWERED BY EASY SCHOOL SYSTEM
          </p>
        </div>
      </div>
    </main>
  );
}
