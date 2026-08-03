import React from 'react';
import { notFound } from 'next/navigation';
import WebsiteOnboardingWizard from '@/components/onboarding/WebsiteOnboardingWizard';
import PatientManagementOnboardingWizard from '@/components/onboarding/PatientManagementOnboardingWizard';
import WhatsAppAutomationOnboardingWizard from '@/components/onboarding/WhatsAppAutomationOnboardingWizard';
import ClientOnboardingFormContent from './GbpWizardWrapper'; // We will extract the GBP wizard here

interface PageProps {
  params: {
    brand: string;
    type: string;
  };
}

export default async function WizardRouter({ params }: PageProps) {
  const { brand, type } = await Promise.resolve(params);

  if (brand !== 'medcy') {
    notFound();
  }

  // Medcy Specific Routes
  if (brand === 'medcy') {
    if (type === 'gbp') return <ClientOnboardingFormContent brand={brand} />;
    if (type === 'website') return <WebsiteOnboardingWizard brand={brand} />;
    if (type === 'patient_management') return <PatientManagementOnboardingWizard brand={brand} />;
    if (type === 'whatsapp_automation') return <WhatsAppAutomationOnboardingWizard brand={brand} />;
  }

  notFound();
}
