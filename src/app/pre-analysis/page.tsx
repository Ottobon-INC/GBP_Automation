"use client";

import React, { useState } from 'react';
import { Building2, Search, MapPin, Loader2, ArrowRight, Star, TrendingUp, AlertCircle, CheckCircle2, Copy } from 'lucide-react';

export default function PreAnalysisDashboard() {
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [businessType, setBusinessType] = useState('healthcare');
  const [targetKeywords, setTargetKeywords] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !location) {
      setError('Please provide both Business Name and Location (or a direct Maps URL).');
      return;
    }

    setLoading(true);
    setError('');
    setReportData(null);
    setLoadingStep('Scraping live Google Maps data for target and competitors...');

    try {
      const keywordsArray = targetKeywords.split(',').map(k => k.trim()).filter(Boolean);
      
      const res = await fetch('/api/sales/pre-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          location,
          businessType,
          targetKeywords: keywordsArray.length > 0 ? keywordsArray : undefined
        })
      });

      setLoadingStep('Analyzing reviews and generating AI sales strategy...');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReportData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            AI Sales Pitch Generator
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Generate a personalized, non-technical SEO pitch for any prospect before they onboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700">Target Business</label>
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Care IVF Center (or paste Google Maps URL)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="City, Neighborhood (e.g. Hyderabad)"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Business Type</label>
              <select
                value={businessType}
                suppressHydrationWarning
                onChange={e => setBusinessType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
              >
                <option value="healthcare">Healthcare / Clinic / Hospital</option>
                <option value="education">Education / School / Institute</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700">Target Keywords (Optional)</label>
              <input
                type="text"
                suppressHydrationWarning
                value={targetKeywords}
                onChange={e => setTargetKeywords(e.target.value)}
                placeholder="e.g. IVF treatment, best fertility clinic"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
                {loading ? 'Generating Pitch...' : 'Generate Sales Story'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading && (
            <div className="mt-8 p-8 flex flex-col items-center justify-center text-indigo-600 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin" />
              <p className="font-medium animate-pulse">{loadingStep}</p>
            </div>
          )}
        </div>

        {/* Report Dashboard */}
        {reportData && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 1. The Full Pitch Script */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-xl border border-indigo-800 overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Star className="w-6 h-6 text-yellow-400" />
                      1. The Sales Script (Read this to the prospect)
                    </h2>
                    <p className="text-indigo-200 mt-2 max-w-2xl">A non-technical, highly compelling story crafted by AI based on live competitor data.</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(reportData.salesStory.full_pitch_script)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-300 hover:text-white"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-8 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 space-y-4 text-slate-100 font-medium leading-relaxed">
                  {reportData.salesStory.full_pitch_script?.split('\n').map((paragraph: string, i: number) => (
                    paragraph.trim() ? <p key={i}>{paragraph}</p> : null
                  ))}
                </div>
              </div>
            </div>

            {/* 2. The Reality Check */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 p-6 text-white">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <Star className="w-6 h-6 text-slate-400" />
                  2. The Reality Check (Current Standing)
                </h2>
                <p className="text-slate-400 mt-2">Here is exactly how {reportData.targetBusiness.competitor_name} looks compared to the local leaders.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100 relative overflow-hidden flex flex-col justify-center">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-200 rounded-full opacity-50 blur-xl"></div>
                  <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between">
                    Your Prospect
                    <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full font-bold text-xs">
                      Actual Rank: #{reportData.exactRank}
                    </span>
                  </h3>
                  <p className="text-2xl font-bold text-slate-900 mt-4">{reportData.targetBusiness.competitor_name}</p>
                  <p className="text-slate-600 text-sm mt-4 italic line-clamp-3">"{reportData.targetBusiness.reviews_scraped?.split('\n')[0] || 'No reviews visible.'}"</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Who is stealing their traffic?</h3>
                  <div className="space-y-3">
                    {reportData.competitors.map((comp: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 truncate">{comp.competitor_name}</p>
                          <p className="text-xs text-slate-500 truncate">{(comp.categories_found || []).join(', ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. The Gap */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-rose-50 p-6 border-b border-rose-100">
                <h2 className="text-2xl font-bold text-rose-900 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  2. Competitor Weaknesses (The Gap)
                </h2>
                <p className="text-rose-700 mt-2">What patients are complaining about at the top clinics.</p>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {reportData.salesStory.competitor_weaknesses.map((weakness: string, i: number) => (
                    <li key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium">{weakness}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 3. The Playbook */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50 p-6 border-b border-emerald-100">
                <h2 className="text-2xl font-bold text-emerald-900 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6" />
                  3. Our Playbook (How we beat them)
                </h2>
                <p className="text-emerald-700 mt-2">The exact strategy our automated system will execute on Day 1.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Actionable Opportunities</h3>
                  <ul className="space-y-3">
                    {reportData.salesStory.client_opportunities.map((opp: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{opp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="font-bold text-slate-800 mb-4 text-lg">Category Blueprint</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Primary Category</p>
                      <p className="text-lg font-bold text-indigo-600">{reportData.salesStory.recommended_categories.primary}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Secondary Categories</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {reportData.salesStory.recommended_categories.secondary.map((cat: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-white border border-slate-300 rounded-full text-sm font-medium text-slate-600">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Immediate Value */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-xl border border-indigo-800 overflow-hidden text-white relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <Star className="w-6 h-6 text-yellow-400" />
                      4. Your First Win
                    </h2>
                    <p className="text-indigo-200 mt-2 max-w-2xl">This is a highly optimized Google Post our AI just generated to steal traffic from competitors. We can publish this today.</p>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(reportData.salesStory.sample_post)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-indigo-300 hover:text-white"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-8 bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <p className="text-lg leading-relaxed text-slate-100 font-medium">"{reportData.salesStory.sample_post}"</p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
