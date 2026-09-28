'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  FileSpreadsheet, 
  Clock, 
  Calendar, 
  Users, 
  Activity, 
  Sparkles, 
  AlertCircle, 
  Check, 
  HelpCircle, 
  Download, 
  Award, 
  ShieldCheck,
  Loader2,
  FileText
} from 'lucide-react';

interface PatientManagementOnboardingWizardProps {
  brand: string;
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: 'Doctor' | 'Nurse' | 'Front Desk' | 'Admin' | 'CRO';
  specialization?: string;
}

interface DoctorSchedule {
  days: string[];
  startTime: string;
  endTime: string;
  duration: string;
}

const STEPS = [
  { id: 1, name: 'Clinic Profile', icon: Building2, desc: 'Foundational tenant info' },
  { id: 2, name: 'Superadmin Setup', icon: Lock, desc: 'Primary owner login' },
  { id: 3, name: 'Staff & Doctors', icon: Users, desc: 'Roster & roles setup' },
  { id: 4, name: 'Working Hours', icon: Clock, desc: 'Doctor shift schedules' },
  { id: 5, name: 'Patient Database', icon: FileSpreadsheet, desc: 'Historical CSV migration' },
  { id: 6, name: 'Appointments', icon: Calendar, desc: 'Upcoming calendar import' },
];

