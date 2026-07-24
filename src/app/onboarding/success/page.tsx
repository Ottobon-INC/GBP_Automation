'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Clock, 
  ArrowLeft,
  Mail,
  Loader2,
  BadgeAlert
} from 'lucide-react';

function OnboardingSuccessContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId) {
      setError('Missing Client ID parameter in the URL.');
      setLoading(false);
      return;
    }

    const fetchClientData = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (dbError) throw dbError;
        setClient(data);

        // Trigger the competitor scraping and Gemini AI optimization in the background immediately!
        // This is non-blocking, so the user sees the success page instantly while the server optimizes.
        fetch(`/api/automation/scrape-competitors?client_id=${clientId}`).catch((e) =>
          console.error('Failed to trigger initial background scrape:', e)
        );
      } catch (err: any) {
        setError(`Failed to retrieve client details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-slate-400 text-sm">Saving onboarding status...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/20 p-8 rounded-2xl shadow-xl flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-950/40 rounded-full text-red-500 border border-red-500/20">
            <BadgeAlert className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-red-200">Error Loading Success Page</h3>
          <p className="text-slate-400 text-sm">{error || 'Could not load your client profile details.'}</p>
          <a
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Onboarding Form
          </a>
        </div>
      </div>
    );
  }

  const isEducation = client.onboarding_details?.business_type === 'education';
  
  const accentColor = isEducation ? 'text-amber-400' : 'text-emerald-400';
  const badgeStyle = isEducation 
    ? 'text-amber-400 bg-amber-950/50 border-amber-500/20' 
    : 'text-emerald-400 bg-emerald-950/50 border-emerald-500/20';
  const borderHighlight = isEducation ? 'border-amber-500/10 bg-amber-950/10' : 'border-emerald-500/10 bg-emerald-950/10';
  const iconBg = isEducation ? 'bg-amber-950/80 border-amber-500/30 text-amber-400' : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-400';
  const bgGlow = isEducation ? 'bg-amber-600/10' : 'bg-emerald-600/10';
  const logoSrc = isEducation ? '/ottobon_logo.png' : '/medcy_logo.png';
  const companyName = isEducation ? 'Ottobon Agency Setup' : 'Medcy Agency Setup';
  const creationText = isEducation ? 'Google Profile Creation by Ottobon' : 'Google Profile Creation by Medcy';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blurs */}
      <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] ${bgGlow} rounded-full blur-[120px] pointer-events-none`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${bgGlow} rounded-full blur-[120px] pointer-events-none`} />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center gap-2 mb-3">
          <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center p-2 mb-2 border border-slate-800">
            <img src={logoSrc} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${badgeStyle}`}>
            {companyName}
          </span>
        </div>
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Onboarding Completed!
        </h2>
        <p className="mt-2 text-center text-sm sm:text-base text-slate-400 max-w-md mx-auto">
          We saved your details for <strong>{client.company_name}</strong>. Our team is now taking over to create your Google listing.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-10 space-y-8">
          
          <div className={`flex flex-col items-center justify-center text-center p-4 border rounded-2xl ${borderHighlight}`}>
            <div className={`p-3 rounded-full mb-3 shadow-lg ${iconBg}`}>
              <ShieldCheck className="h-8 w-8 animate-pulse" />
            </div>
            <h4 className="text-base font-bold text-white">We've got you covered</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              Since you don't have a Google Business Profile, our team will manually build, structure, and verify your new profile for you.
            </p>
          </div>

          {/* Creation Steps */}
          <div className="space-y-5">
            <h5 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
              Next Steps Tracker
            </h5>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-950 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h6 className="text-sm font-semibold text-white">Onboarding details saved</h6>
                <p className="text-xs text-slate-500">Logo, facade images, phone, and target keywords logged.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 border ${isEducation ? 'bg-amber-950 border-amber-500/30 text-amber-400' : 'bg-emerald-950 border-emerald-500/30 text-emerald-400'}`}>
                <Clock className="h-4 w-4 animate-spin" />
              </div>
              <div>
                <h6 className="text-sm font-semibold text-white">{creationText}</h6>
                <p className="text-xs text-slate-400">Our specialists are setting up your official Google Maps business profile.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-950 border border-slate-850 text-slate-600 flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h6 className="text-sm font-semibold text-slate-500">Google Verification Request</h6>
                <p className="text-xs text-slate-600">Google will request SMS/Postcard PIN codes to activate the mapping listing.</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2 text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${accentColor}`}>
              <Building2 className="h-4 w-4" />
              <span>Created Business Name:</span>
            </div>
            <p className="text-slate-200 pl-5 font-medium">{client.company_name}</p>
            <p className="text-[11px] text-slate-500 pl-5">
              We will contact you at <strong>{client.contact_email}</strong> or <strong>{client.contact_phone}</strong> as soon as Google verification codes are dispatched.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Onboarding Form
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OnboardingSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-slate-400 text-sm">Loading success tracker...</p>
        </div>
      </div>
    }>
      <OnboardingSuccessContent />
    </Suspense>
  );
}
