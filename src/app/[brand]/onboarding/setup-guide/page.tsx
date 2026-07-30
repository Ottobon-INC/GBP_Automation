'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  ExternalLink,
  Loader2,
  AlertCircle,
  BadgeAlert,
  ArrowLeft,
  Mail,
  ShieldCheck,
  Check
} from 'lucide-react';

function CreationStatusContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const brand = params.brand as string;
  const clientId = searchParams.get('client_id');

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Mocking live API creation status for the UI demonstration
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (!clientId) {
      setError('Missing Client ID parameter in the URL. Please complete onboarding first.');
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
      } catch (err: any) {
        setError(`Failed to retrieve client details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchClientData();
  }, [clientId]);

  // Simulate progress checklist updates
  useEffect(() => {
    if (loading || error || !client) return;

    const timer1 = setTimeout(() => setStep(2), 1500); // OAuth Linked
    const timer2 = setTimeout(() => setStep(3), 3500); // Profile Created
    const timer3 = setTimeout(() => setStep(4), 5500); // Verification Stage

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [loading, error, client]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-slate-400 text-sm">Loading your profile status...</p>
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
          <h3 className="text-xl font-bold text-red-200">Retrieval Failed</h3>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="p-2 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20">
            Automated Creation Desk
          </span>
        </div>
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          Creating Google Profile...
        </h2>
        <p className="mt-2 text-center text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Sit back! We are programmatically creating the Google Business Profile for <strong>{client.company_name}</strong> on your behalf.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-10 space-y-8">
          
          {/* Status Live Tracker */}
          <div className="space-y-6">
            
            {/* Step 1: Onboarding Saved */}
            <div className="flex items-center gap-4">
              <div className="h-9 w-9 rounded-full bg-indigo-950 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                <Check className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Client details submitted</h4>
                <p className="text-xs text-slate-400">Clinic settings and visual media saved inside the CRM database.</p>
              </div>
            </div>

            {/* Step 2: OAuth link */}
            <div className="flex items-center gap-4">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                step >= 2 
                  ? 'bg-indigo-950 border-indigo-500/30 text-indigo-400' 
                  : 'bg-slate-950 border-slate-850 text-slate-600'
              }`}>
                {step >= 2 ? <Check className="h-5 w-5" /> : <Loader2 className="animate-spin h-5 w-5 text-indigo-500" />}
              </div>
              <div>
                <h4 className={`text-sm font-bold ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>
                  Google Account connected via OAuth
                </h4>
                <p className="text-xs text-slate-500">API connection established and authorized to manage listings.</p>
              </div>
            </div>

            {/* Step 3: Google Profile Creation */}
            <div className="flex items-center gap-4">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                step >= 3 
                  ? 'bg-indigo-950 border-indigo-500/30 text-indigo-400' 
                  : step === 2 
                    ? 'bg-slate-950 border-indigo-500/50 text-indigo-500' 
                    : 'bg-slate-950 border-slate-850 text-slate-600'
              }`}>
                {step >= 3 ? <Check className="h-5 w-5" /> : step === 2 ? <Loader2 className="animate-spin h-5 w-5 text-indigo-500" /> : <Building2 className="h-5 w-5" />}
              </div>
              <div>
                <h4 className={`text-sm font-bold ${step >= 3 ? 'text-white' : 'text-slate-500'}`}>
                  Programmatic Location Creation
                </h4>
                <p className="text-xs text-slate-500">
                  Uploading business metadata, categories, and telephone details using Google Business API.
                </p>
              </div>
            </div>

            {/* Step 4: Verification Trigger */}
            <div className="flex items-start gap-4">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 border transition-all mt-1 ${
                step >= 4 
                  ? 'bg-amber-950/40 border-amber-500/30 text-amber-400' 
                  : step === 3 
                    ? 'bg-slate-950 border-indigo-500/50 text-indigo-500' 
                    : 'bg-slate-950 border-slate-850 text-slate-600'
              }`}>
                {step >= 4 ? <ShieldCheck className="h-5 w-5" /> : step === 3 ? <Loader2 className="animate-spin h-5 w-5 text-indigo-500" /> : <Mail className="h-5 w-5" />}
              </div>
              <div className="space-y-1">
                <h4 className={`text-sm font-bold ${step >= 4 ? 'text-white' : 'text-slate-500'}`}>
                  Google Verification Stage
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Triggers verification options from Google (e.g. Phone PIN code, postcard, or clinic live video).
                </p>
              </div>
            </div>

          </div>

          {/* Verification Details Box */}
          {step >= 4 && (
            <div className="bg-amber-950/20 border border-amber-500/20 p-5 rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-2 text-amber-300">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h5 className="text-sm font-bold">Action Required: Verify Your Business</h5>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                We have successfully created your location **"{client.company_name}"** on Google! However, Google requires verification before making it live to the public. 
              </p>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-1 text-xs">
                <p className="text-slate-400"><strong>Verification Method:</strong> SMS/Call PIN Code</p>
                <p className="text-slate-400"><strong>Sent To:</strong> {client.contact_phone}</p>
              </div>
              <p className="text-xs text-slate-400">
                Once you receive the 5 or 6-digit code on your phone, click the button below to verify it inside your Google Account dashboard to make the profile active.
              </p>
              <a
                href="https://business.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-all mt-1"
              >
                Go to Google Business Console
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function GBPSetupGuide() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-slate-400 text-sm">Initializing status board...</p>
        </div>
      </div>
    }>
      <CreationStatusContent />
    </Suspense>
  );
}
