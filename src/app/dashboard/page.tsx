'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  MapPin, 
  Tag, 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  Copy,
  Check,
  Calendar,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  Users,
  Search,
  CheckCircle2,
  FileImage,
  Globe,
  RefreshCw,
  AlertCircle,
  Zap,
  Plus,
  X
} from 'lucide-react';

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get('client_id');

  // List of all clients
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId);
  
  // Selected client detailed states
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [gbpAccount, setGbpAccount] = useState<any>(null);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [pushingMetadata, setPushingMetadata] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);
  const [syncingReviews, setSyncingReviews] = useState(false);
  const [pushingFAQs, setPushingFAQs] = useState(false);
  const [error, setError] = useState('');
  
  // UI states
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [selectedCompIndex, setSelectedCompIndex] = useState<number | null>(null);

  const [googleLocations, setGoogleLocations] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [selectedGoogleLocationId, setSelectedGoogleLocationId] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const fetchGoogleLocations = async (clientId: string) => {
    setLoadingLocations(true);
    setError('');
    try {
      const res = await fetch(`/api/automation/get-locations?client_id=${clientId}`);
      const data = await res.json();
      if (res.ok) {
        setGoogleLocations(data.locations || []);
        if (data.locations && data.locations.length > 0) {
          setSelectedGoogleLocationId(data.locations[0].name);
        }
        setShowLocationModal(true);
      } else {
        setError('Failed to fetch locations: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingLocations(false);
    }
  };

  // Photo scheduler states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoCategory, setPhotoCategory] = useState<string>('ADDITIONAL');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [photoScheduleDate, setPhotoScheduleDate] = useState<string>('');
  const [schedulingPhoto, setSchedulingPhoto] = useState<boolean>(false);

  // Dashboard doctor states
  const [dashDocName, setDashDocName] = useState('');
  const [dashDocSpecialty, setDashDocSpecialty] = useState('');
  const [dashDocBio, setDashDocBio] = useState('');

  // Fetch all clients list for the sidebar
  const fetchClientsList = async () => {
    try {
      const { data, error: err } = await supabase
        .from('clients')
        .select('id, company_name, primary_category, logo_url')
        .order('created_at', { ascending: false });

      if (err) throw err;
      setClients(data || []);
      
      // If there is no client selected yet but list has items, select the first one automatically
      if (!selectedClientId && data && data.length > 0) {
        setSelectedClientId(data[0].id);
      }
    } catch (err: any) {
      setError(`Failed to retrieve clients: ${err.message}`);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch details for a specific selected client
  const fetchClientDetails = async (clientId: string) => {
    setLoadingDetails(true);
    setError('');
    setSelectedCompIndex(null);

    try {
      // 1. Client profile settings
      const { data: clientData, error: clientErr } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (clientErr) throw clientErr;
      setSelectedClient(clientData);

      // 2. GBP Account connection tokens
      const { data: gbpData, error: gbpErr } = await supabase
        .from('gbp_accounts')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (gbpErr) console.error('Error fetching GBP account details:', gbpErr);
      setGbpAccount(gbpData);

      // 3. Competitor scrapes
      const { data: compData, error: compErr } = await supabase
        .from('competitor_scrapes')
        .select('*')
        .eq('client_id', clientId);

      if (compErr) console.error('Error fetching competitor scrape data:', compErr);
      setCompetitors(compData || []);

      // 4. Fetch published posts history
      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .order('scheduled_at', { ascending: false });

      if (postsErr) console.error('Error fetching posts history:', postsErr.message);
      setPosts(postsData || []);

      // 5. Fetch synced Google Reviews
      const { data: reviewsData, error: reviewsErr } = await supabase
        .from('reviews')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (reviewsErr) console.error('Error fetching synced reviews:', reviewsErr.message);
      setReviews(reviewsData || []);

    } catch (err: any) {
      setError(`Failed to load profile details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchClientsList();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetails(selectedClientId);
      
      // Update the URL without reloading the page so it bookmarkable
      const url = new URL(window.location.href);
      url.searchParams.set('client_id', selectedClientId);
      window.history.pushState({}, '', url.toString());
    }
  }, [selectedClientId]);

  const handleRunOptimizer = async (force: boolean = false) => {
    if (!selectedClientId) return;
    setOptimizing(true);
    setError('');

    try {
      const response = await fetch(`/api/automation/scrape-competitors?client_id=${selectedClientId}${force ? '&force_refresh=true' : ''}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to complete scraper execution.');
      }

      // Reload client details to display the fresh recommendation data
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`Scraper Trigger Error: ${err.message}`);
    } finally {
      setOptimizing(false);
    }
  };

  const [approvingPlan, setApprovingPlan] = useState(false);

  const handleApprovePlan = async () => {
    if (!selectedClientId) return;
    setApprovingPlan(true);
    setError('');
    
    try {
      // Extract the currently proposed keywords (in case we add edit functionality later, for now we just pass what the AI recommended)
      const currentKeywords = gbpAccount?.ai_optimized_payload?.keyword_recommendations || [];
      
      const response = await fetch(`/api/automation/approve-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClientId,
          approved_keywords: currentKeywords
        })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to approve SEO plan.');
      }
      
      alert('SEO Keywords Approved! The system is now automatically pushing these changes to Google.');
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`Approval Error: ${err.message}`);
    } finally {
      setApprovingPlan(false);
    }
  };

  const handlePushMetadata = async () => {
    if (!selectedClientId) return;
    setPushingMetadata(true);
    setError('');
    try {
      const response = await fetch(`/api/automation/push-metadata?client_id=${selectedClientId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to push optimizations.');
      }
      alert('Successfully pushed AI-optimized description and categories to Google Business Profile!');
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`GMB Push Error: ${err.message}`);
    } finally {
      setPushingMetadata(false);
    }
  };

  const handlePushFAQs = async () => {
    if (!selectedClientId || !gbpAccount?.ai_optimized_payload?.faqs) return;
    try {
      const faqsList = gbpAccount.ai_optimized_payload.faqs;
      const copyText = faqsList
        .map((faq: any, i: number) => `Question ${i + 1}: ${faq.question}\nAnswer ${i + 1}: ${faq.answer}`)
        .join('\n\n');
      
      navigator.clipboard.writeText(copyText);
      alert(
        'All FAQs copied to clipboard!\n\n' +
        'Note: Google permanently discontinued the Google My Business Q&A API on November 3, 2025. ' +
        'Because Google has disabled programmatic FAQ posting, you can now post these copied Q&As manually ' +
        'directly on the client\'s Google Maps listing using the "Ask a Question" feature.'
      );
    } catch (err: any) {
      setError(`Failed to copy FAQs: ${err.message}`);
    }
  };

  const handlePublishPost = async () => {
    if (!selectedClientId) return;
    setPublishingPost(true);
    setError('');
    try {
      const response = await fetch(`/api/automation/publish-post?client_id=${selectedClientId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to publish weekly post.');
      }
      alert(`Successfully generated and published Week ${result.week_published} Google Business Update!`);
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`GMB Posting Error: ${err.message}`);
    } finally {
      setPublishingPost(false);
    }
  };

  const uploadToStorage = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const uniqueId = Math.random().toString(36).substring(2, 15);
    const fileName = `${uniqueId}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('client-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload ${file.name} to storage: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from('client-assets').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSchedulePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !photoFile) return;
    setSchedulingPhoto(true);
    setError('');
    try {
      console.log('Uploading photo file...');
      const uploadedUrl = await uploadToStorage(photoFile, 'showcases');

      const isInstant = !photoScheduleDate;
      const scheduledTime = photoScheduleDate ? new Date(photoScheduleDate).toISOString() : new Date().toISOString();

      const { data: newPost, error: dbErr } = await supabase
        .from('posts')
        .insert([
          {
            client_id: selectedClientId,
            google_post_id: null,
            post_text: `[PHOTO_ONLY] ${photoCaption || 'Showcase business photo.'}`,
            image_url: uploadedUrl,
            call_to_action_type: `MEDIA_${photoCategory}`,
            call_to_action_url: null,
            status: isInstant ? 'draft' : 'scheduled',
            scheduled_at: scheduledTime
          }
        ])
        .select()
        .single();

      if (dbErr) throw dbErr;

      if (isInstant && newPost) {
        console.log('Instant publish requested. Triggering publisher API...');
        const response = await fetch(`/api/automation/publish-post?client_id=${selectedClientId}&post_id=${newPost.id}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || result.details || 'Failed to publish photo media to Google Maps.');
        }
        alert('Photo successfully uploaded and published to your Google Business Profile media library!');
      } else {
        alert(`Photo successfully scheduled for publication on ${new Date(scheduledTime).toLocaleString()}!`);
      }

      setPhotoFile(null);
      setPhotoCaption('');
      setPhotoScheduleDate('');
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`Photo Upload Error: ${err.message}`);
    } finally {
      setSchedulingPhoto(false);
    }
  };

  const handlePublishMediaNow = async (postId: string) => {
    if (!selectedClientId) return;
    setSchedulingPhoto(true);
    setError('');
    try {
      const response = await fetch(`/api/automation/publish-post?client_id=${selectedClientId}&post_id=${postId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to publish photo media to Google Maps.');
      }
      alert('Photo successfully published to your Google Business Profile media library!');
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`GMB Photo Publishing Error: ${err.message}`);
    } finally {
      setSchedulingPhoto(false);
    }
  };

  const handleUpdateDoctors = async (updatedList: any[]) => {
    if (!selectedClientId) return;
    try {
      const updatedDetails = {
        ...selectedClient.onboarding_details,
        doctors: updatedList
      };
      const { error: dbErr } = await supabase
        .from('clients')
        .update({ onboarding_details: updatedDetails })
        .eq('id', selectedClientId);
      if (dbErr) throw dbErr;
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`Failed to update doctors: ${err.message}`);
    }
  };

  const handlePublishDoctorBio = async (doc: any) => {
    if (!selectedClientId) return;
    setPublishingPost(true);
    setError('');
    try {
      const bioText = `Meet our specialist: ${doc.name} - ${doc.specialty}. ${doc.bio || ''}`;
      
      const { data: newPost, error: dbErr } = await supabase
        .from('posts')
        .insert([
          {
            client_id: selectedClientId,
            google_post_id: null,
            post_text: bioText,
            image_url: selectedClient.logo_url || selectedClient.building_image_url || null,
            call_to_action_type: 'LEARN_MORE',
            call_to_action_url: null,
            status: 'draft',
            scheduled_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (dbErr) throw dbErr;

      if (newPost) {
        const response = await fetch(`/api/automation/publish-post?client_id=${selectedClientId}&post_id=${newPost.id}`);
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || result.details || 'Failed to publish doctor bio update.');
        }
        alert(`Successfully published showcase update for ${doc.name} to Google Business Profile!`);
        await fetchClientDetails(selectedClientId);
      }
    } catch (err: any) {
      setError(`Doctor Bio Sync Error: ${err.message}`);
    } finally {
      setPublishingPost(false);
    }
  };

  const handleSyncReviews = async () => {
    if (!selectedClientId) return;
    setSyncingReviews(true);
    setError('');
    try {
      const response = await fetch(`/api/automation/reply-reviews?client_id=${selectedClientId}`);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to sync reviews.');
      }
      alert(`Review response engine successfully completed! Synced ${result.reviews_fetched} reviews and drafted/published ${result.auto_replies_sent} AI replies.`);
      await fetchClientDetails(selectedClientId);
    } catch (err: any) {
      setError(`Reviews Sync Error: ${err.message}`);
    } finally {
      setSyncingReviews(false);
    }
  };

  const copyToClipboard = (text: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Helper to determine rank delta indicators (e.g. did they go up or down compared to last rank check)
  const getRankIndicator = (keyword: string, currentRank: number | string, history: any[]) => {
    if (!history || history.length < 2) return <Minus className="h-4 w-4 text-slate-500" />;
    
    // Find the previous rank check that has rankings
    const prevEntry = history[history.length - 2];
    const prevRank = prevEntry?.rankings?.[keyword];

    if (!prevRank || prevRank === '20+' || currentRank === '20+') {
      if (prevRank === '20+' && currentRank !== '20+') {
        return <span className="flex items-center text-xs font-semibold text-emerald-400 gap-0.5"><TrendingUp className="h-3.5 w-3.5" /> Entered Top 20</span>;
      }
      return <Minus className="h-4 w-4 text-slate-500" />;
    }

    const curVal = Number(currentRank);
    const prevVal = Number(prevRank);

    if (curVal < prevVal) {
      // Lower number is a higher rank! (e.g. #3 is better than #5)
      return <span className="flex items-center text-xs font-semibold text-emerald-400 gap-0.5"><TrendingUp className="h-3.5 w-3.5" /> +{prevVal - curVal}</span>;
    } else if (curVal > prevVal) {
      return <span className="flex items-center text-xs font-semibold text-rose-400 gap-0.5"><TrendingDown className="h-3.5 w-3.5" /> -{curVal - prevVal}</span>;
    }
    
    return <span className="flex items-center text-xs text-slate-500 font-semibold">Stable</span>;
  };

  if (loadingList) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-slate-900" />
          <p className="text-slate-500 font-semibold text-sm">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const gmbPosts = posts.filter(p => !p.call_to_action_type?.startsWith('MEDIA_'));
  const gmbPhotos = posts.filter(p => p.call_to_action_type?.startsWith('MEDIA_'));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row">
      
      {/* 1. Sidebar - Client Selector */}
      <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col shrink-0 shadow-xs z-10">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-slate-900 rounded-lg text-white shadow-xs">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-wider text-slate-900">
              MEDCY PORTAL
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/80">
            Admin
          </span>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">Onboarded Clients ({clients.length})</p>
        </div>

        <nav className="flex-grow overflow-y-auto p-3 space-y-1.5">
          {clients.length > 0 ? (
            clients.map((c) => {
              const isSelected = selectedClientId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClientId(c.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all text-left group cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border border-slate-900 text-white shadow-md' 
                      : 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {c.logo_url ? (
                    <img 
                      src={c.logo_url} 
                      alt="" 
                      className={`w-9 h-9 rounded-lg object-contain p-0.5 shrink-0 ${
                        isSelected ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200 shadow-2xs'
                      }`} 
                    />
                  ) : (
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-slate-800 border border-slate-700 text-indigo-300' : 'bg-slate-100 border border-slate-200 text-slate-500 group-hover:text-slate-900'
                    }`}>
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{c.company_name}</p>
                    <p className={`text-[10px] truncate mt-0.5 font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>{c.primary_category}</p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 font-medium">
              No clients found. Share the onboarding link to add clients.
            </div>
          )}
        </nav>
      </aside>

      {/* 2. Main Content Display Panel */}
      <main className="flex-grow flex flex-col min-w-0 bg-slate-50">
        
        {selectedClientId && selectedClient ? (
          loadingDetails ? (
            <div className="flex-grow flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="animate-spin h-8 w-8 text-slate-900" />
                <p className="text-slate-500 font-semibold text-sm">Retrieving client record...</p>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-grow">
              
              {/* Header profile details */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-md shadow-slate-200/50">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  {selectedClient.logo_url ? (
                    <img 
                      src={selectedClient.logo_url} 
                      alt="Logo" 
                      className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-200 p-1 shadow-xs" 
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shadow-xs">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">{selectedClient.company_name}</h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                        (selectedClient.onboarding_details?.business_type || 'healthcare') === 'healthcare'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                          : 'bg-indigo-50 text-indigo-800 border-indigo-200/80'
                      }`}>
                        {(selectedClient.onboarding_details?.business_type || 'healthcare') === 'healthcare' ? '🏥 Healthcare' : '🎓 Education'}
                      </span>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {selectedClient.primary_category}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-900 border border-indigo-200/80 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-indigo-600" /> {selectedClient.service_area}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
                  {gbpAccount?.google_location_id?.startsWith('pending') || !gbpAccount ? (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <div className="flex items-center gap-2 text-xs font-extrabold px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Pending Setup by Agency
                      </div>
                      <button
                        onClick={() => fetchGoogleLocations(selectedClient.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-full shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        title="Link and activate Google Business Profile for immediate publishing"
                      >
                        ⚡ Connect & Activate GBP
                      </button>
                      <a
                        href={`/api/auth/google?client_id=${selectedClient.id}&action=link`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-extrabold text-white rounded-full shadow-md cursor-pointer transition-all"
                        title="Link real Google Business Profile via Google OAuth 2.0 to publish changes live to Google Maps"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        Connect Live Google OAuth
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full shadow-2xs">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Linked & Connected
                      </div>
                      <button
                        onClick={() => fetchGoogleLocations(selectedClient.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-300 underline-offset-2 transition-colors cursor-pointer"
                        title="Change the Google Map location linked to this profile"
                      >
                        Change Location
                      </button>
                      <span className="text-slate-300">|</span>
                      <a
                        href={`/api/auth/google?client_id=${selectedClient.id}&action=link`}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 underline decoration-slate-300 underline-offset-2 transition-colors cursor-pointer"
                      >
                        Reconnect OAuth
                      </a>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-end gap-2.5">
                    {gbpAccount?.seo_plan_status === 'pending_approval' ? (
                      <button
                        onClick={handleApprovePlan}
                        disabled={approvingPlan || !gbpAccount?.ai_optimized_payload}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        {approvingPlan ? (
                          <>
                            <Loader2 className="animate-spin h-3.5 w-3.5" />
                            Approving & Executing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 text-white" />
                            Approve SEO Plan & Auto-Execute
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {gbpAccount?.seo_plan_status === 'approved' && (
                          <span className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                            <CheckCircle className="h-3.5 w-3.5" /> Auto-Pilot Active
                          </span>
                        )}
                        <button
                          onClick={handlePushMetadata}
                          disabled={pushingMetadata || !gbpAccount?.ai_optimized_payload}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                        >
                          {pushingMetadata ? (
                            <>
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                              Pushing to Google...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                              Force Manual Push
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    <button
                      onClick={handlePushFAQs}
                      disabled={pushingFAQs || !gbpAccount?.ai_optimized_payload || !gbpAccount?.ai_optimized_payload?.faqs}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                    >
                      {pushingFAQs ? (
                        <>
                          <Loader2 className="animate-spin h-3.5 w-3.5" />
                          Syncing FAQs...
                        </>
                      ) : gbpAccount?.ai_optimized_payload?.faqs_pushed ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          FAQs Synced
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-3.5 w-3.5" />
                          Sync AI FAQs to GMB
                        </>
                      )}
                    </button>

                    <div className="flex flex-col items-stretch gap-1">
                      <button
                        onClick={() => handleRunOptimizer(false)}
                        disabled={optimizing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-50 text-xs font-extrabold text-slate-800 rounded-xl cursor-pointer transition-all shadow-2xs"
                      >
                        {optimizing ? (
                          <>
                            <Loader2 className="animate-spin h-3.5 w-3.5 text-slate-900" />
                            Optimizing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 text-indigo-600" />
                            Recalculate Optimization
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to force scrape competitors and rankings? This will run new live searches on SerpApi.')) {
                            handleRunOptimizer(true);
                          }
                        }}
                        disabled={optimizing}
                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 text-center transition-all bg-transparent border-0 cursor-pointer pt-0.5"
                      >
                        Force Deep Refresh (Live Search Scrape)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-sm font-semibold text-red-700 flex items-center gap-2.5 shadow-sm">
                  <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 3. Daily Visibility Rank Tracker Panel */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                    Daily Local Pack Visibility Tracker
                  </h3>
                  <span className="text-[10px] font-extrabold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider">
                    Google Maps Ranks
                  </span>
                </div>

                {selectedClient.onboarding_details?.rank_history && selectedClient.onboarding_details.rank_history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs font-extrabold uppercase tracking-wider">
                          <th className="pb-3 font-semibold">Target Keyword</th>
                          <th className="pb-3 text-center font-semibold">Current Rank</th>
                          <th className="pb-3 text-center font-semibold">Trend</th>
                          <th className="pb-3 text-right font-semibold">Last Checked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(selectedClient.onboarding_details.rank_history[selectedClient.onboarding_details.rank_history.length - 1].rankings || {}).map(([keyword, rank]: any) => {
                          const isRanked = rank !== '20+' && rank !== 'Unranked';
                          return (
                            <tr key={keyword} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 font-extrabold text-slate-900 flex items-center gap-2">
                                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                                {keyword}
                              </td>
                              <td className="py-3.5 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-extrabold border ${
                                  isRanked 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                                    : 'bg-slate-100 border-slate-200 text-slate-600'
                                }`}>
                                  {isRanked ? `#${rank}` : '20+'}
                                </span>
                              </td>
                              <td className="py-3.5 text-center">
                                {getRankIndicator(keyword, rank, selectedClient.onboarding_details.rank_history)}
                              </td>
                              <td className="py-3.5 text-right text-xs text-slate-500 font-mono font-semibold">
                                {selectedClient.onboarding_details.rank_history[selectedClient.onboarding_details.rank_history.length - 1].date}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-1">
                    <p className="font-bold text-slate-700 text-sm">No Ranking History Available Yet</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Rankings are fetched automatically once a day in the background. If you just onboarded this client, click the **"Recalculate Optimization"** button above to run the initial analysis pipeline.
                    </p>
                  </div>
                )}

                {/* SEO Keyword Boost Panel */}
                {selectedClient.onboarding_details?.rank_history && selectedClient.onboarding_details.rank_history.length > 0 && (() => {
                  const latestHistory = selectedClient.onboarding_details.rank_history[selectedClient.onboarding_details.rank_history.length - 1];
                  const latestRankings = latestHistory?.rankings || {};
                  
                  const unrankedKeywords: string[] = [];
                  Object.entries(latestRankings).forEach(([key, val]) => {
                    if (val === '20+' || val === 'Unranked') {
                      const rawKeyword = key
                        .replace(/\s*\(Local\s*-\s*[^\)]+\)/i, '')
                        .replace(/\s*\(District\s*-\s*[^\)]+\)/i, '')
                        .trim();
                      if (rawKeyword && !unrankedKeywords.includes(rawKeyword)) {
                        unrankedKeywords.push(rawKeyword);
                      }
                    }
                  });

                  if (unrankedKeywords.length === 0) return null;

                  return (
                    <div className="mt-6 p-5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Zap className="h-4 w-4 text-amber-600 fill-amber-500 animate-pulse" />
                            SEO Keyword Boost Plan Active
                          </h4>
                          <p className="text-xs text-amber-950/80 max-w-2xl leading-relaxed font-medium">
                            The keywords below are currently ranking outside the Google Maps Top 20. The system has automatically flagged them for priority optimization. Next week's automated GMB posts, reviews responder replies, and metadata updates will prioritize targeting these search phrases to pull them into local pack rankings.
                          </p>
                        </div>
                        <button
                          onClick={handlePublishPost}
                          disabled={publishingPost}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 shrink-0 hover:scale-[1.01]"
                        >
                          {publishingPost ? (
                            <>
                              <Loader2 className="animate-spin h-3.5 w-3.5" />
                              Boosting Ranks...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                              Boost Ranks Now (Post Targeted Update)
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {unrankedKeywords.map((kw, i) => (
                          <span key={i} className="px-3 py-1 text-xs font-mono font-extrabold text-amber-900 bg-white border border-amber-300/80 rounded-lg shadow-2xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Main content grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 4. AI Recommendation Panel */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 space-y-6">
                    <h3 className="text-lg font-extrabold text-slate-900 border-b border-slate-200 pb-4 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      Gemini AI Enhancement Engine
                    </h3>

                    {gbpAccount?.ai_optimized_payload ? (
                      <>
                        {/* Gaps Identfied */}
                        <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                          <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Identified competitor weaknesses & Gaps</p>
                          <ul className="space-y-2.5">
                            {gbpAccount.ai_optimized_payload.gaps_identified?.map((gap: string, i: number) => (
                              <li key={i} className="text-sm text-slate-800 font-semibold flex items-start gap-3">
                                <span className="h-5 w-5 bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-md flex items-center justify-center text-xs shrink-0 font-extrabold mt-0.5">{i+1}</span>
                                <span>{gap}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Categories & Keywords */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Suggested Google Categories</p>
                            <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">PRIMARY</p>
                              <span className="inline-block text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg mt-1">
                                {gbpAccount.ai_optimized_payload.recommended_categories?.primary}
                              </span>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">SECONDARY (ADD THESE)</p>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {gbpAccount.ai_optimized_payload.recommended_categories?.secondary?.map((cat: string) => (
                                  <span key={cat} className="text-xs font-bold px-2.5 py-1 bg-white text-slate-700 border border-slate-200 rounded-md shadow-2xs">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
                            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Suggested SEO Local Keywords</p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {gbpAccount.ai_optimized_payload.keyword_recommendations?.map((kw: string) => (
                                <span key={kw} className="text-xs font-extrabold px-3 py-1 bg-indigo-50 text-indigo-900 border border-indigo-200 rounded-xl flex items-center gap-1 shadow-2xs">
                                  <Tag className="h-3 w-3 text-indigo-600" /> {kw}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Profile Description */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Optimized Description (750 chars max)</p>
                            <button
                              onClick={() => copyToClipboard(gbpAccount.ai_optimized_payload.suggested_profile_description, setCopiedDesc)}
                              className="p-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              {copiedDesc ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy Text</>}
                            </button>
                          </div>
                          <p className="text-sm text-slate-800 font-medium leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-200">
                            {gbpAccount.ai_optimized_payload.suggested_profile_description}
                          </p>
                        </div>

                        {/* Weekly Posting blueprint */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <p className="text-xs text-slate-700 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <Calendar className="h-4.5 w-4.5 text-indigo-600" /> Weekly Scheduled AI Posts
                            </p>
                            <button
                              onClick={handlePublishPost}
                              disabled={publishingPost}
                              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-55 text-xs font-extrabold text-white rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.01]"
                            >
                              {publishingPost ? (
                                <>
                                  <Loader2 className="animate-spin h-3.5 w-3.5" />
                                  Publishing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                                  Publish Next Post Now
                                </>
                              )}
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gbpAccount.ai_optimized_payload.weekly_posting_plan?.map((post: any) => {
                              // Check if this week is already published
                              const isPublished = posts.some(p => p.title?.includes(`Week ${post.week}`));
                              return (
                                <div key={post.week} className={`p-5 rounded-2xl border space-y-2 relative transition-all ${
                                  isPublished 
                                    ? 'bg-emerald-50/50 border-emerald-200 opacity-80' 
                                    : 'bg-slate-50 border-slate-200 shadow-2xs'
                                }`}>
                                  <span className={`absolute top-3.5 right-3.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                                    isPublished
                                      ? 'bg-emerald-100 border-emerald-200 text-emerald-800'
                                      : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                  }`}>
                                    {isPublished ? 'Week ' + post.week + ' Published' : 'Week ' + post.week}
                                  </span>
                                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Google Post blueprint</p>
                                  <p className="text-xs font-extrabold text-slate-900 pr-14 leading-relaxed">{post.topic}</p>
                                  <span className="inline-block text-[10px] font-bold uppercase text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                    CTA: {post.cta}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Published Posts Log */}
                          {gmbPosts.length > 0 && (
                            <div className="space-y-3 pt-5 border-t border-slate-200">
                              <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wider">Published Post History ({gmbPosts.length})</p>
                              <div className="space-y-3">
                                {gmbPosts.map((post: any) => (
                                  <div key={post.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-extrabold text-slate-900">
                                        {post.google_post_id ? `GMB Post (${post.google_post_id.split('/').pop()})` : 'Published Update'}
                                      </span>
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(post.post_text || '');
                                            alert('Post content copied to clipboard!');
                                          }}
                                          className="p-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-1 cursor-pointer"
                                        >
                                          <Copy className="h-3.5 w-3.5" /> Copy Post
                                        </button>
                                        <span className="text-xs text-slate-500 font-mono font-semibold">Published on {post.published_at?.split('T')?.[0] || post.scheduled_at?.split('T')?.[0]}</span>
                                      </div>
                                    </div>
                                    <p className="text-xs text-slate-700 font-medium leading-relaxed font-sans">{post.post_text}</p>
                                    {post.image_url && (
                                      <div className="flex items-center gap-2 pt-1">
                                        <span className="text-[10px] uppercase font-bold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md shadow-2xs">Media Attached</span>
                                        <a href={post.image_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1">View Image <ExternalLink className="h-3 w-3" /></a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Showcase Photos Desk */}
                          <div className="space-y-4 pt-6 border-t border-slate-200">
                            <p className="text-xs text-slate-700 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <FileImage className="h-4.5 w-4.5 text-indigo-600" /> Google Maps Photos & Showcase Media Desk
                            </p>

                            {/* Scheduling Form */}
                            <form onSubmit={handleSchedulePhoto} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                              <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Schedule & Upload New Photo</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Photo File</label>
                                  <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                                    required
                                    className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Showcase Category</label>
                                  <select 
                                    value={photoCategory}
                                    onChange={(e) => setPhotoCategory(e.target.value)}
                                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
                                  >
                                    <option value="ADDITIONAL">Additional Photo (Showcase)</option>
                                    <option value="LOGO">Logo Image (Profile)</option>
                                    <option value="COVER">Cover Photo (Banner)</option>
                                    <option value="INTERIOR">Interior View</option>
                                    <option value="EXTERIOR">Exterior Facade</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Schedule Date & Time (Optional)</label>
                                  <input 
                                    type="datetime-local" 
                                    value={photoScheduleDate}
                                    onChange={(e) => setPhotoScheduleDate(e.target.value)}
                                    className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Caption / Alt Description</label>
                                <textarea 
                                  value={photoCaption}
                                  onChange={(e) => setPhotoCaption(e.target.value)}
                                  placeholder="Describe this photo for Google Maps customers..."
                                  rows={2}
                                  className="w-full text-xs text-slate-800 bg-white border border-slate-300 rounded-xl p-3 font-medium focus:outline-none focus:border-indigo-500 resize-none shadow-2xs" 
                                />
                              </div>

                              <button
                                type="submit"
                                disabled={schedulingPhoto || !photoFile}
                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                              >
                                {schedulingPhoto ? (
                                  <>
                                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                                    Uploading and Scheduling Photo...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                                    {photoScheduleDate ? 'Schedule Photo Upload' : 'Upload and Publish Photo Now'}
                                  </>
                                )}
                              </button>
                            </form>

                            {/* Scheduled / Published Showcase Photos list */}
                            {gmbPhotos.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {gmbPhotos.map((item) => {
                                  const categoryName = item.call_to_action_type?.replace('MEDIA_', '') || 'ADDITIONAL';
                                  const captionText = item.post_text?.replace('[PHOTO_ONLY] ', '') || 'No description.';
                                  const isPublished = item.status === 'published';
                                  return (
                                    <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-start gap-4 transition-all shadow-xs">
                                      <img 
                                        src={item.image_url} 
                                        alt="" 
                                        className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" 
                                      />
                                      <div className="flex-grow space-y-2 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                                            {categoryName}
                                          </span>
                                          {isPublished ? (
                                            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md flex items-center gap-1 shrink-0">
                                              Published
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => handlePublishMediaNow(item.id)}
                                              disabled={schedulingPhoto}
                                              className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md hover:bg-amber-100 transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                                            >
                                              Publish Now
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-xs font-semibold text-slate-800 truncate">{captionText}</p>
                                        <p className="text-[10px] font-medium text-slate-500">
                                          {isPublished 
                                            ? `Published on ${item.published_at?.split('T')?.[0] || item.scheduled_at?.split('T')?.[0]}`
                                            : `Scheduled for ${new Date(item.scheduled_at).toLocaleString()}`
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-center text-xs font-medium text-slate-500 py-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                                No showcase photos uploaded or scheduled yet. Use the form above to post your first photo asset.
                              </p>
                            )}
                          </div>

                          {/* Doctor & Faculty Registry Console */}
                          <div className="space-y-4 pt-6 border-t border-slate-200">
                            <p className="text-xs text-slate-700 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="h-4.5 w-4.5 text-indigo-600" />
                              {(selectedClient.onboarding_details?.business_type || 'healthcare') === 'education'
                                ? 'Faculty & Instructor Registry'
                                : 'Doctors & Practitioner Registry'
                              }
                            </p>

                            {/* Add Doctor inline form */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (dashDocName.trim() && dashDocSpecialty.trim()) {
                                  const currentDoctors = selectedClient.onboarding_details?.doctors || [];
                                  const updatedList = [
                                    ...currentDoctors,
                                    {
                                      name: dashDocName.trim(),
                                      specialty: dashDocSpecialty.trim(),
                                      bio: dashDocBio.trim()
                                    }
                                  ];
                                  handleUpdateDoctors(updatedList);
                                  setDashDocName('');
                                  setDashDocSpecialty('');
                                  setDashDocBio('');
                                }
                              }}
                              className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4"
                            >
                              <p className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Register New Professional</p>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Full Name</label>
                                  <input 
                                    type="text" 
                                    placeholder={(selectedClient.onboarding_details?.business_type || 'healthcare') === 'education' ? "e.g., Prof. Rajesh Kumar" : "e.g., Dr. Anjali Sharma"}
                                    value={dashDocName}
                                    onChange={(e) => setDashDocName(e.target.value)}
                                    required
                                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs" 
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Specialty / Subspecialty</label>
                                  <input 
                                    type="text" 
                                    placeholder={(selectedClient.onboarding_details?.business_type || 'healthcare') === 'education' ? "e.g., Natural Language Processing" : "e.g., IVF & Reproductive Endocrinology"}
                                    value={dashDocSpecialty}
                                    onChange={(e) => setDashDocSpecialty(e.target.value)}
                                    required
                                    className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-xl p-2.5 font-medium focus:outline-none focus:border-indigo-500 shadow-2xs" 
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Biographical / Academic Profile</label>
                                <textarea 
                                  placeholder="Highlight experience, qualifications, and special treatment offerings..."
                                  value={dashDocBio}
                                  onChange={(e) => setDashDocBio(e.target.value)}
                                  rows={2}
                                  className="w-full text-xs text-slate-900 bg-white border border-slate-300 rounded-xl p-3 font-medium focus:outline-none focus:border-indigo-500 resize-none shadow-2xs" 
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-xs font-extrabold text-white rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Register Professional Details
                              </button>
                            </form>

                            {/* Registered Doctors list */}
                            {(selectedClient.onboarding_details?.doctors || []).length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(selectedClient.onboarding_details.doctors).map((doc: any, idx: number) => (
                                  <div key={idx} className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3 relative group shadow-xs">
                                    <button
                                      onClick={() => {
                                        if (confirm('Are you sure you want to remove this profile from the registry?')) {
                                          const currentDoctors = selectedClient.onboarding_details?.doctors || [];
                                          const updatedList = currentDoctors.filter((_: any, i: number) => i !== idx);
                                          handleUpdateDoctors(updatedList);
                                        }
                                      }}
                                      className="absolute top-3.5 right-3.5 text-slate-400 hover:text-red-600 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                    
                                    <div>
                                      <h5 className="text-sm font-extrabold text-slate-900">{doc.name}</h5>
                                      <p className="text-xs font-extrabold text-indigo-600 mt-0.5">{doc.specialty}</p>
                                    </div>
                                    
                                    {doc.bio && (
                                      <p className="text-xs text-slate-700 font-medium italic bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 leading-relaxed pr-6">
                                        "{doc.bio}"
                                      </p>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handlePublishDoctorBio(doc)}
                                      disabled={publishingPost}
                                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 disabled:opacity-50 text-xs font-extrabold text-slate-800 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                                    >
                                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                                      Publish Showcase Bio Post
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-center text-xs font-medium text-slate-500 py-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                                No professionals registered in the profile database yet.
                              </p>
                            )}
                          </div>

                          {/* Frequently Asked Questions blueprint */}
                          {gbpAccount.ai_optimized_payload.faqs && gbpAccount.ai_optimized_payload.faqs.length > 0 && (
                            <div className="space-y-4 pt-6 border-t border-slate-200">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <p className="text-xs text-slate-700 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                                    <HelpCircle className="h-4.5 w-4.5 text-indigo-600" /> AI Frequently Asked Questions (Q&A)
                                  </p>
                                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Note: Google API is offline since Nov 2025. Copy and add manually.</p>
                                </div>
                                <button
                                  onClick={() => {
                                    const allFaqs = gbpAccount.ai_optimized_payload.faqs.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
                                    navigator.clipboard.writeText(allFaqs);
                                    alert('All FAQs copied to clipboard!');
                                  }}
                                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-extrabold text-white rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.01]"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                  Copy All FAQs
                                </button>
                              </div>

                              <div className="space-y-3">
                                {gbpAccount.ai_optimized_payload.faqs.map((faq: any, i: number) => (
                                  <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 relative group">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(`Question: ${faq.question}\nAnswer: ${faq.answer}`);
                                        alert('FAQ Q&A copied to clipboard!');
                                      }}
                                      className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                    >
                                      <Copy className="h-3 w-3" /> Copy Q&A
                                    </button>
                                    <p className="text-xs font-extrabold text-slate-900 flex items-start gap-2.5 leading-relaxed pr-20">
                                      <span className="text-indigo-800 text-[10px] font-extrabold uppercase px-2 py-0.5 bg-indigo-100 border border-indigo-200 rounded-md shrink-0 mt-0.5">Q</span>
                                      {faq.question}
                                    </p>
                                    <p className="text-xs text-slate-700 font-medium flex items-start gap-2 leading-relaxed pl-8 border-l-2 border-slate-200">
                                      {faq.answer}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-xs font-medium text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                        No AI optimization payload saved. Scrape competitor profiles first.
                      </div>
                    )}
                  </div>

              {/* 4. Google Maps Reviews Auto-Responder Panel */}
              <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-md shadow-slate-200/50 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-indigo-600" />
                      Google Maps Reviews Auto-Responder Desk
                    </h3>
                    <p className="text-xs font-medium text-slate-500">HIPAA compliant AI response console</p>
                  </div>
                  <button
                    onClick={handleSyncReviews}
                    disabled={syncingReviews}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-extrabold text-white rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 hover:scale-[1.01]"
                  >
                    {syncingReviews ? (
                      <>
                        <Loader2 className="animate-spin h-3.5 w-3.5" />
                        Replying Reviews...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 text-indigo-300" />
                        Sync & Reply Reviews
                      </>
                    )}
                  </button>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4">
                     {reviews.map((rev) => {
                       const finalReply = rev.posted_reply || rev.ai_draft_reply;
                       return (
                         <div key={rev.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-2xs">
                           <div className="flex items-start justify-between gap-3">
                             <div className="space-y-1">
                               <span className="text-sm font-extrabold text-slate-900">{rev.reviewer_name}</span>
                               <div className="flex items-center gap-2">
                                 {/* Draw rating stars */}
                                 <div className="flex text-amber-400 text-sm">
                                   {Array.from({ length: 5 }).map((_, i) => (
                                     <span key={i} className={i < (rev.star_rating || 0) ? 'text-amber-400 fill-amber-400 font-black' : 'text-slate-300'}>★</span>
                                   ))}
                                 </div>
                                 <span className="text-xs text-slate-500 font-mono font-semibold">
                                   {rev.review_created_at?.split('T')?.[0] || rev.created_at?.split('T')?.[0]}
                                 </span>
                               </div>
                             </div>
                             
                             {finalReply ? (
                               <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md flex items-center gap-1 shrink-0">
                                 <Check className="h-3 w-3 text-emerald-600" /> {rev.posted_reply ? 'Replied to Google' : 'Draft Generated'}
                               </span>
                             ) : (
                               <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md flex items-center gap-1 shrink-0 animate-pulse">
                                 <AlertCircle className="h-3 w-3 text-amber-600" /> Pending Auto-Reply
                               </span>
                             )}
                           </div>

                           {rev.comment && (
                             <p className="text-xs text-slate-800 font-medium italic bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 leading-relaxed font-sans shadow-2xs">
                               "{rev.comment}"
                             </p>
                           )}

                           {finalReply ? (
                             <div className="space-y-2 pt-2 border-t border-slate-200">
                               <div className="flex items-center justify-between">
                                 <span className="text-xs font-extrabold text-indigo-800 uppercase tracking-wider">AI Representative Response</span>
                                 <button
                                   onClick={() => {
                                     navigator.clipboard.writeText(finalReply);
                                     alert('Review reply copied to clipboard!');
                                   }}
                                   className="p-1 text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-all flex items-center gap-1 cursor-pointer"
                                 >
                                   <Copy className="h-3.5 w-3.5" /> Copy Reply
                                 </button>
                               </div>
                               <p className="text-xs text-slate-800 font-medium bg-white border border-indigo-200/80 px-3.5 py-3 rounded-xl leading-relaxed font-sans shadow-2xs">
                                 {finalReply}
                               </p>
                             </div>
                           ) : (
                             <p className="text-xs font-medium text-slate-500">AI response will be drafted and posted automatically on sync.</p>
                           )}
                         </div>
                       );
                     })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs font-medium text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
                    No Google reviews retrieved yet. Click "Sync & Reply Reviews" above to simulate reviews fetching.
                  </div>
                )}
              </div>
            </div>

                {/* 5. Competitor detail right sidebar panel */}
                <div className="space-y-6">
                  
                  {/* Competitor Scrapes list */}
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-md shadow-slate-200/50 space-y-5">
                    <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-3">
                      Competitors Scraped ({competitors.length})
                    </h3>

                    <div className="space-y-3">
                      {competitors.length > 0 ? (
                        competitors.map((comp, idx) => (
                          <div key={comp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h5 className="text-sm font-extrabold text-slate-900 break-all">{comp.competitor_name}</h5>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {comp.categories_found?.map((cat: string) => (
                                    <span key={cat} className="text-[10px] font-extrabold px-2 py-0.5 bg-white text-slate-700 border border-slate-200 rounded-md shadow-2xs">
                                      {cat}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              {comp.maps_place_id && comp.maps_place_id !== 'pending' && (
                                <a
                                  href={`https://www.google.com/maps/place/?q=place_id:${comp.maps_place_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition-all shrink-0 shadow-2xs"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedCompIndex(selectedCompIndex === idx ? null : idx)}
                              className="text-xs font-extrabold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              {selectedCompIndex === idx ? 'Hide Reviews' : 'Show Scraped Reviews'}
                            </button>

                            {selectedCompIndex === idx && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono shadow-2xs">
                                {comp.reviews_scraped || 'No review data.'}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-xs font-medium text-slate-500 py-4">No competitors scraped yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Hospital/Campus sign photo display */}
                  {selectedClient.building_image_url && (
                    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-md shadow-slate-200/50 space-y-2.5">
                      <p className="text-xs text-slate-700 uppercase tracking-wider font-extrabold">
                        {(selectedClient.onboarding_details?.business_type || 'healthcare') === 'healthcare'
                          ? 'Street Signboard Photo'
                          : 'Campus Facade Photo'}
                      </p>
                      <img 
                        src={selectedClient.building_image_url} 
                        alt="Building" 
                        className="w-full h-36 object-cover rounded-2xl border border-slate-200 shadow-xs" 
                      />
                    </div>
                  )}

                  {/* Interior/Classroom Photo */}
                  {selectedClient.onboarding_details?.additional_images?.interior_url && (
                    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-md shadow-slate-200/50 space-y-2.5">
                      <p className="text-xs text-slate-700 uppercase tracking-wider font-extrabold">
                        {(selectedClient.onboarding_details?.business_type || 'healthcare') === 'healthcare'
                          ? 'Clinic Interior Photo'
                          : 'Classroom / Lab Photo'}
                      </p>
                      <img 
                        src={selectedClient.onboarding_details.additional_images.interior_url} 
                        alt="Interior" 
                        className="w-full h-36 object-cover rounded-2xl border border-slate-200 shadow-xs" 
                      />
                    </div>
                  )}

                  {/* Staff/Faculty Team Photo */}
                  {selectedClient.onboarding_details?.additional_images?.staff_url && (
                    <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-md shadow-slate-200/50 space-y-2.5">
                      <p className="text-xs text-slate-700 uppercase tracking-wider font-extrabold">
                        {(selectedClient.onboarding_details?.business_type || 'healthcare') === 'healthcare'
                          ? 'Doctors & Staff Photo'
                          : 'Faculty & Staff Photo'}
                      </p>
                      <img 
                        src={selectedClient.onboarding_details.additional_images.staff_url} 
                        alt="Staff" 
                        className="w-full h-36 object-cover rounded-2xl border border-slate-200 shadow-xs" 
                      />
                    </div>
                  )}

                </div>

              </div>

            </div>
          )
        ) : (
          <div className="flex-grow flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-4 bg-white border border-slate-200 p-8 rounded-3xl shadow-md shadow-slate-200/50">
              <div className="p-4 bg-slate-900 rounded-2xl inline-block text-white shadow-md">
                <Users className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">Client Management Center</h3>
              <p className="text-slate-600 font-medium text-sm leading-relaxed">
                Welcome to the Medcy Local SEO control deck. Select an onboarded clinic from the sidebar list to inspect their connected profile status, track search keyword rankings, and review AI suggestions.
              </p>
            </div>
          </div>
        )}

      {/* Google Location Selector Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200">
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Select Google Location</h3>
            <p className="text-sm font-medium text-slate-600 mb-6">
              Choose the exact Google Business Profile location to link with {selectedClient?.business_name}.
            </p>

            {loadingLocations ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <p className="text-sm font-bold text-slate-500">Fetching accessible locations from Google...</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">
                {googleLocations.length === 0 ? (
                  <div className="p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm font-medium">
                    No locations found for this Google Account. Please ensure you have claimed the business on Google My Business.
                  </div>
                ) : (
                  googleLocations.map((loc) => (
                    <label 
                      key={loc.name} 
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedGoogleLocationId === loc.name 
                          ? 'border-indigo-600 bg-indigo-50/50' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="location_id" 
                        value={loc.name}
                        checked={selectedGoogleLocationId === loc.name}
                        onChange={(e) => setSelectedGoogleLocationId(e.target.value)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">{loc.title || 'Unnamed Location'}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1 flex gap-2">
                          <span>ID: {loc.name.replace('locations/', '')}</span>
                          {loc.storeCode && <span>• Code: {loc.storeCode}</span>}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setShowLocationModal(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-extrabold rounded-full transition-all"
              >
                Cancel
              </button>
              <button 
                disabled={loadingLocations || !selectedGoogleLocationId}
                onClick={async () => {
                  try {
                    const res = await fetch('/api/automation/activate-profile', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        client_id: selectedClient.id,
                        location_id: selectedGoogleLocationId
                      })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert('✅ Google Business Profile connected and activated successfully!');
                      setShowLocationModal(false);
                      window.location.reload();
                    } else {
                      alert('❌ Activation Error: ' + (data.error || 'Failed to activate'));
                    }
                  } catch (e: any) {
                    alert('❌ Network Error: ' + e.message);
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-extrabold rounded-full shadow-md transition-all flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-slate-900" />
          <p className="text-slate-500 font-semibold text-sm">Initializing administrator control panel...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
