import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { FeatureIntro } from '../../components/FeatureIntro';

export function OrgRelationsPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const role = me.data?.role === 'facilitator' || me.data?.role === 'admin' ? 'facilitator' : 'user';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Relations</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your supply chain connections</p>
      </div>

      <FeatureIntro
        icon={
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
        }
        title={role === 'facilitator' ? 'Track connections between organizations' : 'Build your supply chain'}
        description={
          role === 'facilitator'
            ? 'Monitor and visualize the network of relations between organizations in your ecosystem.'
            : 'Connect with partners, suppliers, and clients to build your circular textile supply chain.'
        }
      />
    </div>
  );
}
