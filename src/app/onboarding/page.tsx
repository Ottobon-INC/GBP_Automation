import React from 'react';
import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';

export default function OnboardingMainHub() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle light background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10 mb-10">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2.5 bg-slate-900 rounded-2xl shadow-sm text-white">
            <Building2 className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold tracking-wider uppercase text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-200/80">
            Agency Client Hub
          </span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Onboarding Form
        </h2>
        <p className="mt-3 text-base text-slate-500 font-medium max-w-md mx-auto">
          Welcome to the local SEO optimization platform. Please choose your company's registry portal below to get started.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Card 1: Medcy */}
        <Link
          href="/medcy/onboarding"
          className="group relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-8 flex flex-col items-center text-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-xs cursor-pointer"
        >
          <div className="w-full flex flex-col items-center">
            <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center p-3 mb-6 border border-slate-200 shadow-xs group-hover:border-slate-300 transition-all duration-300">
              <img src="/medcy_logo.png" alt="Medcy Health Tech" className="h-full w-full object-contain" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
              Medcy Health Tech
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200/80 mt-2">
              Healthcare & Clinics
            </span>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed font-normal">
              Register clinical locations, hospitals, diagnostic centers, and specialties for targeted local SEO optimization.
            </p>
          </div>
          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
            Enter Medcy Portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Card 2: Ottobon */}
        <Link
          href="/ottobon/onboarding"
          className="group relative bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-8 flex flex-col items-center text-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-xs cursor-pointer"
        >
          <div className="w-full flex flex-col items-center">
            <div className="h-24 w-24 bg-white rounded-2xl flex items-center justify-center p-3 mb-6 border border-slate-200 shadow-xs group-hover:border-slate-300 transition-all duration-300">
              <img src="/ottobon_logo.png" alt="Ottobon Academy" className="h-full w-full object-contain p-2" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
              Ottobon Academy
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200/80 mt-2">
              Education & Colleges
            </span>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed font-normal">
              Register campuses, academies, educational institutes, and course programs for targeted maps rank pushes.
            </p>
          </div>
          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
            Enter Ottobon Portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    </div>
  );
}
