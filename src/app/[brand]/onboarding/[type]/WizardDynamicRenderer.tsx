"use client";

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import wizards with SSR disabled inside a Client Component
const WebsiteOnboardingWizard = dynamic(() => import('@/components/onboarding/WebsiteOnboardingWizard'), { ssr: false });
const PatientManagementOnboardingWizard = dynamic(() => import('@/components/onboarding/PatientManagementOnboardingWizard'), { ssr: false });
const WhatsAppAutomationOnboardingWizard = dynamic(() => import('@/components/onboarding/WhatsAppAutomationOnboardingWizard'), { ssr: false });
const ClientOnboardingFormContent = dynamic(() => import('./GbpWizardWrapper'), { ssr: false });

export default function WizardDynamicRenderer({ brand, type }: { brand: string; type: string }) {
  if (type === 'gbp') return <ClientOnboardingFormContent brand={brand} />;
  if (type === 'website') return <WebsiteOnboardingWizard brand={brand} />;
  if (type === 'patient_management') return <PatientManagementOnboardingWizard brand={brand} />;
  if (type === 'whatsapp_automation') return <WhatsAppAutomationOnboardingWizard brand={brand} />;
  
  return null;
}
