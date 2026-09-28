'use client';

import { MapPin, Globe, ArrowRight, Building2, Sparkles, Layout, ShieldCheck, Zap, Users, Calendar, MessageSquare, Star } from 'lucide-react';

interface OnboardingTypeSelectorProps {
  brand: string;
}

export default function OnboardingTypeSelector({ brand }: OnboardingTypeSelectorProps) {
  const isOttobon = brand === 'ottobon';

  const brandTitle = isOttobon ? 'Ottobon Education Portal' : 'Medcy Health Tech Portal';
  const brandSub = isOttobon
    ? 'Choose your educational institution or campus onboarding service below.'
    : 'Choose your hospital, clinic, or healthcare onboarding service below.';
  
  const logoUrl = isOttobon ? '/ottobon_logo.png' : '/medcy_logo.png';
  const badgeStyle = isOttobon
    ? 'text-amber-800 bg-amber-50 border-amber-200/80 font-bold'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200/80 font-bold';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle light background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10 mb-10">
        <div className="flex flex-col items-center justify-center gap-2.5 mb-3">
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-2.5 mb-1 border border-slate-200 shadow-sm">
            <img src={logoUrl} alt={brandTitle} className="h-full w-full object-contain" />
          </div>
          <span className={`text-xs uppercase tracking-wider px-3.5 py-1 rounded-lg border ${badgeStyle}`}>
            {brandTitle}
          </span>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Select Onboarding Type
        </h2>
        <p className="mt-2.5 text-sm font-medium text-slate-500 max-w-md mx-auto">
          {brandSub}
        </p>
      </div>

      <div className={`sm:mx-auto sm:w-full relative z-10 grid grid-cols-1 gap-6 ${!isOttobon ? 'sm:max-w-7xl lg:grid-cols-2 xl:grid-cols-4' : 'sm:max-w-4xl sm:grid-cols-2'}`}>
        {/* Card 1: GMB / Local SEO */}
        <a
          href={`/${brand}/onboarding/gbp`}
          className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
                <MapPin className="h-7 w-7" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Local SEO
              </span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Google Business Profile (GBP)
            </h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Maps Ranking & AI Post Automation
            </p>
            <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
              Verify your location on Google Maps, link your live OAuth credentials, and activate automated weekly AI-generated posts, Q&A seeding, and review management.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                Live Google Maps Location Verification
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Zap className="h-4 w-4 text-indigo-600 shrink-0" />
                Weekly AI Post & Offer Publishing
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                Voice Search FAQ & Keyword Optimization
              </li>
            </ul>
          </div>

          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
            <span>Start GBP Onboarding</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </div>
        </a>

        {/* Card 2: Website Design & Development */}
        <a
          href={`/${brand}/onboarding/website`}
          className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
                <Globe className="h-7 w-7" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200/60 flex items-center gap-1.5">
                <Layout className="h-3.5 w-3.5" /> Custom Web
              </span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-violet-600 transition-colors">
              Website Development
            </h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Interactive 22-Section Client Intake Wizard
            </p>
            <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
              Design a modern, premium, responsive website for your brand. Provide your branding preferences, service catalogs, team profiles, domain details, and feature requirements.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Layout className="h-4 w-4 text-violet-600 shrink-0" />
                Typeform & Stripe Inspired Multi-Step Wizard
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                Dynamic Service, Team & Gallery Assets
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Zap className="h-4 w-4 text-emerald-600 shrink-0" />
                Autosave Progress & Print-to-PDF Specs Report
              </li>
            </ul>
          </div>

          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-violet-600 transition-colors">
            <span>Start Website Onboarding</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </div>
        </a>

        {/* Card 3: Patient Management Portal (Medcy Only) */}
        {!isOttobon && (
          <a
            href={`/${brand}/onboarding/patient_management`}
            className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
                  <Users className="h-7 w-7" />
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Clinic Portal
                </span>
              </div>
              
              <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Patient Management
              </h3>
              <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Multi-Tenant Clinic & Roster Setup
              </p>
              <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
                Configure your multi-tenant hospital environment. Provide superadmin credentials, register doctors and scheduling hours, and migrate historical patient and appointment databases.
              </p>

              <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  Primary Superadmin Root Setup
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                  Staff Roster & Working Hours Configuration
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                  Patient & Future Appointments CSV Ingestion
                </li>
              </ul>
            </div>

            <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
              <span>Start Patient Management</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </div>
          </a>
        )}

        {/* Card 4: WhatsApp Automation (Medcy Only) */}
        {!isOttobon && (
          <a
            href={`/${brand}/onboarding/whatsapp_automation`}
            className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3.5 bg-gradient-to-br from-emerald-500 to-indigo-600 text-white rounded-2xl shadow-sm">
                  <Zap className="h-7 w-7 stroke-[2.5]" />
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" /> AI Chatbot
                </span>
              </div>
              
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                WhatsApp & Meta Automation
              </h3>
              <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
                Configure AI Chatbots, WhatsApp Cloud API, Meta Business Manager, and automated 5-Star Google Review invitations for your multi-specialty hospital.
              </p>

              <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
                  Meta WABA & API Credentials
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <Users className="h-4 w-4 text-indigo-600 shrink-0" />
                  Departments & Doctor Rosters
                </li>
                <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <Star className="h-4 w-4 text-amber-500 shrink-0" />
                  Automated Google Review Collection
                </li>
              </ul>
            </div>

            <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
              <span>Start WhatsApp Automation</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
            </div>
          </a>
        )}
      </div>

      <div className="mt-8 text-center relative z-10">
        <a
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-900 underline underline-offset-4 transition-colors"
        >
          ← Back to Brand Selector
        </a>
      </div>
    </div>
  );
}
