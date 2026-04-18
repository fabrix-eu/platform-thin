import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';

export function CommunityMatchmakingPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const role = me.data?.role === 'facilitator' || me.data?.role === 'admin' ? 'facilitator' : 'user';
  const info = useFeatureInfo('matchmaking');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-display font-bold text-gray-900">Matchmaking</h2>
        <FeatureInfoTrigger info={info} />
      </div>
      <FeatureIntro
        info={info}
        title={role === 'facilitator' ? 'Facilitate connections' : 'Find partners'}
        description={
          role === 'facilitator'
            ? 'Help organizations connect with the right match based on their profiles and needs.'
            : 'Find complementary partners based on your profile, capabilities, and supply chain needs.'
        }
      />
      <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
        <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
        </svg>
        <p className="text-sm text-gray-400 mt-2">Coming soon.</p>
      </div>
    </div>
  );
}
