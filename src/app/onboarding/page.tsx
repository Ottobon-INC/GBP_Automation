'use client';

import React, { useState, useRef, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Tag, 
  UploadCloud, 
  X, 
  Plus, 
  Sparkles, 
  FileImage, 
  CheckCircle2, 
  ArrowRight,
  GraduationCap,
  Loader2,
  Users
} from 'lucide-react';

function ClientOnboardingFormContent() {
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand');

  const [businessType, setBusinessType] = useState<'healthcare' | 'education'>('healthcare');
  const [formData, setFormData] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    primaryCategory: 'Multi-Specialty Hospital',
    serviceArea: '',
    website: '',
  });

  // Doctors state
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorBio, setDoctorBio] = useState('');

  useEffect(() => {
    if (brand === 'ottobon') {
      setBusinessType('education');
      setFormData(prev => ({ ...prev, primaryCategory: 'Training Institute' }));
    } else if (brand === 'medcy') {
      setBusinessType('healthcare');
      setFormData(prev => ({ ...prev, primaryCategory: 'Multi-Specialty Hospital' }));
    }
  }, [brand]);

  const [specialties, setSpecialties] = useState<string[]>([]);
  const [currentSpecialty, setCurrentSpecialty] = useState('');
  
  const [keywords, setKeywords] = useState<string[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState('');

  // File Upload State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [buildingFile, setBuildingFile] = useState<File | null>(null);
  const [buildingPreview, setBuildingPreview] = useState<string>('');
  const [interiorFile, setInteriorFile] = useState<File | null>(null);
  const [interiorPreview, setInteriorPreview] = useState<string>('');
  const [staffFile, setStaffFile] = useState<File | null>(null);
  const [staffPreview, setStaffPreview] = useState<string>('');

  // Form submission and validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [hasGBP, setHasGBP] = useState(true);

  // File Input Refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const buildingInputRef = useRef<HTMLInputElement>(null);
  const interiorInputRef = useRef<HTMLInputElement>(null);
  const staffInputRef = useRef<HTMLInputElement>(null);

  // Handle adding array tags (Specialties/Keywords)
  const addTag = (
    e: React.KeyboardEvent | React.MouseEvent,
    value: string, 
    setter: React.Dispatch<React.SetStateAction<string[]>>, 
    clearInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // If mouse click or Enter key pressed
    if (('key' in e ? e.key === 'Enter' : e.type === 'click') && value.trim()) {
      e.preventDefault();
      setter(prev => [...new Set([...prev, value.trim()])]);
      clearInput('');
    }
  };

  const removeTag = (tagToRemove: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.filter(tag => tag !== tagToRemove));
  };

  // Handle Logo Upload Preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Building Image Upload Preview
  const handleBuildingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBuildingFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBuildingPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  // Handle Interior Image Upload Preview
  const handleInteriorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInteriorFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInteriorPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Staff/Team Image Upload Preview
  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setStaffFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setStaffPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload to Supabase Storage Helper
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. Core validations
      if (!logoFile) {
        throw new Error(businessType === 'healthcare' ? 'Please upload your Hospital Logo.' : 'Please upload your Campus/Institution Logo.');
      }
      if (!buildingFile) {
        throw new Error(businessType === 'healthcare' ? 'Please upload a Building Facade Photo for GBP optimization.' : 'Please upload a Campus/Building Facade Photo.');
      }

      // 2. Upload images to Supabase Storage Bucket
      let logoUrl = '';
      let buildingImageUrl = '';

      try {
        logoUrl = await uploadToStorage(logoFile, 'logos');
      } catch (err: any) {
        throw new Error(`Logo Upload Failed: Make sure you created the 'client-assets' bucket in Supabase and set it to public. Details: ${err.message}`);
      }

      try {
        buildingImageUrl = await uploadToStorage(buildingFile, 'buildings');
      } catch (err: any) {
        throw new Error(`Building Image Upload Failed: Details: ${err.message}`);
      }

      let interiorUrl = '';
      if (interiorFile) {
        try {
          interiorUrl = await uploadToStorage(interiorFile, 'interiors');
        } catch (err: any) {
          throw new Error(`Interior Image Upload Failed: Details: ${err.message}`);
        }
      }

      let staffUrl = '';
      if (staffFile) {
        try {
          staffUrl = await uploadToStorage(staffFile, 'staff');
        } catch (err: any) {
          throw new Error(`Staff Image Upload Failed: Details: ${err.message}`);
        }
      }

      // 3. Insert record into Supabase Database `public.clients`
      const { data: newClient, error: dbError } = await supabase
        .from('clients')
        .insert([
          {
            company_name: formData.companyName,
            contact_email: formData.contactEmail,
            contact_phone: formData.contactPhone,
            logo_url: logoUrl,
            building_image_url: buildingImageUrl,
            primary_category: formData.primaryCategory,
            popular_specialties: specialties,
            target_keywords: keywords,
            service_area: formData.serviceArea,
            onboarding_details: {
              has_gbp: hasGBP,
              business_type: businessType,
              completed_step: 'profile_onboarding',
              onboarded_at: new Date().toISOString(),
              website: formData.website || null,
              doctors: doctorsList,
              additional_images: {
                interior_url: interiorUrl || null,
                staff_url: staffUrl || null
              }
            }
          }
        ])
        .select()
        .single();

      if (dbError) {
        throw new Error(`Database submission failed: ${dbError.message}`);
      }

      setSuccessMessage('Successfully saved onboarding profile!');
      
      // 4. Route based on GBP status:
      // Has GBP: Connect existing profile via Google OAuth (if OAuth is not disabled for manual agency flow)
      // No GBP: Go to success page - our team will create the profile for them
      setTimeout(() => {
        const disableOAuth = process.env.NEXT_PUBLIC_DISABLE_OAUTH === 'true';
        if (hasGBP && !disableOAuth) {
          window.location.href = `/api/auth/google?client_id=${newClient.id}&action=link`;
        } else {
          window.location.href = `/onboarding/success?client_id=${newClient.id}`;
        }
      }, 1500);

    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOttobon = brand === 'ottobon';
  
  // Style config variables
  const accentColor = isOttobon ? 'text-amber-400' : 'text-emerald-400';
  const focusBorder = isOttobon ? 'focus:border-amber-500 focus:ring-amber-500' : 'focus:border-emerald-500 focus:ring-emerald-500';
  const badgeStyle = isOttobon 
    ? 'text-amber-400 bg-amber-950/50 border-amber-500/20' 
    : 'text-emerald-400 bg-emerald-950/50 border-emerald-500/20';
  const tagStyle = isOttobon
    ? 'bg-amber-950/80 text-amber-300 border-amber-500/20'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/20';
  const buttonStyle = isOttobon
    ? 'from-amber-650 to-yellow-600 hover:from-amber-600 hover:to-yellow-500 shadow-amber-500/10'
    : 'from-teal-650 to-emerald-600 hover:from-teal-600 hover:to-emerald-500 shadow-emerald-500/10';
  const bgGlow = isOttobon
    ? 'bg-amber-600/10'
    : 'bg-emerald-600/10';

  if (brand !== 'medcy' && brand !== 'ottobon') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-2xl text-center relative z-10 mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20">
              Agency Client Hub
            </span>
          </div>
          <h2 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 sm:text-5xl">
            GBP Onboarding Portal
          </h2>
          <p className="mt-3 text-base text-slate-400 max-w-md mx-auto">
            Welcome to the local SEO optimization platform. Please choose your company's registry portal below to get started.
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Card 1: Medcy */}
          <a
            href="/onboarding?brand=medcy"
            className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-emerald-500/40 rounded-3xl p-8 flex flex-col items-center text-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/5 cursor-pointer"
          >
            <div className="w-full flex flex-col items-center">
              <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center p-3 mb-6 border border-slate-800 group-hover:border-emerald-500/20 transition-all duration-300">
                <img src="/medcy_logo.png" alt="Medcy Health Tech" className="h-full w-full object-contain" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                Medcy Health Tech
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/20 mt-2">
                Healthcare & Clinics
              </span>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Register clinical locations, hospitals, diagnostic centers, and specialties for targeted local SEO optimization.
              </p>
            </div>
            <div className="w-full mt-8 pt-4 border-t border-slate-800/50 flex items-center justify-center gap-1 text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              Enter Medcy Portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </a>

          {/* Card 2: Ottobon */}
          <a
            href="/onboarding?brand=ottobon"
            className="group relative bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 hover:border-amber-500/40 rounded-3xl p-8 flex flex-col items-center text-center justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 cursor-pointer"
          >
            <div className="w-full flex flex-col items-center">
              <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center p-3 mb-6 border border-slate-800 group-hover:border-amber-500/20 transition-all duration-300">
                <img src="/ottobon_logo.png" alt="Ottobon Academy" className="h-full w-full object-contain" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                Ottobon Academy
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/20 mt-2">
                Education & Colleges
              </span>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                Register campuses, academies, educational institutes, and course programs for targeted maps rank pushes.
              </p>
            </div>
            <div className="w-full mt-8 pt-4 border-t border-slate-800/50 flex items-center justify-center gap-1 text-sm font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
              Enter Ottobon Portal <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background gradients */}
      <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] ${bgGlow} rounded-full blur-[120px] pointer-events-none`} />
      <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] ${bgGlow} rounded-full blur-[120px] pointer-events-none`} />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 flex flex-col items-center">
        <div className="flex flex-col items-center justify-center gap-2 mb-3">
          <div className="h-16 w-16 bg-white/5 rounded-2xl flex items-center justify-center p-2 mb-2 border border-slate-800">
            <img src={isOttobon ? '/ottobon_logo.png' : '/medcy_logo.png'} alt="Logo" className="h-full w-full object-contain" />
          </div>
          <span className={`text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${badgeStyle}`}>
            {isOttobon ? 'Ottobon Agency Setup' : 'Medcy Health Tech Setup'}
          </span>
        </div>
        <h2 className="text-center text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
          {isOttobon ? 'Academy Intake Registry' : 'Hospital Intake Registry'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400 max-w-lg mx-auto">
          {isOttobon
            ? 'Provide your campus details, upload branding files, and link your Google profile so our management specialists can optimize your presence on Google Maps.'
            : 'Provide your clinic details, upload branding files, and link your Google profile so our management specialists can optimize your presence on Google Maps.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl p-6 sm:p-10">
          
          {/* Status Messages */}
          {errorMessage && (
            <div className="mb-6 bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-sm text-red-300 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <X className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-red-200">Onboarding Error</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-sm text-emerald-300 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-emerald-200">Profile Saved</strong>
                <p className="mt-0.5">{successMessage} Redirecting to Google verification...</p>
              </div>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* 1. Core Profile Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                {isOttobon ? (
                  <>
                    <GraduationCap className={`h-5 w-5 ${accentColor}`} />
                    Institution Identity
                  </>
                ) : (
                  <>
                    <Building2 className={`h-5 w-5 ${accentColor}`} />
                    Clinic Identity
                  </>
                )}
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  {isOttobon ? 'Official College / School Name' : 'Official Hospital / Clinic Name'}
                </label>
                <div className="mt-1.5 relative">
                  <input
                    type="text"
                    required
                    placeholder={isOttobon ? 'e.g., Ottobon Academy' : 'e.g., Medcy Multi-Specialty Hospital'}
                    className={`block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                    value={formData.companyName}
                    onChange={e => setFormData({...formData, companyName: e.target.value})}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Must exactly match your street signboard to pass Google Business verification.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Contact Email</label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder={isOttobon ? 'admissions@academy.com' : 'marketing@hospital.com'}
                      className={`block w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                      value={formData.contactEmail}
                      onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    {isOttobon ? 'Admissions Helpline Phone' : 'Appointment Phone Number'}
                  </label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      className={`block w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                      value={formData.contactPhone}
                      onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-300">Website URL</label>
                  <div className="mt-1.5 relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <input
                      type="url"
                      required
                      placeholder="https://www.example.com"
                      className={`block w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                      value={formData.website}
                      onChange={e => setFormData({...formData, website: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Categorization & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <MapPin className={`h-5 w-5 ${accentColor}`} />
                Location & Categorization
              </h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-300">Primary Google Category</label>
                  <select
                    className={`mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 ${focusBorder} text-sm transition-all`}
                    value={formData.primaryCategory}
                    onChange={e => setFormData({...formData, primaryCategory: e.target.value})}
                  >
                    {isOttobon ? (
                      <>
                        <option>Training Institute</option>
                        <option>Junior College</option>
                        <option>Engineering College</option>
                        <option>Coaching Center</option>
                        <option>IAS Academy</option>
                      </>
                    ) : (
                      <>
                        <option>Multi-Specialty Hospital</option>
                        <option>IVF & Fertility Center</option>
                        <option>Maternity Clinic</option>
                        <option>Pediatric Hospital</option>
                        <option>Diagnostic Center</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Target Location / City Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., siripuram, visakhapatnam"
                    className={`mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                    value={formData.serviceArea}
                    onChange={e => setFormData({...formData, serviceArea: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* 3. Specialties / Course Tags */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">
                {isOttobon ? 'Popular Courses & Programs Offered' : 'Popular Specialties Offered'}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Tag className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      isOttobon
                        ? 'e.g., B.Tech CSE, MBA, IIT-JEE Prep, NEET Coaching (Press Enter)'
                        : 'e.g., Laparoscopic Surgery, Pediatrics (Press Enter)'
                    }
                    className={`block w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                    value={currentSpecialty}
                    onChange={e => setCurrentSpecialty(e.target.value)}
                    onKeyDown={e => addTag(e, currentSpecialty, setSpecialties, setCurrentSpecialty)}
                  />
                </div>
                <button
                  type="button"
                  onClick={e => addTag(e, currentSpecialty, setSpecialties, setCurrentSpecialty)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1 border border-slate-700/50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              
              {specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800/80 animate-in fade-in duration-200">
                  {specialties.map(tag => (
                    <span key={tag} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm animate-in scale-in-95 duration-100 ${tagStyle}`}>
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag, setSpecialties)} 
                        className="opacity-75 hover:opacity-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Target Keywords Tags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className="block text-sm font-medium text-slate-300">SEO Target Keywords</label>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">Optional</span>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Tag className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder={
                      isOttobon
                        ? 'e.g., best engineering college, top junior college in Visakhapatnam (Press Enter)'
                        : 'e.g., best hospital near me, top doctor for IVF (Press Enter)'
                    }
                    className={`block w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 ${focusBorder} text-sm transition-all`}
                    value={currentKeyword}
                    onChange={e => setCurrentKeyword(e.target.value)}
                    onKeyDown={e => addTag(e, currentKeyword, setKeywords, setCurrentKeyword)}
                  />
                </div>
                <button
                  type="button"
                  onClick={e => addTag(e, currentKeyword, setKeywords, setCurrentKeyword)}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-1 border border-slate-700/50 cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>
              
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800/80 animate-in fade-in duration-200">
                  {keywords.map(tag => (
                    <span key={tag} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm animate-in scale-in-95 duration-100 ${tagStyle}`}>
                      {tag}
                      <button 
                        type="button" 
                        onClick={() => removeTag(tag, setKeywords)} 
                        className="opacity-75 hover:opacity-100 rounded-full p-0.5 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Doctors / Faculty Registry */}
            <div className="space-y-4 border-t border-slate-800/80 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className={`h-5 w-5 ${accentColor}`} />
                {businessType === 'education' ? 'Faculty & Instructors Registry' : 'Doctors & Practitioners Registry'}
              </h3>
              <p className="text-xs text-slate-450 leading-relaxed">
                Add profiles of experts, doctors, or teachers who will represent your business. These registry details will be used to automatically draft showcase updates on Google Maps.
              </p>

              {/* Add doctor panel */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-850 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      placeholder={businessType === 'education' ? "e.g., Prof. Rajesh Kumar" : "e.g., Dr. Anjali Sharma"}
                      value={doctorName}
                      onChange={e => setDoctorName(e.target.value)}
                      className={`mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-150 placeholder-slate-500 focus:outline-none transition-all`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Specialty / Qualification</label>
                    <input 
                      type="text" 
                      placeholder={businessType === 'education' ? "e.g., Deep Learning Research Lead" : "e.g., IVF Specialist, MD"}
                      value={doctorSpecialty}
                      onChange={e => setDoctorSpecialty(e.target.value)}
                      className={`mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-xs text-slate-155 placeholder-slate-500 focus:outline-none transition-all`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Brief Biography</label>
                  <textarea 
                    placeholder={businessType === 'education' ? "e.g., 8+ years guiding engineering students in machine learning projects..." : "e.g., 12+ years experience in helping couples achieve parenthood..."}
                    value={doctorBio}
                    onChange={e => setDoctorBio(e.target.value)}
                    rows={2}
                    className={`mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-150 placeholder-slate-500 focus:outline-none transition-all resize-none`}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (doctorName.trim() && doctorSpecialty.trim()) {
                      setDoctorsList([...doctorsList, {
                        name: doctorName.trim(),
                        specialty: doctorSpecialty.trim(),
                        bio: doctorBio.trim()
                      }]);
                      setDoctorName('');
                      setDoctorSpecialty('');
                      setDoctorBio('');
                    }
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700/50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {businessType === 'education' ? 'Add Faculty Member' : 'Add Medical Doctor'}
                </button>
              </div>

              {/* Display list */}
              {doctorsList.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {doctorsList.map((doc, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/30 border border-slate-850 rounded-xl space-y-1 relative group animate-in fade-in duration-200">
                      <button 
                        type="button"
                        onClick={() => setDoctorsList(doctorsList.filter((_, i) => i !== idx))}
                        className="absolute top-2 right-2 text-slate-500 hover:text-white transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <h5 className="text-xs font-bold text-white pr-4">{doc.name}</h5>
                      <p className="text-[10px] font-bold text-indigo-400">{doc.specialty}</p>
                      {doc.bio && <p className="text-[10px] text-slate-400 leading-relaxed italic">"{doc.bio}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Creative Assets Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
                <UploadCloud className={`h-5 w-5 ${accentColor}`} />
                Creative & Media Assets
              </h3>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Brand Logo */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {isOttobon ? 'Academy Logo' : 'Clinic Logo'}
                  </label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className={`mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-750 bg-slate-950 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all ${logoPreview ? 'border-solid border-slate-800' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={logoInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleLogoChange}
                    />
                    {logoPreview ? (
                      <div className="relative w-full aspect-video flex items-center justify-center bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800">
                        <img src={logoPreview} alt="Logo preview" className="max-h-full max-w-full object-contain" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoFile(null);
                            setLogoPreview('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-850"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-500 mb-2 group-hover:scale-105 transition-transform" />
                        <p className="text-xs text-slate-300 font-medium">Click to upload brand logo</p>
                        <p className="text-[10px] text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Facade Image */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {isOttobon ? 'Campus Facade Photo' : 'Hospital Facade Photo'}
                  </label>
                  <div 
                    onClick={() => buildingInputRef.current?.click()}
                    className={`mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-750 bg-slate-950 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all ${buildingPreview ? 'border-solid border-slate-800' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={buildingInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleBuildingChange}
                    />
                    {buildingPreview ? (
                      <div className="relative w-full aspect-video flex items-center justify-center bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800">
                        <img src={buildingPreview} alt="Facade preview" className="max-h-full max-w-full object-contain" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBuildingFile(null);
                            setBuildingPreview('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-850"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-8 w-8 text-slate-500 mb-2 group-hover:scale-105 transition-transform" />
                        <p className="text-xs text-slate-300 font-medium">Upload exterior facade photo</p>
                        <p className="text-[10px] text-slate-500 mt-1">Required for Maps listing verification</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Picture: Interior */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {isOttobon ? 'Classroom / Office Photo' : 'Reception / Ward Photo'}
                  </label>
                  <div 
                    onClick={() => interiorInputRef.current?.click()}
                    className={`mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-750 bg-slate-950 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all ${interiorPreview ? 'border-solid border-slate-800' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={interiorInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleInteriorChange}
                    />
                    {interiorPreview ? (
                      <div className="relative w-full aspect-video flex items-center justify-center bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800">
                        <img src={interiorPreview} alt="Interior preview" className="max-h-full max-w-full object-contain" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInteriorFile(null);
                            setInteriorPreview('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-850"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-8 w-8 text-slate-500 mb-2 group-hover:scale-105 transition-transform" />
                        <p className="text-xs text-slate-300 font-medium">Upload interior facility photo</p>
                        <p className="text-[10px] text-slate-500 mt-1">Optional, boosts GMB visibility score</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Additional Picture: Staff */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-300">
                    {isOttobon ? 'Faculty / Team Photo' : 'Doctors / Staff Photo'}
                  </label>
                  <div 
                    onClick={() => staffInputRef.current?.click()}
                    className={`mt-1.5 flex flex-col items-center justify-center border-2 border-dashed border-slate-800 hover:border-slate-750 bg-slate-950 hover:bg-slate-900/60 rounded-2xl p-6 text-center cursor-pointer transition-all ${staffPreview ? 'border-solid border-slate-800' : ''}`}
                  >
                    <input 
                      type="file" 
                      ref={staffInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleStaffChange}
                    />
                    {staffPreview ? (
                      <div className="relative w-full aspect-video flex items-center justify-center bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800">
                        <img src={staffPreview} alt="Staff preview" className="max-h-full max-w-full object-contain" />
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStaffFile(null);
                            setStaffPreview('');
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-slate-950/80 hover:bg-slate-950 text-slate-400 hover:text-white rounded-full transition-colors border border-slate-850"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <FileImage className="h-8 w-8 text-slate-500 mb-2 group-hover:scale-105 transition-transform" />
                        <p className="text-xs text-slate-300 font-medium">Upload team/staff photo</p>
                        <p className="text-[10px] text-slate-500 mt-1">Optional, builds trust with local searches</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Google Business Profile Link Checkbox */}
            <div className="space-y-4 border-t border-slate-800/80 pt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="has-gbp"
                    type="checkbox"
                    checked={hasGBP}
                    onChange={(e) => setHasGBP(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="has-gbp" className="font-semibold text-slate-200 cursor-pointer">
                    We already have a Google Business Profile (GBP) listing
                  </label>
                  <p className="text-xs text-slate-400">
                    Keep this checked to link your existing Google listing. Uncheck it if you need to create a new profile from scratch.
                  </p>
                </div>
              </div>

              {!hasGBP && (
                <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-slate-350 space-y-3 mt-4 animate-in fade-in duration-300">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="h-4.5 w-4.5 text-indigo-400" />
                    How to Create Your Google Business Profile
                  </h4>
                  <p className="text-xs leading-relaxed text-slate-450">
                    If you do not have a Google Business listing yet, follow these steps to establish one:
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-xs text-slate-350">
                    <li>Go to the <a href="https://business.google.com/create" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">Google Business Profile setup page</a>.</li>
                    <li>Sign in with your Google Workspace or standard Gmail credentials.</li>
                    <li>Enter the name of your organization (e.g. <b>{formData.companyName || 'Your Business Name'}</b>) and select your primary category.</li>
                    <li>Add your physical storefront address and choose if you serve customers at that location.</li>
                    <li>Add your contact phone number (<b>{formData.contactPhone || 'Your Phone'}</b>) and website URL (<b>{formData.website || 'Your Website'}</b>).</li>
                    <li>Complete verification via phone, email, or video as requested by Google.</li>
                  </ol>
                  <p className="text-[11px] text-amber-400 leading-relaxed font-semibold pt-1">
                    ⚠️ Note: You can submit this onboarding form now! The system will log a "Pending Setup" status so your agency representative can guide you through Google's verification phase.
                  </p>
                </div>
              )}
            </div>

            {/* 7. Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${buttonStyle} px-6 py-4 text-base font-bold text-white shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all cursor-pointer`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Uploading Assets...
                  </>
                ) : (
                  <>
                    Submit Registration
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}

export default function ClientOnboardingForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading onboarding form...</p>
        </div>
      </div>
    }>
      <ClientOnboardingFormContent />
    </Suspense>
  );
}
