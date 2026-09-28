'use client';

import React from 'react';
import { 
  Building2, 
  GraduationCap, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  LayoutDashboard, 
  UserPlus, 
  MapPin, 
  HeartPulse, 
  BookOpen, 
  Star,
  Activity
} from 'lucide-react';

export default function BrandSelectorHub() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center relative z-10 mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-xs mb-4">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
            Unified Client Management & Automation Engine
          </span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          Select Client Portal
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-xl mx-auto font-medium">
          Choose your business vertical to manage active Google Business Profiles, AI automation, and launch tailored onboarding.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-5xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Medcy Healthcare */}
        <div className="group bg-white border-2 border-emerald-100 hover:border-emerald-300 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-600/20">
                <HeartPulse className="h-7 w-7 stroke-[2.5]" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" /> 7 Active Locations
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
              Medcy Clients
            </h2>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-emerald-600">
              Hospitals, Clinics & IVF Centers
            </p>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed font-normal">
              Specialized local marketing engine for multi-specialty hospitals, IVF & fertility clinics, diagnostics, and patient appointment management.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Medcy Multi-Specialty, Medcy IVF & Vizag IVF Network
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <Star className="h-4 w-4 text-amber-500 shrink-0" />
                Automated 100% Patient Review AI Responses & Doctor Tags
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                Healthcare Local 3-Pack Geo-Ranking Tracker
              </li>
            </ul>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <a
              href="/dashboard?brand=medcy"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-center"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Medcy Dashboard</span>
            </a>
            <a
              href="/medcy/onboarding"
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-sm font-bold rounded-2xl transition-all cursor-pointer text-center"
            >
              <UserPlus className="h-4 w-4" />
              <span>Onboard</span>
            </a>
          </div>
        </div>

        {/* Card 2: Ottobon Education */}
        <div className="group bg-white border-2 border-indigo-100 hover:border-indigo-300 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-600/20">
                <GraduationCap className="h-7 w-7 stroke-[2.5]" />
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> 4 Active Institutes
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
              Ottobon Clients
            </h2>
            <p className="mt-1 text-xs font-extrabold uppercase tracking-wider text-indigo-600">
              Schools, Colleges & Academies
            </p>

            <p className="mt-4 text-sm text-slate-600 leading-relaxed font-normal">
              Targeted growth engine for CBSE/ICSE schools, intermediate junior colleges, competitive coaching institutes (IIT-JEE/NEET), and software academies.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
                Ottobon Academy, Bansal Classes & Basara Leads
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                Curriculum, Admission & Placement Google Posts
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold">
                <Zap className="h-4 w-4 text-indigo-600 shrink-0" />
                Education District & Locality Keyword Rankings
              </li>
            </ul>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
            <a
              href="/dashboard?brand=ottobon"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-2xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer text-center"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Ottobon Dashboard</span>
            </a>
            <a
              href="/ottobon/onboarding"
              className="flex items-center justify-center gap-1.5 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-sm font-bold rounded-2xl transition-all cursor-pointer text-center"
            >
              <UserPlus className="h-4 w-4" />
              <span>Onboard</span>
            </a>
          </div>
        </div>

      </div>

      {/* Global Dashboard Link */}
      <div className="mt-10 text-center relative z-10">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white/80 hover:bg-white px-4 py-2 rounded-full border border-slate-200 shadow-2xs transition-all"
        >
          <span>Open Unified Master Dashboard (All Clients)</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
