"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const OttobonWebsiteWizard = dynamic(() => import('@/components/ottobon/OttobonWebsiteWizard'), { ssr: false });
const OttobonWhatsAppWizard = dynamic(() => import('@/components/ottobon/OttobonWhatsAppWizard'), { ssr: false });
const OttobonGbpWizard = dynamic(() => import('@/components/ottobon/OttobonGbpWizard'), { ssr: false });

export default function OttobonWizardDynamicRenderer({ type }: { type: string }) {
  if (type === 'gbp') return <OttobonGbpWizard />;
  if (type === 'website') return <OttobonWebsiteWizard />;
  if (type === 'whatsapp_automation') return <OttobonWhatsAppWizard />;

  return null;
}
