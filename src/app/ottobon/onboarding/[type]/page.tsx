import React from 'react';
import { notFound } from 'next/navigation';
import OttobonWizardDynamicRenderer from './OttobonWizardDynamicRenderer';

interface PageProps {
  params: {
    type: string;
  };
}

export default async function OttobonWizardRouter({ params }: PageProps) {
  const { type } = await Promise.resolve(params);

  if (['gbp', 'website', 'whatsapp_automation'].includes(type)) {
    return <OttobonWizardDynamicRenderer type={type} />;
  }

  notFound();
}
