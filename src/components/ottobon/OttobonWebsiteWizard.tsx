'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Upload, 
  Sparkles, 
  Shield, 
  Globe, 
  Layout, 
  Smartphone, 
  Calendar, 
  FileText, 
  Download, 
  Printer, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  Users, 
  MessageSquare, 
  Share2, 
  Lock, 
  HelpCircle,
  Eye,
  Award
} from 'lucide-react';

interface WebsiteOnboardingWizardProps {
  brand: string;
}

// 22 Sections grouped into 8 Phases for intuitive navigation
const PHASES = [
  { id: 1, name: 'Business Essentials', sections: [1, 2, 3] },
  { id: 2, name: 'Branding & Design', sections: [4, 19] },
  { id: 3, name: 'Structure & Features', sections: [5, 6, 12] },
  { id: 4, name: 'Story & Team', sections: [7, 8, 10] },
  { id: 5, name: 'Media & Content', sections: [9, 13, 21] },
  { id: 6, name: 'Tech & Booking', sections: [11, 16, 17] },
  { id: 7, name: 'Marketing & Legal', sections: [14, 15, 18, 20, 22] },
  { id: 8, name: 'Review & Submit', sections: [23] } // 23 is Final Summary Review step
];

const SECTION_TITLES: Record<number, { title: string; desc: string }> = {
  1: { title: 'Basic Business Information', desc: 'Tell us about your brand identity and core business operations.' },
  2: { title: 'Website Goals', desc: 'Define the primary objectives and success metrics for your website.' },
  3: { title: 'Contact Information', desc: 'How customers and our team can reach your business.' },
  4: { title: 'Branding & Visuals', desc: 'Upload your logo and define your color palette and font style.' },
  5: { title: 'Website Pages Required', desc: 'Select the pages and structure needed for your website.' },
  6: { title: 'Services Catalog', desc: 'Add repeatable service cards with pricing and details.' },
  7: { title: 'About Your Business', desc: 'Share your company story, mission, vision, and core values.' },
  8: { title: 'Team Members & Staff', desc: 'Showcase key doctors, teachers, or leadership profiles.' },
  9: { title: 'Media & Photo Gallery', desc: 'Upload images categorized by clinic, office, equipment, or events.' },
  10: { title: 'Customer Testimonials', desc: 'Add client reviews and ratings to build credibility and trust.' },
  11: { title: 'Appointment Booking Details', desc: 'Configure online booking time slots and consultation fees.' },
  12: { title: 'Required Interactive Features', desc: 'Select widgets like WhatsApp chat, online payments, and live chat.' },
  13: { title: 'Content Responsibility', desc: 'Specify who will provide website copy, images, and videos.' },
  14: { title: 'SEO & Search Targeting', desc: 'Define target cities, locations, keywords, and competitors.' },
  15: { title: 'Social Media Integrations', desc: 'Link your official Facebook, Instagram, LinkedIn, and YouTube channels.' },
  16: { title: 'Domain & Hosting Architecture', desc: 'Let us know if you own a domain or need us to register hosting.' },
  17: { title: 'Analytics & Marketing Tools', desc: 'Select tracking scripts like Google Analytics, Pixel, and Tag Manager.' },
  18: { title: 'Legal & Policy Documents', desc: 'Upload Privacy Policy, Terms, and industry certificates.' },
  19: { title: 'Design Preferences & Aesthetics', desc: 'Choose between Modern, Premium, Luxury styles and themes.' },
  20: { title: 'Project Timeline & Milestones', desc: 'Set your expected launch date and key delivery deadlines.' },
  21: { title: 'Final Assets Bulk Upload', desc: 'Attach any remaining brochures, price lists, or brand kits.' },
  22: { title: 'Bonus Insights & Call-to-Action', desc: 'Tell us your top customer objections and primary CTA choice.' },
  23: { title: 'Final Summary Review', desc: 'Review all entered specifications before submitting to our development team.' }
};

