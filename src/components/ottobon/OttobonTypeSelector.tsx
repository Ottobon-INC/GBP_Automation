'use client';

import { MapPin, Globe, ArrowRight, Sparkles, Layout, ShieldCheck, Zap, Users, MessageSquare, Star } from 'lucide-react';

export default function OttobonTypeSelector() {
  const brandTitle = 'Ottobon Agency Portal';
  const brandSub = 'Choose your educational institution or campus onboarding service below.';
  const logoUrl = '/ottobon_logo.png';
  const badgeStyle = 'text-amber-800 bg-amber-50 border-amber-200/80 font-bold';

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-7xl text-center relative z-10 mb-10">
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

      <div className="mt-12 sm:mx-auto sm:w-full relative z-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Card 1: GMB / Local SEO */}
        <a
          href={`/ottobon/onboarding/gbp`}
          className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer text-left"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
                <MapPin className="h-7 w-7" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Local SEO
              </span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
              Google Business Profile (GBP)
            </h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Maps Ranking & AI Post Automation
            </p>
            <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
              Verify your campus location on Google Maps, link your live OAuth credentials, and activate automated weekly AI-generated posts, Q&A seeding, and review management.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0" />
                Live Google Maps Location Verification
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                Weekly AI Post & Campus Updates Publishing
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                Student Search FAQ & Keyword Optimization
              </li>
            </ul>
          </div>

          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
            <span>Start GBP Onboarding</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </div>
        </a>

        {/* Card 2: Website Design & Development */}
        <a
          href={`/ottobon/onboarding/website`}
          className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer text-left"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl shadow-sm">
                <Globe className="h-7 w-7" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1.5">
                <Layout className="h-3.5 w-3.5" /> Custom Web
              </span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
              Website Development
            </h3>
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              Interactive 22-Section Client Intake Wizard
            </p>
            <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
              Design a modern, premium, responsive website for your academy. Provide your branding preferences, course catalogs, faculty profiles, domain details, and feature requirements.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Layout className="h-4 w-4 text-amber-600 shrink-0" />
                Typeform & Stripe Inspired Multi-Step Wizard
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                Dynamic Course, Faculty & Campus Assets
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                Autosave Progress & Print-to-PDF Specs Report
              </li>
            </ul>
          </div>

          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
            <span>Start Website Onboarding</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </div>
        </a>

        {/* Card 3: WhatsApp Automation */}
        <a
          href={`/ottobon/onboarding/whatsapp_automation`}
          className="group relative bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300 shadow-xs cursor-pointer text-left"
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-2xl shadow-sm">
                <Zap className="h-7 w-7 stroke-[2.5]" />
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200/60 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> AI Chatbot
              </span>
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-amber-600 transition-colors">
              WhatsApp & Meta Automation
            </h3>
            <p className="mt-4 text-sm text-slate-600 font-normal leading-relaxed">
              Configure AI Chatbots, WhatsApp Cloud API, Meta Business Manager, and automated 5-Star Google Review invitations for your educational institute.
            </p>

            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <MessageSquare className="h-4 w-4 text-amber-600 shrink-0" />
                Meta WABA & API Credentials
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Users className="h-4 w-4 text-amber-600 shrink-0" />
                Departments & Faculty Rosters
              </li>
              <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <Star className="h-4 w-4 text-amber-500 shrink-0" />
                Automated Google Review Collection
              </li>
            </ul>
          </div>

          <div className="w-full mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-sm font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
            <span>Start WhatsApp Automation</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1.5" />
          </div>
        </a>

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
