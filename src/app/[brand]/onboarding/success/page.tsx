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
  BadgeAlert,
  Layout,
  Globe,
  Calendar
} from 'lucide-react';

function OnboardingSuccessContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const type = searchParams.get('type');

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [googleLocations, setGoogleLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    if (!clientId) {
      setError('Missing Client ID parameter in the URL.');
      setLoading(false);
      return;
    }

    const fetchClientData = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('gbp_clients')
          .select('*')
          .eq('id', clientId)
          .single();

        if (dbError) throw dbError;
        setClient(data);

        // If client has GBP setup, fetch their Google Business locations automatically
        if (data.onboarding_details?.has_gbp) {
          setLoadingLocations(true);
          fetch(`/api/automation/get-locations?client_id=${clientId}`)
            .then(res => res.json())
            .then(locData => {
              if (locData.error) {
                setLocationError(locData.error);
              } else if (locData.locations) {
                setGoogleLocations(locData.locations);
                if (locData.locations.length > 0) {
                  setSelectedLocationId(locData.locations[0].name);
                }
              }
            })
            .catch(e => console.error('Failed to fetch Google Locations:', e))
            .finally(() => setLoadingLocations(false));
        }

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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-slate-900" />
          <p className="text-slate-500 font-semibold text-sm">Saving onboarding status...</p>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-red-200 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-red-50 rounded-full text-red-600 border border-red-200">
            <BadgeAlert className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900">Error Loading Success Page</h3>
          <p className="text-slate-600 font-medium text-sm">{error || 'Could not load your client profile details.'}</p>
          <a
            href="/"
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-extrabold transition-colors shadow-md"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Onboarding Form
          </a>
        </div>
      </div>
    );
  }

  const isWebsiteOnboarding = type === 'website' || client.onboarding_details?.type === 'website_onboarding';
  const isOttobon = client.onboarding_details?.brand === 'ottobon' || client.onboarding_details?.business_type === 'education' || client.onboarding_details?.business_type === 'Educational Institute';

  if (isWebsiteOnboarding) {
    const badgeStyleWeb = isOttobon
      ? 'text-amber-800 bg-amber-50 border-amber-200/80'
      : 'text-indigo-800 bg-indigo-50 border-indigo-200/80';
    const bgGlowWeb = isOttobon ? 'bg-amber-500/5' : 'bg-indigo-500/5';
    const logoSrcWeb = isOttobon ? '/ottobon_logo.png' : '/medcy_logo.png';
    const brandTitleWeb = isOttobon ? 'Ottobon Web Studio' : 'Medcy Digital Lab';

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] ${bgGlowWeb} rounded-full blur-[120px] pointer-events-none`} />
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${bgGlowWeb} rounded-full blur-[120px] pointer-events-none`} />

        <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 flex flex-col items-center">
          <div className="flex flex-col items-center justify-center gap-2 mb-3">
            <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-2.5 mb-2 border border-slate-200 shadow-md">
              <img src={logoSrcWeb} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className={`text-xs font-bold tracking-wider uppercase px-3.5 py-1 rounded-full border ${badgeStyleWeb}`}>
              {brandTitleWeb}
            </span>
          </div>
          <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Specifications Received!
          </h2>
          <p className="mt-2 text-center text-sm sm:text-base font-medium text-slate-600 max-w-md mx-auto">
            We have securely logged your 22-section specifications for <strong className="text-slate-900">{client.company_name}</strong>. Our UI/UX architects and full-stack developers are now reviewing your project.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
          <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-6 sm:p-10 space-y-8">
            
            <div className="flex flex-col items-center justify-center text-center p-5 border rounded-2xl border-indigo-200/80 bg-indigo-50/60">
              <div className="p-3.5 rounded-full mb-3 shadow-md bg-white text-indigo-600 border border-indigo-100">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <h4 className="text-base font-extrabold text-slate-900">Project Kickoff Initiated</h4>
              <p className="text-xs font-medium text-slate-600 mt-1 max-w-xs leading-relaxed">
                Your color themes, sitemap pages, services catalog, team profiles, and domain requirements have been transferred to our engineering pipeline.
              </p>
            </div>

            <div className="space-y-5">
              <h5 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                <Layout className="h-4 w-4 text-indigo-600" /> Website Development Roadmap
              </h5>

              <div className="flex items-start gap-3.5">
                <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h6 className="text-sm font-extrabold text-slate-900">1. Specifications & Assets Confirmed</h6>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Brand logo, color palette, services, team bios, and legal documents stored in cloud repository.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="h-7 w-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 shadow-xs">
                  <Clock className="h-4 w-4 animate-spin" />
                </div>
                <div>
                  <h6 className="text-sm font-extrabold text-slate-900">2. UI/UX Wireframing & Design Sprint</h6>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">
                    Our design team is building high-fidelity Figma mockups tailored to your selected theme and reference inspirations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <h6 className="text-sm font-extrabold text-slate-900">3. Development & Project Kickoff Call</h6>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">
                    Your dedicated project manager will contact you to review timelines, finalize domain DNS, and schedule the kickoff call.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-extrabold text-indigo-700">
                <Globe className="h-4 w-4" />
                <span>Registered Website Client:</span>
              </div>
              <p className="text-slate-900 pl-6 font-extrabold text-sm">{client.company_name}</p>
              <p className="text-[11px] font-medium text-slate-600 pl-6 leading-relaxed">
                We have notified our project management desk. We will reach out to <strong className="text-slate-900">{client.contact_email}</strong> or <strong className="text-slate-900">{client.contact_phone}</strong> shortly.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={`/onboarding?brand=${isOttobon ? 'ottobon' : 'medcy'}`}
                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Return to Onboarding Portal
              </a>
            </div>

          </div>
        </div>
      </div>
    );
  }

  const isEducation = client.onboarding_details?.business_type === 'education';
  const hasExistingGbp = client.onboarding_details?.has_gbp === true;
  
  const accentColor = isEducation ? 'text-amber-700' : 'text-emerald-700';
  const badgeStyle = isEducation 
    ? 'text-amber-800 bg-amber-50 border-amber-200/80' 
    : 'text-emerald-800 bg-emerald-50 border-emerald-200/80';
  const borderHighlight = isEducation ? 'border-amber-200/80 bg-amber-50/60' : 'border-emerald-200/80 bg-emerald-50/60';
  const iconBg = isEducation ? 'bg-white border-amber-200 text-amber-700' : 'bg-white border-emerald-200 text-emerald-700';
  const bgGlow = isEducation ? 'bg-amber-500/5' : 'bg-emerald-500/5';
  const logoSrc = isEducation ? '/ottobon_logo.png' : '/medcy_logo.png';
  const companyName = isEducation ? 'Ottobon Agency Setup' : 'Medcy Agency Setup';
  const creationText = hasExistingGbp
    ? (isEducation ? 'Google Profile Linking by Ottobon' : 'Google Profile Linking by Medcy')
    : (isEducation ? 'Google Profile Creation by Ottobon' : 'Google Profile Creation by Medcy');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Blurs */}
      <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] ${bgGlow} rounded-full blur-[120px] pointer-events-none`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${bgGlow} rounded-full blur-[120px] pointer-events-none`} />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center gap-2 mb-3">
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center p-2 mb-2 border border-slate-200 shadow-md">
            <img src={logoSrc} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <span className={`text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${badgeStyle}`}>
            {companyName}
          </span>
        </div>
        <h2 className="text-center text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          Onboarding Completed!
        </h2>
        <p className="mt-2 text-center text-sm sm:text-base font-medium text-slate-600 max-w-md mx-auto">
          We saved your details for <strong className="text-slate-900">{client.company_name}</strong>. Our team is now taking over to {hasExistingGbp ? 'link and optimize your existing Google listing' : 'create your Google listing'}.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-white border border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-6 sm:p-10 space-y-8">
          
          <div className={`flex flex-col items-center justify-center text-center p-5 border rounded-2xl ${borderHighlight}`}>
            <div className={`p-3.5 rounded-full mb-3 shadow-md border ${iconBg}`}>
              <ShieldCheck className="h-8 w-8 animate-pulse" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900">{hasExistingGbp ? 'Existing Profile Detected!' : 'We\'ve got you covered'}</h4>
            <p className="text-xs font-medium text-slate-600 mt-1 max-w-xs leading-relaxed">
              {hasExistingGbp
                ? 'Since you already have a Google Business Profile, our team is connecting your live listing to our AI optimization suite.'
                : 'Since you don\'t have a Google Business Profile, our team will manually build, structure, and verify your new profile for you.'}
            </p>
          </div>

          {/* Creation Steps */}
          <div className="space-y-5">
            <h5 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Next Steps Tracker
            </h5>

            <div className="flex items-start gap-3.5">
              <div className="h-7 w-7 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs font-bold">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h6 className="text-sm font-extrabold text-slate-900">Onboarding details saved</h6>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Logo, facade images, phone, and target keywords logged.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border shadow-xs ${isEducation ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <Clock className="h-4 w-4 animate-spin" />
              </div>
              <div>
                <h6 className="text-sm font-extrabold text-slate-900">{creationText}</h6>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {hasExistingGbp
                    ? 'Our specialists are connecting and syncing your existing Google Maps business profile.'
                    : 'Our specialists are setting up your official Google Maps business profile.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 shadow-xs font-bold">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <h6 className="text-sm font-extrabold text-slate-900">{hasExistingGbp ? 'AI Optimization & Sync' : 'Google Verification Request'}</h6>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {hasExistingGbp
                    ? 'Once linked, automated seasonal keywords and faqs will be pushed to Google Maps.'
                    : 'Google will request SMS/Postcard PIN codes to activate the mapping listing.'}
                </p>
              </div>
            </div>
          </div>

          {/* Location Selector for Existing GBP */}
          {hasExistingGbp && (
            <div className="bg-white border-2 border-indigo-100 p-5 rounded-2xl shadow-sm space-y-4">
              <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-600" /> Confirm Google Business Profile
              </h5>
              
              {loadingLocations ? (
                <div className="flex items-center justify-center py-4 gap-2">
                  <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-slate-500">Fetching your locations...</span>
                </div>
              ) : locationSaved ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <p className="text-xs font-bold text-emerald-800">Location securely linked! Our system will now manage this profile.</p>
                </div>
              ) : locationError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <BadgeAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-red-800 leading-relaxed">{locationError}</p>
                </div>
              ) : googleLocations.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800 leading-relaxed">
                  The email you connected does not currently manage any Google Business Profiles. Our team has been notified to assist you with creating one.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-slate-600">
                    We found multiple locations under your email. Please select the correct one for {client.company_name}.
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                    {googleLocations.map((loc) => (
                      <label 
                        key={loc.name} 
                        className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedLocationId === loc.name 
                            ? 'border-indigo-600 bg-indigo-50/50' 
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <input 
                          type="radio" 
                          name="client_location_id" 
                          value={loc.name}
                          checked={selectedLocationId === loc.name}
                          onChange={(e) => setSelectedLocationId(e.target.value)}
                          className="mt-0.5 w-3.5 h-3.5 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{loc.title || 'Unnamed Location'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <button 
                    disabled={!selectedLocationId || isActivating}
                    onClick={async () => {
                      setIsActivating(true);
                      try {
                        const res = await fetch('/api/automation/activate-profile', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            client_id: client.id,
                            location_id: selectedLocationId
                          })
                        });
                        if (res.ok) {
                          setLocationSaved(true);
                        } else {
                          const data = await res.json();
                          alert('Error saving location: ' + (data.error || 'Unknown error'));
                        }
                      } catch (e: any) {
                        alert('Network Error: ' + e.message);
                      } finally {
                        setIsActivating(false);
                      }
                    }}
                    className="w-full mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex justify-center items-center gap-2"
                  >
                    {isActivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    Confirm Selection
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className={`flex items-center gap-1.5 font-extrabold ${accentColor}`}>
              <Building2 className="h-4 w-4" />
              <span>Created Business Name:</span>
            </div>
            <p className="text-slate-900 pl-5 font-extrabold text-sm">{client.company_name}</p>
            <p className="text-[11px] font-medium text-slate-600 pl-5 leading-relaxed">
              We will contact you at <strong className="text-slate-900">{client.contact_email}</strong> or <strong className="text-slate-900">{client.contact_phone}</strong> as soon as Google verification codes are dispatched.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 text-center">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-slate-900" />
          <p className="text-slate-500 font-semibold text-sm">Loading success tracker...</p>
        </div>
      </div>
    }>
      <OnboardingSuccessContent />
    </Suspense>
  );
}