export default function OttobonWebsiteWizard() {
  const isOttobon = true; const brand = 'ottobon';
  const storageKey = `website_onboarding_draft_${brand}`;

  const [currentSection, setCurrentSection] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Initial form data state
  const [formData, setFormData] = useState<any>({
    // Section 1: Basic Info
    businessName: '',
    tagline: '',
    businessType: isOttobon ? 'Educational Institute' : 'Clinic',
    yearEstablished: new Date().getFullYear().toString(),
    shortDescription: '',
    uniqueSellingPoint: '',
    targetAudience: '',
    // Section 2: Website Goals
    goals: [] as string[],
    successMetric: '',
    // Section 3: Contact Info
    contactPerson: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    googleMapsUrl: '',
    workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
    emergencyContact: '',
    // Section 4: Branding
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#4f46e5',
    preferredFonts: 'Inter / Modern Sans',
    brandGuidelinesUrl: '',
    inspirationUrls: '',
    // Section 5: Website Pages
    pages: ['Home', 'About', 'Services', 'Contact', 'FAQ'] as string[],
    customPageName: '',
    // Section 6: Services (Repeatable)
    services: [
      { name: isOttobon ? 'General Admissions' : 'General Consultation', description: 'Comprehensive primary evaluation and guidance.', benefits: 'Expert care, quick turnaround', price: '₹500', duration: '30 mins', imageUrl: '' }
    ],
    // Section 7: About Business
    story: '',
    mission: '',
    vision: '',
    values: '',
    // Section 8: Team Members (Repeatable)
    team: [
      { name: '', designation: isOttobon ? 'Principal / HOD' : 'Senior Consultant', qualification: '', experience: '10+ Years', specialization: '', bio: '', photoUrl: '' }
    ],
    // Section 9: Gallery
    gallery: {
      office: [] as string[],
      clinic: [] as string[],
      interior: [] as string[],
      exterior: [] as string[],
      staff: [] as string[],
      equipment: [] as string[],
      events: [] as string[],
      others: [] as string[]
    },
    // Section 10: Testimonials (Repeatable)
    testimonials: [
      { customerName: '', review: '', rating: 5, photoUrl: '' }
    ],
    // Section 11: Appointments
    wantAppointmentBooking: true,
    workingDays: 'Monday to Saturday',
    openingTime: '09:00 AM',
    closingTime: '08:00 PM',
    consultationDuration: '30 Minutes',
    consultationFee: '₹500',
    emailConfirmation: true,
    whatsappConfirmation: true,
    // Section 12: Required Features
    features: ['WhatsApp Chat', 'Call Button', 'Contact Form', 'Google Maps', 'FAQ', 'Reviews'] as string[],
    // Section 13: Content Providers
    contentProvider: {
      websiteContent: 'Client',
      images: 'Client',
      videos: 'Need Help',
      blogs: 'Agency',
      serviceDescriptions: 'Agency'
    },
    // Section 14: SEO
    targetCity: '',
    targetLocations: '',
    targetKeywords: '',
    competitors: '',
    servicesToRank: '',
    // Section 15: Social Media
    social: { facebook: '', instagram: '', linkedin: '', youtube: '', twitter: '', gbp: '' },
    // Section 16: Domain & Hosting
    ownDomain: 'No',
    domainName: '',
    registrar: '',
    domainCredentialsUrl: '',
    haveHosting: 'No',
    needPurchase: 'Yes',
    // Section 17: Integrations
    integrations: ['Google Analytics', 'Search Console', 'WhatsApp API'] as string[],
    // Section 18: Legal
    legalUrls: { privacy: '', terms: '', refund: '', licenses: '', certificates: '' },
    // Section 19: Design Preferences
    designStyle: 'Premium',
    preferredColors: 'Modern Blues and Clean Whites',
    theme: 'Light Theme',
    designInspiration: '',
    // Section 20: Timeline
    launchDate: '',
    milestones: '',
    // Section 21: Final Assets
    finalAssets: [] as string[],
    // Section 22: Bonus Questions
    topQuestions: '',
    commonObjections: '',
    whyChooseYou: '',
    highlightService: '',
    primaryCta: 'WhatsApp'
  });

  // Load draft from localStorage on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await supabase.from('gbp_clients').select('*').order('company_name', { ascending: true });
        if (data) setExistingClients(data);
      } catch (e) {
        console.error('Error fetching clients:', e);
      }
    };
    fetchClients();

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev: any) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Error restoring website onboarding draft:', e);
      }
    }
  }, []);

  const handleSelectExistingClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = existingClients.find(c => c.id === clientId || c.company_name === clientId);
    if (client) {
      setFormData((prev: any) => ({
        ...prev,
        businessName: client.company_name || prev.businessName,
        email: client.contact_email || prev.email,
        phone: client.contact_phone || prev.phone,
        address: client.service_area || prev.address,
        logoUrl: client.logo_url || prev.logoUrl
      }));
      alert(`✨ Pre-filled business info for "${client.company_name}". You can skip re-typing these!`);
    }
  };

  // Save draft on every change
  useEffect(() => {
    if (formData.businessName || formData.email || formData.phone) {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    }
  }, [formData, storageKey]);

  // Handle image/file uploads to Supabase storage
  const handleFileUpload = async (file: File, folder: string, callback: (url: string) => void) => {
    setUploadingField(folder);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `website-onboarding/${brand}/${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('client-assets')
        .getPublicUrl(filePath);

      callback(publicUrl);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Check storage permissions'}`);
    } finally {
      setUploadingField(null);
    }
  };

  // Check if current section is valid
  const validateCurrentSection = () => {
    if (currentSection === 1) {
      if (!formData.businessName.trim()) {
        alert('⚠️ Please enter your Business Name.');
        return false;
      }
    }
    if (currentSection === 3) {
      if (!formData.phone.trim() || !formData.email.trim()) {
        alert('⚠️ Please provide your Contact Phone Number and Email Address.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentSection((prev) => Math.min(prev + 1, 23));
    }
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentSection((prev) => Math.max(prev - 1, 1));
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${formData.businessName || 'client'}_website_onboarding.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Final Submit to Supabase database
  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const existingMatch = existingClients.find(
        c => c.id === selectedClientId || 
             c.company_name?.toLowerCase() === formData.businessName.trim().toLowerCase() ||
             (c.contact_email && c.contact_email.toLowerCase() === formData.email.trim().toLowerCase())
      );

      let newClient = null;
      let dbError = null;

      if (existingMatch && existingMatch.id) {
        // UPDATE existing record to avoid duplicate rows!
        const existingDetails = existingMatch.onboarding_details || {};
        const updatedDetails = {
          ...existingDetails,
          type: 'website_onboarding',
          brand: brand,
          website_data: formData,
          completed_step: 'website_onboarding',
          onboarded_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('gbp_clients')
          .update({
            company_name: formData.businessName,
            contact_email: formData.email,
            contact_phone: formData.phone,
            logo_url: formData.logoUrl || existingMatch.logo_url || null,
            service_area: formData.targetCity || formData.address || existingMatch.service_area || 'Local',
            onboarding_details: updatedDetails
          })
          .eq('id', existingMatch.id)
          .select()
          .single();

        newClient = data || existingMatch;
        dbError = error;
      } else {
        const { data, error } = await supabase
          .from('gbp_clients')
          .insert([
            {
              company_name: formData.businessName,
              contact_email: formData.email,
              contact_phone: formData.phone,
              logo_url: formData.logoUrl || null,
              primary_category: formData.businessType,
              service_area: formData.targetCity || formData.address || 'Local',
              onboarding_details: {
                type: 'website_onboarding',
                brand: brand,
                website_data: formData,
                completed_step: 'website_onboarding',
                onboarded_at: new Date().toISOString()
              }
            }
          ])
          .select()
          .single();

        newClient = data;
        dbError = error;
      }

      if (dbError) throw dbError;

      // --- NEW: INSERT INTO website_intakes TABLE ---
      const { error: websiteError } = await supabase
        .from('gbp_website_intakes')
        .insert({
          client_id: newClient.id,
          form_data: formData,
          status: 'new'
        });
      
      if (websiteError) {
        console.error("Failed to insert into website_intakes:", websiteError);
      }
      // ----------------------------------------------

      // Clear draft on success
      localStorage.removeItem(storageKey);
      setSuccessMessage('🎉 Website onboarding specifications submitted successfully!');
      setTimeout(() => {
        window.location.href = `/${brand}/onboarding/success?client_id=${newClient?.id || ''}&type=website`;
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit form.');
      setIsSubmitting(false);
    }
  };

  const currentPhase = PHASES.find((p) => p.sections.includes(currentSection)) || PHASES[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Top Sticky Progress & Navigation Bar (Linear/Stripe style) */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 text-white rounded-xl shadow-md">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">
              {formData.businessName || (isOttobon ? 'Ottobon Agency' : 'Medcy Health Tech')} — Website Onboarding
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium flex items-center gap-1.5">
              Phase {currentPhase.id} of {PHASES.length}: <span className={`font-bold px-2 py-0.5 rounded-md border ${isOttobon ? 'text-amber-800 bg-amber-50 border-amber-200/80' : 'text-emerald-700 bg-emerald-50 border-emerald-200/80'}`}>{currentPhase.name}</span>
            </p>
          </div>
        </div>

        {/* Phase Stepper Pills */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-full border border-slate-200/80">
          {PHASES.map((phase) => {
            const isActive = phase.id === currentPhase.id;
            const isDone = phase.sections[phase.sections.length - 1] < currentSection;
            return (
              <button
                key={phase.id}
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setCurrentSection(phase.sections[0]);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm border border-slate-900'
                    : isDone
                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                {isDone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <span>{phase.id}.</span>}
                <span>{phase.name}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <a
            href={`/${brand}/onboarding`}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300/60"
            title="Return to Onboarding Menu"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </a>
          <button
            onClick={() => {
              localStorage.setItem(storageKey, JSON.stringify(formData));
              alert('✨ Draft progress saved to your browser!');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300/60"
            title="Save draft to resume later"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span>Save Draft</span>
          </button>

        </div>
      </header>

      {/* Main Wizard Card Container */}
      <main className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">
        {/* Status Alerts */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-700 flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Submission Error</strong>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-sm text-emerald-800 flex items-start gap-3 shadow-sm animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Success!</strong>
              <p className="mt-0.5">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Section Header Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 mb-8 transition-all">
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2.5">
                {SECTION_TITLES[currentSection]?.title || 'Section Specification'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {SECTION_TITLES[currentSection]?.desc}
              </p>
            </div>

          </div>

          {/* ========================================================= */}
          {/* SECTION 1: Basic Business Information */}
          {/* ========================================================= */}
          {currentSection === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Smart Tenant Profile Selector Banner */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-xs sm:text-sm">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 animate-pulse" />
                    <span>Already registered your Business or Clinic in our platform?</span>
                  </div>
                  {selectedClientId && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      ✨ Linked to Backend Profile
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Select your existing brand profile below to automatically pre-fill your business name, contact phone, email, and address. This prevents duplicate database records!
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectExistingClient(e.target.value)}
                    className="w-full bg-white border border-indigo-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select Existing Brand / Clinic Profile (Optional) --</option>
                    {existingClients.map((c, i) => (
                      <option key={c.id || i} value={c.id || c.company_name}>
                        {c.company_name} ({c.contact_email || 'No email'}) • {c.primary_category || 'Business'}
                      </option>
                    ))}
                  </select>
                  {selectedClientId && (
                    <button
                      type="button"
                      onClick={() => { setSelectedClientId(''); }}
                      className="px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-200 transition-colors shrink-0 cursor-pointer"
                    >
                      Clear & New
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">
                  Business / Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={isOttobon ? 'e.g., Ottobon International Academy' : 'e.g., Medcy Specialty Hospital'}
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-sm font-medium transition-all"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Tagline / Slogan (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Transforming Lives with Advanced Care"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.tagline}
                    onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Business Type</label>
                  <select
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:border-indigo-600 text-sm font-medium transition-all"
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  >
                    <option value="Clinic">Clinic</option>
                    <option value="Hospital">Hospital</option>
                    <option value="Dental">Dental</option>
                    <option value="Fertility">Fertility / IVF</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Educational Institute">Educational Institute / College</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Retail">Retail Store</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Startup">Tech Startup</option>
                    <option value="Other">Other Specialty</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Year Established</label>
                  <input
                    type="number"
                    placeholder="2015"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.yearEstablished}
                    onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Target Audience</label>
                  <input
                    type="text"
                    placeholder="e.g., Families, Students, Patients seeking IVF treatment"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Short Business Description</label>
                <textarea
                  rows={3}
                  placeholder="Provide a brief overview of your organization and core services..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">What makes your business unique? (USP)</label>
                <textarea
                  rows={2}
                  placeholder="e.g., 24/7 emergency lab, 100% placement record, robotic surgery specialists..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.uniqueSellingPoint}
                  onChange={(e) => setFormData({ ...formData, uniqueSellingPoint: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 2: Website Goals */}
          {/* ========================================================= */}
          {currentSection === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Why do you need a website? (Select all that apply)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Generate Leads',
                    'Appointment Booking',
                    'Sell Products / Ecommerce',
                    'Increase Brand Awareness',
                    'Showcase Services & Treatments',
                    'Build Trust & Credibility',
                    'Establish Online Presence',
                    'Portfolio & Case Studies',
                    'Other Custom Goal'
                  ].map((goal) => {
                    const checked = formData.goals.includes(goal);
                    return (
                      <label
                        key={goal}
                        onClick={() => {
                          const next = checked
                            ? formData.goals.filter((g: string) => g !== goal)
                            : [...formData.goals, goal];
                          setFormData({ ...formData, goals: next });
                        }}
                        className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                          checked ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <input type="checkbox" checked={checked} readOnly className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                        <span className="text-sm">{goal}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">What would make this website successful for you?</label>
                <textarea
                  rows={3}
                  placeholder="e.g., Receiving 50+ appointment inquiries monthly, ranking #1 for best dental clinic in city..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.successMetric}
                  onChange={(e) => setFormData({ ...formData, successMetric: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 3: Contact Information */}
          {/* ========================================================= */}
          {currentSection === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Contact Person Name</label>
                  <input
                    type="text"
                    placeholder="Dr. Rajesh / Dr. Anitha"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Phone Number <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">WhatsApp Counseling / Chat Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Official Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    placeholder="contact@hospital.com"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Full Business Street Address</label>
                <input
                  type="text"
                  placeholder="Plot No. 42, Health Avenue, Nehru Nagar, Visakhapatnam, AP 530020"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Google Maps URL</label>
                  <input
                    type="url"
                    placeholder="https://maps.google.com/..."
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.googleMapsUrl}
                    onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Working Hours / Timings</label>
                  <input
                    type="text"
                    placeholder="Mon - Sat: 9:00 AM - 8:00 PM"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.workingHours}
                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Emergency Contact Number (Optional)</label>
                <input
                  type="text"
                  placeholder="24/7 Ambulance / Emergency desk number"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 4: Branding */}
          {/* ========================================================= */}
          {currentSection === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Upload Brand Logo (PNG / JPG)</label>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 transition-all">
                  {formData.logoUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={formData.logoUrl} alt="Logo" className="h-20 w-20 object-contain mb-3 bg-white p-2 rounded-xl border shadow-xs" />
                      <button
                        onClick={() => setFormData({ ...formData, logoUrl: '' })}
                        className="text-xs font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                      <Upload className="h-8 w-8 text-slate-400 mb-2" />
                      <span className="text-sm font-bold text-indigo-600">Click to upload logo file</span>
                      <span className="text-xs text-slate-500 mt-1">Transparent PNG or high-res JPG recommended</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0], 'logo', (url) => setFormData({ ...formData, logoUrl: url }));
                          }
                        }}
                      />
                    </label>
                  )}
                  {uploadingField === 'logo' && <p className="text-xs text-indigo-600 font-bold mt-2 animate-pulse">Uploading logo to cloud...</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Primary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="h-11 w-16 rounded-xl border border-slate-300 cursor-pointer bg-white p-1"
                    />
                    <input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono uppercase"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Secondary Brand Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="h-11 w-16 rounded-xl border border-slate-300 cursor-pointer bg-white p-1"
                    />
                    <input
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Preferred Fonts / Typography Style</label>
                <input
                  type="text"
                  placeholder="e.g., Modern Sans (Inter / Roboto), Elegant Serif (Playfair), Clean Geometric"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.preferredFonts}
                  onChange={(e) => setFormData({ ...formData, preferredFonts: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Upload Brand Guidelines / Brand Kit (Optional PDF / ZIP)</label>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-600 truncate font-medium">
                    {formData.brandGuidelinesUrl ? '✅ Brand kit uploaded' : 'No file attached'}
                  </span>
                  <label className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shrink-0">
                    Upload Kit
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], 'brand-kit', (url) => setFormData({ ...formData, brandGuidelinesUrl: url }));
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Share websites you like for design inspiration</label>
                <textarea
                  rows={3}
                  placeholder="Paste URLs of competitor or reference websites whose design, layout, or color schemes you love..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.inspirationUrls}
                  onChange={(e) => setFormData({ ...formData, inspirationUrls: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 5: Website Pages */}
          {/* ========================================================= */}
          {currentSection === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">Select all pages you want included in your website sitemap:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  'Home',
                  'About Us',
                  'Services / Treatments',
                  'Doctors / Team',
                  'Gallery / Tour',
                  'Testimonials / Reviews',
                  'FAQ',
                  'Blog / Articles',
                  'Pricing / Packages',
                  'Contact Us',
                  'Book Appointment',
                  'Privacy Policy',
                  'Terms & Conditions',
                  'Careers / Jobs',
                  'Custom Page'
                ].map((page) => {
                  const checked = formData.pages.includes(page);
                  return (
                    <label
                      key={page}
                      onClick={() => {
                        const next = checked
                          ? formData.pages.filter((p: string) => p !== page)
                          : [...formData.pages, page];
                        setFormData({ ...formData, pages: next });
                      }}
                      className={`flex items-center gap-2.5 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        checked ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                      <span className="text-sm">{page}</span>
                    </label>
                  );
                })}
              </div>

              {formData.pages.includes('Custom Page') && (
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in fade-in">
                  <label className="block text-xs font-bold text-indigo-900 uppercase">Specify Custom Page Name(s)</label>
                  <input
                    type="text"
                    placeholder="e.g., International Patients, Insurance & Billing, Student Portal..."
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 text-sm"
                    value={formData.customPageName}
                    onChange={(e) => setFormData({ ...formData, customPageName: e.target.value })}
                  />
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 6: Services (Repeatable) */}
          {/* ========================================================= */}
          {currentSection === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{formData.services.length} Service Cards Configured</span>
                <button
                  onClick={() => {
                    const next = [...formData.services, { name: '', description: '', benefits: '', price: '', duration: '', imageUrl: '' }];
                    setFormData({ ...formData, services: next });
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Another Service
                </button>
              </div>

              <div className="space-y-4">
                {formData.services.map((srv: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 relative space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Service #{idx + 1}</span>
                      {formData.services.length > 1 && (
                        <button
                          onClick={() => {
                            const next = formData.services.filter((_: any, i: number) => i !== idx);
                            setFormData({ ...formData, services: next });
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors cursor-pointer"
                          title="Delete service"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Service Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="e.g., Root Canal Treatment / B.Tech CSE"
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={srv.name}
                          onChange={(e) => {
                            const next = [...formData.services];
                            next[idx].name = e.target.value;
                            setFormData({ ...formData, services: next });
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700">Price (Optional)</label>
                          <input
                            type="text"
                            placeholder="₹1,500 / Free"
                            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                            value={srv.price}
                            onChange={(e) => {
                              const next = [...formData.services];
                              next[idx].price = e.target.value;
                              setFormData({ ...formData, services: next });
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700">Duration (Optional)</label>
                          <input
                            type="text"
                            placeholder="45 mins / 4 Years"
                            className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                            value={srv.duration}
                            onChange={(e) => {
                              const next = [...formData.services];
                              next[idx].duration = e.target.value;
                              setFormData({ ...formData, services: next });
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Description</label>
                      <textarea
                        rows={2}
                        placeholder="Explain what this service or procedure includes..."
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                        value={srv.description}
                        onChange={(e) => {
                          const next = [...formData.services];
                          next[idx].description = e.target.value;
                          setFormData({ ...formData, services: next });
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Key Benefits / Highlights</label>
                        <input
                          type="text"
                          placeholder="Painless procedure, same-day discharge, guaranteed placement..."
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={srv.benefits}
                          onChange={(e) => {
                            const next = [...formData.services];
                            next[idx].benefits = e.target.value;
                            setFormData({ ...formData, services: next });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5">
                        <span className="text-xs text-slate-600 truncate font-medium">
                          {srv.imageUrl ? '✅ Image Uploaded' : 'No Service Image'}
                        </span>
                        <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer shrink-0">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'services', (url) => {
                                  const next = [...formData.services];
                                  next[idx].imageUrl = url;
                                  setFormData({ ...formData, services: next });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 7: About Your Business */}
          {/* ========================================================= */}
          {currentSection === 7 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-800">Business Story / History</label>
                <textarea
                  rows={4}
                  placeholder="Tell us how your organization started, your journey, and what drives your commitment to quality..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.story}
                  onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Mission Statement</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., To provide ethical, compassionate, and world-class healthcare to all strata of society..."
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Vision Statement</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., To become the most trusted healthcare institution in India known for clinical excellence..."
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Core Values</label>
                <input
                  type="text"
                  placeholder="e.g., Integrity, Patient-First Care, Innovation, Compassion, Academic Excellence"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm transition-all"
                  value={formData.values}
                  onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 8: Team Members (Repeatable) */}
          {/* ========================================================= */}
          {currentSection === 8 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{formData.team.length} Team Members Configured</span>
                <button
                  onClick={() => {
                    const next = [...formData.team, { name: '', designation: '', qualification: '', experience: '', specialization: '', bio: '', photoUrl: '' }];
                    setFormData({ ...formData, team: next });
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Team Member
                </button>
              </div>

              <div className="space-y-4">
                {formData.team.map((doc: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 relative space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Member #{idx + 1}</span>
                      {formData.team.length > 1 && (
                        <button
                          onClick={() => {
                            const next = formData.team.filter((_: any, i: number) => i !== idx);
                            setFormData({ ...formData, team: next });
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Dr. Ajay Kumar / Prof. Sharma"
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={doc.name}
                          onChange={(e) => {
                            const next = [...formData.team];
                            next[idx].name = e.target.value;
                            setFormData({ ...formData, team: next });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Designation / Role</label>
                        <input
                          type="text"
                          placeholder="Senior IVF Consultant / Dean"
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={doc.designation}
                          onChange={(e) => {
                            const next = [...formData.team];
                            next[idx].designation = e.target.value;
                            setFormData({ ...formData, team: next });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Qualification</label>
                        <input
                          type="text"
                          placeholder="MBBS, MS, M.Ch / Ph.D, M.Tech"
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={doc.qualification}
                          onChange={(e) => {
                            const next = [...formData.team];
                            next[idx].qualification = e.target.value;
                            setFormData({ ...formData, team: next });
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Experience & Specialization</label>
                        <input
                          type="text"
                          placeholder="15+ Years — High-Risk Pregnancy & Infertility"
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={doc.experience}
                          onChange={(e) => {
                            const next = [...formData.team];
                            next[idx].experience = e.target.value;
                            setFormData({ ...formData, team: next });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 self-end">
                        <span className="text-xs text-slate-600 truncate font-medium">
                          {doc.photoUrl ? '✅ Portrait Attached' : 'No Profile Photo'}
                        </span>
                        <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer shrink-0">
                          Upload Portrait
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'team', (url) => {
                                  const next = [...formData.team];
                                  next[idx].photoUrl = url;
                                  setFormData({ ...formData, team: next });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Short Bio / Message</label>
                      <textarea
                        rows={2}
                        placeholder="Brief summary of their awards, philosophy, or clinical expertise..."
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                        value={doc.bio}
                        onChange={(e) => {
                          const next = [...formData.team];
                          next[idx].bio = e.target.value;
                          setFormData({ ...formData, team: next });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 9: Gallery */}
          {/* ========================================================= */}
          {currentSection === 9 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">Upload photos for each category to build your website image gallery:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: 'office', label: 'Office / Reception' },
                  { key: 'clinic', label: 'Clinic / Treatment Rooms' },
                  { key: 'interior', label: 'Interior & Labs' },
                  { key: 'exterior', label: 'Exterior & Building Arch' },
                  { key: 'staff', label: 'Staff & Team Photos' },
                  { key: 'equipment', label: 'Advanced Equipment & Tech' },
                  { key: 'events', label: 'Events / Toppers / Celebrations' },
                  { key: 'others', label: 'Other Campus Assets' }
                ].map((cat) => {
                  const items = formData.gallery[cat.key] || [];
                  return (
                    <div key={cat.key} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-800">{cat.label}</span>
                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {items.length} files
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60">
                        <span className="text-xs text-slate-500 truncate max-w-[140px]">
                          {items.length > 0 ? 'Ready for gallery' : 'No photos uploaded'}
                        </span>
                        <label className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-700 cursor-pointer">
                          + Add Photos
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], `gallery/${cat.key}`, (url) => {
                                  const nextGallery = { ...formData.gallery, [cat.key]: [...items, url] };
                                  setFormData({ ...formData, gallery: nextGallery });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 10: Testimonials (Repeatable) */}
          {/* ========================================================= */}
          {currentSection === 10 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">{formData.testimonials.length} Testimonial Cards Configured</span>
                <button
                  onClick={() => {
                    const next = [...formData.testimonials, { customerName: '', review: '', rating: 5, photoUrl: '' }];
                    setFormData({ ...formData, testimonials: next });
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Testimonial
                </button>
              </div>

              <div className="space-y-4">
                {formData.testimonials.map((t: any, idx: number) => (
                  <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 relative space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Review #{idx + 1}</span>
                      {formData.testimonials.length > 1 && (
                        <button
                          onClick={() => {
                            const next = formData.testimonials.filter((_: any, i: number) => i !== idx);
                            setFormData({ ...formData, testimonials: next });
                          }}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Customer / Patient Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Ramesh Babu / Smt. Lakshmi"
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                          value={t.customerName}
                          onChange={(e) => {
                            const next = [...formData.testimonials];
                            next[idx].customerName = e.target.value;
                            setFormData({ ...formData, testimonials: next });
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Rating (1 to 5 Stars)</label>
                        <select
                          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-amber-600"
                          value={t.rating}
                          onChange={(e) => {
                            const next = [...formData.testimonials];
                            next[idx].rating = Number(e.target.value);
                            setFormData({ ...formData, testimonials: next });
                          }}
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                          <option value={3}>⭐⭐⭐ (3 Stars)</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 self-end">
                        <span className="text-xs text-slate-600 truncate font-medium">
                          {t.photoUrl ? '✅ Photo Attached' : 'No Avatar Photo'}
                        </span>
                        <label className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-slate-700 cursor-pointer shrink-0">
                          Upload Photo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                handleFileUpload(e.target.files[0], 'testimonials', (url) => {
                                  const next = [...formData.testimonials];
                                  next[idx].photoUrl = url;
                                  setFormData({ ...formData, testimonials: next });
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700">Review Content</label>
                      <textarea
                        rows={2}
                        placeholder="Quote what the customer said about their experience..."
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm"
                        value={t.review}
                        onChange={(e) => {
                          const next = [...formData.testimonials];
                          next[idx].review = e.target.value;
                          setFormData({ ...formData, testimonials: next });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 11: Appointment Details */}
          {/* ========================================================= */}
          {currentSection === 11 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-indigo-950">Do you want Online Appointment Booking?</h3>
                  <p className="text-xs text-indigo-700 mt-0.5">Allow patients or students to schedule consultations directly on your website.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.wantAppointmentBooking}
                    onChange={(e) => setFormData({ ...formData, wantAppointmentBooking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                </label>
              </div>

              {formData.wantAppointmentBooking && (
                <div className="space-y-5 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Working Days</label>
                      <input
                        type="text"
                        placeholder="Monday to Saturday"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                        value={formData.workingDays}
                        onChange={(e) => setFormData({ ...formData, workingDays: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Opening Time</label>
                      <input
                        type="text"
                        placeholder="09:00 AM"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                        value={formData.openingTime}
                        onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Closing Time</label>
                      <input
                        type="text"
                        placeholder="08:00 PM"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                        value={formData.closingTime}
                        onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Consultation Duration Slot</label>
                      <input
                        type="text"
                        placeholder="30 Minutes / 1 Hour"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                        value={formData.consultationDuration}
                        onChange={(e) => setFormData({ ...formData, consultationDuration: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700">Consultation Fee</label>
                      <input
                        type="text"
                        placeholder="₹500 / Free Counseling"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-emerald-700"
                        value={formData.consultationFee}
                        onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.emailConfirmation}
                        onChange={(e) => setFormData({ ...formData, emailConfirmation: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-slate-300"
                      />
                      <span>Send Automatic Email Confirmations</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.whatsappConfirmation}
                        onChange={(e) => setFormData({ ...formData, whatsappConfirmation: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 rounded border-slate-300"
                      />
                      <span>Send WhatsApp Booking Alerts</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 12: Required Features */}
          {/* ========================================================= */}
          {currentSection === 12 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">Check all widgets and interactive features you want enabled on your website:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  'WhatsApp Chat',
                  'Call Button',
                  'Contact Form',
                  'Google Maps Map',
                  'Live Chat Widget',
                  'Online Payments',
                  'Blog / News',
                  'Newsletter Signup',
                  'Download Brochure PDF',
                  'Image Gallery',
                  'Video Gallery',
                  'FAQ Accordion',
                  'Customer Reviews',
                  'Multi-Language Support',
                  'Social Media Feed',
                  'Google Analytics',
                  'Search Console',
                  'CRM Integration',
                  'Payment Gateway',
                  'AI Chatbot'
                ].map((feat) => {
                  const checked = formData.features.includes(feat);
                  return (
                    <label
                      key={feat}
                      onClick={() => {
                        const next = checked
                          ? formData.features.filter((f: string) => f !== feat)
                          : [...formData.features, feat];
                        setFormData({ ...formData, features: next });
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        checked ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                      <span className="text-xs">{feat}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 13: Content Providers */}
          {/* ========================================================= */}
          {currentSection === 13 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">For each website asset, let us know who will be providing the content:</p>
              <div className="space-y-3">
                {[
                  { key: 'websiteContent', label: 'Website Text Copy & Descriptions' },
                  { key: 'images', label: 'High-Resolution Photos & Banners' },
                  { key: 'videos', label: 'Promotional / Campus / Treatment Videos' },
                  { key: 'blogs', label: 'Initial Blog Articles & SEO Guides' },
                  { key: 'serviceDescriptions', label: 'Detailed Medical / Academic Course Bios' }
                ].map((item) => (
                  <div key={item.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl gap-3">
                    <span className="text-sm font-bold text-slate-800">{item.label}</span>
                    <select
                      className="w-full sm:w-48 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-indigo-900 shadow-xs"
                      value={formData.contentProvider[item.key]}
                      onChange={(e) => {
                        const next = { ...formData.contentProvider, [item.key]: e.target.value };
                        setFormData({ ...formData, contentProvider: next });
                      }}
                    >
                      <option value="Client">We will provide (Client)</option>
                      <option value="Agency">Agency to write / design</option>
                      <option value="Need Help">We need assistance</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 14: SEO */}
          {/* ========================================================= */}
          {currentSection === 14 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Primary Target City</label>
                  <input
                    type="text"
                    placeholder="e.g., Visakhapatnam / Hyderabad"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm"
                    value={formData.targetCity}
                    onChange={(e) => setFormData({ ...formData, targetCity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Secondary Target Locations / Suburbs</label>
                  <input
                    type="text"
                    placeholder="e.g., MVP Colony, Gajuwaka, Madhurawada"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm"
                    value={formData.targetLocations}
                    onChange={(e) => setFormData({ ...formData, targetLocations: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Target SEO Keywords</label>
                <input
                  type="text"
                  placeholder="e.g., best ivf center in vizag, top cbse school in hyderabad, painless dental clinic"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm"
                  value={formData.targetKeywords}
                  onChange={(e) => setFormData({ ...formData, targetKeywords: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Key Competitors to Outrank</label>
                <input
                  type="text"
                  placeholder="List 2-3 competitor hospital or college names in your area"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm"
                  value={formData.competitors}
                  onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Top Priority Services to Rank For</label>
                <input
                  type="text"
                  placeholder="e.g., IVF treatment costs, B.Tech AI admissions, hair transplant surgery"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-600 text-sm"
                  value={formData.servicesToRank}
                  onChange={(e) => setFormData({ ...formData, servicesToRank: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 15: Social Media */}
          {/* ========================================================= */}
          {currentSection === 15 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">Provide profile URLs so we can add social icons and verification tags:</p>
              {[
                { key: 'facebook', label: 'Facebook Page URL', placeholder: 'https://facebook.com/yourbrand' },
                { key: 'instagram', label: 'Instagram Profile URL', placeholder: 'https://instagram.com/yourbrand' },
                { key: 'linkedin', label: 'LinkedIn Company Page URL', placeholder: 'https://linkedin.com/company/yourbrand' },
                { key: 'youtube', label: 'YouTube Channel URL', placeholder: 'https://youtube.com/@yourbrand' },
                { key: 'twitter', label: 'Twitter / X Profile URL', placeholder: 'https://x.com/yourbrand' },
                { key: 'gbp', label: 'Google Business Profile Maps Link', placeholder: 'https://maps.google.com/...' }
              ].map((soc) => (
                <div key={soc.key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:items-center p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <label className="text-xs font-bold text-slate-800 sm:col-span-1">{soc.label}</label>
                  <input
                    type="url"
                    placeholder={soc.placeholder}
                    className="sm:col-span-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    value={formData.social[soc.key]}
                    onChange={(e) => {
                      const next = { ...formData.social, [soc.key]: e.target.value };
                      setFormData({ ...formData, social: next });
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 16: Domain & Hosting */}
          {/* ========================================================= */}
          {currentSection === 16 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-sm font-bold text-slate-800">Do you already own a custom domain name? (e.g., yourbrand.com)</label>
                <div className="flex items-center gap-6">
                  {['Yes', 'No'].map((val) => (
                    <label key={val} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="radio"
                        name="ownDomain"
                        checked={formData.ownDomain === val}
                        onChange={() => setFormData({ ...formData, ownDomain: val })}
                        className="h-4 w-4 text-indigo-600 border-slate-300"
                      />
                      <span>{val}, we {val === 'Yes' ? 'already own one' : 'need a new domain'}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.ownDomain === 'Yes' ? (
                <div className="space-y-4 p-5 bg-indigo-50/50 border border-indigo-200 rounded-2xl animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-indigo-950">Existing Domain Name</label>
                      <input
                        type="text"
                        placeholder="e.g., vizagivf.com / ottobonacademy.in"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-mono"
                        value={formData.domainName}
                        onChange={(e) => setFormData({ ...formData, domainName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-indigo-950">Registrar Name</label>
                      <input
                        type="text"
                        placeholder="e.g., GoDaddy, Namecheap, Google Domains, BigRock"
                        className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                        value={formData.registrar}
                        onChange={(e) => setFormData({ ...formData, registrar: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-600 font-medium">
                      {formData.domainCredentialsUrl ? '✅ DNS / Credentials file attached' : 'Optional: Attach domain DNS details / credentials PDF'}
                    </span>
                    <label className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold cursor-pointer shrink-0">
                      Upload File
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleFileUpload(e.target.files[0], 'domain-creds', (url) => setFormData({ ...formData, domainCredentialsUrl: url }));
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 animate-in fade-in">
                  💡 **No worries!** Our agency team will help you select and register a high-authority SEO domain name during project kickoff.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Do you already have web hosting?</label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium"
                    value={formData.haveHosting}
                    onChange={(e) => setFormData({ ...formData, haveHosting: e.target.value })}
                  >
                    <option value="No">No (We need cloud hosting)</option>
                    <option value="Yes">Yes (AWS / Hostinger / Bluehost)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Need us to purchase & manage hosting?</label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium"
                    value={formData.needPurchase}
                    onChange={(e) => setFormData({ ...formData, needPurchase: e.target.value })}
                  >
                    <option value="Yes">Yes, include managed hosting in package</option>
                    <option value="No">No, we will provide our own server SSH</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 17: Integrations */}
          {/* ========================================================= */}
          {currentSection === 17 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">Select third-party marketing, tracking, and payment systems to integrate:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  'Google Analytics 4',
                  'Google Search Console',
                  'Facebook / Meta Pixel',
                  'Google Tag Manager',
                  'Hospital / Campus CRM',
                  'Email Marketing (Mailchimp)',
                  'WhatsApp Business API',
                  'Razorpay Payment Gateway',
                  'Stripe International Payments'
                ].map((intg) => {
                  const checked = formData.integrations.includes(intg);
                  return (
                    <label
                      key={intg}
                      onClick={() => {
                        const next = checked
                          ? formData.integrations.filter((i: string) => i !== intg)
                          : [...formData.integrations, intg];
                        setFormData({ ...formData, integrations: next });
                      }}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                        checked ? 'bg-slate-900 border-slate-900 text-white font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input type="checkbox" checked={checked} readOnly className="h-4 w-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900" />
                      <span className="text-xs">{intg}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 18: Legal */}
          {/* ========================================================= */}
          {currentSection === 18 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">Upload official documents to display on your footer or credibility pages:</p>
              {[
                { key: 'privacy', label: 'Privacy Policy Document' },
                { key: 'terms', label: 'Terms & Conditions' },
                { key: 'refund', label: 'Refund / Cancellation Policy' },
                { key: 'licenses', label: 'Medical / Educational Licenses' },
                { key: 'certificates', label: 'Accreditation Certificates (NABH / NAAC / ISO)' }
              ].map((doc) => (
                <div key={doc.key} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <span className="text-sm font-bold text-slate-800">{doc.label}</span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formData.legalUrls[doc.key] ? '✅ Document uploaded' : 'Optional PDF / Word upload'}
                    </p>
                  </div>
                  <label className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-xs">
                    Upload
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], `legal/${doc.key}`, (url) => {
                            const next = { ...formData.legalUrls, [doc.key]: url };
                            setFormData({ ...formData, legalUrls: next });
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 19: Design Preferences */}
          {/* ========================================================= */}
          {currentSection === 19 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-3">Choose an Aesthetic Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Modern', 'Premium', 'Minimal', 'Luxury', 'Corporate', 'Creative'].map((style) => {
                    const selected = formData.designStyle === style;
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setFormData({ ...formData, designStyle: style })}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          selected
                            ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-md scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-sm block">{style}</span>
                        <span className={`text-[10px] uppercase tracking-wider mt-1 block ${selected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {style === 'Luxury' ? 'Gold & Glass' : style === 'Minimal' ? 'Clean White' : 'High Tech UI'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Preferred Theme Mode</label>
                  <select
                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  >
                    <option value="Light Theme">Light Theme (Clean White & Slate)</option>
                    <option value="Dark Theme">Dark Theme (Sleek Midnight & Glows)</option>
                    <option value="Dynamic Both">Dynamic Toggle (Both Light & Dark)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Color Palette Notes</label>
                  <input
                    type="text"
                    placeholder="e.g., Medical teals, trust navy blue, vibrant orange accents"
                    className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    value={formData.preferredColors}
                    onChange={(e) => setFormData({ ...formData, preferredColors: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Any additional design notes or websites to emulate?</label>
                <textarea
                  rows={3}
                  placeholder="Tell our UX designers if there are specific hero animations, cards, or menu layouts you want..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  value={formData.designInspiration}
                  onChange={(e) => setFormData({ ...formData, designInspiration: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 20: Timeline */}
          {/* ========================================================= */}
          {currentSection === 20 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Expected Website Launch Date</label>
                  <input
                    type="date"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium text-sm"
                    value={formData.launchDate}
                    onChange={(e) => setFormData({ ...formData, launchDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Priority Level</label>
                  <select
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-medium text-sm"
                  >
                    <option>Standard Delivery (2 - 3 Weeks)</option>
                    <option>Urgent / Admissions Deadline (7 - 10 Days)</option>
                    <option>Flexible / Comprehensive Redesign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Any important milestones or upcoming events?</label>
                <textarea
                  rows={3}
                  placeholder="e.g., We have an annual campus fest on Aug 15th, or hospital inauguration on Sept 1st..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 text-sm"
                  value={formData.milestones}
                  onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 21: Final Assets */}
          {/* ========================================================= */}
          {currentSection === 21 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <p className="text-sm text-slate-600">
                Attach any remaining brochures, treatment price lists, accreditation PDFs, or zip bundles so our developers have everything in one place:
              </p>

              <div className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-3xl p-8 text-center bg-indigo-50/20 transition-all">
                <label className="cursor-pointer flex flex-col items-center">
                  <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl mb-3 shadow-inner">
                    <Upload className="h-8 w-8" />
                  </div>
                  <span className="text-base font-bold text-indigo-900">Click to upload files</span>
                  <span className="text-xs text-slate-500 mt-1">Supports PDF, DOCX, ZIP, JPG, PNG (up to 50MB)</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        Array.from(e.target.files).forEach((f) => {
                          handleFileUpload(f, 'final-assets', (url) => {
                            setFormData((prev: any) => ({ ...prev, finalAssets: [...prev.finalAssets, url] }));
                          });
                        });
                      }
                    }}
                  />
                </label>
                {uploadingField === 'final-assets' && <p className="text-xs text-indigo-600 font-bold mt-3 animate-pulse">Uploading asset to cloud storage...</p>}
              </div>

              {formData.finalAssets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Uploaded Assets ({formData.finalAssets.length})</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {formData.finalAssets.map((url: string, i: number) => (
                      <div key={i} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="truncate max-w-[200px] text-slate-600 font-mono">Asset #{i + 1}</span>
                        <a href={url} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold hover:underline">View File</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 22: Bonus Questions */}
          {/* ========================================================= */}
          {currentSection === 22 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <label className="block text-sm font-bold text-slate-800">Top 3 questions your customers / patients frequently ask</label>
                <textarea
                  rows={3}
                  placeholder="1. What is the consultation fee? 2. Are scholarships available? 3. Is emergency care 24/7?"
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  value={formData.topQuestions}
                  onChange={(e) => setFormData({ ...formData, topQuestions: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800">Common customer objections or hesitation points</label>
                <textarea
                  rows={2}
                  placeholder="e.g., Worry about high treatment costs, distance from city center, hostel safety..."
                  className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                  value={formData.commonObjections}
                  onChange={(e) => setFormData({ ...formData, commonObjections: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800">Why do customers choose you over competitors?</label>
                  <input
                    type="text"
                    placeholder="e.g., Experienced senior doctors, state-of-the-art labs, 100% ethical care"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    value={formData.whyChooseYou}
                    onChange={(e) => setFormData({ ...formData, whyChooseYou: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-800">Which service should we highlight most on Hero section?</label>
                  <input
                    type="text"
                    placeholder="e.g., IVF Fertility Center / B.Tech Computer Science"
                    className="mt-1.5 block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                    value={formData.highlightService}
                    onChange={(e) => setFormData({ ...formData, highlightService: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">Preferred Primary Call-To-Action (CTA) Button</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {['WhatsApp', 'Call', 'Appointment', 'Contact Form', 'Email'].map((cta) => {
                    const sel = formData.primaryCta === cta;
                    return (
                      <button
                        key={cta}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryCta: cta })}
                        className={`py-3 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                          sel ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {cta}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* SECTION 23: Final Step - Summary Review & Submit */}
          {/* ========================================================= */}
          {currentSection === 23 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-extrabold text-indigo-950">📋 Final Specification Review</h3>
                  <p className="text-xs text-indigo-700 mt-1">Review all 22 sections below. You can jump back to edit any section or download a PDF / JSON copy.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportJson}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-indigo-600" /> JSON
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-indigo-600" /> Print PDF
                  </button>
                </div>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2">
                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">1. Business Profile</span>
                    <button onClick={() => setCurrentSection(1)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formData.businessName || 'Not specified'}</p>
                  <p className="text-xs text-slate-600">Type: {formData.businessType} | Est: {formData.yearEstablished}</p>
                  <p className="text-xs text-slate-500 italic truncate">{formData.tagline || 'No tagline'}</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">3. Contact Details</span>
                    <button onClick={() => setCurrentSection(3)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formData.contactPerson || 'No name'}</p>
                  <p className="text-xs text-slate-600">📞 {formData.phone} | ✉️ {formData.email}</p>
                  <p className="text-xs text-slate-500 truncate">📍 {formData.address || 'Address not listed'}</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">4. Branding & Aesthetics</span>
                    <button onClick={() => setCurrentSection(4)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="h-4 w-4 rounded-full border shadow-2xs" style={{ backgroundColor: formData.primaryColor }} />
                    <span className="h-4 w-4 rounded-full border shadow-2xs" style={{ backgroundColor: formData.secondaryColor }} />
                    <span className="text-xs font-mono text-slate-600">{formData.primaryColor} / {formData.secondaryColor}</span>
                  </div>
                  <p className="text-xs text-slate-600">Fonts: {formData.preferredFonts} | Style: {formData.designStyle}</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">5. Website Pages ({formData.pages.length})</span>
                    <button onClick={() => setCurrentSection(5)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {formData.pages.map((p: string) => (
                      <span key={p} className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">{p}</span>
                    ))}
                  </div>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">6. Services Configured ({formData.services.length})</span>
                    <button onClick={() => setCurrentSection(6)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {formData.services.slice(0, 3).map((s: any, i: number) => (
                      <li key={i} className="truncate">• {s.name || 'Unnamed service'} ({s.price || 'Fee NA'})</li>
                    ))}
                    {formData.services.length > 3 && <li className="text-slate-400 font-medium">+ {formData.services.length - 3} more services</li>}
                  </ul>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">8. Team Profiles ({formData.team.length})</span>
                    <button onClick={() => setCurrentSection(8)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1">
                    {formData.team.slice(0, 2).map((t: any, i: number) => (
                      <li key={i} className="truncate">• {t.name || 'Unnamed member'} — {t.designation}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">11. Appointments & Features</span>
                    <button onClick={() => setCurrentSection(11)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-xs text-slate-700 font-bold">
                    {formData.wantAppointmentBooking ? `✅ Booking Enabled (${formData.consultationDuration})` : '❌ Booking Disabled'}
                  </p>
                  <p className="text-xs text-slate-500 truncate">Features: {formData.features.slice(0, 4).join(', ')}</p>
                </div>

                <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl relative space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">16. Domain & Hosting Specs</span>
                    <button onClick={() => setCurrentSection(16)} className="text-xs font-bold text-indigo-600 hover:underline">Edit</button>
                  </div>
                  <p className="text-xs text-slate-700">Own Domain: <strong className="font-bold">{formData.ownDomain}</strong> {formData.domainName && `(${formData.domainName})`}</p>
                  <p className="text-xs text-slate-600">Need Hosting Purchase: <strong className="font-bold">{formData.needPurchase}</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentSection === 1 || isSubmitting}
            className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer ${
              currentSection === 1 || isSubmitting
                ? 'opacity-40 pointer-events-none bg-slate-100 text-slate-400'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs'
            }`}
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            {currentSection < 23 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-lg hover:shadow-xl flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
              >
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base rounded-2xl shadow-xl hover:shadow-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5" />
                    <span>Submitting Specifications...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <span>Submit & Confirm Project</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
