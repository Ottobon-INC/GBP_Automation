import React from 'react';
import { notFound } from 'next/navigation';
import OnboardingTypeSelector from '@/components/onboarding/OnboardingTypeSelector';

interface PageProps {
  params: {
    brand: string;
  };
}

export default async function BrandOnboardingHub({ params }: PageProps) {
  // Await the params to resolve them safely for Server Components in Next.js 15+
  const { brand } = await Promise.resolve(params);

  if (brand !== 'medcy') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle light background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <OnboardingTypeSelector brand={brand} />
    </div>
  );
}
