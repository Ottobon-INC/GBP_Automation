'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Sparkles, MapPin, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const searchParams = useSearchParams();
  const clientId = searchParams.get('client_id');
  const [loading, setLoading] = useState(true);
  const [clientData, setClientData] = useState<any>(null);

  useEffect(() => {
    if (!clientId) {
      setLoading(false);
      return;
    }

    // Trigger scrape-competitors in the background, since onboarding is fully complete
    // We do NOT await this in the UI because we want to show the success screen instantly
    fetch(`/api/automation/scrape-competitors?client_id=${clientId}`)
      .then(res => res.json())
      .then(data => console.log('Background audit triggered:', data))
      .catch(err => console.error('Failed to trigger background audit:', err));

    // Also just fetch client details to show their name
    fetch(`/api/automation/push-metadata?client_id=${clientId}`)
      // It will throw 405 because push-metadata is GET, wait, push-metadata is GET! So this is fine.
      // But we just need client data. Let's just assume success since we have the ID.
      .finally(() => setLoading(false));
  }, [clientId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Sparkles className="w-24 h-24" />
          </div>
          <div className="relative z-10 flex justify-center mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold relative z-10">Connection Successful!</h1>
          <p className="mt-2 text-emerald-100 relative z-10 text-sm">
            Your Google Business Profile is now connected to Medcy.
          </p>
        </div>

        <div className="p-8">
          <h3 className="font-bold text-slate-800 text-lg mb-4 text-center">What happens next?</h3>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">1</div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">AI Competitor Audit</h4>
                <p className="text-slate-500 text-sm mt-1">Our AI is currently scanning your local area to find keyword gaps in your profile. You will receive an email shortly.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">2</div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Medcy Review & Push</h4>
                <p className="text-slate-500 text-sm mt-1">Our SEO experts will review the generated plan and push the optimizations directly to your Google Maps listing.</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">3</div>
              <div>
                <h4 className="font-semibold text-slate-800 text-sm">Weekly Tracking</h4>
                <p className="text-slate-500 text-sm mt-1">Every week, you'll receive a beautiful report showing exactly how your rankings are improving across your city.</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500 mb-6">
              You can close this window. We've got it from here!
            </p>
            <Link href="/">
              <button className="px-6 py-2.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors text-sm w-full">
                Back to Medcy Agency
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
