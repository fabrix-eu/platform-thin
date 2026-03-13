import type { ReactNode } from 'react';
import { Link } from '@tanstack/react-router';

interface FeatureIntroProps {
  icon: ReactNode;
  title: string;
  description: string;
  cta?: { label: string; to: string };
}

export function FeatureIntro({ icon, title, description, cta }: FeatureIntroProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
      <div className="flex justify-center text-gray-400">{icon}</div>
      <h3 className="font-display font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto">{description}</p>
      {cta && (
        <Link to={cta.to} className="inline-block text-sm text-primary hover:underline mt-1">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
