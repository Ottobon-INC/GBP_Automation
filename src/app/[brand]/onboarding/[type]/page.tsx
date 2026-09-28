import React from 'react';
import { notFound } from 'next/navigation';
import WizardDynamicRenderer from './WizardDynamicRenderer';

interface PageProps {
  params: {
    brand: string;
    type: string;
  };
}

export default async function WizardRouter({ params }: PageProps) {
  const { brand, type } = await Promise.resolve(params);

  if (brand !== 'medcy' && brand !== 'ottobon') {
    notFound();
  }

  return <WizardDynamicRenderer brand={brand} type={type} />;
}
