import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { FeatureIntro } from '../../components/FeatureIntro';

export function OrgAssessmentsPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const role = me.data?.role === 'facilitator' || me.data?.role === 'admin' ? 'facilitator' : 'user';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Impact Compass</h1>
        <p className="text-sm text-gray-500 mt-1">Assess your sustainability performance</p>
      </div>

      <FeatureIntro
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        }
        title={role === 'facilitator' ? 'Monitor assessment completion' : 'Measure your circularity'}
        description={
          role === 'facilitator'
            ? 'Track how organizations in your ecosystem are progressing on their sustainability assessments.'
            : 'Complete the Impact Compass to evaluate your circularity, eco-design, and social responsibility practices.'
        }
      />
    </div>
  );
}
