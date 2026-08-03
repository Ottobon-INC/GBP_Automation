import React from 'react';
import { notFound } from 'next/navigation';
import OttobonWebsiteWizard from '@/components/ottobon/OttobonWebsiteWizard';
import OttobonWhatsAppWizard from '@/components/ottobon/OttobonWhatsAppWizard';
import OttobonGbpWizard from '@/components/ottobon/OttobonGbpWizard';

interface PageProps {
  params: {
    type: string;
  };
}

export default async function OttobonWizardRouter({ params }: PageProps) {
  const { type } = await Promise.resolve(params);

  if (type === 'gbp') return <OttobonGbpWizard />;
  if (type === 'website') return <OttobonWebsiteWizard />;
  if (type === 'whatsapp_automation') return <OttobonWhatsAppWizard />;

  notFound();
}