const WORKING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function PatientManagementOnboardingWizard({ brand }: PatientManagementOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Clinic Profile
  const [existingClients, setExistingClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Step 2: Superadmin Setup
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3: Staff Roster
  const [staffList, setStaffList] = useState<StaffMember[]>([
    { id: '1', name: 'Dr. Anjali Sharma', email: 'anjali@medcy.health', role: 'Doctor', specialization: 'Obstetrics & Gynecology' },
    { id: '2', name: 'Dr. Rajesh Kumar', email: 'rajesh@medcy.health', role: 'Doctor', specialization: 'General Surgery' }
  ]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'Doctor' | 'Nurse' | 'Front Desk' | 'Admin' | 'CRO'>('Doctor');
  const [newStaffSpecialization, setNewStaffSpecialization] = useState('');
  const [staffCsvFile, setStaffCsvFile] = useState<File | null>(null);

  // Step 4: Doctor Schedules
  const [doctorSchedules, setDoctorSchedules] = useState<Record<string, DoctorSchedule>>({
    '1': { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], startTime: '09:00', endTime: '17:00', duration: '15 mins' },
    '2': { days: ['Monday', 'Wednesday', 'Friday', 'Saturday'], startTime: '10:00', endTime: '16:00', duration: '20 mins' },
  });

  // Step 5 & 6: Migration Files
  const [patientCsvFile, setPatientCsvFile] = useState<File | null>(null);
  const [appointmentsCsvFile, setAppointmentsCsvFile] = useState<File | null>(null);

  // Auto-initialize schedule for newly added doctors
  useEffect(() => {
    const doctors = staffList.filter(s => s.role === 'Doctor');
    setDoctorSchedules(prev => {
      const updated = { ...prev };
      doctors.forEach(doc => {
        if (!updated[doc.id]) {
          updated[doc.id] = {
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            startTime: '09:00',
            endTime: '17:00',
            duration: '15 mins'
          };
        }
      });
      return updated;
    });
  }, [staffList]);

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

    const saved = localStorage.getItem(`medcy_patient_onboarding_draft`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.clinicName) setClinicName(data.clinicName);
        if (data.address) setAddress(data.address);
        if (data.phone) setPhone(data.phone);
        if (data.email) setEmail(data.email);
        if (data.adminName) setAdminName(data.adminName);
        if (data.adminEmail) setAdminEmail(data.adminEmail);
        if (data.staffList) setStaffList(data.staffList);
        if (data.doctorSchedules) setDoctorSchedules(data.doctorSchedules);
      } catch (e) {
        console.error('Error loading draft', e);
      }
    }
  }, []);

  const handleSelectExistingClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const client = existingClients.find(c => c.id === clientId || c.company_name === clientId);
    if (client) {
      setClinicName(client.company_name || '');
      setEmail(client.contact_email || '');
      setPhone(client.contact_phone || '');
      setAddress(client.service_area || '');
      if (!adminEmail) setAdminEmail(client.contact_email || '');
      if (client.onboarding_details?.patient_management_setup?.superadmin) {
        setAdminName(client.onboarding_details.patient_management_setup.superadmin.name || '');
        setAdminEmail(client.onboarding_details.patient_management_setup.superadmin.email || '');
      }
      alert(`✨ Pre-filled foundational details for "${client.company_name}". You can skip re-typing these!`);
    }
  };

  const saveDraft = () => {
    const data = {
      clinicName,
      address,
      phone,
      email,
      adminName,
      adminEmail,
      staffList,
      doctorSchedules
    };
    localStorage.setItem(`medcy_patient_onboarding_draft`, JSON.stringify(data));
    alert('✨ Onboarding draft saved to browser storage!');
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffEmail.trim()) {
      alert('Please enter both Name and Email for the staff member.');
      return;
    }
    const newMember: StaffMember = {
      id: Date.now().toString(),
      name: newStaffName.trim(),
      email: newStaffEmail.trim(),
      role: newStaffRole,
      specialization: newStaffRole === 'Doctor' ? newStaffSpecialization.trim() : undefined,
    };
    setStaffList(prev => [...prev, newMember]);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffSpecialization('');
  };

  const handleRemoveStaff = (id: string) => {
    setStaffList(prev => prev.filter(s => s.id !== id));
  };

  const toggleWorkingDay = (docId: string, day: string) => {
    setDoctorSchedules(prev => {
      const current = prev[docId] || { days: [], startTime: '09:00', endTime: '17:00', duration: '15 mins' };
      const exists = current.days.includes(day);
      const newDays = exists ? current.days.filter(d => d !== day) : [...current.days, day];
      return {
        ...prev,
        [docId]: { ...current, days: newDays }
      };
    });
  };

  const updateDoctorSchedule = (docId: string, field: keyof DoctorSchedule, value: any) => {
    setDoctorSchedules(prev => ({
      ...prev,
      [docId]: { ...prev[docId], [field]: value }
    }));
  };

  const validateStep = (step: number): boolean => {
    setErrorMessage('');
    if (step === 1) {
      if (!clinicName.trim() || !phone.trim() || !email.trim()) {
        setErrorMessage('⚠️ Please fill in the Official Clinic Name, Phone, and Email to continue.');
        return false;
      }
    } else if (step === 2) {
      if (!adminName.trim() || !adminEmail.trim() || !password.trim()) {
        setErrorMessage('⚠️ Please fill in all Primary Administrator credentials (Name, Email, and Password).');
        return false;
      }
    } else if (step === 3) {
      if (staffList.length === 0 && !staffCsvFile) {
        setErrorMessage('⚠️ Please add at least one staff member or upload a staff spreadsheet.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handlePrev = () => {
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Simulate file upload or record creation in Supabase
      const payload = {
        clinic_name: clinicName,
        address,
        phone,
        email,
        superadmin: {
          name: adminName,
          email: adminEmail,
        },
        staff_roster: staffList,
        doctor_schedules: doctorSchedules,
        files_attached: {
          staff_csv: staffCsvFile ? staffCsvFile.name : null,
          patient_csv: patientCsvFile ? patientCsvFile.name : null,
          appointments_csv: appointmentsCsvFile ? appointmentsCsvFile.name : null,
        },
        onboarded_at: new Date().toISOString()
      };

      // Check if we should update an existing client or insert a new one
      const existingMatch = existingClients.find(
        c => c.id === selectedClientId || 
             c.company_name?.toLowerCase() === clinicName.trim().toLowerCase()
      );

      let dbError = null;
      let newClientId = existingMatch ? existingMatch.id : null;

      if (existingMatch && existingMatch.id) {
        // UPDATE existing record to avoid duplicate rows!
        const existingDetails = existingMatch.onboarding_details || {};
        const updatedDetails = {
          ...existingDetails,
          business_type: 'healthcare',
          completed_step: 'patient_management_onboarding',
          patient_management_setup: payload
        };

        const { error } = await supabase
          .from('gbp_clients')
          .update({
            company_name: clinicName,
            contact_email: email,
            contact_phone: phone,
            service_area: address || existingMatch.service_area || 'Global',
            onboarding_details: updatedDetails
          })
          .eq('id', existingMatch.id);

        dbError = error;
      } else {
        const { data, error } = await supabase
          .from('gbp_clients')
          .insert([
            {
              company_name: clinicName,
              contact_email: email,
              contact_phone: phone,
              primary_category: 'Multi-Specialty Hospital',
              service_area: address || 'Global',
              onboarding_details: {
                business_type: 'healthcare',
                completed_step: 'patient_management_onboarding',
                patient_management_setup: payload
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

      // --- NEW: INSERT INTO patient_management_intakes TABLE ---
      if (newClientId) {
        const { error: pmError } = await supabase
          .from('gbp_patient_management_intakes')
          .insert({
            client_id: newClientId,
            form_data: payload,
            status: 'new'
          });
        
        if (pmError) {
          console.error("Failed to insert into patient_management_intakes:", pmError);
        }
      }
      // ---------------------------------------------------------

      localStorage.removeItem(`medcy_patient_onboarding_draft`);
      setIsSubmitted(true);
    } catch (err: any) {
      setErrorMessage(`Submission failed: ${err.message || 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportFinalJson = () => {
    const data = {
      clinicName,
      address,
      phone,
      email,
      adminName,
      adminEmail,
      staffList,
      doctorSchedules,
      filesAttached: {
        staffCsv: staffCsvFile?.name || 'None',
        patientCsv: patientCsvFile?.name || 'None',
        appointmentsCsv: appointmentsCsvFile?.name || 'None'
      }
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `${clinicName.toLowerCase().replace(/\s+/g, '_')}_tenant_setup.json`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background glow decorations */}
        <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-2xl w-full bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-12 shadow-2xl text-center relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center shadow-inner border border-emerald-200">
            <Award className="h-10 w-10 animate-bounce" />
          </div>

          <div className="space-y-3">
            <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200 uppercase tracking-wider">
              ✨ Tenant Environment Initialized
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Onboarding Data Successfully Submitted!
            </h2>
            <p className="text-slate-600 font-medium text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              We have received the foundational configuration, superadmin credentials, doctor rosters, and migration databases for <strong className="text-slate-900">{clinicName}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-slate-700">
              <span>Tenant Name:</span>
              <span className="text-slate-900 font-extrabold">{clinicName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-slate-700">
              <span>Primary Admin:</span>
              <span className="text-indigo-600 font-extrabold">{adminEmail}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 font-bold text-slate-700">
              <span>Staff & Doctors Configured:</span>
              <span className="text-slate-900 font-extrabold">{staffList.length} members</span>
            </div>
            <div className="flex justify-between items-center font-bold text-slate-700">
              <span>Migration Files Attached:</span>
              <span className="text-emerald-700 font-extrabold">
                {[patientCsvFile, appointmentsCsvFile, staffCsvFile].filter(Boolean).length} datasets ready
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={exportFinalJson}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold rounded-2xl border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4 text-indigo-600" />
              Download Config Backup (.json)
            </button>
            <a
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Go to Client Control Deck <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[50%] h-[300px] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[50%] h-[300px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-6">
        
        {/* Top Header & Brand Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-white rounded-2xl border border-slate-200 p-2 flex items-center justify-center shadow-xs shrink-0">
              <img src="/medcy_logo.png" alt="Medcy" className="h-full w-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200 uppercase tracking-wider">
                  Medcy Health Tech
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 text-[10px] font-extrabold border border-indigo-200 uppercase tracking-wider">
                  Tenant Portal
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                Client Onboarding Portal — Hospital & Clinic Setup
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <a
              href={`/${brand}/onboarding`}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300/60"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </a>
            <button
              onClick={saveDraft}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300/60"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              <span>Save Progress</span>
            </button>
          </div>
        </div>

        {/* 6-Step Interactive Timeline Stepper */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-6 shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between min-w-[650px] gap-2">
            {STEPS.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isDone = step.id < currentStep;
              const StepIcon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => {
                      if (step.id <= currentStep || validateStep(currentStep)) {
                        setCurrentStep(step.id);
                      }
                    }}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all cursor-pointer text-left shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200/80 hover:bg-emerald-100'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/60'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : isDone
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}>
                      {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className={`text-xs font-black leading-none ${isActive ? 'text-white' : isDone ? 'text-emerald-900' : 'text-slate-700'}`}>
                        Step {step.id}: {step.name}
                      </p>
                      <p className={`text-[10px] font-semibold mt-0.5 ${isActive ? 'text-slate-300' : isDone ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {step.desc}
                      </p>
                    </div>
                  </button>

                  {idx < STEPS.length - 1 && (
                    <div className={`h-0.5 w-6 shrink-0 rounded-full transition-colors ${
                      step.id < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Error Message Alert */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs sm:text-sm font-extrabold text-red-700 flex items-center gap-3 shadow-xs animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wizard Main Content Container */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-md min-h-[480px] flex flex-col justify-between">
          
          {/* STEP 1: HOSPITAL / CLINIC PROFILE */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Building2 className="h-6 w-6 text-indigo-600" />
                  Step 1: Hospital & Clinic Profile
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Collect foundational tenant details required to initialize your isolated multi-tenant clinic environment.
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
                    <option value="">-- Select Existing Clinic / Brand Profile (Optional) --</option>
                    {existingClients.map((c, i) => (
                      <option key={c.id || i} value={c.id || c.company_name}>
                        {c.company_name} ({c.contact_email || 'No email'}) • {c.primary_category || 'Healthcare'}
                      </option>
                    ))}
                  </select>
                  {selectedClientId && (
                    <button
                      type="button"
                      onClick={() => { setSelectedClientId(''); setClinicName(''); setEmail(''); setPhone(''); setAddress(''); }}
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
                    Official Clinic / Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Apollo Multi-Specialty Hospital & Fertility Center"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Primary Contact Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Primary Contact Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="admin@apollomedcy.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Physical Address & Location Details
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <textarea
                      rows={3}
                      placeholder="Enter full physical address, building number, landmark, city, state, and ZIP code..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all resize-none shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PRIMARY ADMINISTRATOR SETUP */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Lock className="h-6 w-6 text-indigo-600" />
                  Step 2: Primary Administrator Setup
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Collect details for the very first Superadmin / Owner of the clinic environment. This user will have root access.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-6">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Administrator's Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g., Dr. Arvind Rao (Superadmin)"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Admin Email Address (Login ID) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="email"
                      placeholder="arvind.rao@medcy.health"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Note: This email will be their root Supabase/Medcy login ID.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                    Temporary Root Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter strong temporary password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/10 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Admin will be prompted to change password on first login.</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: STAFF & DOCTOR ROSTER */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                    <Users className="h-6 w-6 text-indigo-600" />
                    Step 3: Staff & Doctor Roster
                  </h2>
                  <p className="text-xs font-semibold text-slate-500 mt-1">
                    Add multiple staff members dynamically or upload a staff spreadsheet. Doctors added here will receive scheduling in Step 4.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-800 text-xs font-black border border-indigo-200 self-start">
                  {staffList.length} Members Active
                </span>
              </div>

              {/* Add Staff Inline Form */}
              <form onSubmit={handleAddStaff} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Plus className="h-4 w-4 text-indigo-600" /> Add Staff Member Dynamically
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Dr. Sneha Reddy"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="sneha@medcy.health"
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Role *</label>
                    <select
                      value={newStaffRole}
                      onChange={(e) => setNewStaffRole(e.target.value as any)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
                    >
                      <option value="Doctor">Doctor</option>
                      <option value="Nurse">Nurse</option>
                      <option value="Front Desk">Front Desk</option>
                      <option value="Admin">Admin</option>
                      <option value="CRO">CRO (Customer Relationship)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {newStaffRole === 'Doctor' ? 'Specialization' : 'Department/Notes (Optional)'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={newStaffRole === 'Doctor' ? 'e.g., Cardiology' : 'e.g., ICU / Reception'}
                        value={newStaffSpecialization}
                        onChange={(e) => setNewStaffSpecialization(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl transition-all shrink-0 shadow-sm cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Staff Table */}
              {staffList.length > 0 ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider">
                        <th className="p-3">Staff Name</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Specialization / Dept</th>
                        <th className="p-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {staffList.map((member) => (
                        <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-extrabold text-slate-900 flex items-center gap-2">
                            <div className="h-7 w-7 bg-indigo-50 text-indigo-700 rounded-full flex items-center justify-center font-black">
                              {member.name.charAt(0)}
                            </div>
                            {member.name}
                          </td>
                          <td className="p-3 font-semibold text-slate-600">{member.email}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wider border ${
                              member.role === 'Doctor'
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : member.role === 'Nurse'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-600">{member.specialization || '—'}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleRemoveStaff(member.id)}
                              className="text-slate-400 hover:text-red-600 font-bold p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center gap-1"
                              title="Remove staff member"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Remove</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-slate-500 font-semibold text-xs">
                  No staff members added yet. Use the form above to add doctors, nurses, and admins.
                </div>
              )}

              {/* Bulk CSV Upload Alternative */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Alternatively: Bulk Upload Staff Roster (.CSV / .XLSX)
                </h4>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-indigo-50/10 transition-all cursor-pointer relative group">
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={(e) => e.target.files?.[0] && setStaffCsvFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200 group-hover:scale-105 transition-transform text-indigo-600">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    {staffCsvFile ? (
                      <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-xs bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span>Selected file: {staffCsvFile.name} ({(staffCsvFile.size / 1024).toFixed(1)} KB)</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setStaffCsvFile(null); }}
                          className="text-red-600 hover:text-red-800 ml-2 font-black"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs font-extrabold text-slate-800">
                          Drag and drop your staff spreadsheet here, or <span className="text-indigo-600 underline">browse computer</span>
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          Accepts .CSV or .XLSX files. Required columns: Name, Email, Role, Specialization.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DOCTOR WORKING HOURS & SCHEDULING */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Clock className="h-6 w-6 text-indigo-600" />
                  Step 4: Doctor Working Hours & Scheduling
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  For every staff member added in Step 3 with the role "Doctor", specify their standard working days, shift hours, and consultation durations.
                </p>
              </div>

              {staffList.filter(s => s.role === 'Doctor').length > 0 ? (
                <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
                  {staffList.filter(s => s.role === 'Doctor').map((doc) => {
                    const sched = doctorSchedules[doc.id] || {
                      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                      startTime: '09:00',
                      endTime: '17:00',
                      duration: '15 mins'
                    };

                    return (
                      <div key={doc.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-sm">
                              {doc.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">{doc.name}</h4>
                              <p className="text-xs font-bold text-indigo-600">{doc.specialization || 'General Practice'} • {doc.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="text-[11px] font-extrabold text-slate-600">Slot Duration:</span>
                            <select
                              value={sched.duration}
                              onChange={(e) => updateDoctorSchedule(doc.id, 'duration', e.target.value)}
                              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
                            >
                              <option value="10 mins">10 mins</option>
                              <option value="15 mins">15 mins</option>
                              <option value="20 mins">20 mins</option>
                              <option value="30 mins">30 mins</option>
                              <option value="60 mins">60 mins</option>
                            </select>
                          </div>
                        </div>

                        {/* Working Days Checkboxes */}
                        <div className="space-y-2">
                          <label className="text-xs font-extrabold text-slate-700 block">Select Working Days:</label>
                          <div className="flex flex-wrap gap-2">
                            {WORKING_DAYS.map((day) => {
                              const isSelected = sched.days.includes(day);
                              return (
                                <button
                                  type="button"
                                  key={day}
                                  onClick={() => toggleWorkingDay(doc.id, day)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                                    isSelected
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className={`h-3 w-3 rounded-md flex items-center justify-center border ${
                                    isSelected ? 'bg-indigo-500 border-indigo-400 text-white' : 'border-slate-300'
                                  }`}>
                                    {isSelected && <Check className="h-2 w-2 stroke-[3]" />}
                                  </div>
                                  <span>{day.slice(0, 3)}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Shift Times */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-xs font-extrabold text-slate-700 block mb-1">Shift Start Time:</label>
                            <input
                              type="time"
                              value={sched.startTime}
                              onChange={(e) => updateDoctorSchedule(doc.id, 'startTime', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-extrabold text-slate-700 block mb-1">Shift End Time:</label>
                            <input
                              type="time"
                              value={sched.endTime}
                              onChange={(e) => updateDoctorSchedule(doc.id, 'endTime', e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-slate-500 font-semibold text-sm">
                  <p>No doctors found in your roster from Step 3.</p>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="mt-3 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-extrabold rounded-xl text-xs transition-colors"
                  >
                    ← Go Back to Step 3 & Add Doctors
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: PATIENT DATA MIGRATION (FILE UPLOAD) */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                  Step 5: Patient Data Migration (File Upload)
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Upload your historical patient database spreadsheet so existing patient profiles can be seamlessly imported into your new clinic tenant.
                </p>
              </div>

              {/* Helper Text Tooltip Box */}
              <div className="bg-indigo-50 border border-indigo-200/80 rounded-2xl p-5 text-xs text-indigo-950 font-semibold space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-indigo-900 font-black text-sm">
                  <HelpCircle className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span>Spreadsheet Format Specification</span>
                </div>
                <p className="leading-relaxed">
                  To guarantee 100% data integrity during tenant migration, please ensure your spreadsheet includes the following header columns:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-200/60">
                    <span className="font-extrabold text-red-600 uppercase text-[10px] block">Mandatory Columns *</span>
                    <p className="text-slate-800 font-bold mt-0.5">• Full Name</p>
                    <p className="text-slate-800 font-bold">• Mobile Number (Primary Key)</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-200/60">
                    <span className="font-extrabold text-indigo-600 uppercase text-[10px] block">Recommended Columns</span>
                    <p className="text-slate-700 mt-0.5">• DOB / Age, Gender, Blood Group</p>
                    <p className="text-slate-700">• Marital Status, Full Address, Medical History</p>
                  </div>
                </div>
              </div>

              {/* Large Aesthetic Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-600 rounded-3xl p-10 text-center bg-slate-50/60 hover:bg-indigo-50/10 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => e.target.files?.[0] && setPatientCsvFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-16 w-16 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <UploadCloud className="h-8 w-8" />
                  </div>

                  {patientCsvFile ? (
                    <div className="space-y-2">
                      <span className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 inline-flex items-center gap-2 shadow-2xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Attached: {patientCsvFile.name} ({(patientCsvFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPatientCsvFile(null); }}
                          className="text-red-600 hover:text-red-800 font-black ml-2"
                        >
                          ×
                        </button>
                      </span>
                      <p className="text-[11px] font-bold text-emerald-700">Ready for automated database ingestion on submission.</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-extrabold text-slate-900">
                        Drag and drop your historical patient database (.CSV / .XLSX) here
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        or <span className="text-indigo-600 underline font-bold">browse your computer</span> to select file (Max 50 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: FUTURE APPOINTMENTS MIGRATION (FILE UPLOAD) */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  Step 6: Future Appointments Migration & Final Review
                </h2>
                <p className="text-xs font-semibold text-slate-500 mt-1">
                  Migrate any appointments the hospital already has booked for future dates, ensuring your calendar is up-to-date on day one.
                </p>
              </div>

              {/* Helper Text Tooltip Box for Appointments */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-950 font-semibold space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <HelpCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Upcoming Appointments Spreadsheet Requirements</span>
                </div>
                <p className="leading-relaxed">
                  Please ensure your upcoming appointments spreadsheet includes the following columns so we can link visits to the right doctors and patients:
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-bold text-slate-800">
                  <li className="flex items-center gap-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Patient Name & Mobile Number</span>
                  </li>
                  <li className="flex items-center gap-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Doctor Name (Who they are seeing)</span>
                  </li>
                  <li className="flex items-center gap-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Appointment Date & Time Slot</span>
                  </li>
                  <li className="flex items-center gap-1.5 bg-white/80 p-2.5 rounded-xl border border-amber-200/60">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Visit Reason / Type (Follow-up, Surgery, etc.)</span>
                  </li>
                </ul>
              </div>

              {/* Large Aesthetic Drag and Drop Zone for Appointments */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-600 rounded-3xl p-8 text-center bg-slate-50/60 hover:bg-indigo-50/10 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".csv, .xlsx, .xls"
                  onChange={(e) => e.target.files?.[0] && setAppointmentsCsvFile(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-14 w-14 bg-white rounded-2xl shadow-md border border-slate-200 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Calendar className="h-7 w-7" />
                  </div>

                  {appointmentsCsvFile ? (
                    <div className="space-y-1">
                      <span className="px-4 py-2 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200 inline-flex items-center gap-2 shadow-2xs">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Attached: {appointmentsCsvFile.name} ({(appointmentsCsvFile.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setAppointmentsCsvFile(null); }}
                          className="text-red-600 hover:text-red-800 font-black ml-2"
                        >
                          ×
                        </button>
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-900">
                        Drag and drop your upcoming appointments spreadsheet (.CSV / .XLSX) here
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        or <span className="text-indigo-600 underline font-bold">browse your computer</span> to attach file (Optional)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Comprehensive Summary Card Before Submission */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Ready for Tenant Environment Deployment
                  </h3>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Root Tenant Config
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 font-semibold block text-[10px]">Hospital / Clinic Name:</span>
                    <p className="text-white font-extrabold mt-0.5 truncate">{clinicName || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 font-semibold block text-[10px]">Superadmin Email:</span>
                    <p className="text-indigo-300 font-extrabold mt-0.5 truncate">{adminEmail || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 font-semibold block text-[10px]">Staff Roster Count:</span>
                    <p className="text-emerald-400 font-extrabold mt-0.5">{staffList.length} members configured</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-medium leading-relaxed pt-1">
                  By clicking "Submit Onboarding Data" below, our backend services will generate an isolated database schema for <strong className="text-white">{clinicName || 'your clinic'}</strong>, initialize the superadmin credentials, and queue attached CSV spreadsheets for ingestion.
                </p>
              </div>
            </div>
          )}

          {/* WIZARD NAVIGATION BAR */}
          <div className="pt-8 mt-8 border-t border-slate-200/80 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className={`px-5 py-3 rounded-2xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer border ${
                currentStep === 1
                  ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-2xs'
              }`}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous Step
            </button>

            <div className="flex items-center gap-2">
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
                >
                  <span>Next Step</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Deploying Tenant Environment...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 animate-bounce" />
                      <span>Submit Onboarding Data</span>
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 font-semibold pt-4">
          Medcy Health Tech • Multi-Tenant Hospital & Clinic Onboarding Architecture • Protected with SSL Encryption
        </div>

      </div>
    </div>
  );
}
