import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { FeatureIntro } from '../../components/FeatureIntro';

export function CommunityChallengesListPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const role = me.data?.role === 'facilitator' || me.data?.role === 'admin' ? 'facilitator' : 'user';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Challenges</h2>
      <FeatureIntro
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
          </svg>
        }
        title={role === 'facilitator' ? 'Launch challenges' : 'Apply to challenges'}
        description={
          role === 'facilitator'
            ? 'Launch challenges to find the right partners and drive innovation in your ecosystem.'
            : 'Apply to challenges and showcase your capabilities to potential partners and clients.'
        }
      />
    </div>
  );
}
