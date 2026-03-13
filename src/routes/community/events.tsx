import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { FeatureIntro } from '../../components/FeatureIntro';

export function CommunityEventsListPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const role = me.data?.role === 'facilitator' || me.data?.role === 'admin' ? 'facilitator' : 'user';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Events</h2>
      <FeatureIntro
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
        }
        title={role === 'facilitator' ? 'Create events' : 'Attend events'}
        description={
          role === 'facilitator'
            ? 'Organize events to bring community members together — workshops, meetups, webinars.'
            : 'Attend events organized by your community to learn, network, and collaborate.'
        }
      />
    </div>
  );
}
