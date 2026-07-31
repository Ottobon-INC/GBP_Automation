'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  MessageSquare, 
  MapPin, 
  Calendar, 
  Network, 
  UserCheck, 
  Clock, 
  Send, 
  Star, 
  HelpCircle, 
  ShieldCheck, 
  Check, 
  Plus, 
  Trash2, 
  UploadCloud, 
  FileSpreadsheet, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Phone, 
  Mail, 
  FileText, 
  Zap,
  Globe,
  Lock
} from 'lucide-react';

interface WhatsAppAutomationOnboardingWizardProps {
  brand?: string;
}

interface DepartmentItem {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

interface DoctorItem {
  id: string;
  name: string;
  qualification: string;
  department: string;
  consultationFee: string;
  slotDuration: string;
  dailyCapacity: string;
  availableDays: string[];
  morningStart: string;
  morningEnd: string;
  eveningStart: string;
  eveningEnd: string;
}

const SECTIONS = [
  { id: 1, name: 'Hospital Info', icon: Building2, desc: 'Identity & Address' },
  { id: 2, name: 'Meta & WABA', icon: MessageSquare, desc: 'WhatsApp API Setup' },
  { id: 3, name: 'Google Profile', icon: MapPin, desc: 'GBP Access & Maps' },
  { id: 4, name: 'Appointments', icon: Calendar, desc: 'Prefix & Separator' },
  { id: 5, name: 'Departments', icon: Network, desc: 'Clinical Units' },
  { id: 6, name: 'Doctors', icon: UserCheck, desc: 'Roster & Shifts' },
  { id: 7, name: 'Booking Rules', icon: Clock, desc: 'Cutoff & Advance' },
  { id: 8, name: 'Templates', icon: Send, desc: 'AI Message Scripts' },
  { id: 9, name: 'Review Auto', icon: Star, desc: 'Google Reviews' },
  { id: 10, name: 'Feedback', icon: HelpCircle, desc: 'Standard & Custom' },
  { id: 11, name: 'Authorization', icon: ShieldCheck, desc: 'Legal Checkboxes' },
];

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WhatsAppAutomationOnboardingWizard({ brand = 'medcy' }: WhatsAppAutomationOnboardingWizardProps) {
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Smart Tenant Pre-filling
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // Section 1 – Hospital Information
  const [hospitalName, setHospitalName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [supportEmail, setSupportEmail] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [googleMapsUrl, setGoogleMapsUrl] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [contactPersonDesignation, setContactPersonDesignation] = useState('');
  const [contactPersonMobile, setContactPersonMobile] = useState('');

  // Section 2 – WhatsApp & Meta Business Setup
  const [existingWabaNumber, setExistingWabaNumber] = useState('');
  const [hasMetaBm, setHasMetaBm] = useState<boolean | null>(null);
  const [metaBmId, setMetaBmId] = useState('');
  const [hasWaba, setHasWaba] = useState<boolean | null>(null);
  const [wabaId, setWabaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [useExistingNumberForAuto, setUseExistingNumberForAuto] = useState<boolean | null>(null);
  const [canReceiveOtp, setCanReceiveOtp] = useState<boolean | null>(null);
  const [displayNameVerified, setDisplayNameVerified] = useState<boolean | null>(null);

  // Section 3 – Google Business Profile
  const [hasGbp, setHasGbp] = useState<boolean | null>(null);
  const [gbpUrl, setGbpUrl] = useState('');
  const [gbpMapsUrl, setGbpMapsUrl] = useState('');
  const [isGbpOwner, setIsGbpOwner] = useState<boolean | null>(null);
  const [canGrantManagerAccess, setCanGrantManagerAccess] = useState<boolean | null>(null);
  const [wantUsToCreateGbp, setWantUsToCreateGbp] = useState<boolean | null>(null);

  // Section 4 – Appointment Configuration
  const [appointmentPrefix, setAppointmentPrefix] = useState('AP');
  const [appointmentSeparator, setAppointmentSeparator] = useState('-');
  const [startingSequence, setStartingSequence] = useState('1001');

  // Section 5 – Departments
  const [departments, setDepartments] = useState<DepartmentItem[]>([
    { id: '1', name: 'General Medicine', description: 'Primary care and consultation', active: true },
    { id: '2', name: 'Obstetrics & Gynecology', description: 'Maternity and women healthcare', active: true },
    { id: '3', name: 'Pediatrics', description: 'Child healthcare and vaccinations', active: true }
  ]);
  const [deptCsvFile, setDeptCsvFile] = useState<File | null>(null);

  // Section 6 – Doctor Configuration
  const [doctors, setDoctors] = useState<DoctorItem[]>([
    {
      id: '1',
      name: 'Dr. Anjali Sharma',
      qualification: 'MBBS, MD (OBGYN)',
      department: 'Obstetrics & Gynecology',
      consultationFee: '600',
      slotDuration: '15',
      dailyCapacity: '30',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      morningStart: '09:00',
      morningEnd: '13:00',
      eveningStart: '16:00',
      eveningEnd: '20:00'
    }
  ]);
  const [doctorCsvFile, setDoctorCsvFile] = useState<File | null>(null);

  // Section 7 – Booking Rules
  const [sameDayBookingAllowed, setSameDayBookingAllowed] = useState(true);
  const [bookingCutoffTime, setBookingCutoffTime] = useState('18:00');
  const [maxAdvanceDays, setMaxAdvanceDays] = useState('30');

  // Section 8 – WhatsApp Message Configuration
  const [welcomeMsg, setWelcomeMsg] = useState('Hello {{patient_name}}, welcome to {{hospital_name}}. How can we assist you today? Please reply with 1 for Appointment Booking or 2 for General Enquiries.');
  const [bookingConfMsg, setBookingConfMsg] = useState('Your appointment is confirmed! Booking ID: {{booking_id}}\nDoctor: {{doctor_name}}\nDate & Time: {{slot_time}}\nFee: ₹{{fee}}\nPlease arrive 10 minutes prior.');
  const [reminderMsg, setReminderMsg] = useState('Reminder: You have a scheduled appointment with {{doctor_name}} tomorrow at {{slot_time}}. Reply CONFIRM to confirm or CANCEL to reschedule.');
  const [feedbackMsg, setFeedbackMsg] = useState('Thank you for visiting {{hospital_name}}! We hope you had a comfortable experience. Please take a moment to share your feedback below.');

  // Section 9 – Google Review Automation
  const [enableGoogleReviews, setEnableGoogleReviews] = useState(true);
  const [enableAiDrafts, setEnableAiDrafts] = useState(true);
  const [reviewUrl, setReviewUrl] = useState('');
  const [feedbackDelay, setFeedbackDelay] = useState('2 Hours');

  // Section 10 – Feedback Questions
  const [useStandardQuestions, setUseStandardQuestions] = useState(true);
  const [customQuestions, setCustomQuestions] = useState<string[]>(['How satisfied were you with our admission process?']);

  // Section 11 – Authorization
  const [authAccurate, setAuthAccurate] = useState(false);
  const [authWaba, setAuthWaba] = useState(false);
  const [authGbp, setAuthGbp] = useState(false);
  const [authReviews, setAuthReviews] = useState(false);

  // Fetch existing clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const { data } = await supabase.from('clients').select('*').order('company_name', { ascending: true });
        if (data) setExistingClients(data);
      } catch (e) {
        console.error('Error fetching clients:', e);
      }
    };
    fetchClients();

    // Load draft
    const saved = localStorage.getItem(`medcy_whatsapp_automation_draft`);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.hospitalName) setHospitalName(d.hospitalName);
        if (d.supportEmail) setSupportEmail(d.supportEmail);
        if (d.supportPhone) setSupportPhone(d.supportPhone);
        if (d.hospitalAddress) setHospitalAddress(d.hospitalAddress);
        if (d.googleMapsUrl) setGoogleMapsUrl(d.googleMapsUrl);
        if (d.contactPersonName) setContactPersonName(d.contactPersonName);
        if (d.contactPersonDesignation) setContactPersonDesignation(d.contactPersonDesignation);
        if (d.contactPersonMobile) setContactPersonMobile(d.contactPersonMobile);
        if (d.departments) setDepartments(d.departments);
        if (d.doctors) setDoctors(d.doctors);
        if (d.welcomeMsg) setWelcomeMsg(d.welcomeMsg);
        if (d.bookingConfMsg) setBookingConfMsg(d.bookingConfMsg);
        if (d.reminderMsg) setReminderMsg(d.reminderMsg);
        if (d.feedbackMsg) setFeedbackMsg(d.feedbackMsg);
      } catch (e) {
        console.error('Error loading WhatsApp draft:', e);
      }
    }
  }, []);

  const handleSelectExistingClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = existingClients.find(c => c.id === clientId || c.company_name === clientId);
    if (client) {
      setHospitalName(client.company_name || '');
      setSupportEmail(client.contact_email || '');
      setSupportPhone(client.contact_phone || '');
      setHospitalAddress(client.service_area || '');
      if (client.onboarding_details?.website_data?.googleMapsUrl) {
        setGoogleMapsUrl(client.onboarding_details.website_data.googleMapsUrl);
      }
      alert(`✨ Pre-filled foundational details for "${client.company_name}". You can skip re-typing these!`);
    }
  };

  const saveDraft = () => {
    const data = {
      hospitalName,
      supportEmail,
      supportPhone,
      hospitalAddress,
      googleMapsUrl,
      contactPersonName,
      contactPersonDesignation,
      contactPersonMobile,
      departments,
      doctors,
      welcomeMsg,
      bookingConfMsg,
      reminderMsg,
      feedbackMsg
    };
    localStorage.setItem(`medcy_whatsapp_automation_draft`, JSON.stringify(data));
    alert('✨ WhatsApp automation setup draft saved to browser storage!');
  };

  const validateCurrentSection = () => {
    if (currentSection === 1) {
      if (!hospitalName.trim() || !supportPhone.trim() || !supportEmail.trim()) {
        setErrorMessage('Please fill in Hospital Name, Support Phone, and Support Email.');
        return false;
      }
    }
    if (currentSection === 11) {
      if (!authAccurate || !authWaba || !authGbp || !authReviews) {
        setErrorMessage('You must agree to all mandatory authorization checkboxes before deploying setup.');
        return false;
      }
    }
    setErrorMessage('');
    return true;
  };

  const handleNext = () => {
    if (validateCurrentSection()) {
      setCurrentSection(prev => Math.min(prev + 1, SECTIONS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentSection(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Department Roster Helpers
  const addDepartment = () => {
    setDepartments(prev => [
      ...prev,
      { id: Date.now().toString(), name: 'New Specialty Unit', description: 'Clinical services & diagnostics', active: true }
    ]);
  };
  const updateDepartment = (id: string, field: string, val: any) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };
  const removeDepartment = (id: string) => {
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  // Doctor Roster Helpers
  const addDoctor = () => {
    const defaultDept = departments[0]?.name || 'General Medicine';
    setDoctors(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        name: 'Dr. New Consultant',
        qualification: 'MBBS, MD',
        department: defaultDept,
        consultationFee: '500',
        slotDuration: '15',
        dailyCapacity: '25',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        morningStart: '09:00',
        morningEnd: '13:00',
        eveningStart: '17:00',
        eveningEnd: '20:00'
      }
    ]);
  };
  const updateDoctor = (id: string, field: string, val: any) => {
    setDoctors(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d));
  };
  const removeDoctor = (id: string) => {
    setDoctors(prev => prev.filter(d => d.id !== id));
  };
  const toggleDoctorDay = (id: string, day: string) => {
    setDoctors(prev => prev.map(d => {
      if (d.id !== id) return d;
      const days = d.availableDays.includes(day)
        ? d.availableDays.filter(x => x !== day)
        : [...d.availableDays, day];
      return { ...d, availableDays: days };
    }));
  };

  const handleSubmit = async () => {
    if (!validateCurrentSection()) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        section1_hospitalInfo: {
          hospitalName,
          logoFileName: logoFile ? logoFile.name : null,
          supportEmail,
          supportPhone,
          hospitalAddress,
          googleMapsUrl,
          contactPerson: {
            name: contactPersonName,
            designation: contactPersonDesignation,
            mobile: contactPersonMobile
          }
        },
        section2_metaWabaSetup: {
          existingWabaNumber,
          hasMetaBm,
          metaBmId: hasMetaBm ? metaBmId : null,
          hasWaba,
          wabaId: hasWaba ? wabaId : null,
          phoneNumberId: hasWaba ? phoneNumberId : null,
          useExistingNumberForAuto,
          canReceiveOtp,
          displayNameVerified
        },
        section3_gbpSetup: {
          hasGbp,
          gbpUrl: hasGbp ? gbpUrl : null,
          gbpMapsUrl: hasGbp ? gbpMapsUrl : null,
          isGbpOwner,
          canGrantManagerAccess,
          wantUsToCreateGbp: hasGbp === false ? wantUsToCreateGbp : null
        },
        section4_appointmentConfig: {
          appointmentPrefix,
          appointmentSeparator,
          startingSequence,
          exampleId: `${appointmentPrefix}${appointmentSeparator}${startingSequence}`
        },
        section5_departments: {
          items: departments,
          uploadedCsvFile: deptCsvFile ? deptCsvFile.name : null
        },
        section6_doctors: {
          items: doctors,
          uploadedExcelFile: doctorCsvFile ? doctorCsvFile.name : null
        },
        section7_bookingRules: {
          sameDayBookingAllowed,
          bookingCutoffTime,
          maxAdvanceDays
        },
        section8_messageTemplates: {
          welcomeMsg,
          bookingConfMsg,
          reminderMsg,
          feedbackMsg
        },
        section9_reviewAutomation: {
          enableGoogleReviews,
          enableAiDrafts: enableGoogleReviews ? enableAiDrafts : null,
          reviewUrl: enableGoogleReviews ? reviewUrl : null,
          feedbackDelay: enableGoogleReviews ? feedbackDelay : null
        },
        section10_feedbackQuestions: {
          useStandardQuestions,
          standardQuestions: ['Overall experience', 'Doctor consultation', 'Staff behaviour', 'Clinic cleanliness', 'Suggestions'],
          customQuestions: useStandardQuestions ? null : customQuestions
        },
        section11_authorization: {
          authAccurate,
          authWaba,
          authGbp,
          authReviews,
          authorizedAt: new Date().toISOString()
        }
      };

      // Check if we should update an existing client or insert a new one
      const existingMatch = existingClients.find(
        c => c.id === selectedClientId || 
             c.company_name?.toLowerCase() === hospitalName.trim().toLowerCase()
      );

      let dbError = null;
      let newClientId = existingMatch ? existingMatch.id : null;

      if (existingMatch && existingMatch.id) {
        // UPDATE existing record to avoid duplicate rows!
        const existingDetails = existingMatch.onboarding_details || {};
        const updatedDetails = {
          ...existingDetails,
          business_type: 'healthcare',
          completed_step: 'whatsapp_automation_onboarding',
          whatsapp_automation_setup: payload
        };

        const { error } = await supabase
          .from('clients')
          .update({
            company_name: hospitalName,
            contact_email: supportEmail,
            contact_phone: supportPhone,
            service_area: hospitalAddress || existingMatch.service_area || 'Global',
            onboarding_details: updatedDetails
          })
          .eq('id', existingMatch.id);

        dbError = error;
      } else {
        const { data, error } = await supabase
          .from('clients')
          .insert([
            {
              company_name: hospitalName,
              contact_email: supportEmail,
              contact_phone: supportPhone,
              primary_category: 'Multi-Specialty Hospital',
              service_area: hospitalAddress || 'Global',
              onboarding_details: {
                business_type: 'healthcare',
                completed_step: 'whatsapp_automation_onboarding',
                whatsapp_automation_setup: payload
              }
            }
          ])
          .select()
          .single();
        dbError = error;
        if (data) newClientId = data.id;
      }

      if (dbError) {
        console.warn('Supabase note:', dbError.message);
      }

      // --- NEW: INSERT INTO whatsapp_automation_intakes TABLE ---
      if (newClientId) {
        const { error: waError } = await supabase
          .from('whatsapp_automation_intakes')
          .insert({
            client_id: newClientId,
            form_data: payload,
            status: 'new'
          });
        
        if (waError) {
          console.error("Failed to insert into whatsapp_automation_intakes:", waError);
        }
      }
      // ----------------------------------------------------------

      localStorage.removeItem(`medcy_whatsapp_automation_draft`);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(`Submission failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadConfigBackup = () => {
    const payload = {
      hospitalName,
      supportEmail,
      supportPhone,
      departments,
      doctors,
      appointmentExample: `${appointmentPrefix}${appointmentSeparator}${startingSequence}`,
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${hospitalName.toLowerCase().replace(/\s+/g, '_')}_whatsapp_automation_setup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // SUCCESS SCREEN
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 text-center shadow-xl space-y-8">
            <div className="h-24 w-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-md animate-bounce">
              <CheckCircle2 className="h-12 w-12 stroke-[2.5]" />
            </div>

            <div className="space-y-3">
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase tracking-wider border border-emerald-300">
                ✨ WhatsApp Automation Deployed
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                AI Chatbot & Meta Setup Received!
              </h2>
              <p className="text-sm font-semibold text-slate-600 max-w-lg mx-auto leading-relaxed">
                Thank you, <span className="text-indigo-600 font-bold">{contactPersonName || 'Administrator'}</span>! Your comprehensive 11-section automation specifications for <span className="text-slate-900 font-bold">{hospitalName}</span> have been safely recorded without duplicate database entries.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" /> Deployment Summary
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">CLINIC / HOSPITAL</span>
                  {hospitalName}
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">APPOINTMENT FORMAT</span>
                  <span className="font-mono bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-black">{appointmentPrefix}{appointmentSeparator}{startingSequence}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">DEPARTMENTS CONFIGURED</span>
                  {departments.length} Clinical Units
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold">DOCTOR ROSTER</span>
                  {doctors.length} Doctors Configured
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={downloadConfigBackup}
                className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="h-4 w-4" /> Download Config Backup (.json)
              </button>
              <a
                href={`/${brand}/onboarding`}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-sm rounded-2xl border border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                Back to Portal Home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center p-3 text-white shadow-md shrink-0">
              <Zap className="h-7 w-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-black text-[10px] tracking-wider uppercase border border-emerald-300">
                  Medcy WhatsApp Automation
                </span>
                <span className="text-xs font-semibold text-slate-400">11-Step Setup</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                AI Chatbot & Meta Business Portal
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={saveDraft}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="h-4 w-4 text-slate-500" /> Save Draft
            </button>
            <a
              href={`/${brand}/onboarding`}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-600 font-bold text-xs border border-red-200 transition-colors flex items-center gap-1.5"
            >
              Exit
            </a>
          </div>
        </div>

        {/* Stepper Pill Bar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max px-2">
            {SECTIONS.map((sec, idx) => {
              const StepIcon = sec.icon;
              const isActive = sec.id === currentSection;
              const isDone = sec.id < currentSection;

              return (
                <React.Fragment key={sec.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (sec.id < currentSection || validateCurrentSection()) {
                        setCurrentSection(sec.id);
                      }
                    }}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <div className={`p-1.5 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-white/10 text-white' : isDone ? 'bg-emerald-600 text-white' : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      {isDone ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : <StepIcon className="h-3.5 w-3.5" />}
                    </div>
                    <div className="text-left">
                      <p className={`text-xs font-black leading-none ${isActive ? 'text-white' : isDone ? 'text-emerald-900' : 'text-slate-700'}`}>
                        {sec.id}. {sec.name}
                      </p>
                    </div>
                  </button>
                  {idx < SECTIONS.length - 1 && (
                    <div className={`h-0.5 w-4 shrink-0 rounded-full ${sec.id < currentSection ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs sm:text-sm font-extrabold text-red-700 flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Card Content Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-md min-h-[500px] flex flex-col justify-between">
          
          {/* SECTION 1: HOSPITAL INFORMATION */}
          {currentSection === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                  Section 1: Hospital Information
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Collect foundational identity, support channels, and primary administrator contact information.
                </p>
              </div>

              {/* Smart Tenant Profile Selector Banner */}
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-indigo-950 font-black text-xs sm:text-sm">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0 animate-pulse" />
                    <span>Already registered your Clinic or Hospital in Medcy?</span>
                  </div>
                  {selectedClientId && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      ✨ Linked to Backend Profile
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Select your existing clinic profile below to automatically pre-fill your business name, contact phone, email, and address. This prevents duplicate database records!
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleSelectExistingClient(e.target.value)}
                    className="w-full bg-white border border-indigo-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 shadow-2xs cursor-pointer"
                  >
                    <option value="">-- Select Existing Clinic / Hospital Profile (Optional) --</option>
                    {existingClients.map((c, i) => (
                      <option key={c.id || i} value={c.id || c.company_name}>
                        {c.company_name} ({c.contact_email || 'No email'}) • {c.primary_category || 'Healthcare'}
                      </option>
                    ))}
                  </select>
                  {selectedClientId && (
                    <button
                      type="button"
                      onClick={() => { setSelectedClientId(''); setHospitalName(''); setSupportEmail(''); setSupportPhone(''); setHospitalAddress(''); }}
                      className="px-3.5 py-2.5 bg-white hover:bg-red-50 text-red-600 text-xs font-black rounded-xl border border-red-200 transition-colors shrink-0 cursor-pointer"
                    >
                      Clear & New
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Hospital / Clinic Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Apollo Multi-Specialty Hospital"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Support Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={supportPhone}
                      onChange={(e) => setSupportPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Support Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="support@medcy.health"
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Hospital Physical Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Full street address, building number, city, state, and postal code..."
                    value={hospitalAddress}
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Google Maps Location URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="url"
                      placeholder="https://maps.google.com/?q=..."
                      value={googleMapsUrl}
                      onChange={(e) => setGoogleMapsUrl(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Hospital Logo (File Upload)
                  </label>
                  <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                    <UploadCloud className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">Drag and drop official logo image or click to browse</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files ? e.target.files[0] : null)}
                      className="mt-2 text-xs text-slate-500 mx-auto block cursor-pointer"
                    />
                    {logoFile && <p className="text-[11px] font-black text-emerald-600 mt-1">✅ Selected: {logoFile.name}</p>}
                  </div>
                </div>

                <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider mb-3">Primary Contact Person (Administrator)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Contact Person Name</label>
                      <input
                        type="text"
                        placeholder="Dr. Rajesh Kumar"
                        value={contactPersonName}
                        onChange={(e) => setContactPersonName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Designation</label>
                      <input
                        type="text"
                        placeholder="Medical Director / CEO"
                        value={contactPersonDesignation}
                        onChange={(e) => setContactPersonDesignation(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 00000"
                        value={contactPersonMobile}
                        onChange={(e) => setContactPersonMobile(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: WHATSAPP & META BUSINESS SETUP */}
          {currentSection === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <MessageSquare className="h-6 w-6 text-emerald-600" />
                  Section 2: WhatsApp & Meta Business Setup
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Configure existing WhatsApp Business phone numbers and Meta Business Manager integration credentials.
                </p>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700">Existing WhatsApp Business Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={existingWabaNumber}
                    onChange={(e) => setExistingWabaNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:border-indigo-600"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Do you already have a Meta Business Manager account?</h4>
                      <p className="text-xs font-semibold text-slate-500">Required for WhatsApp Cloud API verification and template approvals.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHasMetaBm(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${hasMetaBm === true ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHasMetaBm(false); setMetaBmId(''); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${hasMetaBm === false ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasMetaBm === true && (
                    <div className="pt-2 animate-in fade-in duration-200">
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">Meta Business Manager ID</label>
                      <input
                        type="text"
                        placeholder="e.g., 1029384756102938"
                        value={metaBmId}
                        onChange={(e) => setMetaBmId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                  )}

                  {hasMetaBm === false && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 text-xs font-bold text-indigo-900 flex items-center gap-2.5 animate-in fade-in">
                      <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>Don't worry! Our technical onboarding team will assist you with setting up and verifying your Meta Business Manager account.</span>
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900">Do you already have a WhatsApp Business Account (WABA)?</h4>
                      <p className="text-xs font-semibold text-slate-500">Official Cloud API account ID for automated hospital chatbot routing.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setHasWaba(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${hasWaba === true ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => { setHasWaba(false); setWabaId(''); setPhoneNumberId(''); }}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${hasWaba === false ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {hasWaba === true && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-in fade-in duration-200">
                      <div>
                        <label className="text-xs font-extrabold text-slate-700 block mb-1">WABA ID</label>
                        <input
                          type="text"
                          placeholder="e.g., 9988776655443322"
                          value={wabaId}
                          onChange={(e) => setWabaId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-extrabold text-slate-700 block mb-1">Phone Number ID</label>
                        <input
                          type="text"
                          placeholder="e.g., 1122334455667788"
                          value={phoneNumberId}
                          onChange={(e) => setPhoneNumberId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-600"
                        />
                      </div>

                      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-extrabold text-slate-700 block mb-1.5">Use existing number for auto?</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setUseExistingNumberForAuto(true)} className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer ${useExistingNumberForAuto === true ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Yes</button>
                            <button type="button" onClick={() => setUseExistingNumberForAuto(false)} className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer ${useExistingNumberForAuto === false ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>No</button>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-extrabold text-slate-700 block mb-1.5">Can receive OTP during setup?</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setCanReceiveOtp(true)} className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer ${canReceiveOtp === true ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Yes</button>
                            <button type="button" onClick={() => setCanReceiveOtp(false)} className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer ${canReceiveOtp === false ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>No</button>
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-extrabold text-slate-700 block mb-1.5">Display Name Verified?</span>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => setDisplayNameVerified(true)} className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer ${displayNameVerified === true ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Yes</button>
                            <button type="button" onClick={() => setDisplayNameVerified(false)} className={`px-3 py-1 rounded text-[10px] font-black cursor-pointer ${displayNameVerified === false ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>No</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {hasWaba === false && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs font-bold text-emerald-900 flex items-center gap-2.5 animate-in fade-in">
                      <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Our team will provision a verified WhatsApp Business Cloud API account linked directly to your clinic environment.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: GOOGLE BUSINESS PROFILE */}
          {currentSection === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <MapPin className="h-6 w-6 text-indigo-600" />
                  Section 3: Google Business Profile
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Connect your Google Business Profile to enable automated patient review requests and local SEO optimization.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Do you already have a verified Google Business Profile?</h4>
                    <p className="text-xs font-semibold text-slate-500">Required for automated Google 5-Star Review collection after consultations.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setHasGbp(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${hasGbp === true ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => { setHasGbp(false); setGbpUrl(''); setGbpMapsUrl(''); }}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${hasGbp === false ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {hasGbp === true && (
                  <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in duration-200">
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">Google Business Profile URL</label>
                      <input
                        type="url"
                        placeholder="https://business.google.com/..."
                        value={gbpUrl}
                        onChange={(e) => setGbpUrl(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">Google Maps URL</label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/?cid=..."
                        value={gbpMapsUrl}
                        onChange={(e) => setGbpMapsUrl(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700">Are you the owner of the profile?</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setIsGbpOwner(true)} className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${isGbpOwner === true ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Yes</button>
                          <button type="button" onClick={() => setIsGbpOwner(false)} className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${isGbpOwner === false ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>No</button>
                        </div>
                      </div>
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700">Can grant us Manager access?</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setCanGrantManagerAccess(true)} className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${canGrantManagerAccess === true ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Yes</button>
                          <button type="button" onClick={() => setCanGrantManagerAccess(false)} className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${canGrantManagerAccess === false ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>No</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {hasGbp === false && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-950">Would you like us to create and verify your Google Business Profile?</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setWantUsToCreateGbp(true)} className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${wantUsToCreateGbp === true ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-indigo-300'}`}>Yes</button>
                        <button type="button" onClick={() => setWantUsToCreateGbp(false)} className={`px-3 py-1 rounded text-xs font-black cursor-pointer ${wantUsToCreateGbp === false ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-indigo-300'}`}>No</button>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600">This section will later enable Google Review automation and AI-driven reputation management.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: APPOINTMENT CONFIGURATION */}
          {currentSection === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  Section 4: Appointment Configuration
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Define the sequential ticket numbering format for WhatsApp appointment confirmations and OP slips.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Appointment Prefix</label>
                  <input
                    type="text"
                    placeholder="AP"
                    value={appointmentPrefix}
                    onChange={(e) => setAppointmentPrefix(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Separator</label>
                  <input
                    type="text"
                    placeholder="-"
                    value={appointmentSeparator}
                    onChange={(e) => setAppointmentSeparator(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 block mb-1">Starting Sequence Number</label>
                  <input
                    type="number"
                    placeholder="1001"
                    value={startingSequence}
                    onChange={(e) => setStartingSequence(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-600"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 block mb-1">Dynamic Live Preview</span>
                  <h4 className="text-lg font-bold">Patient WhatsApp Confirmation Ticket</h4>
                </div>
                <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl font-mono text-2xl font-black text-emerald-400 tracking-wider shadow-inner">
                  {appointmentPrefix}{appointmentSeparator}{startingSequence}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: DEPARTMENTS */}
          {currentSection === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                    <Network className="h-6 w-6 text-indigo-600" />
                    Section 5: Departments
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Configure clinical departments or upload a CSV spreadsheet for hospitals with many specialty units.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addDepartment}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Department
                </button>
              </div>

              {/* CSV Upload Alternative */}
              <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-indigo-950 block">Have 10+ Departments? Upload CSV Spreadsheet</span>
                    <span className="text-[11px] font-semibold text-slate-600">Columns required: Department Name, Description, Status (Active/Inactive)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => setDeptCsvFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                  />
                  {deptCsvFile && <span className="text-xs font-bold text-emerald-700">✅ {deptCsvFile.name}</span>}
                </div>
              </div>

              {/* Repeatable Department Cards */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {departments.map((dept, i) => (
                  <div key={dept.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <span className="h-7 w-7 rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <input
                          type="text"
                          value={dept.name}
                          onChange={(e) => updateDepartment(dept.id, 'name', e.target.value)}
                          placeholder="Department Name"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:border-indigo-600"
                        />
                        <input
                          type="text"
                          value={dept.description}
                          onChange={(e) => updateDepartment(dept.id, 'description', e.target.value)}
                          placeholder="Short Description"
                          className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => updateDepartment(dept.id, 'active', !dept.active)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors cursor-pointer ${
                          dept.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {dept.active ? '● Active' : '○ Inactive'}
                      </button>
                      {departments.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeDepartment(dept.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 6: DOCTOR CONFIGURATION */}
          {currentSection === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                    <UserCheck className="h-6 w-6 text-indigo-600" />
                    Section 6: Doctor Configuration
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Assign consultation fees, shift timings, and slot capacities, or upload an Excel roster.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addDoctor}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 self-start cursor-pointer"
                >
                  <Plus className="h-4 w-4" /> Add Doctor
                </button>
              </div>

              {/* Excel Upload Alternative */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs font-black text-emerald-950 block">Have 5+ Doctors? Upload Excel Roster</span>
                    <span className="text-[11px] font-semibold text-slate-600">Columns: Name, Qualification, Dept, Fee, Slot Duration, Capacity, Days, Shifts</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={(e) => setDoctorCsvFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                  {doctorCsvFile && <span className="text-xs font-bold text-emerald-700">✅ {doctorCsvFile.name}</span>}
                </div>
              </div>

              {/* Repeatable Doctor Cards */}
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {doctors.map((doc, i) => (
                  <div key={doc.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                      <span className="text-xs font-black text-indigo-900 bg-indigo-100 px-2.5 py-1 rounded-md">
                        Doctor #{i + 1}
                      </span>
                      {doctors.length > 1 && (
                        <button type="button" onClick={() => removeDoctor(doc.id)} className="text-red-500 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Doctor Name</label>
                        <input
                          type="text"
                          value={doc.name}
                          onChange={(e) => updateDoctor(doc.id, 'name', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Qualification</label>
                        <input
                          type="text"
                          value={doc.qualification}
                          onChange={(e) => updateDoctor(doc.id, 'qualification', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Department</label>
                        <select
                          value={doc.department}
                          onChange={(e) => updateDoctor(doc.id, 'department', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 cursor-pointer"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.name}>{d.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Consultation Fee (₹)</label>
                        <input
                          type="number"
                          value={doc.consultationFee}
                          onChange={(e) => updateDoctor(doc.id, 'consultationFee', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Slot Duration (Mins)</label>
                        <select
                          value={doc.slotDuration}
                          onChange={(e) => updateDoctor(doc.id, 'slotDuration', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-600 cursor-pointer"
                        >
                          <option value="10">10 Mins</option>
                          <option value="15">15 Mins</option>
                          <option value="20">20 Mins</option>
                          <option value="30">30 Mins</option>
                          <option value="60">60 Mins</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Daily Capacity (Slots)</label>
                        <input
                          type="number"
                          value={doc.dailyCapacity}
                          onChange={(e) => updateDoctor(doc.id, 'dailyCapacity', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1.5">Available Consultation Days</label>
                      <div className="flex flex-wrap gap-1.5">
                        {WORKING_DAYS.map(day => {
                          const isSelected = doc.availableDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => toggleDoctorDay(doc.id, day)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                isSelected ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {day.slice(0, 3)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Morning Start</span>
                        <input type="time" value={doc.morningStart} onChange={(e) => updateDoctor(doc.id, 'morningStart', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Morning End</span>
                        <input type="time" value={doc.morningEnd} onChange={(e) => updateDoctor(doc.id, 'morningEnd', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Evening Start</span>
                        <input type="time" value={doc.eveningStart} onChange={(e) => updateDoctor(doc.id, 'eveningStart', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Evening End</span>
                        <input type="time" value={doc.eveningEnd} onChange={(e) => updateDoctor(doc.id, 'eveningEnd', e.target.value)} className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 7: BOOKING RULES */}
          {currentSection === 7 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Clock className="h-6 w-6 text-indigo-600" />
                  Section 7: Booking Rules
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Configure operational constraints for automated WhatsApp scheduling and appointment cutoffs.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Same-Day Booking Allowed?</h4>
                    <p className="text-xs font-semibold text-slate-500">Allow patients to schedule appointments on the current day if slots remain open.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setSameDayBookingAllowed(true)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${sameDayBookingAllowed ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}>Yes</button>
                    <button type="button" onClick={() => setSameDayBookingAllowed(false)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${!sameDayBookingAllowed ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}>No</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Booking Cutoff Time (Daily)</label>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">Time after which new bookings for today are disabled.</p>
                    <input
                      type="time"
                      value={bookingCutoffTime}
                      onChange={(e) => setBookingCutoffTime(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 block mb-1">Maximum Advance Booking Days</label>
                    <p className="text-[11px] font-semibold text-slate-500 mb-2">How many days into the future can patients book slots?</p>
                    <input
                      type="number"
                      value={maxAdvanceDays}
                      onChange={(e) => setMaxAdvanceDays(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 8: WHATSAPP MESSAGE CONFIGURATION */}
          {currentSection === 8 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Send className="h-6 w-6 text-emerald-600" />
                  Section 8: WhatsApp Message Configuration
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Customize automated response templates sent by your Medcy AI chatbot. Use variables like <span className="font-mono bg-slate-100 px-1 rounded text-indigo-700 font-bold">{`{{patient_name}}`}</span>.
                </p>
              </div>

              <div className="space-y-5 max-h-[440px] overflow-y-auto pr-1">
                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">1. Welcome Message Template</label>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Sent when a patient initiates a new chat conversation with your hospital number.</p>
                  <textarea
                    rows={3}
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">2. Booking Confirmation Template</label>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Sent immediately upon successful scheduling of a consultation slot.</p>
                  <textarea
                    rows={4}
                    value={bookingConfMsg}
                    onChange={(e) => setBookingConfMsg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">3. Appointment Reminder Template</label>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Sent 24 hours prior to the scheduled consultation time.</p>
                  <textarea
                    rows={3}
                    value={reminderMsg}
                    onChange={(e) => setReminderMsg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-800 block mb-1">4. Feedback Request Template</label>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">Sent automatically after the consultation ends to collect ratings and Google reviews.</p>
                  <textarea
                    rows={3}
                    value={feedbackMsg}
                    onChange={(e) => setFeedbackMsg(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono font-semibold text-slate-900 focus:bg-white focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 9: GOOGLE REVIEW AUTOMATION */}
          {currentSection === 9 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Star className="h-6 w-6 text-amber-500" />
                  Section 9: Google Review Automation
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Configure automated 5-star review collection via WhatsApp after doctor consultations.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Enable Google Review Automation?</h4>
                    <p className="text-xs font-semibold text-slate-500">Automatically invite satisfied patients to leave a Google review after appointment completion.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setEnableGoogleReviews(true)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${enableGoogleReviews ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}>Yes</button>
                    <button type="button" onClick={() => setEnableGoogleReviews(false)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${!enableGoogleReviews ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}>No</button>
                  </div>
                </div>

                {enableGoogleReviews && (
                  <div className="space-y-5 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 block">Enable AI Generated Review Drafts?</span>
                        <span className="text-[11px] font-semibold text-slate-500">Provides patients with personalized 1-click AI review text suggestions.</span>
                      </div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setEnableAiDrafts(true)} className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer ${enableAiDrafts ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>Yes</button>
                        <button type="button" onClick={() => setEnableAiDrafts(false)} className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer ${!enableAiDrafts ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>No</button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-1">Google Review Direct URL</label>
                      <input
                        type="url"
                        placeholder="https://g.page/r/....../review"
                        value={reviewUrl}
                        onChange={(e) => setReviewUrl(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 focus:border-amber-600"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-700 block mb-2">When should feedback be sent after consultation?</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {['Immediately', '2 Hours', '6 Hours', '24 Hours'].map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setFeedbackDelay(time)}
                            className={`py-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                              feedbackDelay === time
                                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!enableGoogleReviews && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs font-bold text-amber-900 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Google Review automation is currently disabled. All review invitation questions and AI triggers are hidden.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 10: FEEDBACK QUESTIONS */}
          {currentSection === 10 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <HelpCircle className="h-6 w-6 text-indigo-600" />
                  Section 10: Feedback Questions
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Configure post-consultation evaluation criteria collected via interactive WhatsApp list messages.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Use Standard Feedback Questions?</h4>
                    <p className="text-xs font-semibold text-slate-500">We provide 5 clinical quality metrics optimized for hospital patient satisfaction.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setUseStandardQuestions(true)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${useStandardQuestions ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}>Yes</button>
                    <button type="button" onClick={() => setUseStandardQuestions(false)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${!useStandardQuestions ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 border border-slate-300'}`}>No</button>
                  </div>
                </div>

                {useStandardQuestions && (
                  <div className="space-y-3 pt-3 border-t border-slate-200 animate-in fade-in">
                    <span className="text-xs font-extrabold text-slate-700 block">Standard Hospital Evaluation Criteria (Informational):</span>
                    <div className="flex flex-wrap gap-2">
                      {['⭐ Overall experience', '👨‍⚕️ Doctor consultation', '🤝 Staff behaviour', '🧹 Clinic cleanliness', '💡 Suggestions'].map((q, idx) => (
                        <span key={idx} className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-900 font-extrabold text-xs border border-emerald-300/80 shadow-2xs flex items-center gap-1.5">
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!useStandardQuestions && (
                  <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-700">Custom Feedback Question List:</span>
                      <button
                        type="button"
                        onClick={() => setCustomQuestions(prev => [...prev, 'New Evaluation Question?'])}
                        className="px-3 py-1 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3 w-3" /> Add Question
                      </button>
                    </div>
                    {customQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded bg-slate-200 text-slate-700 text-xs font-black flex items-center justify-center shrink-0">#{idx + 1}</span>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => {
                            const updated = [...customQuestions];
                            updated[idx] = e.target.value;
                            setCustomQuestions(updated);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600"
                        />
                        {customQuestions.length > 1 && (
                          <button type="button" onClick={() => setCustomQuestions(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 11: AUTHORIZATION & FINAL SUBMISSION */}
          {currentSection === 11 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                  Section 11: Authorization & Legal Consent
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Please review and authorize the following declarations before deploying your automated WhatsApp ecosystem.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={authAccurate}
                    onChange={(e) => setAuthAccurate(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-relaxed">
                    I confirm that the hospital, department, doctor, and contact information provided in this onboarding specification is accurate and complete. <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={authWaba}
                    onChange={(e) => setAuthWaba(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-relaxed">
                    I hereby authorize Medcy Health Tech to configure, register, and provision WhatsApp Business Cloud API and Meta Business Manager integrations on behalf of our hospital. <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={authGbp}
                    onChange={(e) => setAuthGbp(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-relaxed">
                    I authorize Medcy Health Tech to optimize, manage, or create our Google Business Profile for local reputation management and appointment routing. <span className="text-red-500">*</span>
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    checked={authReviews}
                    onChange={(e) => setAuthReviews(e.target.checked)}
                    className="mt-1 h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 leading-relaxed">
                    I authorize automated post-consultation WhatsApp review invitations and AI-generated Google Review draft suggestions for our patients. <span className="text-red-500">*</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-8">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentSection === 1 || isSubmitting}
              className={`px-5 py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 ${
                currentSection === 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs cursor-pointer'
              }`}
            >
              <ArrowLeft className="h-4 w-4" /> Previous Section
            </button>

            {currentSection < SECTIONS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                Next Section <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-black text-sm transition-all shadow-lg flex items-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Deploying WhatsApp Automation...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-white" /> Authorize & Deploy Setup
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
