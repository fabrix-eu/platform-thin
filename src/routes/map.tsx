import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations, ORG_KINDS } from '../lib/organizations';
import { OrganizationsMap } from '../components/OrganizationsMap';
import { MapLegend } from '../components/MapLegend';

const ALL_KINDS = Object.keys(ORG_KINDS);

export function MapPage() {
  const [selectedKinds, setSelectedKinds] = useState<string[]>(ALL_KINDS);

  const query = useQuery({
    queryKey: ['organizations', 'map'],
    queryFn: () => getOrganizations({ per_page: 1000 }),
  });

  return (
    <div className="relative" style={{ height: 'calc(100vh - 57px)' }}>
      {query.isLoading && (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading map...
        </div>
      )}
      {query.error && (
        <div className="flex items-center justify-center h-full text-destructive">
          Failed to load organizations
        </div>
      )}
      {query.data && (
        <>
          <MapLegend selectedKinds={selectedKinds} onKindsChange={setSelectedKinds} />
          <OrganizationsMap
            organizations={query.data.organizations}
            selectedKinds={selectedKinds}
            height="100%"
          />
        </>
      )}
    </div>
  );
}
